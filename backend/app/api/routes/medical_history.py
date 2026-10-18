"""Medical history and family cardiovascular history endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.medical_history import MedicalHistory, FamilyHistory
from app.schemas.auth import MessageResponse
from app.schemas.medical_history import (
    MedicalHistoryCreate,
    MedicalHistoryUpdate,
    MedicalHistoryResponse,
    FamilyHistoryCreate,
    FamilyHistoryUpdate,
    FamilyHistoryResponse,
)

router = APIRouter(tags=["Medical & Family History"])


# --- Medical History Endpoints ---

@router.get("/medical-history/", response_model=List[MedicalHistoryResponse])
async def list_medical_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all diagnosed medical conditions for current patient."""
    q = select(MedicalHistory).where(MedicalHistory.user_id == current_user.id)
    return (await db.execute(q)).scalars().all()


@router.post("/medical-history/", response_model=MedicalHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_history(
    data: MedicalHistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a diagnosed medical condition (e.g. hypertension, diabetes, CAD)."""
    record = MedicalHistory(
        user_id=current_user.id,
        condition_name=data.condition_name.strip(),
        icd10_code=data.icd10_code,
        diagnosis_date=data.diagnosis_date,
        is_active=data.is_active,
        notes=data.notes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.put("/medical-history/{record_id}", response_model=MedicalHistoryResponse)
async def update_medical_history(
    record_id: str,
    data: MedicalHistoryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update condition status or diagnosis details."""
    q = select(MedicalHistory).where(
        MedicalHistory.id == record_id,
        MedicalHistory.user_id == current_user.id,
    )
    record = (await db.execute(q)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical history record not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(record, k, v)

    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/medical-history/{record_id}", response_model=MessageResponse)
async def delete_medical_history(
    record_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a medical history record."""
    q = select(MedicalHistory).where(
        MedicalHistory.id == record_id,
        MedicalHistory.user_id == current_user.id,
    )
    record = (await db.execute(q)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical history record not found")

    await db.delete(record)
    await db.commit()
    return MessageResponse(message="Record deleted successfully")


# --- Family History Endpoints ---

@router.get("/family-history/", response_model=List[FamilyHistoryResponse])
async def list_family_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List familial cardiovascular conditions."""
    q = select(FamilyHistory).where(FamilyHistory.user_id == current_user.id)
    return (await db.execute(q)).scalars().all()


@router.post("/family-history/", response_model=FamilyHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_family_history(
    data: FamilyHistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Log family history of premature CAD, sudden cardiac death, or hypertension."""
    record = FamilyHistory(
        user_id=current_user.id,
        relative_relation=data.relative_relation.strip(),
        condition_name=data.condition_name.strip(),
        onset_age=data.onset_age,
        notes=data.notes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.put("/family-history/{record_id}", response_model=FamilyHistoryResponse)
async def update_family_history(
    record_id: str,
    data: FamilyHistoryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update family history record."""
    q = select(FamilyHistory).where(
        FamilyHistory.id == record_id,
        FamilyHistory.user_id == current_user.id,
    )
    record = (await db.execute(q)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family history record not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(record, k, v)

    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/family-history/{record_id}", response_model=MessageResponse)
async def delete_family_history(
    record_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete family history record."""
    q = select(FamilyHistory).where(
        FamilyHistory.id == record_id,
        FamilyHistory.user_id == current_user.id,
    )
    record = (await db.execute(q)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family history record not found")

    await db.delete(record)
    await db.commit()
    return MessageResponse(message="Record deleted successfully")
