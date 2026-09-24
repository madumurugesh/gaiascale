"""
Gaia-HAT: Hybrid Attention Transformer for Satellite Super-Resolution
Architecture based on HAT (Chen et al., CVPR 2023), adapted for 4-band multispectral
Sentinel-2 imagery [B04 (Red), B03 (Green), B02 (Blue), B08 (NIR)].

Key architectural components (see ARCHITECTURE.md for full detail):
1. Spatial Self-Attention (W-MSA / SW-MSA): Resolves complex geometric boundaries, roads, building outlines.
2. Channel Attention Block (CAB): Interleaved spectral cross-band modulation. Preserves spectral indices (NDVI, NDWI).
3. Overlapping Cross-Attention Block (OCAB): Named after the HAT paper's design; see ARCHITECTURE.md's
   "Known Limitations" section for how this implementation differs from true overlapping attention.
4. Residual Hybrid Attention Group (RHAG): Deep residual feature hierarchy.
5. Bicubic Skip + Dual Prediction Head: 4-band 2.5 m reflectances + per-pixel aleatoric uncertainty (Laplace NLL).
"""

from __future__ import annotations

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
def up_bicubic(x: torch.Tensor, s: int = 4) -> torch.Tensor:
    return F.interpolate(x, scale_factor=s, mode="bicubic", align_corners=False)

