# Backend Implementation Guidelines

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| Web Framework | FastAPI |
| Package Manager | uv |
| Database | PostgreSQL |
| ORM | SQLAlchemy (async) |
| DB Driver | asyncpg |
| Migrations | Alembic (future), `schema.sql` for now |
| Validation | Pydantic v2 |
| Configuration | Pydantic Settings + `.env` |
| Auth | JWT (HTTP-only cookie) |
| Formatter | Black + isort |
| Type Checking | mypy (strict) |

---

## Architecture Principles

### Async-First

All database operations and I/O should be async.

```python
# Good
async def get_user(user_id: UUID) -> User:
    return await user_repository.get_by_id(user_id)

# Avoid
def get_user(user_id: UUID) -> User:
    return user_repository.get_by_id(user_id)
```

### Layer Separation

```
Routes → Services → Repositories → Database
```

- **Routes**: HTTP handling, validation, auth checks
- **Services**: Business logic, orchestration
- **Repositories**: Data access, queries

### Code Reusability

Extract common patterns into shared utilities in `/common`.

---

## Code Standards

### Type Hints

Required everywhere. Use strict mypy.

```python
# Good
async def create_dataset(name: str, schema_id: UUID, user: User) -> Dataset:
    ...

# Bad
async def create_dataset(name, schema_id, user):
    ...
```

### Documentation

Use docstrings, not inline comments.

```python
# Good
async def create_dataset(name: str, schema_id: UUID, user: User) -> Dataset:
    """
    Create a new dataset.

    Args:
        name: Dataset name (must be unique per team)
        schema_id: Reference to the schema
        user: Current authenticated user

    Returns:
        The created dataset

    Raises:
        NotFoundException: If schema does not exist
        DuplicateException: If dataset name already exists
    """
    ...

# Avoid
async def create_dataset(name: str, schema_id: UUID, user: User) -> Dataset:
    # Check if schema exists
    schema = await schema_repository.get_by_id(schema_id)
    # Create the dataset
    ...
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions | snake_case | `get_user_by_id` |
| Classes | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Files | snake_case | `user_service.py` |
| Tables | plural, snake_case | `users`, `dataset_rows` |

### Formatting

Use Black + isort. Configure in `pyproject.toml`:

```toml
[tool.black]
line-length = 100
target-version = ["py311"]

[tool.isort]
profile = "black"
line_length = 100
```

---

## API Design

### Versioning

All routes prefixed with `/api/v1/`.

```python
router = APIRouter(prefix="/api/v1")
```

### Response Format

Return data directly. No envelope.

```python
# Good - Direct response
@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: UUID) -> DatasetResponse:
    return await dataset_service.get_by_id(dataset_id)

# Avoid - Envelope
@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: UUID) -> dict:
    return {"data": await dataset_service.get_by_id(dataset_id)}
```

### Error Format

All errors return JSON with `code` and `message`.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid email format"
}
```

Standard error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not allowed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

Exception handler:

```python
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )
```

### Pagination

Use offset-based pagination with sensible defaults.

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | 1 | - |
| `page_size` | varies by endpoint | 100 |

```python
@router.get("/datasets")
async def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[DatasetResponse]:
    ...
```

Response includes pagination metadata:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

---

## Authentication

### JWT

- Stored in HTTP-only cookie
- Single `SECRET_KEY` for signing
- Expiration: 24 hours (default), 7 days (remember me)
- No refresh token — user re-logins when expired

```python
def create_access_token(user_id: UUID, remember_me: bool = False) -> str:
    expires_delta = timedelta(days=7) if remember_me else timedelta(hours=24)
    expire = datetime.utcnow() + expires_delta
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
```

### Cookie Settings

```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,  # HTTPS only in production
    samesite="strict",
    max_age=max_age_seconds,
)
```

### Protected Routes

Use FastAPI dependency:

