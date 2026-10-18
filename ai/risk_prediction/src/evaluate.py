"""Model evaluation framework for clinical risk prediction models.

Includes AUROC discrimination, calibration slope/intercept, Brier score,
Expected Calibration Error (ECE), and subgroup stratification (e.g., sex, age brackets).
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from sklearn.metrics import roc_auc_score, brier_score_loss


@dataclass
class SubgroupMetricResult:
    subgroup_name: str
    sample_size: int
    event_rate: float
    auroc: Optional[float]
    brier_score: Optional[float]


@dataclass
class ModelEvaluationMetrics:
    total_samples: int
    event_count: int
    event_rate: float
    auroc: Optional[float]
    brier_score: float
    calibration_slope: Optional[float]
    calibration_intercept: Optional[float]
    expected_calibration_error: float
    subgroup_analysis: Dict[str, SubgroupMetricResult] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute the Brier Score: Mean squared difference between predicted probabilities and actual outcomes."""
    y_true_arr = np.asarray(y_true, dtype=float)
    y_prob_arr = np.asarray(y_prob, dtype=float)
    return float(np.mean((y_prob_arr - y_true_arr) ** 2))


def calibration_slope_and_intercept(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    eps: float = 1e-6,
) -> Tuple[Optional[float], Optional[float]]:
    """Compute calibration slope and intercept via logistic regression on log-odds."""
    y_true_arr = np.asarray(y_true, dtype=int)
    y_prob_arr = np.clip(np.asarray(y_prob, dtype=float), eps, 1.0 - eps)

    # Need at least two classes to fit logistic regression
    unique_classes = np.unique(y_true_arr)
    if len(unique_classes) < 2:
        return None, None

    # Log-odds of predicted probabilities
    log_odds = np.log(y_prob_arr / (1.0 - y_prob_arr))

    # Fit univariate logistic regression: logit(p) = intercept + slope * log_odds
    try:
        from sklearn.linear_model import LogisticRegression

        clf = LogisticRegression(penalty=None, solver="lbfgs")
        clf.fit(log_odds.reshape(-1, 1), y_true_arr)
        slope = float(clf.coef_[0][0])
        intercept = float(clf.intercept_[0])
        return slope, intercept
    except Exception:
        # Fallback if regression encounters singular matrix or divergence
        return None, None


def expected_calibration_error(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> float:
    """Calculate the Expected Calibration Error (ECE) across equal-frequency or equal-width bins."""
    y_true_arr = np.asarray(y_true, dtype=int)
    y_prob_arr = np.asarray(y_prob, dtype=float)

    bin_boundaries = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    total_n = len(y_true_arr)

    if total_n == 0:
        return 0.0

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        mask = (y_prob_arr >= bin_lower) & (y_prob_arr <= bin_upper if i == n_bins - 1 else y_prob_arr < bin_upper)
        bin_size = np.sum(mask)

        if bin_size > 0:
            bin_acc = np.mean(y_true_arr[mask])
            bin_conf = np.mean(y_prob_arr[mask])
            ece += (bin_size / total_n) * abs(bin_acc - bin_conf)

    return float(ece)


def evaluate_risk_model(
    y_true: Union[List[int], np.ndarray],
    y_prob: Union[List[float], np.ndarray],
    subgroups: Optional[Dict[str, Union[List[str], np.ndarray]]] = None,
) -> ModelEvaluationMetrics:
    """Evaluate clinical risk predictions across discrimination, calibration, and demographic subgroups."""
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.asarray(y_prob, dtype=float)

    warnings: List[str] = []
    n = len(y_t)
    if n == 0 or len(y_p) != n:
        raise ValueError("y_true and y_prob must be non-empty arrays of identical length.")

    # Validate probabilities are in [0, 1]
    if np.any(y_p < 0.0) or np.any(y_p > 1.0):
        # If probabilities were given in percentages (0-100), adjust
        if np.all(y_p <= 100.0) and np.any(y_p > 1.0):
            warnings.append("Probabilities appeared to be scaled 0-100; scaled down to [0.0, 1.0].")
            y_p = y_p / 100.0
        else:
            raise ValueError("All predicted probabilities must be bounded in [0.0, 1.0].")

    events = int(np.sum(y_t))
    event_rate = float(events / n)

    # AUROC
    unique_outcomes = np.unique(y_t)
    if len(unique_outcomes) >= 2:
        try:
            auroc = float(roc_auc_score(y_t, y_p))
        except Exception as e:
            auroc = None
            warnings.append(f"AUROC calculation failed: {e}")
    else:
        auroc = None
        warnings.append("Only one class present in y_true; AUROC is undefined.")

    # Brier Score
    brier = brier_score(y_t, y_p)

    # Calibration
    slope, intercept = calibration_slope_and_intercept(y_t, y_p)
    ece = expected_calibration_error(y_t, y_p)

    # Subgroups
    subgroup_results: Dict[str, SubgroupMetricResult] = {}
    if subgroups:
        for group_label, group_assignments in subgroups.items():
            group_arr = np.asarray(group_assignments)
            unique_groups = np.unique(group_arr)

            for group_val in unique_groups:
                idx = group_arr == group_val
                sub_y_t = y_t[idx]
                sub_y_p = y_p[idx]
                sub_n = len(sub_y_t)
                sub_events = int(np.sum(sub_y_t))
                sub_rate = float(sub_events / sub_n) if sub_n > 0 else 0.0

                sub_auroc = None
                if len(np.unique(sub_y_t)) >= 2:
                    try:
                        sub_auroc = float(roc_auc_score(sub_y_t, sub_y_p))
                    except Exception:
                        sub_auroc = None

                sub_brier = brier_score(sub_y_t, sub_y_p) if sub_n > 0 else None

                key = f"{group_label}:{group_val}"
                subgroup_results[key] = SubgroupMetricResult(
                    subgroup_name=key,
                    sample_size=sub_n,
                    event_rate=sub_rate,
                    auroc=sub_auroc,
                    brier_score=sub_brier,
                )

    return ModelEvaluationMetrics(
        total_samples=n,
        event_count=events,
        event_rate=event_rate,
        auroc=auroc,
        brier_score=brier,
        calibration_slope=slope,
        calibration_intercept=intercept,
        expected_calibration_error=ece,
        subgroup_analysis=subgroup_results,
        warnings=warnings,
    )
