import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.app.models.entities import SessionLocal, Submission, VivaRecord
from backend.app.services.viva_engine import VivaEngine

router = APIRouter(prefix="/viva", tags=["viva"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

viva_engine = VivaEngine()

class GenerateVivaRequest(BaseModel):
    submission_id: str
    concept_title: Optional[str] = "Object-Oriented Programming"

class AnswerVivaRequest(BaseModel):
    submission_id: str
    question_text: str
    student_answer: str
    key_concepts: Optional[List[str]] = None

@router.post("/generate")
def generate_viva_questions(req: GenerateVivaRequest, db=Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == req.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    questions = viva_engine.generate_questions(sub.code, req.concept_title)
    return {
        "submission_id": sub.id,
        "questions": questions
    }

@router.post("/evaluate")
def evaluate_viva_answer(req: AnswerVivaRequest, db=Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == req.submission_id).first()
    sub_code = sub.code if sub else ""

    q_dict = {
        "question": req.question_text,
        "key_concepts": req.key_concepts or ["dependency injection", "immutability", "encapsulation", "constructor", "null", "coupling"]
    }
    result = viva_engine.evaluate_answer(q_dict, req.student_answer, sub_code)

    viva_id = f"viva_{uuid.uuid4().hex[:10]}"
    if sub:
        viva_record = VivaRecord(
            id=viva_id,
            submission_id=sub.id,
            question_text=req.question_text,
            student_answer=req.student_answer,
            match_score=result["match_score"],
            rubric_feedback=result["feedback"],
            evaluated_at=datetime.now(timezone.utc)
        )
        db.add(viva_record)
        db.commit()

    return {
        "viva_id": viva_id,
        "submission_id": req.submission_id,
        "match_score": result["match_score"],
        "status": result["status"],
        "feedback": result["feedback"],
        "rubric_feedback": result["feedback"],
        "concept_solid": result["concept_solid"]
    }
