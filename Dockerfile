FROM python:3.10-slim

WORKDIR /app

# System deps for LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps — server-only (no TensorFlow, saves ~400MB)
COPY requirements-server.txt .
RUN pip install --no-cache-dir -r requirements-server.txt

# Copy backend code
COPY api/ ./api/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY configs/ ./configs/

# Copy ML models (only LightGBM — crop risk + price intelligence, ~24 MB)
COPY models/crop_risk_advisor/ ./models/crop_risk_advisor/
COPY models/price_intelligence/ ./models/price_intelligence/

# Copy only the data files the API needs at runtime
COPY data/processed/model/mandi_weather_optimized.parquet ./data/processed/model/mandi_weather_optimized.parquet
COPY data/processed/weather/forecast_maharashtra.parquet ./data/processed/weather/forecast_maharashtra.parquet

# Create directory for live price downloads
RUN mkdir -p ./data/raw/mandi/current

EXPOSE 10000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "10000"]
