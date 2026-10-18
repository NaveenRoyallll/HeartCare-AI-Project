"""Blood report and extracted diagnostic test results models."""
from datetime import datetime, date
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Integer, Float, Text, Date, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class BloodReport(Base):
    """Uploaded clinical blood and laboratory diagnostic report."""
    __tablename__ = "blood_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), default="application/pdf", nullable=False)
    report_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lab_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    processing_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, completed, failed
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BloodReportResult(Base):
    """Individual biomarker item extracted from a lab report."""
    __tablename__ = "blood_report_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    report_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    test_name: Mapped[str] = mapped_column(String(255), nullable=False)
    test_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # LOINC or local code
    value_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    value_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_range_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reference_range_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    flag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # NORMAL, HIGH, LOW, CRITICAL
    source_excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    user_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
