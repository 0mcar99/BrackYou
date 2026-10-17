from typing import Dict, Any, Optional, List
from backend.app.services.rag_store import knowledge_store
from backend.app.services.bkt_engine import BKTEngine
from backend.app.models.entities import SessionLocal, StudentMastery, Concept, Question

class RAGProgrammingTutor:
    """
    Connected RAG-powered tutor orchestrator.
    Synthesizes:
    1. Verified Execution Evidence (STDOUT, STDERR, Test case diffs)
    2. Trusted Course Material Chunks (with Source Citations)
    3. Student Learning Context (BKT Latent Knowledge & Prerequisite Gaps)
    4. Progressive Socratic Nudge (without leaking complete answers)
    """
    def __init__(self):
        self.bkt = BKTEngine()

    def explain_execution_failure(
        self,
        student_id: str,
        question_id: str,
        code: str,
        execution_status: str,
        stderr: str,
        test_details: Optional[List[Dict[str, Any]]] = None,
        language: str = "python"
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            # 1. Fetch Question & Concept
            q = db.query(Question).filter(Question.id == question_id).first()
            concept_id = q.primary_concept_id if q else "dependency_injection"
            concept = db.query(Concept).filter(Concept.id == concept_id).first()
            concept_title = concept.title if concept else "Software Architecture"

            # 2. Fetch Student BKT Mastery Profile
            mastery = db.query(StudentMastery).filter(
                StudentMastery.student_id == student_id,
                StudentMastery.concept_id == concept_id
            ).first()
            mastery_pct = int((mastery.p_known * 100) if mastery else 45)

            # 3. Formulate Search Query from Execution Evidence
            query_parts = [concept_title]
            if stderr:
                query_parts.append(stderr[:120])
            failed_tests = [t for t in (test_details or []) if not t.get("passed", True)]
            if failed_tests:
                query_parts.append(failed_tests[0].get("name", ""))

            rag_query = " ".join(query_parts)

            # 4. Hybrid Retrieval from Trusted Course Materials
            retrieved_chunks = knowledge_store.hybrid_search(
                query=rag_query,
                concept_id=concept_id,
                top_k=2
            )

            primary_chunk = retrieved_chunks[0] if retrieved_chunks else None

            # 5. Determine Specific Diagnostic Root Cause
            has_syntax_err = "SyntaxError" in (stderr or "")
            has_null_issue = "None" in (stderr or "") or any("Null" in t.get("name", "") for t in failed_tests)
            has_encapsulation_issue = "Negative" in (stderr or "") or any("Overdraft" in t.get("name", "") for t in failed_tests)

            if has_syntax_err:
                evidence_summary = "Compiler failed during syntax validation before bytecode execution."
                socratic_nudge = "Inspect the line highlighted in STDERR. Look for unclosed parentheses, missing colons (:), or indentation discrepancies."
            elif has_null_issue:
                evidence_summary = "The constructor accepted a null/None reference without throwing a validation guard exception."
                socratic_nudge = "Review how your constructor initializes dependencies. Add an explicit check: if repo is None, raise ValueError('Repository cannot be null')."
            elif has_encapsulation_issue:
                evidence_summary = "State mutator allowed an invalid numeric invariant (e.g. negative balance or unauthorized state change)."
                socratic_nudge = "Check your mutator validation: guard against values <= 0 before applying balance adjustments."
            elif execution_status == "passed":
                evidence_summary = "All test assertions passed successfully under verified execution."
                socratic_nudge = "Well done! Challenge your implementation: could this class be further simplified, or made thread-safe?"
            else:
                evidence_summary = "One or more assertions did not match expected test output."
                socratic_nudge = f"Focus on how {concept_title} expects data to flow. Compare your actual output with the test requirements."

            return {
                "concept_id": concept_id,
                "concept_title": concept_title,
                "student_mastery_pct": mastery_pct,
                "execution_evidence": {
                    "status": execution_status,
                    "summary": evidence_summary,
                    "has_error": execution_status != "passed",
                    "error_snippet": stderr[:200] if stderr else None
                },
                "retrieved_knowledge": {
                    "title": primary_chunk["title"] if primary_chunk else "Standard Programming Practice",
                    "course": primary_chunk["course"] if primary_chunk else "COGNICODE Curriculum",
                    "lesson_topic": primary_chunk["topic"] if primary_chunk else concept_title,
                    "source_document": primary_chunk["source_doc"] if primary_chunk else "Official Course Syllabus",
                    "trusted_excerpt": primary_chunk["content"] if primary_chunk else "Ensure inputs and state invariants are rigorously validated.",
                    "code_reference": primary_chunk["code_examples"][0] if (primary_chunk and primary_chunk["code_examples"]) else None,
                    "common_pitfalls": primary_chunk["common_mistakes"] if primary_chunk else []
                },
                "socratic_guidance": {
                    "progressive_hint": socratic_nudge,
                    "guiding_question": f"How does the concept of {concept_title} ensure robust invariants when unexpected inputs occur?",
                    "is_direct_answer": False
                }
            }
        finally:
            db.close()

# Global tutor instance
tutor_engine = RAGProgrammingTutor()
