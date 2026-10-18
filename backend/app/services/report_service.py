"""Blood diagnostic report upload and biomarker extraction service."""
import os
import re
import aiofiles
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.blood_report import BloodReport, BloodReportResult

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
}

# Standard cardiovascular lab biomarkers with normal reference ranges
LAB_BIOMARKER_PATTERNS = [
    {
        "name": "Total Cholesterol",
        "code": "2093-3",
        "regex": r"(?:total\s*cholesterol|cholesterol\s*total)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/dL",
        "min": 125.0,
        "max": 200.0,
    },
    {
        "name": "HDL Cholesterol",
        "code": "2085-9",
        "regex": r"(?:hdl\s*cholesterol|hdl)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/dL",
        "min": 40.0,
        "max": 60.0,
    },
    {
        "name": "LDL Cholesterol",
        "code": "2089-1",
        "regex": r"(?:ldl\s*cholesterol|ldl)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/dL",
        "min": 50.0,
        "max": 100.0,
    },
    {
        "name": "Triglycerides",
        "code": "2571-8",
        "regex": r"(?:triglycerides|tg)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/dL",
        "min": 50.0,
        "max": 150.0,
    },
    {
        "name": "Fasting Blood Glucose",
        "code": "1558-6",
        "regex": r"(?:fasting\s*glucose|fasting\s*blood\s*sugar|fbs)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/dL",
        "min": 70.0,
        "max": 99.0,
    },
    {
        "name": "HbA1c",
        "code": "4548-4",
        "regex": r"(?:hba1c|glycated\s*hemoglobin)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "%",
        "min": 4.0,
        "max": 5.6,
    },
    {
        "name": "High-Sensitivity CRP",
        "code": "30522-7",
        "regex": r"(?:hs-?crp|crp)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "unit": "mg/L",
        "min": 0.0,
        "max": 1.0,
    },
]


class ReportService:
    """Handles diagnostic report file storage and clinical biomarker parsing."""

    @classmethod
    async def process_report_upload(
        cls,
        user_id: str,
        file: UploadFile,
        db: AsyncSession,
    ) -> BloodReport:
        """Validate, persist on disk, and extract biomarkers from an uploaded lab report."""
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{file.content_type}'. Supported: PDF, JPEG, PNG, TXT.",
            )

        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # Read file contents and check size
        content = await file.read()
        file_size = len(content)
        max_bytes = settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_SIZE_MB}MB.",
            )

        # Save to disk
        original_name = os.path.basename(file.filename or "uploaded-report")
        safe_filename = f"{uuid4()}_{original_name}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        # Extract text (supports text files directly, fallback mock OCR for binary for testing/dev)
        raw_text = ""
        if file.content_type == "text/plain":
            raw_text = content.decode("utf-8", errors="ignore")
        else:
            # Binary reports require a reviewed OCR/parser integration. Never
            # fabricate clinical values when that service is unavailable.
            raw_text = None

        # Save BloodReport model
        report = BloodReport(
            user_id=user_id,
            file_name=file.filename or "unknown",
            file_path=file_path,
            file_size_bytes=file_size,
            mime_type=file.content_type,
            report_date=datetime.now().date(),
            lab_name="Diagnostic Pathology Lab",
            processing_status="completed" if raw_text is not None else "pending_manual_review",
            raw_text=raw_text,
        )
        db.add(report)
        await db.flush()

        # Extract biomarkers using regex rules
        if raw_text is not None:
            cls._extract_biomarkers(report.id, raw_text, db)

        await db.commit()
        await db.refresh(report)
        return report

    @classmethod
    def _extract_biomarkers(cls, report_id: str, text: str, db: AsyncSession) -> None:
        """Parse structured lab biomarkers from report text."""
        for pattern in LAB_BIOMARKER_PATTERNS:
            match = re.search(pattern["regex"], text, re.IGNORECASE)
            if match:
                val = float(match.group(1))
                min_r = pattern["min"]
                max_r = pattern["max"]

                flag = "NORMAL"
                if min_r is not None and val < min_r:
                    flag = "LOW"
                elif max_r is not None and val > max_r:
                    flag = "HIGH"

                result_item = BloodReportResult(
                    report_id=report_id,
                    test_name=pattern["name"],
                    test_code=pattern["code"],
                    value_numeric=val,
                    value_text=str(val),
                    unit=pattern["unit"],
                    reference_range_min=min_r,
                    reference_range_max=max_r,
                    flag=flag,
                    source_excerpt=match.group(0),
                    extraction_confidence=0.85,
                    source_page=None,
                    user_confirmed=False,
                )
                db.add(result_item)
