"""Schemas for unified cardiovascular assessments."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CardiovascularAssessmentRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    heart_rate: Optional[float] = Field(None, gt=0, le=300)
    systolic_bp: Optional[float] = Field(None, gt=0, le=300)
    diastolic_bp: Optional[float] = Field(None, gt=0, le=200)
    symptom_severity: Optional[str] = None
    symptom_duration_minutes: Optional[int] = Field(None, ge=0)
    symptom_onset: Optional[str] = None
    symptoms_worsening: Optional[bool] = None
    age: Optional[int] = Field(None, ge=0, le=120)
    sex: Optional[str] = None
    smoker: Optional[bool] = None
    diabetes: Optional[bool] = None
    bp_treated: Optional[bool] = None
    include_history: bool = True


class CardiovascularAssessmentResponse(BaseModel):
    id: str
    user_id: str
    assessment_kind: str
    classification: str
    observations_considered: List[Dict[str, Any]]
    input_snapshot: Dict[str, Any]
    data_quality: str
    missing_inputs: List[str]
    uncertainty: List[str]
    recommendations: List[str]
    emergency_guidance: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CardiovascularAssessmentHistoryResponse(BaseModel):
    total: int
    items: List[CardiovascularAssessmentResponse]
