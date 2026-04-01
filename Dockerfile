FROM python:3.11-slim

# 1. Install System Dependencies FIRST (Required for audio libraries to compile)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy only requirements first (Better for caching)
COPY requirements.txt .

# 3. Install Python Libraries
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the code
COPY . .

# 5. Set Environment Variables
ENV PORT 8080
ENV PYTHONUNBUFFERED True

# 6. Start the Engine
CMD ["python", "main.py"]