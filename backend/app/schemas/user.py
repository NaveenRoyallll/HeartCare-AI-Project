"""User, profile, and consent schemas."""
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    is_doctor_verified: bool
    license_number: Optional[str] = None
    specialty: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, description="male, female, other")
    blood_group: Optional[str] = Field(None, max_length=10)
    height_cm: Optional[float] = Field(None, ge=40, le=260)
    weight_kg: Optional[float] = Field(None, ge=2, le=500)
    emergency_notes: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    emergency_notes: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConsentUpdate(BaseModel):
    consent_type: str = Field(..., description="e.g. terms_of_service, health_data_processing, ai_analysis")
    granted: bool
    notes: Optional[str] = None


class ConsentResponse(BaseModel):
    id: str
    user_id: str
    consent_type: str
    granted: bool
    granted_at: datetime
    revoked_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class UserExportResponse(BaseModel):
    user: UserResponse
    profile: Optional[UserProfileResponse] = None
    consents: List[ConsentResponse] = []
    vitals_count: int = 0
    medical_histories_count: int = 0
    exported_at: datetime
    data: Dict[str, Any] = {}
