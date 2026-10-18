"""ECG Signal Normalization and Feature Extraction (Research Only).

Provides:
- Z-Score standardization per lead
- Min-Max amplitude scaling per lead
- Robust R-Peak detection and alignment
"""

from typing import List, Optional, Tuple
import numpy as np
from scipy.signal import find_peaks


def normalize_ecg_zscore(
    ecg_signal: np.ndarray,
    eps: float = 1e-8,
) -> Tuple[np.ndarray, float, float]:
    """Standardize ECG signal to zero mean and unit variance."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.size == 0:
        return arr, 0.0, 1.0

    mean_val = float(np.mean(arr))
    std_val = float(np.std(arr))

    if std_val < eps:
        normalized = np.zeros_like(arr)
    else:
        normalized = (arr - mean_val) / std_val

    return normalized, mean_val, std_val


def normalize_ecg_minmax(
    ecg_signal: np.ndarray,
    target_range: Tuple[float, float] = (-1.0, 1.0),
    eps: float = 1e-8,
) -> np.ndarray:
    """Scale ECG voltage amplitudes into a fixed target range, e.g., [-1.0, 1.0]."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.size == 0:
        return arr

    min_val = float(np.min(arr))
    max_val = float(np.max(arr))
    diff = max_val - min_val

    if diff < eps:
        return np.full_like(arr, target_range[0])

    t_min, t_max = target_range
    scaled = (arr - min_val) / diff
    return scaled * (t_max - t_min) + t_min


def detect_r_peaks(
    filtered_ecg: np.ndarray,
    sampling_rate: float = 500.0,
    min_bpm: float = 30.0,
    max_bpm: float = 240.0,
) -> np.ndarray:
    """Detect R-peak indices in a 1D filtered ECG trace using bandpass energy and peak finding.

    Research / educational algorithm based on Pan-Tompkins concepts.
    Returns: Array of sample indices corresponding to identified R-peaks.
    """
    arr = np.asarray(filtered_ecg, dtype=float)
    if arr.ndim != 1 or arr.size < int(sampling_rate):
        return np.array([], dtype=int)

    # Minimum refractory distance between consecutive R-peaks (based on max_bpm)
    min_distance = int(sampling_rate * (60.0 / max_bpm))

    # Derivative approximation
    diff = np.diff(arr)
    # Squaring function (enhances QRS complex over T and P waves)
    squared = diff ** 2

    # Moving average window (~150 ms)
    window_len = int(0.150 * sampling_rate)
    if window_len > 1:
        kernel = np.ones(window_len) / window_len
        integrated = np.convolve(squared, kernel, mode="same")
    else:
        integrated = squared

    # Dynamic threshold: e.g. 35% of max peak or 2.5 * median
    thresh = float(max(np.median(integrated) * 2.5, np.max(integrated) * 0.25))

    peak_indices, _ = find_peaks(integrated, height=thresh, distance=min_distance)

    # Refine peak locations back to original filtered ECG maxima in a local window
    window_refine = int(0.05 * sampling_rate)  # 50 ms window
    refined_peaks = []
    for p in peak_indices:
        start = max(0, p - window_refine)
        end = min(len(arr), p + window_refine)
        if start < end:
            local_max_idx = start + int(np.argmax(arr[start:end]))
            refined_peaks.append(local_max_idx)

    # De-duplicate refined peaks that may have snapped to the same sample
    if refined_peaks:
        unique_refined = np.unique(refined_peaks)
        return np.asarray(unique_refined, dtype=int)
    return np.array([], dtype=int)


def extract_rr_intervals(
    r_peaks: np.ndarray,
    sampling_rate: float = 500.0,
) -> np.ndarray:
    """Calculate RR intervals in milliseconds from R-peak sample indices."""
    if len(r_peaks) < 2:
        return np.array([], dtype=float)

    diff_samples = np.diff(r_peaks)
    rr_intervals_ms = (diff_samples / sampling_rate) * 1000.0
    return np.asarray(rr_intervals_ms, dtype=float)
