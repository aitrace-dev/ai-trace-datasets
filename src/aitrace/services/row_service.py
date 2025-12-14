"""Dataset row service."""

import hashlib
import io
from csv import DictReader, DictWriter
from typing import Any
from uuid import UUID, uuid4

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import DuplicateException, NotFoundException, ValidationException
from aitrace.models.row import (
    BulkUpdateStatusRequest,
    CSVImportRequest,
    CSVImportResponse,
    DatasetRow,
    DatasetRowCreate,
    DatasetRowResponse,
    DatasetRowUpdate,
)
from aitrace.repositories.dataset_repository import DatasetRepository
from aitrace.repositories.row_repository import DatasetRowRepository
from aitrace.repositories.schema_repository import SchemaRepository


class RowService:
    """Dataset row service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize row service."""
        self.db = db
        self.row_repo = DatasetRowRepository(db)
        self.dataset_repo = DatasetRepository(db)
        self.schema_repo = SchemaRepository(db)

    async def compute_image_hash(self, image_url: str) -> str:
        """
        Compute MD5 hash of image content.

        Args:
            image_url: Image URL

        Returns:
            MD5 hash

        Raises:
            ValidationException: If image cannot be fetched
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()

                # Compute MD5 hash
                hash_md5 = hashlib.md5()
                hash_md5.update(response.content)

                return hash_md5.hexdigest()
        except Exception as e:
            raise ValidationException(f"Image could not be loaded: {str(e)}")

    def calculate_status(self, data: dict[str, Any], required_fields: list[str]) -> str:
        """
        Calculate row status based on required fields.

        Args:
            data: Row data
            required_fields: List of required field IDs

        Returns:
            Status ('pending' or 'reviewed')
        """
        if not required_fields:
            return "reviewed"

        for field_id in required_fields:
            if field_id not in data or data[field_id] is None or data[field_id] == "":
                return "pending"

        return "reviewed"

    async def get_by_id(self, row_id: UUID) -> DatasetRowResponse:
        """
        Get row by ID.

        Args:
            row_id: Row ID

        Returns:
            Row response

        Raises:
            NotFoundException: If row not found
        """
        row = await self.row_repo.get_by_id(row_id)

        if not row:
            raise NotFoundException("Row not found")

        return DatasetRowResponse.model_validate(row)

    async def get_by_dataset(
        self, dataset_id: UUID, page: int = 1, page_size: int = 20, status: str | None = None
    ) -> tuple[list[DatasetRowResponse], int]:
        """
        Get rows by dataset.

        Args:
            dataset_id: Dataset ID
            page: Page number
            page_size: Items per page
            status: Optional status filter

        Returns:
            Tuple of (rows, total_count)
        """
        rows, total = await self.row_repo.get_by_dataset(dataset_id, page, page_size, status)

        # Convert to response models with email fields
        responses = []
        for r in rows:
            response = DatasetRowResponse.model_validate(r)
            # Add email fields from relationships
            if r.creator:
                response.created_by_email = r.creator.email
            if r.updater:
                response.updated_by_email = r.updater.email
            responses.append(response)

        return responses, total

    async def get_pending_rows(
        self, dataset_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[DatasetRowResponse], int]:
        """
        Get pending rows for dataset.

        Args:
            dataset_id: Dataset ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (rows, total_count)
        """
        rows, total = await self.row_repo.get_pending_rows(dataset_id, page, page_size)

        # Convert to response models with email fields
        responses = []
        for r in rows:
            response = DatasetRowResponse.model_validate(r)
            # Add email fields from relationships
            if r.creator:
                response.created_by_email = r.creator.email
            if r.updater:
                response.updated_by_email = r.updater.email
            responses.append(response)

        return responses, total

    async def create(
        self, dataset_id: UUID, data: DatasetRowCreate, created_by: UUID
    ) -> DatasetRowResponse:
        """
        Create dataset row.

        Args:
            dataset_id: Dataset ID
            data: Row create data
            created_by: Creator user ID

        Returns:
            Created row

        Raises:
            NotFoundException: If dataset not found
            DuplicateException: If image hash already exists
            ValidationException: If image invalid
        """
        # Get dataset and schema
        dataset = await self.dataset_repo.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundException("Dataset not found")

        schema = await self.schema_repo.get_by_id_with_fields(dataset.schema_id)
        if not schema:
            raise NotFoundException("Schema not found")

        # Compute image hash
        image_hash = await self.compute_image_hash(data.image_url)

        # Check for duplicate
        if await self.row_repo.exists_by_image_hash(dataset_id, image_hash):
            raise DuplicateException("This image already exists in the dataset")

        # Calculate status
        required_field_ids = [str(f.id) for f in schema.fields if f.required]
        status = self.calculate_status(data.data, required_field_ids)

        # Create row
        row = DatasetRow(
            id=uuid4(),
            dataset_id=dataset_id,
            image_url=data.image_url,
            image_hash=image_hash,
            data=data.data,
            status=status,
            created_by=created_by,
            updated_by=created_by,
        )

        row = await self.row_repo.create(row)

        return DatasetRowResponse.model_validate(row)

    async def update(
        self, row_id: UUID, data: DatasetRowUpdate, updated_by: UUID
    ) -> DatasetRowResponse:
        """
        Update dataset row.

        Args:
            row_id: Row ID
            data: Update data
            updated_by: Updater user ID

        Returns:
            Updated row

        Raises:
            NotFoundException: If row not found
            DuplicateException: If image hash already exists
            ValidationException: If image invalid
        """
        row = await self.row_repo.get_by_id(row_id)

        if not row:
            raise NotFoundException("Row not found")

        # Get schema for status calculation
        dataset = await self.dataset_repo.get_by_id(row.dataset_id)
        schema = await self.schema_repo.get_by_id_with_fields(dataset.schema_id)

        # Update image if provided
        if data.image_url and data.image_url != row.image_url:
            image_hash = await self.compute_image_hash(data.image_url)

            if await self.row_repo.exists_by_image_hash(row.dataset_id, image_hash, row_id):
                raise DuplicateException("This image already exists in the dataset")

            row.image_url = data.image_url
            row.image_hash = image_hash

        # Update data if provided
        if data.data is not None:
            row.data = data.data

            # Recalculate status based on required fields
            required_field_ids = [str(f.id) for f in schema.fields if f.required]
            row.status = self.calculate_status(row.data, required_field_ids)

        # Manual status override
        if data.status:
            row.status = data.status.value

        row.updated_by = updated_by

        row = await self.row_repo.update(row)

        return DatasetRowResponse.model_validate(row)

    async def delete(self, row_id: UUID) -> None:
        """
        Delete row.

        Args:
            row_id: Row ID

        Raises:
            NotFoundException: If row not found
        """
        row = await self.row_repo.get_by_id(row_id)

        if not row:
            raise NotFoundException("Row not found")

        await self.row_repo.delete(row_id)

    async def bulk_update_status(self, data: BulkUpdateStatusRequest) -> None:
        """
        Bulk update row status.

        Args:
            data: Bulk update request
        """
        await self.row_repo.bulk_update_status(data.row_ids, data.status.value)

    async def bulk_delete(self, row_ids: list[UUID]) -> None:
        """
        Bulk delete rows.

        Args:
            row_ids: List of row IDs
        """
        await self.row_repo.bulk_delete(row_ids)

    async def import_csv(
        self, dataset_id: UUID, data: CSVImportRequest, created_by: UUID
    ) -> CSVImportResponse:
        """
        Import rows from CSV.

        Args:
            dataset_id: Dataset ID
            data: CSV import request
            created_by: Creator user ID

        Returns:
            Import summary

        Raises:
            NotFoundException: If dataset not found
        """
        # Get dataset and schema
        dataset = await self.dataset_repo.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundException("Dataset not found")

        schema = await self.schema_repo.get_by_id_with_fields(dataset.schema_id)
        if not schema:
            raise NotFoundException("Schema not found")

        # Parse CSV
        csv_file = io.StringIO(data.file_content)
        reader = DictReader(csv_file)

        imported = 0
        skipped_duplicates = 0
        skipped_invalid = 0
        errors: list[str] = []

        required_field_ids = [str(f.id) for f in schema.fields if f.required]

        for idx, csv_row in enumerate(reader, start=2):  # Start at 2 to account for header
            try:
                # Extract image URL
                image_url_column = data.column_mapping.get("image_url")
                if not image_url_column or image_url_column not in csv_row:
                    errors.append(f"Row {idx}: Missing image URL")
                    skipped_invalid += 1
                    continue

                image_url = csv_row[image_url_column]

                # Compute hash
                try:
                    image_hash = await self.compute_image_hash(image_url)
                except Exception as e:
                    errors.append(f"Row {idx}: Invalid image - {str(e)}")
                    skipped_invalid += 1
                    continue

                # Check duplicate
                if await self.row_repo.exists_by_image_hash(dataset_id, image_hash):
                    skipped_duplicates += 1
                    continue

                # Map data
                row_data = {}
                for field_id, csv_column in data.column_mapping.items():
                    if field_id != "image_url" and csv_column in csv_row:
                        row_data[field_id] = csv_row[csv_column]

                # Calculate status
                if data.mark_all_pending:
                    status = "pending"
                else:
                    status = self.calculate_status(row_data, required_field_ids)

                # Create row
                row = DatasetRow(
                    id=uuid4(),
                    dataset_id=dataset_id,
                    image_url=image_url,
                    image_hash=image_hash,
                    data=row_data,
                    status=status,
                    created_by=created_by,
                    updated_by=created_by,
                )

                await self.row_repo.create(row)
                imported += 1

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
                skipped_invalid += 1

        return CSVImportResponse(
            imported=imported,
            skipped_duplicates=skipped_duplicates,
            skipped_invalid=skipped_invalid,
            errors=errors[:100],  # Limit errors to first 100
        )

    async def export_csv(self, dataset_id: UUID, only_reviewed: bool = True) -> str:
        """
        Export dataset rows to CSV.

        Args:
            dataset_id: Dataset ID
            only_reviewed: Only export reviewed rows (default: True)

        Returns:
            CSV content as string

        Raises:
            NotFoundException: If dataset not found
        """
        # Get dataset and schema
        dataset = await self.dataset_repo.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundException("Dataset not found")

        schema = await self.schema_repo.get_by_id_with_fields(dataset.schema_id)
        if not schema:
            raise NotFoundException("Schema not found")

        # Get all rows (no pagination for export)
        all_rows = []
        page = 1
        page_size = 100
        status_filter = "reviewed" if only_reviewed else None

        while True:
            rows, total = await self.row_repo.get_by_dataset(dataset_id, page, page_size, status=status_filter)
            all_rows.extend(rows)

            if len(all_rows) >= total:
                break

            page += 1

        # Build CSV
        output = io.StringIO()

        # Define columns: image_url + all schema fields + system fields
        field_columns = {str(field.id): field.name for field in schema.fields}
        columns = ["image_url"] + list(field_columns.values()) + ["status", "created_at", "updated_at", "updated_by"]

        writer = DictWriter(output, fieldnames=columns)
        writer.writeheader()

        # Write rows
        for row in all_rows:
            csv_row = {"image_url": row.image_url}

            # Add field data using field names
            for field_id, field_name in field_columns.items():
                csv_row[field_name] = row.data.get(field_id, "")

            # Add system fields
            csv_row["status"] = row.status
            csv_row["created_at"] = row.created_at.isoformat() if row.created_at else ""
            csv_row["updated_at"] = row.updated_at.isoformat() if row.updated_at else ""

            # Add updated_by email
            if row.updater:
                csv_row["updated_by"] = row.updater.email
            else:
                csv_row["updated_by"] = ""

            writer.writerow(csv_row)

        return output.getvalue()
