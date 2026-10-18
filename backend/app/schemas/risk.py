"""Cardiovascular risk assessment schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RiskAssessmentRequest(BaseModel):
    age: Optional[int] = Field(None, ge=30, le=79, description="Patient age in years; calibrated Framingham range")
    sex: Optional[str] = Field(None, description="'male' or 'female'")
    total_cholesterol: Optional[float] = Field(None, ge=130, le=320, description="Total cholesterol in mg/dL")
    hdl_cholesterol: Optional[float] = Field(None, ge=20, le=100, description="HDL cholesterol in mg/dL")
    systolic_bp: Optional[float] = Field(None, ge=90, le=200, description="Systolic blood pressure in mmHg")
    bp_treated: Optional[bool] = Field(False, description="Whether currently on anti-hypertensive medication")
    smoker: Optional[bool] = Field(False, description="Current cigarette smoker")
    diabetes: Optional[bool] = Field(False, description="Diagnosed with diabetes")
    use_latest_vitals: bool = Field(True, description="Autofill missing parameters from patient's recorded vitals")


class RiskAssessmentResponse(BaseModel):
    id: str
    user_id: str
    assessment_type: str
    risk_score: Optional[float] = Field(None, description="10-year percentage risk of CVD")
    risk_category: str = Field(..., description="low (<10%), moderate (10-20%), high (>20%), or indeterminate")
    calculation_version: str
    input_snapshot: Dict[str, Any]
    limitations: List[str]
    recommendations: List[str]
    missing_inputs: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RiskHistoryResponse(BaseModel):
    total: int
    items: List[RiskAssessmentResponse]
