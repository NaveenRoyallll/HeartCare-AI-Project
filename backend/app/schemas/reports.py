"""Blood lab report and extraction schemas."""
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


class BloodReportResultResponse(BaseModel):
    id: str
    report_id: str
    test_name: str
    test_code: Optional[str] = None
    value_numeric: Optional[float] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    reference_range_min: Optional[float] = None
    reference_range_max: Optional[float] = None
    flag: Optional[str] = None
    source_excerpt: Optional[str] = None
    extraction_confidence: Optional[float] = None
    source_page: Optional[int] = None
    user_confirmed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class BloodReportResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    report_date: Optional[date] = None
    lab_name: Optional[str] = None
    processing_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BloodReportDetailResponse(BloodReportResponse):
    raw_text: Optional[str] = None
    results: List[BloodReportResultResponse] = []


class BloodReportUploadResponse(BaseModel):
    report_id: str
    file_name: str
    status: str
    message: str
    results_extracted: int


class BloodReportResultConfirmation(BaseModel):
    confirmed: bool = Field(..., description="Whether the user or clinician confirmed the extracted value")
