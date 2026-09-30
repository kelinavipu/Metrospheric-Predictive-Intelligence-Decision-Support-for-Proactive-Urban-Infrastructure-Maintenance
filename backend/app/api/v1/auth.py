"""
UrbanPulse Auth Router
JWT login, token renewal, and profile endpoint.
"""

from fastapi import APIRouter, HTTPException, Depends
from backend.app.schemas.schemas import LoginRequest, TokenResponse, UserProfile
from backend.app.core.security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# Demo users for role-based testing
DEMO_USERS = {
    "admin": {"sub": "u-admin", "name": "Sarah Connor", "role": "admin", "password": "password123"},
    "planner": {"sub": "u-planner", "name": "Marcus Vance", "role": "planner", "password": "password123"},
    "crew": {"sub": "u-crew", "name": "Dave Batista", "role": "field_crew", "password": "password123"},
    "viewer": {"sub": "u-viewer", "name": "Alex Mercer", "role": "viewer", "password": "password123"},
    "citizen": {"sub": "u-citizen", "name": "Jane Citizen", "role": "citizen", "password": "password123"},
}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = DEMO_USERS.get(req.username.lower())
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({
        "sub": user["sub"],
        "name": user["name"],
        "role": user["role"]
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"sub": user["sub"], "name": user["name"], "role": user["role"]}
    }

@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "sub": current_user.get("sub", "anonymous"),
        "name": current_user.get("name", "Guest"),
        "role": current_user.get("role", "viewer")
    }
