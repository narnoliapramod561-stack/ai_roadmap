from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.supabase import get_supabase
from typing import Optional
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])
db = get_supabase()


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(req: RegisterRequest):
    """
    Register a new user via Supabase Auth + insert into users table.
    """
    try:
        # Sign up with Supabase Auth
        auth_res = db.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {
                "data": {"full_name": req.full_name}
            }
        })
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        user_id = auth_res.user.id

        # Upsert into users table
        try:
            db.table("users").upsert({
                "id": user_id,
                "email": req.email,
                "full_name": req.full_name,
            }).execute()
        except Exception as db_err:
            print(f"Warning: users table insert failed: {db_err}")

        return {
            "user_id": user_id,
            "email": req.email,
            "full_name": req.full_name,
            "token": auth_res.session.access_token if auth_res.session else None,
            "message": "Registration successful. Please verify your email if required."
        }

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        if "already registered" in err.lower() or "already exists" in err.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=500, detail=f"Registration failed: {err}")


@router.post("/login")
async def login(req: LoginRequest):
    """
    Login via Supabase Auth and return JWT.
    """
    try:
        auth_res = db.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        if not auth_res.user or not auth_res.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = auth_res.user
        return {
            "access_token": auth_res.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name", ""),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Login failed. Check your credentials.")


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Returns the current logged-in user's profile by decoding the JWT.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        user_resp = db.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user = user_resp.user
        full_name = user.user_metadata.get("full_name", "") if user.user_metadata else ""
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")
