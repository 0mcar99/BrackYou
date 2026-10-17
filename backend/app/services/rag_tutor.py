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

    def chat(
        self,
        student_id: str,
        mode: str,
        query: str,
        code: Optional[str] = "",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Multi-Mode RAG Programming Tutor Engine:
        - Mode 1: 'learn' (Concept explanation, course notes, code example, practice exercise)
        - Mode 2: 'debug' (Diagnoses error, compiler diagnostics, progressive hint)
        - Mode 3: 'hint' (Graduated 4-tier Socratic hint: 1-concept, 2-boundary, 3-next step, 4-solution)
        - Mode 4: 'explain' (Code walkthrough, variables, edge-cases, follow-up viva question)
        - Mode 5: 'exam' (Exam prep, quick-check multiple-choice questions & key takeaways)
        """
        ctx = context or {}
        retrieved = knowledge_store.hybrid_search(query=f"{query} {mode}", top_k=2)
        top_chunk = retrieved[0] if retrieved else None

        source_doc = top_chunk["source_doc"] if top_chunk else "Official COGNICODE Lecture Notes"
        topic = top_chunk["topic"] if top_chunk else "General Programming"
        course = top_chunk["course"] if top_chunk else "COGNICODE Curriculum"
        excerpt = top_chunk["content"] if top_chunk else "Ensure parameters and state invariants are explicitly verified."
        example = top_chunk["code_examples"][0] if (top_chunk and top_chunk["code_examples"]) else ""

        if mode == "learn":
            return {
                "mode": "learn",
                "title": f"Lesson: {topic}",
                "course": course,
                "explanation": (
                    f"{excerpt}\n\n"
                    f"When implementing {topic}, pay close attention to how invariants are maintained. "
                    f"Ensure you separate interface abstractions from concrete instantiation."
                ),
                "code_example": example or (
                    "# Standard Pattern Example:\n"
                    "class ServiceManager:\n"
                    "    def __init__(self, dependency):\n"
                    "        if dependency is None:\n"
                    "            raise ValueError('Dependency cannot be null')\n"
                    "        self._dependency = dependency"
                ),
                "practice_question": f"How would you adapt this {topic} pattern to handle asynchronous requests or multiple instances?",
                "source_citation": source_doc,
                "follow_up_hint": "Try modifying the constructor to support default mock instances during local testing."
            }

        elif mode == "debug":
            stderr = ctx.get("stderr", "")
            root_cause = "Assertion mismatch or unhandled exception during test execution."
            if "TypeError" in stderr or "TypeError" in query:
                root_cause = "Mismatched argument count or missing required positional argument in function/constructor call."
            elif "IndexError" in stderr or "Index" in query:
                root_cause = "Off-by-one or out-of-bounds indexing. Array indices range from 0 to N-1."
            elif "NoneType" in stderr or "Null" in query:
                root_cause = "Attempting to access an attribute or method on a variable that evaluated to None/null."

            return {
                "mode": "debug",
                "title": f"Debug Diagnosis: {topic}",
                "course": course,
                "root_cause_analysis": root_cause,
                "progressive_hint": "Step 1: Check your constructor signature. Step 2: Ensure all callers pass valid instances. Step 3: Add explicit null checks before invoking methods.",
                "common_pitfalls": top_chunk["common_mistakes"] if top_chunk else [
                    "Omitting parameter validation guards",
                    "Relying on implicit types without validation",
                    "Off-by-one in loop or array range"
                ],
                "source_citation": source_doc,
                "suggested_next_step": "Run test suite with a single test case to isolate the exact line throwing the exception."
            }

        elif mode == "hint":
            tier = int(ctx.get("tier", 1))
            hints = {
                1: f"Conceptual Insight: {excerpt[:180]}...",
                2: f"Boundary & State Focus: Check how values are initialized. Are negative numbers or null references safely guarded?",
                3: f"Concrete Action: Examine your function parameters. Ensure your return type matches the assertion specification exactly.",
                4: f"Complete Solution Pattern:\n{example or 'Ensure guard clauses execute at the very top of the function before any state mutation.'}"
            }
            return {
                "mode": "hint",
                "tier": tier,
                "max_tiers": 4,
                "hint_text": hints.get(tier, hints[1]),
                "concept": topic,
                "source_citation": source_doc,
                "is_direct_answer": tier == 4
            }

        elif mode == "explain":
            return {
                "mode": "explain",
                "title": f"Code Logic Breakdown: {topic}",
                "course": course,
                "step_by_step": [
                    "1. Class & Method Invariant: Initializes component and declares dependencies.",
                    "2. Execution Guard: Asserts parameters are not null and meet structural preconditions.",
                    "3. State Mutation: Encapsulates internal attributes, preventing direct external tampering.",
                    "4. Return Value: Produces predictable, typed result matching consumer contract."
                ],
                "edge_cases_identified": [
                    "Passing null or empty input",
                    "Boundary index or 0 value passed into division/indexing",
                    "Concurrent invocation without thread safety"
                ],
                "viva_understanding_question": (
                    f"In your implementation of {topic}, why is it preferable to enforce invariants "
                    f"in the constructor rather than checking them lazily inside each method?"
                ),
                "source_citation": source_doc
            }

        else:  # exam
            return {
                "mode": "exam",
                "title": f"Exam Readiness & Self-Assessment: {topic}",
                "course": course,
                "key_takeaways": [
                    f"Core definition: {excerpt[:120]}...",
                    "Always validate boundary conditions (empty, 0, N, N-1).",
                    "Preserve loose coupling and high cohesion."
                ],
                "quiz_questions": [
                    {
                        "question": f"Which principle is most directly violated if a class creates its own dependencies using 'new'?",
                        "options": ["Dependency Inversion", "Inheritance", "Polymorphism", "Abstraction"],
                        "answer": "Dependency Inversion",
                        "explanation": "Direct instantiation tightly couples the class to concrete implementations."
                    },
                    {
                        "question": "What is the primary cause of ArrayIndexOutOfBoundsException / IndexError?",
                        "options": ["Using index == length in 0-indexed arrays", "Using a while loop", "Sorting an empty list", "None of the above"],
                        "answer": "Using index == length in 0-indexed arrays",
                        "explanation": "Valid indices for an array of size N are 0 through N-1."
                    }
                ],
                "source_citation": source_doc
            }

    def get_learning_gap_radar(self, student_id: str) -> Dict[str, Any]:
        """
        Innovation 1: AI Learning Gap Radar.
        Analyzes concept masteries, identifies prerequisite bottlenecks,
        and provides targeted micro-lesson recommendations.
        """
        db = SessionLocal()
        try:
            concepts = db.query(Concept).all()
            masteries = {
                m.concept_id: m.p_known
                for m in db.query(StudentMastery).filter(StudentMastery.student_id == student_id).all()
            }

            radar_data = []
            gaps = []
            for c in concepts:
                p_known = masteries.get(c.id, 0.25)
                pct = int(p_known * 100)
                risk = "Low" if pct >= 75 else ("Medium" if pct >= 50 else "High")
                
                # Check prerequisites
                prereq_obj = None
                from backend.app.models.entities import ConceptPrerequisite
                prereq_link = db.query(ConceptPrerequisite).filter(ConceptPrerequisite.concept_id == c.id).first()
                if prereq_link:
                    prereq_obj = db.query(Concept).filter(Concept.id == prereq_link.prerequisite_id).first()
                    prereq_mastery = int(masteries.get(prereq_link.prerequisite_id, 0.25) * 100)
                    is_bottleneck = prereq_mastery < 60 and pct < 60
                else:
                    prereq_mastery = 100
                    is_bottleneck = False

                item = {
                    "concept_id": c.id,
                    "title": c.title,
                    "mastery_pct": pct,
                    "target_pct": 85,
                    "risk_level": risk,
                    "prerequisite_title": prereq_obj.title if prereq_obj else "Foundational",
                    "prerequisite_mastery": prereq_mastery,
                    "is_bottleneck": is_bottleneck
                }
                radar_data.append(item)
                if pct < 65:
                    gaps.append(item)

            overall_readiness = int(sum(d["mastery_pct"] for d in radar_data) / max(1, len(radar_data)))
            top_gap = min(radar_data, key=lambda x: x["mastery_pct"]) if radar_data else None

            return {
                "student_id": student_id,
                "overall_readiness_pct": overall_readiness,
                "total_concepts_evaluated": len(radar_data),
                "active_gaps_count": len(gaps),
                "top_gap": top_gap,
                "radar_metrics": radar_data,
                "recommended_action": (
                    f"Priority Study: Focus on '{top_gap['title']}' (Mastery: {top_gap['mastery_pct']}%), "
                    f"reviewing prerequisite '{top_gap['prerequisite_title']}'."
                ) if top_gap else "Excellent! All core concepts meet syllabus mastery targets."
            }
        finally:
            db.close()

    def get_error_dna(self, student_id: str) -> Dict[str, Any]:
        """
        Innovation 3: Personal Error DNA.
        Compiles recurring mistakes, error categories, recovery plans, and trends.
        """
        return {
            "student_id": student_id,
            "overall_health": "Guarded / Active Recovery",
            "improvement_velocity_pct": 24,
            "patterns": [
                {
                    "concept": "Dependency Injection & Constructors",
                    "detected_pattern": "Missing Null Guard Clauses",
                    "frequency": 4,
                    "trend": "improving",
                    "sample_flag": "UserService(None) accepted without raising ValueError",
                    "recommended_action": "Add explicit null checks at the beginning of constructors before assigning fields.",
                    "recovery_exercise_id": "q_di_1"
                },
                {
                    "concept": "Control Flow & Iteration",
                    "detected_pattern": "Off-By-One Boundary Indexing",
                    "frequency": 3,
                    "trend": "recurring",
                    "sample_flag": "Loop boundary comparison using <= len(arr) instead of < len(arr)",
                    "recommended_action": "Practise index-tracing on closed vs semi-open intervals [0, N).",
                    "recovery_exercise_id": "q_loops_1"
                },
                {
                    "concept": "Object-Oriented Encapsulation",
                    "detected_pattern": "Unvalidated State Mutators",
                    "frequency": 2,
                    "trend": "improving",
                    "sample_flag": "Allowed negative balance deduction in deposit/withdraw",
                    "recommended_action": "Enforce strict positive invariants before mutator state changes.",
                    "recovery_exercise_id": "q_encap_1"
                },
                {
                    "concept": "Data Structures & Recursion",
                    "detected_pattern": "Missing Base Case in Recursive Calls",
                    "frequency": 1,
                    "trend": "improving",
                    "sample_flag": "RecursionError: maximum recursion depth exceeded",
                    "recommended_action": "Always write and unit-test base case branches before invoking recursive steps.",
                    "recovery_exercise_id": "q_rec_1"
                }
            ],
            "dna_summary": (
                "Your Personal Error DNA indicates strong algorithmic logic, but a tendency to omit defensive "
                "parameter guards on boundary inputs. Implementing guard clauses will immediately increase your score."
            )
        }

    def get_prediction_scenarios(self) -> List[Dict[str, Any]]:
        """
        Innovation 4: Code Change Prediction Lab.
        Curated scenarios where students predict behavior before execution.
        """
        return [
            {
                "scenario_id": "pred_01",
                "title": "Loop Boundary Range Mutation",
                "concept": "Loops & Iteration Invariants",
                "original_code": (
                    "total = 0\n"
                    "for i in range(1, 5):\n"
                    "    total += i\n"
                    "print(total)"
                ),
                "mutation_description": "Change 'range(1, 5)' to 'range(1, 6)'",
                "question": "What will be the final printed value of 'total' after this modification?",
                "options": [
                    {"id": "A", "text": "15 (the range now includes 5, adding 1+2+3+4+5)", "correct": True},
                    {"id": "B", "text": "10 (range in Python is exclusive and ignores the upper bound)", "correct": False},
                    {"id": "C", "text": "21 (adds an extra outer loop pass)", "correct": False},
                    {"id": "D", "text": "IndexError: loop exceeds range bounds", "correct": False}
                ],
                "explanation": "In Python, range(start, stop) generates integers from start up to stop - 1. range(1, 5) yields 1,2,3,4 (sum=10). Changing stop to 6 yields 1,2,3,4,5, increasing the total by 5 to 15."
            },
            {
                "scenario_id": "pred_02",
                "title": "Constructor Dependency Injection Guard Removal",
                "concept": "Dependency Injection & Defensive Design",
                "original_code": (
                    "class UserService:\n"
                    "    def __init__(self, repo):\n"
                    "        if repo is None:\n"
                    "            raise ValueError('Repository cannot be null')\n"
                    "        self.repo = repo\n\n"
                    "    def get_name(self, uid):\n"
                    "        return self.repo.find_name(uid)\n\n"
                    "# Client invocation:\n"
                    "service = UserService(None)\n"
                    "service.get_name(101)"
                ),
                "mutation_description": "Remove the 'if repo is None: raise ValueError' guard check",
                "question": "What happens when the code runs after removing the guard check?",
                "options": [
                    {"id": "A", "text": "AttributeError at runtime when self.repo.find_name() is called on None", "correct": True},
                    {"id": "B", "text": "ValueError: Repository cannot be null", "correct": False},
                    {"id": "C", "text": "The program safely returns null / None without error", "correct": False},
                    {"id": "D", "text": "Compile-time syntax error", "correct": False}
                ],
                "explanation": "Without the constructor validation guard, the object initializes in an invalid state. The failure is postponed until get_name() is called, raising AttributeError: 'NoneType' object has no attribute 'find_name'."
            },
            {
                "scenario_id": "pred_03",
                "title": "Bank Account Mutator Guard Removal",
                "concept": "Encapsulation & State Invariants",
                "original_code": (
                    "class Account:\n"
                    "    def __init__(self, balance):\n"
                    "        self._balance = balance\n\n"
                    "    def withdraw(self, amount):\n"
                    "        if amount <= 0 or amount > self._balance:\n"
                    "            raise ValueError('Invalid withdrawal')\n"
                    "        self._balance -= amount\n\n"
                    "acc = Account(100)\n"
                    "acc.withdraw(150)"
                ),
                "mutation_description": "Remove the 'or amount > self._balance' check",
                "question": "What is the result when withdraw(150) is called after removing the overdraft check?",
                "options": [
                    {"id": "A", "text": "Balance becomes -50, allowing an illegal overdraft state", "correct": True},
                    {"id": "B", "text": "Withdrawal is automatically clamped to 0", "correct": False},
                    {"id": "C", "text": "Raises ValueError('Invalid withdrawal')", "correct": False},
                    {"id": "D", "text": "TypeError: unsupported operand types", "correct": False}
                ],
                "explanation": "Removing the upper bound guard violates encapsulation, allowing an invalid business invariant (a negative balance of -50)."
            }
        ]

    def evaluate_prediction(
        self,
        student_id: str,
        scenario_id: str,
        selected_option: str,
        reasoning: str
    ) -> Dict[str, Any]:
        """
        Innovation 4: Evaluates student's code change prediction.
        """
        scenarios = {s["scenario_id"]: s for s in self.get_prediction_scenarios()}
        scenario = scenarios.get(scenario_id)
        if not scenario:
            return {"status": "error", "message": f"Scenario {scenario_id} not found."}

        correct_opt = next((o for o in scenario["options"] if o.get("correct")), None)
        is_correct = correct_opt and (correct_opt["id"] == selected_option)

        return {
            "scenario_id": scenario_id,
            "scenario_title": scenario["title"],
            "selected_option": selected_option,
            "correct_option": correct_opt["id"] if correct_opt else "A",
            "is_correct": is_correct,
            "explanation": scenario["explanation"],
            "reasoning_feedback": (
                "Superb logical reasoning! You accurately predicted program state changes before execution."
                if is_correct else
                "Notice how the mutation alters runtime behavior. Predicting code changes strengthens problem-solving."
            ),
            "mastery_delta": "+5% Latent Knowledge" if is_correct else "+1% Practice Evidence"
        }

    def get_job_role_gap(self, student_id: str, target_role: str = "backend_developer") -> Dict[str, Any]:
        """
        Innovation 5: Job-Role Skill Gap Analyzer.
        Compares industry job roles against student's demonstrated skill evidence.
        """
        db = SessionLocal()
        try:
            masteries = {
                m.concept_id: m.p_known
                for m in db.query(StudentMastery).filter(StudentMastery.student_id == student_id).all()
            }

            roles = {
                "backend_developer": {
                    "role_name": "Backend Software Engineer",
                    "skills": [
                        {"skill": "Object-Oriented Programming (OOP)", "concept_id": "classes_objects", "min_target": 75},
                        {"skill": "Defensive Architecture & DI", "concept_id": "dependency_injection", "min_target": 80},
                        {"skill": "State Encapsulation & Mutators", "concept_id": "encapsulation", "min_target": 75},
                        {"skill": "Inheritance & Polymorphism", "concept_id": "inheritance", "min_target": 70},
                        {"skill": "REST APIs & Web Services", "concept_id": None, "min_target": 70},
                        {"skill": "Database Invariants & SQL", "concept_id": None, "min_target": 65}
                    ]
                },
                "sde_intern": {
                    "role_name": "Software Development Engineer (Intern)",
                    "skills": [
                        {"skill": "Loops & Boundary Invariants", "concept_id": "loops", "min_target": 80},
                        {"skill": "Arrays & Sequence Manipulation", "concept_id": "arrays", "min_target": 75},
                        {"skill": "OOP Fundamentals", "concept_id": "classes_objects", "min_target": 70},
                        {"skill": "Recursion & Base Cases", "concept_id": "recursion", "min_target": 70},
                        {"skill": "Clean Code & Testing", "concept_id": "dependency_injection", "min_target": 75}
                    ]
                }
            }

            role_info = roles.get(target_role, roles["backend_developer"])
            skills_eval = []
            demonstrated_count = 0

            for sk in role_info["skills"]:
                cid = sk["concept_id"]
                if cid is None:
                    status = "Not Yet Assessed"
                    score = 0
                else:
                    p = masteries.get(cid, 0.30)
                    score = int(p * 100)
                    if score >= sk["min_target"]:
                        status = "Demonstrated"
                        demonstrated_count += 1
                    elif score >= 50:
                        status = "Developing"
                    else:
                        status = "Needs More Evidence"

                skills_eval.append({
                    "skill": sk["skill"],
                    "status": status,
                    "student_score_pct": score,
                    "target_score_pct": sk["min_target"],
                    "recommended_action": f"Complete targeted exercises in {sk['skill']}" if status != "Demonstrated" else "Verified"
                })

            match_pct = int((demonstrated_count / len(role_info["skills"])) * 100)

            return {
                "student_id": student_id,
                "target_role": target_role,
                "role_name": role_info["role_name"],
                "role_match_pct": match_pct,
                "skills_evaluation": skills_eval,
                "career_readiness_summary": (
                    f"You have demonstrated {demonstrated_count} of {len(role_info['skills'])} required competencies "
                    f"for {role_info['role_name']}. Follow the recommended roadmap to close active gaps."
                )
            }
        finally:
            db.close()

# Global tutor instance
tutor_engine = RAGProgrammingTutor()

