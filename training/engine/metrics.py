"""
Geospatial and Remote Sensing Evaluation Metrics
Includes PSNR, SSIM, SAM, ERGAS, RMSE, Delta-NDVI, Delta-NDWI,
Sensor Downsample Consistency MAE/RMSE, and Spearman Rank Correlation.
"""

from __future__ import annotations
import numpy as np
from scipy.stats import spearmanr

def compute_psnr(sr: np.ndarray, hr: np.ndarray) -> float:
    """PSNR in decibels (dB) for reflectance normalized to [0, 1]."""
    mse = np.mean((sr - hr) ** 2)
    if mse < 1e-12:
        return 99.0
    return float(10.0 * np.log10(1.0 / mse))


def compute_ssim(sr: np.ndarray, hr: np.ndarray) -> float:
    """Multi-band Structural Similarity Index (SSIM)."""
    mu_x = sr.mean()
    mu_y = hr.mean()
    sig_x = sr.std()
    sig_y = hr.std()
    sig_xy = np.mean((sr - mu_x) * (hr - mu_y))
    c1 = 1e-4
    c2 = 9e-4
    ssim = (2 * mu_x * mu_y + c1) * (2 * sig_xy + c2) / ((mu_x**2 + mu_y**2 + c1) * (sig_x**2 + sig_y**2 + c2))
    return float(np.clip(ssim, 0.0, 1.0))


def compute_sam(sr: np.ndarray, hr: np.ndarray) -> float:
    """Spectral Angle Mapper (SAM) in degrees."""
    # Dot product along spectral channel dimension 0
    dot = np.sum(sr * hr, axis=0)
    norm_sr = np.linalg.norm(sr, axis=0) + 1e-7
    norm_hr = np.linalg.norm(hr, axis=0) + 1e-7
    cos_ang = np.clip(dot / (norm_sr * norm_hr), -1.0, 1.0)
    sam_deg = np.mean(np.arccos(cos_ang) * 180.0 / np.pi)
    return float(sam_deg)


def compute_ergas(sr: np.ndarray, hr: np.ndarray, scale: float = 4.0) -> float:
    """Relative dimensionless global error in synthesis (ERGAS)."""
    C = sr.shape[0]
    ergas_sum = 0.0
    for c in range(C):
        rmse_c = np.sqrt(np.mean((sr[c] - hr[c]) ** 2))
        mean_c = np.mean(hr[c]) + 1e-6
        ergas_sum += (rmse_c / mean_c) ** 2
    return float(100.0 / scale * np.sqrt(ergas_sum / C))


def compute_indices_diff(sr: np.ndarray, hr: np.ndarray) -> tuple[float, float]:
    """Computes mean absolute differences in NDVI and NDWI."""
    # Red = 0, Green = 1, Blue = 2, NIR = 3
    ndvi_sr = (sr[3] - sr[0]) / (sr[3] + sr[0] + 1e-6)
    ndvi_hr = (hr[3] - hr[0]) / (hr[3] + hr[0] + 1e-6)
    d_ndvi = float(np.mean(np.abs(ndvi_sr - ndvi_hr)))

    ndwi_sr = (sr[1] - sr[3]) / (sr[1] + sr[3] + 1e-6)
    ndwi_hr = (hr[1] - hr[3]) / (hr[1] + hr[3] + 1e-6)
    d_ndwi = float(np.mean(np.abs(ndwi_sr - ndwi_hr)))

    return d_ndvi, d_ndwi


def compute_spearman(uncertainty: np.ndarray, error: np.ndarray) -> float:
    """
    Spearman Rank Correlation between predicted uncertainty and true absolute error.
    Validates NTRO Requirement #8.
    """
    u_flat = uncertainty.flatten()
    e_flat = error.flatten()
    if np.std(u_flat) > 1e-6 and np.std(e_flat) > 1e-6:
        r, _ = spearmanr(u_flat, e_flat)
        return float(r) if not np.isnan(r) else 0.0
    return 0.0
