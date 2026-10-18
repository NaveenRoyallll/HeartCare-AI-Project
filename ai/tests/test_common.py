"""Unit tests for common validation, preprocessing, and model evaluation metrics."""

import numpy as np
import pytest
from ai.common.preprocessing import (
    clip_physiological_outliers,
    impute_missing_with_baseline,
    normalize_min_max,
    standardize_z_score,
)
from ai.common.validation import (
    validate_numeric_range,
    validate_vital_signs,
)
from ai.risk_prediction.src.evaluate import (
    brier_score,
    evaluate_risk_model,
    expected_calibration_error,
)


def test_vital_signs_validation_bounds():
    """Verify vital sign boundary checks and blood pressure relationship validation."""
    valid_data = {
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "heart_rate": 72.0,
        "spo2": 98.0,
    }
    rep = validate_vital_signs(valid_data)
    assert rep.is_valid
    assert rep.sanitized_data["systolic_bp"] == 120.0

    # Inverted BP (systolic <= diastolic) must fail
    invalid_bp = {
        "systolic_bp": 80.0,
        "diastolic_bp": 120.0,
    }
    rep_inv = validate_vital_signs(invalid_bp)
    assert not rep_inv.is_valid
    assert any("blood_pressure" in issue.field for issue in rep_inv.issues)


def test_preprocessing_utilities():
    """Verify min-max scaling, standardization, clipping, and baseline imputation."""
    # Normalization
    raw = [10.0, 20.0, 30.0, 40.0, 50.0]
    norm = normalize_min_max(raw, feature_range=(0.0, 1.0))
    assert norm[0] == 0.0
    assert norm[-1] == 1.0

    # Standardize
    std_arr, mean, std = standardize_z_score(raw)
    assert pytest.approx(mean) == 30.0
    assert pytest.approx(float(np.mean(std_arr)), abs=1e-5) == 0.0

    # Clip outliers
    clipped = clip_physiological_outliers([50.0, 120.0, 300.0], lower_bound=60.0, upper_bound=200.0)
    assert clipped[0] == 60.0
    assert clipped[1] == 120.0
    assert clipped[2] == 200.0

    # Impute missing
    series_with_nan = [120.0, float("nan"), 125.0]
    imputed = impute_missing_with_baseline(series_with_nan, baseline_value=122.0)
    assert imputed[1] == 122.0


def test_risk_model_evaluation_metrics():
    """Verify AUROC, Brier score, and calibration calculations."""
    y_true = [0, 0, 0, 0, 1, 1, 1, 1]
    y_prob = [0.1, 0.2, 0.15, 0.3, 0.7, 0.85, 0.9, 0.8]
    subgroups = {"sex": ["M", "M", "F", "F", "M", "M", "F", "F"]}

    metrics = evaluate_risk_model(y_true, y_prob, subgroups=subgroups)
    assert metrics.total_samples == 8
    assert metrics.event_count == 4
    assert metrics.auroc is not None
    assert metrics.auroc == 1.0  # Perfect separation
    assert metrics.brier_score < 0.1
    assert "sex:M" in metrics.subgroup_analysis
    assert "sex:F" in metrics.subgroup_analysis
