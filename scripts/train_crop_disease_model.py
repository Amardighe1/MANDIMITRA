"""
MANDIMITRA — Crop Disease Detection Model Training
====================================================
Transfer learning with MobileNetV2 on the "Top Agriculture Crop Disease India" dataset.
Produces a lightweight model (~14 MB) suitable for real-time API serving.

Classes (17):
  Corn:      Common_Rust, Gray_Leaf_Spot, Healthy, Northern_Leaf_Blight
  Potato:    Early_Blight, Healthy, Late_Blight
  Rice:      Brown_Spot, Healthy, Leaf_Blast, Neck_Blast
  Sugarcane: Bacterial_Blight, Healthy, Red_Rot
  Wheat:     Brown_Rust, Healthy, Yellow_Rust

Usage:
  python scripts/train_crop_disease_model.py
"""

import json
import logging
import os
import sys
from pathlib import Path

import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Suppress TF info logs
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)

logger = logging.getLogger("crop-disease-trainer")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")

# ============================================================================
# CONFIG
# ============================================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "Crop Diseases"
MODEL_DIR = PROJECT_ROOT / "models" / "crop_disease_detector"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

IMG_SIZE = 224          # MobileNetV2 input size
BATCH_SIZE = 32
EPOCHS = 20             # Early stopping will cut this short if converged
VALIDATION_SPLIT = 0.2
SEED = 42

# ============================================================================
# DATA LOADING
# ============================================================================

def load_datasets():
    """Load train/val datasets with augmentation from directory structure."""
    logger.info(f"Loading images from: {DATA_DIR}")

    # Training set (80%)
    train_ds = keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=VALIDATION_SPLIT,
        subset="training",
        seed=SEED,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="categorical",
    )

    # Validation set (20%)
    val_ds = keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=VALIDATION_SPLIT,
        subset="validation",
        seed=SEED,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="categorical",
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    logger.info(f"Found {num_classes} classes: {class_names}")

    # Count samples
    train_count = sum(1 for _ in train_ds.unbatch())
    val_count = sum(1 for _ in val_ds.unbatch())
    logger.info(f"Training samples: {train_count}, Validation samples: {val_count}")

    # Performance optimization
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(AUTOTUNE)
    val_ds = val_ds.cache().prefetch(AUTOTUNE)

    return train_ds, val_ds, class_names, num_classes

# ============================================================================
# MODEL BUILDING
# ============================================================================

def build_model(num_classes: int):
    """MobileNetV2 with custom classification head."""

    # Data augmentation layer (applied during training only)
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.1),
    ], name="data_augmentation")

    # MobileNetV2 base (pre-trained on ImageNet)
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )

    # Freeze base initially (Phase 1: train head only)
    base_model.trainable = False

    # Build model
    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = data_augmentation(inputs)
    x = keras.applications.mobilenet_v2.preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs, outputs)
    return model, base_model

# ============================================================================
# COMPUTE CLASS WEIGHTS (handle imbalanced classes)
# ============================================================================

def compute_class_weights(train_ds, num_classes: int):
    """Compute balanced class weights for imbalanced dataset."""
    label_counts = np.zeros(num_classes)
    for _, labels in train_ds.unbatch():
        label_counts[np.argmax(labels.numpy())] += 1

    total = np.sum(label_counts)
    weights = {}
    for i in range(num_classes):
        if label_counts[i] > 0:
            weights[i] = total / (num_classes * label_counts[i])
        else:
            weights[i] = 1.0

    logger.info("Class weights:")
    for i, (cls, w) in enumerate(weights.items()):
        logger.info(f"  Class {i}: weight={w:.3f} (count={int(label_counts[i])})")

    return weights

# ============================================================================
# TRAINING
# ============================================================================

def train():
    """Full training pipeline: Phase 1 (head) + Phase 2 (fine-tune)."""
    train_ds, val_ds, class_names, num_classes = load_datasets()
    model, base_model = build_model(num_classes)

    class_weights = compute_class_weights(train_ds, num_classes)

    # === Phase 1: Train classification head only ===
    logger.info("=" * 60)
    logger.info("PHASE 1: Training classification head (base frozen)")
    logger.info("=" * 60)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks_p1 = [
        EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
    ]

    history_p1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=10,
        class_weight=class_weights,
        callbacks=callbacks_p1,
    )

    p1_acc = max(history_p1.history["val_accuracy"])
    logger.info(f"Phase 1 best val_accuracy: {p1_acc:.4f}")

    # === Phase 2: Fine-tune top layers of base model ===
    logger.info("=" * 60)
    logger.info("PHASE 2: Fine-tuning top layers of MobileNetV2")
    logger.info("=" * 60)

    base_model.trainable = True
    # Freeze all layers except the last 30 (fine-tune top layers only)
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks_p2 = [
        EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
        ModelCheckpoint(
            str(MODEL_DIR / "best_model.keras"),
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]

    history_p2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        class_weight=class_weights,
        callbacks=callbacks_p2,
    )

    p2_acc = max(history_p2.history["val_accuracy"])
    logger.info(f"Phase 2 best val_accuracy: {p2_acc:.4f}")

    # === Evaluate on validation set ===
    logger.info("=" * 60)
    logger.info("FINAL EVALUATION")
    logger.info("=" * 60)

    val_loss, val_acc = model.evaluate(val_ds)
    logger.info(f"Final validation loss: {val_loss:.4f}")
    logger.info(f"Final validation accuracy: {val_acc:.4f}")

    # Per-class prediction analysis
    y_true = []
    y_pred = []
    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_true.extend(np.argmax(labels.numpy(), axis=1))
        y_pred.extend(np.argmax(preds, axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Per-class accuracy
    per_class_metrics = {}
    for i, name in enumerate(class_names):
        mask = y_true == i
        if mask.sum() > 0:
            acc = (y_pred[mask] == i).mean()
            per_class_metrics[name] = {
                "accuracy": float(acc),
                "support": int(mask.sum()),
            }
            logger.info(f"  {name}: accuracy={acc:.4f} (n={mask.sum()})")

    # === Save model and metadata ===
    model.save(str(MODEL_DIR / "crop_disease_model.keras"))
    logger.info(f"Model saved to: {MODEL_DIR / 'crop_disease_model.keras'}")

    # Save class names
    metadata = {
        "class_names": class_names,
        "num_classes": num_classes,
        "img_size": IMG_SIZE,
        "val_accuracy": float(val_acc),
        "val_loss": float(val_loss),
        "phase1_best_acc": float(p1_acc),
        "phase2_best_acc": float(p2_acc),
        "per_class_metrics": per_class_metrics,
        "model_file": "crop_disease_model.keras",
        "architecture": "MobileNetV2 + custom head",
    }

    with open(MODEL_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Metadata saved to: {MODEL_DIR / 'metadata.json'}")
    logger.info("=" * 60)
    logger.info(f"TRAINING COMPLETE — Final accuracy: {val_acc:.4f}")
    logger.info("=" * 60)

    return model, class_names, metadata


if __name__ == "__main__":
    train()
