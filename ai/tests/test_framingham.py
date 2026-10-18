"""Unit and regression tests for Framingham 2008 General CVD Risk Calculation."""

import math
import pytest
from ai.common.validation import validate_framingham_inputs
from ai.risk_prediction.src.framingham import (
    FraminghamInput,
    FraminghamResult,
    calculate_framingham_risk,
)


def test_framingham_coefficients_match_publication():
    """Verify that internal calculation logic matches Table 4 coefficients from D'Agostino et al. 2008."""
    # Test Male coefficients
    male_inp = FraminghamInput(
        age=55,
        sex="male",
        total_cholesterol=250.0,
        hdl_cholesterol=50.0,
        systolic_bp=140.0,
        bp_treated=False,
        smoker=False,
        diabetic=False,
    )
    res_m = calculate_framingham_risk(male_inp)

    # Manual step-by-step calculation
    expected_sum_m = (
        3.06117 * math.log(55)
        + 1.12370 * math.log(250.0)
        + (-0.93263) * math.log(50.0)
        + 1.93303 * math.log(140.0)
    )
    assert math.isclose(res_m.individual_sum, expected_sum_m, rel_tol=1e-5)
    assert res_m.mean_coefficient_sum == 23.9802
    assert res_m.baseline_survival == 0.88936

    expected_risk_m = 1.0 - (0.88936 ** math.exp(expected_sum_m - 23.9802))
    assert math.isclose(res_m.risk_percentage, round(expected_risk_m * 100, 1), abs_tol=0.2)
    assert res_m.risk_category == "moderate"

    # Test Female coefficients
    female_inp = FraminghamInput(
        age=55,
        sex="female",
        total_cholesterol=250.0,
        hdl_cholesterol=50.0,
        systolic_bp=140.0,
        bp_treated=False,
        smoker=False,
        diabetic=False,
    )
    res_f = calculate_framingham_risk(female_inp)
    expected_sum_f = (
        2.32888 * math.log(55)
        + 1.20904 * math.log(250.0)
        + (-0.70833) * math.log(50.0)
        + 2.82263 * math.log(140.0)
    )
    assert math.isclose(res_f.individual_sum, expected_sum_f, rel_tol=1e-5)
    assert res_f.mean_coefficient_sum == 26.1931
    assert res_f.baseline_survival == 0.95012


def test_framingham_bp_treated_differentiates():
    """Treated systolic BP should utilize the treated coefficient."""
    untreated = FraminghamInput(
        age=60, sex="male", total_cholesterol=200, hdl_cholesterol=45, systolic_bp=150,
        bp_treated=False, smoker=False, diabetic=False
    )
    treated = FraminghamInput(
        age=60, sex="male", total_cholesterol=200, hdl_cholesterol=45, systolic_bp=150,
        bp_treated=True, smoker=False, diabetic=False
    )
    res_untreated = calculate_framingham_risk(untreated)
    res_treated = calculate_framingham_risk(treated)

    # For males: treated coeff (1.99881) > untreated coeff (1.93303)
    assert res_treated.individual_sum > res_untreated.individual_sum
    assert res_treated.risk_percentage >= res_untreated.risk_percentage


def test_framingham_categories():
    """Verify low, moderate, and high risk categorizations."""
    # Young, optimal lipids, non-smoker -> Low (<10%)
    low_case = FraminghamInput(
        age=32, sex="female", total_cholesterol=150, hdl_cholesterol=65, systolic_bp=105,
        bp_treated=False, smoker=False, diabetic=False
    )
    res_low = calculate_framingham_risk(low_case)
    assert res_low.risk_category == "low"
    assert res_low.risk_percentage < 10.0

    # Older, multiple risk factors -> High (>=20%)
    high_case = FraminghamInput(
        age=72, sex="male", total_cholesterol=280, hdl_cholesterol=28, systolic_bp=170,
        bp_treated=True, smoker=True, diabetic=True
    )
    res_high = calculate_framingham_risk(high_case)
    assert res_high.risk_category == "high"
    assert res_high.risk_percentage >= 20.0


def test_framingham_age_boundaries():
    """Valid age range is strictly 30 to 79."""
    # 30 should succeed
    inp_30 = FraminghamInput(
        age=30, sex="male", total_cholesterol=180, hdl_cholesterol=50, systolic_bp=110,
        bp_treated=False, smoker=False, diabetic=False
    )
    assert calculate_framingham_risk(inp_30).risk_percentage > 0

    # 79 should succeed
    inp_79 = FraminghamInput(
        age=79, sex="male", total_cholesterol=180, hdl_cholesterol=50, systolic_bp=110,
        bp_treated=False, smoker=False, diabetic=False
    )
    assert calculate_framingham_risk(inp_79).risk_percentage > 0

    # 29 should raise ValueError
    inp_29 = FraminghamInput(
        age=29, sex="male", total_cholesterol=180, hdl_cholesterol=50, systolic_bp=110,
        bp_treated=False, smoker=False, diabetic=False
    )
    with pytest.raises(ValueError, match="outside valid range"):
        calculate_framingham_risk(inp_29)

    # 80 should raise ValueError
    inp_80 = FraminghamInput(
        age=80, sex="male", total_cholesterol=180, hdl_cholesterol=50, systolic_bp=110,
        bp_treated=False, smoker=False, diabetic=False
    )
    with pytest.raises(ValueError, match="outside valid range"):
        calculate_framingham_risk(inp_80)


def test_framingham_invalid_values():
    """Negative or zero values and invalid sex must fail."""
    with pytest.raises(ValueError, match="Sex must be male or female"):
        calculate_framingham_risk(
            FraminghamInput(
                age=50, sex="other", total_cholesterol=200, hdl_cholesterol=50, systolic_bp=120,
                bp_treated=False, smoker=False, diabetic=False
            )
        )

    with pytest.raises(ValueError, match="must be positive"):
        calculate_framingham_risk(
            FraminghamInput(
                age=50, sex="male", total_cholesterol=-10, hdl_cholesterol=50, systolic_bp=120,
                bp_treated=False, smoker=False, diabetic=False
            )
        )


def test_framingham_south_asian_disclaimer_present():
    """Result must contain the South Asian / Indian population warning and limitations."""
    inp = FraminghamInput(
        age=50, sex="male", total_cholesterol=200, hdl_cholesterol=45, systolic_bp=125,
        bp_treated=False, smoker=False, diabetic=False
    )
    res = calculate_framingham_risk(inp)
    assert any("South Asian" in w for w in res.warnings)
    assert any("predominantly white American" in lim for lim in res.limitations)


def test_validation_report_catches_missing_and_out_of_range():
    """Common input validation report tests."""
    # Test missing fields
    incomplete_data = {"age": 45, "sex": "male"}
    rep1 = validate_framingham_inputs(incomplete_data)
    assert not rep1.is_valid
    assert len(rep1.issues) > 0

    # Test out of range systolic BP
    out_of_bounds = {
        "age": 45,
        "sex": "female",
        "total_cholesterol": 200,
        "hdl_cholesterol": 50,
        "systolic_bp": 250,  # exceeds Framingham 200
        "bp_treated": False,
        "smoker": False,
        "diabetic": False,
    }
    rep2 = validate_framingham_inputs(out_of_bounds)
    assert not rep2.is_valid
    assert any("systolic_bp" == issue.field for issue in rep2.issues)
