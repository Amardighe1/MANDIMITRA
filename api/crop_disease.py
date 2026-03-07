"""
MANDIMITRA — Crop Disease Detection API
========================================
POST /api/crop-disease/analyze   Upload crop image → Gemini Vision classification + advice
GET  /api/crop-disease/classes   List supported crops and diseases
"""

import base64
import io
import json
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from PIL import Image

load_dotenv()

logger = logging.getLogger("mandimitra-api")

router = APIRouter(prefix="/api/crop-disease", tags=["Crop Disease Detection"])

# ============================================================================
# DISEASE KNOWLEDGE BASE (medicines, soil minerals, prevention)
# ============================================================================

_disease_kb = None
_KB_PATH = Path(__file__).resolve().parent.parent / "configs" / "disease_knowledge_base.json"


def _load_knowledge_base():
    """Load the disease treatment knowledge base (once)."""
    global _disease_kb
    if _disease_kb is not None:
        return
    if _KB_PATH.exists():
        with open(_KB_PATH, encoding="utf-8") as f:
            _disease_kb = json.load(f)
        logger.info(f"Disease knowledge base loaded: {len(_disease_kb) - 1} entries")
    else:
        logger.warning(f"Disease knowledge base not found at {_KB_PATH}")
        _disease_kb = {}


def _get_disease_treatment(predicted_class: str) -> dict | None:
    """Get treatment info (medicines, soil minerals) for a predicted class."""
    _load_knowledge_base()
    entry = _disease_kb.get(predicted_class)
    if not entry or predicted_class == "_meta":
        return None
    return {
        "disease_name_en": entry.get("disease_name_en"),
        "disease_name_mr": entry.get("disease_name_mr"),
        "pathogen": entry.get("pathogen"),
        "severity": entry.get("severity"),
        "summary_mr": entry.get("summary_mr"),
        "medicines": entry.get("medicines"),
        "soil_minerals": entry.get("soil_minerals"),
    }

# ============================================================================
# CLASS NAMES (17 classes from trained MobileNetV2 model)
# ============================================================================

_CLASS_NAMES = [
    "Corn___Common_Rust",
    "Corn___Gray_Leaf_Spot",
    "Corn___Healthy",
    "Corn___Northern_Leaf_Blight",
    "Potato___Early_Blight",
    "Potato___Healthy",
    "Potato___Late_Blight",
    "Rice___Brown_Spot",
    "Rice___Healthy",
    "Rice___Leaf_Blast",
    "Rice___Neck_Blast",
    "Sugarcane_Bacterial Blight",
    "Sugarcane_Healthy",
    "Sugarcane_Red Rot",
    "Wheat___Brown_Rust",
    "Wheat___Healthy",
    "Wheat___Yellow_Rust",
]

_MODEL_ACCURACY = 93.5  # Reported accuracy of the trained model


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
# GEMINI VISION API — Image Classification + Advice
# ============================================================================

