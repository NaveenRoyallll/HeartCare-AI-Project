"""Unit tests for ECG Signal Preprocessing, Filtering, Normalization, and Analyzer."""

import numpy as np
import pytest
from ai.common.types import ModelVersion
from ai.ecg_analysis.inference.predict import (
    AnalysisUnavailable,
    ECGAnalyzer,
)
from ai.ecg_analysis.models import (
    ECGAnalysisStatus,
    ECGModelInterface,
    ECGPrediction,
)
from ai.ecg_analysis.preprocessing.filtering import (
    bandpass_filter_ecg,
    notch_filter_50hz,
    preprocess_raw_ecg,
    remove_baseline_wander,
)
from ai.ecg_analysis.preprocessing.normalization import (
    detect_r_peaks,
    extract_rr_intervals,
    normalize_ecg_minmax,
    normalize_ecg_zscore,
)


class MockECGModel(ECGModelInterface):
    """Mock ECG classification model for testing pipeline execution."""

    def predict(self, signal: np.ndarray, metadata: dict) -> ECGPrediction:
        return ECGPrediction(
            status=ECGAnalysisStatus.COMPLETED,
            model_version=self.get_model_info(),
            findings=["Sinus rhythm pattern identified (research)."],
            confidence_scores={"sinus_rhythm": 0.94},
        )

    def get_model_info(self) -> ModelVersion:
        return ModelVersion(
            model_name="MockECGNet",
            version="0.1.0",
            intended_use="Unit test validation",
            limitations=["Research synthetic test mock"],
            is_research_only=True,
        )


def _generate_synthetic_ecg(duration_sec: float = 5.0, fs: float = 500.0, bpm: float = 75.0) -> np.ndarray:
    """Generate a clean synthetic ECG trace with periodic R-peaks and noise."""
    t = np.linspace(0, duration_sec, int(duration_sec * fs), endpoint=False)
    # Baseline sine + 50Hz hum
    noise = 0.3 * np.sin(2 * np.pi * 0.2 * t) + 0.15 * np.sin(2 * np.pi * 50.0 * t)

    # QRS-like spikes
    signal_ecg = np.zeros_like(t)
    interval = 60.0 / bpm
    peak_times = np.arange(0.2, duration_sec, interval)
    for pt in peak_times:
        idx = int(pt * fs)
        if 0 <= idx < len(signal_ecg):
            signal_ecg[idx] = 1.8
            if idx > 1:
                signal_ecg[idx - 1] = 0.5
            if idx < len(signal_ecg) - 1:
                signal_ecg[idx + 1] = 0.5

    return signal_ecg + noise


def test_bandpass_and_notch_filtering():
    """Verify that filters operate on synthetic ECG traces and preserve shape."""
    fs = 500.0
    raw_signal = _generate_synthetic_ecg(duration_sec=3.0, fs=fs)

    # Filter with bandpass
    bp = bandpass_filter_ecg(raw_signal, sampling_rate=fs, lowcut=0.5, highcut=40.0)
    assert bp.shape == raw_signal.shape
    assert not np.any(np.isnan(bp))

    # Filter with 50 Hz notch
    notch = notch_filter_50hz(raw_signal, sampling_rate=fs, notch_freq=50.0)
    assert notch.shape == raw_signal.shape
    assert not np.any(np.isnan(notch))

    # Pipeline
    cleaned = preprocess_raw_ecg(raw_signal, sampling_rate=fs)
    assert cleaned.shape == raw_signal.shape


def test_normalization_and_peak_detection():
    """Verify z-score, min-max scaling, and R-peak detection."""
    fs = 500.0
    raw_signal = _generate_synthetic_ecg(duration_sec=4.0, fs=fs, bpm=60.0)
    cleaned = preprocess_raw_ecg(raw_signal, sampling_rate=fs)

    # Z-Score
    z_norm, mean_v, std_v = normalize_ecg_zscore(cleaned)
    assert np.isclose(np.mean(z_norm), 0.0, atol=1e-4)
    assert np.isclose(np.std(z_norm), 1.0, atol=1e-3)

    # Min-Max
    mm_norm = normalize_ecg_minmax(cleaned, target_range=(-1.0, 1.0))
    assert np.min(mm_norm) >= -1.0 - 1e-6
    assert np.max(mm_norm) <= 1.0 + 1e-6

    # Peak detection (expect roughly 4 peaks in 4 seconds at 60 bpm)
    peaks = detect_r_peaks(cleaned, sampling_rate=fs)
    assert len(peaks) >= 3
    rr = extract_rr_intervals(peaks, sampling_rate=fs)
    assert len(rr) >= 2
    # At 60 bpm, interval is ~1000 ms
    assert 800 <= np.median(rr) <= 1200


def test_ecg_analyzer_raises_unavailable_when_no_model():
    """ECGAnalyzer without a registered model must raise AnalysisUnavailable."""
    analyzer = ECGAnalyzer(model=None)
    raw_signal = _generate_synthetic_ecg(duration_sec=3.0, fs=500.0)

    with pytest.raises(AnalysisUnavailable, match="No active ECG deep learning inference model"):
        analyzer.analyze(raw_signal, sampling_rate=500.0)


def test_ecg_analyzer_runs_with_model_and_enforces_safety():
    """When a model is mounted, analyzer runs pipeline and sanitizes unsafe labels."""
    model = MockECGModel()
    analyzer = ECGAnalyzer(model=model)
    raw_signal = _generate_synthetic_ecg(duration_sec=4.0, fs=500.0)

    pred = analyzer.analyze(raw_signal, sampling_rate=500.0)
    assert pred.status == ECGAnalysisStatus.COMPLETED
    assert pred.heart_rate_bpm is not None
    assert "RESEARCH USE ONLY" in pred.disclaimer
    # Verify no unsafe reassuring phrases
    for f in pred.findings:
        assert "rules out heart attack" not in f.lower()
        assert "not an emergency" not in f.lower()
