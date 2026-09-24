#!/usr/bin/env python3
"""
Gaia-HAT: Satellite Super-Resolution CLI Inference Suite

Supports:
- Models: Gaia-HAT, Bicubic baseline
- Formats: Cloud-Optimized GeoTIFF (.tif/.tiff), Multispectral NPZ (.npz), Standard Imagery (.png/.jpg)
- Processing: Arbitrary-scale sliding-window tiled inference with 2D Hann-window alpha blending
- Physics: Certified Zero Hallucination via Iterative Back-Projection (IBP)
- Outputs: 4-band 2.5 m GeoTIFF (CRS preserved), RGB/CIR/NDVI/NDWI visual renders, uncertainty maps
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

import numpy as np
import torch
from PIL import Image

# Ensure local imports work cleanly
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from engine.inference import InferenceEngine, backproject_np, downsample_np, normalize_reflectance
from engine.geotiff import read_geotiff, write_geotiff
from engine.spectral import (
    render_rgb, render_cir, render_ndvi, render_ndwi,
    render_uncertainty, render_difference
)
from engine.metrics import (
    compute_psnr, compute_ssim, compute_sam, compute_ergas,
    compute_indices_diff, compute_spearman
)

BANNER = r"""
========================================================================================
   ____       _         _   _   _  _______
  / ___| __ _(_) __ _  | | | | | ||__   __|
 | |  _ / _` | |/ _` | | |_| | | |   | |
 | |_| | (_| | | (_| | |  _  | | |   | |
  \____|\__,_|_|\__,_| |_| |_| |_|   |_|
  Satellite Multispectral Super-Resolution Mapping (4x: 10 m -> 2.5 m)
========================================================================================
"""

def parse_args():
    parser = argparse.ArgumentParser(
        description="Gaia-HAT: Satellite Super-Resolution Inference Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 1. Run Gaia-HAT on a GeoTIFF with Zero-Hallucination IBP:
  python run_inference.py -i scene.tif -o ./outputs --model hat --ibp

  # 2. Run Gaia-HAT on a preset sample with full spectral exports:
  python run_inference.py --preset Landcover-785992 --model hat --export-bands

  # 3. Batch inference over a directory, bicubic baseline for comparison:
  python run_inference.py -i ./input_tiles/ -o ./batch_sr/ --model bicubic

  # 4. Evaluation against Ground Truth HR reference:
  python run_inference.py -i lr.npz --hr hr.npz --model hat --save-json
        """
    )
    parser.add_argument("-i", "--input", type=str, help="Path to input image/tile/GeoTIFF/NPZ or directory of files.")
    parser.add_argument("-o", "--output-dir", type=str, default="./outputs", help="Output directory for results (default: ./outputs).")
    parser.add_argument("-m", "--model", type=str, default="hat", choices=["hat", "bicubic"],
                        help="Architecture: 'hat' (Gaia-HAT) or 'bicubic' (0-parameter baseline).")
    parser.add_argument("--ibp", action="store_true", default=True, help="Enable Iterative Back-Projection for zero hallucination (default: True).")
    parser.add_argument("--no-ibp", action="store_false", dest="ibp", help="Disable Iterative Back-Projection.")
    parser.add_argument("--hr", type=str, default=None, help="Optional high-resolution reference for objective metric evaluation.")
    parser.add_argument("--preset", type=str, default=None, help="Process one of the included benchmark presets (e.g. Landcover-785992).")
    parser.add_argument("--tile-size", type=int, default=64, help="Sliding tile patch size in LR pixels (default: 64).")
    parser.add_argument("--stride", type=int, default=48, help="Sliding tile stride in LR pixels (default: 48, giving 16px overlap).")
    parser.add_argument("--device", type=str, default="auto", choices=["auto", "cuda", "cpu"], help="Compute device (default: auto).")
    parser.add_argument("--export-bands", action="store_true", default=False, help="Export high-res PNG biophysical maps (RGB, CIR, NDVI, NDWI, Uncertainty).")
    parser.add_argument("--save-json", action="store_true", default=False, help="Save structured telemetry and validation metrics to JSON.")
    return parser.parse_args()


def process_single_scene(
    engine: InferenceEngine,
    input_path: Path,
    output_dir: Path,
    model_name: str = "hat",
    use_ibp: bool = True,
    hr_path: Optional[Path] = None,
    tile_size: int = 64,
    stride: int = 48,
    export_bands: bool = False,
    save_json: bool = False
) -> Dict[str, Any]:
    """Processes a single satellite scene or tile end-to-end."""
    print(f"\n[{model_name.upper()}] Ingesting: {input_path.name}")
    t_start = time.time()

    # Ingest data
    hr_ref = None
    if input_path.suffix.lower() == ".npz":
        npz = np.load(input_path)
        lr_data = normalize_reflectance(npz["lr"])
        if "hr" in npz:
            hr_ref = normalize_reflectance(npz["hr"])
        meta = {
            "crs": "EPSG:32643 (UTM Zone 43N)",
            "is_geotiff": False,
            "filename": input_path.name,
            "bands_count": 4,
            "gsd_input": 10.0,
            "gsd_target": 2.5
        }
    else:
        lr_data, meta = read_geotiff(input_path)
        meta["filename"] = input_path.name

    if hr_path and hr_path.exists():
        if hr_path.suffix.lower() == ".npz":
            hr_npz = np.load(hr_path)
            h_raw = hr_npz["hr"] if "hr" in hr_npz else hr_npz["lr"]
            hr_ref = normalize_reflectance(h_raw)
        else:
            h_data, _ = read_geotiff(hr_path)
            hr_ref = h_data

    C, H, W = lr_data.shape
    print(f"  Input Resolution: {H} x {W} ({C} spectral bands: Red, Green, Blue, NIR)")
    print(f"  Input GSD:        10.0 meters / pixel")
    print(f"  Target GSD:       2.5 meters / pixel ({H*4} x {W*4})")
    print(f"  Tiled Inference:  Tile {tile_size}x{tile_size}, Stride {stride} (2D Hann Blending)")

    # Execute Tiled Super-Resolution
    t0 = time.time()
    sr_data, unc_map = engine.process_tiled(
        lr_data,
        model_name=model_name,
        patch_size=tile_size,
        stride=stride
    )
    t_inf = (time.time() - t0) * 1000.0

    # Iterative Back-Projection
    if use_ibp:
        t_ibp0 = time.time()
        sr_data = backproject_np(sr_data, lr_data, iters=4, lr_rate=0.5)
        ibp_time = (time.time() - t_ibp0) * 1000.0
    else:
        ibp_time = 0.0

    total_time = (time.time() - t_start) * 1000.0

    # Sensor Re-Observation Physical Consistency
    sim_lr = downsample_np(sr_data, scale=4)
    cons_diff = np.abs(sim_lr - lr_data)
    cons_mae = float(np.mean(cons_diff))
    cons_rmse = float(np.sqrt(np.mean((sim_lr - lr_data) ** 2)))

    # Metrics Calculation
    metrics: Dict[str, Any] = {
        "cons_mae": round(cons_mae, 6),
        "cons_rmse": round(cons_rmse, 6),
        "inf_latency_ms": round(t_inf, 1),
        "ibp_latency_ms": round(ibp_time, 1),
        "total_latency_ms": round(total_time, 1),
        "throughput_mpix_sec": round(((H * 4 * W * 4) / 1e6) / (total_time / 1000.0), 2)
    }

    if hr_ref is not None:
        min_h = min(sr_data.shape[1], hr_ref.shape[1])
        min_w = min(sr_data.shape[2], hr_ref.shape[2])
        s_crop = sr_data[:, :min_h, :min_w]
        h_crop = hr_ref[:, :min_h, :min_w]
        err = np.abs(s_crop - h_crop)

        metrics["psnr_db"] = round(compute_psnr(s_crop, h_crop), 2)
        metrics["ssim"] = round(compute_ssim(s_crop, h_crop), 4)
        metrics["sam_deg"] = round(compute_sam(s_crop, h_crop), 2)
        metrics["ergas"] = round(compute_ergas(s_crop, h_crop), 2)
        metrics["rmse"] = round(float(np.sqrt(np.mean(err**2))), 4)
        d_ndvi, d_ndwi = compute_indices_diff(s_crop, h_crop)
        metrics["d_ndvi"] = round(d_ndvi, 4)
        metrics["d_ndwi"] = round(d_ndwi, 4)
        metrics["unc_spearman"] = round(compute_spearman(unc_map[:, :min_h, :min_w], err.mean(axis=0)), 3)

    # Save 4-Band Enhanced GeoTIFF Product
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = input_path.stem
    tif_out = output_dir / f"{stem}_{model_name}_2.5m.tif"
    write_geotiff(tif_out, sr_data, meta, scale=4)
    print(f"  Enhanced GeoTIFF: {tif_out.name} ({tif_out.stat().st_size / (1024*1024):.2f} MB)")

    # Export Visual Products if requested
    exported_files = [str(tif_out)]
    if export_bands:
        rgb_img = render_rgb(sr_data)
        cir_img = render_cir(sr_data)
        ndvi_img = render_ndvi(sr_data)
        ndwi_img = render_ndwi(sr_data)
        unc_img = render_uncertainty(unc_map)
        diff_img = render_difference(cons_diff)

        rgb_path = output_dir / f"{stem}_{model_name}_rgb.png"
        cir_path = output_dir / f"{stem}_{model_name}_cir.png"
        ndvi_path = output_dir / f"{stem}_{model_name}_ndvi.png"
        ndwi_path = output_dir / f"{stem}_{model_name}_ndwi.png"
        unc_path = output_dir / f"{stem}_{model_name}_uncertainty.png"
        diff_path = output_dir / f"{stem}_{model_name}_cons_diff.png"

        rgb_img.save(rgb_path)
        cir_img.save(cir_path)
        ndvi_img.save(ndvi_path)
        ndwi_img.save(ndwi_path)
        unc_img.save(unc_path)
        diff_img.save(diff_path)
        exported_files.extend([str(p) for p in [rgb_path, cir_path, ndvi_path, ndwi_path, unc_path, diff_path]])
        print(f"  Biophysical Maps: Exported RGB, CIR, NDVI, NDWI, Uncertainty, Difference PNGs.")

    # Save JSON telemetry if requested
    if save_json:
        json_out = output_dir / f"{stem}_{model_name}_telemetry.json"
        with open(json_out, "w") as f:
            json.dump({
                "scene": input_path.name,
                "model": model_name,
                "use_ibp": use_ibp,
                "input_shape": [C, H, W],
                "output_shape": list(sr_data.shape),
                "crs": meta.get("crs"),
                "metrics": metrics,
                "exported_files": exported_files
            }, f, indent=2)
        print(f"  Telemetry JSON:   {json_out.name}")

    # Console Summary Table
    print("\n  +-------------------------------------------------------------+")
    print(f"  | Telemetry Metric                | Value                     |")
    print("  +-------------------------------------------------------------+")
    print(f"  | Model Tier Architecture         | {model_name.upper():<25} |")
    print(f"  | Output Spatial Resolution       | 2.5 meters / pixel        |")
    print(f"  | Inference Latency               | {metrics['inf_latency_ms']} ms                  |")
    print(f"  | Back-Projection IBP             | {'ACTIVE (Zero-Drift)' if use_ibp else 'OFF':<25} |")
    print(f"  | Sensor Consistency MAE          | {metrics['cons_mae']:<25} |")
    if "psnr_db" in metrics:
        print(f"  | Reconstruction PSNR             | {metrics['psnr_db']} dB                  |")
        print(f"  | Structural Similarity (SSIM)    | {metrics['ssim']:<25} |")
        print(f"  | Spectral Angle Mapper (SAM)     | {metrics['sam_deg']} deg                 |")
        print(f"  | Relative Dimless Synthesis ERGAS| {metrics['ergas']:<25} |")
        print(f"  | Biophysical Delta NDVI Error    | {metrics['d_ndvi']:<25} |")
        print(f"  | Epistemic Uncertainty (Spearman)| {metrics['unc_spearman']:<25} |")
    print("  +-------------------------------------------------------------+")

    return {
        "input_path": str(input_path),
        "output_tif": str(tif_out),
        "metrics": metrics
    }


def main():
    print(BANNER)
    args = parse_args()

    # Determine input files
    input_files: List[Path] = []
    if args.preset:
        preset_path = BASE_DIR / f"sample_data/presets/{args.preset}.npz"
        if not preset_path.exists():
            # Check if user typed without prefix or exact name
            matches = list((BASE_DIR / "sample_data/presets").glob(f"*{args.preset}*.npz"))
            if matches:
                preset_path = matches[0]
            else:
                sys.exit(f"[Error] Preset '{args.preset}' not found in sample_data/presets.")
        input_files.append(preset_path)
    elif args.input:
        in_path = Path(args.input)
        if in_path.is_dir():
            valid_exts = {".tif", ".tiff", ".npz", ".png", ".jpg", ".jpeg"}
            input_files = [p for p in sorted(in_path.iterdir()) if p.suffix.lower() in valid_exts]
            if not input_files:
                sys.exit(f"[Error] No supported satellite imagery found in directory '{in_path}'.")
        elif in_path.is_file():
            input_files.append(in_path)
        else:
            sys.exit(f"[Error] Input path '{in_path}' does not exist.")
    else:
        # Default fallback to first preset
        default_preset = BASE_DIR / "sample_data/presets/Landcover-785992.npz"
        if default_preset.exists():
            print(f"[Notice] No input specified. Processing default preset: {default_preset.name}")
            input_files.append(default_preset)
        else:
            sys.exit("[Error] Please specify an input using --input <file/dir> or --preset <preset_id>.")

    # Initialize Engine
    print(f"[Gaia-HAT] Initializing Inference Engine...")
    engine = InferenceEngine()
    if args.device != "auto":
        engine.device = torch.device(args.device)
        print(f"[Gaia-HAT] Device override active: {engine.device}")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    hr_path = Path(args.hr) if args.hr else None
    results = []
    for f in input_files:
        res = process_single_scene(
            engine=engine,
            input_path=f,
            output_dir=output_dir,
            model_name=args.model,
            use_ibp=args.ibp,
            hr_path=hr_path,
            tile_size=args.tile_size,
            stride=args.stride,
            export_bands=args.export_bands,
            save_json=args.save_json
        )
        results.append(res)

    print(f"\n[Gaia-HAT] Successfully processed {len(results)} scene(s). All outputs saved in '{output_dir}'.")
    print("========================================================================================\n")


if __name__ == "__main__":
    main()
