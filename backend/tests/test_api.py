from datetime import timedelta
import asyncio

from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User


def register(client, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPass123!",
            "full_name": "Synthetic Patient",
            "phone": "+10000000000",
        },
    )
    assert response.status_code == 201
    return response.json()


def login(client, email: str, password: str = "StrongPass123!") -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_registration_login_and_invalid_password(client):
    email = "patient-auth@cardioguard.ai"
    user = register(client, email)
    assert user["role"] == "patient"
    assert user["is_active"] is True

    invalid = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
    )
    assert invalid.status_code == 401

    tokens = login(client, email)
    assert tokens["token_type"] == "bearer"
    assert tokens["role"] == "patient"
    assert tokens["access_token"]
    assert tokens["refresh_token"]


def test_refresh_rotation_and_revocation(client):
    email = "patient-refresh@cardioguard.ai"
    register(client, email)
    tokens = login(client, email)

    refreshed = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert refreshed.json()["refresh_token"] != tokens["refresh_token"]

    replay = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert replay.status_code == 401


def test_expired_access_token_is_rejected(client):
    user = register(client, "patient-expired@cardioguard.ai")
    expired = create_access_token(
        user_id=user["id"],
        role="patient",
        expires_delta=timedelta(seconds=-1),
    )
    response = client.get("/api/v1/users/me", headers=auth(expired))
    assert response.status_code == 401


