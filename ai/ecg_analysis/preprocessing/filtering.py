"""ECG Signal Filtering and Preprocessing (Research & Educational Use Only).

Provides:
- 0.5 - 40.0 Hz Butterworth Bandpass Filtering
- 50 Hz Notch Filtering (Powerline interference in India / Europe)
- Baseline Wander Removal
"""

import numpy as np
from scipy import signal


def bandpass_filter_ecg(
    ecg_signal: np.ndarray,
    sampling_rate: float = 500.0,
    lowcut: float = 0.5,
    highcut: float = 40.0,
    order: int = 3,
) -> np.ndarray:
    """Apply a zero-phase Butterworth bandpass filter to ECG signal."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.size == 0:
        return arr

    nyquist = 0.5 * sampling_rate
    if highcut >= nyquist:
        # Highcut cannot meet or exceed Nyquist
        highcut = nyquist * 0.95

    low = lowcut / nyquist
    high = highcut / nyquist

    if low <= 0 or low >= 1.0 or high <= 0 or high >= 1.0 or low >= high:
        raise ValueError(
            f"Invalid cutoff frequencies for sampling rate {sampling_rate} Hz: "
            f"lowcut={lowcut}, highcut={highcut}"
        )

    sos = signal.butter(order, [low, high], btype="bandpass", output="sos")
    filtered = signal.sosfiltfilt(sos, arr)
    return np.asarray(filtered, dtype=float)


def notch_filter_50hz(
    ecg_signal: np.ndarray,
    sampling_rate: float = 500.0,
    notch_freq: float = 50.0,
    quality_factor: float = 30.0,
) -> np.ndarray:
    """Apply an IIR notch filter at notch_freq (default 50 Hz for Indian power grids)."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.size == 0:
        return arr

    nyquist = 0.5 * sampling_rate
    if notch_freq >= nyquist:
        # If sampling rate is too low for 50Hz notch (e.g. fs <= 100), return unfiltered
        return arr

    b, a = signal.iirnotch(notch_freq, quality_factor, fs=sampling_rate)
    filtered = signal.filtfilt(b, a, arr)
    return np.asarray(filtered, dtype=float)


def remove_baseline_wander(
    ecg_signal: np.ndarray,
    sampling_rate: float = 500.0,
    cutoff: float = 0.5,
    order: int = 2,
) -> np.ndarray:
    """Remove low-frequency baseline drift (respiration, motion) using a highpass filter."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.size == 0:
        return arr

    nyquist = 0.5 * sampling_rate
    normal_cutoff = cutoff / nyquist
    if normal_cutoff <= 0 or normal_cutoff >= 1.0:
        raise ValueError(f"Invalid cutoff frequency {cutoff} for sampling rate {sampling_rate}")

    sos = signal.butter(order, normal_cutoff, btype="highpass", output="sos")
    filtered = signal.sosfiltfilt(sos, arr)
    return np.asarray(filtered, dtype=float)


def preprocess_raw_ecg(
    ecg_signal: np.ndarray,
    sampling_rate: float = 500.0,
    apply_notch: bool = True,
    apply_bandpass: bool = True,
) -> np.ndarray:
    """Complete preprocessing pipeline for raw single-lead or multi-lead ECG trace."""
    arr = np.asarray(ecg_signal, dtype=float)
    if arr.ndim == 1:
        out = arr.copy()
        if apply_bandpass:
            out = bandpass_filter_ecg(out, sampling_rate=sampling_rate, lowcut=0.5, highcut=40.0)
        if apply_notch and sampling_rate > 100.0:
            out = notch_filter_50hz(out, sampling_rate=sampling_rate, notch_freq=50.0)
        return out
    elif arr.ndim == 2:
        # Filter lead by lead (shape: [num_samples, num_leads] or [num_leads, num_samples])
        # We assume shape [leads, samples] if leads < samples, else [samples, leads]
        axis = 0 if arr.shape[0] > arr.shape[1] else 1
        return np.apply_along_axis(
            lambda lead: preprocess_raw_ecg(
                lead, sampling_rate=sampling_rate, apply_notch=apply_notch, apply_bandpass=apply_bandpass
            ),
            axis=axis,
            arr=arr,
        )
    else:
        raise ValueError(f"ECG array must be 1D or 2D, got shape {arr.shape}")
