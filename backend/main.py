"""
GaiaScale Backend Application Server

High-Performance FastAPI Server for Multispectral Satellite Super-Resolution Mapper.
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BACKEND_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR.parent))

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

try:
    from backend.config import UPLOADS_DIR, DEVICE
    from backend.schemas import InferenceResponse, HealthResponse
    from backend.services.inference import inference_engine
except ImportError:
    from config import UPLOADS_DIR, DEVICE
    from schemas import InferenceResponse, HealthResponse
    from services.inference import inference_engine

app = FastAPI(
    title="GaiaScale Super-Resolution API",
    description="Physics-Consistent 4-Band Sentinel-2 (10 m -> 2.5 m) Super-Resolution Mapper",
    version="3.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# 1. HEALTH ENDPOINT
# ============================================================================
@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Returns system status, active super-resolution model, and compute hardware."""
    return {
        "status": "healthy",
        "models": inference_engine.available_models,
        "device": str(inference_engine.device)
    }


# ============================================================================
# 2. UPLOAD & INFERENCE ENDPOINT
# ============================================================================
@app.post("/upload", response_model=InferenceResponse, tags=["Inference"])
@app.post("/api/upload", response_model=InferenceResponse, tags=["Inference"])
async def upload_file(
    file: UploadFile = File(..., description="Satellite imagery or GeoTIFF (.tif, .tiff, .npz, .png, .jpg, .jpeg)")
):
    """
    Upload a satellite scene or multi-band image for 4x spatial super-resolution (10 m -> 2.5 m).
    Runs tiled sliding-window inference with 2D Hann-window alpha blending using GaiaScale-HAT.
    """
    filename = Path(file.filename).name if file.filename else "upload.tif"
    ext = Path(filename).suffix.lower()
    valid_exts = {".tif", ".tiff", ".ttif", ".npz", ".png", ".jpg", ".jpeg", ".webp"}
    if not filename or ext not in valid_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Accepted formats: GeoTIFF (.tif, .tiff), NumPy (.npz), and Images (.png, .jpg, .jpeg, .webp)."
        )

    try:
        save_path = UPLOADS_DIR / filename
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        if save_path.stat().st_size == 0:
            save_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty (0 bytes). Please upload a valid image or GeoTIFF."
            )

        result = inference_engine.run_user_file(save_path)
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 3. DOWNLOAD ENDPOINTS (GeoTIFF & NPZ)
# ============================================================================
@app.get("/download_geotiff", tags=["Export"])
@app.get("/api/download_geotiff", tags=["Export"])
def download_geotiff(token: str):
    """
    Downloads the super-resolved 2.5 m imagery as an analysis-ready 4-band GeoTIFF
    with EPSG CRS projection and affine transform matrices.
    """
    try:
        out_tif = UPLOADS_DIR / f"GaiaScale_Enhanced_2.5m_{token}.tif"
        exported_path = inference_engine.export_cached_geotiff(token, out_tif)
        return FileResponse(
            exported_path,
            media_type="image/tiff",
            filename=exported_path.name
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/download_npz", tags=["Export"])
@app.get("/api/download_npz", tags=["Export"])
def download_npz(token: str):
    """
    Downloads the super-resolved 2.5 m data as a compressed NumPy tensor (.npz)
    containing high-res and low-res multispectral reflectance channels.
    """
    try:
        out_npz = UPLOADS_DIR / f"GaiaScale_Enhanced_2.5m_{token}.npz"
        exported_path = inference_engine.export_cached_npz(token, out_npz)
        return FileResponse(
            exported_path,
            media_type="application/octet-stream",
            filename=exported_path.name
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def main():
    parser = argparse.ArgumentParser(description="GaiaScale Sovereign Super-Resolution Platform")
    parser.add_argument("--host", default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=7860, help="Port (default: 7860)")
    args = parser.parse_args()

    print("=" * 76)
    print("  [GAIASCALE] MULTISPECTRAL SATELLITE SUPER-RESOLUTION PLATFORM")
    print(f"  Device: {DEVICE} | Host: {args.host}:{args.port}")
    print("  Endpoints: /health, /upload, /download_geotiff")
    print("=" * 76)

    uvicorn.run("backend.main:app", host=args.host, port=args.port, reload=False)


if __name__ == "__main__":
    main()
