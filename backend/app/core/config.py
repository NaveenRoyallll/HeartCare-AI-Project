"""Application configuration management using Pydantic Settings."""
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # General Application Settings
    APP_ENV: str = "development"
    APP_NAME: str = "CardioGuard AI"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./cardioguard.db"
    REDIS_URL: Optional[str] = None

    # Security & JWT
    JWT_SECRET_KEY: str = "dev-super-secret-jwt-key-change-in-production-cardioguard-2026-32charmin"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DOCTOR_PROVISIONING_TOKEN: Optional[str] = None

    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # File Storage
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "./uploads"
    UPLOAD_MAX_SIZE_MB: int = 15

    # Optional AI / LLM Integrations
    LLM_PROVIDER: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: Optional[str] = None

    # Emergency Configuration
    EMERGENCY_NUMBER: str = "112"
    EMERGENCY_NUMBER_LABEL: str = "National Emergency Hotline (112)"

    # Logging
    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.APP_ENV.lower() in {"production", "prod"}:
            if (
                self.JWT_SECRET_KEY.startswith("dev-")
                or len(self.JWT_SECRET_KEY) < 32
            ):
                raise ValueError("JWT_SECRET_KEY must be a strong non-development secret in production")
            if not self.DOCTOR_PROVISIONING_TOKEN:
                raise ValueError("DOCTOR_PROVISIONING_TOKEN must be configured in production")
            if self.DEBUG:
                raise ValueError("DEBUG must be disabled in production")
            if any("localhost" in origin or "127.0.0.1" in origin for origin in self.CORS_ORIGINS):
                raise ValueError("Development CORS origins must not be configured in production")
        return self


settings = Settings()
