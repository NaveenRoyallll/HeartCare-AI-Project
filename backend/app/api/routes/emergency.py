"""Emergency triage, incident logging, and emergency contacts endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.models.emergency_event import EmergencyEvent, EmergencyContact
from app.schemas.auth import MessageResponse
from app.schemas.emergency import (
    EmergencySymptomCheck,
    EmergencyGuidanceResponse,
    EmergencyEventCreate,
    EmergencyEventResponse,
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse,
)
from app.services.emergency_service import EmergencyService

router = APIRouter(prefix="/emergency", tags=["Emergency & Critical Care"])
emergency_service = EmergencyService()


@router.post("/check-symptoms", response_model=EmergencyGuidanceResponse)
async def check_cardiac_symptoms(
    data: EmergencySymptomCheck,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate reported symptoms deterministically against acute coronary and cardiovascular danger rules.
    
    CRITICAL: Does NOT wait for generative AI. Immediately returns triage tier and national emergency dispatch number.
    """
    guidance = await emergency_service.triage_symptoms(
        symptoms=data.symptoms,
        heart_rate=data.heart_rate,
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        spo2=data.spo2,
        symptom_severity=data.symptom_severity,
        symptom_duration_minutes=data.symptom_duration_minutes,
        symptom_onset=data.symptom_onset,
        symptoms_worsening=data.symptoms_worsening,
        user_id=current_user.id,
        db=db,
    )
    return guidance


@router.post("/event", response_model=EmergencyEventResponse, status_code=status.HTTP_201_CREATED)
async def log_emergency_event(
    data: EmergencyEventCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Log an acute emergency event or alert for regulatory and audit tracking."""
    event = EmergencyEvent(
        user_id=current_user.id,
        event_type=data.event_type,
        severity_level=data.severity_level,
        symptoms_json=data.symptoms,
        guidance_provided=data.guidance_provided,
        contacts_notified=data.contacts_notified,
        ambulance_called=data.ambulance_called,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


# --- Emergency Contacts Management ---

@router.get("/contacts", response_model=List[EmergencyContactResponse])
async def list_emergency_contacts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all registered emergency contacts for the patient."""
    q = select(EmergencyContact).where(EmergencyContact.user_id == current_user.id)
    return (await db.execute(q)).scalars().all()


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    data: EmergencyContactCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a designated emergency contact."""
    # If set as primary, unmark other primary contacts
    if data.is_primary:
        existing = await db.execute(
            select(EmergencyContact).where(
                EmergencyContact.user_id == current_user.id,
                EmergencyContact.is_primary.is_(True),
            )
        )
        for contact in existing.scalars().all():
            contact.is_primary = False

    contact = EmergencyContact(
        user_id=current_user.id,
        name=data.name.strip(),
        relationship=data.relationship.strip(),
        phone_number=data.phone_number.strip(),
        is_primary=data.is_primary,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.put("/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: str,
    data: EmergencyContactUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update emergency contact details."""
    q = select(EmergencyContact).where(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    )
    contact = (await db.execute(q)).scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")

    update_dict = data.model_dump(exclude_unset=True)
    if update_dict.get("is_primary") is True:
        existing = await db.execute(
            select(EmergencyContact).where(
                EmergencyContact.user_id == current_user.id,
                EmergencyContact.is_primary.is_(True),
                EmergencyContact.id != contact_id,
            )
        )
        for other in existing.scalars().all():
            other.is_primary = False

    for k, v in update_dict.items():
        setattr(contact, k, v)

    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", response_model=MessageResponse)
async def delete_emergency_contact(
    contact_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an emergency contact."""
    q = select(EmergencyContact).where(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    )
    contact = (await db.execute(q)).scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")

    await db.delete(contact)
    await db.commit()
    return MessageResponse(message="Emergency contact removed successfully")
