"""
Gaia-HAT Training Losses
Reconstruction (Charbonnier) + calibrated aleatoric uncertainty (Laplace NLL),
matching the model's dual-head output: sr (reconstruction) and log_scale (log b).
"""

from __future__ import annotations

import torch
import torch.nn as nn


class CharbonnierLoss(nn.Module):
    """Smooth L1 variant standard in SR training: sqrt((x-y)^2 + eps^2)."""

    def __init__(self, eps: float = 1e-3):
        super().__init__()
        self.eps = eps

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        return torch.mean(torch.sqrt((pred - target) ** 2 + self.eps ** 2))


class LaplaceNLLLoss(nn.Module):
    """
    Negative log-likelihood under a Laplace(mu=pred, b=exp(log_scale)) model, dropping
    the constant log(2) term (doesn't affect gradients):
        NLL = log_scale + |pred - target| * exp(-log_scale)
    Minimizing this jointly drives pred toward target and calibrates log_scale so that
    exp(log_scale) tracks the model's actual per-pixel reconstruction error.
    """

    def forward(self, pred: torch.Tensor, log_scale: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        err = torch.abs(pred - target).mean(dim=1, keepdim=True)  # average over bands to match log_scale's 1 channel
        return torch.mean(log_scale + err * torch.exp(-log_scale))


class GaiaHATLoss(nn.Module):
    """Combined training objective: recon_weight * Charbonnier + nll_weight * Laplace NLL."""

    def __init__(self, recon_weight: float = 1.0, nll_weight: float = 0.2, charbonnier_eps: float = 1e-3):
        super().__init__()
        self.recon_weight = recon_weight
        self.nll_weight = nll_weight
        self.charbonnier = CharbonnierLoss(eps=charbonnier_eps)
        self.nll = LaplaceNLLLoss()

    def forward(
        self, sr: torch.Tensor, log_scale: torch.Tensor, hr: torch.Tensor
    ) -> tuple[torch.Tensor, dict[str, float]]:
        recon = self.charbonnier(sr, hr)
        nll = self.nll(sr, log_scale, hr)
        total = self.recon_weight * recon + self.nll_weight * nll
        return total, {"recon": recon.item(), "nll": nll.item(), "total": total.item()}
