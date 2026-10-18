"""Authentication, password hashing, and JWT security utilities."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set
from uuid import uuid4
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory revocation store for JWT tokens (fallback when Redis is not available)
_in_memory_revoked_jtis: Set[str] = set()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a plain-text password."""
    return pwd_context.hash(password)


def create_access_token(
    user_id: str,
    role: str = "patient",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create a short-lived JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid4()),
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    user_id: str,
    role: str = "patient",
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str]:
    """Create a long-lived JWT refresh token with unique jti for rotation tracking.
    
    Returns:
        tuple[str, str]: (encoded_jwt_token, jti)
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    jti = str(uuid4())
    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": jti,
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt, jti


def revoke_token(jti: str) -> None:
    """Mark a token JTI as revoked."""
    if not jti:
        return
    _in_memory_revoked_jtis.add(jti)


def is_token_revoked(jti: str) -> bool:
    """Check if token JTI has been revoked."""
    if not jti:
        return True
    return jti in _in_memory_revoked_jtis


def verify_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode and validate a JWT token.
    
    Raises:
        JWTError: If signature is invalid, token expired, or jti is revoked.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise e

    # Check token revocation
    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise JWTError("Token has been revoked")

    # Validate token type (access vs refresh)
    if expected_type:
        token_type = payload.get("type")
        if token_type != expected_type:
            raise JWTError(f"Invalid token type: expected {expected_type}, got {token_type}")

    return payload
