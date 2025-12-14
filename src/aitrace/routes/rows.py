"""Dataset row routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.dependencies import get_current_user
from aitrace.models.base import PaginatedResponse
from aitrace.models.row import (
    BulkUpdateStatusRequest,
    CSVImportRequest,
    CSVImportResponse,
    DatasetRowCreate,
    DatasetRowResponse,
    DatasetRowUpdate,
)
from aitrace.models.user import UserResponse
from aitrace.services.row_service import RowService

router = APIRouter(prefix="/datasets/{dataset_id}/rows", tags=["rows"])


@router.get("", response_model=PaginatedResponse)
async def list_rows(
    dataset_id: UUID,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Annotated[str | None, Query()] = None,
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> PaginatedResponse:
    """
    List dataset rows.

    Args:
        dataset_id: Dataset ID
        page: Page number
        page_size: Items per page
        status: Optional status filter
        user: Current user
        db: Database session

    Returns:
        Paginated rows
    """
    row_service = RowService(db)
    rows, total = await row_service.get_by_dataset(dataset_id, page, page_size, status)

    return PaginatedResponse(
        items=rows,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/queue", response_model=PaginatedResponse)
async def get_review_queue(
    dataset_id: UUID,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> PaginatedResponse:
    """
    Get review queue (pending rows).

    Args:
        dataset_id: Dataset ID
        page: Page number
        page_size: Items per page
        user: Current user
        db: Database session

    Returns:
        Paginated pending rows
    """
    row_service = RowService(db)
    rows, total = await row_service.get_pending_rows(dataset_id, page, page_size)

    return PaginatedResponse(
        items=rows,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export", response_class=Response)
async def export_csv(
    dataset_id: UUID,
    only_reviewed: Annotated[bool, Query()] = True,
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> Response:
    """
    Export dataset rows to CSV.

    Args:
        dataset_id: Dataset ID
        only_reviewed: Only export reviewed rows (default: True)
        user: Current user
        db: Database session

    Returns:
        CSV file
    """
    row_service = RowService(db)
    csv_content = await row_service.export_csv(dataset_id, only_reviewed)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dataset_{dataset_id}.csv"},
    )


@router.get("/{row_id}", response_model=DatasetRowResponse)
async def get_row(
    dataset_id: UUID,
    row_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetRowResponse:
    """
    Get row by ID.

    Args:
        dataset_id: Dataset ID
        row_id: Row ID
        user: Current user
        db: Database session

    Returns:
        Row
    """
    row_service = RowService(db)
    return await row_service.get_by_id(row_id)


@router.post("", response_model=DatasetRowResponse, status_code=201)
async def create_row(
    dataset_id: UUID,
    data: DatasetRowCreate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetRowResponse:
    """
    Create row.

    Args:
        dataset_id: Dataset ID
        data: Row create data
        user: Current user
        db: Database session

    Returns:
        Created row
    """
    row_service = RowService(db)
    return await row_service.create(dataset_id, data, user.id)


@router.put("/{row_id}", response_model=DatasetRowResponse)
async def update_row(
    dataset_id: UUID,
    row_id: UUID,
    data: DatasetRowUpdate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetRowResponse:
    """
    Update row.

    Args:
        dataset_id: Dataset ID
        row_id: Row ID
        data: Update data
        user: Current user
        db: Database session

    Returns:
        Updated row
    """
    row_service = RowService(db)
    return await row_service.update(row_id, data, user.id)


@router.delete("/{row_id}", status_code=204)
async def delete_row(
    dataset_id: UUID,
    row_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Delete row.

    Args:
        dataset_id: Dataset ID
        row_id: Row ID
        user: Current user
        db: Database session
    """
    row_service = RowService(db)
    await row_service.delete(row_id)


@router.post("/bulk/update-status", status_code=204)
async def bulk_update_status(
    dataset_id: UUID,
    data: BulkUpdateStatusRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Bulk update row status.

    Args:
        dataset_id: Dataset ID
        data: Bulk update request
        user: Current user
        db: Database session
    """
    row_service = RowService(db)
    await row_service.bulk_update_status(data)


@router.post("/bulk/delete", status_code=204)
async def bulk_delete(
    dataset_id: UUID,
    row_ids: list[UUID],
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Bulk delete rows.

    Args:
        dataset_id: Dataset ID
        row_ids: List of row IDs
        user: Current user
        db: Database session
    """
    row_service = RowService(db)
    await row_service.bulk_delete(row_ids)


@router.post("/import", response_model=CSVImportResponse)
async def import_csv(
    dataset_id: UUID,
    data: CSVImportRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CSVImportResponse:
    """
    Import rows from CSV.

    Args:
        dataset_id: Dataset ID
        data: CSV import request
        user: Current user
        db: Database session

    Returns:
        Import summary
    """
    row_service = RowService(db)
    return await row_service.import_csv(dataset_id, data, user.id)
