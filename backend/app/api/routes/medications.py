"""Medication management, reminders, and adherence logging endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.medication import Medication, MedicationSchedule, MedicationLog
from app.schemas.auth import MessageResponse
from app.schemas.medication import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    MedicationScheduleCreate,
    MedicationScheduleResponse,
    MedicationLogCreate,
    MedicationLogResponse,
)

router = APIRouter(prefix="/medications", tags=["Medications & Adherence"])


@router.get("/", response_model=List[MedicationResponse])
async def list_medications(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List prescribed medications for current patient."""
    q = select(Medication).where(Medication.user_id == current_user.id)
    if active_only:
        q = q.where(Medication.is_active.is_(True))
    return (await db.execute(q)).scalars().all()


@router.post("/", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    data: MedicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new medication and optional reminders."""
    med = Medication(
        user_id=current_user.id,
        name=data.name.strip(),
        dosage=data.dosage.strip(),
        form=data.form.strip(),
        frequency=data.frequency.strip(),
        instructions=data.instructions,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
    )
    db.add(med)
    await db.flush()

    if data.schedules:
        for s in data.schedules:
            sched = MedicationSchedule(
                medication_id=med.id,
                reminder_time=s.reminder_time,
                day_of_week=s.day_of_week,
                is_active=s.is_active,
            )
            db.add(sched)

    await db.commit()
    await db.refresh(med)
    return med


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get single medication details."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return med


@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: str,
    data: MedicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update medication dosage, frequency, or active status."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(med, k, v)

    await db.commit()
    await db.refresh(med)
    return med


@router.delete("/{medication_id}", response_model=MessageResponse)
async def delete_medication(
    medication_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a medication."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    await db.delete(med)
    await db.commit()
    return MessageResponse(message="Medication removed successfully")


# --- Schedules and Adherence Logs ---

@router.post("/{medication_id}/schedules", response_model=MedicationScheduleResponse, status_code=status.HTTP_201_CREATED)
async def add_medication_schedule(
    medication_id: str,
    data: MedicationScheduleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a dose reminder schedule to a medication."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    sched = MedicationSchedule(
        medication_id=medication_id,
        reminder_time=data.reminder_time,
        day_of_week=data.day_of_week,
        is_active=data.is_active,
    )
    db.add(sched)
    await db.commit()
    await db.refresh(sched)
    return sched


@router.post("/{medication_id}/log", response_model=MedicationLogResponse, status_code=status.HTTP_201_CREATED)
async def log_medication_dose(
    medication_id: str,
    data: MedicationLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Log whether a dose was taken, skipped, or missed."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    log_entry = MedicationLog(
        medication_id=medication_id,
        user_id=current_user.id,
        scheduled_time=data.scheduled_time,
        taken_time=data.taken_time,
        status=data.status.lower().strip(),
        notes=data.notes,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry


@router.get("/{medication_id}/logs", response_model=List[MedicationLogResponse])
async def list_medication_logs(
    medication_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List historical dose adherence logs for a specific medication."""
    q = select(Medication).where(
        Medication.id == medication_id,
        Medication.user_id == current_user.id,
    )
    med = (await db.execute(q)).scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    log_q = (
        select(MedicationLog)
        .where(
            MedicationLog.medication_id == medication_id,
            MedicationLog.user_id == current_user.id,
        )
        .order_by(desc(MedicationLog.scheduled_time))
        .limit(limit)
    )
    return (await db.execute(log_q)).scalars().all()
