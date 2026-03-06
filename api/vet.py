"""
MANDIMITRA - Veterinary Service Module (MongoDB)
==================================================
Handles doctor verification, bookings, and emergency SOS system.
Emergency requests are auto-assigned to the nearest verified doctor.

Admin Endpoints:
  GET  /api/vet/admin/pending-doctors       Pending doctor verifications
  POST /api/vet/admin/verify-doctor         Accept/reject a doctor
  GET  /api/vet/admin/stats                 Dashboard statistics

Doctor Endpoints:
  POST /api/vet/doctor/upload-document      Upload verification document
  GET  /api/vet/doctor/profile              Doctor profile + analytics
  POST /api/vet/doctor/update-location      Update doctor GPS coordinates
  GET  /api/vet/doctor/emergency-cases      Emergencies assigned to THIS doctor
  POST /api/vet/doctor/accept-emergency     Accept assigned emergency
  POST /api/vet/doctor/reject-emergency     Reject → escalate to next nearest
  POST /api/vet/doctor/complete-emergency   Mark emergency complete
  GET  /api/vet/doctor/bookings             Doctor's appointment list
  PATCH /api/vet/doctor/booking-status      Update booking status

Farmer Endpoints:
  GET  /api/vet/doctors                     Browse verified doctors
  POST /api/vet/farmer/book                 Book appointment
  POST /api/vet/farmer/emergency            Create emergency → auto-assign nearest
  GET  /api/vet/farmer/emergencies          Farmer's emergency requests
  GET  /api/vet/farmer/bookings             Farmer's bookings
"""

import logging
import math
import uuid
import base64
import os
from typing import Optional, List
from datetime import date

from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel, Field

from api.auth import _decode_token, _get_profile
from api.database import get_db, utcnow

logger = logging.getLogger("mandimitra-vet")

router = APIRouter(prefix="/api/vet", tags=["Veterinary Services"])

# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def _require_user(authorization: str = Header(None)) -> dict:
    """Extract & verify the current user from the bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    user_id = payload["sub"]
    profile = await _get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return {**profile, "email": payload.get("email", "")}


def _require_role(profile: dict, role: str):
    if profile.get("role") != role:
        raise HTTPException(403, f"This action requires {role} role")


# ---------------------------------------------------------------------------
# Haversine distance calculation
# ---------------------------------------------------------------------------

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS points using Haversine formula."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _find_nearest_doctors(
    lat: float,
    lon: float,
    exclude_ids: list[str] | None = None,
    limit: int = 5,
) -> list[tuple[dict, float]]:
    """Return up to `limit` nearest verified doctors sorted by distance."""
    exclude_ids = exclude_ids or []
    db = await get_db()

    query = {
        "role": "doctor",
        "verification_status": "active",
        "latitude": {"$ne": None},
        "longitude": {"$ne": None},
    }
    if exclude_ids:
        query["id"] = {"$nin": exclude_ids}

    cursor = db.profiles.find(
        query,
        {"_id": 0, "id": 1, "full_name": 1, "phone": 1, "latitude": 1, "longitude": 1, "specialization": 1}
    )

    doctors_with_dist: list[tuple[dict, float]] = []
    async for doc in cursor:
        if doc.get("latitude") is None or doc.get("longitude") is None:
            continue
        dist = _haversine_km(lat, lon, doc["latitude"], doc["longitude"])
        doctors_with_dist.append((doc, round(dist, 2)))

    doctors_with_dist.sort(key=lambda x: x[1])
    return doctors_with_dist[:limit]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class VerifyDoctorRequest(BaseModel):
    doctor_id: str
    action: str = Field(..., pattern="^(accept|reject)$")


class BookingRequest(BaseModel):
    doctor_id: str
    booking_date: str
    time_slot: str
    animal_type: Optional[str] = None
    description: Optional[str] = None


class EmergencyRequest(BaseModel):
    animal_type: str
    description: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class BookingStatusUpdate(BaseModel):
    booking_id: str
    status: str = Field(..., pattern="^(confirmed|completed|cancelled)$")


class EmergencyAccept(BaseModel):
    emergency_id: str


class EmergencyComplete(BaseModel):
    emergency_id: str


class EmergencyReject(BaseModel):
    emergency_id: str


class UpdateLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None


# ===========================================================================
# ADMIN ENDPOINTS
# ===========================================================================

@router.get("/admin/pending-doctors")
async def get_pending_doctors(authorization: str = Header(None)):
    """List doctors waiting for verification."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    try:
        db = await get_db()
        docs = await db.profiles.find(
            {"role": "doctor", "verification_status": "pending_verification"},
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", 1).to_list(100)
        return {"doctors": docs}
    except Exception as e:
        logger.error(f"Fetch pending doctors: {e}")
        raise HTTPException(500, "Failed to fetch pending doctors")


@router.post("/admin/verify-doctor")
async def verify_doctor(req: VerifyDoctorRequest, authorization: str = Header(None)):
    """Accept or reject a doctor's verification."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    new_status = "active" if req.action == "accept" else "rejected"
    is_verified = req.action == "accept"

    try:
        db = await get_db()
        await db.profiles.update_one(
            {"id": req.doctor_id},
            {"$set": {"verification_status": new_status, "is_verified": is_verified}}
        )
        return {"status": new_status, "doctor_id": req.doctor_id}
    except Exception as e:
        logger.error(f"Verify doctor: {e}")
        raise HTTPException(500, "Failed to update doctor status")


@router.get("/admin/stats")
async def admin_stats(authorization: str = Header(None)):
    """Dashboard statistics for admin."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    try:
        db = await get_db()
        farmers = await db.profiles.count_documents({"role": "farmer"})
        doctors_active = await db.profiles.count_documents({"role": "doctor", "verification_status": "active"})
        doctors_pending = await db.profiles.count_documents({"role": "doctor", "verification_status": "pending_verification"})
        bookings_total = await db.bookings.count_documents({})
        emergencies_active = await db.emergency_requests.count_documents({"status": "active"})
        emergencies_total = await db.emergency_requests.count_documents({})

        return {
            "total_farmers": farmers,
            "active_doctors": doctors_active,
            "pending_doctors": doctors_pending,
            "total_bookings": bookings_total,
            "active_emergencies": emergencies_active,
            "total_emergencies": emergencies_total,
        }
    except Exception as e:
        logger.error(f"Admin stats: {e}")
        raise HTTPException(500, "Failed to fetch stats")


@router.get("/admin/all-doctors")
async def get_all_doctors(authorization: str = Header(None)):
    """List all doctors (any status)."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    try:
        db = await get_db()
        docs = await db.profiles.find(
            {"role": "doctor"},
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", -1).to_list(200)
        return {"doctors": docs}
    except Exception as e:
        logger.error(f"Fetch all doctors: {e}")
        raise HTTPException(500, "Failed to fetch doctors")


@router.get("/admin/all-bookings")
async def get_all_bookings(authorization: str = Header(None)):
    """List all bookings system-wide."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    try:
        db = await get_db()
        docs = await db.bookings.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return {"bookings": docs}
    except Exception as e:
        logger.error(f"Fetch all bookings: {e}")
        raise HTTPException(500, "Failed to fetch bookings")


@router.get("/admin/all-emergencies")
async def get_all_emergencies(authorization: str = Header(None)):
    """List all emergency requests system-wide."""
    user = await _require_user(authorization)
    _require_role(user, "admin")

    try:
        db = await get_db()
        docs = await db.emergency_requests.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return {"emergencies": docs}
    except Exception as e:
        logger.error(f"Fetch all emergencies: {e}")
        raise HTTPException(500, "Failed to fetch emergencies")


# ===========================================================================
# DOCTOR ENDPOINTS
# ===========================================================================

@router.post("/doctor/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    """Upload verification document (stored as base64 in MongoDB)."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    if not file.content_type or not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(400, "Only images or PDF files are accepted")

    max_size = 5 * 1024 * 1024  # 5 MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(400, "File size must be under 5 MB")

    try:
        db = await get_db()
        ext = file.filename.split(".")[-1] if file.filename else "pdf"

        # Store document metadata in a documents collection
        doc_id = str(uuid.uuid4())
        doc_b64 = base64.b64encode(content).decode("utf-8")

        await db.verification_docs.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "user_id": user["id"],
                "filename": f"license.{ext}",
                "content_type": file.content_type,
                "data": doc_b64,
                "uploaded_at": utcnow(),
            }},
            upsert=True
        )

        # Update profile with a reference
        doc_url = f"/api/vet/doctor/document/{user['id']}"
        await db.profiles.update_one(
            {"id": user["id"]},
            {"$set": {"verification_document_url": doc_url}}
        )

        return {"url": doc_url}
    except Exception as e:
        logger.error(f"Upload document: {e}")
        raise HTTPException(500, f"Upload failed: {e}")


