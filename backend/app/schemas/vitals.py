"""Vital signs validation and serialization schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


VALID_MEASUREMENT_TYPES = {
    "blood_pressure",
    "heart_rate",
    "weight",
    "height",
    "blood_glucose",
    "hba1c",
    "cholesterol_total",
    "cholesterol_ldl",
    "cholesterol_hdl",
    "triglycerides",
    "spo2",
    "temperature",
}


class VitalMeasurementCreate(BaseModel):
    measurement_type: str
    value_primary: float = Field(..., description="Primary value (e.g., Systolic for BP, bpm for heart rate)")
    value_secondary: Optional[float] = Field(None, description="Secondary value (e.g., Diastolic for BP)")
    unit: str
    source: str = Field("manual", description="manual, device, clinician")
    notes: Optional[str] = None
    measured_at: Optional[datetime] = None

    @field_validator("measurement_type")
    @classmethod
    def validate_measurement_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in VALID_MEASUREMENT_TYPES:
            raise ValueError(f"Invalid measurement_type '{clean}'. Must be one of: {sorted(VALID_MEASUREMENT_TYPES)}")
        return clean


class VitalMeasurementUpdate(BaseModel):
    value_primary: Optional[float] = None
    value_secondary: Optional[float] = None
    unit: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    measured_at: Optional[datetime] = None


class VitalMeasurementResponse(BaseModel):
    id: str
    user_id: str
    measurement_type: str
    value_primary: float
    value_secondary: Optional[float] = None
    unit: str
    source: str
    notes: Optional[str] = None
    measured_at: datetime
    created_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class VitalMeasurementList(BaseModel):
    total: int
    items: List[VitalMeasurementResponse]
    page: int
    limit: int


class VitalTrendPoint(BaseModel):
    timestamp: datetime
    value_primary: float
    value_secondary: Optional[float] = None
    unit: str


class VitalTrendsResponse(BaseModel):
    measurement_type: str
    unit: str
    data_points: List[VitalTrendPoint]
    average_primary: Optional[float] = None
    average_secondary: Optional[float] = None
    min_primary: Optional[float] = None
    max_primary: Optional[float] = None
