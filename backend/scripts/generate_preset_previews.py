"""
Generates static preview PNGs for every bundled preset in sample_data/presets/.

For each Landcover-*.npz preset, runs the real GaiaScale-HAT inference pipeline
(the same code path used by the /api/upload endpoint) and writes out:
  - <id>_10m.png            -> true-color render of the raw Sentinel-2 (10 m) input
  - <id>_enhanced_2.5m.png  -> true-color render of the model's 4x super-resolved (2.5 m) output

Outputs land in frontend/src/assets/presets/ so the landing page can import
them as static assets (no live backend call needed for the marketing demo).

Run from the backend/ directory: python scripts/generate_preset_previews.py
"""

from __future__ import annotations

import base64
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR.parent))

from config import PRESETS_DIR
from services.inference import inference_engine

OUT_DIR = BACKEND_DIR.parent / "frontend" / "src" / "assets" / "presets"


def save_data_url(data_url: str, out_path: Path) -> None:
    header, b64data = data_url.split(",", 1)
    out_path.write_bytes(base64.b64decode(b64data))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    preset_files = sorted(PRESETS_DIR.glob("*.npz"))
    if not preset_files:
        print(f"No presets found in {PRESETS_DIR}")
        return

    for path in preset_files:
        preset_id = path.stem
        print(f"[{preset_id}] running inference...")
        result = inference_engine.run_user_file(path)
        images = result["images"]

        lr_out = OUT_DIR / f"{preset_id}_10m.png"
        sr_out = OUT_DIR / f"{preset_id}_enhanced_2.5m.png"

        save_data_url(images["lr_rgb"], lr_out)
        save_data_url(images["sr_rgb"], sr_out)

        print(f"  wrote {lr_out.relative_to(BACKEND_DIR.parent)}")
        print(f"  wrote {sr_out.relative_to(BACKEND_DIR.parent)}")

    print(f"\nDone. {len(preset_files)} presets rendered to {OUT_DIR}")


if __name__ == "__main__":
    main()
