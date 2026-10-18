"""Lifestyle tracking and goals SQLAlchemy models."""
from datetime import datetime, date
from typing import Any, Dict, Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, DateTime, Date, Float, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class LifestyleLog(Base):
    """Daily lifestyle logs (physical activity, sleep, diet, stress)."""
    __tablename__ = "lifestyle_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    log_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # activity, sleep, diet, stress, hydration
    value_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # e.g., steps, hours of sleep, calories
    unit: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # steps, hours, kcal
    details_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logged_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LifestyleGoal(Base):
    """Cardiovascular wellness goals set by patients or clinicians."""
    __tablename__ = "lifestyle_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # daily_steps, sleep_hours, sodium_intake_mg
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    period: Mapped[str] = mapped_column(String(20), default="daily", nullable=False)  # daily, weekly
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
