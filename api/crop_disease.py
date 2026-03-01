"""
MANDIMITRA — Crop Disease Detection API
========================================
POST /api/crop-disease/analyze   Upload crop image → CNN prediction + Gemini advice
GET  /api/crop-disease/classes   List supported crops and diseases
"""

import io
import json
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from PIL import Image

load_dotenv()

logger = logging.getLogger("mandimitra-api")

router = APIRouter(prefix="/api/crop-disease", tags=["Crop Disease Detection"])

# ============================================================================
# MODEL LOADING (lazy, loaded once on first request)
# ============================================================================

_model = None
_metadata = None
_class_names = None
_IMG_SIZE = 224

MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "crop_disease_detector"


def _load_model():
    """Load the trained Keras model and metadata (once)."""
    global _model, _metadata, _class_names

    if _model is not None:
        return

    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
    import tensorflow as tf

    model_path = MODEL_DIR / "crop_disease_model.keras"
    meta_path = MODEL_DIR / "metadata.json"

    if not model_path.exists():
        raise RuntimeError(f"Model not found at {model_path}. Run train_crop_disease_model.py first.")

    logger.info(f"Loading crop disease model from {model_path}...")
    _model = tf.keras.models.load_model(str(model_path))

    with open(meta_path) as f:
        _metadata = json.load(f)

    _class_names = _metadata["class_names"]
    logger.info(f"Crop disease model loaded: {len(_class_names)} classes, "
                f"accuracy={_metadata['val_accuracy']:.4f}")


# ============================================================================
# CLASS NAME PARSING
# ============================================================================

# Known crops in the dataset
_KNOWN_CROPS = {"Corn", "Potato", "Rice", "Sugarcane", "Wheat"}


def _parse_class_name(class_name: str) -> tuple[str, str]:
    """Parse 'Crop___Disease' or 'Crop_Disease' into (crop, disease)."""
    # Try triple-underscore separator first (most classes)
    if "___" in class_name:
        parts = class_name.split("___", 1)
        return parts[0], parts[1]
    # Fallback: match known crop prefixes for single-underscore classes (Sugarcane)
    for crop in _KNOWN_CROPS:
        if class_name.startswith(crop + "_") or class_name.startswith(crop + " "):
            disease = class_name[len(crop) + 1:]
            return crop, disease
    return class_name, "Unknown"


# ============================================================================
# IMAGE PREPROCESSING
# ============================================================================

def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Load image bytes, resize to 224x224, return as batch tensor."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((_IMG_SIZE, _IMG_SIZE), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    # MobileNetV2 preprocess_input expects [0, 255] and handles normalization
    return np.expand_dims(arr, axis=0)  # shape: (1, 224, 224, 3)


# ============================================================================
# GEMINI API INTEGRATION
# ============================================================================

def _get_gemini_advice(crop: str, disease: str, confidence: float) -> dict:
    """Call Gemini API for detailed disease description and treatment advice."""
    api_key = os.getenv("Gemini_API_KEY")
    if not api_key:
        logger.warning("Gemini_API_KEY not set, returning fallback advice")
        return _fallback_advice(crop, disease)

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        is_healthy = "healthy" in disease.lower()

        if is_healthy:
            prompt = f"""You are an expert agricultural scientist. A farmer uploaded an image of their {crop} crop.
The AI analysis detected: **{disease}** with {confidence:.0%} confidence.

The crop appears healthy. Please provide:
1. A brief confirmation that the crop looks healthy (2-3 sentences)
2. 3-4 preventive care tips to maintain crop health
3. Best practices for this specific crop

Respond in this exact JSON format:
{{
  "status": "healthy",
  "summary": "Brief description of crop health status",
  "description": "Detailed health assessment (3-4 sentences)",
  "preventive_tips": ["tip1", "tip2", "tip3"],
  "recommended_actions": ["action1", "action2"]
}}

Respond ONLY with the JSON, no markdown code fences."""
        else:
            prompt = f"""You are an expert agricultural scientist and plant pathologist. A farmer uploaded an image of their {crop} crop.
The AI analysis detected: **{disease}** with {confidence:.0%} confidence.

Please provide comprehensive guidance:
1. What is this disease? (2-3 sentence description)
2. What causes it? (pathogen, environmental conditions)
3. Symptoms to look for
4. Treatment steps (medicines, dosages, application methods)
5. Preventive measures for the future
6. Severity assessment (mild/moderate/severe)

Respond in this exact JSON format:
{{
  "status": "diseased",
  "disease_name": "Common name of the disease",
  "summary": "One-line summary of the problem",
  "description": "Detailed description of the disease (3-4 sentences)",
  "causes": "What causes this disease",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "treatment": [
    {{
      "method": "Chemical/Organic/Cultural",
      "name": "Treatment name",
      "details": "How to apply, dosage, frequency"
    }}
  ],
  "preventive_tips": ["tip1", "tip2", "tip3"],
  "severity": "mild/moderate/severe",
  "recommended_actions": ["Immediate action 1", "Action 2"]
}}

Respond ONLY with the JSON, no markdown code fences."""

        # Try multiple models in case one has quota issues
        models_to_try = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]
        last_error = None

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                text = response.text.strip()
                # Strip markdown code fences if present
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text[:-3]
                    text = text.strip()

                advice = json.loads(text)
                logger.info(f"Gemini advice generated using model: {model_name}")
                return advice

            except json.JSONDecodeError as e:
                logger.error(f"Gemini ({model_name}) returned non-JSON: {e}")
                return _fallback_advice(crop, disease)
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini model {model_name} failed: {e}")
                continue

        logger.error(f"All Gemini models failed. Last error: {last_error}")
        return _fallback_advice(crop, disease)

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _fallback_advice(crop, disease)


