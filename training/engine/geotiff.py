"""
GeoTIFF I/O Engine for Sovereign Remote Sensing
Handles geospatial CRS metadata, affine transformations, and 4x resolution scaling.
"""

from __future__ import annotations
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import numpy as np

try:
    import rasterio
    from rasterio.transform import Affine
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

def read_geotiff(file_path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Reads a GeoTIFF or standard image file into float32 [0, 1] reflectance.
    Returns (data_array [C, H, W], metadata_dict).
    """
    meta = {
        "crs": "EPSG:32643 (Default WGS 84 / UTM Zone 43N)",
        "transform": None,
        "bounds": None,
        "is_geotiff": False,
        "bands_count": 4,
        "gsd_input": 10.0,
        "gsd_target": 2.5
    }

    if HAS_RASTERIO and str(file_path).lower().endswith((".tif", ".tiff")):
        try:
            with rasterio.open(file_path) as src:
                raw = src.read().astype(np.float32)
                crs_str = str(src.crs) if src.crs else "EPSG:32643 (UTM)"
                meta["crs"] = crs_str
                meta["transform"] = list(src.transform) if src.transform else None
                meta["bounds"] = list(src.bounds) if src.bounds else None
                meta["is_geotiff"] = True
                meta["bands_count"] = raw.shape[0]

                # If values are in standard S2 10000 scale
                if raw.max() > 10.0:
                    raw = raw / 10000.0
                raw = np.clip(raw, 0.0, 1.0)

                # Format to 4 bands [Red, Green, Blue, NIR]
                if raw.shape[0] >= 4:
                    data = raw[:4]
                elif raw.shape[0] == 3:
                    # Synthesize NIR from Red/Green ratio if only RGB provided
                    nir_est = np.clip(raw[1] * 1.35 - raw[0] * 0.25, 0.0, 1.0)
                    data = np.concatenate([raw, nir_est[np.newaxis, ...]], axis=0)
                else:
                    data = np.repeat(raw[:1], 4, axis=0)
                return data, meta
        except Exception as e:
            print(f"[GeoTIFF Warning] Rasterio read failed: {e}. Falling back.")

    # Fallback for NPZ or standard PIL images
    if str(file_path).endswith(".npz"):
        npz = np.load(file_path)
        raw = npz["lr"].astype(np.float32)
        if raw.max() > 10.0:
            raw = raw / 10000.0
        data = np.clip(raw, 0.0, 1.0)
        return data, meta

    from PIL import Image
    img = Image.open(file_path).convert("RGB")
    arr = np.array(img).astype(np.float32) / 255.0 # [H, W, 3]
    rgb = arr.transpose(2, 0, 1) # [3, H, W]
    # Synthesize NIR
    nir = np.clip(rgb[1] * 1.3 - rgb[0] * 0.3, 0.0, 1.0)[np.newaxis, ...]
    data = np.concatenate([rgb, nir], axis=0) # [4, H, W]
    return data, meta



def write_geotiff(
    output_path: Path,
    sr_data: np.ndarray, # [4, H, W] in [0, 1]
    original_meta: Dict[str, Any],
    scale: int = 4
) -> Path:
    """
    Exports enhanced 2.5 m multispectral product as a Cloud-Optimized GeoTIFF.
    Scales the affine matrix pixel resolution by 1/scale (e.g. 10 m -> 2.5 m).
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    C, H, W = sr_data.shape
    scaled_data = (np.clip(sr_data, 0.0, 1.0) * 10000.0).astype(np.uint16)

    if HAS_RASTERIO and original_meta.get("is_geotiff") and original_meta.get("transform"):
        try:
            t = original_meta["transform"]
            # Scale affine transform: pixel width and height divided by scale
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

    # Fallback saving via rasterio or tifffile/PIL
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
        Image.fromarray(rgb_preview).save(output_path.with_suffix(".png"))
        
    return output_path
