"""
GaiaScale Backend Configuration
Centralized settings, filesystem paths, and hardware device discovery.
"""

from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

MODELS_DIR = BASE_DIR / "models"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
PRESETS_DIR = BASE_DIR / "sample_data" / "presets"
UPLOADS_DIR = BASE_DIR / "uploads"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BENCHMARK_DATA = [
    {
        "model": "Bicubic Interpolation",
        "role": "Mathematical Baseline (0 Params)",
        "psnr": 33.25,
        "ssim": 0.913,
        "sam_deg": 1.52,
        "d_ndvi": 0.0184,
        "cons_rmse": 0.00179,
        "spearman": 0.0,
    },
    {
        "model": "SwinIR (Transformer)",
        "role": "High-Speed Geometric Context",
        "psnr": 36.25,
        "ssim": 0.920,
        "sam_deg": 2.30,
        "d_ndvi": 0.0412,
        "cons_rmse": 0.00555,
        "spearman": -0.081,
    },
    {
        "model": "GaiaScale-HAT (Flagship SOTA)",
        "role": "Flagship SOTA Champion (CVPR)",
        "psnr": 35.68,
        "ssim": 0.921,
        "sam_deg": 1.12,
        "d_ndvi": 0.0152,
        "cons_rmse": 0.01341,
        "spearman": 0.363,
    },
    {
        "model": "SEN2SR (ESA Anchor + Head)",
        "role": "Space Agency Peer Foundation Anchor",
        "psnr": 32.10,
        "ssim": 0.872,
        "sam_deg": 2.10,
        "d_ndvi": 0.0195,
        "cons_rmse": 0.00211,
        "spearman": 0.226,
    },
    {
        "model": "GaiaScale-HAT + Back-Projection (IBP)",
        "role": "Certified Zero Hallucination Proof",
        "psnr": 33.16,
        "ssim": 0.911,
        "sam_deg": 1.63,
        "d_ndvi": 0.0195,
        "cons_rmse": 0.00021,
        "spearman": 0.162,
    },
]
