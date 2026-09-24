"""
Multispectral Rendering and Biophysical Transformations
Generates calibrated True Color (RGB), False Color NIR (CIR), NDVI, NDWI,
and high-contrast Magma Uncertainty Heatmaps.
"""

from __future__ import annotations
import io
import base64
import numpy as np
from PIL import Image

def apply_magma(val: np.ndarray) -> np.ndarray:
    """Applies a smooth magma/plasma heatmap to a 2D float array in [0, 1]."""
    norm = np.clip(val, 0.0, 1.0)
    # Magma formula: Deep Indigo -> Red-Orange -> Bright Sunlight Yellow
    r = np.clip(1.5 * norm, 0.0, 1.0) ** 0.85
    g = np.clip(1.8 * (norm - 0.28), 0.0, 1.0) ** 1.25
    b = np.clip(1.2 * np.sin(norm * np.pi), 0.0, 1.0) * (1.0 - norm * 0.45)
    rgb = np.stack([r, g, b], axis=-1)
    return (np.clip(rgb, 0.0, 1.0) * 255).astype(np.uint8)


def render_rgb(bands: np.ndarray, p_high: float = 98.0) -> Image.Image:
    """True Color RGB: Bands [0: Red, 1: Green, 2: Blue]."""
    rgb = bands[:3].transpose(1, 2, 0).copy()
    vmax = np.percentile(rgb, p_high) if np.percentile(rgb, p_high) > 0.05 else 0.45
    rgb = np.clip(rgb / vmax, 0.0, 1.0) ** 0.85
    return Image.fromarray((rgb * 255).astype(np.uint8))


def render_cir(bands: np.ndarray, p_high: float = 98.0) -> Image.Image:
    """Color Infrared (CIR): NIR(B08) -> Red, Red(B04) -> Green, Green(B03) -> Blue."""
    cir = np.stack([bands[3], bands[0], bands[1]], axis=-1)
    vmax = np.percentile(cir, p_high) if np.percentile(cir, p_high) > 0.05 else 0.45
    cir = np.clip(cir / vmax, 0.0, 1.0) ** 0.85
    return Image.fromarray((cir * 255).astype(np.uint8))


def render_ndvi(bands: np.ndarray) -> Image.Image:
    """Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)."""
    nir = bands[3]
    red = bands[0]
    ndvi = (nir - red) / (nir + red + 1e-6)
    ndvi_norm = np.clip((ndvi + 0.2) / 1.0, 0.0, 1.0)

    # Gradient: Bare Earth (Tan/Brown) -> Moderate Veg (Yellow-Lime) -> Dense Chlorophyll (Deep Green)
    r = np.where(ndvi_norm < 0.5, 0.65 + 0.35 * ndvi_norm * 2, 1.0 - 0.85 * (ndvi_norm - 0.5) * 2)
    g = np.where(ndvi_norm < 0.5, 0.45 + 0.55 * ndvi_norm * 2, 0.95 - 0.25 * (ndvi_norm - 0.5) * 2)
    b = np.where(ndvi_norm < 0.5, 0.25, 0.08)
    rgb = np.stack([r, g, b], axis=-1)
    return Image.fromarray((np.clip(rgb, 0.0, 1.0) * 255).astype(np.uint8))


def render_ndwi(bands: np.ndarray) -> Image.Image:
    """Normalized Difference Water Index: (Green - NIR) / (Green + NIR)."""
    green = bands[1]
    nir = bands[3]
    ndwi = (green - nir) / (green + nir + 1e-6)
    ndwi_norm = np.clip((ndwi + 0.45) / 0.95, 0.0, 1.0)

    # Gradient: Dry Land (Dusty Amber) -> Shallow Water (Cyan) -> Deep Clear Water (Navy)
    r = np.clip(0.95 - ndwi_norm * 1.5, 0.0, 0.85)
    g = np.clip(0.80 - ndwi_norm * 0.35, 0.2, 0.9)
    b = np.clip(0.25 + ndwi_norm * 0.75, 0.1, 1.0)
    rgb = np.stack([r, g, b], axis=-1)
    return Image.fromarray((np.clip(rgb, 0.0, 1.0) * 255).astype(np.uint8))


def render_uncertainty(unc_map: np.ndarray) -> Image.Image:
    """Renders calibrated uncertainty heatmap exp(s) in Magma colormap."""
    u = unc_map[0] if unc_map.ndim == 3 else unc_map
    u_norm = (u - u.min()) / (u.max() - u.min() + 1e-6)
    return Image.fromarray(apply_magma(u_norm))


def render_difference(diff_map: np.ndarray) -> Image.Image:
    """Renders absolute error or sensor re-observation drift."""
    d = diff_map.mean(axis=0) if diff_map.ndim == 3 else diff_map
    d_norm = np.clip(d * 40.0, 0.0, 1.0)
    return Image.fromarray(apply_magma(d_norm))


def to_base64(img: Image.Image) -> str:
    """Encodes PIL Image into Base64 PNG URL string."""
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
