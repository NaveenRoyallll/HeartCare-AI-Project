"""Central API router aggregating all v1 sub-routers."""
from fastapi import APIRouter
from app.api.routes import (
    auth,
    users,
    vitals,
    risk,
    medical_history,
    emergency,
    medications,
    reports,
    doctor,
    health,
    lifestyle,
    assessments,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(vitals.router)
api_router.include_router(risk.router)
api_router.include_router(medical_history.router)
api_router.include_router(emergency.router)
api_router.include_router(medications.router)
api_router.include_router(reports.router)
api_router.include_router(doctor.router)
api_router.include_router(health.router)
api_router.include_router(lifestyle.router)
api_router.include_router(assessments.router)
