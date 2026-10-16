from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from backend.app.models.entities import SessionLocal, Concept, ConceptPrerequisite, StudentMastery, Question, User
from backend.app.services.bkt_engine import BKTEngine
from backend.app.services.dag_resolver import DAGResolver

router = APIRouter(prefix="/adaptive", tags=["adaptive"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

bkt_engine = BKTEngine()

@router.get("/mastery/{student_id}")
def get_student_mastery(student_id: str, db=Depends(get_db)):
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    concepts = db.query(Concept).order_by(Concept.difficulty_order).all()
    prereqs = db.query(ConceptPrerequisite).all()
    mastery_records = db.query(StudentMastery).filter(StudentMastery.student_id == student_id).all()

    # Map prereqs: {concept_id: [prerequisite_ids]}
    adj = {}
    for p in prereqs:
        adj.setdefault(p.concept_id, []).append(p.prerequisite_id)

    dag_resolver = DAGResolver(adj)
    raw_mastery_map = {m.concept_id: m.p_known for m in mastery_records}

    # Evaluate each concept status
    concept_states = []
    solid_count = 0
    weak_count = 0
    locked_count = 0

    for c in concepts:
        p_known = raw_mastery_map.get(c.id, 0.10)
        unlocked = dag_resolver.is_unlocked(c.id, raw_mastery_map, threshold=0.70)
        parent_ids = dag_resolver.get_prerequisites(c.id)
        parent_scores = [raw_mastery_map.get(pid, 0.10) for pid in parent_ids]
        effective_p = bkt_engine.apply_gated_penalty(p_known, parent_scores, threshold=0.70) if unlocked else 0.0

        if not unlocked:
            status = "locked"
            locked_count += 1
        elif p_known >= 0.80:
            status = "solid"
            solid_count += 1
        elif p_known >= 0.40:
            status = "weak"
            weak_count += 1
        else:
            status = "critical"
            weak_count += 1

        concept_states.append({
            "concept_id": c.id,
            "title": c.title,
            "module": c.module,
            "difficulty_order": c.difficulty_order,
            "p_known": round(p_known, 2),
            "percentage": int(p_known * 100),
            "effective_percentage": int(effective_p * 100) if unlocked else 0,
            "status": status,
            "is_unlocked": unlocked,
            "prerequisites": parent_ids
        })

    # Overall cohort average calculation
    overall_pct = int(sum(cs["percentage"] for cs in concept_states) / max(len(concept_states), 1))

    # Find weakest link
    unlocked_concepts = [cs for cs in concept_states if cs["is_unlocked"]]
    unlocked_concepts.sort(key=lambda cs: cs["p_known"])
    weakest_link = unlocked_concepts[0] if unlocked_concepts else None

    return {
        "student_id": user.id,
        "student_name": user.name,
        "overall_mastery_pct": overall_pct,
        "solid_count": solid_count,
        "weak_count": weak_count,
        "locked_count": locked_count,
        "weakest_link": weakest_link,
        "concept_states": concept_states
    }

@router.get("/next-activity/{student_id}")
def get_next_activity(
    student_id: str, 
    target_concept_id: str = Query("dependency_injection"), 
    db=Depends(get_db)
):
    """
    Core Adaptive Logic:
    Demonstrates Student A vs Student B path divergence.
    """
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    concepts = db.query(Concept).all()
    concept_meta = {c.id: {"title": c.title, "module": c.module} for c in concepts}
    prereqs = db.query(ConceptPrerequisite).all()
    mastery_records = db.query(StudentMastery).filter(StudentMastery.student_id == student_id).all()

    adj = {}
    for p in prereqs:
        adj.setdefault(p.concept_id, []).append(p.prerequisite_id)

    dag_resolver = DAGResolver(adj)
    mastery_map = {m.concept_id: m.p_known for m in mastery_records}

    recommendation = dag_resolver.recommend_next_activity(
        target_concept=target_concept_id,
        mastery_map=mastery_map,
        concept_metadata=concept_meta,
        threshold=0.70
    )

    # Fetch appropriate question for recommended concept
    rec_concept_id = recommendation["recommended_concept_id"]
    question = db.query(Question).filter(Question.primary_concept_id == rec_concept_id).first()
    if not question:
        # Fallback to general question
        question = db.query(Question).first()

    return {
        "student_id": user.id,
        "student_name": user.name,
        "target_concept_id": target_concept_id,
        "recommendation": recommendation,
        "question": {
            "id": question.id,
            "title": question.title,
            "prompt": question.prompt,
            "difficulty": question.difficulty,
            "starter_code": question.starter_code,
            "language": question.language,
            "primary_concept_id": question.primary_concept_id
        }
    }
