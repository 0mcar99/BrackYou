import uuid
import re
import hashlib
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from backend.app.models.entities import SessionLocal, User, Concept, StudentMastery
from backend.app.services.sheetdb_service import SheetDBService

router = APIRouter(prefix="/auth", tags=["auth"])
sheetdb_svc = SheetDBService()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    """Secure PBKDF2-HMAC-SHA256 password hashing with salt"""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(stored_hash: Optional[str], password: str) -> bool:
    """Verifies candidate password against stored hash"""
    if not stored_hash or ":" not in stored_hash:
        return False
    try:
        salt, key_hex = stored_hash.split(":", 1)
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(check.hex(), key_hex)
    except Exception:
        return False

# Pydantic Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=7, max_length=25)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "student"

class LoginRequest(BaseModel):
    # identifier can be email, phone number, or demo username (e.g. 'student_a')
    identifier: str
    password: Optional[str] = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db=Depends(get_db)):
    """
    Registers a new student, collecting Name, Phone Number, Email, and Password.
    Automatically seeds initial concept mastery records in the curriculum DAG.
    """
    email_clean = req.email.strip().lower()
    phone_clean = re.sub(r'[\s\-\(\)]', '', req.phone_number.strip())

    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email_clean):
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    if len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number (at least 7 digits).")

    # Check for existing email - smoothly update credentials and sign them in
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        existing_user.name = req.name.strip()
        existing_user.phone_number = phone_clean
        existing_user.password_hash = hash_password(req.password)
        db.commit()

        try:
            sheetdb_svc.log_user_signup(
                user_id=existing_user.id,
                name=existing_user.name,
                email=existing_user.email,
                phone=existing_user.phone_number or "",
                role=existing_user.role
            )
        except Exception as e:
            print(f"[SheetDB] Signup sync skipped: {e}")

        u_data = {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "phone_number": existing_user.phone_number,
            "role": existing_user.role
        }
        return {
            "status": "success",
            "message": f"Welcome, {existing_user.name}! Your account credentials have been updated and you are now signed in.",
            "user_id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "phone_number": existing_user.phone_number,
            "role": existing_user.role,
            "user": u_data,
            "token": f"bearer_{existing_user.id}_token"
        }

    # Check for existing phone number under different email
    existing_phone = db.query(User).filter(User.phone_number == phone_clean).first()
    if existing_phone and existing_phone.email != email_clean:
        raise HTTPException(status_code=400, detail="This phone number is already registered to another email address.")

    user_id = f"user_{uuid.uuid4().hex[:10]}"
    new_user = User(
        id=user_id,
        name=req.name.strip(),
        email=email_clean,
        phone_number=phone_clean,
        password_hash=hash_password(req.password),
        role=req.role or "student",
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()

    # Automatically initialize concept masteries for the new student
    concepts = db.query(Concept).all()
    initial_masteries = [
        StudentMastery(
            student_id=new_user.id,
            concept_id=c.id,
            p_known=0.20 if c.id in ("variables", "methods") else 0.10,
            evidence_count=0,
            confidence="low",
            last_updated=datetime.now(timezone.utc)
        )
        for c in concepts
    ]
    if initial_masteries:
        db.add_all(initial_masteries)
        db.commit()

    # Async log to SheetDB if configured
    try:
        sheetdb_svc.log_user_signup(
            user_id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            phone=new_user.phone_number or "",
            role=new_user.role
        )
    except Exception as e:
        print(f"[SheetDB] Signup sync skipped: {e}")

    new_u_data = {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone_number": new_user.phone_number,
        "role": new_user.role
    }

    return {
        "status": "success",
        "message": f"Welcome {new_user.name}! Your student learning account has been created.",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone_number": new_user.phone_number,
        "role": new_user.role,
        "user": new_u_data,
        "token": f"bearer_{new_user.id}_token"
    }

@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    """
    Authenticates a user via Email, Phone Number, or Demo ID with Password verification.
    """
    ident = req.identifier.strip().lower()
    clean_phone = re.sub(r'[\s\-\(\)]', '', req.identifier.strip())

    # Find user by email, phone, or id
    user = db.query(User).filter(
        (User.id == req.identifier.strip()) |
        (User.email == ident) |
        (User.phone_number == clean_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found matching this email, phone, or ID.")

    # If user has a password hash, verify password
    if user.password_hash:
        if not req.password:
            raise HTTPException(status_code=400, detail="Password is required to sign in.")
        if not verify_password(user.password_hash, req.password):
            raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")
    else:
        # Fallback for seeded demo accounts if accessed without password
        pass

    # Async log to SheetDB if configured
    try:
        sheetdb_svc.log_user_signin(
            user_id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone_number or ""
        )
    except Exception as e:
        print(f"[SheetDB] Login sync skipped: {e}")

    login_u_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number or "",
        "role": user.role
    }

    return {
        "status": "success",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number or "",
        "role": user.role,
        "user": login_u_data,
        "token": f"bearer_{user.id}_token"
    }

@router.get("/me")
def get_current_user(user_id: Optional[str] = None, db=Depends(get_db)):
    """
    Fetches the profile for the currently signed-in user
    """
    if not user_id:
        user_id = "student_a"
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number or "",
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.get("/users")
def list_users(db=Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone_number": u.phone_number or "",
            "role": u.role
        }
        for u in users
    ]
