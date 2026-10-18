"""Unified cardiovascular assessment endpoints."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user, get_db
from app.models.cardiovascular_assessment import CardiovascularAssessment
from app.models.user import User
from app.schemas.assessment import (
    CardiovascularAssessmentHistoryResponse,
    CardiovascularAssessmentRequest,
    CardiovascularAssessmentResponse,
)
from app.services.cardiovascular_assessment_service import CardiovascularAssessmentService

router = APIRouter(prefix="/assessments", tags=["Cardiovascular Assessments"])
service = CardiovascularAssessmentService()


@router.post("/evaluate", response_model=CardiovascularAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def evaluate_assessment(
    data: CardiovascularAssessmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.evaluate(current_user.id, data.model_dump(exclude_none=True), db)


@router.get("/history", response_model=CardiovascularAssessmentHistoryResponse)
async def assessment_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    items = (await db.execute(
        select(CardiovascularAssessment)
        .where(CardiovascularAssessment.user_id == current_user.id)
        .order_by(desc(CardiovascularAssessment.created_at)).limit(limit)
    )).scalars().all()
    return {"total": len(items), "items": items}
