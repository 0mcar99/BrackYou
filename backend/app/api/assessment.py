import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.app.models.entities import (
    SessionLocal, Question, HiddenTestCase, AssessmentSession,
    Submission, StudentMastery, Concept
)
from backend.app.services.sandbox import HardenedSandbox
from backend.app.services.bkt_engine import BKTEngine

router = APIRouter(prefix="/assessment", tags=["assessment"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

sandbox = HardenedSandbox(timeout_sec=3.0)
bkt = BKTEngine()

class RunRequest(BaseModel):
    code: str
    language: str
    question_id: Optional[str] = None
    custom_input: Optional[str] = None

class SubmitRequest(BaseModel):
    session_id: Optional[str] = None
    student_id: str
    question_id: str
    code: str
    language: str

@router.get("/questions")
def get_questions(db=Depends(get_db)):
    questions = db.query(Question).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "prompt": q.prompt,
            "difficulty": q.difficulty,
            "language": q.language,
            "primary_concept_id": q.primary_concept_id
        }
        for q in questions
    ]

@router.get("/questions/{question_id}")
def get_question_detail(question_id: str, db=Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    test_cases = db.query(HiddenTestCase).filter(HiddenTestCase.question_id == question_id).all()
    sample_tests = [
        {
            "name": tc.name,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_hidden": tc.is_hidden
        }
        for tc in test_cases if not tc.is_hidden
    ]

    return {
        "id": q.id,
        "title": q.title,
        "prompt": q.prompt,
        "starter_code": q.starter_code,
        "difficulty": q.difficulty,
        "language": q.language,
        "primary_concept_id": q.primary_concept_id,
        "sample_test_cases": sample_tests,
        "total_test_count": len(test_cases)
    }

@router.post("/run")
def run_code(req: RunRequest, db=Depends(get_db)):
    """
    Dry-run code against sample test cases or custom input
    """
    tc_dicts = []
    if req.question_id:
        test_cases = db.query(HiddenTestCase).filter(
            HiddenTestCase.question_id == req.question_id,
            HiddenTestCase.is_hidden == False
        ).all()
        tc_dicts = [
            {
                "name": tc.name,
                "input_data": tc.input_data,
                "expected_output": tc.expected_output,
                "is_hidden": False
            }
            for tc in test_cases
        ]

    result = sandbox.run_test_suite(
        req.code, 
        req.language, 
        tc_dicts, 
        custom_input=req.custom_input
    )
    return result

class HintRequest(BaseModel):
    question_id: str
    code: str
    language: Optional[str] = "python"
    error_message: Optional[str] = None

@router.post("/hint")
def get_socratic_hint(req: HintRequest, db=Depends(get_db)):
    """
    Generates real-time Socratic hints analyzing syntax errors, test errors, or code logic
    """
    q = db.query(Question).filter(Question.id == req.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    code_clean = req.code.strip()
    
    # 1. Syntax error hint
    syntax_err = sandbox.validate_syntax(req.code, req.language or "python")
    if syntax_err:
        return {
            "type": "syntax",
            "hint": f"Look closely at line {syntax_err['line']}: {syntax_err['message']}. Check for missing colons, unbalanced brackets, or indentation.",
            "line": syntax_err["line"]
        }

    # 2. Conceptual Socratic hints based on question concept
    if q.primary_concept_id == "dependency_injection":
        if "repo = None" in code_clean or "self.repo = None" in code_clean:
            return {
                "type": "concept",
                "hint": "Notice how the repository can still be initialized to null/None. How can you ensure the dependency is strictly validated in the constructor so it is never null at runtime?"
            }
        if "UserRepository()" in code_clean and "class UserService" in code_clean:
            return {
                "type": "concept",
                "hint": "Check where UserRepository is being created. Direct instantiation inside the class couples your service to a concrete implementation. How can the constructor accept the instance from outside instead?"
            }
        return {
            "type": "concept",
            "hint": "Constructor injection means dependencies are passed into __init__ as arguments and stored in private/protected instance attributes."
        }

    elif q.primary_concept_id == "inheritance":
        if "super(" not in code_clean and "Shape" in code_clean:
            return {
                "type": "concept",
                "hint": "Does your subclass properly inherit the base class methods and define custom area calculation formulas for each geometric shape?"
            }
        return {
            "type": "concept",
            "hint": "Verify that your subclasses override the area() method defined in the parent Shape class."
        }

    elif q.primary_concept_id == "classes_objects":
        if "initial_balance < 0" not in code_clean:
            return {
                "type": "concept",
                "hint": "Consider edge cases: what should happen if someone tries to create an account with a negative starting balance?"
            }
        return {
            "type": "concept",
            "hint": "Ensure internal balance is encapsulated (e.g., _balance) and modified only through deposit() and withdraw() methods."
        }

    return {
        "type": "general",
        "hint": "Break the problem down: test the basic happy path first, then test edge cases like null, negative values, and zero boundaries."
    }

@router.post("/submit")
def submit_code(req: SubmitRequest, db=Depends(get_db)):
    """
    Final submission: runs sandbox against hidden test cases and updates student BKT mastery
    """
    q = db.query(Question).filter(Question.id == req.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    test_cases = db.query(HiddenTestCase).filter(HiddenTestCase.question_id == req.question_id).all()
    tc_dicts = [
        {
            "name": tc.name,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_hidden": tc.is_hidden
        }
        for tc in test_cases
    ]

    # Execute inside isolated sandbox
    exec_result = sandbox.run_test_suite(req.code, req.language, tc_dicts)

    # Resolve or create assessment session
    session_id = req.session_id or f"session_{uuid.uuid4().hex[:12]}"
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        session = AssessmentSession(
            id=session_id,
            student_id=req.student_id,
            question_id=req.question_id,
            started_at=datetime.now(timezone.utc),
            submitted_at=datetime.now(timezone.utc),
            status="completed"
        )
        db.add(session)
    else:
        session.submitted_at = datetime.now(timezone.utc)
        session.status = "completed"

    submission_id = f"sub_{uuid.uuid4().hex[:12]}"
    submission = Submission(
        id=submission_id,
        session_id=session.id,
        code=req.code,
        passed_tests=exec_result["passed_count"],
        total_tests=exec_result["total_count"],
        execution_time_ms=exec_result["execution_time_ms"],
        status=exec_result["status"],
        stdout=exec_result.get("stdout", ""),
        stderr=exec_result.get("stderr", ""),
        test_details=exec_result.get("test_details", [])
    )
    db.add(submission)

    # Bayesian Knowledge Tracing Mastery Update
    is_fully_correct = (exec_result["passed_count"] == exec_result["total_count"]) and (exec_result["status"] == "passed")
    concept_id = q.primary_concept_id
    mastery_record = db.query(StudentMastery).filter(
        StudentMastery.student_id == req.student_id,
        StudentMastery.concept_id == concept_id
    ).first()

    prior_p = mastery_record.p_known if mastery_record else 0.15
    next_p = bkt.update_posterior(prior_p, is_fully_correct)

    if mastery_record:
        mastery_record.p_known = next_p
        mastery_record.evidence_count += 1
        mastery_record.confidence = bkt.calculate_confidence(mastery_record.evidence_count)
        mastery_record.last_updated = datetime.now(timezone.utc)
    else:
        mastery_record = StudentMastery(
            student_id=req.student_id,
            concept_id=concept_id,
            p_known=next_p,
            evidence_count=1,
            confidence="low"
        )
        db.add(mastery_record)

    db.commit()

    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    concept_title = concept.title if concept else concept_id
    explanation = bkt.explain_change(prior_p, next_p, is_fully_correct, concept_title)

    return {
        "submission_id": submission.id,
        "session_id": session.id,
        "status": exec_result["status"],
        "passed_tests": exec_result["passed_count"],
        "total_tests": exec_result["total_count"],
        "execution_time_ms": exec_result["execution_time_ms"],
        "stdout": exec_result.get("stdout", ""),
        "stderr": exec_result.get("stderr", ""),
        "test_details": exec_result.get("test_details", []),
        "mastery_update": {
            "concept_id": concept_id,
            "concept_title": concept_title,
            "prior_pct": int(prior_p * 100),
            "next_pct": int(next_p * 100),
            "delta_pct": int((next_p - prior_p) * 100),
            "explanation": explanation
        }
    }
