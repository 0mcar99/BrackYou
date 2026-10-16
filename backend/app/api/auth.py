from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.models.entities import SessionLocal, User

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class LoginRequest(BaseModel):
    user_id: str

@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "token": f"bearer_{user.id}_token"
    }

@router.get("/users")
def list_users(db=Depends(get_db)):
    users = db.query(User).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
        for u in users
    ]
