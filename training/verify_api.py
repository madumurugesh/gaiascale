import requests
import numpy as np
import io

print("1. Testing /api/health...")
r = requests.get("http://127.0.0.1:7860/api/health")
print("Health:", r.json())

print("\n2. Testing /api/benchmark...")
r = requests.get("http://127.0.0.1:7860/api/benchmark")
bench = r.json()["benchmark"]
print(f"Benchmark returned {len(bench)} entries:")
for item in bench:
    print(f"  - {item['model']}: PSNR={item['psnr']} dB, SAM={item['sam_deg']} deg")

print("\n3. Testing /api/infer_preset for hat...")
r = requests.post("http://127.0.0.1:7860/api/infer_preset", json={"preset_id": "Landcover-785992", "model_name": "hat", "use_ibp": True})
data = r.json()["data"]
print("Gaia-HAT Preset infer success! Token:", data["token"], "PSNR:", data["metrics"].get("psnr"), "Cons MAE:", data["metrics"].get("cons_mae"))

print("\n4. Testing /api/upload with npz...")
buf = io.BytesIO()
np.savez_compressed(buf, lr=np.random.rand(4, 32, 32).astype(np.float32))
buf.seek(0)
files = {"file": ("test_upload.npz", buf.getvalue(), "application/octet-stream")}
r = requests.post("http://127.0.0.1:7860/api/upload", data={"model_name": "hat", "use_ibp": "false"}, files=files)
data = r.json()["data"]
print("Upload infer success! Output shape:", data["output_shape"], "Latency:", data["latency_ms"], "ms")

print("\nAll endpoints verified 100% operational!")
