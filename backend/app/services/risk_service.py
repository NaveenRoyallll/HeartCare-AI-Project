"""Framingham General Cardiovascular Risk Score Service (2008).

Scientific Citation:
D'Agostino RB Sr, Vasan RS, Pencina MJ, Wolf PA, Cobain M, Massaro JM, Kannel WB.
General cardiovascular risk profile for use in primary care: the Framingham Heart Study.
Circulation. 2008 Feb 12;117(6):743-53. doi: 10.1161/CIRCULATIONAHA.107.699579.

Population & Limitations:
- The score was derived and validated in Framingham Heart Study participants (predominantly white, European descent).
- CRITICAL ETHNICITY LIMITATION: The Framingham algorithm is NOT calibrated for Indian or South Asian populations.
  South Asian individuals present with premature coronary artery disease 10 to 15 years earlier and higher rates
  of metabolic syndrome and diabetes. ACC/AHA and Indian clinical guidelines recommend risk recalibration and treating
  South Asian ethnicity as a significant risk-enhancing factor.
"""
import math
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vital import VitalMeasurement
from app.models.user import UserProfile
from app.models.medical_history import MedicalHistory


class FraminghamRiskService:
    """Calculates 10-year general cardiovascular disease risk score using 2008 Cox regression models."""
    CALCULATION_VERSION = "2008.Framingham.v1"

    # Regression coefficients published by D'Agostino et al. (Circulation 2008)
    COEFFICIENTS_MEN = {
        "ln_age": 3.06117,
        "ln_total_chol": 1.12370,
        "ln_hdl": -0.93263,
        "ln_sbp_treated": 1.99881,
        "ln_sbp_untreated": 1.93303,
        "smoker": 0.65451,
        "diabetes": 0.57367,
        "mean_sum": 23.9802,
        "baseline_survival_10y": 0.88936,  # S0(10)
    }

    COEFFICIENTS_WOMEN = {
        "ln_age": 2.32888,
        "ln_total_chol": 1.20904,
        "ln_hdl": -0.70833,
        "ln_sbp_treated": 2.76157,
        "ln_sbp_untreated": 2.82263,
        "smoker": 0.52873,
        "diabetes": 0.69154,
        "mean_sum": 26.1931,
        "baseline_survival_10y": 0.95012,  # S0(10)
    }

    POPULATION_LIMITATIONS = [
        "Derived from the Framingham Heart Study cohort: predominantly white Americans of European descent (Circulation 2008;117:743-753).",
        "NOT validated for Indian/South Asian populations. Due to distinct genetic, lifestyle, and lipoprotein(a) profiles, South Asians exhibit premature CAD earlier; clinical judgment is advised.",
        "Does not account for family history of premature CAD, coronary artery calcium (CAC), or high-sensitivity C-reactive protein (hs-CRP).",
        "Intended for adults aged 30-74 without pre-existing clinical cardiovascular disease."
    ]

    @classmethod
    def calculate_score(
        cls,
        age: float,
        sex: str,
        total_cholesterol: float,
        hdl_cholesterol: float,
        systolic_bp: float,
        bp_treated: bool,
        smoker: bool,
        diabetes: bool,
    ) -> Tuple[float, str, List[str]]:
        """Calculate 10-year risk percentage and risk category.
        
        Returns:
            Tuple[float, str, List[str]]: (risk_percentage, category, recommendations)
        """
        if not 30 <= age <= 79:
            raise ValueError("Age must be within the calibrated Framingham range of 30-79 years")
        if not 130 <= total_cholesterol <= 320:
            raise ValueError("Total cholesterol must be within the calibrated range of 130-320 mg/dL")
        if not 20 <= hdl_cholesterol <= 100:
            raise ValueError("HDL cholesterol must be within the calibrated range of 20-100 mg/dL")
        if not 90 <= systolic_bp <= 200:
            raise ValueError("Systolic blood pressure must be within the calibrated range of 90-200 mmHg")
        sex_clean = sex.strip().lower()
        if sex_clean in ("male", "m"):
            params = cls.COEFFICIENTS_MEN
        elif sex_clean in ("female", "f"):
            params = cls.COEFFICIENTS_WOMEN
        else:
            raise ValueError(f"Sex must be 'male' or 'female', received '{sex}'")

        # Natural log transformations of continuous risk predictors
        ln_age = math.log(max(age, 1.0))
        ln_total_chol = math.log(max(total_cholesterol, 1.0))
        ln_hdl = math.log(max(hdl_cholesterol, 1.0))
        ln_sbp = math.log(max(systolic_bp, 1.0))

        # Systolic BP term depends on hypertension treatment status
        if bp_treated:
            sbp_term = ln_sbp * params["ln_sbp_treated"]
        else:
            sbp_term = ln_sbp * params["ln_sbp_untreated"]

        # Linear predictor sum
        individual_sum = (
            (ln_age * params["ln_age"])
            + (ln_total_chol * params["ln_total_chol"])
            + (ln_hdl * params["ln_hdl"])
            + sbp_term
            + (1.0 if smoker else 0.0) * params["smoker"]
            + (1.0 if diabetes else 0.0) * params["diabetes"]
        )

        mean_sum = params["mean_sum"]
        s0 = params["baseline_survival_10y"]

        # 10-year CVD risk equation: Risk = 1 - S0^exp(individual_sum - mean_sum)
        exponent = math.exp(individual_sum - mean_sum)
        risk = 1.0 - math.pow(s0, exponent)
        risk_percentage = round(max(0.1, min(99.9, risk * 100.0)), 2)

        # Risk categories according to international primary prevention guidelines
        if risk_percentage < 10.0:
            category = "low"
        elif risk_percentage < 20.0:
            category = "moderate"
        else:
            category = "high"

        # Evidence-based tailored recommendations
        recommendations: List[str] = []
        if smoker:
            recommendations.append("Smoking cessation: Tobacco cessation reduces cardiovascular event risk by ~50% within 1-2 years.")
        if systolic_bp >= 130.0:
            recommendations.append("Blood pressure control: Target systolic BP < 130 mmHg via sodium restriction (<2g/day) and clinician-guided therapy.")
        if total_cholesterol >= 200.0 or hdl_cholesterol < 40.0:
            recommendations.append("Lipid management: Discuss statin therapy or dietary lipid optimization with a clinician to lower atherogenic LDL.")
        if diabetes:
            recommendations.append("Glycemic control: Maintain HbA1c < 7.0% through medical management and active lifestyle modification.")
        if category == "high":
            recommendations.append("Comprehensive clinical review: High 10-year risk (>20%) warrants comprehensive physician consultation and preventive pharmacotherapy.")
        elif category == "moderate":
            recommendations.append("Moderate risk monitoring: Lifestyle interventions with annual cardiovascular reassessment recommended.")
        else:
            recommendations.append("Low risk maintenance: Maintain heart-healthy diet, regular physical exercise (>150 min/wk), and recheck risk every 3-5 years.")

        return risk_percentage, category, recommendations

    @classmethod
    async def populate_inputs_from_db(
        cls,
        user_id: str,
        db: AsyncSession,
        provided: Dict[str, Any],
    ) -> Tuple[Dict[str, Any], List[str]]:
        """Autofill missing Framingham parameters from user vitals and history."""
        snapshot = dict(provided)
        missing: List[str] = []

        # 1. Fetch Profile for Age and Sex
        if snapshot.get("age") is None or snapshot.get("sex") is None:
            prof_query = select(UserProfile).where(UserProfile.user_id == user_id)
            prof_res = await db.execute(prof_query)
            profile = prof_res.scalar_one_or_none()
            if profile:
                if snapshot.get("sex") is None and profile.gender:
                    snapshot["sex"] = profile.gender
                if snapshot.get("age") is None and profile.date_of_birth:
                    from datetime import date
                    today = date.today()
                    dob = profile.date_of_birth
                    calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                    snapshot["age"] = calculated_age

        # 2. Fetch Latest Vitals for Blood Pressure and Cholesterols
        vitals_needed = {
            "systolic_bp": "blood_pressure",
            "total_cholesterol": "cholesterol_total",
            "hdl_cholesterol": "cholesterol_hdl",
        }
        for field, m_type in vitals_needed.items():
            if snapshot.get(field) is None:
                v_query = (
                    select(VitalMeasurement)
                    .where(
                        VitalMeasurement.user_id == user_id,
                        VitalMeasurement.measurement_type == m_type,
                        VitalMeasurement.is_deleted.is_(False),
                    )
                    .order_by(desc(VitalMeasurement.measured_at))
                    .limit(1)
                )
                v_res = await db.execute(v_query)
                vital = v_res.scalar_one_or_none()
                if vital:
                    snapshot[field] = vital.value_primary

        # 3. Check for Diabetes in Medical History
        if snapshot.get("diabetes") is None:
            hist_query = select(MedicalHistory).where(
                MedicalHistory.user_id == user_id,
                MedicalHistory.is_active.is_(True),
            )
            hist_res = await db.execute(hist_query)
            conditions = hist_res.scalars().all()
            has_diabetes = any("diabet" in c.condition_name.lower() for c in conditions)
            snapshot["diabetes"] = has_diabetes

        # Identify any remaining missing required fields
        required_fields = ["age", "sex", "total_cholesterol", "hdl_cholesterol", "systolic_bp"]
        for rf in required_fields:
            if snapshot.get(rf) is None:
                missing.append(rf)

        return snapshot, missing
