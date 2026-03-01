"""
MANDIMITRA - Buyer Module (MongoDB)
======================================
Buyer sets daily crop prices at their market.
Farmer queries market + crop to find buyers with best prices.

Collections:
  daily_prices  – One doc per buyer+crop+market (upserted daily)

Endpoints:
  POST   /api/buyer/prices           Set/update today's price for a crop
  GET    /api/buyer/my-prices        Buyer's own active price listings
  DELETE /api/buyer/prices/{price_id} Remove a listing
  GET    /api/buyer/markets          All distinct markets (from buyer profiles)
  GET    /api/buyer/crops            Predefined crop list
  GET    /api/buyer/search           Farmer: search buyers by market + crop
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field

from api.database import get_db, utcnow
from api.auth import _decode_token, _get_profile

logger = logging.getLogger("mandimitra-buyer")

router = APIRouter(prefix="/api/buyer", tags=["Buyer Marketplace"])

# ---------------------------------------------------------------------------
# Predefined crops (Marathi + English)
# ---------------------------------------------------------------------------
CROPS = [
    {"id": "rice", "name_mr": "तांदूळ (भात)", "name_en": "Rice"},
    {"id": "wheat", "name_mr": "गहू", "name_en": "Wheat"},
    {"id": "corn", "name_mr": "मका", "name_en": "Corn / Maize"},
    {"id": "soybean", "name_mr": "सोयाबीन", "name_en": "Soybean"},
    {"id": "cotton", "name_mr": "कापूस", "name_en": "Cotton"},
    {"id": "sugarcane", "name_mr": "ऊस", "name_en": "Sugarcane"},
    {"id": "onion", "name_mr": "कांदा", "name_en": "Onion"},
    {"id": "potato", "name_mr": "बटाटा", "name_en": "Potato"},
    {"id": "tomato", "name_mr": "टोमॅटो", "name_en": "Tomato"},
    {"id": "groundnut", "name_mr": "भुईमूग", "name_en": "Groundnut"},
    {"id": "tur_dal", "name_mr": "तूर डाळ", "name_en": "Tur / Pigeon Pea"},
    {"id": "gram", "name_mr": "हरभरा", "name_en": "Gram / Chickpea"},
    {"id": "jowar", "name_mr": "ज्वारी", "name_en": "Jowar / Sorghum"},
    {"id": "bajra", "name_mr": "बाजरी", "name_en": "Bajra / Pearl Millet"},
    {"id": "banana", "name_mr": "केळी", "name_en": "Banana"},
    {"id": "grapes", "name_mr": "द्राक्षे", "name_en": "Grapes"},
    {"id": "pomegranate", "name_mr": "डाळिंब", "name_en": "Pomegranate"},
    {"id": "turmeric", "name_mr": "हळद", "name_en": "Turmeric"},
    {"id": "chilli", "name_mr": "मिरची", "name_en": "Chilli"},
    {"id": "milk", "name_mr": "दूध", "name_en": "Milk"},
]

# Predefined Maharashtra markets
MARKETS = [
    "पुणे मंडी",
    "नाशिक मंडी",
    "नागपूर मंडी",
    "औरंगाबाद मंडी",
    "सोलापूर मंडी",
    "कोल्हापूर मंडी",
    "सांगली मंडी",
    "अमरावती मंडी",
    "अकोला मंडी",
    "लातूर मंडी",
    "जळगाव मंडी",
    "अहमदनगर मंडी",
    "सातारा मंडी",
    "बारामती मंडी",
    "मालेगाव मंडी",
    "वाशी (नवी मुंबई) मंडी",
    "मुंबई APMC मंडी",
    "पिंपळगाव बसवंत मंडी",
    "शिर्डी मंडी",
    "परभणी मंडी",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _require_buyer(authorization: str) -> dict:
    """Extract user from JWT and ensure role is buyer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    user_id = payload["sub"]
    profile = await _get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile.get("role") != "buyer":
        raise HTTPException(403, "Only buyer accounts can access this endpoint")
    return profile


