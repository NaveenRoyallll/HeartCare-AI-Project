"""Clinical safety filters, emergency keyword detection, and guardrails for CardioGuard AI."""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Set, Tuple


class SafetyViolationType(str, Enum):
    EMERGENCY_REASSURANCE = "emergency_reassurance"
    UNAUTHORIZED_DIAGNOSIS = "unauthorized_diagnosis"
    PRESCRIPTION_OR_DOSAGE = "prescription_or_dosage"
    DELAYING_CARE = "delaying_care"
    FABRICATED_CITATION = "fabricated_citation"


@dataclass
class SafetyCheckResult:
    is_safe: bool
    violations: List[SafetyViolationType] = field(default_factory=list)
    flagged_phrases: List[str] = field(default_factory=list)
    sanitized_text: Optional[str] = None
    action_required: Optional[str] = None


class EmergencyKeywordDetector:
    """Scans user queries or text for cardiovascular emergency symptoms and trigger phrases."""

    EMERGENCY_PATTERNS = [
        # Chest symptoms
        r"\bchest\s*(pain|pressure|tightness|heaviness|discomfort|squeezing|crushing|burning)\b",
        r"\b(squeezing|tightness|pressure|heaviness|discomfort)\s+(in|of)\s+(the\s+)?chest\b",
        r"\bpain\s*in\s*(my\s*)?chest\b",
        r"\bcrushing\s*pain\b",
        # Radiating pain
        r"\b(pain|tingling|numbness)\s*(radiating|spreading)?\s*(to|in)?\s*(the\s*)?(left\s*arm|arm|jaw|neck|back|shoulder)\b",
        r"\bleft\s*arm\s*pain\b",
        r"\bjaw\s*pain\b",
        # Severe shortness of breath
        r"\b(severe|sudden|extreme)\s*(shortness\s*of\s*breath|difficulty\s*breathing|dyspnea)\b",
        r"\bcan('?t|not)\s*breathe\b",
        r"\bgasping\s*for\s*(air|breath)\b",
        # Associated autonomic symptoms
        r"\bcold\s*sweat(s)?\b",
        r"\bprofuse\s*sweating\s*with\b",
        # Syncope and collapse
        r"\b(passed\s*out|fainted|loss\s*of\s*consciousness|blacked\s*out|collapsed)\b",
        r"\bsudden\s*(dizziness|lightheadedness|vertigo)\b",
        # Acute conditions mentioned directly
        r"\b(having\s*a\s*)?heart\s*attack\b",
        r"\bcardiac\s*arrest\b",
        r"\bmyocardial\s*infarction\b",
        # Stroke indicators
        r"\b(face\s*droop(ing)?|slurred\s*speech|sudden\s*weakness|arm\s*weakness)\b",
    ]

    def __init__(self):
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in self.EMERGENCY_PATTERNS]

    def detect(self, user_text: str) -> Tuple[bool, List[str]]:
        """Inspect text for emergency indicators.

        Returns (is_emergency_suspected, matched_terms).
        """
        if not user_text:
            return False, []

        matches: List[str] = []
        for pattern in self.compiled_patterns:
            found = pattern.findall(user_text)
            if found:
                match_objs = pattern.finditer(user_text)
                for m in match_objs:
                    matches.append(m.group(0))

        is_emergency = len(matches) > 0
        return is_emergency, list(set(matches))


