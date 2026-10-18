"""User account management, profile updates, and GDPR/data export service."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash
from app.models.user import User, UserProfile, UserConsent
from app.models.vital import VitalMeasurement
from app.models.medical_history import MedicalHistory, FamilyHistory
from app.models.risk_assessment import RiskAssessment
from app.models.medication import Medication
from app.schemas.auth import RegisterRequest
from app.schemas.user import UserProfileUpdate, ConsentUpdate, UserExportResponse, UserResponse, UserProfileResponse, ConsentResponse


class UserService:
    """Business operations for user accounts and clinical demographic profiles."""

    @classmethod
    async def create_user(
        cls,
        data: RegisterRequest,
        db: AsyncSession,
        role: str = "patient",
    ) -> User:
        """Register a new user account with hashed password and default profile."""
        existing_query = select(User).where(User.email == data.email.lower().strip())
        existing = (await db.execute(existing_query)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        new_user = User(
            email=data.email.lower().strip(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name.strip(),
            phone=data.phone,
            role=role,
            is_active=True,
            is_verified=False,
            is_doctor_verified=False,
        )
        db.add(new_user)
        await db.flush()

        # Initialize profile
        profile = UserProfile(user_id=new_user.id)
        db.add(profile)

        # Initialize base consent
        default_consent = UserConsent(
            user_id=new_user.id,
            consent_type="health_data_processing",
            granted=True,
            notes="Accepted during registration",
        )
        db.add(default_consent)

        await db.commit()
        await db.refresh(new_user)
        return new_user

    @classmethod
    async def get_or_create_profile(cls, user_id: str, db: AsyncSession) -> UserProfile:
        """Retrieve user clinical profile or create one if missing."""
        query = select(UserProfile).where(UserProfile.user_id == user_id)
        profile = (await db.execute(query)).scalar_one_or_none()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
        return profile

    @classmethod
    async def update_profile(
        cls,
        user_id: str,
        update_data: UserProfileUpdate,
        db: AsyncSession,
    ) -> UserProfile:
        """Update clinical profile details for patient."""
        profile = await cls.get_or_create_profile(user_id, db)
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(profile, key, value)
        profile.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(profile)
        return profile

    @classmethod
    async def update_consent(
        cls,
        user_id: str,
        consent_data: ConsentUpdate,
        db: AsyncSession,
        ip_address: Optional[str] = None,
    ) -> UserConsent:
        """Add or update regulatory and health processing consent."""
        query = select(UserConsent).where(
            UserConsent.user_id == user_id,
            UserConsent.consent_type == consent_data.consent_type,
        )
        consent = (await db.execute(query)).scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if not consent:
            consent = UserConsent(
                user_id=user_id,
                consent_type=consent_data.consent_type,
                granted=consent_data.granted,
                granted_at=now,
                ip_address=ip_address,
                notes=consent_data.notes,
            )
            db.add(consent)
        else:
            consent.granted = consent_data.granted
            if consent_data.granted:
                consent.granted_at = now
                consent.revoked_at = None
            else:
                consent.revoked_at = now
            consent.ip_address = ip_address
            consent.notes = consent_data.notes

        await db.commit()
        await db.refresh(consent)
        return consent

    @classmethod
    async def export_user_data(cls, user: User, db: AsyncSession) -> UserExportResponse:
        """Compile complete user electronic health record in machine-readable JSON."""
        user_id = user.id
        profile = await cls.get_or_create_profile(user_id, db)

        consents_res = await db.execute(select(UserConsent).where(UserConsent.user_id == user_id))
        consents = consents_res.scalars().all()

        vitals_res = await db.execute(
            select(VitalMeasurement).where(
                VitalMeasurement.user_id == user_id,
                VitalMeasurement.is_deleted.is_(False),
            )
        )
        vitals = vitals_res.scalars().all()

        med_hist_res = await db.execute(select(MedicalHistory).where(MedicalHistory.user_id == user_id))
        med_histories = med_hist_res.scalars().all()

        fam_hist_res = await db.execute(select(FamilyHistory).where(FamilyHistory.user_id == user_id))
        fam_histories = fam_hist_res.scalars().all()

        risk_res = await db.execute(select(RiskAssessment).where(RiskAssessment.user_id == user_id))
        risks = risk_res.scalars().all()

        medications_res = await db.execute(select(Medication).where(Medication.user_id == user_id))
        medications = medications_res.scalars().all()

        return UserExportResponse(
            user=UserResponse.model_validate(user),
            profile=UserProfileResponse.model_validate(profile),
            consents=[ConsentResponse.model_validate(c) for c in consents],
            vitals_count=len(vitals),
            medical_histories_count=len(med_histories),
            exported_at=datetime.now(timezone.utc),
            data={
                "vitals": [
                    {
                        "type": v.measurement_type,
                        "value_primary": v.value_primary,
                        "value_secondary": v.value_secondary,
                        "unit": v.unit,
                        "measured_at": str(v.measured_at),
                    }
                    for v in vitals
                ],
                "medical_conditions": [
                    {
                        "condition": m.condition_name,
                        "icd10": m.icd10_code,
                        "active": m.is_active,
                    }
                    for m in med_histories
                ],
                "family_history": [
                    {"relative": f.relative_relation, "condition": f.condition_name}
                    for f in fam_histories
                ],
                "risk_assessments": [
                    {
                        "score": r.risk_score,
                        "category": r.risk_category,
                        "date": str(r.created_at),
                    }
                    for r in risks
                ],
                "medications": [
                    {"name": m.name, "dosage": m.dosage, "frequency": m.frequency}
                    for m in medications
                ],
            },
        )
