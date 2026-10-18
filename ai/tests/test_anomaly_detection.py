"""Unit tests for Personal Baseline Building and Anomaly Detection."""

import numpy as np
import pytest
from ai.anomaly_detection.detector import (
    AnomalyStatus,
    PersonalBaselineDetector,
)
from ai.anomaly_detection.trends import (
    TrendDirection,
    calculate_moving_average,
    detect_change_points,
    detect_trend_direction,
)


def test_baseline_building_requires_minimum_points():
    """Baseline builder must enforce minimum data points."""
    detector = PersonalBaselineDetector(min_baseline_points=5)

    # 4 points: insufficient
    profile_short = detector.fit_baseline("heart_rate", [70.0, 72.0, 71.0, 73.0])
    assert profile_short is None
    assert "heart_rate" not in detector.baselines

    # 5 points: successful
    profile_ok = detector.fit_baseline("heart_rate", [70.0, 72.0, 71.0, 73.0, 74.0])
    assert profile_ok is not None
    assert profile_ok.sample_count == 5
    assert profile_ok.mean == 72.0
    assert profile_ok.std > 0.0


def test_insufficient_baseline_evaluation():
    """Evaluation without fitted baseline returns INSUFFICIENT_BASELINE status."""
    detector = PersonalBaselineDetector(min_baseline_points=5)
    res = detector.evaluate_measurement("systolic_bp", 125.0)

    assert res.status == AnomalyStatus.INSUFFICIENT_BASELINE
    assert not res.is_alert
    assert "insufficient historical data" in res.message.lower()


def test_missing_data_evaluation():
    """None or NaN values return MISSING_DATA status."""
    detector = PersonalBaselineDetector()
    detector.fit_baseline("heart_rate", [70.0, 71.0, 72.0, 70.0, 71.0])

    res_none = detector.evaluate_measurement("heart_rate", None)
    assert res_none.status == AnomalyStatus.MISSING_DATA
    assert not res_none.is_alert

    res_nan = detector.evaluate_measurement("heart_rate", float("nan"))
    assert res_nan.status == AnomalyStatus.MISSING_DATA


def test_within_baseline_evaluation():
    """Readings near the baseline mean return WITHIN_BASELINE status."""
    detector = PersonalBaselineDetector(min_baseline_points=5, z_threshold=2.0)
    # Mean = 70.0, Std ~ 2.0
    history = [68.0, 70.0, 72.0, 70.0, 70.0]
    detector.fit_baseline("heart_rate", history)

    # Value 71 is very close to mean
    res = detector.evaluate_measurement("heart_rate", 71.0)
    assert res.status == AnomalyStatus.WITHIN_BASELINE
    assert not res.is_alert
    assert abs(res.z_score) < 2.0


def test_temporary_vs_persistent_deviation():
    """Single spike is TEMPORARY_DEVIATION, consecutive spikes become PERSISTENT_CHANGE."""
    detector = PersonalBaselineDetector(
        min_baseline_points=5,
        z_threshold=2.0,
        persistence_count=3,
    )
    # Baseline: Mean = 120, Std = 2.0
    detector.fit_baseline("systolic_bp", [118.0, 120.0, 122.0, 120.0, 120.0])

    # 1. Single spike to 140 (z-score > 2.0) with no recent abnormal history
    res_single = detector.evaluate_measurement("systolic_bp", 140.0, recent_history=[120.0, 121.0])
    assert res_single.status == AnomalyStatus.TEMPORARY_DEVIATION
    assert res_single.is_alert is True
    assert res_single.consecutive_deviations == 1

    # 2. Third consecutive elevated reading (recent_history has 2 elevated points)
    res_persistent = detector.evaluate_measurement(
        "systolic_bp",
        142.0,
        recent_history=[138.0, 140.0],  # both > 2 std above mean
    )
    assert res_persistent.status == AnomalyStatus.PERSISTENT_CHANGE
    assert res_persistent.is_alert is True
    assert res_persistent.consecutive_deviations >= 3
    assert "PERSISTENT CHANGE" in res_persistent.message


def test_trend_direction_and_moving_average():
    """Verify linear trend estimation and moving average calculation."""
    # Clearly upward trending series
    upward_series = [100.0, 105.0, 110.0, 116.0, 122.0, 128.0]
    direction, slope, r2 = detect_trend_direction(upward_series)
    assert direction == TrendDirection.INCREASING
    assert slope > 0.0

    # Moving average
    sma = calculate_moving_average(upward_series, window_size=3, method="sma")
    assert len(sma) == len(upward_series)
    assert sma[-1] == pytest.approx((116.0 + 122.0 + 128.0) / 3.0)

    # Change point detection on step function
    step_series = [70.0] * 10 + [95.0] * 10
    cps = detect_change_points(step_series, threshold_sigma=2.0, min_segment_length=3)
    assert len(cps) > 0
    assert 9 <= cps[0] <= 11
