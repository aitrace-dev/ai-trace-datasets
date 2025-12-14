"""Main FastAPI application."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from aitrace.common.database import session_wrapper
from aitrace.common.exceptions import AppException
from aitrace.common.settings import settings
from aitrace.routes import auth, datasets, rows, schemas, setup, users

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting AITrace Datasets API")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"Log level: {settings.LOG_LEVEL}")
    await session_wrapper.connect()

    yield

    # Shutdown
    logger.info("Shutting down AITrace Datasets API")
    logger.info("Database connections cleaned up")
    await session_wrapper.disconnect()


# Create FastAPI app
app = FastAPI(
    title="AITrace Datasets",
    description="Dataset management tool with Airtable-inspired UI",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware (for local development)
if settings.ENV == "local":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions."""
    logger.error(f"Application error: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "Internal server error"},
    )


# Health check
@app.get("/api/v1/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


# API routes
app.include_router(setup.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(schemas.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(rows.router, prefix="/api/v1")

# Mount static files (only in production)
if settings.ENV != "local":
    static_path = Path(__file__).parent / "static"
    if static_path.exists():
        logger.info(f"Mounting static files from {static_path}")

        # Mount static assets (JS, CSS, images, etc.) if assets directory exists
        assets_path = static_path / "assets"
        if assets_path.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
            logger.info(f"Mounted assets from {assets_path}")

        # Catch-all route for SPA - must be last to serve index.html for all non-API routes
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve the SPA for all non-API routes."""
            # Check if requesting a specific file that exists (favicon, robots.txt, etc.)
            file_path = static_path / full_path
            if file_path.is_file():
                return FileResponse(file_path)

            # Otherwise serve index.html for SPA routing
            index_path = static_path / "index.html"
            if index_path.exists():
                return FileResponse(index_path)

            return JSONResponse(
                status_code=404,
                content={"detail": "Frontend not found"}
            )
    else:
        logger.warning("Static files directory not found")
