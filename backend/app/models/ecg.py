"""ECG Record and Analysis Result models."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from sqlalchemy import String, Integer, Float, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ECGRecord(Base):
    """Raw or digital ECG recording file tracking."""
    __tablename__ = "ecg_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    recording_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sample_rate: Mapped[Optional[int]] = mapped_column(Integer, default=500, nullable=True)  # Hz
    lead_count: Mapped[Optional[int]] = mapped_column(Integer, default=12, nullable=True)
    source_device: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ECGAnalysisResult(Base):
    """Extracted electrical metrics and diagnostic rhythm interpretations."""
    __tablename__ = "ecg_analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ecg_record_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # bpm
    rhythm_classification: Mapped[str] = mapped_column(String(100), nullable=False)  # Normal Sinus, Afib, etc.
    pr_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qrs_duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qt_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qtc_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    abnormalities_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
