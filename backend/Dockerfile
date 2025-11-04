# syntax=docker/dockerfile:1.6

# ===== Backend builder =====
FROM python:3.12-alpine AS backend-builder

# Install build tools (if any packages need compilation)
RUN apk add --no-cache build-base

WORKDIR /app

# Copy only requirements first for better caching
COPY backend/requirements.txt ./backend/requirements.txt

# Create virtual env and install deps
ENV VENV=/opt/venv
RUN python -m venv $VENV
ENV PATH="$VENV/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy the whole project so api can access assets mounted from project root
COPY . .

# ===== Backend runtime =====
FROM python:3.12-alpine AS backend

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy virtualenv from builder
ENV VENV=/opt/venv
ENV PATH="$VENV/bin:$PATH"
COPY --from=backend-builder $VENV $VENV

WORKDIR /app

# Copy application code (keep separate for better caching in dev rebuilds)
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Run the server (no reload in container)
# Keep working dir at repo root so StaticFiles(directory=".") works
CMD ["uvicorn", "api:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
