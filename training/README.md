# Gaia-HAT

Training and inference suite for **Gaia-HAT**, a Hybrid Attention Transformer that
super-resolves 4-band Sentinel-2 imagery (Red/Green/Blue/NIR) from 10 m to 2.5 m
ground sampling distance (4x), with a calibrated per-pixel uncertainty map alongside
the enhanced image.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the model works in detail, including
known limitations relevant to retraining.

---

## Repository structure

```
training/
├── app.py                  # FastAPI server + web dashboard for interactive testing
├── run_inference.py        # CLI inference (single file, directory, or preset)
├── train.py                # Training script
├── datasets.py             # Paired LR/HR dataset with random-crop augmentation
├── losses.py                # Charbonnier reconstruction + Laplace NLL uncertainty loss
├── test_models.py          # Smoke test for the inference engine
├── verify_api.py           # Smoke test for the running web API
├── ARCHITECTURE.md         # Model architecture and how it works
├── README.md                # This file
│
├── models/
│   └── gaia_hat.py          # GaiaHAT model definition
├── checkpoints/
│   └── gaia_hat_best.pt     # Deployed checkpoint (loaded by app.py / run_inference.py)
├── engine/
│   ├── inference.py         # Tiled inference engine, IBP, data normalization
│   ├── geotiff.py            # GeoTIFF I/O with CRS/affine handling
│   ├── spectral.py           # RGB/CIR/NDVI/NDWI/uncertainty rendering
│   └── metrics.py            # PSNR, SSIM, SAM, ERGAS, Spearman correlation
├── results/                  # Evaluation CSVs from past runs
├── sample_data/presets/      # A few example paired LR/HR scenes (also the format
│                              # train.py expects — see "Preparing training data" below)
└── static/                   # Web dashboard frontend
```

---

## Quick start: run inference with the existing checkpoint

```bash
pip install -r requirements.txt

# Web dashboard
python app.py --port 7860
# -> http://localhost:7860

# CLI, single scene
python run_inference.py -i scene.tif -o ./outputs --model hat

# CLI, with an available preset and ground-truth comparison
python run_inference.py --preset Landcover-785992 --model hat --save-json
```

---

## Training Gaia-HAT

There is currently **no training data bundled in this repo** — only three example
scenes under `sample_data/presets/` (useful for testing `train.py` runs, not for
training a real model). Getting a usable checkpoint means: collect data, prepare it,
train, evaluate, then deploy. Each step below.

### Step 1 — Collect paired LR/HR data

You need **co-registered pairs**: a low-resolution Sentinel-2 scene and a higher-resolution
reference image of the *same ground footprint*, ideally from a close acquisition date
(days apart at most, cloud-free on both).

Sources to consider:
- **ESA WorldStrat** (NeurIPS 2022) — the dataset the bundled sample presets and the
  reported benchmark numbers come from. Pairs Sentinel-2 10 m with SPOT-6/7 1.5 m
  reference imagery across diverse biomes. Best starting point if you want results
  comparable to the numbers already in this repo.
- **Copernicus Open Access Hub / Sentinel Hub** — free Sentinel-2 L2A (10 m,
  surface reflectance) imagery for the LR side.
- **Commercial VHR imagery** (SPOT-6/7, Planet, Maxar, etc.) for the HR side — usually
  requires a paid license or an existing data-sharing agreement. This is typically the
  hardest part to source, not the compute.
- If no licensed HR imagery is available, a synthetic bootstrap (downsample existing
  high-res imagery to simulate the LR input) is a common fallback, but the model will
  then be learning to invert a synthetic degradation rather than the real Sentinel-2
  sensor response — expect it to generalize worse to real Sentinel-2 input than a
  model trained on genuine sensor pairs.

Aim for **diverse biomes** (agriculture, forest, urban, water) and **at least low
thousands of scene pairs** — a few hundred will likely overfit. Co-registration
accuracy matters more than volume: misaligned pairs teach the model to "fix"
alignment error rather than resolution.

### Step 2 — Prepare the dataset

`datasets.py`'s `PairedSRDataset` (used by `train.py`) expects a directory of `.npz`
files, each containing exactly:

```python
np.savez_compressed(
    "scene_0001.npz",
    lr=lr_array,   # [4, H, W]        — Red, Green, Blue, NIR, in that band order
    hr=hr_array,   # [4, H*4, W*4]    — co-registered reference, exactly 4x the LR size
)
```

