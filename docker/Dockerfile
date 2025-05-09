FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY cloud-functions/ ./cloud-functions/
COPY scripts/ ./scripts/
COPY config/ ./config/
COPY dashboard/ ./dashboard/

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Command to run when starting the container
CMD ["python", "dashboard/app.py"]