"""Authentication schemas."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field("patient", description="Ignored on public registration; defaults to patient")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # in seconds
    role: str
    user_id: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class DoctorProvisionRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12)
    full_name: str = Field(..., min_length=2, max_length=255)
    license_number: str = Field(..., min_length=3, max_length=100)
    specialty: str = Field(..., min_length=2, max_length=150)
    hospital_affiliation: Optional[str] = Field(None, max_length=255)


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
