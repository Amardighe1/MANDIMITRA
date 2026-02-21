FROM python:3.10-slim

WORKDIR /app

# System deps for TensorFlow & LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY api/ ./api/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY configs/ ./configs/

# Copy ML models (~73 MB - must be tracked by Git LFS)
COPY models/ ./models/

# Copy only the data files the API needs at runtime (~41 MB)
COPY data/processed/model/mandi_weather_optimized.parquet ./data/processed/model/mandi_weather_optimized.parquet
COPY data/processed/weather/forecast_maharashtra.parquet ./data/processed/weather/forecast_maharashtra.parquet

# Create directory for live price downloads
RUN mkdir -p ./data/raw/mandi/current

EXPOSE 10000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "10000"]
