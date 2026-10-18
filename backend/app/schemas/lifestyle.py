"""Lifestyle tracking schemas."""
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LifestyleLogCreate(BaseModel):
    log_type: str = Field(..., description="activity, sleep, diet, stress, hydration")
    value_numeric: Optional[float] = None
    unit: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    logged_date: Optional[date] = None


class LifestyleLogResponse(BaseModel):
    id: str
    user_id: str
    log_type: str
    value_numeric: Optional[float] = None
    unit: Optional[str] = None
    details_json: Dict[str, Any]
    notes: Optional[str] = None
    logged_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class LifestyleGoalCreate(BaseModel):
    goal_type: str = Field(..., description="e.g. daily_steps, sleep_hours, sodium_mg")
    target_value: float
    unit: str
    period: str = Field("daily", description="daily, weekly")
    is_active: bool = True


class LifestyleGoalUpdate(BaseModel):
    target_value: Optional[float] = None
    unit: Optional[str] = None
    period: Optional[str] = None
    is_active: Optional[bool] = None


class LifestyleGoalResponse(BaseModel):
    id: str
    user_id: str
    goal_type: str
    target_value: float
    unit: str
    period: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
