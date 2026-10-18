"""Clinical rules engine enforcing safety-first processing over AI models."""
from typing import Any, Dict, List, Optional
from app.clinical.safety_checks import ClinicalSafetyChecker
from app.core.config import settings


class ClinicalRulesEngine:
    """Deterministic clinical rule executor.
    
    Ensures that physiological danger alerts, acute coronary symptom patterns,
    and hypertensive crises bypass or strictly gate downstream AI processing.
    """

    def __init__(self):
        self.checker = ClinicalSafetyChecker()

    def evaluate_patient_status(
        self,
        symptoms: Optional[List[str]] = None,
        vitals: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Evaluate combined symptoms and vital measurements to determine safety gating."""
        emergency_flags: List[str] = []
        urgent_flags: List[str] = []
        guidance_instructions: List[str] = []

        # 1. Evaluate symptoms
        if symptoms:
            severity, detected = self.checker.evaluate_symptoms(symptoms)
            if severity == "EMERGENCY":
                emergency_flags.extend([f"Critical Symptom: {s}" for s in detected])
            elif severity == "URGENT":
                urgent_flags.extend([f"Urgent Symptom: {s}" for s in detected])

        # 2. Evaluate all submitted vitals
        if vitals:
            for v in vitals:
                m_type = v.get("measurement_type", "")
                val_prim = float(v.get("value_primary", 0.0))
                val_sec = float(v["value_secondary"]) if v.get("value_secondary") is not None else None
                eval_res = self.checker.evaluate_vitals(m_type, val_prim, val_sec)

                if eval_res["is_emergency"]:
                    emergency_flags.extend(eval_res["alerts"])
                elif eval_res["is_urgent"]:
                    urgent_flags.extend(eval_res["alerts"])

        # 3. Determine overall tier and action plan
        if emergency_flags:
            classification = "EMERGENCY"
            guidance_instructions = [
                f"Call {settings.EMERGENCY_NUMBER} ({settings.EMERGENCY_NUMBER_LABEL}) immediately or proceed to the nearest emergency room.",
                "Do NOT drive yourself. Request an ambulance.",
                "Sit upright in a comfortable position and loosen tight clothing.",
                "Chew an aspirin (300mg) if advised by emergency services and not allergic.",
                "Avoid exertion and stay accompanied while awaiting paramedics."
            ]
            block_ai = True
        elif urgent_flags:
            classification = "URGENT"
            guidance_instructions = [
                "Contact your cardiologist, primary healthcare physician, or urgent care clinic promptly today.",
                "Re-check vitals in 15-30 minutes while resting quietly.",
                "If symptoms intensify or you develop chest pain/dyspnea, escalate to calling emergency services immediately."
            ]
            block_ai = False
        else:
            classification = "MONITOR"
            guidance_instructions = [
                "No emergency trigger was identified by these deterministic rules.",
                "This does not rule out a serious condition, especially if symptoms are new, worsening, or concerning.",
                "Seek prompt medical advice for persistent or unexplained symptoms and call emergency services if they worsen."
            ]
            block_ai = False

        return {
            "classification": classification,
            "block_ai_reassurance": block_ai,
            "emergency_flags": emergency_flags,
            "urgent_flags": urgent_flags,
            "guidance_instructions": guidance_instructions,
            "emergency_number": settings.EMERGENCY_NUMBER,
            "emergency_number_label": settings.EMERGENCY_NUMBER_LABEL,
            "rule_version": self.checker.VERSION,
        }