async def _require_farmer(authorization: str) -> dict:
    """Extract user from JWT and ensure role is farmer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    user_id = payload["sub"]
    profile = await _get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile.get("role") != "farmer":
        raise HTTPException(403, "Only farmer accounts can access this endpoint")
    return profile


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class SetPriceRequest(BaseModel):
    crop_id: str
    crop_name: str
    market_name: str
    price_per_quintal: float = Field(..., gt=0)


class UpdatePriceRequest(BaseModel):
    price_per_quintal: float = Field(..., gt=0)


# ---------------------------------------------------------------------------
# Buyer Endpoints
# ---------------------------------------------------------------------------

@router.post("/prices")
async def set_price(req: SetPriceRequest, authorization: str = Header(None)):
    """Buyer sets/updates today's price for a crop at their market.
    Uses upsert so the buyer only has one active price per crop+market."""
    buyer = await _require_buyer(authorization)
    db = await get_db()

    now = utcnow()
    price_doc = {
        "buyer_id": buyer["id"],
        "buyer_name": buyer.get("full_name", ""),
        "buyer_phone": buyer.get("phone", ""),
        "business_name": buyer.get("business_name", ""),
        "market_name": req.market_name,
        "crop_id": req.crop_id,
        "crop_name": req.crop_name,
        "price_per_quintal": req.price_per_quintal,
        "updated_at": now,
    }

    # Upsert: one listing per buyer + crop + market
    result = await db.daily_prices.update_one(
        {
            "buyer_id": buyer["id"],
            "crop_id": req.crop_id,
            "market_name": req.market_name,
        },
        {
            "$set": price_doc,
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now},
        },
        upsert=True,
    )

    action = "updated" if result.matched_count > 0 else "created"
    logger.info(f"✅ Price {action}: buyer={buyer['id']}, crop={req.crop_id}, market={req.market_name}, ₹{req.price_per_quintal}")

    return {"message": f"किंमत {action} यशस्वी", "action": action}


@router.get("/my-prices")
async def get_my_prices(authorization: str = Header(None)):
    """Buyer's own active price listings."""
    buyer = await _require_buyer(authorization)
    db = await get_db()

    cursor = db.daily_prices.find(
        {"buyer_id": buyer["id"]},
        {"_id": 0},
    ).sort("updated_at", -1)

    prices = await cursor.to_list(length=100)
    return {"prices": prices}


@router.delete("/prices/{price_id}")
async def delete_price(price_id: str, authorization: str = Header(None)):
    """Remove a price listing."""
    buyer = await _require_buyer(authorization)
    db = await get_db()

    result = await db.daily_prices.delete_one(
        {"id": price_id, "buyer_id": buyer["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Price listing not found")

    return {"message": "किंमत काढून टाकली"}


# ---------------------------------------------------------------------------
# Shared Endpoints (used by both buyer and farmer)
# ---------------------------------------------------------------------------

@router.get("/markets")
async def get_markets():
    """Return predefined markets + any custom markets from buyer profiles."""
    db = await get_db()

    # Get distinct markets from buyer profiles
    custom_markets = await db.profiles.distinct(
        "market_name",
        {"role": "buyer", "market_name": {"$exists": True, "$ne": None, "$ne": ""}},
    )

    # Merge predefined + custom, deduplicate
    all_markets = list(dict.fromkeys(MARKETS + [m for m in custom_markets if m]))
    return {"markets": all_markets}


@router.get("/crops")
async def get_crops():
    """Return the predefined crop list."""
    return {"crops": CROPS}


@router.get("/search")
async def search_buyers(
    market: str = Query(..., description="Market name"),
    crop: str = Query(..., description="Crop ID"),
    authorization: str = Header(None),
):
    """Farmer searches for buyers at a specific market for a specific crop.
    Returns buyer info with their prices, sorted by best (highest) price first."""
    # Validate that this is a logged-in user (farmer)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    _decode_token(token)  # just validate token

    db = await get_db()

    cursor = db.daily_prices.find(
        {
            "market_name": market,
            "crop_id": crop,
        },
        {"_id": 0},
    ).sort("price_per_quintal", -1)  # Best price first

    results = await cursor.to_list(length=50)

    return {
        "market": market,
        "crop": crop,
        "buyers": results,
        "count": len(results),
    }
