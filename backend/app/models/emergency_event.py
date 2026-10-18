"""Emergency event auditing and emergency contacts models."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class EmergencyEvent(Base):
    """Log of urgent symptoms and emergency protocol triggers."""
    __tablename__ = "emergency_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), default="symptom_alert", nullable=False)
    severity_level: Mapped[str] = mapped_column(String(50), nullable=False)  # EMERGENCY, URGENT, MONITOR, INFORMATION
    symptoms_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    guidance_provided: Mapped[str] = mapped_column(Text, nullable=False)
    contacts_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ambulance_called: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmergencyContact(Base):
    """Emergency contacts linked to a patient."""
    __tablename__ = "emergency_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    relationship: Mapped[str] = mapped_column(String(100), nullable=False)  # spouse, parent, child, friend, doctor
    phone_number: Mapped[str] = mapped_column(String(25), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
