"""Health summary and dashboard schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.schemas.vitals import VitalMeasurementResponse
from app.schemas.risk import RiskAssessmentResponse
from app.schemas.medication import MedicationResponse


class HealthDashboardResponse(BaseModel):
    user_id: str
    latest_vitals: Dict[str, Optional[VitalMeasurementResponse]]
    active_medications_count: int
    latest_risk_assessment: Optional[RiskAssessmentResponse] = None
    adherence_percentage_7d: float
    emergency_contacts_count: int
    unread_clinical_notes_count: int
    system_status: str = "operational"


class HealthSummaryResponse(BaseModel):
    user_id: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    known_conditions: List[str] = []
    active_medications: List[str] = []
    recent_vital_trends: Dict[str, Any] = {}
    latest_framingham_risk: Optional[str] = None
    clinical_flags: List[str] = []
    last_updated: datetime
