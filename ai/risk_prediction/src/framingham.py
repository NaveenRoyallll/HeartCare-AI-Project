"""Framingham General Cardiovascular Risk Score

Source: D'Agostino RB Sr, Vasan RS, Pencina MJ, et al.
        General cardiovascular risk profile for use in primary care.
        Circulation. 2008;117(6):743-753.
        doi:10.1161/CIRCULATIONAHA.107.699579

Population: Framingham Heart Study participants (predominantly white Americans)
Age range: 30-79 years
Outcome: 10-year risk of general cardiovascular disease

LIMITATIONS:
- Developed in a predominantly white American population
- NOT validated for South Asian / Indian populations
- Indian populations may have different baseline CVD risk profiles
- Risk may be UNDERESTIMATED for South Asian populations
  (Joshi et al., Lancet 2007; INTERHEART study)
- Consider population-specific recalibration before clinical use
- This implementation is for EDUCATIONAL/RESEARCH purposes only
- Not a substitute for clinical judgment

Required inputs:
- age (30-79 years)
- sex ('male' or 'female')
- total_cholesterol (mg/dL, 130-320)
- hdl_cholesterol (mg/dL, 20-100)
- systolic_bp (mmHg, 90-200)
- bp_treated (bool)
- smoker (bool)
- diabetic (bool)
"""

from dataclasses import dataclass, field
import math
from typing import Dict, List, Optional
from ai.common.types import ModelVersion, PredictionResult, RiskCategory


@dataclass
class FraminghamInput:
    age: int
    sex: str  # 'male' or 'female'
    total_cholesterol: float  # mg/dL
    hdl_cholesterol: float  # mg/dL
    systolic_bp: float  # mmHg
    bp_treated: bool
    smoker: bool
    diabetic: bool


@dataclass
class FraminghamResult:
    risk_percentage: float
    risk_category: str  # low, moderate, high
    individual_sum: float
    mean_coefficient_sum: float
    baseline_survival: float
    input_snapshot: dict
    calculation_version: str = "framingham_2008_general_cvd"
    limitations: Optional[List[str]] = None
    warnings: Optional[List[str]] = None

    def __post_init__(self):
        if self.limitations is None:
            self.limitations = [
                "Developed in predominantly white American population",
                "Not validated for South Asian / Indian populations",
                "May underestimate risk in South Asian populations",
                "For educational/research use only",
                "Not a substitute for clinical assessment",
            ]
        if self.warnings is None:
            self.warnings = []

    def to_prediction_result(self) -> PredictionResult:
        """Convert to standard PredictionResult model."""
        cat_map = {
            "low": RiskCategory.LOW.value,
            "moderate": RiskCategory.MODERATE.value,
            "high": RiskCategory.HIGH.value,
        }
        category_enum_val = cat_map.get(self.risk_category, RiskCategory.HIGH.value)

        return PredictionResult(
            value=self.risk_percentage,
            confidence=None,  # Deterministic statistical model, no confidence interval provided by score
            category=category_enum_val,
            model_version=ModelVersion(
                model_name="Framingham 2008 General CVD Risk Score",
                version="1.0.0",
                intended_use="Educational estimation of 10-year CVD risk in primary care",
                limitations=self.limitations or [],
                is_research_only=True,
            ),
            input_snapshot=self.input_snapshot,
            warnings=self.warnings or [],
            missing_inputs=[],
        )


def calculate_framingham_risk(inp: FraminghamInput) -> FraminghamResult:
    """Calculate 10-year CVD risk using Framingham 2008 equation."""
    # Validate inputs
    if not 30 <= inp.age <= 79:
        raise ValueError(f"Age {inp.age} outside valid range (30-79)")
    if inp.sex not in ("male", "female"):
        raise ValueError(f"Sex must be male or female, got {inp.sex}")
    if inp.total_cholesterol <= 0 or inp.hdl_cholesterol <= 0 or inp.systolic_bp <= 0:
        raise ValueError("Cholesterol and BP values must be positive")

    warnings = []

    # Check recommended input ranges and warn if outside ideal calibration bounds
    if not (130 <= inp.total_cholesterol <= 320):
        warnings.append(
            f"Total cholesterol {inp.total_cholesterol} mg/dL is outside standard Framingham range (130-320 mg/dL)."
        )
    if not (20 <= inp.hdl_cholesterol <= 100):
        warnings.append(
            f"HDL cholesterol {inp.hdl_cholesterol} mg/dL is outside standard Framingham range (20-100 mg/dL)."
        )
    if not (90 <= inp.systolic_bp <= 200):
        warnings.append(
            f"Systolic BP {inp.systolic_bp} mmHg is outside standard Framingham range (90-200 mmHg)."
        )

    # Coefficients from Table 4, D'Agostino 2008
    if inp.sex == "male":
        log_age_coeff = 3.06117
        log_tc_coeff = 1.12370
        log_hdl_coeff = -0.93263
        log_sbp_treated_coeff = 1.99881
        log_sbp_untreated_coeff = 1.93303
        smoking_coeff = 0.65451
        diabetes_coeff = 0.57367
        mean_coeff_sum = 23.9802
        baseline_survival = 0.88936
    else:
        log_age_coeff = 2.32888
        log_tc_coeff = 1.20904
        log_hdl_coeff = -0.70833
        log_sbp_treated_coeff = 2.76157
        log_sbp_untreated_coeff = 2.82263
        smoking_coeff = 0.52873
        diabetes_coeff = 0.69154
        mean_coeff_sum = 26.1931
        baseline_survival = 0.95012

    # Calculate individual sum
    individual_sum = (
        log_age_coeff * math.log(inp.age)
        + log_tc_coeff * math.log(inp.total_cholesterol)
        + log_hdl_coeff * math.log(inp.hdl_cholesterol)
        + (log_sbp_treated_coeff if inp.bp_treated else log_sbp_untreated_coeff) * math.log(inp.systolic_bp)
        + (smoking_coeff if inp.smoker else 0)
        + (diabetes_coeff if inp.diabetic else 0)
    )

    # Calculate risk: 1 - S_0(10)^exp(individual_sum - mean_sum)
    risk = 1.0 - baseline_survival ** math.exp(individual_sum - mean_coeff_sum)
    risk_pct = round(risk * 100, 1)
    risk_pct = max(0.1, min(risk_pct, 99.9))  # Clamp to valid range

    # Categorize
    if risk_pct < 10:
        category = "low"
    elif risk_pct < 20:
        category = "moderate"
    else:
        category = "high"

    # Add South Asian population warning
    warnings.append(
        "This score was developed in a predominantly white American population. "
        "Risk may be underestimated for South Asian individuals. "
        "Consult your healthcare provider for population-appropriate assessment."
    )

    return FraminghamResult(
        risk_percentage=risk_pct,
        risk_category=category,
        individual_sum=individual_sum,
        mean_coefficient_sum=mean_coeff_sum,
        baseline_survival=baseline_survival,
        input_snapshot={
            "age": inp.age,
            "sex": inp.sex,
            "total_cholesterol_mg_dl": inp.total_cholesterol,
            "hdl_cholesterol_mg_dl": inp.hdl_cholesterol,
            "systolic_bp_mmhg": inp.systolic_bp,
            "bp_treated": inp.bp_treated,
            "smoker": inp.smoker,
            "diabetic": inp.diabetic,
        },
        warnings=warnings,
    )
