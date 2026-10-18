"""Medical and family history schemas."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class MedicalHistoryCreate(BaseModel):
    condition_name: str = Field(..., min_length=2, max_length=255)
    icd10_code: Optional[str] = Field(None, max_length=20)
    diagnosis_date: Optional[date] = None
    is_active: bool = True
    notes: Optional[str] = None


class MedicalHistoryUpdate(BaseModel):
    condition_name: Optional[str] = None
    icd10_code: Optional[str] = None
    diagnosis_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MedicalHistoryResponse(BaseModel):
    id: str
    user_id: str
    condition_name: str
    icd10_code: Optional[str] = None
    diagnosis_date: Optional[date] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyHistoryCreate(BaseModel):
    relative_relation: str = Field(..., max_length=50, description="e.g. father, mother, brother, sister")
    condition_name: str = Field(..., max_length=255)
    onset_age: Optional[int] = Field(None, ge=0, le=120)
    notes: Optional[str] = None


class FamilyHistoryUpdate(BaseModel):
    relative_relation: Optional[str] = None
    condition_name: Optional[str] = None
    onset_age: Optional[int] = None
    notes: Optional[str] = None


class FamilyHistoryResponse(BaseModel):
    id: str
    user_id: str
    relative_relation: str
    condition_name: str
    onset_age: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
