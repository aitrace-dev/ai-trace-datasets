# Packaging & Development Setup

## Overview

AITrace Datasets is packaged as a single Docker image containing both backend and frontend.

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Local | FastAPI on `localhost:8000` | Vue dev server on `localhost:3000` (proxies `/api/*` to backend) |
| Production | FastAPI serves everything | Built static files embedded in FastAPI |

---

## Environment Detection

Use `ENV` environment variable:

| Value | Behavior |
|-------|----------|
| `local` | Backend only, no static file serving |
| Any other value (or unset) | Production mode, serves static files |
```python
# src/aitrace/main.py
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Mount static files only in production
if os.getenv("ENV") != "local":
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
```

---

## Local Development

### Prerequisites

- Python 3.13+
- uv (Python package manager)
- Node.js 20+
- npm
- Docker & Docker Compose (for PostgreSQL)

### Setup

#### 1. Start Database
```bash
docker-compose up -d postgres
```

#### 2. Setup Backend
```bash
# Install dependencies
uv sync

# Create .env file
cp .env.example .env

# Run database schema
psql $DATABASE_URL -f database/schema.sql

# Start backend
uv run python src/aitrace/run_local.py
```

Backend runs on `http://localhost:8000`

#### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Local Environment Variables
```env
# .env
ENV=local
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/aitrace
SECRET_KEY=local-dev-secret-key-at-least-32-characters
LOG_LEVEL=DEBUG
```

---

## Frontend Proxy Configuration

In local development, Vue dev server proxies API requests to the backend.
```javascript
// frontend/vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aitrace
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

---

## Production Build

### Dockerfile

Multi-stage build:

1. **Stage 1**: Build frontend
2. **Stage 2**: Python app with static files
```dockerfile
# Dockerfile

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
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY src/ ./src/

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/dist ./src/aitrace/static/

# Environment
ENV ENV=production
ENV PYTHONPATH=/app/src

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "uvicorn", "aitrace.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run
```bash
# Build image
docker build -t aitrace-datasets .

# Run container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://user:pass@host/db \
  -e SECRET_KEY=your-production-secret-key \
  aitrace-datasets
```

---

## Production Docker Compose

For self-hosted production deployment:
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/aitrace
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aitrace
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```
```bash
# Deploy
SECRET_KEY=your-secret-key docker-compose -f docker-compose.prod.yml up -d
```

---

## Static File Serving

### Directory Structure (Production)
```
src/aitrace/
├── main.py
├── static/              # Built frontend files (copied during Docker build)
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   └── index-xxx.css
│   └── ...
└── ...
```

### FastAPI Static Mount
```python
# src/aitrace/main.py
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Register API routes first
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(datasets_router, prefix="/api/v1")
# ... other routers

# Mount static files last (only in production)
if os.getenv("ENV") != "local":
    static_path = Path(__file__).parent / "static"
    if static_path.exists():
        app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
```

### SPA Routing

Vue Router uses history mode. FastAPI serves `index.html` for all non-API routes (handled by `html=True` in StaticFiles).

---

## Scripts Reference

### Backend
```bash
# Start local dev server
uv run python src/aitrace/run_local.py

# Run tests
uv run pytest

# Format code
uv run black src/ tests/
uv run isort src/ tests/

# Type check
uv run mypy src/
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

---

## Port Reference

| Service | Local Port | Container Port |
|---------|------------|----------------|
| Backend (FastAPI) | 8000 | 8000 |
| Frontend (Vue dev) | 3000 | - |
| PostgreSQL | 5432 | 5432 |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENV` | No | (none) | Set to `local` for development |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `SECRET_KEY` | Yes | - | JWT signing key (min 32 chars) |
| `LOG_LEVEL` | No | `INFO` | Logging level |

---

## Quick Commands
```bash
# === Local Development ===

# Start everything (first time)
docker-compose up -d postgres
uv sync
cp .env.example .env
psql $DATABASE_URL -f database/schema.sql
uv run python src/aitrace/run_local.py  # Terminal 1
cd frontend && npm install && npm run dev  # Terminal 2

# Daily startup
docker-compose up -d postgres
uv run python src/aitrace/run_local.py  # Terminal 1
cd frontend && npm run dev  # Terminal 2

# === Production ===

# Build and run
docker build -t aitrace-datasets .
docker-compose -f docker-compose.prod.yml up -d
```