@router.get("/doctor/document/{user_id}")
async def get_document(user_id: str, authorization: str = Header(None)):
    """Serve a stored verification document."""
    user = await _require_user(authorization)
    # Only admin or the doctor themselves can access
    if user["id"] != user_id and user.get("role") != "admin":
        raise HTTPException(403, "Access denied")

    from fastapi.responses import Response
    db = await get_db()
    doc = await db.verification_docs.find_one({"user_id": user_id})
    if not doc:
        raise HTTPException(404, "Document not found")

    content = base64.b64decode(doc["data"])
    return Response(content=content, media_type=doc.get("content_type", "application/pdf"))


@router.get("/doctor/profile")
async def doctor_profile(authorization: str = Header(None)):
    """Doctor's own profile with analytics."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        total_bookings = await db.bookings.count_documents({"doctor_id": user["id"]})
        completed = await db.bookings.count_documents({"doctor_id": user["id"], "status": "completed"})
        emergencies = await db.emergency_requests.count_documents({"accepted_by": user["id"]})

        return {
            "id": user["id"],
            "email": user.get("email", ""),
            "full_name": user.get("full_name", ""),
            "phone": user.get("phone", ""),
            "specialization": user.get("specialization", ""),
            "years_of_experience": user.get("years_of_experience"),
            "veterinary_license": user.get("veterinary_license", ""),
            "veterinary_college": user.get("veterinary_college", ""),
            "verification_status": user.get("verification_status", "pending_verification"),
            "verification_document_url": user.get("verification_document_url"),
            "address": user.get("address"),
            "latitude": user.get("latitude"),
            "longitude": user.get("longitude"),
            "total_bookings": total_bookings,
            "completed_bookings": completed,
            "handled_emergencies": emergencies,
        }
    except Exception as e:
        logger.error(f"Doctor profile: {e}")
        raise HTTPException(500, "Failed to load profile")


@router.post("/doctor/update-location")
async def update_doctor_location(req: UpdateLocationRequest, authorization: str = Header(None)):
    """Doctor updates their GPS coordinates (used for proximity matching)."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        update_data: dict = {
            "latitude": req.latitude,
            "longitude": req.longitude,
        }
        if req.address is not None:
            update_data["address"] = req.address

        await db.profiles.update_one({"id": user["id"]}, {"$set": update_data})
        logger.info(f"📍 Doctor {user['id']} updated location: {req.latitude}, {req.longitude}")
        return {"message": "Location updated", "latitude": req.latitude, "longitude": req.longitude}
    except Exception as e:
        logger.error(f"Update location: {e}")
        raise HTTPException(500, "Failed to update location")


