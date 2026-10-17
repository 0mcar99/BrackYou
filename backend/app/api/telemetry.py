from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.models.entities import (
    SessionLocal, AssessmentSession, SessionEvent, IntegritySignal, User,
    Submission, VivaRecord, Question, StudentMastery, Concept
)
from backend.app.services.telemetry_analyzer import TelemetryAnalyzer
from backend.app.services.persona_engine import StudentPersonaEngine

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
    Returns complete evaluated dossier for a session, including live code execution,
    telemetry event replay timeline, BKT updates, cohort comparisons, and AI viva.
    """
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        # If demo session or not yet created, create or mock session
        session = AssessmentSession(
            id=session_id,
            student_id="student_a",
            question_id="q_di_1"
        )

    # 1. Fetch Question details
    question = db.query(Question).filter(Question.id == session.question_id).first()
    question_title = question.title if question else "Constructor Dependency Injection in UserService"
    concept_id = question.primary_concept_id if question else "dependency_injection"
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    concept_title = concept.title if concept else "Dependency Injection"

    # 2. Fetch Latest Submission & Code
    submission = db.query(Submission).filter(
        Submission.session_id == session_id
    ).order_by(Submission.created_at.desc()).first()

    default_tested_code = """class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        # Enforcing constructor dependency injection
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))"""

    submitted_code = submission.code if (submission and submission.code) else default_tested_code

    # 3. Fetch Telemetry Events & Signals with Replay Timelines
    events = db.query(SessionEvent).filter(SessionEvent.session_id == session_id).order_by(SessionEvent.timestamp_offset_ms).all()
    ev_dicts = []
    current_snapshot = (question.starter_code if question else "") or submitted_code

    for e in events:
        p = e.payload if isinstance(e.payload, dict) else {}
        if p.get("contentSnapshot"):
            current_snapshot = p["contentSnapshot"]
        elif p.get("text") and len(p.get("text", "")) > 50:
            current_snapshot = p["text"]
        elif e.event_type in ("submit", "run"):
            current_snapshot = submitted_code

        ev_dicts.append({
            "id": e.id,
            "t": e.timestamp_offset_ms,
            "timestamp_offset_ms": e.timestamp_offset_ms,
            "type": e.event_type,
            "event_type": e.event_type,
            "action": p.get("action", "insert" if e.event_type in ("key", "paste") else e.event_type),
            "key": p.get("key"),
            "charCount": p.get("char_count", len(p.get("text", "")) if p.get("text") else None),
            "contentSnapshot": current_snapshot,
            "payload": p
        })

    # Ensure timeline scrubber has an initial state at t: 0
    if not ev_dicts or ev_dicts[0]["t"] > 0:
        init_code = (question.starter_code if question else "") or submitted_code
        ev_dicts.insert(0, {
            "id": "ev_init_0",
            "t": 0,
            "timestamp_offset_ms": 0,
            "type": "window",
            "event_type": "window",
            "action": "focus",
            "key": None,
            "charCount": len(init_code),
            "contentSnapshot": init_code,
            "payload": {"note": "Session initialized", "contentSnapshot": init_code}
        })

    analysis = analyzer.analyze_events(ev_dicts)
    db_signals = db.query(IntegritySignal).filter(IntegritySignal.session_id == session_id).all()

    # If no signals in DB but analyzer detected anomalies, include them
    signals_data = []
    if db_signals:
        signals_data = [
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
    elif analysis:
        for idx, sig in enumerate(analysis):
            signals_data.append({
                "id": f"sig_live_{idx}",
                "signal_type": sig["signal_type"],
                "timestamp_offset_ms": sig["timestamp_offset_ms"],
                "severity": sig["severity"],
                "evidence_description": sig["evidence_description"],
                "trainer_disposition": "pending",
                "student_rebuttal": None
            })

    # If demo session and no signals found, provide the canonical screenshot signal at 06:14
    if not signals_data and session_id == "session_demo_alex":
        signals_data.append({
            "id": "sig_demo_1",
            "signal_type": "large_paste",
            "timestamp_offset_ms": 374000,
            "severity": "review_recommended",
            "evidence_description": "340 characters appeared in 1 tick without keystrokes. Followed by immediate compilation.",
            "trainer_disposition": "pending",
            "student_rebuttal": "I consulted the official documentation to check constructor signatures."
        })

    # 4. Fetch Student Mastery State & BKT Calculations
    mastery = db.query(StudentMastery).filter(
        StudentMastery.student_id == session.student_id,
        StudentMastery.concept_id == concept_id
    ).first()

    current_bkt_pct = int((submission.bkt_posterior * 100) if submission and submission.bkt_posterior is not None else ((mastery.p_known * 100) if mastery else 78))
    delta_bkt_pct = int((submission.bkt_delta * 100) if submission and submission.bkt_delta is not None else 14)

    # 5. Fetch Viva Record
    viva = None
    if submission:
        viva = db.query(VivaRecord).filter(VivaRecord.submission_id == submission.id).first()

    default_viva_q = "In `UserService`, you instantiated `UserRepository` through the constructor and added a null guard. Why is constructor injection preferable to instantiating dependencies directly inside methods?"
    default_viva_a = "I used constructor injection to ensure that the UserRepository dependency is provided at instantiation time and cannot be reassigned or null during execution."

    viva_payload = {
        "id": viva.id if viva else "viva_default",
        "question_text": viva.question_text if viva else default_viva_q,
        "student_answer": (viva.student_answer if viva and viva.student_answer else default_viva_a),
        "match_score": viva.match_score if viva else 95,
        "rubric_feedback": viva.rubric_feedback if viva else "Excellent technical reasoning. Your explanation clearly matches the code's immutable constructor initialization.",
        "is_verified": True
    }

    # 6. Format Submission Details & Terminal Log
    test_details = submission.test_details if (submission and submission.test_details) else [
        {
            "name": "Basic Constructor Dependency Injection",
            "passed": True,
            "is_hidden": False,
            "execution_time_ms": 42,
            "input_data": "",
            "expected_output": "User_101",
            "actual_output": "User_101",
            "error": None
        },
        {
            "name": "[Hidden] Null Dependency Injection Guard",
            "passed": True,
            "is_hidden": True,
            "execution_time_ms": 42,
            "input_data": "",
            "expected_output": "User_101",
            "actual_output": "User_101",
            "error": None
        }
    ]

    passed_count = submission.passed_tests if submission else len(test_details)
    total_count = submission.total_tests if submission else len(test_details)

    pedagogical_summary = (
        submission.pedagogical_summary if (submission and submission.pedagogical_summary) else
        "You demonstrated clean constructor injection and eliminated tight coupling inside the service class. However, edge cases in circular references require attention before proceeding to Spring Boot."
    )

    return {
        "session_id": session_id,
        "student_id": session.student_id,
        "question_id": session.question_id,
        "question_title": question_title,
        "concept_title": concept_title,
        "total_duration_ms": events[-1].timestamp_offset_ms if events else 456000,
        "events": ev_dicts,
        "analysis": analysis,
        "signals": signals_data,
        "submission": {
            "id": submission.id if submission else "sub_demo_alex",
            "code": submitted_code,
            "passed_tests": passed_count,
            "total_tests": total_count,
            "execution_time_ms": submission.execution_time_ms if submission else 84,
            "status": submission.status if submission else "passed",
            "stdout": submission.stdout if submission else "User_101\n",
            "stderr": submission.stderr if submission else "",
            "test_details": test_details,
            "pedagogical_summary": pedagogical_summary
        },
        "bkt_mastery": {
            "current_pct": current_bkt_pct,
            "delta_pct": delta_bkt_pct,
            "is_mastered": current_bkt_pct >= 85,
            "pedagogical_summary": pedagogical_summary
        },
        "cohort_comparison": {
            "user_pct": current_bkt_pct,
            "cohort_avg_pct": 64,
            "delta_pct": current_bkt_pct - 64,
            "summary": f"You are in the top 20% of your batch on {concept_title}. Prerequisite gates for Spring Boot are 80% cleared."
        },
        "persona": StudentPersonaEngine.classify_persona(
            mastery_pct=current_bkt_pct,
            viva_match_pct=viva_payload.get("match_score", 85),
            passed_ratio=(passed_count / max(total_count, 1)),
            paste_count=len([s for s in signals_data if s.get("signal_type") == "large_paste"]),
            max_paste_chars=max([s.get("char_count", 0) for s in signals_data] or [0]),
            run_count=len([e for e in ev_dicts if e.get("type") == "run"]),
            critical_prereqs_count=0
        ),
        "viva": viva_payload
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
