import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.organization import OrganizationModel


async def get_default_organization(db: AsyncSession) -> str:
    """
    Get the default organization.

    This method retrieves the first organization in the database, which is considered
    the default organization. If no organization exists, it creates a new default organization.

    Args:
        db: Database session

    Returns:
        The default organization
    """
    # Try to get the first organization (default)
    stmt = select(OrganizationModel)
    result = await db.execute(stmt)
    organization = result.scalars().first()

    # If no organization exists, create a default one
    if not organization:
        organization_id = await create_organization(db, "Default Organization")
    else:
        organization_id = str(organization.id)

    return organization_id


async def create_organization(db: AsyncSession, name: str) -> str:
    """
    Create a new organization.

    Args:
        db: Database session
        name: Name of the organization

    Returns:
        The newly created organization
    """
    # Create new organization
    new_org_id = str(uuid.uuid4())
    new_organization = OrganizationModel(
        id=new_org_id, name=name, created_at=datetime.now()
    )
    db.add(new_organization)
    await db.commit()
    await db.refresh(new_organization)
    return new_org_id


async def get_organization_by_id(
    db: AsyncSession, organization_id: UUID
) -> OrganizationModel:
    """
    Get an organization by ID.

    Args:
        db: Database session
        organization_id: UUID of the organization to retrieve

    Returns:
        The organization if found, None otherwise
    """
    stmt = select(OrganizationModel).where(OrganizationModel.id == organization_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_organization_by_name(db: AsyncSession, name: str) -> OrganizationModel:
    """
    Get an organization by name.

    Args:
        db: Database session
        name: Name of the organization to retrieve

    Returns:
        The organization if found, None otherwise
    """
    stmt = select(OrganizationModel).where(OrganizationModel.name == name)
    result = await db.execute(stmt)
    return result.scalars().first()
