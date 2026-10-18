"""Doctor clinical portal and doctor-patient authorization endpoints."""
from datetime import datetime, timezone
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_active_user, require_role, get_db
from app.models.user import User, UserProfile
from app.models.doctor import DoctorPatientAccess, ClinicalReviewNote
from app.models.vital import VitalMeasurement
from app.models.risk_assessment import RiskAssessment
from app.models.emergency_event import EmergencyEvent
from app.models.clinical_alert import ClinicalAlert
from app.schemas.auth import MessageResponse
from app.schemas.doctor import (
    DoctorAccessRequest,
    PatientAccessGrant,
    PatientAccessRevoke,
    DoctorPatientAccessResponse,
    ClinicalReviewNoteCreate,
    ClinicalReviewNoteResponse,
    PatientSummaryResponse,
    DoctorProfileResponse,
    DoctorProfileUpdate,
    DoctorVerificationUpdate,
)
from app.schemas.vitals import VitalMeasurementResponse
from app.schemas.risk import RiskAssessmentResponse
from app.schemas.user import UserResponse

router = APIRouter(tags=["Doctor Portal & Access Management"])


def doctor_profile_response(user: User) -> DoctorProfileResponse:
    return DoctorProfileResponse(
        id=user.id,
        name=user.full_name,
        email=user.email,
        specialty=user.specialty,
        license_number=user.license_number,
        hospital_affiliation=user.hospital_affiliation,
        phone=user.phone,
        role=user.role,
        is_doctor_verified=user.is_doctor_verified,
    )


async def check_doctor_patient_authorization(
    doctor: User,
    patient_id: str,
    db: AsyncSession,
) -> DoctorPatientAccess | None:
    """Verify that doctor has active granted consent to access the patient's records."""
    if doctor.role == "admin":
        return None  # Admin bypass for clinical audit

    q = select(DoctorPatientAccess).where(
        DoctorPatientAccess.doctor_id == doctor.id,
        DoctorPatientAccess.patient_id == patient_id,
        DoctorPatientAccess.status == "granted",
    )
    access = (await db.execute(q)).scalar_one_or_none()
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor has not been granted access by this patient or consent was revoked.",
        )
    return access


# --- Doctor Endpoints (Role: doctor or admin) ---

@router.get("/doctor/profile", response_model=DoctorProfileResponse)
async def get_doctor_profile(
    current_doctor: User = Depends(require_role("doctor", "admin")),
):
    return doctor_profile_response(current_doctor)


