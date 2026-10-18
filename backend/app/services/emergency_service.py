"""Emergency symptom triage and deterministic guidance service."""
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.clinical.rules_engine import ClinicalRulesEngine
from app.models.emergency_event import EmergencyEvent
from app.core.config import settings


class EmergencyService:
    """Triage and safety guidance for acute cardiac symptoms."""

    def __init__(self):
        self.rules_engine = ClinicalRulesEngine()

    async def triage_symptoms(
        self,
        symptoms: List[str],
        heart_rate: Optional[float] = None,
        systolic_bp: Optional[float] = None,
        diastolic_bp: Optional[float] = None,
        spo2: Optional[float] = None,
        symptom_severity: Optional[str] = None,
        symptom_duration_minutes: Optional[int] = None,
        symptom_onset: Optional[str] = None,
        symptoms_worsening: Optional[bool] = None,
        user_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """Evaluate symptoms deterministically, enforce emergency guidance, and audit event."""
        vitals_payload: List[Dict[str, Any]] = []
        if systolic_bp is not None:
            vitals_payload.append({
                "measurement_type": "blood_pressure",
                "value_primary": systolic_bp,
                "value_secondary": diastolic_bp,
            })
        if heart_rate is not None:
            vitals_payload.append({
                "measurement_type": "heart_rate",
                "value_primary": heart_rate,
            })
        if spo2 is not None:
            vitals_payload.append({
                "measurement_type": "spo2",
                "value_primary": spo2,
            })

        # Run deterministic clinical evaluation
        eval_result = self.rules_engine.evaluate_patient_status(
            symptoms=symptoms,
            vitals=vitals_payload,
        )

        classification = eval_result["classification"]
        is_life_threatening = classification == "EMERGENCY"
        red_flags = eval_result["emergency_flags"] + eval_result["urgent_flags"]
        instructions = eval_result["guidance_instructions"]

        disclaimer = (
            "SAFETY NOTICE: CardioGuard AI triage guidance is deterministic and designed for safety. "
            "Normal vital signs NEVER rule out acute coronary syndrome or myocardial infarction. "
            "If you suspect an emergency, always call local emergency services immediately."
        )

        logged_event_id: Optional[str] = None
        observations_considered = [f"symptom: {symptom}" for symptom in symptoms]
        if symptom_severity:
            observations_considered.append(f"reported severity: {symptom_severity}")
        if symptom_duration_minutes is not None:
            observations_considered.append(f"reported duration: {symptom_duration_minutes} minutes")
        if symptom_onset:
            observations_considered.append(f"reported onset: {symptom_onset}")
        if symptoms_worsening is not None:
            observations_considered.append(f"reported progression: {'worsening' if symptoms_worsening else 'not worsening'}")
        for label, value, unit in (
            ("heart rate", heart_rate, "bpm"),
            ("systolic blood pressure", systolic_bp, "mmHg"),
            ("diastolic blood pressure", diastolic_bp, "mmHg"),
            ("oxygen saturation", spo2, "%"),
        ):
            if value is not None:
                observations_considered.append(f"{label}: {value} {unit}")

        # Log emergency event to database if authenticated and critical/urgent
        if user_id and db and (is_life_threatening or classification == "URGENT"):
            event = EmergencyEvent(
                user_id=user_id,
                event_type="symptom_triage",
                severity_level=classification,
                symptoms_json=symptoms,
                guidance_provided="\n".join(instructions),
                contacts_notified=False,
                ambulance_called=False,
            )
            db.add(event)
            await db.commit()
            await db.refresh(event)
            logged_event_id = event.id

        return {
            "classification": classification,
            "is_life_threatening": is_life_threatening,
            "primary_instructions": instructions,
            "emergency_number": settings.EMERGENCY_NUMBER,
            "emergency_number_label": settings.EMERGENCY_NUMBER_LABEL,
            "identified_red_flags": red_flags,
            "disclaimer": disclaimer,
            "logged_event_id": logged_event_id,
            "observations_considered": observations_considered,
            "data_quality": "limited" if not symptoms or not observations_considered else "user_reported",
            "limitations": [
                "This is a deterministic safety screen, not a diagnosis or heart-attack prediction.",
                "No ECG, troponin, imaging, physical examination, or continuous monitoring was used.",
                "Normal or missing measurements do not rule out an emergency.",
            ],
        }
