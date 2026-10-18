"""Medical and Family History SQLAlchemy models."""
from datetime import datetime, date
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, Date, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MedicalHistory(Base):
    """Past and current medical conditions for a patient."""
    __tablename__ = "medical_histories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    condition_name: Mapped[str] = mapped_column(String(255), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    diagnosis_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class FamilyHistory(Base):
    """Hereditary and familial cardiovascular conditions."""
    __tablename__ = "family_histories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    relative_relation: Mapped[str] = mapped_column(String(50), nullable=False)  # father, mother, sibling, grandparent
    condition_name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., CAD, hypertension, stroke
    onset_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
