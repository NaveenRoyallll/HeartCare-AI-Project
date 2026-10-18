"""Doctor portal and patient review schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DoctorAccessRequest(BaseModel):
    patient_email: str
    reason: Optional[str] = None


class PatientAccessGrant(BaseModel):
    doctor_id: str
    can_view_vitals: bool = True
    can_view_records: bool = True
    can_view_medications: bool = True


class PatientAccessRevoke(BaseModel):
    doctor_id: str


class DoctorPatientAccessResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    status: str
    requested_at: datetime
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    permissions_json: Dict[str, Any]

    class Config:
        from_attributes = True


class ClinicalReviewNoteCreate(BaseModel):
    note_type: str = Field("general", description="general, urgent, medication_review, follow_up")
    content: str = Field(..., min_length=5)
    recommendations: Optional[str] = None


class ClinicalReviewNoteResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    note_type: str
    content: str
    recommendations: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientSummaryResponse(BaseModel):
    patient_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    access_status: str
    granted_at: Optional[datetime] = None
    latest_bp: Optional[str] = None
    latest_hr: Optional[float] = None
    last_assessment_risk: Optional[str] = None


class DoctorProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_doctor_verified: bool


class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    specialty: Optional[str] = Field(None, min_length=2, max_length=150)
    hospital_affiliation: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)


class DoctorVerificationUpdate(BaseModel):
    verified: bool
