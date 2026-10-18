"""Deterministic clinical safety rules and physiological danger thresholds.

SAFETY INVARIANT:
Emergency determinations are deterministic and rule-based.
AI models MUST NEVER override a safety threshold alert or reassure a patient
experiencing acute coronary syndrome or hypertensive crisis symptoms.
"""
from typing import Any, Dict, List, Optional, Tuple

SAFETY_RULES_VERSION = "2026.1.0"

# Physiological Danger Thresholds
# Source: AHA/ACC Guidelines for Hypertensive Crises, Advanced Cardiovascular Life Support (ACLS)
VITAL_DANGER_THRESHOLDS = {
    "blood_pressure": {
        "systolic_emergency_high": 180.0,
        "systolic_emergency_low": 70.0,
        "diastolic_emergency_high": 120.0,
        "diastolic_emergency_low": 40.0,
        "systolic_urgent_high": 160.0,
        "systolic_urgent_low": 90.0,
    },
    "heart_rate": {
        "emergency_high": 150.0,   # Unstable tachycardia risk
        "emergency_low": 40.0,     # Symptomatic bradycardia risk
        "urgent_high": 120.0,
        "urgent_low": 50.0,
    },
    "spo2": {
        "emergency_low": 90.0,     # Severe hypoxemia
        "urgent_low": 93.0,
    },
    "blood_glucose": {
        "emergency_low": 54.0,     # Severe hypoglycemia / neuroglycopenia
        "emergency_high": 350.0,   # Diabetic ketoacidosis / HHS risk
        "urgent_low": 70.0,
        "urgent_high": 250.0,
    },
    "temperature": {
        "emergency_high": 40.5,    # Hyperpyrexia
        "emergency_low": 35.0,     # Hypothermia
    }
}

# Red Flag Cardiovascular Emergency Symptoms (Case-insensitive matching)
EMERGENCY_SYMPTOM_KEYWORDS = [
    "chest pain",
    "chest pressure",
    "chest tightness",
    "crushing pain",
    "pain radiating to arm",
    "pain radiating to left arm",
    "pain radiating to jaw",
    "pain radiating to back",
    "pain radiating to neck",
    "severe shortness of breath",
    "difficulty breathing",
    "loss of consciousness",
    "syncope",
    "fainted",
    "passed out",
    "sudden numbness",
    "sudden weakness on one side",
    "sudden slurred speech",
    "coughing pink frothy sputum",
    "severe sudden dizziness",
]

URGENT_SYMPTOM_KEYWORDS = [
    "palpitations",
    "fluttering heart",
    "rapid heartbeat",
    "racing heart",
    "mild shortness of breath",
    "ankle swelling",
    "bilateral leg swelling",
    "persistent dizziness",
    "unexplained fatigue",
]


class ClinicalSafetyChecker:
    """Evaluates vitals and symptoms against clinical safety invariants."""
    VERSION = SAFETY_RULES_VERSION

    @classmethod
    def evaluate_vitals(
        cls,
        measurement_type: str,
        value_primary: float,
        value_secondary: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Check if a measured vital sign violates critical or urgent danger thresholds."""
        res = {
            "status": "NORMAL",
            "is_emergency": False,
            "is_urgent": False,
            "alerts": [],
            "rule_version": cls.VERSION,
        }

        meas = measurement_type.strip().lower()

        if meas == "blood_pressure":
            sbp = value_primary
            dbp = value_secondary
            thresh = VITAL_DANGER_THRESHOLDS["blood_pressure"]

            if sbp >= thresh["systolic_emergency_high"] or (dbp is not None and dbp >= thresh["diastolic_emergency_high"]):
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Hypertensive Crisis threshold exceeded: SBP {sbp} / DBP {dbp} mmHg")
            elif sbp <= thresh["systolic_emergency_low"] or (dbp is not None and dbp <= thresh["diastolic_emergency_low"]):
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Severe Hypotension / Shock threshold detected: SBP {sbp} / DBP {dbp} mmHg")
            elif sbp >= thresh["systolic_urgent_high"]:
                res["status"] = "URGENT"
                res["is_urgent"] = True
                res["alerts"].append(f"Stage 2 Hypertension detected: SBP {sbp} mmHg")

        elif meas == "heart_rate":
            hr = value_primary
            thresh = VITAL_DANGER_THRESHOLDS["heart_rate"]
            if hr >= thresh["emergency_high"]:
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Severe Tachycardia danger: {hr} bpm")
            elif hr <= thresh["emergency_low"]:
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Severe Bradycardia danger: {hr} bpm")
            elif hr >= thresh["urgent_high"]:
                res["status"] = "URGENT"
                res["is_urgent"] = True
                res["alerts"].append(f"Elevated resting heart rate: {hr} bpm")

        elif meas == "spo2":
            spo2 = value_primary
            thresh = VITAL_DANGER_THRESHOLDS["spo2"]
            if spo2 < thresh["emergency_low"]:
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Critical Hypoxemia: SpO2 {spo2}%")
            elif spo2 < thresh["urgent_low"]:
                res["status"] = "URGENT"
                res["is_urgent"] = True
                res["alerts"].append(f"Low Oxygen Saturation: SpO2 {spo2}%")

        elif meas == "blood_glucose":
            bg = value_primary
            thresh = VITAL_DANGER_THRESHOLDS["blood_glucose"]
            if bg <= thresh["emergency_low"]:
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Severe Hypoglycemia hazard: {bg} mg/dL")
            elif bg >= thresh["emergency_high"]:
                res["status"] = "EMERGENCY"
                res["is_emergency"] = True
                res["alerts"].append(f"Severe Hyperglycemia hazard: {bg} mg/dL")

        return res

    @classmethod
    def evaluate_symptoms(cls, symptoms: List[str]) -> Tuple[str, List[str]]:
        """Classify a list of reported symptoms into severity tiers."""
        detected_emergencies = []
        detected_urgents = []

        for s in symptoms:
            s_lower = s.lower().strip()
            for kw in EMERGENCY_SYMPTOM_KEYWORDS:
                if kw in s_lower:
                    detected_emergencies.append(kw)
            for kw in URGENT_SYMPTOM_KEYWORDS:
                if kw in s_lower:
                    detected_urgents.append(kw)

        if detected_emergencies:
            return "EMERGENCY", list(set(detected_emergencies))
        if detected_urgents:
            return "URGENT", list(set(detected_urgents))
        if symptoms:
            return "MONITOR", symptoms
        return "INFORMATION", []