@router.get("/doctor/emergency-cases")
async def doctor_emergency_cases(authorization: str = Header(None)):
    """Emergencies assigned to THIS doctor + their accepted/completed ones."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    if user.get("verification_status") != "active":
        raise HTTPException(403, "Your account is not yet verified")

    try:
        db = await get_db()
        # Emergencies assigned to this doctor (pending acceptance)
        assigned = await db.emergency_requests.find(
            {"assigned_to": user["id"], "status": "active"},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)

        # This doctor's accepted/completed emergencies
        mine = await db.emergency_requests.find(
            {"accepted_by": user["id"], "status": {"$in": ["accepted", "completed"]}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)

        # Combine and deduplicate
        seen = set()
        unique = []
        for e in assigned + mine:
            eid = e.get("id")
            if eid and eid not in seen:
                seen.add(eid)
                unique.append(e)
        return {"emergencies": unique}
    except Exception as e:
        logger.error(f"Emergency cases: {e}")
        raise HTTPException(500, "Failed to fetch emergencies")


@router.post("/doctor/accept-emergency")
async def accept_emergency(req: EmergencyAccept, authorization: str = Header(None)):
    """Accept an emergency that was assigned to this doctor."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    if user.get("verification_status") != "active":
        raise HTTPException(403, "Your account is not yet verified")

    try:
        db = await get_db()
        emergency = await db.emergency_requests.find_one({"id": req.emergency_id}, {"_id": 0})
        if not emergency:
            raise HTTPException(404, "Emergency request not found")

        if emergency["status"] != "active":
            raise HTTPException(409, "This emergency has already been handled")

        if emergency.get("assigned_to") and emergency["assigned_to"] != user["id"]:
            raise HTTPException(403, "This emergency is assigned to another doctor")

        await db.emergency_requests.update_one(
            {"id": req.emergency_id, "status": "active"},
            {"$set": {
                "status": "accepted",
                "accepted_by": user["id"],
                "doctor_name": user.get("full_name", ""),
            }}
        )

        logger.info(f"✅ Emergency {req.emergency_id} accepted by doctor {user['id']}")
        return {"message": "Emergency accepted", "emergency_id": req.emergency_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept emergency: {e}")
        raise HTTPException(500, "Failed to accept emergency")


@router.post("/doctor/reject-emergency")
async def reject_emergency(req: EmergencyReject, authorization: str = Header(None)):
    """Doctor rejects an assigned emergency → system escalates to next nearest doctor."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        emergency = await db.emergency_requests.find_one({"id": req.emergency_id}, {"_id": 0})
        if not emergency:
            raise HTTPException(404, "Emergency request not found")

        if emergency["status"] != "active":
            raise HTTPException(409, "This emergency is no longer active")

        if emergency.get("assigned_to") != user["id"]:
            raise HTTPException(403, "This emergency is not assigned to you")

        # Build list of already-rejected doctor IDs
        rejected_csv = emergency.get("rejected_by", "") or ""
        rejected_list = [r for r in rejected_csv.split(",") if r]
        rejected_list.append(user["id"])
        new_rejected_csv = ",".join(rejected_list)

        escalation_count = (emergency.get("escalation_count") or 0) + 1

        # Find next nearest doctor (excluding all who rejected)
        farmer_lat = emergency.get("latitude")
        farmer_lon = emergency.get("longitude")

        if farmer_lat and farmer_lon:
            candidates = await _find_nearest_doctors(
                farmer_lat, farmer_lon, exclude_ids=rejected_list, limit=1
            )
        else:
            candidates = []

        if candidates:
            next_doc, dist = candidates[0]
            await db.emergency_requests.update_one(
                {"id": req.emergency_id},
                {"$set": {
                    "assigned_to": next_doc["id"],
                    "assigned_doctor_name": next_doc.get("full_name", ""),
                    "distance_km": dist,
                    "escalation_count": escalation_count,
                    "rejected_by": new_rejected_csv,
                }}
            )

            logger.info(
                f"🔄 Emergency {req.emergency_id} escalated to doctor {next_doc['id']} "
                f"({dist} km) after rejection by {user['id']}"
            )
            return {
                "message": "Emergency escalated to the next nearest doctor",
                "next_doctor": next_doc.get("full_name"),
                "distance_km": dist,
            }
        else:
            await db.emergency_requests.update_one(
                {"id": req.emergency_id},
                {"$set": {
                    "assigned_to": None,
                    "assigned_doctor_name": None,
                    "distance_km": None,
                    "escalation_count": escalation_count,
                    "rejected_by": new_rejected_csv,
                }}
            )

            logger.warning(f"⚠️ Emergency {req.emergency_id}: no more doctors available after rejection")
            return {
                "message": "No more nearby doctors available. Emergency remains active for manual assignment.",
                "next_doctor": None,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject emergency: {e}")
        raise HTTPException(500, "Failed to reject emergency")


@router.post("/doctor/complete-emergency")
async def complete_emergency(req: EmergencyComplete, authorization: str = Header(None)):
    """Mark an accepted emergency as completed."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        await db.emergency_requests.update_one(
            {"id": req.emergency_id, "accepted_by": user["id"]},
            {"$set": {"status": "completed"}}
        )
        return {"message": "Emergency completed"}
    except Exception as e:
        logger.error(f"Complete emergency: {e}")
        raise HTTPException(500, "Failed to complete emergency")


