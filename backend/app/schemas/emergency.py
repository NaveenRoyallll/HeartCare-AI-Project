"""Emergency symptom triage and contacts schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SymptomItem(BaseModel):
    name: str
    severity: Optional[str] = "moderate"  # mild, moderate, severe
    duration_minutes: Optional[int] = None
    onset: Optional[str] = None  # sudden, gradual


class EmergencySymptomCheck(BaseModel):
    symptoms: List[str] = Field(..., description="List of reported symptom descriptions or names")
    heart_rate: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    spo2: Optional[float] = None
    notes: Optional[str] = None
    symptom_severity: Optional[str] = Field(None, description="User-reported severity: mild, moderate, or severe")
    symptom_duration_minutes: Optional[int] = Field(None, ge=0, le=100000)
    symptom_onset: Optional[str] = Field(None, description="sudden or gradual")
    symptoms_worsening: Optional[bool] = None


class EmergencyGuidanceResponse(BaseModel):
    classification: str = Field(..., description="EMERGENCY, URGENT, MONITOR, or INFORMATION")
    is_life_threatening: bool
    primary_instructions: List[str]
    emergency_number: str
    emergency_number_label: str
    identified_red_flags: List[str]
    disclaimer: str
    logged_event_id: Optional[str] = None
    observations_considered: List[str] = []
    data_quality: str = "limited"
    limitations: List[str] = []


class EmergencyEventCreate(BaseModel):
    event_type: str = "symptom_alert"
    severity_level: str
    symptoms: List[str]
    guidance_provided: str
    contacts_notified: bool = False
    ambulance_called: bool = False


class EmergencyEventResponse(BaseModel):
    id: str
    user_id: str
    event_type: str
    severity_level: str
    symptoms_json: List[str]
    guidance_provided: str
    contacts_notified: bool
    ambulance_called: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    relationship: str = Field(..., max_length=100)
    phone_number: str = Field(..., min_length=7, max_length=25)
    is_primary: bool = False


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone_number: Optional[str] = None
    is_primary: Optional[bool] = None


class EmergencyContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    relationship: str
    phone_number: str
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
