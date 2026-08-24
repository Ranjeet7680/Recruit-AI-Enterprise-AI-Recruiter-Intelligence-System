"""
FastAPI Dependencies for Authentication, RBAC, and Context Injection.
"""
from typing import Optional, List
from fastapi import Header, HTTPException, status, Depends
from src.core.security import verify_token, UserRole, ROLE_PERMISSIONS
from src.schemas.auth import UserProfile

def get_current_user(
    authorization: Optional[str] = Header(None)
) -> UserProfile:
    """Validates Bearer token or provides default Demo Recruiter in demo mode."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        if payload:
            role = UserRole(payload.get("role", "RECRUITER"))
            return UserProfile(
                user_id=payload.get("sub", "user-001"),
                name=payload.get("name", "Authorized User"),
                email=payload.get("email", "user@nexora.ai"),
                role=role,
                permissions=ROLE_PERMISSIONS.get(role, [])
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials."
        )
    
    # Default Demo Recruiter persona for instant evaluation
    return UserProfile(
        user_id="user-demo-leader",
        name="Ranjeet Kumar",
        email="rajranjeet7680@gmail.com",
        role=UserRole.ADMIN,
        permissions=ROLE_PERMISSIONS[UserRole.ADMIN]
    )

def require_role(allowed_roles: List[UserRole]):
    """Enforces Role-Based Access Control (RBAC) on endpoints."""
    def role_checker(user: UserProfile = Depends(get_current_user)):
        if user.role not in allowed_roles and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}"
            )
        return user
    return role_checker
