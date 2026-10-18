"""Clinical input validation routines for vital signs and cardiovascular risk inputs."""

from typing import Any, Dict, Optional, Tuple
from ai.common.types import ValidationIssue, ValidationReport, ValidationSeverity


# Clinically plausible ranges for validation
VITAL_RANGES = {
    "age": (1, 120, "1 to 120 years"),
    "framingham_age": (30, 79, "30 to 79 years"),
    "systolic_bp": (60.0, 260.0, "60 to 260 mmHg"),
    "framingham_sbp": (90.0, 200.0, "90 to 200 mmHg"),
    "diastolic_bp": (30.0, 150.0, "30 to 150 mmHg"),
    "heart_rate": (30.0, 250.0, "30 to 250 bpm"),
    "spo2": (50.0, 100.0, "50 to 100 %"),
    "respiratory_rate": (6.0, 60.0, "6 to 60 breaths/min"),
    "body_temperature": (30.0, 45.0, "30.0 to 45.0 °C"),
    "blood_glucose": (30.0, 600.0, "30 to 600 mg/dL"),
    "total_cholesterol": (70.0, 600.0, "70 to 600 mg/dL"),
    "framingham_total_cholesterol": (130.0, 320.0, "130 to 320 mg/dL"),
    "hdl_cholesterol": (10.0, 150.0, "10 to 150 mg/dL"),
    "framingham_hdl_cholesterol": (20.0, 100.0, "20 to 100 mg/dL"),
}


def validate_numeric_range(
    field_name: str,
    value: Any,
    min_val: float,
    max_val: float,
    expected_desc: str,
) -> Optional[ValidationIssue]:
    """Validate that a value is numeric and falls within [min_val, max_val]."""
    if value is None:
        return ValidationIssue(
            field=field_name,
            message=f"{field_name} is missing or null.",
            severity=ValidationSeverity.ERROR,
            provided_value=None,
            expected_range=expected_desc,
        )

    try:
        num = float(value)
    except (TypeError, ValueError):
        return ValidationIssue(
            field=field_name,
            message=f"{field_name} must be a valid number, got {type(value).__name__}.",
            severity=ValidationSeverity.ERROR,
            provided_value=value,
            expected_range=expected_desc,
        )

    if not (min_val <= num <= max_val):
        return ValidationIssue(
            field=field_name,
            message=f"{field_name} ({num}) is outside expected physiological range ({expected_desc}).",
            severity=ValidationSeverity.ERROR,
            provided_value=num,
            expected_range=expected_desc,
        )

    return None


def validate_framingham_inputs(data: Dict[str, Any]) -> ValidationReport:
    """Validate all required inputs for the Framingham 2008 CVD calculation."""
    report = ValidationReport(is_valid=True, sanitized_data={})
    required_fields = [
        "age",
        "sex",
        "total_cholesterol",
        "hdl_cholesterol",
        "systolic_bp",
        "bp_treated",
        "smoker",
        "diabetic",
    ]

    # Check for missing fields
    for field in required_fields:
        if field not in data or data[field] is None:
            report.add_error(field, f"Missing required field: '{field}'")

    if not report.is_valid:
        return report

    # Validate Age
    age = data.get("age")
    try:
        age_int = int(age)
        if not (30 <= age_int <= 79):
            report.add_error(
                "age",
                f"Age {age_int} is outside valid Framingham range (30-79 years).",
                value=age_int,
                expected_range="30 to 79",
            )
        else:
            report.sanitized_data["age"] = age_int
    except (TypeError, ValueError):
        report.add_error("age", f"Age must be an integer, got {age}", value=age)

    # Validate Sex
    sex = str(data.get("sex", "")).strip().lower()
    if sex not in ("male", "female"):
        report.add_error(
            "sex",
            f"Sex must be 'male' or 'female', got '{data.get('sex')}'.",
            value=data.get("sex"),
            expected_range="'male' or 'female'",
        )
    else:
        report.sanitized_data["sex"] = sex

    # Validate Total Cholesterol
    tc_issue = validate_numeric_range(
        "total_cholesterol",
        data.get("total_cholesterol"),
        130.0,
        320.0,
        "130 to 320 mg/dL",
    )
    if tc_issue:
        report.issues.append(tc_issue)
        report.is_valid = False
    else:
        report.sanitized_data["total_cholesterol"] = float(data["total_cholesterol"])

    # Validate HDL Cholesterol
    hdl_issue = validate_numeric_range(
        "hdl_cholesterol",
        data.get("hdl_cholesterol"),
        20.0,
        100.0,
        "20 to 100 mg/dL",
    )
    if hdl_issue:
        report.issues.append(hdl_issue)
        report.is_valid = False
    else:
        report.sanitized_data["hdl_cholesterol"] = float(data["hdl_cholesterol"])

    # Validate Systolic BP
    sbp_issue = validate_numeric_range(
        "systolic_bp",
        data.get("systolic_bp"),
        90.0,
        200.0,
        "90 to 200 mmHg",
    )
    if sbp_issue:
        report.issues.append(sbp_issue)
        report.is_valid = False
    else:
        report.sanitized_data["systolic_bp"] = float(data["systolic_bp"])

    # Boolean flags
    for bool_field in ["bp_treated", "smoker", "diabetic"]:
        val = data.get(bool_field)
        if isinstance(val, bool):
            report.sanitized_data[bool_field] = val
        elif isinstance(val, (int, str)):
            s = str(val).strip().lower()
            if s in ("true", "1", "yes", "t"):
                report.sanitized_data[bool_field] = True
            elif s in ("false", "0", "no", "f"):
                report.sanitized_data[bool_field] = False
            else:
                report.add_error(bool_field, f"{bool_field} must be boolean (True/False), got {val}")
        else:
            report.add_error(bool_field, f"{bool_field} must be boolean (True/False), got {type(val).__name__}")

    return report


def validate_vital_signs(data: Dict[str, Any]) -> ValidationReport:
    """Validate common patient vital signs against physiological bounds."""
    report = ValidationReport(is_valid=True, sanitized_data={})

    for key, val in data.items():
        if val is None:
            continue
        if key in VITAL_RANGES:
            min_v, max_v, desc = VITAL_RANGES[key]
            issue = validate_numeric_range(key, val, min_v, max_v, desc)
            if issue:
                report.issues.append(issue)
                report.is_valid = False
            else:
                report.sanitized_data[key] = float(val)
        else:
            report.sanitized_data[key] = val

    # Verify SBP > DBP if both provided
    sbp = report.sanitized_data.get("systolic_bp")
    dbp = report.sanitized_data.get("diastolic_bp")
    if sbp is not None and dbp is not None:
        if sbp <= dbp:
            report.add_error(
                "blood_pressure",
                f"Systolic BP ({sbp}) must be strictly greater than Diastolic BP ({dbp}).",
                value={"systolic_bp": sbp, "diastolic_bp": dbp},
            )

    return report
