"""Cardiovascular risk assessment endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.risk_assessment import RiskAssessment
from app.schemas.risk import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskHistoryResponse,
)
from app.services.risk_service import FraminghamRiskService

router = APIRouter(prefix="/risk", tags=["Cardiovascular Risk Assessment"])


@router.post("/assess", response_model=RiskAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def assess_risk(
    data: RiskAssessmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Run Framingham 2008 General Cardiovascular Risk calculation.
    
    If use_latest_vitals=True, autofills missing parameters (such as blood pressure,
    cholesterol values, age, sex) from the patient's existing electronic records.
    """
    raw_inputs = data.model_dump()
    if data.use_latest_vitals:
        snapshot, missing = await FraminghamRiskService.populate_inputs_from_db(
            user_id=current_user.id,
            db=db,
            provided=raw_inputs,
        )
    else:
        snapshot = raw_inputs
        required = ["age", "sex", "total_cholesterol", "hdl_cholesterol", "systolic_bp"]
        missing = [rf for rf in required if snapshot.get(rf) is None]

    limitations = FraminghamRiskService.POPULATION_LIMITATIONS

    if missing:
        risk_score = None
        risk_category = "indeterminate"
        recommendations = [
            f"Please measure or enter your {m.replace('_', ' ')} to compute accurate quantitative risk score."
            for m in missing
        ]
    else:
        try:
            risk_score, risk_category, recommendations = FraminghamRiskService.calculate_score(
                age=float(snapshot["age"]),
                sex=str(snapshot["sex"]),
                total_cholesterol=float(snapshot["total_cholesterol"]),
                hdl_cholesterol=float(snapshot["hdl_cholesterol"]),
                systolic_bp=float(snapshot["systolic_bp"]),
                bp_treated=bool(snapshot.get("bp_treated", False)),
                smoker=bool(snapshot.get("smoker", False)),
                diabetes=bool(snapshot.get("diabetes", False)),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error evaluating risk score: {str(e)}",
            )

    assessment = RiskAssessment(
        user_id=current_user.id,
        assessment_type="framingham_2008",
        input_snapshot=snapshot,
        calculation_version=FraminghamRiskService.CALCULATION_VERSION,
        risk_score=risk_score,
        risk_category=risk_category,
        limitations=limitations,
        recommendations=recommendations,
        missing_inputs=missing,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.get("/history", response_model=RiskHistoryResponse)
async def get_risk_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve historical risk assessments for the patient."""
    q = (
        select(RiskAssessment)
        .where(RiskAssessment.user_id == current_user.id)
        .order_by(desc(RiskAssessment.created_at))
        .limit(limit)
    )
    items = (await db.execute(q)).scalars().all()
    return RiskHistoryResponse(total=len(items), items=items)


@router.get("/{assessment_id}", response_model=RiskAssessmentResponse)
async def get_risk_assessment_detail(
    assessment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get single assessment with complete snapshot and population limitations."""
    q = select(RiskAssessment).where(
        RiskAssessment.id == assessment_id,
        RiskAssessment.user_id == current_user.id,
    )
    assessment = (await db.execute(q)).scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment
