"""Medication, schedule, and adherence log models."""
from datetime import datetime, date, time
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, Date, Time, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Medication(Base):
    """Prescribed cardiovascular and general medications."""
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 5mg, 100mg
    form: Mapped[str] = mapped_column(String(50), default="tablet", nullable=False)  # tablet, capsule, injection, drops
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)  # once_daily, twice_daily, as_needed
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # with food, before sleep
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class MedicationSchedule(Base):
    """Reminders and administration timetable for medications."""
    __tablename__ = "medication_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    medication_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    reminder_time: Mapped[time] = mapped_column(Time, nullable=False)  # e.g., 08:00:00
    day_of_week: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # all, mon,tue...
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MedicationLog(Base):
    """Adherence confirmation records for individual medication doses."""
    __tablename__ = "medication_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    medication_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    taken_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="taken", nullable=False)  # taken, skipped, missed
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
