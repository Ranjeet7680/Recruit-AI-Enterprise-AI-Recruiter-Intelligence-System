"""
Authentication & Authorization Pydantic Schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from src.core.security import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: UserRole

class TokenPayload(BaseModel):
    sub: str
    email: str
    role: UserRole
    exp: int

class LoginRequest(BaseModel):
    email: str = Field(..., example="recruiter@nexora.ai")
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.RECRUITER

class SocialLoginRequest(BaseModel):
    provider: str = Field(..., example="google")
    token: str = Field(..., min_length=6)
    email: Optional[str] = "rajranjeet7680@gmail.com"
    name: Optional[str] = "Ranjeet Kumar"

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: UserRole
    permissions: List[str]
