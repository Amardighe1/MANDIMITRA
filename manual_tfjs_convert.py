"""
Manual Keras → TF.js LayersModel converter.
Produces model.json + weight shard .bin files that @tensorflow/tfjs can load.
"""
import tensorflow as tf
import numpy as np
import json
import os
import struct

MODEL_PATH = "models/crop_disease_detector/crop_disease_model.keras"
OUT_DIR = "web/public/models/crop_disease"
SHARD_SIZE = 4 * 1024 * 1024  # 4MB per shard (mobile-friendly)

print("Loading Keras model...")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"  Input: {model.input_shape}, Output: {model.output_shape}")

# Get model topology as JSON (this IS the TF.js model_config format)
model_config = json.loads(model.to_json())

# Collect all weights
weights_manifest = []
weight_data = b""
weight_specs = []

for layer in model.layers:
    layer_weights = layer.get_weights()
    for i, w in enumerate(layer_weights):
        # Determine weight name
        weight_names = [v.name for v in layer.weights]
        name = weight_names[i] if i < len(weight_names) else f"{layer.name}/weight_{i}"
        # Clean up name (remove :0 suffix)
        name = name.replace(":0", "")
        
        weight_specs.append({
            "name": name,
            "shape": list(w.shape),
            "dtype": "float32",
        })
        weight_data += w.astype(np.float32).tobytes()

# Split into shards
os.makedirs(OUT_DIR, exist_ok=True)
shard_paths = []
total_bytes = len(weight_data)
num_shards = max(1, (total_bytes + SHARD_SIZE - 1) // SHARD_SIZE)

for i in range(num_shards):
    start = i * SHARD_SIZE
    end = min(start + SHARD_SIZE, total_bytes)
    shard_name = f"group1-shard{i + 1}of{num_shards}.bin"
    shard_path = os.path.join(OUT_DIR, shard_name)
    with open(shard_path, "wb") as f:
        f.write(weight_data[start:end])
    shard_paths.append(shard_name)
    print(f"  Wrote {shard_name}: {(end - start) / 1024 / 1024:.2f} MB")

# Build the TF.js model.json
manifest = [{
    "paths": shard_paths,
    "weights": weight_specs,
}]

tfjs_model = {
    "format": "layers-model",
    "generatedBy": "MANDIMITRA manual converter",
    "convertedBy": "manual_tfjs_convert.py",
    "modelTopology": model_config,
    "weightsManifest": manifest,
}

model_json_path = os.path.join(OUT_DIR, "model.json")
with open(model_json_path, "w") as f:
    json.dump(tfjs_model, f)
print(f"  Wrote model.json")

# Summary
total_size_mb = sum(
    os.path.getsize(os.path.join(OUT_DIR, p)) for p in shard_paths
) / 1024 / 1024
print(f"\nDone! Total weight size: {total_size_mb:.2f} MB in {num_shards} shard(s)")
print(f"Output directory: {OUT_DIR}")
