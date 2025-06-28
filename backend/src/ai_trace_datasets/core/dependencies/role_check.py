from typing import List

from fastapi import Depends, HTTPException, status

from ai_trace_datasets.core.dependencies.auth import get_current_user
from ai_trace_datasets.core.schemas.user_auth import UserDto


def require_role(
        required_roles: List[str], user: UserDto = Depends(get_current_user)
) -> UserDto:
    """
    Dependency to check if the current user has any of the required roles.
    Returns the user if they have at least one of the required roles, otherwise raises an HTTPException.
    """
    if not any(role in user.roles for role in required_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have the required role(s): {', '.join(required_roles)}",
        )
    return user


def require_admin(user: UserDto = Depends(get_current_user)) -> UserDto:
    """
    Dependency to check if the current user has the admin role.
    Returns the user if they have the admin role, otherwise raises an HTTPException.
    """
    require_role(["admin"], user)
    return user
