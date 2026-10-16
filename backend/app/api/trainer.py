from fastapi import APIRouter, Depends
from backend.app.models.entities import (
    SessionLocal, User, Concept, StudentMastery, AssessmentSession,
    IntegritySignal, Submission
)
from backend.app.services.persona_engine import StudentPersonaEngine

router = APIRouter(prefix="/trainer", tags=["trainer"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/cohort-heatmap")
def get_cohort_heatmap(db=Depends(get_db)):
    """
    Returns the Cohort Mastery Heatmap (students x concepts)
    """
    students = db.query(User).filter(User.role == "student").all()
    concepts = db.query(Concept).order_by(Concept.difficulty_order).all()
    masteries = db.query(StudentMastery).all()

    # Build lookup: (student_id, concept_id) -> p_known
    mastery_lookup = {(m.student_id, m.concept_id): m.p_known for m in masteries}

    matrix = []
    for s in students:
        s_scores = [mastery_lookup.get((s.id, c.id), 0.10) for c in concepts]
        s_avg = int((sum(s_scores) / max(len(s_scores), 1)) * 100)
        critical_count = sum(1 for sc in s_scores if sc < 0.40)

        # Check integrity signals
        has_flag = db.query(IntegritySignal).join(
            AssessmentSession, IntegritySignal.session_id == AssessmentSession.id
        ).filter(AssessmentSession.student_id == s.id).count() > 0

        persona_info = StudentPersonaEngine.classify_persona(
            mastery_pct=s_avg,
            viva_match_pct=95 if s_avg >= 75 else 70,
            passed_ratio=1.0 if s_avg >= 70 else 0.5,
            paste_count=1 if has_flag else 0,
            max_paste_chars=340 if has_flag else 0,
            run_count=3,
            critical_prereqs_count=critical_count
        )

        row = {
            "student_id": s.id,
            "student_name": s.name,
            "email": s.email,
            "phone_number": s.phone_number or "",
            "average_mastery": s_avg,
            "persona": persona_info,
            "concepts": {}
        }
        for c in concepts:
            score = mastery_lookup.get((s.id, c.id), 0.10)
            if score >= 0.80:
                status = "solid"
            elif score >= 0.40:
                status = "weak"
            else:
                status = "critical"
            row["concepts"][c.id] = {
                "score": round(score, 2),
                "percentage": int(score * 100),
                "status": status
            }
        matrix.append(row)

    # Class-wide concept averages
    concept_averages = []
    for c in concepts:
        scores = [mastery_lookup.get((s.id, c.id), 0.10) for s in students]
        avg = sum(scores) / max(len(scores), 1)
        concept_averages.append({
            "concept_id": c.id,
            "title": c.title,
            "average_pct": int(avg * 100),
            "common_blocker": avg < 0.50
        })

    return {
        "concepts": [{"id": c.id, "title": c.title, "module": c.module} for c in concepts],
        "students": matrix,
        "concept_averages": concept_averages
    }

@router.get("/at-risk")
def get_at_risk_students(db=Depends(get_db)):
    """
    Identifies students with critical prerequisite gaps
    """
    students = db.query(User).filter(User.role == "student").all()
    at_risk = []

    for s in students:
        critical_masteries = db.query(StudentMastery).filter(
            StudentMastery.student_id == s.id,
            StudentMastery.p_known < 0.40
        ).all()

        if critical_masteries:
            weak_concepts = [m.concept_id for m in critical_masteries]
            at_risk.append({
                "student_id": s.id,
                "student_name": s.name,
                "critical_concepts": weak_concepts,
                "reason": f"Struggling with {len(weak_concepts)} prerequisite concept(s). Blocked on advancing."
            })

    return at_risk

@router.get("/reviews")
def get_integrity_review_queue(db=Depends(get_db)):
    """
    Returns submissions flagged for human review
    """
    signals = db.query(IntegritySignal).all()
    sessions = db.query(AssessmentSession).all()
    sess_map = {s.id: s for s in sessions}

    reviews = []
    for sig in signals:
        sess = sess_map.get(sig.session_id)
        student_id = sess.student_id if sess else "unknown"
        reviews.append({
            "signal_id": sig.id,
            "session_id": sig.session_id,
            "student_id": student_id,
            "signal_type": sig.signal_type,
            "timestamp_offset_ms": sig.timestamp_offset_ms,
            "severity": sig.severity,
            "evidence_description": sig.evidence_description,
            "trainer_disposition": sig.trainer_disposition,
            "student_rebuttal": sig.student_rebuttal
        })

    return reviews