class SafetyFilter:
    """Validates and enforces guardrails on AI-generated responses."""

    REASSURANCE_PATTERNS = [
        r"\b(you\s*are|you're)\s*(probably\s*fine|fine|safe|okay|not\s*having\s*a\s*heart\s*attack)\b",
        r"\b(ecg|heart\s*rate|vitals?|readings?)\s*(is|are|look|looks)\s*(normal|fine|good),\s*(so\s*)?(you\s*are\s*fine|no\s*need\s*to\s*worry)\b",
        r"\bnot\s*(an\s*)?emergency\b",
        r"\brules?\s*out\s*(a\s*)?(heart\s*attack|myocardial\s*infarction|acs)\b",
        r"\bno\s*need\s*(to\s*call|for)\s*(112|911|emergency|an?\s*ambulance|a\s*doctor)\b",
        r"\byou\s*can\s*wait\s*(and\s*see|until\s*tomorrow)\b",
    ]

    DIAGNOSTIC_PATTERNS = [
        r"\b(i\s*diagnose\s*you\s*with|you\s*have\s*been\s*diagnosed\s*with)\b",
        r"\byou\s*definitely\s*have\s*(cad|myocardial\s*infarction|angina|heart\s*disease)\b",
        r"\bmy\s*clinical\s*diagnosis\s*is\b",
    ]

    PRESCRIPTION_PATTERNS = [
        r"\b(i\s*prescribe|start\s*taking|stop\s*taking|take\s*\d+\s*(mg|ml|tablets?))\b",
        r"\bincrease\s*your\s*dose\s*to\b",
        r"\bdecrease\s*your\s*dose\s*to\b",
        r"\byou\s*should\s*take\s*(aspirin|metoprolol|atorvastatin|amlodipine|lisinopril|warfarin)\b",
    ]

    MANDATORY_DISCLAIMER = (
        "This information is for educational purposes only. "
        "Consult your healthcare provider for personalized medical advice."
    )

    def __init__(self):
        self.reassurance_regexes = [re.compile(p, re.IGNORECASE) for p in self.REASSURANCE_PATTERNS]
        self.diagnostic_regexes = [re.compile(p, re.IGNORECASE) for p in self.DIAGNOSTIC_PATTERNS]
        self.prescription_regexes = [re.compile(p, re.IGNORECASE) for p in self.PRESCRIPTION_PATTERNS]

    def validate_response(self, text: str, user_prompt: Optional[str] = None) -> SafetyCheckResult:
        """Validate LLM output against safety guardrails."""
        if not text:
            return SafetyCheckResult(is_safe=True, sanitized_text=self.MANDATORY_DISCLAIMER)

        violations: List[SafetyViolationType] = []
        flagged: List[str] = []

        # Check for false emergency reassurance
        for regex in self.reassurance_regexes:
            match = regex.search(text)
            if match:
                violations.append(SafetyViolationType.EMERGENCY_REASSURANCE)
                flagged.append(match.group(0))

        # Check for unauthorized diagnoses
        for regex in self.diagnostic_regexes:
            match = regex.search(text)
            if match:
                violations.append(SafetyViolationType.UNAUTHORIZED_DIAGNOSIS)
                flagged.append(match.group(0))

        # Check for prescription / dosage directives
        for regex in self.prescription_regexes:
            match = regex.search(text)
            if match:
                violations.append(SafetyViolationType.PRESCRIPTION_OR_DOSAGE)
                flagged.append(match.group(0))

        # Check for suspicious or fabricated citations (e.g., placeholder DOIs)
        fake_citation_matches = re.findall(r"doi:\s*10\.\d{4,9}/[^\s]+\b", text, re.IGNORECASE)
        for doi in fake_citation_matches:
            if "example" in doi.lower() or "xxx" in doi.lower() or "0000" in doi.lower():
                violations.append(SafetyViolationType.FABRICATED_CITATION)
                flagged.append(doi)

        is_safe = len(violations) == 0

        # Build sanitized version
        sanitized = text
        if not is_safe:
            # If severe safety rules breached, return safe fallback education template
            action = "Blocked output due to medical safety guardrail violation."
            sanitized = (
                "CardioGuard AI cannot provide medical diagnoses, medication changes, or emergency evaluations. "
                "Please review your symptoms directly with a qualified doctor. "
                f"\n\n{self.MANDATORY_DISCLAIMER}"
            )
        else:
            action = None
            if self.MANDATORY_DISCLAIMER.lower() not in sanitized.lower():
                sanitized = f"{sanitized.strip()}\n\n{self.MANDATORY_DISCLAIMER}"

        return SafetyCheckResult(
            is_safe=is_safe,
            violations=violations,
            flagged_phrases=flagged,
            sanitized_text=sanitized,
            action_required=action,
        )
