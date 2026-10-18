"""Cardiovascular aggregated dashboard and AI assistant summary endpoints."""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, get_db
from app.models.user import User, UserProfile
from app.models.vital import VitalMeasurement
from app.models.medication import Medication, MedicationLog
from app.models.risk_assessment import RiskAssessment
from app.models.emergency_event import EmergencyContact
from app.models.doctor import ClinicalReviewNote
from app.models.medical_history import MedicalHistory
from app.schemas.health import HealthDashboardResponse, HealthSummaryResponse
from app.schemas.vitals import VitalMeasurementResponse, VALID_MEASUREMENT_TYPES
from app.schemas.risk import RiskAssessmentResponse

router = APIRouter(prefix="/health", tags=["Health Dashboard & Summaries"])


@router.get("/dashboard", response_model=HealthDashboardResponse)
async def get_health_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate all critical cardiovascular dashboard cards in a single fast query."""
    user_id = current_user.id

    # 1. Latest vitals for key types
    latest_vitals: Dict[str, Optional[VitalMeasurementResponse]] = {}
    for m_type in ["blood_pressure", "heart_rate", "blood_glucose", "weight", "spo2"]:
        q = (
            select(VitalMeasurement)
            .where(
                VitalMeasurement.user_id == user_id,
                VitalMeasurement.measurement_type == m_type,
                VitalMeasurement.is_deleted.is_(False),
            )
            .order_by(desc(VitalMeasurement.measured_at))
            .limit(1)
        )
        rec = (await db.execute(q)).scalar_one_or_none()
        latest_vitals[m_type] = VitalMeasurementResponse.model_validate(rec) if rec else None

    # 2. Active medications count
    med_q = select(func.count(Medication.id)).where(
        Medication.user_id == user_id,
        Medication.is_active.is_(True),
    )
    active_meds_count = (await db.execute(med_q)).scalar() or 0

    # 3. Latest risk assessment
    risk_q = (
        select(RiskAssessment)
        .where(RiskAssessment.user_id == user_id)
        .order_by(desc(RiskAssessment.created_at))
        .limit(1)
    )
    risk_rec = (await db.execute(risk_q)).scalar_one_or_none()
    latest_risk = RiskAssessmentResponse.model_validate(risk_rec) if risk_rec else None

    # 4. Medication adherence percentage over the last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    logs_q = select(MedicationLog).where(
        MedicationLog.user_id == user_id,
        MedicationLog.scheduled_time >= seven_days_ago,
    )
    recent_logs = (await db.execute(logs_q)).scalars().all()
    if recent_logs:
        taken_count = sum(1 for log in recent_logs if log.status.lower() == "taken")
        adherence_pct = round((taken_count / len(recent_logs)) * 100.0, 1)
    else:
        adherence_pct = 100.0  # Default if no logs exist

    # 5. Contacts and notes count
    contacts_q = select(func.count(EmergencyContact.id)).where(EmergencyContact.user_id == user_id)
    contacts_count = (await db.execute(contacts_q)).scalar() or 0

    notes_q = select(func.count(ClinicalReviewNote.id)).where(ClinicalReviewNote.patient_id == user_id)
    notes_count = (await db.execute(notes_q)).scalar() or 0

    return HealthDashboardResponse(
        user_id=user_id,
        latest_vitals=latest_vitals,
        active_medications_count=active_meds_count,
        latest_risk_assessment=latest_risk,
        adherence_percentage_7d=adherence_pct,
        emergency_contacts_count=contacts_count,
        unread_clinical_notes_count=notes_count,
        system_status="operational",
    )


@router.get("/summary", response_model=HealthSummaryResponse)
async def get_health_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate a patient's complete cardiovascular context for safe AI assistant prompts."""
    user_id = current_user.id

    prof_q = select(UserProfile).where(UserProfile.user_id == user_id)
    profile = (await db.execute(prof_q)).scalar_one_or_none()

    age = None
    gender = None
    if profile:
        gender = profile.gender
        if profile.date_of_birth:
            today = datetime.now().date()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    # Diagnosed conditions
    hist_q = select(MedicalHistory).where(MedicalHistory.user_id == user_id, MedicalHistory.is_active.is_(True))
    conditions = [c.condition_name for c in (await db.execute(hist_q)).scalars().all()]

    # Active medications
    meds_q = select(Medication).where(Medication.user_id == user_id, Medication.is_active.is_(True))
    active_meds = [f"{m.name} ({m.dosage}, {m.frequency})" for m in (await db.execute(meds_q)).scalars().all()]

    # Latest risk
    risk_q = select(RiskAssessment).where(RiskAssessment.user_id == user_id).order_by(desc(RiskAssessment.created_at)).limit(1)
    risk_rec = (await db.execute(risk_q)).scalar_one_or_none()
    latest_framingham = f"{risk_rec.risk_score}% ({risk_rec.risk_category} risk)" if risk_rec and risk_rec.risk_score is not None else None

    # Clinical flags
    flags = []
    # Check BP
    bp_q = select(VitalMeasurement).where(
        VitalMeasurement.user_id == user_id,
        VitalMeasurement.measurement_type == "blood_pressure",
        VitalMeasurement.is_deleted.is_(False),
    ).order_by(desc(VitalMeasurement.measured_at)).limit(1)
    bp_rec = (await db.execute(bp_q)).scalar_one_or_none()
    if bp_rec and bp_rec.value_primary >= 140.0:
        flags.append(f"Elevated blood pressure: {bp_rec.value_primary}/{bp_rec.value_secondary} mmHg")

    return HealthSummaryResponse(
        user_id=user_id,
        full_name=current_user.full_name,
        age=age,
        gender=gender,
        known_conditions=conditions,
        active_medications=active_meds,
        recent_vital_trends={},
        latest_framingham_risk=latest_framingham,
        clinical_flags=flags,
        last_updated=datetime.now(timezone.utc),
    )
