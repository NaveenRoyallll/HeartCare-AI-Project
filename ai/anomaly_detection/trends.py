"""Vital signs trend direction and change point detection."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple
import numpy as np


class TrendDirection(str, Enum):
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    INSUFFICIENT_DATA = "insufficient_data"


@dataclass
class TrendAnalysisResult:
    metric_name: str
    direction: TrendDirection
    slope_per_unit: float
    moving_averages: List[float] = field(default_factory=list)
    change_point_indices: List[int] = field(default_factory=list)
    confidence: float = 0.0
    summary: str = ""


def calculate_moving_average(
    values: List[float],
    window_size: int = 5,
    method: str = "sma",
    alpha: float = 0.3,
) -> List[float]:
    """Calculate Simple Moving Average (SMA) or Exponential Moving Average (EMA)."""
    if not values:
        return []

    arr = np.array(values, dtype=float)
    if method == "sma":
        if len(arr) < window_size:
            # Fallback to cumulative average if series shorter than window
            return [float(np.mean(arr[: i + 1])) for i in range(len(arr))]
        weights = np.ones(window_size) / window_size
        # Valid convolution padded with initial partial means
        sma_valid = np.convolve(arr, weights, mode="valid")
        prefix = [float(np.mean(arr[: i + 1])) for i in range(window_size - 1)]
        return prefix + [float(x) for x in sma_valid]
    elif method == "ema":
        ema_vals = []
        current = float(arr[0])
        ema_vals.append(current)
        for x in arr[1:]:
            current = alpha * float(x) + (1.0 - alpha) * current
            ema_vals.append(float(current))
        return ema_vals
    else:
        raise ValueError(f"Unknown moving average method: '{method}'. Choose 'sma' or 'ema'.")


def detect_trend_direction(
    values: List[float],
    slope_threshold: float = 0.15,
) -> Tuple[TrendDirection, float, float]:
    """Determine if a vital sign is trending up, down, or remaining stable using linear regression.

    Returns: (TrendDirection, slope_per_step, r_squared_confidence)
    """
    clean_vals = [float(v) for v in values if v is not None and not np.isnan(v)]
    if len(clean_vals) < 3:
        return TrendDirection.INSUFFICIENT_DATA, 0.0, 0.0

    x = np.arange(len(clean_vals), dtype=float)
    y = np.array(clean_vals, dtype=float)

    # Simple linear regression: y = m * x + c
    cov = np.cov(x, y)
    var_x = np.var(x, ddof=1)
    if var_x == 0:
        return TrendDirection.STABLE, 0.0, 1.0

    slope = float(cov[0, 1] / var_x)
    std_y = np.std(y)
    # Correlation coefficient r
    r_val = float(cov[0, 1] / (np.std(x, ddof=1) * (std_y if std_y > 0 else 1.0)))
    r_squared = float(min(1.0, max(0.0, r_val ** 2)))

    # Determine trend based on normalized slope or absolute slope
    norm_slope = slope / (np.mean(y) if np.mean(y) != 0 else 1.0) * 100.0

    if abs(norm_slope) < slope_threshold:
        direction = TrendDirection.STABLE
    elif norm_slope > slope_threshold:
        direction = TrendDirection.INCREASING
    else:
        direction = TrendDirection.DECREASING

    return direction, slope, r_squared


def detect_change_points(
    values: List[float],
    threshold_sigma: float = 2.5,
    min_segment_length: int = 4,
) -> List[int]:
    """Detect statistical change points using Cumulative Sum (CUSUM) on the series.

    Returns: List of indices where an abrupt shift in the mean occurs.
    """
    clean = [float(v) for v in values if v is not None and not np.isnan(v)]
    n = len(clean)
    if n < 2 * min_segment_length:
        return []

    arr = np.array(clean, dtype=float)
    mean_all = np.mean(arr)
    std_all = np.std(arr)
    if std_all < 1e-4:
        return []

    # Evaluate only splits that leave enough observations on both sides. This
    # avoids reporting a false early change while CUSUM is still accumulating
    # evidence from the first segment.
    candidates = []
    for split in range(min_segment_length, n - min_segment_length + 1):
        left = arr[:split]
        right = arr[split:]
        mean_gap = abs(float(np.mean(right) - np.mean(left)))
        pooled_std = float(np.sqrt((np.var(left) + np.var(right)) / 2.0))
        candidates.append((mean_gap / max(pooled_std, 1e-6), split))

    if not candidates:
        return []

    score, split = max(candidates)
    if score < threshold_sigma:
        return []
    return [split]
