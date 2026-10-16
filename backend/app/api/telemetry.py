from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.models.entities import (
    SessionLocal, AssessmentSession, SessionEvent, IntegritySignal, User
)
from backend.app.services.telemetry_analyzer import TelemetryAnalyzer

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

analyzer = TelemetryAnalyzer()

class EventBatchRequest(BaseModel):
    session_id: str
    events: List[Dict[str, Any]]

class DispositionRequest(BaseModel):
    disposition: str  # 'explained', 'conversation', 'escalated'
    notes: Optional[str] = None

class RebuttalRequest(BaseModel):
    rebuttal: str

@router.post("/events")
def upload_events(req: EventBatchRequest, db=Depends(get_db)):
    """
    Ingests live batched keystroke and browser visibility events
    """
    session = db.query(AssessmentSession).filter(AssessmentSession.id == req.session_id).first()
    if not session:
        # Create session container if not existing
        session = AssessmentSession(
            id=req.session_id,
            student_id="student_a",
            question_id="q_di_1"
        )
        db.add(session)
        db.commit()

    db_events = []
    for ev in req.events:
        db_events.append(SessionEvent(
            session_id=req.session_id,
            timestamp_offset_ms=ev.get("offsetMs", ev.get("timestamp_offset_ms", 0)),
            event_type=ev.get("type", ev.get("event_type", "key")),
            payload=ev.get("payload", ev)
        ))

    db.add_all(db_events)
    db.commit()

    return {"status": "success", "ingested_count": len(db_events)}

@router.get("/session/{session_id}/replay")
def get_session_replay(session_id: str, db=Depends(get_db)):
    """
    Returns ordered event timeline for the replay scrubber
    """
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    events = db.query(SessionEvent).filter(SessionEvent.session_id == session_id).order_by(SessionEvent.timestamp_offset_ms).all()
    ev_dicts = [
        {
            "id": e.id,
            "timestamp_offset_ms": e.timestamp_offset_ms,
            "event_type": e.event_type,
            "payload": e.payload
        }
        for e in events
    ]

    analysis = analyzer.analyze_events(ev_dicts)
    db_signals = db.query(IntegritySignal).filter(IntegritySignal.session_id == session_id).all()

    return {
        "session_id": session.id,
        "student_id": session.student_id,
        "question_id": session.question_id,
        "total_duration_ms": events[-1].timestamp_offset_ms if events else 0,
        "events": ev_dicts,
        "analysis": analysis,
        "signals": [
            {
                "id": s.id,
                "signal_type": s.signal_type,
                "timestamp_offset_ms": s.timestamp_offset_ms,
                "severity": s.severity,
                "evidence_description": s.evidence_description,
                "trainer_disposition": s.trainer_disposition,
                "student_rebuttal": s.student_rebuttal
            }
            for s in db_signals
        ]
    }

@router.post("/signals/{signal_id}/disposition")
def update_signal_disposition(signal_id: str, req: DispositionRequest, db=Depends(get_db)):
    """
    Human-in-the-loop review disposition
    """
    sig = db.query(IntegritySignal).filter(IntegritySignal.id == signal_id).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")

    sig.trainer_disposition = req.disposition
    db.commit()
    return {"status": "updated", "signal_id": sig.id, "disposition": sig.trainer_disposition}

@router.post("/signals/{signal_id}/rebuttal")
def add_student_rebuttal(signal_id: str, req: RebuttalRequest, db=Depends(get_db)):
    sig = db.query(IntegritySignal).filter(IntegritySignal.id == signal_id).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")

    sig.student_rebuttal = req.rebuttal
    db.commit()
    return {"status": "rebuttal_saved", "signal_id": sig.id}
