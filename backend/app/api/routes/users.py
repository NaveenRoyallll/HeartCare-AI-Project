"""User profile management, privacy consents, and data export endpoints."""
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User, UserConsent
from app.schemas.auth import MessageResponse
from app.schemas.user import (
    UserResponse,
    UserProfileResponse,
    UserProfileUpdate,
    ConsentResponse,
    ConsentUpdate,
    UserExportResponse,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get("/me", response_model=UserResponse)
async def get_my_account(
    current_user: User = Depends(get_current_active_user),
):
    """Get the current authenticated user's account details."""
    return current_user


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's clinical baseline and demographic profile."""
    profile = await UserService.get_or_create_profile(current_user.id, db)
    return profile


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update demographic or physiological baseline values (e.g., height, weight, DOB)."""
    updated = await UserService.update_profile(current_user.id, data, db)
    return updated


@router.delete("/me", response_model=MessageResponse)
async def deactivate_my_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate current user's account."""
    current_user.is_active = False
    await db.commit()
    return MessageResponse(message="Account successfully deactivated")


@router.get("/me/consents", response_model=List[ConsentResponse])
async def get_my_consents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all current privacy and data-processing consent states."""
    query = select(UserConsent).where(UserConsent.user_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/me/consents", response_model=ConsentResponse)
async def update_my_consent(
    data: ConsentUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Grant or revoke a specific data processing consent."""
    client_ip = request.client.host if request.client else None
    consent = await UserService.update_consent(
        user_id=current_user.id,
        consent_data=data,
        db=db,
        ip_address=client_ip,
    )
    return consent


@router.get("/me/export", response_model=UserExportResponse)
async def export_my_health_record(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Export complete patient electronic health record as standardized JSON (GDPR / HIPAA compliant)."""
    export_payload = await UserService.export_user_data(current_user, db)
    return export_payload
