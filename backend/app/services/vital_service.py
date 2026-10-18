"""Vital signs validation, physiological range checks, and trend analysis."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.clinical.safety_checks import ClinicalSafetyChecker
from app.models.vital import VitalMeasurement
from app.schemas.vitals import VitalMeasurementCreate, VitalTrendsResponse, VitalTrendPoint

# Acceptable physiological limits for data validation
PHYSIOLOGICAL_LIMITS = {
    "blood_pressure": {"min_primary": 40.0, "max_primary": 300.0, "min_secondary": 20.0, "max_secondary": 200.0},
    "heart_rate": {"min_primary": 25.0, "max_primary": 260.0},
    "weight": {"min_primary": 2.0, "max_primary": 500.0},
    "height": {"min_primary": 40.0, "max_primary": 260.0},
    "blood_glucose": {"min_primary": 15.0, "max_primary": 800.0},
    "hba1c": {"min_primary": 3.0, "max_primary": 20.0},
    "cholesterol_total": {"min_primary": 50.0, "max_primary": 800.0},
    "cholesterol_ldl": {"min_primary": 10.0, "max_primary": 600.0},
    "cholesterol_hdl": {"min_primary": 5.0, "max_primary": 200.0},
    "triglycerides": {"min_primary": 20.0, "max_primary": 3000.0},
    "spo2": {"min_primary": 50.0, "max_primary": 100.0},
    "temperature": {"min_primary": 30.0, "max_primary": 45.0},
}


class VitalService:
    """Business logic for physiological measurement collection and trends."""

    @classmethod
    def validate_measurement_ranges(cls, data: VitalMeasurementCreate) -> None:
        """Validate input values against biological sanity ranges."""
        m_type = data.measurement_type.lower()
        limits = PHYSIOLOGICAL_LIMITS.get(m_type)
        if not limits:
            return

        if "min_primary" in limits and data.value_primary < limits["min_primary"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"value_primary {data.value_primary} is biologically implausible (min: {limits['min_primary']})",
            )
        if "max_primary" in limits and data.value_primary > limits["max_primary"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"value_primary {data.value_primary} is biologically implausible (max: {limits['max_primary']})",
            )

        if data.value_secondary is not None:
            if "min_secondary" in limits and data.value_secondary < limits["min_secondary"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"value_secondary {data.value_secondary} is biologically implausible (min: {limits['min_secondary']})",
                )
            if "max_secondary" in limits and data.value_secondary > limits["max_secondary"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"value_secondary {data.value_secondary} is biologically implausible (max: {limits['max_secondary']})",
                )
            if m_type == "blood_pressure" and data.value_secondary >= data.value_primary:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Diastolic blood pressure (secondary) must be strictly less than systolic pressure (primary)",
                )

    @classmethod
    async def record_measurement(
        cls,
        user_id: str,
        data: VitalMeasurementCreate,
        db: AsyncSession,
    ) -> VitalMeasurement:
        """Validate, store, and evaluate danger thresholds for a new vital."""
        cls.validate_measurement_ranges(data)

        # Check safety thresholds
        safety_eval = ClinicalSafetyChecker.evaluate_vitals(
            measurement_type=data.measurement_type,
            value_primary=data.value_primary,
            value_secondary=data.value_secondary,
        )

        notes = data.notes or ""
        if safety_eval["alerts"]:
            notes = f"[{safety_eval['status']}: {'; '.join(safety_eval['alerts'])}] {notes}".strip()

        measured_at = data.measured_at or datetime.now(timezone.utc)

        measurement = VitalMeasurement(
            user_id=user_id,
            measurement_type=data.measurement_type,
            value_primary=data.value_primary,
            value_secondary=data.value_secondary,
            unit=data.unit,
            source=data.source,
            notes=notes if notes else None,
            measured_at=measured_at,
            is_deleted=False,
        )
        db.add(measurement)
        await db.commit()
        await db.refresh(measurement)
        return measurement

    @classmethod
    async def compute_trends(
        cls,
        user_id: str,
        measurement_type: str,
        db: AsyncSession,
        limit: int = 50,
    ) -> VitalTrendsResponse:
        """Calculate statistical trends and historical time series for charting."""
        query = (
            select(VitalMeasurement)
            .where(
                VitalMeasurement.user_id == user_id,
                VitalMeasurement.measurement_type == measurement_type,
                VitalMeasurement.is_deleted.is_(False),
            )
            .order_by(VitalMeasurement.measured_at.asc())
            .limit(limit)
        )
        result = await db.execute(query)
        records = result.scalars().all()

        if not records:
            return VitalTrendsResponse(
                measurement_type=measurement_type,
                unit="",
                data_points=[],
                average_primary=None,
                average_secondary=None,
                min_primary=None,
                max_primary=None,
            )

        unit = records[0].unit
        points: List[VitalTrendPoint] = []
        primaries: List[float] = []
        secondaries: List[float] = []

        for r in records:
            points.append(
                VitalTrendPoint(
                    timestamp=r.measured_at,
                    value_primary=r.value_primary,
                    value_secondary=r.value_secondary,
                    unit=r.unit,
                )
            )
            primaries.append(r.value_primary)
            if r.value_secondary is not None:
                secondaries.append(r.value_secondary)

        avg_prim = round(sum(primaries) / len(primaries), 2) if primaries else None
        avg_sec = round(sum(secondaries) / len(secondaries), 2) if secondaries else None
        min_prim = round(min(primaries), 2) if primaries else None
        max_prim = round(max(primaries), 2) if primaries else None

        return VitalTrendsResponse(
            measurement_type=measurement_type,
            unit=unit,
            data_points=points,
            average_primary=avg_prim,
            average_secondary=avg_sec,
            min_primary=min_prim,
            max_primary=max_prim,
        )
