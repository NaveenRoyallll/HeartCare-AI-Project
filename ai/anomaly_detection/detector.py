"""Personal baseline builder and vital sign anomaly detection.

IMPORTANT NOTICE:
This module detects mathematical deviations from a user's historical baseline.
It does NOT make medical diagnoses or replace clinical evaluations.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional
import numpy as np


class AnomalyStatus(str, Enum):
    MISSING_DATA = "missing_data"
    INSUFFICIENT_BASELINE = "insufficient_baseline"
    WITHIN_BASELINE = "within_baseline"
    TEMPORARY_DEVIATION = "temporary_deviation"
    PERSISTENT_CHANGE = "persistent_change"


@dataclass
class BaselineProfile:
    metric_name: str
    sample_count: int
    mean: float
    std: float
    median: float
    iqr: float
    min_val: float
    max_val: float


@dataclass
class DeviationResult:
    metric_name: str
    status: AnomalyStatus
    is_alert: bool
    current_value: Optional[float] = None
    baseline_mean: Optional[float] = None
    baseline_std: Optional[float] = None
    z_score: Optional[float] = None
    consecutive_deviations: int = 0
    message: str = ""
    limitations: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.limitations:
            self.limitations = [
                "Statistical deviation only, NOT a clinical diagnosis.",
                "Baselines require consistent measurement conditions (time of day, resting state).",
                "Transient factors such as acute exercise, caffeine, stress, or minor illness affect vitals.",
            ]


class PersonalBaselineDetector:
    """Builds an individualized physiological baseline and detects statistical anomalies."""

    def __init__(
        self,
        min_baseline_points: int = 5,
        z_threshold: float = 2.0,
        persistence_count: int = 3,
        min_std_eps: float = 1e-4,
    ):
        """Args:

        min_baseline_points: Minimum historical measurements required before alerting.
        z_threshold: Z-score cutoff (e.g. 2.0 standard deviations) for statistical alert.
        persistence_count: Number of consecutive deviations needed to classify as persistent change.
        min_std_eps: Minimum allowable standard deviation to avoid divide-by-zero on static signals.
        """
        self.min_baseline_points = min_baseline_points
        self.z_threshold = z_threshold
        self.persistence_count = persistence_count
        self.min_std_eps = min_std_eps
        self.baselines: Dict[str, BaselineProfile] = {}

    def fit_baseline(self, metric_name: str, values: List[float]) -> Optional[BaselineProfile]:
        """Fit a baseline from a sequence of historical measurements."""
        clean_vals = [float(v) for v in values if v is not None and not np.isnan(v)]
        if len(clean_vals) < self.min_baseline_points:
            return None

        arr = np.array(clean_vals, dtype=float)
        mean_v = float(np.mean(arr))
        std_v = float(np.std(arr))
        median_v = float(np.median(arr))
        q75, q25 = np.percentile(arr, [75, 25])
        iqr_v = float(q75 - q25)

        # Apply floor to std_v so tiny fluctuations don't cause explosive z-scores
        effective_std = max(std_v, self.min_std_eps)

        profile = BaselineProfile(
            metric_name=metric_name,
            sample_count=len(arr),
            mean=round(mean_v, 2),
            std=round(effective_std, 2),
            median=round(median_v, 2),
            iqr=round(iqr_v, 2),
            min_val=round(float(np.min(arr)), 2),
            max_val=round(float(np.max(arr)), 2),
        )
        self.baselines[metric_name] = profile
        return profile

    def evaluate_measurement(
        self,
        metric_name: str,
        current_value: Optional[float],
        recent_history: Optional[List[float]] = None,
    ) -> DeviationResult:
        """Evaluate a new measurement against the established baseline.

        Args:
            metric_name: Name of metric (e.g. 'heart_rate', 'systolic_bp').
            current_value: The latest value measured.
            recent_history: Optional list of recent measurements leading up to current_value,
                            used to assess whether a deviation is persistent or temporary.
        """
        if current_value is None or np.isnan(current_value):
            return DeviationResult(
                metric_name=metric_name,
                status=AnomalyStatus.MISSING_DATA,
                is_alert=False,
                current_value=None,
                message=f"No measurement value provided for '{metric_name}'.",
            )

        baseline = self.baselines.get(metric_name)
        if baseline is None:
            return DeviationResult(
                metric_name=metric_name,
                status=AnomalyStatus.INSUFFICIENT_BASELINE,
                is_alert=False,
                current_value=current_value,
                message=(
                    f"Insufficient historical data to establish personal baseline for '{metric_name}'. "
                    f"Requires at least {self.min_baseline_points} measurements."
                ),
            )

        # Compute z-score
        std = max(baseline.std, self.min_std_eps)
        z_score = float((current_value - baseline.mean) / std)
        abs_z = abs(z_score)

        if abs_z < self.z_threshold:
            return DeviationResult(
                metric_name=metric_name,
                status=AnomalyStatus.WITHIN_BASELINE,
                is_alert=False,
                current_value=current_value,
                baseline_mean=baseline.mean,
                baseline_std=baseline.std,
                z_score=round(z_score, 2),
                consecutive_deviations=0,
                message=f"{metric_name} ({current_value}) is within personal baseline range.",
            )

        # A deviation is present. Check recent history to distinguish temporary vs persistent
        consecutive = 1
        if recent_history:
            # Check backwards from the most recent elements
            for prev in reversed(recent_history):
                if prev is None or np.isnan(prev):
                    break
                prev_z = (prev - baseline.mean) / std
                # Check if it deviated in the same direction
                if abs(prev_z) >= self.z_threshold and (prev_z * z_score > 0):
                    consecutive += 1
                else:
                    break

        if consecutive >= self.persistence_count:
            status = AnomalyStatus.PERSISTENT_CHANGE
            message = (
                f"PERSISTENT CHANGE: {metric_name} ({current_value}) has deviated by {z_score:+.1f} standard deviations "
                f"across {consecutive} consecutive readings (Baseline: {baseline.mean} ± {baseline.std})."
            )
        else:
            status = AnomalyStatus.TEMPORARY_DEVIATION
            message = (
                f"TEMPORARY DEVIATION: {metric_name} ({current_value}) is {z_score:+.1f} standard deviations from baseline "
                f"(reading {consecutive}/{self.persistence_count} towards persistent change threshold)."
            )

        return DeviationResult(
            metric_name=metric_name,
            status=status,
            is_alert=True,
            current_value=current_value,
            baseline_mean=baseline.mean,
            baseline_std=baseline.std,
            z_score=round(z_score, 2),
            consecutive_deviations=consecutive,
            message=message,
        )
