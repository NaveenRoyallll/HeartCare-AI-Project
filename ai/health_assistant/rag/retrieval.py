"""Document retrieval interfaces and implementations for educational grounding."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import math
import re
from typing import Dict, List, Optional, Set


@dataclass
class RetrievedDocument:
    doc_id: str
    title: str
    content: str
    source: str
    score: float = 0.0
    metadata: Dict[str, str] = field(default_factory=dict)


class DocumentRetriever(ABC):
    """Abstract retrieval contract."""

    @abstractmethod
    def retrieve(self, query: str, top_k: int = 3) -> List[RetrievedDocument]:
        """Retrieve most relevant educational passages for a query."""
        pass


class SimpleRetriever(DocumentRetriever):
    """Keyword & TF-IDF style lexical retriever for cardiovascular educational docs.

    Does not require an external vector database or heavy embedding dependencies.
    """

    def __init__(self, documents: Optional[List[RetrievedDocument]] = None):
        self.documents: List[RetrievedDocument] = documents or []
        if not self.documents:
            self._load_default_educational_corpus()

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", text)]

    def _load_default_educational_corpus(self) -> None:
        """Seed verified educational knowledge passages."""
        default_corpus = [
            RetrievedDocument(
                doc_id="edu_bp_01",
                title="Understanding Blood Pressure Readings",
                content=(
                    "Blood pressure is measured in millimeters of mercury (mmHg) and given as two numbers: "
                    "systolic (pressure during heart contraction) over diastolic (pressure when heart rests). "
                    "Normal resting BP for adults is typically under 120/80 mmHg. "
                    "Persistent levels above 130/80 mmHg indicate hypertension per 2017 ACC/AHA guidelines."
                ),
                source="ACC/AHA 2017 Guidelines for High Blood Pressure in Adults",
            ),
            RetrievedDocument(
                doc_id="edu_chol_02",
                title="Cholesterol Basics and Cardiovascular Risk",
                content=(
                    "Cholesterol is a lipid substance carried by lipoproteins. High-density lipoprotein (HDL) "
                    "is protective and helps remove cholesterol from arteries. Low-density lipoprotein (LDL) "
                    "can build up in arterial walls as plaque (atherosclerosis). "
                    "Lifestyle modifications including reduced saturated fat and physical activity help improve lipid profiles."
                ),
                source="AHA/ACC 2018 Cholesterol Management Guidelines",
            ),
            RetrievedDocument(
                doc_id="edu_south_asian_03",
                title="Cardiovascular Risk Considerations in South Asians",
                content=(
                    "Individuals of South Asian descent (Indian, Pakistani, Bangladeshi, Sri Lankan, Nepali) "
                    "frequently develop coronary artery disease at younger ages and at lower BMI thresholds. "
                    "The INTERHEART study and AHA statements recommend earlier screening (starting at age 20-30), "
                    "using lower BMI cutoffs (overweight >= 23, obese >= 25 kg/m²), and evaluating apolipoproteins and Lp(a)."
                ),
                source="AHA Scientific Statement on ASCVD in South Asians (Circulation 2018)",
            ),
            RetrievedDocument(
                doc_id="edu_lifestyle_04",
                title="Evidence-Based Heart-Healthy Lifestyle Habits",
                content=(
                    "Key foundational habits for cardiovascular health include: "
                    "1) At least 150 minutes per week of moderate-intensity aerobic exercise. "
                    "2) DASH or Mediterranean-style dietary pattern rich in vegetables, legumes, whole grains, and nuts. "
                    "3) Total avoidance of smoking and tobacco products. "
                    "4) Consistent 7-9 hours of restorative sleep per night."
                ),
                source="ACC/AHA Primary Prevention of CVD Guidelines (2019)",
            ),
        ]
        self.documents.extend(default_corpus)

    def add_document(self, doc: RetrievedDocument) -> None:
        self.documents.append(doc)

    def retrieve(self, query: str, top_k: int = 3) -> List[RetrievedDocument]:
        """Rank corpus documents by term overlap and BM25-like scoring."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.documents[:top_k]

        scored: List[Tuple[float, RetrievedDocument]] = []
        for doc in self.documents:
            doc_tokens = self._tokenize(f"{doc.title} {doc.content}")
            if not doc_tokens:
                continue

            score = 0.0
            doc_len = len(doc_tokens)
            for token in query_tokens:
                count = doc_tokens.count(token)
                if count > 0:
                    tf = count / (count + 1.2 * (0.25 + 0.75 * doc_len / 50.0))
                    # Title boost
                    if token in doc.title.lower():
                        tf *= 2.0
                    score += tf

            if score > 0.0:
                scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        results: List[RetrievedDocument] = []
        for s, doc in scored[:top_k]:
            results.append(
                RetrievedDocument(
                    doc_id=doc.doc_id,
                    title=doc.title,
                    content=doc.content,
                    source=doc.source,
                    score=round(s, 4),
                    metadata=doc.metadata,
                )
            )
        return results


class VectorRetriever(DocumentRetriever):
    """Vector database retrieval placeholder for production dense embeddings."""

    def __init__(self, embedding_dimension: int = 768):
        self.embedding_dimension = embedding_dimension

    def retrieve(self, query: str, top_k: int = 3) -> List[RetrievedDocument]:
        # In this research/educational build without external vector store daemon,
        # fallback to simple keyword retrieval
        simple = SimpleRetriever()
        return simple.retrieve(query, top_k=top_k)