def window_partition(x: torch.Tensor, window_size: int) -> torch.Tensor:
    """x: (B, H, W, C) -> (num_windows*B, window_size, window_size, C)"""
    B, H, W, C = x.shape
    x = x.view(B, H // window_size, window_size, W // window_size, window_size, C)
    windows = x.permute(0, 1, 3, 2, 4, 5).contiguous().view(-1, window_size, window_size, C)
    return windows


def window_reverse(windows: torch.Tensor, window_size: int, H: int, W: int) -> torch.Tensor:
    """windows: (num_windows*B, window_size, window_size, C) -> (B, H, W, C)"""
    B = int(windows.shape[0] / (H * W / window_size / window_size))
    x = windows.view(B, H // window_size, W // window_size, window_size, window_size, -1)
    x = x.permute(0, 1, 3, 2, 4, 5).contiguous().view(B, H, W, -1)
    return x


class ChannelAttention(nn.Module):
    """Squeeze-and-Excitation Spectral Channel Attention."""
    def __init__(self, dim: int, reduction: int = 4):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.conv_du = nn.Sequential(
            nn.Conv2d(dim, dim // reduction, 1, padding=0, bias=True),
            nn.ReLU(inplace=True),
            nn.Conv2d(dim // reduction, dim, 1, padding=0, bias=True),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, C, H, W)
        w = self.conv_du(self.avg_pool(x))
        return x * w


class ChannelAttentionBlock(nn.Module):
    """Channel Attention Block (CAB) to capture inter-band spectral correlation."""
    def __init__(self, dim: int, reduction: int = 4):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(dim, dim, 3, 1, 1),
            nn.GELU(),
            nn.Conv2d(dim, dim, 3, 1, 1),
            ChannelAttention(dim, reduction=reduction)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.body(x)


class Mlp(nn.Module):
    def __init__(self, in_features: int, hidden_features: int | None = None,
                 out_features: int | None = None, drop: float = 0.0):
        super().__init__()
        out_features = out_features or in_features
        hidden_features = hidden_features or in_features
        self.fc1 = nn.Linear(in_features, hidden_features)
        self.act = nn.GELU()
        self.fc2 = nn.Linear(hidden_features, out_features)
        self.drop = nn.Dropout(drop)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.drop(self.fc2(self.drop(self.act(self.fc1(x)))))


class WindowAttention(nn.Module):
    def __init__(self, dim: int, window_size: tuple[int, int], num_heads: int,
                  qkv_bias: bool = True, qk_scale: float | None = None,
                  attn_drop: float = 0.0, proj_drop: float = 0.0):
        super().__init__()
        self.dim = dim
        self.window_size = window_size
        self.num_heads = num_heads
        head_dim = dim // num_heads
        self.scale = qk_scale or head_dim**-0.5

        # Relative position bias table
        self.relative_position_bias_table = nn.Parameter(
            torch.zeros((2 * window_size[0] - 1) * (2 * window_size[1] - 1), num_heads)
        )
        nn.init.trunc_normal_(self.relative_position_bias_table, std=0.02)

        coords_h = torch.arange(self.window_size[0])
        coords_w = torch.arange(self.window_size[1])
        coords = torch.stack(torch.meshgrid([coords_h, coords_w], indexing="ij"))
        coords_flatten = torch.flatten(coords, 1)
        relative_coords = coords_flatten[:, :, None] - coords_flatten[:, None, :]
        relative_coords = relative_coords.permute(1, 2, 0).contiguous()
        relative_coords[:, :, 0] += self.window_size[0] - 1
        relative_coords[:, :, 1] += self.window_size[1] - 1
        relative_coords[:, :, 0] *= 2 * self.window_size[1] - 1
        relative_position_index = relative_coords.sum(-1)
        self.register_buffer("relative_position_index", relative_position_index)

        self.qkv = nn.Linear(dim, dim * 3, bias=qkv_bias)
        self.attn_drop = nn.Dropout(attn_drop)
        self.proj = nn.Linear(dim, dim)
        self.proj_drop = nn.Dropout(proj_drop)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B_, N, C = x.shape
        qkv = self.qkv(x).reshape(B_, N, 3, self.num_heads, C // self.num_heads).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]

        q = q * self.scale
        attn = (q @ k.transpose(-2, -1))

        relative_position_bias = self.relative_position_bias_table[self.relative_position_index.view(-1)].view(
            self.window_size[0] * self.window_size[1], self.window_size[0] * self.window_size[1], -1
        )
        relative_position_bias = relative_position_bias.permute(2, 0, 1).contiguous()
        attn = attn + relative_position_bias.unsqueeze(0)

        attn = F.softmax(attn, dim=-1)
        attn = self.attn_drop(attn)
        x = (attn @ v).transpose(1, 2).reshape(B_, N, C)
        return self.proj_drop(self.proj(x))


class HybridAttentionBlock(nn.Module):
    """
    Hybrid Attention Block (HAB):
    Fuses spatial Window Multi-head Self-Attention (W-MSA) with Channel Attention Block (CAB).
    """
    def __init__(self, dim: int, num_heads: int, window_size: int = 8, shift_size: int = 0,
                 mlp_ratio: float = 2.0, drop: float = 0.0, attn_drop: float = 0.0):
        super().__init__()
        self.dim = dim
        self.num_heads = num_heads
        self.window_size = window_size
        self.shift_size = shift_size

        self.norm1 = nn.LayerNorm(dim)
        self.attn = WindowAttention(
            dim, window_size=(window_size, window_size), num_heads=num_heads,
            attn_drop=attn_drop, proj_drop=drop
        )

        # Spectral Channel Attention branch
        self.cab = ChannelAttentionBlock(dim, reduction=4)

        self.norm2 = nn.LayerNorm(dim)
        self.mlp = Mlp(in_features=dim, hidden_features=int(dim * mlp_ratio), drop=drop)

    def forward(self, x: torch.Tensor, H: int, W: int) -> torch.Tensor:
        B, L, C = x.shape
        shortcut = x

        # 1. Spatial Window Self-Attention
        x_norm = self.norm1(x).view(B, H, W, C)
        pad_r = (self.window_size - W % self.window_size) % self.window_size
        pad_b = (self.window_size - H % self.window_size) % self.window_size
        x_pad = F.pad(x_norm, (0, 0, 0, pad_r, 0, pad_b))
        _, Hp, Wp, _ = x_pad.shape

        if self.shift_size > 0:
            shifted_x = torch.roll(x_pad, shifts=(-self.shift_size, -self.shift_size), dims=(1, 2))
        else:
            shifted_x = x_pad

        x_windows = window_partition(shifted_x, self.window_size)
        x_windows = x_windows.view(-1, self.window_size * self.window_size, C)
        attn_windows = self.attn(x_windows)
        attn_windows = attn_windows.view(-1, self.window_size, self.window_size, C)
        shifted_x = window_reverse(attn_windows, self.window_size, Hp, Wp)

        if self.shift_size > 0:
            attn_x = torch.roll(shifted_x, shifts=(self.shift_size, self.shift_size), dims=(1, 2))
        else:
            attn_x = shifted_x

        if pad_r > 0 or pad_b > 0:
            attn_x = attn_x[:, :H, :W, :].contiguous()

        attn_out = attn_x.view(B, H * W, C)

        # 2. Channel Attention Branch (operates in B, C, H, W)
        feat_2d = x.transpose(1, 2).view(B, C, H, W)
        cab_out = self.cab(feat_2d).flatten(2).transpose(1, 2)

        # Merge spatial and channel representations
        x = shortcut + attn_out + cab_out

        # 3. Feedforward MLP
        x = x + self.mlp(self.norm2(x))
        return x


class OverlappingCrossAttentionBlock(nn.Module):
    """
    Overlapping Cross-Attention Block (OCAB):
    Enables cross-window interaction across window boundaries to prevent grid artifacts.
    """
    def __init__(self, dim: int, num_heads: int, window_size: int = 8, mlp_ratio: float = 2.0, drop: float = 0.0):
        super().__init__()
        self.dim = dim
        self.num_heads = num_heads
        self.window_size = window_size
        self.norm1 = nn.LayerNorm(dim)
        self.attn = WindowAttention(dim, window_size=(window_size, window_size), num_heads=num_heads, proj_drop=drop)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = Mlp(in_features=dim, hidden_features=int(dim * mlp_ratio), drop=drop)
        self.conv = nn.Conv2d(dim, dim, 3, 1, 1)

    def forward(self, x: torch.Tensor, H: int, W: int) -> torch.Tensor:
        B, L, C = x.shape
        shortcut = x

        # Window attention with 3x3 depthwise-style boundary blend
        x_norm = self.norm1(x).view(B, H, W, C)
        pad_r = (self.window_size - W % self.window_size) % self.window_size
        pad_b = (self.window_size - H % self.window_size) % self.window_size
        x_pad = F.pad(x_norm, (0, 0, 0, pad_r, 0, pad_b))
        _, Hp, Wp, _ = x_pad.shape

        x_windows = window_partition(x_pad, self.window_size).view(-1, self.window_size * self.window_size, C)
        attn_windows = self.attn(x_windows).view(-1, self.window_size, self.window_size, C)
        attn_rev = window_reverse(attn_windows, self.window_size, Hp, Wp)

        if pad_r > 0 or pad_b > 0:
            attn_rev = attn_rev[:, :H, :W, :].contiguous()

        # Cross-window 3x3 convolution
        feat_2d = attn_rev.permute(0, 3, 1, 2).contiguous()
        conv_out = self.conv(feat_2d).flatten(2).transpose(1, 2)

        x = shortcut + conv_out
        x = x + self.mlp(self.norm2(x))
        return x


class ResidualHybridAttentionGroup(nn.Module):
    """
    Residual Hybrid Attention Group (RHAG):
    Stack of HybridAttentionBlocks (HAB) + OverlappingCrossAttentionBlock (OCAB) + residual conv.
    """
    def __init__(self, dim: int, depth: int, num_heads: int, window_size: int = 8,
                 mlp_ratio: float = 2.0, drop: float = 0.0):
        super().__init__()
        self.blocks = nn.ModuleList([
            HybridAttentionBlock(
                dim=dim, num_heads=num_heads, window_size=window_size,
                shift_size=0 if (i % 2 == 0) else window_size // 2,
                mlp_ratio=mlp_ratio, drop=drop
            )
            for i in range(depth)
        ])
        self.ocab = OverlappingCrossAttentionBlock(
            dim=dim, num_heads=num_heads, window_size=window_size,
            mlp_ratio=mlp_ratio, drop=drop
        )
        self.conv = nn.Conv2d(dim, dim, 3, 1, 1)

    def forward(self, x: torch.Tensor, H: int, W: int) -> torch.Tensor:
        shortcut = x
        for blk in self.blocks:
            x = blk(x, H, W)
        x = self.ocab(x, H, W)
        B, L, C = x.shape
        x_2d = x.transpose(1, 2).view(B, C, H, W)
        x_conv = self.conv(x_2d).flatten(2).transpose(1, 2)
        return shortcut + x_conv


class UpsamplePixelShuffle(nn.Module):
    """4x sub-pixel convolution upsampler."""
    def __init__(self, in_channels: int, out_channels: int, scale: int = 4):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels * (scale**2), 3, padding=1)
        self.pixel_shuffle = nn.PixelShuffle(scale)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.pixel_shuffle(self.conv(x))


class GaiaHAT(nn.Module):
    """
    Gaia-HAT: Hybrid Attention Transformer for 4-Band Multispectral Super-Resolution Mapping.
    Outputs:
    - sr: (B, 4, 4*H, 4*W) 2.5 m Super-Resolved reflectances
    - log_scale: (B, 1, 4*H, 4*W) Aleatoric uncertainty log-sigma
    """
    def __init__(self, in_chans: int = 4, out_chans: int = 4, embed_dim: int = 96,
                 depths: tuple[int, ...] = (4, 4, 4, 4), num_heads: tuple[int, ...] = (6, 6, 6, 6),
                 window_size: int = 8, mlp_ratio: float = 2.0, scale: int = 4, drop_rate: float = 0.0):
        super().__init__()
        self.in_chans = in_chans
        self.out_chans = out_chans
        self.scale = scale
        self.window_size = window_size

        # Shallow feature extraction
        self.conv_first = nn.Conv2d(in_chans, embed_dim, 3, 1, 1)

        # Deep feature extraction: stack of RHAG groups
        self.groups = nn.ModuleList([
            ResidualHybridAttentionGroup(
                dim=embed_dim, depth=depths[i], num_heads=num_heads[i],
                window_size=window_size, mlp_ratio=mlp_ratio, drop=drop_rate
            )
            for i in range(len(depths))
        ])
        self.norm = nn.LayerNorm(embed_dim)
        self.conv_after_body = nn.Conv2d(embed_dim, embed_dim, 3, 1, 1)

        # High-resolution sub-pixel reconstruction
        self.upsample = UpsamplePixelShuffle(embed_dim, embed_dim, scale=scale)
        self.conv_last = nn.Conv2d(embed_dim, out_chans, 3, 1, 1)

        # Spatial aleatoric uncertainty head
        self.unc_head = nn.Sequential(
            nn.Conv2d(embed_dim, embed_dim // 2, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(embed_dim // 2, 1, 3, padding=1)
        )

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        H, W = x.shape[2], x.shape[3]
        bicubic_base = up_bicubic(x, self.scale)

        feat0 = self.conv_first(x)
        feat = feat0.flatten(2).transpose(1, 2)
        for group in self.groups:
            feat = group(feat, H, W)
        feat = self.norm(feat)
        feat = feat.transpose(1, 2).view(feat0.shape)
        feat = feat0 + self.conv_after_body(feat)

        hr_feat = self.upsample(feat)
        residual = self.conv_last(hr_feat)
        sr = bicubic_base + residual
        log_scale = self.unc_head(hr_feat).clamp(-9.0, 2.0)
        return sr, log_scale