@router.get("/doctor/bookings")
async def doctor_bookings(authorization: str = Header(None)):
    """Doctor's appointment list."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        docs = await db.bookings.find(
            {"doctor_id": user["id"]},
            {"_id": 0}
        ).sort("booking_date", -1).to_list(100)
        return {"bookings": docs}
    except Exception as e:
        logger.error(f"Doctor bookings: {e}")
        raise HTTPException(500, "Failed to fetch bookings")


@router.patch("/doctor/booking-status")
async def update_booking_status(req: BookingStatusUpdate, authorization: str = Header(None)):
    """Doctor updates a booking status (PATCH method)."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        await db.bookings.update_one(
            {"id": req.booking_id, "doctor_id": user["id"]},
            {"$set": {"status": req.status}}
        )
        return {"message": f"Booking {req.status}", "booking_id": req.booking_id}
    except Exception as e:
        logger.error(f"Update booking: {e}")
        raise HTTPException(500, "Failed to update booking")


@router.post("/doctor/booking-status")
async def update_booking_status_post(req: BookingStatusUpdate, authorization: str = Header(None)):
    """Doctor updates a booking status (POST method)."""
    user = await _require_user(authorization)
    _require_role(user, "doctor")

    try:
        db = await get_db()
        await db.bookings.update_one(
            {"id": req.booking_id, "doctor_id": user["id"]},
            {"$set": {"status": req.status}}
        )
        return {"message": f"Booking {req.status}", "booking_id": req.booking_id}
    except Exception as e:
        logger.error(f"Update booking: {e}")
        raise HTTPException(500, "Failed to update booking")


# ===========================================================================
# FARMER ENDPOINTS
# ===========================================================================

@router.get("/doctors")
async def list_verified_doctors(authorization: str = Header(None)):
    """Browse all verified doctors."""
    user = await _require_user(authorization)
    _require_role(user, "farmer")

    try:
        db = await get_db()
        docs = await db.profiles.find(
            {"role": "doctor", "verification_status": "active"},
            {"_id": 0, "id": 1, "full_name": 1, "specialization": 1,
             "years_of_experience": 1, "veterinary_college": 1, "phone": 1, "address": 1}
        ).sort("full_name", 1).to_list(200)
        return {"doctors": docs}
    except Exception as e:
        logger.error(f"List doctors: {e}")
        raise HTTPException(500, "Failed to fetch doctors")


