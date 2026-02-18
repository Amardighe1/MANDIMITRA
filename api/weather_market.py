"""
MANDIMITRA — Weather & Market API Endpoints
=============================================
GET /api/weather/forecast       Live 16-day weather forecast from Open-Meteo
GET /api/weather/districts      Available districts with coordinates
GET /api/market/prices          Today's live mandi prices (with filters)
GET /api/market/commodities     List of available commodities with counts
GET /api/market/summary         Market summary statistics
"""

import logging
from datetime import datetime
from typing import Optional

import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger("mandimitra-api")

router = APIRouter(tags=["Weather & Market Analytics"])

# ============================================================================
# MAHARASHTRA DISTRICT COORDINATES (for Open-Meteo API)
# ============================================================================

DISTRICT_COORDS = {
    "Ahmednagar": (19.0948, 74.7480),
    "Akola": (20.7063, 77.0077),
    "Amravati": (20.9374, 77.7796),
    "Aurangabad": (19.8762, 75.3433),
    "Beed": (18.9891, 75.7601),
    "Bhandara": (21.1675, 79.6517),
    "Buldhana": (20.5293, 76.1842),
    "Chandrapur": (19.9504, 79.2961),
    "Dhule": (20.9042, 74.7749),
    "Gadchiroli": (20.1809, 80.0000),
    "Gondia": (21.4584, 80.1950),
    "Hingoli": (19.7141, 77.1539),
    "Jalgaon": (21.0077, 75.5626),
    "Jalna": (19.8347, 75.8800),
    "Kolhapur": (16.7050, 74.2433),
    "Latur": (18.3986, 76.5644),
    "Mumbai": (19.0760, 72.8777),
    "Mumbai Suburban": (19.1000, 72.8500),
    "Nagpur": (21.1458, 79.0882),
    "Nanded": (19.1383, 77.3210),
    "Nandurbar": (21.3700, 74.2400),
    "Nashik": (20.0063, 73.7900),
    "Osmanabad": (18.1810, 76.0400),
    "Palghar": (19.6932, 72.7673),
    "Parbhani": (19.2715, 76.7745),
    "Pune": (18.5204, 73.8567),
    "Raigad": (18.5158, 73.1822),
    "Ratnagiri": (16.9944, 73.3000),
    "Sangli": (16.8544, 74.5644),
    "Satara": (17.6860, 74.0183),
    "Sindhudurg": (16.3484, 73.7556),
    "Solapur": (17.6599, 75.9064),
    "Thane": (19.2183, 72.9781),
    "Wardha": (20.7453, 78.6022),
    "Washim": (20.1000, 77.1300),
    "Yavatmal": (20.3899, 78.1307),
}

# ============================================================================
# WEATHER FORECAST — Live from Open-Meteo (100% free, no API key)
# ============================================================================

# WMO Weather Code descriptions
WMO_CODES = {
    0: ("Clear sky", "☀️"),
    1: ("Mainly clear", "🌤️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Foggy", "🌫️"),
    48: ("Rime fog", "🌫️"),
    51: ("Light drizzle", "🌦️"),
    53: ("Moderate drizzle", "🌦️"),
    55: ("Dense drizzle", "🌧️"),
    61: ("Slight rain", "🌦️"),
    63: ("Moderate rain", "🌧️"),
    65: ("Heavy rain", "🌧️"),
    71: ("Slight snow", "🌨️"),
    73: ("Moderate snow", "🌨️"),
    75: ("Heavy snow", "❄️"),
    80: ("Slight showers", "🌦️"),
    81: ("Moderate showers", "🌧️"),
    82: ("Violent showers", "⛈️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm + hail", "⛈️"),
    99: ("Thunderstorm + heavy hail", "⛈️"),
}


@router.get("/api/weather/districts")
async def get_weather_districts():
    """Return list of available districts with coordinates."""
    return {
        "districts": [
            {"name": name, "latitude": lat, "longitude": lon}
            for name, (lat, lon) in sorted(DISTRICT_COORDS.items())
        ]
    }


