"""
MANDIMITRA - Authentication Module
===================================
All auth handled server-side via Supabase. Frontend NEVER talks to Supabase.

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
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from supabase import create_client, Client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mandimitra-auth")

# ---------------------------------------------------------------------------
# Supabase clients
# ---------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_ID = os.getenv("ADMIN_ID", "8830217352")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    logger.error("Supabase credentials missing in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str
    phone: str
    role: str = Field(..., pattern="^(farmer|doctor)$")
    # Doctor-specific (required when role=doctor)
    veterinary_license: Optional[str] = None
    veterinary_college: Optional[str] = None
    specialization: Optional[str] = None
    years_of_experience: Optional[int] = None


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

def _get_profile(user_id: str) -> Optional[dict]:
    """Fetch profile from Supabase profiles table."""
    try:
        res = (
            supabase_admin.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return res.data
    except Exception:
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

    uid = None
    try:
        # Create auth user (service_role bypasses email confirmation)
        user_res = supabase_admin.auth.admin.create_user(
            {
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"full_name": req.full_name, "role": req.role},
            }
        )
        uid = user_res.user.id
        logger.info(f"✅ Auth user created: uid={uid}, role={req.role}")

        # Build profile row
        profile = {
            "id": uid,
            "role": req.role,
            "full_name": req.full_name,
            "phone": req.phone,
            "is_verified": req.role == "farmer",  # Farmers auto-verified
            "verification_status": "active" if req.role == "farmer" else "pending_verification",
        }
        if req.role == "doctor":
            profile.update(
                {
                    "veterinary_license": req.veterinary_license,
                    "veterinary_college": req.veterinary_college,
                    "specialization": req.specialization,
                    "years_of_experience": req.years_of_experience,
                }
            )

        logger.info(f"📦 Inserting profile: role={profile['role']}, name={profile['full_name']}")

        # Use upsert to handle edge cases (e.g. trigger pre-created row)
        supabase_admin.table("profiles").upsert(profile, on_conflict="id").execute()

        # Verify the profile was saved correctly
        saved = _get_profile(uid)
        if not saved:
            logger.error(f"❌ Profile not found after upsert for uid={uid}")
            raise HTTPException(500, "Failed to create user profile")
        if saved["role"] != req.role:
            logger.error(f"❌ Role mismatch! Expected={req.role}, Got={saved['role']}")
            # Force-fix the role
            supabase_admin.table("profiles").update({"role": req.role}).eq("id", uid).execute()
            saved["role"] = req.role

        logger.info(f"✅ Profile saved: role={saved['role']}")

        # Sign in to obtain session tokens
        session = supabase.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )

        return {
            "access_token": session.session.access_token,
            "refresh_token": session.session.refresh_token,
            "user": _build_user_response(uid, req.email, saved),
        }

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "already" in msg or "duplicate" in msg:
            raise HTTPException(409, "An account with this email already exists")
        logger.error(f"❌ Signup error: {e}")
        # Clean up orphan auth user if profile insert failed
        if uid:
            try:
                supabase_admin.auth.admin.delete_user(uid)
                logger.info(f"🧹 Cleaned up orphan auth user {uid}")
            except Exception:
                pass
        raise HTTPException(500, f"Registration failed: {e}")


@router.post("/login")
async def login(req: LoginRequest):
    """Login for farmer / doctor."""
    logger.info(f"🔐 Login request: email={req.email}, selected_role={req.role}")
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )
        uid = result.user.id
        profile = _get_profile(uid)

        if not profile:
            raise HTTPException(404, "User profile not found. Please sign up first.")

        db_role = profile.get("role", "unknown")
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

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": _build_user_response(uid, req.email, profile),
        }
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "invalid" in msg or "credentials" in msg:
            raise HTTPException(401, "Invalid email or password")
        logger.error(f"❌ Login error: {e}")
        raise HTTPException(500, f"Login failed: {e}")


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
        result = supabase.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )
        uid = result.user.id
        profile = _get_profile(uid)

        if not profile or profile.get("role") != "admin":
            raise HTTPException(403, "This account is not an admin")

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": _build_user_response(uid, req.email, profile),
        }
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "invalid" in msg or "credentials" in msg:
            raise HTTPException(401, "Invalid admin credentials")
        logger.error(f"Admin login error: {e}")
        raise HTTPException(500, f"Login failed: {e}")


@router.get("/me")
async def get_me(authorization: str = Header(None)):
    """Return current user profile from bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]
    try:
        user_res = supabase_admin.auth.get_user(token)
        user = user_res.user
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

    profile = _get_profile(user.id)
    logger.info(f"👤 /me: uid={user.id}, role={profile.get('role') if profile else 'NO_PROFILE'}")
    return {"user": _build_user_response(user.id, user.email, profile)}


@router.post("/logout")
async def logout():
    """Client should clear stored tokens."""
    return {"message": "Logged out successfully"}


# ---------------------------------------------------------------------------
# Admin seed – ensures admin account exists on first startup
# ---------------------------------------------------------------------------

def seed_admin() -> None:
    """Create the admin account + profile if it doesn't already exist."""
    email = os.getenv("ADMIN_EMAIL", "amardighe16@gmail.com")
    password = os.getenv("ADMIN_PASSWORD", "amar@1845")

    try:
        user_res = supabase_admin.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": "Admin", "role": "admin"},
            }
        )
        # Create admin profile
        supabase_admin.table("profiles").insert(
            {
                "id": user_res.user.id,
                "role": "admin",
                "full_name": "Admin",
                "phone": ADMIN_ID,
                "is_verified": True,
            }
        ).execute()
        logger.info("✅ Admin account created")
    except Exception as e:
        if "already" in str(e).lower() or "duplicate" in str(e).lower():
            logger.info("Admin account already exists")
        else:
            logger.warning(f"Admin seed: {e}")
