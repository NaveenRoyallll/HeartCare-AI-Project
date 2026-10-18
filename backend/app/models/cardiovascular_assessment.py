"""Unified cardiovascular assessment audit model."""
from datetime import datetime
from typing import Any, Dict, List
from uuid import uuid4

from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CardiovascularAssessment(Base):
    """Traceable result combining acute triage and longitudinal observations."""

    __tablename__ = "cardiovascular_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    assessment_kind: Mapped[str] = mapped_column(String(30), nullable=False)
    classification: Mapped[str] = mapped_column(String(50), nullable=False)
    observations_considered: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    data_quality: Mapped[str] = mapped_column(String(30), nullable=False)
    missing_inputs: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    uncertainty: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    recommendations: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    emergency_guidance: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
