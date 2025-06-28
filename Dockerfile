# Multi-stage build for AI Trace Datasets application

# Stage 1: Build the frontend
FROM oven/bun:1 AS frontend-build
WORKDIR /app

# Set environment variables for the frontend build
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Auth0 environment variables
ARG VITE_DEPLOYMENT_MODE=
ARG VITE_AUTH0_DOMAIN=
ARG VITE_AUTH0_CLIENT_ID=
ARG VITE_AUTH0_AUDIENCE=

# Set Auth0 environment variables if provided
ENV VITE_DEPLOYMENT_MODE=${VITE_DEPLOYMENT_MODE}
ENV VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
ENV VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
ENV VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}

# Copy frontend dependencies and install
COPY frontend/package.json frontend/bun.lockb ./
RUN bun install

# Copy frontend source code
COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html ./
COPY frontend/public/ ./public/
COPY frontend/src/ ./src/
COPY frontend/components.json frontend/postcss.config.js frontend/tailwind.config.ts ./

# Build the frontend
RUN bun run build

# Stage 2: Backend build
FROM python:3.12-alpine as backend-build
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev libffi-dev

# Copy backend files
COPY backend/pyproject.toml backend/uv.lock ./
RUN pip install --no-cache-dir uv \
    && uv venv .venv \
    && . .venv/bin/activate \
    && uv pip install --no-cache-dir -e .
ENV PATH="/app/.venv/bin:$PATH"
COPY backend/src/ai_trace_datasets/ ./ai_trace_datasets/
COPY backend/.env ./

# Stage 3: Final image with Python and Nginx
FROM python:3.12-alpine as final
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx
# Install uv globally for runtime usage
RUN pip install --no-cache-dir uv

# Set environment variables for the container
ARG BACKEND_HOST=localhost
ARG BACKEND_PORT=8000
ENV BACKEND_HOST=${BACKEND_HOST}
ENV BACKEND_PORT=${BACKEND_PORT}

# Copy backend from backend-build stage
COPY --from=backend-build /app/ /app/
COPY --from=backend-build /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY backend/service-account.json /app/service-account.json
ENV GCS_CREDENTIALS_PATH=/app/service-account.json
# Copy frontend build from frontend-build stage
COPY --from=frontend-build /app/dist/ /usr/share/nginx/html/

# Configure Nginx to serve frontend and proxy API requests to backend
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy Nginx config template
COPY nginx/app.conf.template /etc/nginx/conf.d/app.conf.template

# Copy startup script
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

RUN apk add curl

# Expose port 80
EXPOSE 80

# Start both services
CMD ["/app/start.sh"]