@router.post("/farmer/book")
async def book_appointment(req: BookingRequest, authorization: str = Header(None)):
    """Farmer books a standard appointment with a doctor."""
    user = await _require_user(authorization)
    _require_role(user, "farmer")

    # Verify the doctor is active
    doctor = await _get_profile(req.doctor_id)
    if not doctor or doctor.get("role") != "doctor" or doctor.get("verification_status") != "active":
        raise HTTPException(400, "Selected doctor is not available")

    try:
        db = await get_db()
        booking_id = str(uuid.uuid4())
        await db.bookings.insert_one({
            "id": booking_id,
            "farmer_id": user["id"],
            "doctor_id": req.doctor_id,
            "booking_date": req.booking_date,
            "time_slot": req.time_slot,
            "animal_type": req.animal_type,
            "description": req.description,
            "farmer_name": user.get("full_name", ""),
            "farmer_phone": user.get("phone", ""),
            "doctor_name": doctor.get("full_name", ""),
            "status": "pending",
            "created_at": utcnow(),
        })
        return {"message": "Appointment booked successfully"}
    except Exception as e:
        logger.error(f"Book appointment: {e}")
        raise HTTPException(500, "Failed to book appointment")


@router.post("/farmer/emergency")
async def create_emergency(req: EmergencyRequest, authorization: str = Header(None)):
    """Farmer creates emergency → auto-assigned to nearest verified doctor."""
    user = await _require_user(authorization)
    _require_role(user, "farmer")

    if not req.latitude or not req.longitude:
        raise HTTPException(
            400,
            "GPS location is required for emergency requests. Please enable location services."
        )

    try:
        # Find nearest verified doctor
        candidates = await _find_nearest_doctors(req.latitude, req.longitude, limit=1)

        assigned_to = None
        assigned_doctor_name = None
        distance_km = None

        if candidates:
            nearest_doc, dist = candidates[0]
            assigned_to = nearest_doc["id"]
            assigned_doctor_name = nearest_doc.get("full_name", "")
            distance_km = dist
            logger.info(
                f"🆘 Emergency from {user['id']}: assigned to nearest doctor "
                f"{assigned_to} ({assigned_doctor_name}) at {dist} km"
            )
        else:
            logger.warning(f"⚠️ Emergency from {user['id']}: no doctors with location found")

        db = await get_db()
        emergency_id = str(uuid.uuid4())
        row = {
            "id": emergency_id,
            "farmer_id": user["id"],
            "animal_type": req.animal_type,
            "description": req.description,
            "location": req.location,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "farmer_name": user.get("full_name", ""),
            "farmer_phone": user.get("phone", ""),
            "assigned_to": assigned_to,
            "assigned_doctor_name": assigned_doctor_name,
            "distance_km": distance_km,
            "status": "active",
            "created_at": utcnow(),
        }

        await db.emergency_requests.insert_one(row)

        if assigned_to:
            return {
                "message": f"Emergency sent to Dr. {assigned_doctor_name} ({distance_km} km away)",
                "assigned_doctor": assigned_doctor_name,
                "distance_km": distance_km,
                "emergency_id": emergency_id,
            }
        else:
            return {
                "message": "Emergency created but no doctors with location available. It will be visible to all doctors.",
                "assigned_doctor": None,
                "distance_km": None,
                "emergency_id": emergency_id,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create emergency: {e}")
        raise HTTPException(500, "Failed to create emergency request")


@router.get("/farmer/bookings")
async def farmer_bookings(authorization: str = Header(None)):
    """Farmer's appointment list."""
    user = await _require_user(authorization)
    _require_role(user, "farmer")

    try:
        db = await get_db()
        docs = await db.bookings.find(
            {"farmer_id": user["id"]},
            {"_id": 0}
        ).sort("booking_date", -1).to_list(100)
        return {"bookings": docs}
    except Exception as e:
        logger.error(f"Farmer bookings: {e}")
        raise HTTPException(500, "Failed to fetch bookings")


@router.get("/farmer/emergencies")
async def farmer_emergencies(authorization: str = Header(None)):
    """Farmer's emergency requests."""
    user = await _require_user(authorization)
    _require_role(user, "farmer")

    try:
        db = await get_db()
        docs = await db.emergency_requests.find(
            {"farmer_id": user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return {"emergencies": docs}
    except Exception as e:
        logger.error(f"Farmer emergencies: {e}")
        raise HTTPException(500, "Failed to fetch emergencies")
