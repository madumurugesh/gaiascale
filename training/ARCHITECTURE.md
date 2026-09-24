# Gaia-HAT Architecture

Gaia-HAT is a Hybrid Attention Transformer for 4x super-resolution of 4-band
Sentinel-2 imagery (Red/Green/Blue/NIR), 10 m → 2.5 m ground sampling distance. The
architecture follows [HAT (Chen et al., CVPR 2023)](https://arxiv.org/abs/2205.04437),
adapted for multispectral satellite input and extended with a per-pixel aleatoric
uncertainty head. Implementation: `models/gaia_hat.py`.

The deployed checkpoint (`checkpoints/gaia_hat_best.pt`) uses `embed_dim=96`,
`depths=(4,4,4,4)`, `num_heads=(6,6,6,6)`, `window_size=8` — **6.38M parameters**
(~25.5 MB fp32). This is a lightweight configuration relative to the full HAT paper
(which uses `embed_dim=180` and more blocks), which is why a single consumer GPU is
enough to train it (see [README.md](README.md#training-gaia-hat)).

## Contents

- [End-to-end pipeline](#end-to-end-pipeline)
- [Model architecture](#model-architecture)
- [Uncertainty head](#uncertainty-head)
- [Tiled inference](#tiled-inference)
- [Training objective](#training-objective)
- [Metrics](#metrics)
- [Known limitations](#known-limitations)

## End-to-end pipeline

```
LR input (4, H, W)                                            in [0, 1]
   │
   ├──► bicubic 4x upsample ──────────────────────────────────────┐
   │                                                               │
   ▼                                                               │
 conv_first (3x3)                                                  │
   │  (4 → embed_dim channels)                                     │
   ▼                                                               │
 [ RHAG × len(depths) ]  (deep feature extraction, see below)      │
   │                                                                │
   ▼                                                                │
 LayerNorm → conv_after_body (3x3) → + conv_first output (residual)│
   │                                                                │
   ▼                                                                │
 UpsamplePixelShuffle (4x)                                          │
   │                                                                │
   ├──► conv_last (3x3) → residual ────────────────► + ◄───────────┘
   │                                                   │
   │                                                   ▼
   │                                            sr: (4, 4H, 4W)
   │
   └──► unc_head (conv → ReLU → conv) → log_scale, clamped [-9, 2]
                                              │
                                              ▼ (at inference: exp())
                                    per-pixel uncertainty map
```

The bicubic base means the network only has to learn the *residual* correction on
top of a reasonable baseline, rather than the whole image — this stabilizes training
and guarantees a sane fallback if a region is genuinely ambiguous.

## Model architecture

### RHAG — Residual Hybrid Attention Group

Each of the `len(depths)` groups (`ResidualHybridAttentionGroup`) contains a stack of
Hybrid Attention Blocks (HAB), one Overlapping Cross-Attention Block (OCAB), and a
residual 3x3 conv:

```
RHAG input
   │
   ├─► HAB × depths[i]  (alternating window-attention shift, see below)
   │
   ▼
  OCAB
   │
   ▼
  conv (3x3)
   │
   ▼
  + RHAG input (residual)
```

### HAB — Hybrid Attention Block

Each block fuses two parallel branches:

```
        x
        │
   LayerNorm
        │
   ┌────┴─────────────┐
   │                   │
 (S)W-MSA          CAB (on raw x, not normalized —
   │                    see Known Limitations)
   │                   │
   └─────────┬─────────┘
             │
     x + attn_out + cab_out
             │
        LayerNorm → MLP
             │
            (+)
             │
            out
```

- **(S)W-MSA** (window multi-head self-attention, shifted on alternating blocks):
  splits the feature map into non-overlapping `window_size × window_size` windows and
  runs standard multi-head self-attention within each window, with a learned relative
  position bias. Every other block shifts the window grid by `window_size // 2`
  (`shift_size`) before partitioning, so information can flow across window
  boundaries over successive blocks. This is what resolves sharp geometric
  boundaries — roads, field edges, building outlines — that a purely convolutional
  network tends to blur.
- **CAB** (Channel Attention Block): two 3x3 convs followed by squeeze-and-excitation
  style channel attention (global average pool → 1x1 conv down → ReLU → 1x1 conv up →
  sigmoid gate). This models *inter-band* correlation — e.g. keeping the Red/NIR ratio
  physically consistent — which is what keeps derived indices like NDVI/NDWI stable
  under super-resolution.

### OCAB — Overlapping Cross-Attention Block

Runs one more window-attention pass (same `WindowAttention` class as HAB, non-shifted)
followed by a 3x3 conv, then an MLP:

```
x → LayerNorm → WindowAttention → 3x3 conv → + x → LayerNorm → MLP → +
```

Named after the HAT paper's OCAB, which uses an *expanded, overlapping* key/value
window (via `unfold`) so attention itself sees context beyond the query window's
boundary. **This implementation does not do that** — see
[Known Limitations](#known-limitations).

### Upsampling

`UpsamplePixelShuffle`: a 3x3 conv expands channels to `embed_dim * scale²`, followed
by `nn.PixelShuffle(scale)` — a sub-pixel convolution upsampler, the standard
efficient way to go from feature space to full spatial resolution without
checkerboard artifacts from transposed convolution.

## Uncertainty head

A small conv branch (`unc_head`: conv → ReLU → conv) predicts `log_scale`, the log of
the Laplace distribution's scale parameter `b`, clamped to `[-9, 2]` to keep
`exp(log_scale)` in a numerically sane range. At inference, `torch.exp(log_scale)`
gives a per-pixel uncertainty map: **high values flag regions the model expects to
get wrong** — cloud edges, water glare, shadows — which is what the Spearman
correlation in the benchmark table measures (rank-correlation between this map and
actual reconstruction error).

## Tiled inference

Large scenes are processed in overlapping tiles (`engine/inference.py:process_tiled`,
default 64px LR patches / 48px stride) rather than as one giant forward pass:

- Tiles are batched together (not run one at a time) for GPU throughput.
- Overlapping tile outputs are blended with a **2D Hann window** so seams between
  tiles don't show up in the final image.
- **Iterative Back-Projection (IBP)** (`backproject_np`, optional via `--ibp` /
  `use_ibp=True`): after the initial super-resolved output, repeatedly downsamples
  it back to LR resolution, computes the residual against the real LR input, and
  feeds that residual back in. This mathematically drives the "downsample the output,
  compare to the original sensor reading" consistency check toward zero — the "zero
  hallucination" property: the model's output can't disagree with what the sensor
  actually measured, only add detail *consistent* with it.

## Training objective

`losses.py`'s `GaiaHATLoss` combines two terms:

- **Charbonnier loss** (`recon_weight`, default 1.0): `sqrt((sr - hr)² + eps²)`, a
  smooth L1 variant standard in super-resolution training — drives the reconstruction
  itself.
- **Laplace negative log-likelihood** (`nll_weight`, default 0.2):
  `log_scale + |sr - hr| * exp(-log_scale)`, matching the Laplace distribution the
  uncertainty head is meant to parameterize. This is what actually calibrates
  `log_scale` to track real reconstruction error — without it, the uncertainty head
  is just an unconstrained extra output with no reason to mean anything.

The two are combined rather than using the NLL term alone because relying purely on
NLL early in training lets the model reduce loss by inflating `log_scale` instead of
improving `sr` — the reconstruction term keeps that from happening. See
`train.py --recon-weight` / `--nll-weight` to adjust the balance.

## Metrics

Computed in `engine/metrics.py`, reused identically by both `train.py`'s validation
loop and the inference API:

| Metric | Measures | Direction |
|---|---|---|
| PSNR | Pixel-level reconstruction accuracy | higher better |
| SSIM | Structural/perceptual similarity (this implementation is a single global, not sliding-window, SSIM — reads more optimistic than a windowed SSIM on the same image) | higher better |
| SAM (Spectral Angle Mapper) | Spectral distortion, independent of brightness | lower better |
| ERGAS | Global multispectral synthesis error, normalized per band | lower better |
| ΔNDVI / ΔNDWI | Biophysical index drift (vegetation / water) | lower better |
| Downsample consistency MAE/RMSE | "Zero hallucination" check — does downsampling the output recreate the input? | lower better |
| Uncertainty Spearman r_s | Does the uncertainty map actually track real error? | higher (positive) better |

## Known limitations

These are real deviations from the HAT paper found during review of this codebase.
They don't make the current deployed checkpoint "wrong" — it was trained against
this exact computational graph — but **any fix here changes the architecture and
requires retraining from scratch**; applying a fix at inference time to the existing
checkpoint would run trained weights through a different graph than the one they
were optimized for, which is more likely to hurt than help.

1. **CAB reads pre-normalization features.** In each HAB, `(S)W-MSA` operates on
   `LayerNorm(x)`, but `CAB` operates on raw `x` (the block's un-normalized input).
   The original HAT paper's design has both branches read the same normalized input.
   Also, the paper scales the CAB branch by a small factor (~0.01) before adding it
   to the residual stream; here it's added at full magnitude.
2. **OCAB doesn't actually overlap.** It calls the same non-overlapping
   `window_partition`/`WindowAttention` as the regular block, then a plain 3x3 conv.
   The paper's OCAB expands the key/value window via `unfold` so attention itself
   sees past the query window's boundary — that's what removes windowing artifacts
   *at the attention level*. Here, cross-window mixing only happens through the
   conv's 3x3 receptive field and through the Hann-window blending at the tiling
   level (see [Tiled inference](#tiled-inference)) — which is a different mechanism
   solving a related but not identical problem.
3. **No shifted-window attention mask.** Standard Swin/HAT-style shifted-window
   attention (`shift_size > 0` blocks) requires a mask so that windows formed by the
   cyclic shift (`torch.roll`) don't attend across the artificial wrap-around seam
   introduced at tile borders. `WindowAttention` in `gaia_hat.py` doesn't implement
   masking at all, so shifted blocks currently attend across that seam. This is a
   known source of subtle grid-pattern artifacts at internal window boundaries.

Before attempting any of these fixes, retrain the *unmodified* architecture first to
establish a reproducible baseline — see
[README.md's training methodology note](README.md#step-3--run-training). Otherwise
you can't tell whether a metric change came from the fix or from ordinary
training-run variance (different seed, data shuffling, or stopping point can shift
PSNR by tenths of a dB on its own).