@router.patch("/doctor/profile", response_model=DoctorProfileResponse)
async def update_doctor_profile(
    data: DoctorProfileUpdate,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(current_doctor, key, value)
    await db.commit()
    await db.refresh(current_doctor)
    return doctor_profile_response(current_doctor)


@router.post("/admin/doctors/{doctor_id}/verify", response_model=UserResponse)
async def verify_doctor(
    doctor_id: str,
    data: DoctorVerificationUpdate,
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    doctor = (await db.execute(select(User).where(User.id == doctor_id, User.role == "doctor"))).scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor account not found")
    doctor.is_doctor_verified = data.verified
    await db.commit()
    await db.refresh(doctor)
    return doctor

@router.get("/doctor/patients", response_model=List[PatientSummaryResponse])
async def list_authorized_patients(
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all patients who have granted clinical review access to the current doctor."""
    access_q = select(DoctorPatientAccess).where(
        DoctorPatientAccess.doctor_id == current_doctor.id,
        DoctorPatientAccess.status == "granted",
    )
    accesses = (await db.execute(access_q)).scalars().all()
    patient_ids = [a.patient_id for a in accesses]

    summaries: List[PatientSummaryResponse] = []
    for acc in accesses:
        p_user = (await db.execute(select(User).where(User.id == acc.patient_id))).scalar_one_or_none()
        if not p_user:
            continue
        profile = (
            await db.execute(select(UserProfile).where(UserProfile.user_id == p_user.id))
        ).scalar_one_or_none()
        age = None
        date_of_birth = None
        if profile and profile.date_of_birth:
            date_of_birth = profile.date_of_birth.isoformat()
            today = datetime.now(timezone.utc).date()
            age = today.year - profile.date_of_birth.year - (
                (today.month, today.day)
                < (profile.date_of_birth.month, profile.date_of_birth.day)
            )

        # Fetch latest vitals for quick overview
        bp_q = (
            select(VitalMeasurement)
            .where(
                VitalMeasurement.user_id == p_user.id,
                VitalMeasurement.measurement_type == "blood_pressure",
                VitalMeasurement.is_deleted.is_(False),
            )
            .order_by(desc(VitalMeasurement.measured_at))
            .limit(1)
        )
        bp_record = (await db.execute(bp_q)).scalar_one_or_none()
        latest_bp = f"{bp_record.value_primary}/{bp_record.value_secondary}" if bp_record else None

        hr_q = (
            select(VitalMeasurement)
            .where(
                VitalMeasurement.user_id == p_user.id,
                VitalMeasurement.measurement_type == "heart_rate",
                VitalMeasurement.is_deleted.is_(False),
            )
            .order_by(desc(VitalMeasurement.measured_at))
            .limit(1)
        )
        hr_record = (await db.execute(hr_q)).scalar_one_or_none()
        latest_hr = hr_record.value_primary if hr_record else None

        risk_q = (
            select(RiskAssessment)
            .where(RiskAssessment.user_id == p_user.id)
            .order_by(desc(RiskAssessment.created_at))
            .limit(1)
        )
        risk_record = (await db.execute(risk_q)).scalar_one_or_none()
        latest_risk = f"{risk_record.risk_score}% ({risk_record.risk_category})" if risk_record and risk_record.risk_score is not None else None

        summaries.append(
            PatientSummaryResponse(
                patient_id=p_user.id,
                full_name=p_user.full_name,
                email=p_user.email,
                phone=p_user.phone,
                date_of_birth=date_of_birth,
                age=age,
                gender=profile.gender if profile else None,
                blood_group=profile.blood_group if profile else None,
                access_status=acc.status,
                granted_at=acc.granted_at,
                latest_bp=latest_bp,
                latest_hr=latest_hr,
                last_assessment_risk=latest_risk,
            )
        )
    return summaries


async def authorized_patient_ids(doctor: User, db: AsyncSession) -> list[str]:
    if doctor.role == "admin":
        result = await db.execute(select(User.id).where(User.role == "patient"))
        return list(result.scalars().all())
    result = await db.execute(
        select(DoctorPatientAccess.patient_id).where(
            DoctorPatientAccess.doctor_id == doctor.id,
            DoctorPatientAccess.status == "granted",
        )
    )
    return list(result.scalars().all())


@router.get("/doctor/reviews/pending")
async def list_pending_reviews(
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return unreviewed risk assessments for patients authorized to this doctor."""
    patient_ids = await authorized_patient_ids(current_doctor, db)
    if not patient_ids:
        return []
    assessments = (
        await db.execute(
            select(RiskAssessment)
            .where(RiskAssessment.user_id.in_(patient_ids))
            .order_by(desc(RiskAssessment.created_at))
        )
    ).scalars().all()
    reviews = []
    for assessment in assessments:
        reviewed = (
            await db.execute(
                select(ClinicalReviewNote.id).where(
                    ClinicalReviewNote.patient_id == assessment.user_id,
                    ClinicalReviewNote.note_type == "risk_review",
                    ClinicalReviewNote.content.like(f"risk:{assessment.id}:%"),
                )
            )
        ).scalar_one_or_none()
        if reviewed:
            continue
        patient = (await db.execute(select(User).where(User.id == assessment.user_id))).scalar_one()
        reviews.append(
            {
                "id": assessment.id,
                "patientId": patient.id,
                "patientName": patient.full_name,
                "mrn": patient.id,
                "type": "risk",
                "title": "Cardiovascular risk assessment",
                "summary": f"{assessment.risk_category} risk assessment requires clinician review.",
                "submittedAt": assessment.created_at,
                "urgency": "urgent" if assessment.risk_category == "high" else "normal",
                "isAiGenerated": False,
                "source": "Framingham risk service",
                "targetId": assessment.id,
            }
        )
    return reviews


@router.post("/doctor/reviews/{review_id}/submit")
async def submit_review(
    review_id: str,
    data: dict[str, Any],
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    assessment = (await db.execute(select(RiskAssessment).where(RiskAssessment.id == review_id))).scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found")
    await check_doctor_patient_authorization(current_doctor, assessment.user_id, db)
    note = ClinicalReviewNote(
        doctor_id=current_doctor.id,
        patient_id=assessment.user_id,
        note_type="risk_review",
        content=f"risk:{review_id}:{data.get('notes', '')}",
        recommendations="approved" if data.get("approved", False) else "requires follow-up",
    )
    db.add(note)
    await db.commit()
    return {"success": True, "message": "Review successfully finalized and recorded"}


@router.get("/doctor/alerts")
async def list_alerts(
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return persisted emergency and high-BP alerts for authorized patients."""
    patient_ids = await authorized_patient_ids(current_doctor, db)
    events = (
        await db.execute(
            select(EmergencyEvent).where(
                EmergencyEvent.user_id.in_(patient_ids),
                EmergencyEvent.severity_level.in_(["EMERGENCY", "URGENT"]),
            )
        )
    ).scalars().all() if patient_ids else []
    for event in events:
        exists = (
            await db.execute(
                select(ClinicalAlert).where(
                    ClinicalAlert.source_type == "emergency_event",
                    ClinicalAlert.source_id == event.id,
                )
            )
        ).scalar_one_or_none()
        if not exists:
            db.add(
                ClinicalAlert(
                    patient_id=event.user_id,
                    source_type="emergency_event",
                    source_id=event.id,
                    severity="critical" if event.severity_level == "EMERGENCY" else "warning",
                    category="vitals",
                    title="Emergency symptom event",
                    description=event.guidance_provided,
                )
            )
    await db.commit()
    alerts = (
        await db.execute(
            select(ClinicalAlert)
            .where(ClinicalAlert.patient_id.in_(patient_ids))
            .order_by(desc(ClinicalAlert.created_at))
        )
    ).scalars().all() if patient_ids else []
    result = []
    for alert in alerts:
        patient = (await db.execute(select(User).where(User.id == alert.patient_id))).scalar_one()
        result.append(
            {
                "id": alert.id,
                "patientId": patient.id,
                "patientName": patient.full_name,
                "mrn": patient.id,
                "type": alert.severity,
                "category": alert.category,
                "title": alert.title,
                "description": alert.description,
                "timestamp": alert.created_at,
                "source": alert.source_type,
                "acknowledged": alert.acknowledged,
                "acknowledgedBy": alert.acknowledged_by,
                "acknowledgedAt": alert.acknowledged_at,
            }
        )
    return result


@router.post("/doctor/alerts/{alert_id}/ack")
async def acknowledge_alert(
    alert_id: str,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    alert = (await db.execute(select(ClinicalAlert).where(ClinicalAlert.id == alert_id))).scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    await check_doctor_patient_authorization(current_doctor, alert.patient_id, db)
    alert.acknowledged = True
    alert.acknowledged_by = current_doctor.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    patient = (await db.execute(select(User).where(User.id == alert.patient_id))).scalar_one()
    return {
        "id": alert.id,
        "patientId": patient.id,
        "patientName": patient.full_name,
        "mrn": patient.id,
        "type": alert.severity,
        "category": alert.category,
        "title": alert.title,
        "description": alert.description,
        "timestamp": alert.created_at,
        "source": alert.source_type,
        "acknowledged": alert.acknowledged,
        "acknowledgedBy": alert.acknowledged_by,
        "acknowledgedAt": alert.acknowledged_at,
    }


@router.get("/doctor/patients/{patient_id}")
async def get_patient_detail(
    patient_id: str,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """View patient profile and baseline demographics with verified consent verification."""
    await check_doctor_patient_authorization(current_doctor, patient_id, db)

    patient = (await db.execute(select(User).where(User.id == patient_id))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == patient_id))).scalar_one_or_none()

    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "email": patient.email,
        "phone": patient.phone,
        "profile": profile,
    }


@router.get("/doctor/patients/{patient_id}/vitals", response_model=List[VitalMeasurementResponse])
async def get_patient_vitals(
    patient_id: str,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full vitals history of an authorized patient."""
    await check_doctor_patient_authorization(current_doctor, patient_id, db)

    q = (
        select(VitalMeasurement)
        .where(
            VitalMeasurement.user_id == patient_id,
            VitalMeasurement.is_deleted.is_(False),
        )
        .order_by(desc(VitalMeasurement.measured_at))
    )
    return (await db.execute(q)).scalars().all()


@router.get("/doctor/patients/{patient_id}/risk-assessments", response_model=List[RiskAssessmentResponse])
async def get_patient_risk_assessments(
    patient_id: str,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """View cardiovascular risk calculations for an authorized patient."""
    await check_doctor_patient_authorization(current_doctor, patient_id, db)

    q = (
        select(RiskAssessment)
        .where(RiskAssessment.user_id == patient_id)
        .order_by(desc(RiskAssessment.created_at))
    )
    return (await db.execute(q)).scalars().all()


@router.post("/doctor/patients/{patient_id}/notes", response_model=ClinicalReviewNoteResponse, status_code=status.HTTP_201_CREATED)
async def add_clinical_note(
    patient_id: str,
    data: ClinicalReviewNoteCreate,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Add a physician clinical note or triage recommendation to a patient's chart."""
    await check_doctor_patient_authorization(current_doctor, patient_id, db)

    note = ClinicalReviewNote(
        doctor_id=current_doctor.id,
        patient_id=patient_id,
        note_type=data.note_type,
        content=data.content,
        recommendations=data.recommendations,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.post("/doctor/access/request", response_model=DoctorPatientAccessResponse, status_code=status.HTTP_201_CREATED)
async def request_patient_access(
    data: DoctorAccessRequest,
    current_doctor: User = Depends(require_role("doctor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Request patient permission to view their electronic health record."""
    patient = (await db.execute(select(User).where(User.email == data.patient_email.lower().strip()))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient with this email not found")

    existing_q = select(DoctorPatientAccess).where(
        DoctorPatientAccess.doctor_id == current_doctor.id,
        DoctorPatientAccess.patient_id == patient.id,
    )
    access = (await db.execute(existing_q)).scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if not access:
        access = DoctorPatientAccess(
            doctor_id=current_doctor.id,
            patient_id=patient.id,
            status="requested",
            requested_at=now,
            permissions_json={"reason": data.reason},
        )
        db.add(access)
    else:
        access.status = "requested"
        access.requested_at = now
        access.permissions_json = {"reason": data.reason}

    await db.commit()
    await db.refresh(access)
    return access


# --- Patient Access Grant / Revocation Endpoints ---

@router.post("/patients/access/grant", response_model=DoctorPatientAccessResponse)
async def grant_doctor_access(
    data: PatientAccessGrant,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Patient grants consent to a doctor to view their health records."""
    doctor = (await db.execute(select(User).where(User.id == data.doctor_id, User.role.in_(["doctor", "admin"])))).scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if doctor.role == "doctor" and (not doctor.is_active or not doctor.is_doctor_verified):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active, administrator-verified doctors can receive patient access",
        )

    q = select(DoctorPatientAccess).where(
        DoctorPatientAccess.doctor_id == data.doctor_id,
        DoctorPatientAccess.patient_id == current_user.id,
    )
    access = (await db.execute(q)).scalar_one_or_none()
    now = datetime.now(timezone.utc)

    permissions = {
        "can_view_vitals": data.can_view_vitals,
        "can_view_records": data.can_view_records,
        "can_view_medications": data.can_view_medications,
    }

    if not access:
        access = DoctorPatientAccess(
            doctor_id=data.doctor_id,
            patient_id=current_user.id,
            status="granted",
            requested_at=now,
            granted_at=now,
            permissions_json=permissions,
        )
        db.add(access)
    else:
        access.status = "granted"
        access.granted_at = now
        access.revoked_at = None
        access.permissions_json = permissions

    await db.commit()
    await db.refresh(access)
    return access


@router.post("/patients/access/revoke", response_model=DoctorPatientAccessResponse)
async def revoke_doctor_access(
    data: PatientAccessRevoke,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Patient revokes a doctor's access to their medical records."""
    q = select(DoctorPatientAccess).where(
        DoctorPatientAccess.doctor_id == data.doctor_id,
        DoctorPatientAccess.patient_id == current_user.id,
    )
    access = (await db.execute(q)).scalar_one_or_none()
    if not access:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access record not found")

    access.status = "revoked"
    access.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(access)
    return access