```python
async def get_current_user(request: Request) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise AppException("UNAUTHORIZED", "Not authenticated", 401)
    # Decode and validate...

@router.get("/datasets")
async def list_datasets(user: User = Depends(get_current_user)):
    ...
```

---

## Database

### Connection

Use asyncpg with SQLAlchemy async.

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(settings.DATABASE_URL)
```

### Schema Location

```
database/
└── schema.sql
```

### UUID Generation

Generate UUIDs in Python, not database.

```python
import uuid

id = uuid.uuid4()
```

### Table Naming

Use plural, snake_case.

| Entity | Table Name |
|--------|------------|
| User | `users` |
| Team | `teams` |
| Dataset | `datasets` |
| DatasetRow | `dataset_rows` |
| Schema | `schemas` |
| SchemaField | `schema_fields` |

### Dynamic Data

Use JSONB for dynamic field values.

```sql
CREATE TABLE dataset_rows (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id),
    image_url TEXT NOT NULL,
    image_hash VARCHAR(32) NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    ...
);
```

### No Soft Delete

Use hard delete everywhere.

```python
async def delete(self, id: UUID) -> None:
    query = delete(DatasetRow).where(DatasetRow.id == id)
    await self.session.execute(query)
```

---

## Configuration

### Pydantic Settings

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost/aitrace` |
| `SECRET_KEY` | JWT signing key | `your-secret-key-min-32-chars` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |

### Example `.env`

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/aitrace
SECRET_KEY=your-very-secure-secret-key-at-least-32-characters
LOG_LEVEL=INFO
```

---

## Logging

Use standard Python logging.

### Format

```
2025-01-15 10:30:00 INFO [auth_service] User logged in: user@example.com
```

### Configuration

```python
import logging

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)
```

### Usage

```python
logger.info(f"User logged in: {user.email}")
logger.warning(f"Failed login attempt for: {email}")
logger.error(f"Database error: {e}")
```

---

## Testing

### Location

Tests live in `/tests` at root, not inside `/src`.

```
tests/
├── conftest.py
├── test_auth.py
├── test_datasets.py
└── ...
```

### Approach

- Prefer integration tests over unit tests
- Unit test only when checking specific implementation logic
- Use pytest + pytest-asyncio

### Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_dataset(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/datasets",
        json={"name": "Test Dataset", "schema_id": "..."},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Dataset"
```

---

## Project Structure Reference

```
src/aitrace/
├── main.py                 # FastAPI app, middleware, exception handlers
├── run_local.py            # Local dev runner
├── common/
│   ├── database.py         # Engine, session factory
│   ├── settings.py         # Pydantic Settings
│   ├── exceptions.py       # AppException, error codes
│   └── dependencies.py     # get_current_user, get_db
├── models/
│   ├── user.py             # SQLAlchemy model + Pydantic schemas
│   ├── team.py
│   ├── dataset.py
│   ├── schema.py
│   └── row.py
├── repositories/
│   ├── user_repository.py
│   ├── team_repository.py
│   ├── dataset_repository.py
│   ├── schema_repository.py
│   └── row_repository.py
├── services/
│   ├── auth_service.py
│   ├── user_service.py
│   ├── dataset_service.py
│   ├── schema_service.py
│   └── row_service.py
├── routes/
│   ├── auth.py
│   ├── users.py
│   ├── datasets.py
│   ├── schemas.py
│   └── rows.py
└── ee/                     # Future enterprise features
```

---

## Quick Reference

| Topic | Decision |
|-------|----------|
| Framework | FastAPI |
| ORM | SQLAlchemy async |
| Auth | JWT in HTTP-only cookie |
| API prefix | `/api/v1` |
| Response format | Direct (no envelope) |
| Error format | `{"code": "...", "message": "..."}` |
| Pagination | Offset-based, max 100 |
| UUID | Python-generated |
| Tables | Plural snake_case |
| Delete | Hard delete |
| Types | Required, mypy strict |
| Docs | Docstrings only, no inline comments |
| Tests | Integration preferred, in `/tests` |
```
