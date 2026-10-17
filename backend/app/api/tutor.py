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
