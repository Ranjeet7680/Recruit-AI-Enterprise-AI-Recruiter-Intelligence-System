"""
Authentication Endpoints: Token creation, Social SSO gateways, and User Profile.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from src.schemas.auth import Token, LoginRequest, SocialLoginRequest, UserProfile
from src.core.security import create_access_token, UserRole
from src.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=Token)
def login_for_access_token(req: LoginRequest):
    # Simulated authentication for demo/enterprise deployment
    role = req.role or UserRole.RECRUITER
    token_str = create_access_token(
        user_id="user-nexora-01",
        email=req.email,
        role=role
    )
    return Token(
        access_token=token_str,
        token_type="bearer",
        expires_in=86400,
        role=role
    )

@router.post("/social", response_model=Token)
def social_sso_login(req: SocialLoginRequest):
    role = UserRole.ADMIN if "ranjeet" in (req.email or "").lower() else UserRole.RECRUITER
    token_str = create_access_token(
        user_id=f"social-{req.provider}-user",
        email=req.email or "user@nexora.ai",
        role=role
    )
    return Token(
        access_token=token_str,
        token_type="bearer",
        expires_in=86400,
        role=role
    )

@router.get("/me", response_model=UserProfile)
def get_user_profile(current_user: UserProfile = Depends(get_current_user)):
    return current_user
