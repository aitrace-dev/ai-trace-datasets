from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_trace_datasets.core.logging import (  # noqa: F401  # Configure logging before anything else
    logging_config,
)
from ai_trace_datasets.core.routes import (
    admin_users,
    datasets,
    datasets_images,
    datasets_tests,
    feature_flags,
    health,
    key_management,
    user_auth,
images_preview
)
from ai_trace_datasets.core.settings.config import settings
from ai_trace_datasets.core.storage.storage_provider import images_storage


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await images_storage.init()
    yield


app = FastAPI(title="AI Trace Datasets API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.DEPLOYMENT_MODE == "SASS":
    from ai_trace_datasets.ee.controller import token_exchange
    app.include_router(token_exchange.router, prefix="/api/v1/auth", tags=["user_auth"])
else:
    app.include_router(user_auth.router, prefix="/api/v1/auth", tags=["user_auth"])
    app.include_router(admin_users.router, prefix="/api/v1/admin/users", tags=["admin"])

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])

app.include_router(datasets_tests.router, prefix="/api/v1/datasets/{dataset_id}")
app.include_router(datasets.router, prefix="/api/v1/datasets")
app.include_router(
    datasets_images.router, prefix="/api/v1/datasets/{dataset_id}/images"
)
app.include_router(
    key_management.router, prefix="/api/v1/key-management", tags=["key_management"]
)
app.include_router(
    feature_flags.router, prefix="/api/v1/feature-flags", tags=["feature_flags"]
)

app.include_router(
    images_preview.router, prefix="/api/v1/images-preview", tags=["images-preview"]
)