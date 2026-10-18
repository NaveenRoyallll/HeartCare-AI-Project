"""CardioGuard AI ECG Analysis Package (RESEARCH AND EDUCATIONAL USE ONLY).

CRITICAL NOTICE:
This module is strictly for research, benchmarking, and educational explorations.
Under NO circumstances should this module be used for autonomous clinical diagnosis.
It CANNOT rule out myocardial infarction (heart attack) or acute coronary syndrome.
In any acute symptom event, immediate emergency care (112 in India) must be contacted.
"""

from ai.ecg_analysis.preprocessing.filtering import (
    bandpass_filter_ecg,
    notch_filter_50hz,
    remove_baseline_wander,
    preprocess_raw_ecg,
)
from ai.ecg_analysis.preprocessing.normalization import (
    normalize_ecg_zscore,
    normalize_ecg_minmax,
    detect_r_peaks,
)
from ai.ecg_analysis.models import (
    ECGModelInterface,
    ECGPrediction,
    ECGAnalysisStatus,
)
from ai.ecg_analysis.inference.predict import (
    ECGAnalyzer,
    AnalysisUnavailable,
)

__all__ = [
    "bandpass_filter_ecg",
    "notch_filter_50hz",
    "remove_baseline_wander",
    "preprocess_raw_ecg",
    "normalize_ecg_zscore",
    "normalize_ecg_minmax",
    "detect_r_peaks",
    "ECGModelInterface",
    "ECGPrediction",
    "ECGAnalysisStatus",
    "ECGAnalyzer",
    "AnalysisUnavailable",
]
