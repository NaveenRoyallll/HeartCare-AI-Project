"""Common preprocessing utilities for CardioGuard AI signals, metrics, and tabular inputs."""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np


def normalize_min_max(
    data: Union[np.ndarray, List[float]],
    feature_range: Tuple[float, float] = (0.0, 1.0),
    eps: float = 1e-8,
) -> np.ndarray:
    """Scale input vector linearly to feature_range (default [0, 1])."""
    arr = np.asarray(data, dtype=float)
    if arr.size == 0:
        return arr

    min_val = np.nanmin(arr)
    max_val = np.nanmax(arr)
    diff = max_val - min_val

    if diff < eps:
        # Constant array
        return np.full_like(arr, feature_range[0])

    scaled = (arr - min_val) / diff
    target_min, target_max = feature_range
    return scaled * (target_max - target_min) + target_min


def standardize_z_score(
    data: Union[np.ndarray, List[float]],
    mean: Optional[float] = None,
    std: Optional[float] = None,
    eps: float = 1e-8,
) -> Tuple[np.ndarray, float, float]:
    """Standardize vector using z-score: (x - mean) / std. Returns (standardized_array, mean, std)."""
    arr = np.asarray(data, dtype=float)
    if arr.size == 0:
        return arr, 0.0, 1.0

    calc_mean = float(np.nanmean(arr)) if mean is None else float(mean)
    calc_std = float(np.nanstd(arr)) if std is None else float(std)

    if calc_std < eps:
        # Near-zero standard deviation
        standardized = np.zeros_like(arr)
    else:
        standardized = (arr - calc_mean) / calc_std

    return standardized, calc_mean, calc_std


def clip_physiological_outliers(
    data: Union[np.ndarray, List[float]],
    lower_bound: float,
    upper_bound: float,
) -> np.ndarray:
    """Clip values that fall outside physiological bounds."""
    arr = np.asarray(data, dtype=float)
    return np.clip(arr, lower_bound, upper_bound)


def impute_missing_with_baseline(
    series: Union[np.ndarray, List[Optional[float]]],
    baseline_value: float,
) -> np.ndarray:
    """Impute NaN or None values with the patient's known baseline value."""
    arr = np.asarray(series, dtype=float)
    nan_mask = np.isnan(arr)
    arr[nan_mask] = baseline_value
    return arr
