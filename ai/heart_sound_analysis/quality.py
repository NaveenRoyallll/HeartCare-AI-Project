"""Quality checks for heart-sound recordings without diagnostic inference."""
from dataclasses import dataclass, field
from typing import List

import numpy as np


@dataclass
class HeartSoundQuality:
    usable: bool
    duration_seconds: float
    sample_rate_hz: int
    signal_to_noise_proxy: float
    issues: List[str] = field(default_factory=list)
    diagnostic_inference_available: bool = False


def assess_recording(samples: np.ndarray, sample_rate_hz: int) -> HeartSoundQuality:
    """Assess recording integrity; never labels a recording as normal or safe."""
    values = np.asarray(samples, dtype=float)
    issues: List[str] = []
    if values.ndim != 1 or values.size == 0:
        return HeartSoundQuality(False, 0.0, sample_rate_hz, 0.0, ["Recording must be a non-empty mono signal."])
    if sample_rate_hz < 8000 or sample_rate_hz > 96000:
        issues.append("Sample rate is outside the supported ingestion range.")
    if not np.isfinite(values).all():
        issues.append("Recording contains non-finite samples.")
    duration = values.size / max(sample_rate_hz, 1)
    if duration < 5:
        issues.append("Recording is shorter than the 5-second quality target.")
    if duration > 120:
        issues.append("Recording exceeds the 120-second ingestion limit.")
    rms = float(np.sqrt(np.mean(values ** 2))) if values.size else 0.0
    peak = float(np.max(np.abs(values))) if values.size else 0.0
    if rms < 1e-5:
        issues.append("Recording has no measurable signal.")
    if peak > 0 and rms / peak < 0.01:
        issues.append("Recording is dominated by isolated peaks or clipping.")
    return HeartSoundQuality(
        usable=not issues,
        duration_seconds=duration,
        sample_rate_hz=sample_rate_hz,
        signal_to_noise_proxy=round(rms / max(peak, 1e-9), 4),
        issues=issues,
    )
