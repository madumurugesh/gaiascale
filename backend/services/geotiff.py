"""
GeoTIFF and Multi-Band Raster I/O Service
Supports reading/writing GeoTIFF with CRS and Affine transform scaling (10 m -> 2.5 m),
NPZ arrays, and standard imagery with NIR channel synthesis.
"""

from __future__ import annotations
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np

try:
    import rasterio
    from rasterio.transform import Affine
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False


def read_geotiff(file_path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Reads a GeoTIFF, NPZ, or standard image into a float32 [C, H, W] array normalized to [0, 1].
    Returns (data_array, metadata_dict).
    """
    meta: Dict[str, Any] = {
        "crs": "EPSG:32643 (UTM Zone 43N)",
        "transform": None,
        "bounds": None,
        "is_geotiff": False,
        "bands_count": 4,
        "gsd_input": 10.0,
        "gsd_target": 2.5,
    }

    file_path = Path(file_path)

    # Helper to enforce 4 channels [Red, Green, Blue, NIR] in float32 [0, 1]
    def _format_to_4_bands(arr: np.ndarray) -> np.ndarray:
        arr = np.nan_to_num(arr, nan=0.0, posinf=1.0, neginf=0.0)
        arr = np.clip(arr, 0.0, 1.0)
        if arr.ndim == 2:
            arr = arr[np.newaxis, ...]
        c = arr.shape[0]
        if c >= 4:
            return arr[:4]
        elif c == 3:
            # Synthesize NIR from Green and Red reflectance
            nir_est = np.clip(arr[1] * 1.35 - arr[0] * 0.25, 0.0, 1.0)
            return np.concatenate([arr, nir_est[np.newaxis, ...]], axis=0)
        elif c == 2:
            nir_est = arr[1:2]
            return np.concatenate([arr[:1], arr[:1], arr[:1], nir_est], axis=0)
        else:
            return np.repeat(arr[:1], 4, axis=0)

    # Keep CPU inference and the rendered response bounded for user photos.
    def _limit_max_dim(arr: np.ndarray, max_dim: int = 128) -> np.ndarray:
        _, h, w = arr.shape
        if max(h, w) <= max_dim:
            return arr
        scale = max_dim / float(max(h, w))
        new_h, new_w = int(round(h * scale)), int(round(w * scale))
        import torch
        import torch.nn.functional as F
        t = torch.from_numpy(arr).unsqueeze(0).float()
        resized = F.interpolate(t, size=(new_h, new_w), mode="bilinear", align_corners=False)
        return resized.squeeze(0).clamp(0.0, 1.0).numpy()

    # 1. Check for GeoTIFF file
    if HAS_RASTERIO and file_path.suffix.lower() in [".tif", ".tiff", ".ttif"]:
        try:
            with rasterio.open(file_path) as src:
                raw_dtype = src.dtypes[0] if src.dtypes else "unknown"
                raw = src.read()
                crs_str = str(src.crs) if src.crs else "EPSG:32643 (UTM)"
                meta["crs"] = crs_str
                meta["transform"] = list(src.transform) if src.transform else None
                meta["bounds"] = list(src.bounds) if src.bounds else None
                meta["is_geotiff"] = bool(src.crs and src.transform)
                meta["bands_count"] = raw.shape[0]

                raw = raw.astype(np.float32)
                raw_max = float(raw.max()) if raw.size > 0 else 0.0

                # Adaptive radiometric normalization based on data type and dynamic range
                if "uint8" in str(raw_dtype).lower() or (raw_max <= 255.0 and raw_max > 1.0 and "int" in str(raw_dtype).lower()):
                    norm = raw / 255.0
                elif raw_max > 14000.0:
                    norm = raw / 65535.0
                elif raw_max > 1.0:
                    norm = raw / 10000.0
                else:
                    norm = raw

                data = _format_to_4_bands(norm)
                data = _limit_max_dim(data)
                return data, meta
        except Exception as e:
            print(f"[GeoTIFF Warning] Rasterio read failed: {e}. Falling back to standard image loader.")

    # 2. Check for NPZ file
    if file_path.suffix.lower() == ".npz":
        npz = np.load(file_path)
        raw = npz["lr"].astype(np.float32)
        raw_max = float(raw.max()) if raw.size > 0 else 0.0
        if raw_max > 255.0:
            norm = raw / 10000.0
        elif raw_max > 1.0:
            norm = raw / 255.0
        else:
            norm = raw
        data = _format_to_4_bands(norm)
        data = _limit_max_dim(data)
        return data, meta

    # 3. Fallback for PIL images (PNG, JPG, TIFF fallback, etc.)
    from PIL import Image
    with Image.open(file_path) as img:
        img_rgb = img.convert("RGB")
        arr = np.array(img_rgb).astype(np.float32) / 255.0
    rgb = arr.transpose(2, 0, 1)  # [3, H, W]
    data = _format_to_4_bands(rgb)
    data = _limit_max_dim(data)
    return data, meta


def write_geotiff(
    output_path: Path,
    sr_data: np.ndarray,  # [4, H, W] in [0, 1]
    original_meta: Dict[str, Any],
    scale: int = 4
) -> Path:
    """
    Exports super-resolved product as a 4-band GeoTIFF with scaled Affine matrix.
    Pixel ground sampling distance is refined from 10 m -> 2.5 m.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    C, H, W = sr_data.shape
    scaled_data = (np.clip(sr_data, 0.0, 1.0) * 10000.0).astype(np.uint16)

    if HAS_RASTERIO and original_meta.get("is_geotiff") and original_meta.get("transform"):
        try:
            t = original_meta["transform"]
            new_transform = Affine(t[0] / scale, t[1], t[2], t[3], t[4] / scale, t[5])
            with rasterio.open(
                output_path,
                "w",
                driver="GTiff",
                height=H,
                width=W,
                count=C,
                dtype=scaled_data.dtype,
                crs=original_meta.get("crs", "EPSG:32643"),
                transform=new_transform,
                compress="lzw"
            ) as dst:
                dst.write(scaled_data)
                dst.set_band_description(1, "B04 - Red (2.5 m)")
                dst.set_band_description(2, "B03 - Green (2.5 m)")
                dst.set_band_description(3, "B02 - Blue (2.5 m)")
                dst.set_band_description(4, "B08 - NIR (2.5 m)")
            return output_path
        except Exception as e:
            print(f"[GeoTIFF Warning] Rasterio write failed: {e}. Saving standard TIFF.")

    # Fallback writing via rasterio or PIL
    if HAS_RASTERIO:
        with rasterio.open(
            output_path,
            "w",
            driver="GTiff",
            height=H,
            width=W,
            count=C,
            dtype=scaled_data.dtype,
            crs="EPSG:32643",
            compress="lzw"
        ) as dst:
            dst.write(scaled_data)
            dst.set_band_description(1, "B04 - Red (2.5 m)")
            dst.set_band_description(2, "B03 - Green (2.5 m)")
            dst.set_band_description(3, "B02 - Blue (2.5 m)")
            dst.set_band_description(4, "B08 - NIR (2.5 m)")
    else:
        from PIL import Image
        rgb_preview = (np.clip(sr_data[:3].transpose(1, 2, 0), 0, 1) * 255).astype(np.uint8)
        png_path = output_path.with_suffix(".png")
        Image.fromarray(rgb_preview).save(png_path)
        return png_path

    return output_path
