"""
UrbanPulse Security & RBAC
Implements HMAC-SHA256 JWT tokens and role verification using Python standard library.
"""

import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.config import settings

security = HTTPBearer(auto_error=False)

ROLES = ["admin", "planner", "field_crew", "viewer", "citizen"]

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64_decode(data_str: str) -> bytes:
    padding = "=" * ((4 - len(data_str) % 4) % 4)
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(data: dict, expires_delta_seconds: Optional[int] = None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    expire = now + (expires_delta_seconds if expires_delta_seconds else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload.update({"iat": now, "exp": expire})
    
    encoded_header = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_sig = _b64_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

def verify_token(token: str) -> Dict[str, Any]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token")
        
        encoded_header, encoded_payload, encoded_sig = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        
        if not hmac.compare_digest(_b64_encode(expected_sig), encoded_sig):
            raise ValueError("Invalid signature")
        
        payload = json.loads(_b64_decode(encoded_payload).decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token expired")
            
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    if not credentials:
        # Default anonymous/viewer role in dev mode
        return {"sub": "guest", "role": "viewer", "name": "Guest Viewer"}
    return verify_token(credentials.credentials)

def require_role(allowed_roles: list[str]):
    def role_checker(user: Dict[str, Any] = Security(get_current_user)):
        role = user.get("role", "viewer")
        if role not in allowed_roles and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{role}'. Required: {allowed_roles}"
            )
        return user
    return role_checker