def test_profile_management_and_account_deactivation(client):
    register(client, "patient-profile@cardioguard.ai")
    tokens = login(client, "patient-profile@cardioguard.ai")
    headers = auth(tokens["access_token"])

    profile = client.get("/api/v1/users/me/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["user_id"]

    updated = client.put(
        "/api/v1/users/me/profile",
        headers=headers,
        json={
            "gender": "female",
            "height_cm": 165,
            "weight_kg": 62,
            "city": "Synthetic City",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["height_cm"] == 165

    deleted = client.delete("/api/v1/users/me", headers=headers)
    assert deleted.status_code == 200
    assert client.get("/api/v1/users/me", headers=headers).status_code == 403


def test_vital_crud_and_object_level_isolation(client):
    first_email = "patient-vitals-one@cardioguard.ai"
    second_email = "patient-vitals-two@cardioguard.ai"
    first = register(client, first_email)
    second = register(client, second_email)
    first_token = login(client, first_email)["access_token"]
    second_token = login(client, second_email)["access_token"]

    created = client.post(
        "/api/v1/vitals/",
        headers=auth(first_token),
        json={
            "measurement_type": "blood_pressure",
            "value_primary": 128,
            "value_secondary": 82,
            "unit": "mmHg",
            "source": "manual",
        },
    )
    assert created.status_code == 201
    vital_id = created.json()["id"]

    listed = client.get("/api/v1/vitals/", headers=auth(first_token))
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    forbidden = client.get(f"/api/v1/vitals/{vital_id}", headers=auth(second_token))
    assert forbidden.status_code == 404

    updated = client.put(
        f"/api/v1/vitals/{vital_id}",
        headers=auth(first_token),
        json={"value_primary": 130},
    )
    assert updated.status_code == 200
    assert updated.json()["value_primary"] == 130

    deleted = client.delete(f"/api/v1/vitals/{vital_id}", headers=auth(first_token))
    assert deleted.status_code == 200
    assert client.get("/api/v1/vitals/", headers=auth(first_token)).json()["total"] == 0
    assert first["id"] != second["id"]


def test_dashboard_aggregation_and_risk_validation(client):
    email = "patient-dashboard@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    headers = auth(token)

    client.post(
        "/api/v1/vitals/",
        headers=headers,
        json={
            "measurement_type": "blood_pressure",
            "value_primary": 140,
            "value_secondary": 90,
            "unit": "mmHg",
            "source": "manual",
        },
    )
    dashboard = client.get("/api/v1/health/dashboard", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["latest_vitals"]["blood_pressure"]["value_primary"] == 140

    invalid_risk = client.post(
        "/api/v1/risk/assess",
        headers=headers,
        json={"age": 17, "use_latest_vitals": False},
    )
    assert invalid_risk.status_code == 422

    incomplete_risk = client.post(
        "/api/v1/risk/assess",
        headers=headers,
        json={"use_latest_vitals": False},
    )
    assert incomplete_risk.status_code == 201
    assert incomplete_risk.json()["risk_category"] == "indeterminate"
    assert incomplete_risk.json()["missing_inputs"]


def test_emergency_guidance_is_deterministic_and_authenticated(client):
    email = "patient-emergency@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    response = client.post(
        "/api/v1/emergency/check-symptoms",
        headers=auth(token),
        json={"symptoms": ["chest pain", "shortness of breath"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_life_threatening"] is True
    assert body["classification"] == "EMERGENCY"
    assert body["emergency_number"] == "112"

    unauthenticated = client.post(
        "/api/v1/emergency/check-symptoms",
        json={"symptoms": ["chest pain"]},
    )
    assert unauthenticated.status_code == 403


def test_non_emergency_guidance_does_not_claim_normal_vitals(client):
    email = "patient-monitor@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    response = client.post(
        "/api/v1/emergency/check-symptoms",
        headers=auth(token),
        json={"symptoms": ["mild fatigue"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["classification"] == "MONITOR"
    assert "does not rule out" in " ".join(body["primary_instructions"]).lower()


def test_patient_cannot_access_doctor_routes(client):
    email = "patient-rbac@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    response = client.get("/api/v1/doctor/patients", headers=auth(token))
    assert response.status_code == 403


def test_doctor_provision_verification_and_patient_consent_workflow(client, monkeypatch):
    monkeypatch.setattr(settings, "DOCTOR_PROVISIONING_TOKEN", "test-provisioning-token")
    doctor_email = "doctor-workflow@cardioguard.ai"
    provisioned = client.post(
        "/api/v1/auth/provision-doctor",
        headers={"X-Doctor-Provisioning-Token": "test-provisioning-token"},
        json={
            "email": doctor_email,
            "password": "DoctorStrongPass123!",
            "full_name": "Verified Synthetic Doctor",
            "license_number": "SYN-12345",
            "specialty": "Cardiology",
            "hospital_affiliation": "Synthetic Hospital",
        },
    )
    assert provisioned.status_code == 201
    doctor_id = provisioned.json()["id"]

    unverified = client.post(
        "/api/v1/auth/doctor/login",
        json={"email": doctor_email, "password": "DoctorStrongPass123!"},
    )
    assert unverified.status_code == 401

    patient_email = "patient-consent@cardioguard.ai"
    patient = register(client, patient_email)
    patient_tokens = login(client, patient_email)
    blocked_grant = client.post(
        "/api/v1/patients/access/grant",
        headers=auth(patient_tokens["access_token"]),
        json={"doctor_id": doctor_id},
    )
    assert blocked_grant.status_code == 403

    async def create_admin() -> User:
        admin = User(
            email="admin-workflow@cardioguard.ai",
            hashed_password=get_password_hash("AdminStrongPass123!"),
            full_name="Synthetic Admin",
            role="admin",
            is_active=True,
            is_verified=True,
            is_doctor_verified=True,
        )
        async with client.app.state.test_session_factory() as session:
            session.add(admin)
            await session.commit()
            await session.refresh(admin)
        return admin

    admin = asyncio.run(create_admin())
    admin_tokens = login(client, admin.email, "AdminStrongPass123!")
    verified = client.post(
        f"/api/v1/admin/doctors/{doctor_id}/verify",
        headers=auth(admin_tokens["access_token"]),
        json={"verified": True},
    )
    assert verified.status_code == 200

    doctor_tokens = client.post(
        "/api/v1/auth/doctor/login",
        json={"email": doctor_email, "password": "DoctorStrongPass123!"},
    )
    assert doctor_tokens.status_code == 200

    granted = client.post(
        "/api/v1/patients/access/grant",
        headers=auth(patient_tokens["access_token"]),
        json={"doctor_id": doctor_id},
    )
    assert granted.status_code == 200

    doctor_header = auth(doctor_tokens.json()["access_token"])
    patients = client.get("/api/v1/doctor/patients", headers=doctor_header)
    assert patients.status_code == 200
    assert any(item["patient_id"] == patient["id"] for item in patients.json())

    detail = client.get(f"/api/v1/doctor/patients/{patient['id']}", headers=doctor_header)
    assert detail.status_code == 200
    note = client.post(
        f"/api/v1/doctor/patients/{patient['id']}/notes",
        headers=doctor_header,
        json={"content": "Synthetic clinical follow-up note"},
    )
    assert note.status_code == 201


def test_report_upload_does_not_fabricate_binary_results_or_trust_paths(client, tmp_path):
    email = "patient-report@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    response = client.post(
        "/api/v1/reports/upload",
        headers=auth(token),
        files={"file": ("../../patient-record.pdf", b"%PDF synthetic", "application/pdf")},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending_manual_review"
    report_id = response.json()["report_id"]
    detail = client.get(f"/api/v1/reports/{report_id}", headers=auth(token))
    assert detail.status_code == 200
    assert detail.json()["raw_text"] is None
    assert detail.json()["results"] == []


def test_text_report_extraction_is_traceable_and_confirmable(client):
    email = "patient-text-report@cardioguard.ai"
    register(client, email)
    token = login(client, email)["access_token"]
    response = client.post(
        "/api/v1/reports/upload",
        headers=auth(token),
        files={
            "file": (
                "labs.txt",
                b"Total Cholesterol: 245 mg/dL\nHDL: 42 mg/dL",
                "text/plain",
            )
        },
    )
    assert response.status_code == 201
    report_id = response.json()["report_id"]
    detail = client.get(f"/api/v1/reports/{report_id}", headers=auth(token))
    assert detail.status_code == 200
    result = detail.json()["results"][0]
    assert result["source_excerpt"]
    assert result["extraction_confidence"] == 0.85
    assert result["user_confirmed"] is False

    confirmed = client.patch(
        f"/api/v1/reports/{report_id}/results/{result['id']}/confirmation",
        headers=auth(token),
        json={"confirmed": True},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["user_confirmed"] is True
