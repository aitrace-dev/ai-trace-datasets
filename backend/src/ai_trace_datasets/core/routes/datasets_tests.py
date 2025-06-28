import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.auth import (
    get_current_user,
    verify_client_auth,
)
from ai_trace_datasets.core.models.test_run import TestRunModel
from ai_trace_datasets.core.repositories.datasets import find_by_id_and_org_id
from ai_trace_datasets.core.schemas.datasets import TestRunRequest, TestRunResponse
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.services.organization import (
    validate_dataset_belongs_to_organization,
)

router = APIRouter()


@router.get("/tests", tags=["datasets-tests"])
async def get_test_runs(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
) -> list[TestRunResponse]:
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    test_runs = await db.execute(
        select(TestRunModel)
        .where(TestRunModel.dataset_id == dataset_id)
        .order_by(TestRunModel.run_end_time.desc())
    )
    to_return = test_runs.scalars().all()
    return [
        TestRunResponse(
            id=str(tr.id),
            description=tr.description,
            run_start_time=tr.run_start_time,
            run_end_time=tr.run_end_time,
            status=tr.status,
            precision=tr.precision,
            recall=tr.recall,
            accuracy=tr.accuracy,
            f1_score=tr.f1_score,
            n_test_cases=tr.n_test_cases,
            extra_metrics=tr.extra_metrics,
        )
        for tr in to_return
    ]


@router.post(
    "/tests", tags=["datasets-tests"], dependencies=[Depends(verify_client_auth)]
)
async def persist_test_run(
    dataset_id: str, request: TestRunRequest, db: AsyncSession = Depends(get_db_async)
):
    dataset = await find_by_id_and_org_id(dataset_id, db)
    model_id = str(uuid.uuid4())
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )

    model = TestRunModel(
        id=model_id,
        dataset_id=dataset_id,
        description=request.description,
        run_start_time=request.run_start_time,
        run_end_time=request.run_end_time,
        status=request.status,
        precision=request.precision,
        recall=request.recall,
        accuracy=request.accuracy,
        f1_score=request.f1_score,
        n_test_cases=request.n_test_cases,
        extra_metrics=request.extra_metrics,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(model)
    return TestRunModel(
        id=model_id,
        dataset_id=dataset_id,
        description=request.description,
        run_start_time=request.run_start_time,
        run_end_time=request.run_end_time,
        status=request.status,
        precision=request.precision,
        recall=request.recall,
        accuracy=request.accuracy,
        f1_score=request.f1_score,
        n_test_cases=request.n_test_cases,
        extra_metrics=request.extra_metrics,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
