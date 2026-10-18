"""Blood report upload, listing, details, and deletion endpoints."""
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.blood_report import BloodReport, BloodReportResult
from app.schemas.auth import MessageResponse
from app.schemas.reports import (
    BloodReportResponse,
    BloodReportDetailResponse,
    BloodReportResultResponse,
    BloodReportUploadResponse,
    BloodReportResultConfirmation,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Diagnostic Reports & Biomarkers"])


@router.post("/upload", response_model=BloodReportUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_blood_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload laboratory blood report (PDF, Image, TXT) and automatically extract cardiovascular biomarkers."""
    report = await ReportService.process_report_upload(
        user_id=current_user.id,
        file=file,
        db=db,
    )

    # Count extracted items
    count_q = select(BloodReportResult).where(BloodReportResult.report_id == report.id)
    items = (await db.execute(count_q)).scalars().all()

    return BloodReportUploadResponse(
        report_id=report.id,
        file_name=report.file_name,
        status=report.processing_status,
        message=(
            "Report uploaded and text biomarkers extracted; extracted values require "
            "user or clinician confirmation."
            if items
            else (
                f"Report uploaded. {report.processing_error}"
                if report.processing_error
                else "Report uploaded. No validated structured values were extracted; manual review is required."
            )
        ),
        results_extracted=len(items),
    )


@router.get("/", response_model=List[BloodReportResponse])
async def list_reports(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all uploaded diagnostic reports for current patient."""
    q = (
        select(BloodReport)
        .where(BloodReport.user_id == current_user.id)
        .order_by(desc(BloodReport.created_at))
    )
    return (await db.execute(q)).scalars().all()


@router.get("/{report_id}", response_model=BloodReportDetailResponse)
async def get_report_detail(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full report details including all parsed test biomarkers."""
    q = select(BloodReport).where(
        BloodReport.id == report_id,
        BloodReport.user_id == current_user.id,
    )
    report = (await db.execute(q)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    res_q = select(BloodReportResult).where(BloodReportResult.report_id == report.id)
    results = (await db.execute(res_q)).scalars().all()

    return BloodReportDetailResponse(
        id=report.id,
        user_id=report.user_id,
        file_name=report.file_name,
        file_size_bytes=report.file_size_bytes,
        mime_type=report.mime_type,
        report_date=report.report_date,
        lab_name=report.lab_name,
        processing_status=report.processing_status,
        processing_error=report.processing_error,
        created_at=report.created_at,
        raw_text=report.raw_text,
        results=[BloodReportResultResponse.model_validate(r) for r in results],
    )


@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report and its extracted biomarker results."""
    q = select(BloodReport).where(
        BloodReport.id == report_id,
        BloodReport.user_id == current_user.id,
    )
    report = (await db.execute(q)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Delete results first
    res_q = select(BloodReportResult).where(BloodReportResult.report_id == report.id)
    results = (await db.execute(res_q)).scalars().all()
    for r in results:
        await db.delete(r)

    await db.delete(report)
    await db.commit()
    return MessageResponse(message="Report deleted successfully")


@router.patch("/{report_id}/results/{result_id}/confirmation", response_model=BloodReportResultResponse)
async def confirm_report_result(
    report_id: str,
    result_id: str,
    data: BloodReportResultConfirmation,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm or reject a parsed value without changing the source extraction."""
    report = (
        await db.execute(
            select(BloodReport).where(
                BloodReport.id == report_id,
                BloodReport.user_id == current_user.id,
            )
        )
    ).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    result = (
        await db.execute(
            select(BloodReportResult).where(
                BloodReportResult.id == result_id,
                BloodReportResult.report_id == report_id,
            )
        )
    ).scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report result not found")

    result.user_confirmed = data.confirmed
    await db.commit()
    await db.refresh(result)
    return result
