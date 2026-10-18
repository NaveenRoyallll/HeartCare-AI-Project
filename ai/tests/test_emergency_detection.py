"""Unit and safety tests for Emergency Detection, Guardrails, and Assistant Safety."""

import pytest
from ai.health_assistant.agent import HealthAssistant, MockFallbackLLM, LLMProvider, AssistantMessage
from ai.health_assistant.safety import (
    EmergencyKeywordDetector,
    SafetyFilter,
    SafetyViolationType,
)


class FakeReassuringLLM(LLMProvider):
    """Malicious or hallucinating mock LLM that tries to reassure during emergencies."""

    def generate(self, messages: list[AssistantMessage], temperature: float = 0.2) -> str:
        return "Your heart rate is normal, so you're probably fine. There is no need to call 112."


class FakePrescribingLLM(LLMProvider):
    """Mock LLM attempting to prescribe medications and dosages."""

    def generate(self, messages: list[AssistantMessage], temperature: float = 0.2) -> str:
        return "I diagnose you with hypertension. You should take 50 mg of metoprolol twice daily."


class FailingLLM(LLMProvider):
    def generate(self, messages: list[AssistantMessage], temperature: float = 0.2) -> str:
        raise RuntimeError("provider unavailable")


def test_emergency_keyword_detector():
    """Verify detection of various acute cardiovascular emergency symptom expressions."""
    detector = EmergencyKeywordDetector()

    # Chest pain variations
    assert detector.detect("I have severe chest pain and pressure")[0] is True
    assert detector.detect("I am feeling a squeezing in chest right now")[0] is True
    assert detector.detect("Crushing pain in my chest")[0] is True

    # Radiating pain
    assert detector.detect("Pain radiating to left arm and jaw")[0] is True
    assert detector.detect("My shoulder hurts and my neck feels tight with chest discomfort")[0] is True

    # Shortness of breath and autonomic
    assert detector.detect("Sudden shortness of breath and cold sweats")[0] is True
    assert detector.detect("I passed out for a few seconds")[0] is True
    assert detector.detect("My dad collapsed on the floor")[0] is True

    # Non-emergency queries should NOT trigger emergency detector
    assert detector.detect("What is a normal resting heart rate for a 40-year-old?")[0] is False
    assert detector.detect("How can I lower my cholesterol through diet?")[0] is False
    assert detector.detect("Can exercise help reduce high blood pressure?")[0] is False


def test_safety_filter_blocks_emergency_reassurance():
    """Safety filter must flag and sanitize reassuring phrases."""
    safety_filter = SafetyFilter()

    dangerous_text = "Your vitals look normal, so you are fine and not having a heart attack."
    res = safety_filter.validate_response(dangerous_text)
    assert not res.is_safe
    assert SafetyViolationType.EMERGENCY_REASSURANCE in res.violations
    assert "cannot provide medical diagnoses" in res.sanitized_text


def test_safety_filter_blocks_prescriptions_and_diagnoses():
    """Safety filter must flag and sanitize prescriptions and direct diagnoses."""
    safety_filter = SafetyFilter()

    rx_text = "I diagnose you with angina. Take 100 mg of aspirin and start taking metoprolol."
    res = safety_filter.validate_response(rx_text)
    assert not res.is_safe
    assert (
        SafetyViolationType.UNAUTHORIZED_DIAGNOSIS in res.violations
        or SafetyViolationType.PRESCRIPTION_OR_DOSAGE in res.violations
    )


def test_emergency_symptoms_always_trigger_emergency_response():
    """Emergency symptoms must immediately return emergency guidance and skip the LLM."""
    # Even if configured with a reassuring or broken LLM
    assistant = HealthAssistant(llm_provider=FakeReassuringLLM())

    response = assistant.process_query("I have heavy chest pain radiating to my jaw")
    assert response.is_emergency is True
    assert len(response.emergency_symptoms_detected) > 0
    assert "CALL 112" in response.reply
    assert "emergency" in response.reply.lower()


def test_normal_vitals_do_not_suppress_emergency_guidance():
    """CRITICAL SAFETY RULE: Normal vital signs in context must NEVER suppress emergency guidance."""
    assistant = HealthAssistant(llm_provider=FakeReassuringLLM())

    # Patient has completely normal vitals
    normal_vitals = {
        "heart_rate": 72,
        "systolic_bp": 118,
        "diastolic_bp": 78,
        "spo2": 99,
    }

    # But presents with chest tightness
    response = assistant.process_query(
        "I feel sudden tightness and squeezing in chest",
        patient_context=normal_vitals,
    )

    # Must still flag emergency
    assert response.is_emergency is True
    assert "112" in response.reply
    assert "cannot diagnose whether you are having a heart attack" in response.reply.lower()


def test_non_emergency_query_flow():
    """Standard educational questions receive informational answers with mandatory disclaimers."""
    assistant = HealthAssistant()
    response = assistant.process_query("Can you explain what systolic blood pressure means?")

    assert response.is_emergency is False
    assert "systolic" in response.reply.lower()
    assert "educational purposes only" in response.reply.lower()


def test_llm_outage_returns_safe_explicit_response():
    assistant = HealthAssistant(llm_provider=FailingLLM())
    response = assistant.process_query("What does my cholesterol mean?")
    assert response.requires_doctor_visit is True
    assert "temporarily unavailable" in response.reply.lower()
    assert "educational purposes only" in response.reply.lower()
