# Quick Start Guide

This guide will help you get AITrace Datasets running locally in under 5 minutes.

## Prerequisites

Install these first:
- **Python 3.11+**: `python --version`
- **uv**: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Docker**: For PostgreSQL database

## Step 1: Clone & Enter Directory

```bash
cd /Users/leaseplan/Develop/aitrace-agents_1_0
```

## Step 2: Start Database

```bash
docker-compose up -d postgres
```

Wait 10 seconds for PostgreSQL to initialize.

## Step 3: Setup Backend

```bash
# Install Python dependencies (fast with uv!)
uv sync

# Create environment file
cp .env.example .env

# Initialize database schema
docker exec -i $(docker-compose ps -q postgres) psql -U postgres -d aitrace < database/schema.sql
```

## Step 4: Start Backend Server

```bash
uv run python src/aitrace/run_local.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

## Step 5: Test the API

Open your browser:

- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health

## Step 6: Initialize App (First Time Setup)

Using the API docs or curl:

```bash
curl -X POST http://localhost:8000/api/v1/setup/init \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'
```

You should get a response with your user and team IDs.

## Step 7: Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "remember_me": false
  }' \
  -c cookies.txt
```

The JWT token is stored in cookies.txt.

## Step 8: Make Authenticated Requests

```bash
# Get current user
curl http://localhost:8000/api/v1/auth/me -b cookies.txt

# List schemas (empty initially)
curl http://localhost:8000/api/v1/schemas -b cookies.txt

# Create a schema
curl -X POST http://localhost:8000/api/v1/schemas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Product Images",
    "description": "Schema for product image dataset",
    "fields": [
      {
        "name": "Category",
        "type": "enum",
        "required": true,
        "position": 0,
        "config": {
          "options": ["Electronics", "Clothing", "Food", "Other"]
        }
      },
      {
        "name": "Description",
        "type": "text",
        "required": false,
        "position": 1,
        "config": {
          "max_length": 500,
          "multiline": true
        }
      },
      {
        "name": "In Stock",
        "type": "boolean",
        "required": true,
        "position": 2,
        "config": {}
      }
    ]
  }'
```

## Explore the API

Visit http://localhost:8000/api/docs to explore all available endpoints:

- **Setup**: Initialize app
- **Auth**: Login, logout, password management
- **Users**: User management (admin only)
- **Schemas**: Create and manage field schemas
- **Datasets**: Create datasets based on schemas
- **Rows**: Add images and data to datasets

## Next Steps

### Create a Schema

1. Go to http://localhost:8000/api/docs#/schemas/create_schema
2. Click "Try it out"
3. Define your fields (boolean, enum, text, numeric)
4. Execute

### Create a Dataset

1. Go to http://localhost:8000/api/docs#/datasets/create_dataset
2. Use the schema ID from previous step
3. Give it a name and description
4. Execute

### Add Rows (Images + Data)

1. Go to http://localhost:8000/api/docs#/rows/create_row
2. Provide:
   - dataset_id
   - image_url (any valid image URL)
   - data (JSON object mapping field IDs to values)
3. Execute

The system will:
- Fetch the image
- Compute MD5 hash
- Check for duplicates
- Auto-calculate status (pending/reviewed) based on required fields

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use a different port
uv run uvicorn aitrace.main:app --host 0.0.0.0 --port 8001
```

### Schema Already Exists Error

Database was already initialized. You can either:
- Use the existing database
- Drop and recreate: `docker-compose down -v && docker-compose up -d postgres`

## Stop Everything

```bash
# Stop backend: Press Ctrl+C in terminal

# Stop database
docker-compose down

# Remove database data (WARNING: deletes all data!)
docker-compose down -v
```

## What's Next?

- Read the full [README.md](README.md)
- Check [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for what's complete
- Contribute by building the frontend! See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Need help?** Open an issue on GitHub or check the API docs at http://localhost:8000/api/docs
