from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.models.entities import SessionLocal, User, Submission, AssessmentSession, StudentMastery, IntegritySignal, VivaRecord
from backend.app.services.sheetdb_service import SheetDBService
from backend.app.services.persona_engine import StudentPersonaEngine

router = APIRouter(prefix="/sheetdb", tags=["sheetdb"])
sheetdb_svc = SheetDBService()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SheetDBConfigRequest(BaseModel):
    api_url: str

@router.get("/status")
def get_status():
    url = sheetdb_svc.get_api_url()
    is_set = bool(url)
    masked = f"{url[:28]}...{url[-6:]}" if is_set and len(url) > 34 else (url if is_set else "Not configured")
    return {
        "configured": is_set,
        "masked_url": masked,
        "raw_url": url,
        "sample_url": "https://sheetdb.io/api/v1/your_api_id"
    }

@router.post("/config")
def save_config(req: SheetDBConfigRequest):
    clean = req.api_url.strip()
    if not clean.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with https://sheetdb.io/api/v1/...")
    sheetdb_svc.set_api_url(clean)
    return {
        "status": "success",
        "message": "SheetDB API URL saved successfully.",
        "configured": True
    }

@router.post("/sync")
def sync_all(db=Depends(get_db)):
    """
    Exports all current students and their learning/assessment records to SheetDB Google Sheet
    """
    if not sheetdb_svc.is_configured():
        return {
            "success": False,
            "message": "SheetDB is not configured yet. Enter your SheetDB API URL first."
        }

    students = db.query(User).filter(User.role == "student").all()
    rows = []

    for s in students:
        # Get latest submission
        sess = db.query(AssessmentSession).filter(AssessmentSession.student_id == s.id).order_by(AssessmentSession.started_at.desc()).first()
        sub = db.query(Submission).filter(Submission.session_id == sess.id).first() if sess else None
        viva = db.query(VivaRecord).filter(VivaRecord.submission_id == sub.id).first() if sub else None
        signals_count = db.query(IntegritySignal).filter(IntegritySignal.session_id == sess.id).count() if sess else 0

        # Masteries
        masteries = db.query(StudentMastery).filter(StudentMastery.student_id == s.id).all()
        avg_mastery = int((sum(m.p_known for m in masteries) / max(len(masteries), 1)) * 100)
        critical_count = len([m for m in masteries if m.p_known < 0.40])

        persona_data = StudentPersonaEngine.classify_persona(
            mastery_pct=avg_mastery,
            viva_match_pct=viva.match_score if viva else 80,
            passed_ratio=(sub.passed_tests / max(sub.total_tests, 1)) if sub else 0.5,
            paste_count=1 if signals_count > 0 else 0,
            max_paste_chars=340 if signals_count > 0 else 0,
            run_count=3,
            critical_prereqs_count=critical_count
        )

        rows.append({
            "Timestamp": s.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if s.created_at else "2026-10-17 00:00:00 UTC",
            "Event_Type": "FULL_SYNC_RECORD",
            "User_ID": s.id,
            "Name": s.name,
            "Email": s.email,
            "Phone": s.phone_number or "N/A",
            "Role": s.role,
            "Persona_Classification": persona_data["persona_title"],
            "Qualification_Status": persona_data["qualification_verdict"],
            "Activity_Details": f"Mastery: {avg_mastery}% across {len(masteries)} concepts. {persona_data['qualification_summary']}",
            "Score_Or_Mastery": f"{avg_mastery}%",
            "Integrity_Flags": f"{signals_count} flag(s)" if signals_count > 0 else "Clean"
        })

    result = sheetdb_svc._send_payload(rows)
    return {
        "status": "success" if result.get("success") else "error",
        "synced_records": len(rows),
        "sheetdb_result": result
    }