def _fallback_advice(crop: str, disease: str) -> dict:
    """Provide basic advice if Gemini is unavailable."""
    is_healthy = "healthy" in disease.lower()
    if is_healthy:
        return {
            "status": "healthy",
            "summary": f"Your {crop} crop appears healthy.",
            "description": f"The analysis indicates your {crop} crop is in good health. No diseases were detected.",
            "preventive_tips": [
                "Continue regular watering and fertilization",
                "Monitor for any changes in leaf color or texture",
                "Maintain proper spacing between plants for air circulation",
            ],
            "recommended_actions": [
                "Continue current farming practices",
                "Schedule next health check in 2 weeks",
            ],
        }
    else:
        return {
            "status": "diseased",
            "disease_name": disease.replace("_", " "),
            "summary": f"Your {crop} crop may be affected by {disease.replace('_', ' ')}.",
            "description": f"The AI detected signs of {disease.replace('_', ' ')} in your {crop} crop. Please consult a local agricultural officer for detailed guidance.",
            "causes": "Various environmental and pathogenic factors",
            "symptoms": ["Visible spots or discoloration on leaves", "Possible wilting or yellowing"],
            "treatment": [
                {
                    "method": "Consult Expert",
                    "name": "Professional Consultation",
                    "details": "Visit your nearest agricultural extension office for specific treatment recommendations.",
                }
            ],
            "preventive_tips": [
                "Ensure proper drainage",
                "Avoid overcrowding of plants",
                "Use disease-resistant varieties when possible",
            ],
            "severity": "moderate",
            "recommended_actions": [
                "Consult a local agricultural officer immediately",
                "Isolate affected plants if possible",
            ],
        }


# ============================================================================
# HELPER: AUTH
# ============================================================================

async def _require_user(authorization: Optional[str]) -> dict:
    """Validate token and return user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")

    from api.auth import _decode_token, _get_profile

    payload = _decode_token(token)
    uid = payload.get("sub")
    profile = await _get_profile(uid)
    if not profile:
        raise HTTPException(401, "Invalid or expired token")
    return profile


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/analyze")
async def analyze_crop_disease(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    """
    Upload a crop leaf image → get disease prediction + Gemini-powered advice.
    Returns crop name, disease (or healthy), confidence, and detailed treatment guidance.
    """
    user = await _require_user(authorization)

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files (JPG, PNG) are accepted")

    # Read and validate size (max 10 MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10 MB")

    # Load model (lazy)
    _load_model()

    # Preprocess and predict
    img_tensor = _preprocess_image(content)
    predictions = _model.predict(img_tensor, verbose=0)[0]

    # Get top prediction
    top_idx = int(np.argmax(predictions))
    confidence = float(predictions[top_idx])
    predicted_class = _class_names[top_idx]

    # Parse crop and disease from class name
    # Most classes use "Crop___Disease" but Sugarcane uses "Sugarcane_Disease"
    crop, disease = _parse_class_name(predicted_class)

    # Get top 3 predictions
    top3_indices = np.argsort(predictions)[-3:][::-1]
    top3 = [
        {
            "class": _class_names[i],
            "confidence": round(float(predictions[i]) * 100, 1),
        }
        for i in top3_indices
    ]

    is_healthy = "healthy" in disease.lower()

    logger.info(
        f"🌿 Crop disease analysis: {predicted_class} ({confidence:.1%}) "
        f"for user {user.get('full_name', user['id'])}"
    )

    # Get Gemini advice
    advice = _get_gemini_advice(crop, disease, confidence)

    return {
        "crop": crop,
        "disease": disease.replace("_", " ") if not is_healthy else None,
        "is_healthy": is_healthy,
        "predicted_class": predicted_class,
        "confidence": round(confidence * 100, 1),
        "top_predictions": top3,
        "advice": advice,
        "model_accuracy": round(_metadata["val_accuracy"] * 100, 1),
    }


@router.get("/classes")
async def get_supported_classes():
    """Return list of supported crops and their diseases."""
    _load_model()

    # Group by crop
    crops = {}
    for cls in _class_names:
        crop, condition = _parse_class_name(cls)
        if crop not in crops:
            crops[crop] = []
        crops[crop].append(condition.replace("_", " "))

    return {
        "total_classes": len(_class_names),
        "crops": crops,
        "model_accuracy": round(_metadata["val_accuracy"] * 100, 1),
    }
