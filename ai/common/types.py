"""Shared domain types, data models, and schemas for CardioGuard AI."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RiskCategory(str, Enum):
    """Categorization for cardiovascular risk levels."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    INSUFFICIENT_DATA = "insufficient_data"


class VitalSignType(str, Enum):
    """Enumeration of recognized vital signs and physiological markers."""
    HEART_RATE = "heart_rate"
    SYSTOLIC_BP = "systolic_bp"
    DIASTOLIC_BP = "diastolic_bp"
    OXYGEN_SATURATION = "spo2"
    RESPIRATORY_RATE = "respiratory_rate"
    BODY_TEMPERATURE = "body_temperature"
    BLOOD_GLUCOSE = "blood_glucose"


class ValidationSeverity(str, Enum):
    """Severity level of a data validation issue."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationIssue(BaseModel):
    """Represents a specific validation finding on input health metrics."""
    field: str
    message: str
    severity: ValidationSeverity = ValidationSeverity.ERROR
    provided_value: Optional[Any] = None
    expected_range: Optional[str] = None


class ValidationReport(BaseModel):
    """Aggregated validation output containing validity flag and detailed issues."""
    is_valid: bool
    issues: List[ValidationIssue] = Field(default_factory=list)
    sanitized_data: Dict[str, Any] = Field(default_factory=dict)

    def add_error(self, field: str, message: str, value: Optional[Any] = None, expected_range: Optional[str] = None) -> None:
        self.issues.append(
            ValidationIssue(
                field=field,
                message=message,
                severity=ValidationSeverity.ERROR,
                provided_value=value,
                expected_range=expected_range,
            )
        )
        self.is_valid = False

    def add_warning(self, field: str, message: str, value: Optional[Any] = None, expected_range: Optional[str] = None) -> None:
        self.issues.append(
            ValidationIssue(
                field=field,
                message=message,
                severity=ValidationSeverity.WARNING,
                provided_value=value,
                expected_range=expected_range,
            )
        )


class ModelVersion(BaseModel):
    """Metadata detailing an AI/clinical calculation model, its provenance, and limitations."""
    model_name: str
    version: str
    training_date: Optional[datetime] = None
    dataset: Optional[str] = None
    intended_use: str
    limitations: List[str] = Field(default_factory=list)
    is_research_only: bool = True


class PredictionResult(BaseModel):
    """Standardized result wrapper for risk scores and AI inferences."""
    value: float
    confidence: Optional[float] = None
    category: Optional[str] = None
    model_version: ModelVersion
    input_snapshot: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    missing_inputs: List[str] = Field(default_factory=list)
