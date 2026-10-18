"""Lifestyle logs (exercise, sleep, diet) and cardiovascular wellness goals endpoints."""
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.lifestyle import LifestyleLog, LifestyleGoal
from app.schemas.lifestyle import (
    LifestyleLogCreate,
    LifestyleLogResponse,
    LifestyleGoalCreate,
    LifestyleGoalUpdate,
    LifestyleGoalResponse,
)

router = APIRouter(prefix="/lifestyle", tags=["Lifestyle & Wellness"])


@router.post("/logs", response_model=LifestyleLogResponse, status_code=status.HTTP_201_CREATED)
async def create_lifestyle_log(
    data: LifestyleLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Log daily physical activity, sleep, sodium/diet, or stress score."""
    logged_date = data.logged_date or datetime.now().date()
    log_entry = LifestyleLog(
        user_id=current_user.id,
        log_type=data.log_type.lower().strip(),
        value_numeric=data.value_numeric,
        unit=data.unit,
        details_json=data.details_json or {},
        notes=data.notes,
        logged_date=logged_date,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry


@router.get("/logs", response_model=List[LifestyleLogResponse])
async def list_lifestyle_logs(
    log_type: Optional[str] = Query(None, description="activity, sleep, diet, stress"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve historical daily lifestyle logs."""
    q = select(LifestyleLog).where(LifestyleLog.user_id == current_user.id)
    if log_type:
        q = q.where(LifestyleLog.log_type == log_type.lower().strip())
    q = q.order_by(desc(LifestyleLog.logged_date)).limit(limit)
    return (await db.execute(q)).scalars().all()


@router.get("/goals", response_model=List[LifestyleGoalResponse])
async def list_lifestyle_goals(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List cardiovascular lifestyle targets (e.g. daily steps, sleep, sodium limit)."""
    q = select(LifestyleGoal).where(
        LifestyleGoal.user_id == current_user.id,
        LifestyleGoal.is_active.is_(True),
    )
    return (await db.execute(q)).scalars().all()


@router.post("/goals", response_model=LifestyleGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_lifestyle_goal(
    data: LifestyleGoalCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new lifestyle goal."""
    goal = LifestyleGoal(
        user_id=current_user.id,
        goal_type=data.goal_type.lower().strip(),
        target_value=data.target_value,
        unit=data.unit,
        period=data.period,
        is_active=data.is_active,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=LifestyleGoalResponse)
async def update_lifestyle_goal(
    goal_id: str,
    data: LifestyleGoalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a lifestyle goal target or active status."""
    q = select(LifestyleGoal).where(
        LifestyleGoal.id == goal_id,
        LifestyleGoal.user_id == current_user.id,
    )
    goal = (await db.execute(q)).scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(goal, k, v)

    await db.commit()
    await db.refresh(goal)
    return goal
