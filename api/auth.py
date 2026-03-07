"""
MANDIMITRA - Authentication Module (MongoDB + JWT)
====================================================
All auth handled server-side via MongoDB + JWT tokens.
Frontend NEVER talks to the database directly.

Roles:
  farmer  – Standard user, immediate access
  doctor  – Veterinary doctor, collects verification info
  admin   – 2-step login (Admin ID → email/password)

Endpoints:
  POST /api/auth/signup          Register farmer or doctor
  POST /api/auth/login           Login (farmer/doctor)
  POST /api/auth/admin/verify    Admin step 1: verify admin ID
  POST /api/auth/admin/login     Admin step 2: email + password
  GET  /api/auth/me              Current user profile from token
  POST /api/auth/logout          Logout
"""

import os
import logging
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from passlib.hash import bcrypt
import jwt as pyjwt

from api.database import get_db, utcnow

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mandimitra-auth")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "mandimitra-jwt-secret-2025-xK9pL3mQ7vR1wZ4y")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

ADMIN_ID = os.getenv("ADMIN_ID", "8830217352")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _create_token(user_id: str, email: str, role: str) -> str:
    """Create a signed JWT access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises on invalid/expired."""
    try:
        return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token has expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str
    phone: str
    role: str = Field(..., pattern="^(farmer|doctor|buyer)$")
    # Doctor-specific (required when role=doctor)
    veterinary_license: Optional[str] = None
    veterinary_college: Optional[str] = None
    specialization: Optional[str] = None
    years_of_experience: Optional[int] = None
    # Buyer-specific (required when role=buyer)
    business_name: Optional[str] = None
    market_name: Optional[str] = None
    district: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # "farmer" or "doctor" — from selected tab


class AdminVerifyRequest(BaseModel):
    admin_id: str


class AdminLoginRequest(BaseModel):
    admin_id: str
    email: str
    password: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_profile(user_id: str) -> Optional[dict]:
    """Fetch profile from MongoDB profiles collection."""
    try:
        db = await get_db()
        profile = await db.profiles.find_one({"id": user_id}, {"_id": 0})
        return profile
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return None


def _build_user_response(user_id: str, email: str, profile: Optional[dict]) -> dict:
    """Standard user dict for API responses."""
    if not profile:
        raise HTTPException(404, "User profile not found. Please sign up first.")
    return {
        "id": user_id,
        "email": email,
        "role": profile["role"],
        "full_name": profile.get("full_name", ""),
        "is_verified": profile.get("is_verified", False),
        "verification_status": profile.get("verification_status", "pending_verification"),
        "phone": profile.get("phone", ""),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup")
async def signup(req: SignupRequest):
    """Register a new farmer or doctor."""
    logger.info(f"📝 Signup request: email={req.email}, role={req.role}")

    # Validate doctor-specific fields
    if req.role == "doctor" and not req.veterinary_license:
        raise HTTPException(400, "Veterinary license number is required for doctors")

    # Validate buyer-specific fields
    if req.role == "buyer":
        if not req.business_name:
            raise HTTPException(400, "Business name is required for buyers")
        if not req.market_name:
            raise HTTPException(400, "Market name is required for buyers")

    db = await get_db()

    # Check duplicate email
    existing = await db.profiles.find_one({"email": req.email})
    if existing:
        raise HTTPException(409, "An account with this email already exists")

    try:
        uid = str(uuid.uuid4())
        password_hash = bcrypt.hash(req.password)

        # Build profile document
        profile = {
            "id": uid,
            "email": req.email,
            "password_hash": password_hash,
            "role": req.role,
            "full_name": req.full_name,
            "phone": req.phone,
            "is_verified": req.role in ("farmer", "buyer"),  # Farmers & buyers auto-verified
            "verification_status": "active" if req.role in ("farmer", "buyer") else "pending_verification",
            "created_at": utcnow(),
        }
        if req.role == "doctor":
            profile.update({
                "veterinary_license": req.veterinary_license,
                "veterinary_college": req.veterinary_college,
                "specialization": req.specialization,
                "years_of_experience": req.years_of_experience,
            })
        elif req.role == "buyer":
            profile.update({
                "business_name": req.business_name,
                "market_name": req.market_name,
                "district": req.district,
            })

        await db.profiles.insert_one(profile)
        logger.info(f"✅ User created: uid={uid}, role={req.role}")

        # Generate tokens
        access_token = _create_token(uid, req.email, req.role)
        refresh_token = _create_token(uid, req.email, req.role)

        saved = await _get_profile(uid)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": _build_user_response(uid, req.email, saved),
        }

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "duplicate" in msg.lower() or "E11000" in msg:
            raise HTTPException(409, "An account with this email already exists")
        logger.error(f"❌ Signup error: {e}")
        raise HTTPException(
            503,
            "नोंदणी अयशस्वी. सर्व्हर तात्पुरता अनुपलब्ध आहे. कृपया पुन्हा प्रयत्न करा. / Registration failed. Server temporarily unavailable."
        )


