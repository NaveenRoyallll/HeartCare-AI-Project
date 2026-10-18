"""Vital signs and physiological measurements model."""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, Float, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class VitalMeasurement(Base):
    """Physiological measurements and vital signs."""
    __tablename__ = "vital_measurements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    # Types: blood_pressure, heart_rate, weight, height, blood_glucose, hba1c,
    # cholesterol_total, cholesterol_ldl, cholesterol_hdl, triglycerides, spo2, temperature
    measurement_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    value_primary: Mapped[float] = mapped_column(Float, nullable=False)
    value_secondary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # e.g., Diastolic for BP
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # mmHg, bpm, kg, cm, mg/dL, %, C
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)  # manual, device, clinician
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
