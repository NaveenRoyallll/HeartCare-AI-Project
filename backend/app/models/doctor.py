"""Doctor-patient access control and clinical review note models."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from sqlalchemy import String, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class DoctorPatientAccess(Base):
    """Permissions granted by patients to verified healthcare providers."""
    __tablename__ = "doctor_patient_accesses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    doctor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="requested", nullable=False)  # requested, granted, revoked
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    granted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    permissions_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class ClinicalReviewNote(Base):
    """Clinical consultation, diagnostic, or triage notes recorded by doctors."""
    __tablename__ = "clinical_review_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    doctor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    note_type: Mapped[str] = mapped_column(String(50), default="general", nullable=False)  # general, urgent, medication_review, follow_up
    content: Mapped[str] = mapped_column(Text, nullable=False)
    recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
