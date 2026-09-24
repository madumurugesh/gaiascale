import os
import sys
import numpy as np

# Ensure root in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.inference import InferenceEngine

def main():
    print("=== Testing Gaia-HAT Inference Engine ===")
    engine = InferenceEngine()
    print("Detected models:", engine.available_models)
    assert "hat" in engine.available_models, "hat missing!"

    dummy_lr = np.random.rand(4, 64, 64).astype(np.float32)

    for m in ["bicubic", "hat"]:
        print(f"\n--- Testing Model: {m} ---")
        res = engine.run_on_input(dummy_lr, model_name=m, use_ibp=False)
        print(f"Success! Output shape: {res['output_shape']}, Time: {res['latency_ms']:.1f} ms")
        print(f"Consistency MAE: {res['metrics']['cons_mae']:.6f}")

    print("\nGaia-HAT + bicubic baseline verified successfully!")

if __name__ == "__main__":
    main()