@router.post("/login")
async def login(req: LoginRequest):
    """Login for farmer / doctor."""
    logger.info(f"🔐 Login request: email={req.email}, selected_role={req.role}")
    try:
        db = await get_db()
        user_doc = await db.profiles.find_one({"email": req.email}, {"_id": 0})

        if not user_doc:
            raise HTTPException(401, "Invalid email or password")

        # Verify password
        if not bcrypt.verify(req.password, user_doc.get("password_hash", "")):
            raise HTTPException(401, "Invalid email or password")

        uid = user_doc["id"]
        db_role = user_doc.get("role", "unknown")
        logger.info(f"✅ Login: uid={uid}, db_role={db_role}, selected_role={req.role}")

        # Prevent admin from logging in through the farmer/doctor form
        if db_role == "admin":
            raise HTTPException(403, "Admin accounts must use the Admin login tab")

        # If frontend sent a role, validate it matches the stored profile role
        if req.role and db_role != req.role:
            raise HTTPException(
                403,
                f"This account is registered as a {db_role}. Please use the {db_role.title()} tab to log in."
            )

        access_token = _create_token(uid, req.email, db_role)
        refresh_token = _create_token(uid, req.email, db_role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": _build_user_response(uid, req.email, user_doc),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        raise HTTPException(
            503,
            "\u0938\u0930\u094d\u0935\u094d\u0939\u0930 \u0924\u093e\u0924\u094d\u092a\u0941\u0930\u0924\u093e \u0905\u0928\u0941\u092a\u0932\u092c\u094d\u0927 \u0906\u0939\u0947. \u0915\u0943\u092a\u092f\u093e \u0915\u093e\u0939\u0940 \u0938\u0947\u0915\u0902\u0926\u093e\u0902\u0928\u0940 \u092a\u0941\u0928\u094d\u0939\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928 \u0915\u0930\u093e. / Server temporarily unavailable. Please try again shortly."
        )


@router.post("/admin/verify")
async def admin_verify(req: AdminVerifyRequest):
    """Step 1 – verify the admin ID before showing credentials form."""
    if req.admin_id != ADMIN_ID:
        raise HTTPException(403, "Invalid Admin ID")
    return {"verified": True}


@router.post("/admin/login")
async def admin_login(req: AdminLoginRequest):
    """Step 2 – admin email + password (after ID verified)."""
    if req.admin_id != ADMIN_ID:
        raise HTTPException(403, "Invalid Admin ID")

    try:
        db = await get_db()
        user_doc = await db.profiles.find_one({"email": req.email}, {"_id": 0})

        if not user_doc:
            raise HTTPException(401, "Invalid admin credentials")

        if not bcrypt.verify(req.password, user_doc.get("password_hash", "")):
            raise HTTPException(401, "Invalid admin credentials")

        if user_doc.get("role") != "admin":
            raise HTTPException(403, "This account is not an admin")

        uid = user_doc["id"]
        access_token = _create_token(uid, req.email, "admin")
        refresh_token = _create_token(uid, req.email, "admin")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": _build_user_response(uid, req.email, user_doc),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {e}")
        raise HTTPException(500, f"Login failed: {e}")


@router.get("/me")
async def get_me(authorization: str = Header(None)):
    """Return current user profile from bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)

    user_id = payload["sub"]
    email = payload.get("email", "")

    profile = await _get_profile(user_id)
    logger.info(f"👤 /me: uid={user_id}, role={profile.get('role') if profile else 'NO_PROFILE'}")
    return {"user": _build_user_response(user_id, email, profile)}


@router.post("/logout")
async def logout():
    """Client should clear stored tokens."""
    return {"message": "Logged out successfully"}


# ---------------------------------------------------------------------------
# Admin seed – ensures admin account exists on first startup
# ---------------------------------------------------------------------------

async def seed_admin() -> None:
    """Create the admin account + profile if it doesn't already exist."""
    email = os.getenv("ADMIN_EMAIL", "amardighe16@gmail.com")
    password = os.getenv("ADMIN_PASSWORD", "amar@1845")

    db = await get_db()
    existing = await db.profiles.find_one({"email": email})
    if existing:
        # Ensure role is admin
        if existing.get("role") != "admin":
            await db.profiles.update_one(
                {"email": email},
                {"$set": {"role": "admin", "is_verified": True, "verification_status": "active"}}
            )
            logger.info("Admin role fixed for existing account")
        else:
            logger.info("Admin account already exists")
        return

    try:
        uid = str(uuid.uuid4())
        password_hash = bcrypt.hash(password)
        await db.profiles.insert_one({
            "id": uid,
            "email": email,
            "password_hash": password_hash,
            "role": "admin",
            "full_name": "Admin",
            "phone": ADMIN_ID,
            "is_verified": True,
            "verification_status": "active",
            "created_at": utcnow(),
        })
        logger.info("✅ Admin account created")
    except Exception as e:
        if "duplicate" in str(e).lower() or "E11000" in str(e):
            logger.info("Admin account already exists")
        else:
            logger.warning(f"Admin seed: {e}")
