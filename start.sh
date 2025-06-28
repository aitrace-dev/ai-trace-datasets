#!/bin/sh
# Replace environment variables in the Nginx config template
sed "s/BACKEND_HOST/${BACKEND_HOST}/g; s/BACKEND_PORT/${BACKEND_PORT}/g" /etc/nginx/conf.d/app.conf.template > /etc/nginx/conf.d/app.conf

# Start the backend server
cd /app
source /app/.venv/bin/activate
uv run -m uvicorn ai_trace_datasets.main:app --host 0.0.0.0 --port 8000 &
echo "Backend server started"

# Wait for backend to be healthy
echo "Waiting for backend to become healthy..."
until curl -sf http://localhost:8000/api/v1/health; do
    sleep 1
done
echo "Backend is healthy, starting Nginx..."

# Start Nginx
nginx -g "daemon off;"