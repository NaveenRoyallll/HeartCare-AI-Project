"""Pydantic request and response validation schemas."""
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse, UserProfileUpdate, UserProfileResponse, ConsentUpdate, ConsentResponse
from app.schemas.vitals import VitalMeasurementCreate, VitalMeasurementResponse, VitalMeasurementList
from app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
from app.schemas.emergency import EmergencySymptomCheck, EmergencyGuidanceResponse
from app.schemas.reports import BloodReportResponse, BloodReportResultResponse
from app.schemas.medication import MedicationCreate, MedicationResponse, MedicationLogCreate
from app.schemas.medical_history import MedicalHistoryCreate, MedicalHistoryResponse

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "RefreshRequest",
    "UserResponse",
    "UserProfileUpdate",
    "UserProfileResponse",
    "ConsentUpdate",
    "ConsentResponse",
    "VitalMeasurementCreate",
    "VitalMeasurementResponse",
    "VitalMeasurementList",
    "RiskAssessmentRequest",
    "RiskAssessmentResponse",
    "EmergencySymptomCheck",
    "EmergencyGuidanceResponse",
    "BloodReportResponse",
    "BloodReportResultResponse",
    "MedicationCreate",
    "MedicationResponse",
    "MedicationLogCreate",
    "MedicalHistoryCreate",
    "MedicalHistoryResponse",
]
