"""RAG (Retrieval-Augmented Generation) package for clinical education."""

from ai.health_assistant.rag.retrieval import (
    DocumentRetriever,
    SimpleRetriever,
    RetrievedDocument,
)

__all__ = ["DocumentRetriever", "SimpleRetriever", "RetrievedDocument"]
