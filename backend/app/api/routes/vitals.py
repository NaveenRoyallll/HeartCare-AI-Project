"""Vital signs endpoints for logging, history, trends, and danger checking."""
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.vital import VitalMeasurement
from app.schemas.auth import MessageResponse
from app.schemas.vitals import (
    VitalMeasurementCreate,
    VitalMeasurementUpdate,
    VitalMeasurementResponse,
    VitalMeasurementList,
    VitalTrendsResponse,
    VALID_MEASUREMENT_TYPES,
)
from app.services.vital_service import VitalService

router = APIRouter(prefix="/vitals", tags=["Vital Measurements"])


@router.post("/", response_model=VitalMeasurementResponse, status_code=status.HTTP_201_CREATED)
async def record_vital_measurement(
    data: VitalMeasurementCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a new vital measurement with validation and physiological range checks."""
    measurement = await VitalService.record_measurement(
        user_id=current_user.id,
        data=data,
        db=db,
    )
    return measurement


@router.get("/latest", response_model=Dict[str, Optional[VitalMeasurementResponse]])
async def get_latest_vitals(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent measurement for every supported vital type."""
    latest_dict: Dict[str, Optional[VitalMeasurementResponse]] = {}
    for m_type in VALID_MEASUREMENT_TYPES:
        q = (
            select(VitalMeasurement)
            .where(
                VitalMeasurement.user_id == current_user.id,
                VitalMeasurement.measurement_type == m_type,
                VitalMeasurement.is_deleted.is_(False),
            )
            .order_by(desc(VitalMeasurement.measured_at))
            .limit(1)
        )
        res = await db.execute(q)
        record = res.scalar_one_or_none()
        latest_dict[m_type] = record
    return latest_dict


@router.get("/trends", response_model=VitalTrendsResponse)
async def get_vital_trends(
    measurement_type: str = Query(..., description="Measurement type, e.g., blood_pressure or heart_rate"),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get statistical trends and historical time-series points for clinical charting."""
    return await VitalService.compute_trends(
        user_id=current_user.id,
        measurement_type=measurement_type,
        db=db,
        limit=limit,
    )


@router.get("/", response_model=VitalMeasurementList)
async def list_vitals(
    measurement_type: Optional[str] = Query(None, description="Filter by vital type"),
    start_date: Optional[datetime] = Query(None, description="Filter from timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter to timestamp"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List recorded vitals with optional filters and pagination."""
    base_filter = [
        VitalMeasurement.user_id == current_user.id,
        VitalMeasurement.is_deleted.is_(False),
    ]
    if measurement_type:
        base_filter.append(VitalMeasurement.measurement_type == measurement_type.lower().strip())
    if start_date:
        base_filter.append(VitalMeasurement.measured_at >= start_date)
    if end_date:
        base_filter.append(VitalMeasurement.measured_at <= end_date)

    # Count
    count_q = select(func.count(VitalMeasurement.id)).where(*base_filter)
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    data_q = (
        select(VitalMeasurement)
        .where(*base_filter)
        .order_by(desc(VitalMeasurement.measured_at))
        .offset(offset)
        .limit(limit)
    )
    items = (await db.execute(data_q)).scalars().all()

    return VitalMeasurementList(
        total=total,
        items=items,
        page=page,
        limit=limit,
    )


@router.get("/{vital_id}", response_model=VitalMeasurementResponse)
async def get_vital_detail(
    vital_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve an individual vital measurement by ID."""
    q = select(VitalMeasurement).where(
        VitalMeasurement.id == vital_id,
        VitalMeasurement.user_id == current_user.id,
        VitalMeasurement.is_deleted.is_(False),
    )
    vital = (await db.execute(q)).scalar_one_or_none()
    if not vital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")
    return vital


@router.put("/{vital_id}", response_model=VitalMeasurementResponse)
async def update_vital_measurement(
    vital_id: str,
    data: VitalMeasurementUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a vital measurement (own only)."""
    q = select(VitalMeasurement).where(
        VitalMeasurement.id == vital_id,
        VitalMeasurement.user_id == current_user.id,
        VitalMeasurement.is_deleted.is_(False),
    )
    vital = (await db.execute(q)).scalar_one_or_none()
    if not vital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(vital, k, v)

    await db.commit()
    await db.refresh(vital)
    return vital


@router.delete("/{vital_id}", response_model=MessageResponse)
async def delete_vital_measurement(
    vital_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a vital measurement."""
    q = select(VitalMeasurement).where(
        VitalMeasurement.id == vital_id,
        VitalMeasurement.user_id == current_user.id,
        VitalMeasurement.is_deleted.is_(False),
    )
    vital = (await db.execute(q)).scalar_one_or_none()
    if not vital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")

    vital.is_deleted = True
    await db.commit()
    return MessageResponse(message="Measurement successfully deleted")
