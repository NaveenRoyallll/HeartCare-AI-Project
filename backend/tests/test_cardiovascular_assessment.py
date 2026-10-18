import asyncio
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.user import User
from app.services.cardiovascular_assessment_service import CardiovascularAssessmentService
from app.services.emergency_service import EmergencyService


async def _session(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'assessment.db'}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, factory


def test_missing_longitudinal_data_is_explicit(tmp_path):
    async def run():
        engine, factory = await _session(tmp_path)
        async with factory() as db:
            user = User(email="assessment@example.com", hashed_password="x", full_name="Test")
            db.add(user)
            await db.commit()
            result = await CardiovascularAssessmentService().evaluate(
                user.id, {"symptoms": [], "heart_rate": 72}, db
            )
            assert result.assessment_kind == "longitudinal_risk"
            assert "blood_pressure_history" in result.missing_inputs
            assert result.data_quality == "limited"
        await engine.dispose()

    asyncio.run(run())


def test_emergency_symptoms_override_normal_vitals(tmp_path):
    async def run():
        engine, factory = await _session(tmp_path)
        async with factory() as db:
            user = User(email="emergency@example.com", hashed_password="x", full_name="Test")
            db.add(user)
            await db.commit()
            result = await CardiovascularAssessmentService().evaluate(
                user.id,
                {"symptoms": ["chest pain", "shortness of breath"], "heart_rate": 72, "systolic_bp": 120},
                db,
            )
            assert result.assessment_kind == "acute_triage"
            assert result.classification == "EMERGENCY"
            assert result.emergency_guidance
        await engine.dispose()

    asyncio.run(run())


def test_provider_outage_uses_deterministic_safety_fallback(tmp_path):
    class FailingEmergencyService(EmergencyService):
        async def triage_symptoms(self, **kwargs):
            raise RuntimeError("provider unavailable")

    async def run():
        engine, factory = await _session(tmp_path)
        async with factory() as db:
            user = User(email="provider-outage@example.com", hashed_password="x", full_name="Test")
            db.add(user)
            await db.commit()
            result = await CardiovascularAssessmentService(FailingEmergencyService()).evaluate(
                user.id,
                {"symptoms": ["chest pain"], "heart_rate": 72, "systolic_bp": 120, "diastolic_bp": 75},
                db,
            )
            assert result.classification == "EMERGENCY"
            assert any("provider was unavailable" in item for item in result.uncertainty)
        await engine.dispose()

    asyncio.run(run())