@router.get("/api/weather/forecast")
async def get_weather_forecast(
    district: str = Query(..., description="Maharashtra district name"),
    days: int = Query(7, ge=1, le=16, description="Forecast days (1-16)"),
):
    """
    Fetch live weather forecast from Open-Meteo API.
    100% accurate, real-time data. No API key needed.
    """
    coords = DISTRICT_COORDS.get(district)
    if not coords:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown district: {district}. Use /api/weather/districts for valid options.",
        )

    lat, lon = coords

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": ",".join([
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "apparent_temperature_max",
                        "apparent_temperature_min",
                        "precipitation_sum",
                        "precipitation_probability_max",
                        "windspeed_10m_max",
                        "weathercode",
                        "sunrise",
                        "sunset",
                        "uv_index_max",
                        "relative_humidity_2m_max",
                        "relative_humidity_2m_min",
                    ]),
                    "current": ",".join([
                        "temperature_2m",
                        "relative_humidity_2m",
                        "apparent_temperature",
                        "precipitation",
                        "weathercode",
                        "windspeed_10m",
                        "winddirection_10m",
                        "is_day",
                    ]),
                    "timezone": "Asia/Kolkata",
                    "forecast_days": min(days, 16),
                },
            )
            resp.raise_for_status()
            data = resp.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Weather API timeout. Please try again.")
    except Exception as e:
        logger.error(f"Open-Meteo API error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch weather data")

    # Parse current weather
    current = data.get("current", {})
    current_code = current.get("weathercode", 0)
    current_desc, current_emoji = WMO_CODES.get(current_code, ("Unknown", "❓"))

    current_weather = {
        "temperature": current.get("temperature_2m"),
        "feels_like": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "precipitation": current.get("precipitation"),
        "wind_speed": current.get("windspeed_10m"),
        "wind_direction": current.get("winddirection_10m"),
        "weather_code": current_code,
        "weather_description": current_desc,
        "weather_emoji": current_emoji,
        "is_day": current.get("is_day", 1) == 1,
    }

    # Parse daily forecast
    daily = data.get("daily", {})
    dates = daily.get("time", [])
    forecast = []

    for i, date_str in enumerate(dates):
        code = daily.get("weathercode", [0])[i] if i < len(daily.get("weathercode", [])) else 0
        desc, emoji = WMO_CODES.get(code, ("Unknown", "❓"))

        def safe_get(key, idx):
            arr = daily.get(key, [])
            return arr[idx] if idx < len(arr) else None

        forecast.append({
            "date": date_str,
            "temp_max": safe_get("temperature_2m_max", i),
            "temp_min": safe_get("temperature_2m_min", i),
            "feels_like_max": safe_get("apparent_temperature_max", i),
            "feels_like_min": safe_get("apparent_temperature_min", i),
            "precipitation": safe_get("precipitation_sum", i),
            "precipitation_probability": safe_get("precipitation_probability_max", i),
            "wind_speed": safe_get("windspeed_10m_max", i),
            "humidity_max": safe_get("relative_humidity_2m_max", i),
            "humidity_min": safe_get("relative_humidity_2m_min", i),
            "uv_index": safe_get("uv_index_max", i),
            "sunrise": safe_get("sunrise", i),
            "sunset": safe_get("sunset", i),
            "weather_code": code,
            "weather_description": desc,
            "weather_emoji": emoji,
        })

    return {
        "district": district,
        "latitude": lat,
        "longitude": lon,
        "current": current_weather,
        "forecast": forecast,
        "source": "Open-Meteo (open-meteo.com)",
        "updated_at": datetime.now().isoformat(),
    }


# ============================================================================
# MARKET ANALYTICS — Live Mandi Prices from Data.gov.in
# ============================================================================

def _get_live_df():
    """Get the live prices DataFrame from main module."""
    from api.main import live_prices_df, live_prices_date, refresh_live_prices

    if live_prices_df is None or live_prices_df.empty:
        refresh_live_prices()
        from api.main import live_prices_df as refreshed_df, live_prices_date as refreshed_date
        return refreshed_df, refreshed_date

    return live_prices_df, live_prices_date