def _analyze_with_gemini(image_bytes: bytes) -> dict:
    """Use Gemini Vision API to classify crop disease from image AND provide advice."""
    api_key = os.getenv("Gemini_API_KEY")
    if not api_key:
        raise HTTPException(503, "Gemini API key not configured on server")

    from google import genai

    client = genai.Client(api_key=api_key)

    class_list = ", ".join(_CLASS_NAMES)

    prompt = f"""You are an expert agricultural scientist and plant pathologist.

Analyze this crop leaf image and classify it into EXACTLY ONE of these classes:
{class_list}

Then provide disease advice.

Respond in this EXACT JSON format (no markdown fences):
{{
  "predicted_class": "exact class name from the list above",
  "confidence": 85.0,
  "top_predictions": [
    {{"class": "most likely class", "confidence": 85.0}},
    {{"class": "second most likely", "confidence": 10.0}},
    {{"class": "third most likely", "confidence": 5.0}}
  ],
  "advice": {{
    "status": "healthy or diseased",
    "summary": "One-line summary",
    "description": "Detailed description (3-4 sentences)",
    "disease_name": "Common name of disease (null if healthy)",
    "causes": "What causes this (null if healthy)",
    "symptoms": ["symptom1", "symptom2"],
    "treatment": [
      {{"method": "Chemical/Organic/Cultural", "name": "Treatment name", "details": "How to apply"}}
    ],
    "preventive_tips": ["tip1", "tip2", "tip3"],
    "severity": "mild/moderate/severe (null if healthy)",
    "recommended_actions": ["action1", "action2"]
  }}
}}

IMPORTANT: predicted_class MUST be exactly one of the listed classes. Confidence should reflect your certainty (0-100)."""

    # Encode image for Gemini
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Detect mime type
    img = Image.open(io.BytesIO(image_bytes))
    fmt = img.format or "JPEG"
    mime_map = {"JPEG": "image/jpeg", "JPG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    mime_type = mime_map.get(fmt.upper(), "image/jpeg")

    models_to_try = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    {
                        "role": "user",
                        "parts": [
                            {"inline_data": {"mime_type": mime_type, "data": img_b64}},
                            {"text": prompt},
                        ],
                    }
                ],
            )

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

            result = json.loads(text)

            # Validate predicted_class is in our list
            if result.get("predicted_class") not in _CLASS_NAMES:
                # Find closest match
                pred = result.get("predicted_class", "")
                for cls in _CLASS_NAMES:
                    if pred.lower().replace(" ", "_") == cls.lower().replace(" ", "_"):
                        result["predicted_class"] = cls
                        break
                else:
                    # Default to first match or healthy
                    logger.warning(f"Gemini returned unknown class: {pred}")

            logger.info(f"Gemini Vision classified: {result.get('predicted_class')} using {model_name}")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Gemini ({model_name}) returned non-JSON: {e}")
            last_error = e
            continue
        except Exception as e:
            last_error = e
            logger.warning(f"Gemini model {model_name} failed: {e}")
            continue

    raise HTTPException(503, f"AI analysis temporarily unavailable: {last_error}")


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
    Upload a crop leaf image -> Gemini Vision classification + advice.
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

    # Classify with Gemini Vision API
    gemini_result = _analyze_with_gemini(content)

    predicted_class = gemini_result.get("predicted_class", _CLASS_NAMES[2])
    confidence = gemini_result.get("confidence", 0)
    top_predictions = gemini_result.get("top_predictions", [])
    advice = gemini_result.get("advice", {})

    # Parse crop and disease from class name
    crop, disease = _parse_class_name(predicted_class)
    is_healthy = "healthy" in disease.lower()

    logger.info(
        f"Crop disease analysis: {predicted_class} ({confidence}%) "
        f"for user {user.get('full_name', user['id'])}"
    )

    # Get structured treatment info from knowledge base
    treatment = _get_disease_treatment(predicted_class)

    result = {
        "crop": crop,
        "disease": disease.replace("_", " ") if not is_healthy else None,
        "is_healthy": is_healthy,
        "predicted_class": predicted_class,
        "confidence": round(confidence, 1),
        "top_predictions": top_predictions,
        "advice": advice,
        "model_accuracy": _MODEL_ACCURACY,
    }
    if treatment:
        result["treatment"] = treatment

    return result


@router.get("/classes")
async def get_supported_classes():
    """Return list of supported crops and their diseases."""
    crops = {}
    for cls in _CLASS_NAMES:
        crop, condition = _parse_class_name(cls)
        if crop not in crops:
            crops[crop] = []
        crops[crop].append(condition.replace("_", " "))

    return {
        "total_classes": len(_CLASS_NAMES),
        "crops": crops,
        "model_accuracy": _MODEL_ACCURACY,
    }


@router.get("/treatment/{disease_class}")
async def get_treatment_info(disease_class: str):
    """Return structured treatment info (medicines, soil minerals) for a disease class."""
    treatment = _get_disease_treatment(disease_class)
    if treatment is None:
        raise HTTPException(404, f"No treatment info for class '{disease_class}'")
    return treatment
