"""CardioGuard AI Health Assistant agent orchestrating safety guardrails, RAG, and LLMs."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import os
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from ai.health_assistant.rag.retrieval import DocumentRetriever, SimpleRetriever
from ai.health_assistant.safety import (
    EmergencyKeywordDetector,
    SafetyCheckResult,
    SafetyFilter,
)

logger = logging.getLogger(__name__)


@dataclass
class AssistantMessage:
    role: str  # 'system', 'user', 'assistant'
    content: str


@dataclass
class AssistantResponse:
    reply: str
    is_emergency: bool = False
    emergency_symptoms_detected: List[str] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    safety_violations: List[str] = field(default_factory=list)
    requires_doctor_visit: bool = False


class LLMProvider(ABC):
    """Abstract interface for LLM client backends (OpenAI, Anthropic, Google Gemini, Ollama, etc.)."""

    @abstractmethod
    def generate(self, messages: List[AssistantMessage], temperature: float = 0.2) -> str:
        """Generate response text from message conversation thread."""
        pass


class MockFallbackLLM(LLMProvider):
    """Safe offline rule-based fallback provider when no external LLM API key is present."""

    def generate(self, messages: List[AssistantMessage], temperature: float = 0.2) -> str:
        last_user_msg = next((m.content for m in reversed(messages) if m.role == "user"), "")
        lower = last_user_msg.lower()

        if "bp" in lower or "blood pressure" in lower:
            return (
                "Blood pressure readings represent systolic over diastolic pressure (mmHg). "
                "Healthy targets vary individually, but levels consistently above 130/80 mmHg warrant clinical discussion. "
                "Logging your readings twice daily can provide your physician with accurate trends."
            )
        elif "cholesterol" in lower or "lipid" in lower:
            return (
                "Lipid profiles typically measure Total Cholesterol, HDL ('good' cholesterol), LDL ('bad' cholesterol), and Triglycerides. "
                "In South Asian populations, apolipoproteins and Lipoprotein(a) are also informative markers. "
                "Consult your doctor for an individualized risk evaluation."
            )
        elif "exercise" in lower or "diet" in lower or "lifestyle" in lower:
            return (
                "The American Heart Association and cardiology societies recommend at least 150 minutes of moderate aerobic exercise "
                "weekly, combined with a nutrient-dense diet emphasizing vegetables, whole grains, and lean proteins, while avoiding tobacco."
            )
        else:
            return (
                "CardioGuard AI is here to help you understand cardiovascular concepts, trends, and lifestyle considerations. "
                "Please describe any specific cardiovascular measurements or concepts you would like to explore."
            )


class HealthAssistant:
    """Clinical health education assistant with strict safety guardrails and emergency pre-checks."""

    def __init__(
        self,
        llm_provider: Optional[LLMProvider] = None,
        retriever: Optional[DocumentRetriever] = None,
        prompts_dir: Optional[str] = None,
        max_history_turns: int = 10,
    ):
        self.llm = llm_provider or MockFallbackLLM()
        self.retriever = retriever or SimpleRetriever()
        self.max_history_turns = max_history_turns
        self.emergency_detector = EmergencyKeywordDetector()
        self.safety_filter = SafetyFilter()

        # Load prompts
        self.prompts_dir = prompts_dir or str(Path(__file__).parent / "prompts")
        self.system_prompt = self._load_prompt("system.txt", fallback="You are a health education assistant.")
        self.safety_prompt = self._load_prompt("safety.txt", fallback="EMERGENCY OVERRIDE RULES APPLY.")
        self.emergency_template = self._load_prompt(
            "emergency.txt",
            fallback=(
                "🚨 IMPORTANT: Your symptoms may indicate a medical emergency.\n\n"
                "1. CALL 112 (Emergency Services) IMMEDIATELY\n"
                "2. Do NOT drive yourself — have someone drive you or wait for an ambulance\n"
                "3. Stop exertion, sit in a comfortable supported position, and stay with the person\n"
                "4. Do not give food, drink, or unprescribed medication; follow dispatcher instructions\n"
                "5. If unresponsive and not breathing normally or only gasping, call 112, start CPR as directed, and use an AED if available\n"
                "6. If unconscious but breathing normally, monitor breathing and give nothing by mouth\n\n"
                "This app CANNOT diagnose whether you are having a heart attack. Only emergency medical professionals can make that determination.\n\n"
                "Do NOT wait for any app result, score, or analysis before calling for help."
            ),
        )

        self.history: List[AssistantMessage] = []

    def _load_prompt(self, filename: str, fallback: str) -> str:
        path = os.path.join(self.prompts_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception:
                return fallback
        return fallback

    def clear_history(self) -> None:
        """Clear conversation history."""
        self.history.clear()

    def process_query(
        self,
        user_query: str,
        patient_context: Optional[Dict[str, Any]] = None,
    ) -> AssistantResponse:
        """Process user message through safety checks, retrieval, and response validation."""
        # 1. CRITICAL EMERGENCY PRE-CHECK (executed BEFORE LLM call)
        is_emergency, symptoms = self.emergency_detector.detect(user_query)
        if is_emergency:
            # Under NO circumstance is LLM invoked or normal vitals allowed to dismiss emergency symptoms
            return AssistantResponse(
                reply=self.emergency_template,
                is_emergency=True,
                emergency_symptoms_detected=symptoms,
                sources=["Emergency Medicine Protocol (112 Emergency Guidelines)"],
                requires_doctor_visit=True,
            )

        # 2. Retrieve relevant educational literature (RAG)
        retrieved_docs = self.retriever.retrieve(user_query, top_k=2)
        sources = [d.source for d in retrieved_docs if d.source]

        rag_context_str = ""
        if retrieved_docs:
            rag_context_str = "\n\nRelevant Educational Knowledge:\n" + "\n---\n".join(
                f"[{d.title}]: {d.content}" for d in retrieved_docs
            )

        # 3. Patient authorized metrics context (read-only)
        vitals_context_str = ""
        if patient_context:
            vitals_context_str = "\n\nUser's Logged Health Metrics:\n" + ", ".join(
                f"{k}: {v}" for k, v in patient_context.items() if v is not None
            )

        # 4. Construct message thread for LLM
        system_instruction = (
            f"{self.system_prompt}\n\n{self.safety_prompt}"
            f"{rag_context_str}"
            f"{vitals_context_str}"
        )

        messages: List[AssistantMessage] = [
            AssistantMessage(role="system", content=system_instruction)
        ]

        # Add recent conversation turns
        recent_history = self.history[-self.max_history_turns :]
        messages.extend(recent_history)
        messages.append(AssistantMessage(role="user", content=user_query))

        # 5. Invoke LLM provider
        try:
            raw_response = self.llm.generate(messages)
        except Exception:
            logger.warning("Health assistant provider failed; returning safe outage response", exc_info=True)
            outage_reply = (
                "The health assistant is temporarily unavailable. "
                "I cannot safely analyze this request right now. "
                "For urgent or worsening symptoms, call emergency services immediately. "
                "For non-urgent questions, try again later or contact a qualified healthcare professional.\n\n"
                f"{self.safety_filter.MANDATORY_DISCLAIMER}"
            )
            return AssistantResponse(
                reply=outage_reply,
                sources=sources,
                requires_doctor_visit=True,
            )

        # 6. SAFETY FILTER POST-CHECK (validates LLM generated content)
        safety_check: SafetyCheckResult = self.safety_filter.validate_response(
            raw_response, user_prompt=user_query
        )

        final_reply = safety_check.sanitized_text or raw_response
        violation_names = [v.value for v in safety_check.violations]

        # Append to conversational history
        self.history.append(AssistantMessage(role="user", content=user_query))
        self.history.append(AssistantMessage(role="assistant", content=final_reply))

        return AssistantResponse(
            reply=final_reply,
            is_emergency=False,
            emergency_symptoms_detected=[],
            sources=sources,
            safety_violations=violation_names,
            requires_doctor_visit=len(violation_names) > 0,
        )
