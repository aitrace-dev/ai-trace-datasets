"""Schema routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.dependencies import get_current_user
from aitrace.models.base import PaginatedResponse
from aitrace.models.schema import SchemaCreate, SchemaResponse, SchemaUpdate
from aitrace.models.user import UserResponse
from aitrace.services.schema_service import SchemaService

router = APIRouter(prefix="/schemas", tags=["schemas"])


@router.get("", response_model=PaginatedResponse[SchemaResponse])
async def list_schemas(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> PaginatedResponse[SchemaResponse]:
    """
    List schemas.

    Args:
        page: Page number
        page_size: Items per page
        user: Current user
        db: Database session

    Returns:
        Paginated schemas
    """
    schema_service = SchemaService(db)
    schemas, total = await schema_service.get_by_team(user.team_id, page, page_size)

    return PaginatedResponse[SchemaResponse](
        items=schemas,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{schema_id}", response_model=SchemaResponse)
async def get_schema(
    schema_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SchemaResponse:
    """
    Get schema by ID.

    Args:
        schema_id: Schema ID
        user: Current user
        db: Database session

    Returns:
        Schema
    """
    schema_service = SchemaService(db)
    return await schema_service.get_by_id(schema_id)


@router.post("", response_model=SchemaResponse, status_code=201)
async def create_schema(
    data: SchemaCreate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SchemaResponse:
    """
    Create schema.

    Args:
        data: Schema create data
        user: Current user
        db: Database session

    Returns:
        Created schema
    """
    schema_service = SchemaService(db)
    return await schema_service.create(data, user.team_id, user.id)


@router.put("/{schema_id}", response_model=SchemaResponse)
async def update_schema(
    schema_id: UUID,
    data: SchemaUpdate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SchemaResponse:
    """
    Update schema.

    Args:
        schema_id: Schema ID
        data: Update data
        user: Current user
        db: Database session

    Returns:
        Updated schema
    """
    schema_service = SchemaService(db)
    return await schema_service.update(schema_id, data, user.id)


@router.delete("/{schema_id}", status_code=204)
async def delete_schema(
    schema_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Delete schema.

    Args:
        schema_id: Schema ID
        user: Current user
        db: Database session
    """
    schema_service = SchemaService(db)
    await schema_service.delete(schema_id)
