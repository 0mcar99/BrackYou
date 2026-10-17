from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.services.rag_store import knowledge_store
from backend.app.services.rag_tutor import tutor_engine

router = APIRouter(prefix="/tutor", tags=["tutor"])

class ExplainTestRequest(BaseModel):
    student_id: str
    question_id: str
    code: str
    execution_status: str
    stderr: Optional[str] = ""
    test_details: Optional[List[Dict[str, Any]]] = None
    language: Optional[str] = "python"

class KnowledgeSearchRequest(BaseModel):
    query: str
    concept_id: Optional[str] = None
    top_k: Optional[int] = 3

@router.post("/explain-test")
def explain_test_failure(req: ExplainTestRequest):
    """
    COGNICODE 'Explain My Failed Test' feature:
    Synthesizes real execution evidence (compiler output + test diffs)
    with RAG-retrieved course documentation and student BKT learning gaps.
    """
    explanation = tutor_engine.explain_execution_failure(
        student_id=req.student_id,
        question_id=req.question_id,
        code=req.code,
        execution_status=req.execution_status,
        stderr=req.stderr or "",
        test_details=req.test_details,
        language=req.language or "python"
    )
    return explanation

@router.post("/search-knowledge")
def search_knowledge(req: KnowledgeSearchRequest):
    """
    RAG hybrid retrieval across approved course documents.
    """
    results = knowledge_store.hybrid_search(
        query=req.query,
        concept_id=req.concept_id,
        top_k=req.top_k or 3
    )
    return {
        "query": req.query,
        "total_retrieved": len(results),
        "results": results
    }

@router.get("/documents")
def list_documents():
    """
    Knowledge management: returns all ingested course material chunks and source references.
    """
    return [
        {
            "chunk_id": ch.chunk_id,
            "course": ch.course,
            "topic": ch.topic,
            "concept_id": ch.concept_id,
            "title": ch.title,
            "source_doc": ch.source_doc,
            "preview": ch.content[:150] + "..."
        }
        for ch in knowledge_store.chunks
    ]

class TutorChatRequest(BaseModel):
    student_id: str
    mode: str = "learn"  # learn, debug, hint, explain, exam
    query: str
    code: Optional[str] = ""
    context: Optional[Dict[str, Any]] = None

class PredictionEvaluationRequest(BaseModel):
    student_id: str
    scenario_id: str
    selected_option: str
    reasoning: Optional[str] = ""

@router.post("/chat")
def tutor_chat(req: TutorChatRequest):
    """
    5-Mode RAG Programming Tutor:
    Modes: 'learn', 'debug', 'hint', 'explain', 'exam'
    """
    return tutor_engine.chat(
        student_id=req.student_id,
        mode=req.mode,
        query=req.query,
        code=req.code or "",
        context=req.context or {}
    )

@router.get("/learning-gap-radar/{student_id}")
def get_learning_gap_radar(student_id: str):
    """
    Innovation 1: AI Learning Gap Radar.
    Identifies specific concept gaps, prerequisite bottlenecks, and remediation actions.
    """
    return tutor_engine.get_learning_gap_radar(student_id)

@router.get("/error-dna/{student_id}")
def get_error_dna(student_id: str):
    """
    Innovation 3: Personal Error DNA.
    Tracks recurring mistake patterns, trends, and targeted recovery plans.
    """
    return tutor_engine.get_error_dna(student_id)

@router.get("/prediction-lab/scenarios")
def get_prediction_scenarios():
    """
    Innovation 4: Code Change Prediction Lab.
    Returns scenarios where students predict outcome of code mutations before running.
    """
    return tutor_engine.get_prediction_scenarios()

@router.post("/prediction-lab/evaluate")
def evaluate_prediction(req: PredictionEvaluationRequest):
    """
    Innovation 4: Evaluates student's code mutation prediction.
    """
    return tutor_engine.evaluate_prediction(
        student_id=req.student_id,
        scenario_id=req.scenario_id,
        selected_option=req.selected_option,
        reasoning=req.reasoning or ""
    )

@router.get("/job-role-gap/{student_id}")
def get_job_role_gap(student_id: str, target_role: str = Query("backend_developer")):
    """
    Innovation 5: Job-Role Skill Gap Analyzer.
    Compares industry job roles (Backend, SDE Intern) against demonstrated mastery.
    """
    return tutor_engine.get_job_role_gap(student_id, target_role)

