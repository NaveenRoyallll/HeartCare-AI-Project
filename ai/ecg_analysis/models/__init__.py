"""Abstract interfaces and data representations for ECG inference models."""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
import numpy as np
from pydantic import BaseModel, Field
from ai.common.types import ModelVersion


class ECGAnalysisStatus(str, Enum):
    COMPLETED = "completed"
    UNAVAILABLE = "unavailable"
    INSUFFICIENT_QUALITY = "insufficient_signal_quality"
    ERROR = "error"


class ECGPrediction(BaseModel):
    """Standard output schema for ECG model inference.

    SAFETY WARNING: This prediction is strictly research-only and CANNOT rule out
    acute coronary syndrome, myocardial infarction, or any life-threatening arrhythmia.
    """
    status: ECGAnalysisStatus
    model_version: ModelVersion
    findings: List[str] = Field(default_factory=list)
    confidence_scores: Dict[str, float] = Field(default_factory=dict)
    heart_rate_bpm: Optional[float] = None
    r_peaks_count: int = 0
    warnings: List[str] = Field(default_factory=list)
    is_emergency_suspected: bool = False
    disclaimer: str = (
        "RESEARCH USE ONLY. This software is NOT a diagnostic medical device. "
        "It CANNOT rule out a heart attack or acute cardiac event. "
        "If you experience chest pain, pressure, or acute shortness of breath, call 112 immediately."
    )


class ECGModelInterface(ABC):
    """Abstract Base Class for all pluggable ECG deep learning or algorithmic models."""

    @abstractmethod
    def predict(self, signal: np.ndarray, metadata: Dict[str, Any]) -> ECGPrediction:
        """Execute inference on preprocessed ECG array.

        Args:
            signal: 1D or 2D numpy array of filtered voltage samples.
            metadata: Context dictionary (e.g., sampling_rate, lead_names, patient_age).
        """
        pass

    @abstractmethod
    def get_model_info(self) -> ModelVersion:
        """Return provenance and model versioning details."""
        pass
