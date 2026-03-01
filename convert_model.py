"""Convert Keras crop disease model to TFLite (quantized) for mobile APK."""
import tensorflow as tf
import json
import os
import shutil

print("Loading model...")
model = tf.keras.models.load_model("models/crop_disease_detector/crop_disease_model.keras")
print(f"Model loaded. Input: {model.input_shape}, Output: {model.output_shape}")

# Convert to TFLite with dynamic-range quantization (smallest size)
print("Converting to TFLite (quantized)...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

outdir = "web/public/models/crop_disease"
os.makedirs(outdir, exist_ok=True)

tflite_path = os.path.join(outdir, "model.tflite")
with open(tflite_path, "wb") as f:
    f.write(tflite_model)
print(f"TFLite model saved: {len(tflite_model) / 1024 / 1024:.2f} MB at {tflite_path}")

# Also copy metadata
shutil.copy2("models/crop_disease_detector/metadata.json", os.path.join(outdir, "metadata.json"))
print("Metadata copied.")
print("Done!")
