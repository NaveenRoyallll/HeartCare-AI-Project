"""Cardiovascular risk assessment SQLAlchemy model."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from sqlalchemy import String, DateTime, Float, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class RiskAssessment(Base):
    """Calculated cardiovascular risk assessment record."""
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(100), default="framingham_2008", nullable=False)
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    calculation_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Percentage 0-100%
    risk_category: Mapped[str] = mapped_column(String(50), nullable=False)  # low, moderate, high, indeterminate
    limitations: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    recommendations: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    missing_inputs: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
