# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build static files
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Python Application
# ============================================
FROM python:3.13-slim AS runtime

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies
COPY pyproject.toml uv.lock* ./
RUN uv pip install --system --no-cache -e .

# Copy application code
COPY src/ ./src/
COPY database/ ./database/

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/dist ./src/aitrace/static/

# Create credentials directory for optional GCP service account
RUN mkdir -p /app/credentials

# Environment
ENV ENV=production
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health').read()" || exit 1

# Run application
CMD ["uvicorn", "aitrace.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