@router.get("/api/market/prices")
async def get_market_prices(
    commodity: Optional[str] = Query(None, description="Filter by commodity name"),
    market: Optional[str] = Query(None, description="Filter by market name"),
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search across commodity/market/district"),
    sort_by: str = Query("commodity", description="Sort field"),
    sort_order: str = Query("asc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
):
    """
    Return today's live mandi prices with filtering, sorting, and pagination.
    Data sourced from Data.gov.in AGMARKNET API.
    """
    df, data_date = _get_live_df()

    if df is None or df.empty:
        raise HTTPException(status_code=503, detail="Market price data is currently unavailable. Try again later.")

    # Apply filters
    mask = pd.Series(True, index=df.index)

    if commodity:
        mask &= df["commodity"].str.lower() == commodity.lower()
    if market:
        mask &= df["market"].str.lower().str.contains(market.lower(), na=False)
    if district:
        mask &= df["district"].str.lower() == district.lower()
    if search:
        search_lower = search.lower()
        mask &= (
            df["commodity"].str.lower().str.contains(search_lower, na=False)
            | df["market"].str.lower().str.contains(search_lower, na=False)
            | df["district"].str.lower().str.contains(search_lower, na=False)
        )

    filtered = df.loc[mask].copy()

    # Sort
    sort_col = sort_by if sort_by in filtered.columns else "commodity"
    ascending = sort_order.lower() != "desc"
    filtered = filtered.sort_values(sort_col, ascending=ascending, na_position="last")

    # Pagination
    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = filtered.iloc[start:end]

    # Serialize
    records = []
    for _, row in page_data.iterrows():
        records.append({
            "commodity": row.get("commodity", ""),
            "variety": row.get("variety", ""),
            "market": row.get("market", ""),
            "district": row.get("district", ""),
            "min_price": float(row["min_price"]) if pd.notna(row.get("min_price")) else None,
            "max_price": float(row["max_price"]) if pd.notna(row.get("max_price")) else None,
            "modal_price": float(row["modal_price"]) if pd.notna(row.get("modal_price")) else None,
            "arrival_date": str(row["arrival_date"]) if pd.notna(row.get("arrival_date")) else data_date,
        })

    return {
        "prices": records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "data_date": data_date,
        "source": "Data.gov.in (AGMARKNET)",
    }


@router.get("/api/market/commodities")
async def get_market_commodities():
    """Return all available commodities with record count and average prices."""
    df, data_date = _get_live_df()

    if df is None or df.empty:
        raise HTTPException(status_code=503, detail="Market data unavailable")

    summary = (
        df.groupby("commodity")
        .agg(
            count=("modal_price", "size"),
            avg_price=("modal_price", "mean"),
            min_price=("min_price", "min"),
            max_price=("max_price", "max"),
            markets=("market", "nunique"),
        )
        .reset_index()
        .sort_values("count", ascending=False)
    )

    commodities = []
    for _, row in summary.iterrows():
        commodities.append({
            "name": row["commodity"],
            "records": int(row["count"]),
            "avg_price": round(float(row["avg_price"]), 0) if pd.notna(row["avg_price"]) else None,
            "min_price": round(float(row["min_price"]), 0) if pd.notna(row["min_price"]) else None,
            "max_price": round(float(row["max_price"]), 0) if pd.notna(row["max_price"]) else None,
            "markets": int(row["markets"]),
        })

    return {
        "commodities": commodities,
        "total": len(commodities),
        "data_date": data_date,
    }


@router.get("/api/market/summary")
async def get_market_summary():
    """Return high-level market statistics for today."""
    df, data_date = _get_live_df()

    if df is None or df.empty:
        raise HTTPException(status_code=503, detail="Market data unavailable")

    # Top movers — commodities with highest price spread
    spread = df.copy()
    spread["spread"] = spread["max_price"] - spread["min_price"]
    spread["spread_pct"] = (spread["spread"] / spread["modal_price"] * 100).round(1)

    top_commodities = (
        df.groupby("commodity")
        .agg(avg_price=("modal_price", "mean"), count=("modal_price", "size"))
        .sort_values("count", ascending=False)
        .head(10)
        .reset_index()
    )

    return {
        "total_records": len(df),
        "total_commodities": df["commodity"].nunique(),
        "total_markets": df["market"].nunique(),
        "total_districts": df["district"].nunique(),
        "data_date": data_date,
        "top_commodities": [
            {
                "name": row["commodity"],
                "avg_price": round(float(row["avg_price"]), 0),
                "records": int(row["count"]),
            }
            for _, row in top_commodities.iterrows()
        ],
        "source": "Data.gov.in (AGMARKNET)",
    }
