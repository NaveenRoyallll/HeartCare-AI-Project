"""Medication schemas."""
from datetime import datetime, date, time
from typing import List, Optional
from pydantic import BaseModel, Field


class MedicationScheduleCreate(BaseModel):
    reminder_time: time
    day_of_week: Optional[str] = "all"
    is_active: bool = True


class MedicationScheduleResponse(BaseModel):
    id: str
    medication_id: str
    reminder_time: time
    day_of_week: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    dosage: str = Field(..., max_length=100)
    form: str = Field("tablet", max_length=50)
    frequency: str = Field(..., max_length=100)
    instructions: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    schedules: Optional[List[MedicationScheduleCreate]] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    form: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class MedicationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    dosage: str
    form: str
    frequency: str
    instructions: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MedicationLogCreate(BaseModel):
    scheduled_time: datetime
    taken_time: Optional[datetime] = None
    status: str = Field("taken", description="taken, skipped, or missed")
    notes: Optional[str] = None


class MedicationLogResponse(BaseModel):
    id: str
    medication_id: str
    user_id: str
    scheduled_time: datetime
    taken_time: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
