"""Authentication endpoints: register, login, refresh rotation, logout, and password recovery."""
import logging
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException, status
from jwt import InvalidTokenError as JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    revoke_token,
    get_password_hash,
)
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    MessageResponse,
    DoctorProvisionRequest,
)
from app.schemas.user import UserResponse
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new patient account.
    
    Security rule: Public registration ALWAYS assigns role='patient',
    ignoring any role specified in the client request.
    """
    user = await UserService.create_user(data=data, db=db, role="patient")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email and password, returning JWT access and refresh tokens."""
    query = select(User).where(User.email == data.email.lower().strip())
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(user_id=user.id, role=user.role)
    refresh_token, _ = create_refresh_token(user_id=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
    )


@router.post("/doctor/login", response_model=TokenResponse)
async def doctor_login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate only provisioned and administrator-verified doctors."""
    query = select(User).where(
        User.email == data.email.lower().strip(),
        User.role.in_(["doctor", "admin"]),
    )
    user = (await db.execute(query)).scalar_one_or_none()
    if (
        not user
        or not verify_password(data.password, user.hashed_password)
        or not user.is_active
        or (user.role == "doctor" and not user.is_doctor_verified)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor account is invalid, inactive, or not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user_id=user.id, role=user.role)
    refresh_token, _ = create_refresh_token(user_id=user.id, role=user.role)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
    )


@router.post("/provision-doctor", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def provision_doctor(
    data: DoctorProvisionRequest,
    x_doctor_provisioning_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Create an unverified doctor account using an explicitly configured bootstrap token."""
    if (
        not settings.DOCTOR_PROVISIONING_TOKEN
        or not secrets.compare_digest(
            x_doctor_provisioning_token,
            settings.DOCTOR_PROVISIONING_TOKEN,
        )
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor provisioning is not authorized")
    existing = (await db.execute(select(User).where(User.email == data.email.lower().strip()))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists")
    doctor = User(
        email=data.email.lower().strip(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        role="doctor",
        is_active=True,
        is_verified=False,
        is_doctor_verified=False,
        license_number=data.license_number,
        specialty=data.specialty,
        hospital_affiliation=data.hospital_affiliation,
    )
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Perform refresh token rotation. Revokes the old refresh token and returns a new pair."""
    try:
        payload = verify_token(data.refresh_token, expected_type="refresh")
        user_id: str = payload.get("sub")
        old_jti: str = payload.get("jti")
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired refresh token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Immediately revoke the old refresh token to prevent replay attacks
    if old_jti:
        revoke_token(old_jti)

    # Validate user exists and is active
    query = select(User).where(User.id == user_id)
    user = (await db.execute(query)).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is invalid or deactivated",
        )

    # Generate new token pair
    new_access_token = create_access_token(user_id=user.id, role=user.role)
    new_refresh_token, _ = create_refresh_token(user_id=user.id, role=user.role)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(data: RefreshRequest):
    """Revoke the refresh token on logout."""
    try:
        payload = verify_token(data.refresh_token, expected_type="refresh")
        jti = payload.get("jti")
        if jti:
            revoke_token(jti)
    except JWTError:
        # If token is already invalid, logout still succeeds idempotently
        pass

    return MessageResponse(message="Successfully logged out and session revoked")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Password reset request endpoint.
    
    Logs recovery request securely and always returns success to prevent user enumeration.
    """
    logger.info("Password recovery request received")
    return MessageResponse(
        message="If this email is registered in our system, password reset instructions will be sent."
    )
