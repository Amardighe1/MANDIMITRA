"""
MANDIMITRA - MongoDB Database Module
======================================
Async MongoDB connection via Motor. Collections mirror the old Supabase tables:
  - profiles     (users with role, verification, location)
  - bookings     (doctor appointments)
  - emergency_requests  (SOS with geo-assignment)
"""

import os
import logging
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logger = logging.getLogger("mandimitra-db")

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mandimitra")

if not MONGODB_URI:
    logger.error("MONGODB_URI not set in .env — database operations will fail")


class DatabaseConfigError(Exception):
    """Raised when the database is mis-configured (e.g. missing URI)."""
    pass


# ---------------------------------------------------------------------------
# Singleton client  (Motor is async-safe, one client per process is fine)
# ---------------------------------------------------------------------------
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> AsyncIOMotorDatabase:
    """Create or reuse the Motor client and return the database handle."""
    global _client, _db
    if _db is not None:
        return _db

    if not MONGODB_URI or MONGODB_URI.strip() == "":
        logger.error("MONGODB_URI is empty — cannot connect to database")
        raise DatabaseConfigError(
            "Database connection is not configured. Please set MONGODB_URI in environment variables."
        )

    logger.info("Connecting to MongoDB Atlas …")
    try:
        _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=15000)
        _db = _client[MONGODB_DB_NAME]
        # Quick ping to validate connection
        await _client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB database: {MONGODB_DB_NAME}")
    except Exception as e:
        _client = None
        _db = None
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise DatabaseConfigError(
            "Unable to connect to the database. The server may be starting up — please try again in a moment."
        ) from e

    # Ensure indexes
    await _ensure_indexes(_db)
    return _db


async def close_db():
    """Close the Motor client on shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


async def get_db() -> AsyncIOMotorDatabase:
    """Return the database handle, connecting if needed."""
    if _db is None:
        return await connect_db()
    return _db


# ---------------------------------------------------------------------------
# Index setup
# ---------------------------------------------------------------------------

async def _ensure_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for efficient queries."""
    # profiles
    await db.profiles.create_index("email", unique=True)
    await db.profiles.create_index("role")
    await db.profiles.create_index([("role", 1), ("verification_status", 1)])

    # bookings
    await db.bookings.create_index("farmer_id")
    await db.bookings.create_index("doctor_id")
    await db.bookings.create_index("booking_date")

    # emergency_requests
    await db.emergency_requests.create_index("farmer_id")
    await db.emergency_requests.create_index("assigned_to")
    await db.emergency_requests.create_index("accepted_by")
    await db.emergency_requests.create_index("status")

    # daily_prices (buyer marketplace)
    await db.daily_prices.create_index(
        [("buyer_id", 1), ("crop_id", 1), ("market_name", 1)],
        unique=True,
    )
    await db.daily_prices.create_index([("market_name", 1), ("crop_id", 1)])
    await db.daily_prices.create_index("buyer_id")

    logger.info("✅ Database indexes ensured")


# ---------------------------------------------------------------------------
# Helper: timestamps
# ---------------------------------------------------------------------------

def utcnow() -> str:
    """ISO-8601 UTC timestamp string."""
    return datetime.now(timezone.utc).isoformat()
