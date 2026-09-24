"""
Gaia-HAT Training Suite: Application Server
Single-entry FastAPI server for interactive testing of the Gaia-HAT model:
tiled inference, real-time user uploads, and multi-band spectral telemetry.
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from engine.inference import engine

app = FastAPI(
    title="Gaia-HAT: Satellite Super-Resolution",
    description="Physics-Consistent 4-Band Sentinel-2 10 m -> 2.5 m Super-Resolution",
    version="1.0.0"
)

STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class PresetRequest(BaseModel):
    preset_id: str = "Landcover-785992"
    model_name: str = "hat"
    use_ibp: bool = False

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "models": engine.available_models,
        "device": str(engine.device)
    }

@app.get("/")
def get_index():
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="index.html not found.")
    return FileResponse(index_file)


@app.get("/api/presets")
def get_presets():
    return {
        "status": "success",
        "presets": engine.get_presets()
    }

@app.post("/api/infer_preset")
def infer_preset(req: PresetRequest):
    try:
        preset_file = BASE_DIR / f"sample_data/presets/{req.preset_id}.npz"
        if not preset_file.exists():
            presets = list((BASE_DIR / "sample_data/presets").glob("*.npz"))
            if presets:
                preset_file = presets[0]
            else:
                raise HTTPException(status_code=404, detail="No preset files found.")

        res = engine.run_user_file(preset_file, model_name=req.model_name, use_ibp=req.use_ibp)
        return {"status": "success", "data": res}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    model_name: str = Form("hat"),
    use_ibp: bool = Form(False)
):
    try:
        save_path = UPLOADS_DIR / file.filename
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        res = engine.run_user_file(save_path, model_name=model_name, use_ibp=use_ibp)
        return {"status": "success", "data": res}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download_geotiff")
def download_geotiff(token: str):
    try:
        out_tif = UPLOADS_DIR / f"GaiaHAT_Enhanced_2.5m_{token}.tif"
        exported_path = engine.export_cached_geotiff(token, out_tif)
        return FileResponse(
            exported_path,
            media_type="image/tiff",
            filename=exported_path.name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/benchmark")
def get_benchmark():
    return {
        "status": "success",
        "benchmark": [
            {
                "model": "Bicubic Interpolation",
                "psnr": 33.25,
                "ssim": 0.913,
                "sam_deg": 1.52,
                "d_ndvi": 0.0184,
                "cons_rmse": 0.00179,
                "spearman": 0.0,
                "role": "Mathematical Baseline (0 Params)"
            },
            {
                "model": "Gaia-HAT",
                "psnr": 35.68,
                "ssim": 0.921,
                "sam_deg": 1.12,
                "d_ndvi": 0.0152,
                "cons_rmse": 0.01341,
                "spearman": 0.363,
                "role": "Flagship Hybrid Attention Transformer"
            },
            {
                "model": "Gaia-HAT + Back-Projection (IBP)",
                "psnr": 33.16,
                "ssim": 0.911,
                "sam_deg": 1.63,
                "d_ndvi": 0.0195,
                "cons_rmse": 0.00021,
                "spearman": 0.162,
                "role": "Certified Zero Hallucination Proof"
            }
        ]
    }

# Mount static folder
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def main():
    parser = argparse.ArgumentParser(description="Gaia-HAT Application Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=7860, help="Port (default: 7860)")
    args = parser.parse_args()

    print("=" * 76)
    print("  GAIA-HAT: SATELLITE SUPER-RESOLUTION")
    print("  Real-Time User Upload: GeoTIFF, NPZ, PNG, JPG Supported")
    print("  Model Active: Gaia-HAT, Bicubic")
    print("=" * 76)
    print(f"  Local Dashboard URL: http://localhost:{args.port}")
    print(f"  Direct Access URL:   http://127.0.0.1:{args.port}")
    print("=" * 76)
    print("  Press Ctrl+C to terminate server.\n")

    uvicorn.run("app:app", host=args.host, port=args.port, reload=False)

if __name__ == "__main__":
    main()