- Band order must be **Red, Green, Blue, NIR** — every other file in this repo
  (`engine/spectral.py`, `engine/metrics.py`) assumes that order.
- Pixel values can be raw (e.g. `uint16`, Sentinel-2's native 0–10000 surface
  reflectance scale) or already normalized to `[0, 1]` — `normalize_reflectance()`
  in `engine/inference.py` (reused by `datasets.py`) handles both.
- One `.npz` = one scene. `PairedSRDataset` draws random crops from each scene at
  training time, so scenes don't need to be pre-cut into fixed patches — a few hundred
  to a few thousand pixels per side is fine.

Split scenes into `data/train/` and `data/val/` directories yourself (recommended:
by geography, so validation scenes aren't spatially adjacent to training scenes) or
let `train.py` auto-split by whole scene with `--val-frac` if you only have one
directory (see Step 3).

### Step 3 — Run training

```bash
python train.py \
  --train-dir data/train \
  --val-dir data/val \
  --epochs 100 \
  --batch-size 16 \
  --patch-size 64
```

If you only have one directory of scenes, omit `--val-dir` and pass `--val-frac 0.15`
(default) — `train.py` will hold out that fraction of *whole scenes* (not patches) for
validation automatically.

Key options (`python train.py --help` for the full list):
- `--recon-weight` / `--nll-weight` — balance between the reconstruction loss and the
  uncertainty-calibration loss (see [ARCHITECTURE.md](ARCHITECTURE.md#training-objective)).
- `--embed-dim`, `--depths`, `--num-heads` — model capacity. Defaults match the
  deployed `gaia_hat_best.pt` checkpoint, so `--resume checkpoints/gaia_hat_best.pt`
  works out of the box unless you change these.
- `--resume path/to/checkpoint.pt` — continue training from a saved checkpoint
  (model + optimizer + epoch counter).

Checkpoints are saved to `--checkpoint-dir` (default `checkpoints/`) as
`gaia_hat_last.pt` (every epoch) and `gaia_hat_new_best.pt` (whenever validation PSNR
improves) — **never overwriting `gaia_hat_best.pt` automatically**, so the currently
deployed checkpoint stays safe until you deliberately promote a new one (Step 5).

Before trusting any architecture change (see [ARCHITECTURE.md](ARCHITECTURE.md#known-limitations)),
first retrain the *unmodified* architecture and confirm you can reproduce something
close to the existing benchmark. Otherwise you can't tell whether a later metric
change came from your architecture change or just from training-run variance.

### Step 4 — Evaluate a checkpoint

`train.py` reports validation PSNR/SSIM every `--val-interval` epochs using the same
metric functions (`engine/metrics.py`) the app reports at inference time. For a fuller
evaluation on full scenes (not just random training-size crops), point
`run_inference.py` at a checkpoint-loaded engine with a held-out scene and its
ground truth:

```bash
python run_inference.py -i scene_lr.npz --hr scene_hr.npz --model hat --save-json
```

This runs the full tiled inference pipeline (matching production behavior exactly)
and reports PSNR, SSIM, SAM, ERGAS, ΔNDVI, ΔNDWI, and uncertainty Spearman
correlation.

### Step 5 — Deploy a retrained checkpoint

Once you've confirmed a new checkpoint is genuinely better (not just a lucky
validation split), promote it:

```bash
cp checkpoints/gaia_hat_new_best.pt checkpoints/gaia_hat_best.pt
```

`app.py` and `run_inference.py` load `checkpoints/gaia_hat_best.pt` by default — restart
the app for the change to take effect.

---

## Benchmark (held-out WorldStrat split)

| Model | PSNR (dB) ↑ | SSIM ↑ | SAM (°) ↓ | ΔNDVI ↓ | Downsample Drift (MAE) ↓ | Uncertainty r_s ↑ |
|---|---|---|---|---|---|---|
| Bicubic baseline | 33.25 | 0.9130 | 1.518 | 0.0184 | 0.00179 | N/A |
| **Gaia-HAT** | **35.68** | **0.9213** | **1.116** | **0.0152** | 0.01341 | **+0.363** |
| Gaia-HAT + IBP (zero hallucination) | 33.16 | 0.9109 | 1.625 | 0.0195 | **0.000000** | +0.162 |

See [ARCHITECTURE.md](ARCHITECTURE.md) for what each metric measures and how the
model produces these numbers.
