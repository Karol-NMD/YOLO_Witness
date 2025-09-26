# Use official Python image
FROM python:3.11-slim

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    wget \
 && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy your resources folder (models, YAMLs, etc.)
COPY Ressources ./Ressources

# Pre-download YOLOv8n weights into Ressources/
RUN wget -O Ressources/yolov8n.pt https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt

# Copy only requirements first (leverages Docker cache)
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port for FastAPI
EXPOSE 8000

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
