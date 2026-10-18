"""Deterministic, explainable cardiovascular assessment orchestration."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blood_report import BloodReport, BloodReportResult
from app.models.cardiovascular_assessment import CardiovascularAssessment
from app.models.lifestyle import LifestyleLog
from app.models.medical_history import FamilyHistory, MedicalHistory
from app.models.user import UserProfile
from app.models.vital import VitalMeasurement
from app.services.emergency_service import EmergencyService


class CardiovascularAssessmentService:
    """Combines deterministic safety triage with non-diagnostic prevention signals."""

    def __init__(self, emergency_service: Optional[EmergencyService] = None):
        self.emergency_service = emergency_service or EmergencyService()

    async def evaluate(self, user_id: str, data: Dict[str, Any], db: AsyncSession) -> CardiovascularAssessment:
        emergency = await self.emergency_service.triage_symptoms(
            symptoms=data.get("symptoms", []),
            heart_rate=data.get("heart_rate"),
            systolic_bp=data.get("systolic_bp"),
            diastolic_bp=data.get("diastolic_bp"),
            symptom_severity=data.get("symptom_severity"),
            symptom_duration_minutes=data.get("symptom_duration_minutes"),
            symptom_onset=data.get("symptom_onset"),
            symptoms_worsening=data.get("symptoms_worsening"),
        )
        observations = [{"name": "acute triage", "value": emergency["classification"], "source": "deterministic rules"}]
        if emergency["is_life_threatening"] or emergency["classification"] == "URGENT":
            result = self._record(
                user_id,
                "acute_triage",
                emergency["classification"],
                observations,
                data,
                "user_reported",
                [],
                ["Normal vital signs do not exclude an acute coronary event."],
                emergency["primary_instructions"],
                emergency["primary_instructions"],
            )
            db.add(result)
            await db.commit()
            await db.refresh(result)
            return result

        vitals = (await db.execute(
            select(VitalMeasurement)
            .where(VitalMeasurement.user_id == user_id, VitalMeasurement.is_deleted.is_(False))
            .order_by(desc(VitalMeasurement.measured_at))
            .limit(100)
        )).scalars().all()
        histories = (await db.execute(
            select(MedicalHistory).where(MedicalHistory.user_id == user_id, MedicalHistory.is_active.is_(True))
        )).scalars().all()
        family = (await db.execute(select(FamilyHistory).where(FamilyHistory.user_id == user_id))).scalars().all()
        profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))).scalar_one_or_none()
        lifestyle = (await db.execute(
            select(LifestyleLog).where(LifestyleLog.user_id == user_id).order_by(desc(LifestyleLog.logged_date)).limit(30)
        )).scalars().all()
        labs = (await db.execute(
            select(BloodReportResult)
            .join(BloodReport, BloodReport.id == BloodReportResult.report_id)
            .where(BloodReportResult.user_confirmed.is_(True), BloodReport.user_id == user_id)
            .order_by(desc(BloodReportResult.created_at)).limit(30)
        )).scalars().all()

        missing: List[str] = []
        uncertainty: List[str] = []
        score = 0
        bp = [v for v in vitals if v.measurement_type == "blood_pressure"]
        hr = [v for v in vitals if v.measurement_type == "heart_rate"]
        if not bp:
            missing.append("blood_pressure_history")
        if not hr:
            missing.append("heart_rate_history")
        for reading in bp[:5]:
            observations.append({"name": "blood pressure", "value": f"{reading.value_primary}/{reading.value_secondary}", "measured_at": reading.measured_at.isoformat(), "source": reading.source})
        if len(bp) >= 3 and sum(x.value_primary >= 140 or (x.value_secondary or 0) >= 90 for x in bp[:5]) >= 3:
            score += 2
            observations.append({"name": "blood pressure trend", "value": "repeatedly elevated", "source": "vital history"})
        if len(hr) >= 3 and all(x.value_primary > 100 for x in hr[:3]):
            score += 1
            observations.append({"name": "heart rate trend", "value": "repeatedly elevated", "source": "vital history"})
        for item in histories + family:
            label = getattr(item, "condition_name", "family cardiovascular history")
            observations.append({"name": "medical history", "value": label, "source": "patient record"})
            if any(term in label.lower() for term in ("hypertension", "diabetes", "coronary", "stroke", "heart")):
                score += 1
        if data.get("smoker") is True or data.get("diabetes") is True:
            score += 1
        if not profile and not data.get("age"):
            missing.append("age")
        if not labs:
            missing.append("confirmed_laboratory_results")
            uncertainty.append("No confirmed laboratory report results were available.")
        for lab in labs[:10]:
            observations.append({"name": lab.test_name, "value": lab.value_numeric, "unit": lab.unit, "source_page": lab.source_page, "confidence": lab.extraction_confidence})
            if lab.flag in ("HIGH", "CRITICAL"):
                score += 1
        if not lifestyle:
            missing.append("daily_habits")
        classification = "higher_attention" if score >= 3 else "routine_prevention"
        recommendations = [
            "Discuss this prevention-oriented assessment with a qualified clinician.",
            "Continue recording rested blood pressure and heart rate with measurement timestamps.",
        ]
        if missing:
            uncertainty.append("The result is incomplete because some longitudinal inputs are missing.")
        result = self._record(user_id, "longitudinal_risk", classification, observations, data,
                              "limited" if missing else "adequate", missing, uncertainty, recommendations, [])
        db.add(result)
        await db.commit()
        await db.refresh(result)
        return result

    @staticmethod
    def _record(user_id: str, kind: str, classification: str, observations: List[Dict[str, Any]],
                snapshot: Dict[str, Any], quality: str, missing: List[str], uncertainty: List[str],
                recommendations: List[str], emergency_guidance: List[str]) -> CardiovascularAssessment:
        return CardiovascularAssessment(
            user_id=user_id, assessment_kind=kind, classification=classification,
            observations_considered=observations, input_snapshot=snapshot,
            data_quality=quality, missing_inputs=missing, uncertainty=uncertainty,
            recommendations=recommendations, emergency_guidance=emergency_guidance,
        )
