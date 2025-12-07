# Folder Structure

## Overview

AITrace Datasets is a monorepo containing both backend (Python) and frontend code.

## Root Structure
```
aitrace-datasets/
├── src/
│   └── aitrace/            # Backend application
├── frontend/               # Frontend application
├── tests/                  # Backend tests
├── documentation/          # Project documentation (specs, guides)
├── pyproject.toml          # Python project config
├── uv.lock                 # UV dependency lock file
├── Dockerfile              # Container build
├── LICENSE                 # MIT License
├── LICENSE-EE              # Enterprise License
├── README.md               # Project readme
└── LICENSING.md            # Licensing guidelines
```

## Backend Structure
```
src/aitrace/
├── main.py                 # FastAPI app entry point
├── run_local.py            # Local development runner
├── common/                 # Shared utilities
│   ├── database.py         # Database client & connection
│   ├── settings.py         # Pydantic settings / config
│   ├── exceptions.py       # Custom exceptions
│   └── dependencies.py     # FastAPI dependencies
├── routes/                 # API route handlers
│   ├── auth.py
│   ├── users.py
│   ├── teams.py
│   ├── schemas.py
│   ├── datasets.py
│   └── rows.py
├── services/               # Business logic
│   ├── auth_service.py
│   ├── user_service.py
│   ├── team_service.py
│   ├── schema_service.py
│   ├── dataset_service.py
│   └── row_service.py
├── repositories/           # Data access layer
│   ├── user_repository.py
│   ├── team_repository.py
│   ├── schema_repository.py
│   ├── dataset_repository.py
│   └── row_repository.py
├── models/                 # Pydantic models & DB schemas
│   ├── user.py
│   ├── team.py
│   ├── schema.py
│   ├── dataset.py
│   └── row.py
└── ee/                     # Enterprise features (Proprietary)
    ├── multi_team/
    ├── invites/
    ├── billing/
    └── ai_features/
```

## Frontend Structure
```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API client services
│   ├── stores/             # State management
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript types
│   └── ee/                 # Enterprise features (Proprietary)
├── tests/                  # Frontend tests
├── public/                 # Static assets
├── package.json
└── ...
```

## Tests Structure
```
tests/                      # Backend tests
├── conftest.py             # Pytest fixtures
├── test_auth.py
├── test_users.py
├── test_teams.py
├── test_schemas.py
├── test_datasets.py
└── test_rows.py

frontend/tests/             # Frontend tests
├── components/
├── pages/
└── ...
```

## Documentation Structure
```
documentation/
├── FOLDER_STRUCTURE.md     # This file
├── LICENSING.md            # License guidelines
├── specs/
│   ├── authentication.md
│   ├── datasets.md
│   ├── schemas.md
│   └── rows.md
└── guides/
    ├── setup.md
    ├── deployment.md
    └── contributing.md
```

## Layer Responsibilities

### Routes (`/routes`)

- HTTP request/response handling
- Input validation
- Authentication checks
- Calls services
```python
# routes/datasets.py
@router.post("/datasets")
async def create_dataset(data: CreateDatasetRequest, user: User = Depends(get_current_user)):
    return await dataset_service.create(data, user)
```

### Services (`/services`)

- Business logic
- Orchestrates repositories
- No direct DB access
```python
# services/dataset_service.py
async def create(data: CreateDatasetRequest, user: User) -> Dataset:
    schema = await schema_repository.get_by_id(data.schema_id)
    if not schema:
        raise NotFoundException("Schema not found")
    return await dataset_repository.create(data, user)
```

### Repositories (`/repositories`)

- Data access layer
- Database queries
- Returns models
```python
# repositories/dataset_repository.py
async def create(data: CreateDatasetRequest, user: User) -> Dataset:
    query = "INSERT INTO datasets ..."
    return await db.execute(query)
```

### Common (`/common`)

- Shared utilities
- Database connection
- App configuration
- Custom exceptions
- FastAPI dependencies

### Models (`/models`)

- Pydantic request/response models
- Database model definitions

## Import Rules
```
routes → services → repositories → common
           ↓
        models
```

- Routes import services
- Services import repositories and models
- Repositories import common (db) and models
- No circular imports
- No reverse direction imports

## EE Code Rules

See [LICENSING.md](./LICENSING.md) for full details.

- All EE code lives in `ee/` folders (backend and frontend)
- Core code must never import from `ee/`
- EE code can import from core
- EE features enabled via `ENABLE_EE` environment variable