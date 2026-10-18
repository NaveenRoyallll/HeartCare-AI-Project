"""ECG Inference and Pipeline Analysis (Research Only).

CRITICAL SAFETY DIRECTIVE:
Under NO condition should any method or output claim that an ECG is 'safe' or
'rules out heart attack'. In the absence of an active certified model or physician review,
AnalysisUnavailable is returned with emergency warnings.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from ai.common.types import ModelVersion
from ai.ecg_analysis.models import (
    ECGAnalysisStatus,
    ECGModelInterface,
    ECGPrediction,
)
from ai.ecg_analysis.preprocessing.filtering import preprocess_raw_ecg
from ai.ecg_analysis.preprocessing.normalization import (
    detect_r_peaks,
    extract_rr_intervals,
    normalize_ecg_zscore,
)


class AnalysisUnavailable(Exception):
    """Raised when an ECG model is not installed, uninitialized, or cannot execute inference."""
    pass


class ECGAnalyzer:
    """Orchestrates ECG signal validation, preprocessing, and model inference."""

    FORBIDDEN_PHRASES = [
        "rules out heart attack",
        "no heart attack",
        "safe to ignore",
        "completely normal - no risk",
        "not an emergency",
        "ruling out mi",
    ]

    def __init__(self, model: Optional[ECGModelInterface] = None):
        self.model = model

    def validate_signal(self, signal: np.ndarray, sampling_rate: float) -> Tuple[bool, List[str]]:
        """Validate shape, numeric stability, duration, and sampling rate of input ECG signal."""
        errors: List[str] = []
        if signal is None:
            return False, ["Signal array is None."]

        arr = np.asarray(signal)
        if arr.size == 0:
            return False, ["Signal array is empty."]

        if arr.ndim not in (1, 2):
            return False, [f"Signal must be 1D or 2D array, got {arr.ndim}D."]

        if np.any(np.isnan(arr)) or np.any(np.isinf(arr)):
            return False, ["Signal contains NaN or Infinite voltage values."]

        num_samples = arr.shape[0] if arr.ndim == 1 else max(arr.shape)
        duration_sec = num_samples / sampling_rate
        if duration_sec < 2.0:
            return False, [f"ECG recording is too short ({duration_sec:.2f}s). Minimum 2.0 seconds required."]

        if duration_sec > 300.0:
            return False, [f"ECG recording is too long ({duration_sec:.2f}s). Exceeds 5-minute single trace limit."]

        return True, errors

    def analyze(
        self,
        signal: np.ndarray,
        sampling_rate: float = 500.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ECGPrediction:
        """Run complete ECG analysis pipeline.

        Returns an ECGPrediction or raises AnalysisUnavailable if no model is loaded.
        """
        meta = metadata or {}
        is_valid, validation_errors = self.validate_signal(signal, sampling_rate)

        if not is_valid:
            return ECGPrediction(
                status=ECGAnalysisStatus.INSUFFICIENT_QUALITY,
                model_version=ModelVersion(
                    model_name="ECG Preprocessor Quality Check",
                    version="1.0.0",
                    intended_use="Signal validation",
                    limitations=["Signal rejected due to format or noise issues"],
                    is_research_only=True,
                ),
                findings=["Signal failed clinical quality check."],
                warnings=validation_errors,
            )

        # Apply standard research preprocessing
        preprocessed = preprocess_raw_ecg(signal, sampling_rate=sampling_rate)

        # Detect R-peaks on single lead or first lead
        lead_0 = preprocessed if preprocessed.ndim == 1 else preprocessed[:, 0]
        r_peaks = detect_r_peaks(lead_0, sampling_rate=sampling_rate)
        rr_intervals = extract_rr_intervals(r_peaks, sampling_rate=sampling_rate)

        estimated_hr: Optional[float] = None
        if len(rr_intervals) > 0:
            median_rr = float(np.median(rr_intervals))
            if median_rr > 0:
                estimated_hr = round(60000.0 / median_rr, 1)

        # If no model is mounted, return research baseline with AnalysisUnavailable information
        if self.model is None:
            raise AnalysisUnavailable(
                "No active ECG deep learning inference model is registered. "
                "ECG AI interpretation is available for research environments with registered weights only."
            )

        prediction = self.model.predict(preprocessed, meta)

        # Enforce safety filters on model output: NEVER allow reassuring labels on acute conditions
        sanitized_findings: List[str] = []
        for finding in prediction.findings:
            lower_find = finding.lower()
            if any(forbidden in lower_find for forbidden in self.FORBIDDEN_PHRASES):
                continue
            sanitized_findings.append(finding)

        prediction.findings = sanitized_findings
        if prediction.heart_rate_bpm is None and estimated_hr is not None:
            prediction.heart_rate_bpm = estimated_hr
        prediction.r_peaks_count = len(r_peaks)

        return prediction
