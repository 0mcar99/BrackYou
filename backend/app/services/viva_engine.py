import re
from typing import List, Dict, Any

class VivaEngine:
    def __init__(self):
        pass

    def extract_code_features(self, code: str) -> Dict[str, Any]:
        """
        Extracts structural code symbols from submitted solution
        """
        classes = re.findall(r'class\s+([A-Za-z0-9_]+)', code)
        methods = re.findall(r'(?:def|public|private|protected|static|\s)\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:\{|:)', code)
        constructors = [c for c in classes if re.search(rf'{c}\s*\(', code)]
        variables = re.findall(r'(?:private|public|protected|final|val|var)?\s*([A-Za-z0-9_]+)\s*=', code)

        return {
            "classes": classes,
            "methods": [m for m in methods if m not in ('if', 'while', 'for', 'switch')],
            "constructors": constructors,
            "variables": variables
        }

    def generate_questions(self, code: str, concept_title: str) -> List[Dict[str, Any]]:
        """
        Generates 2 targeted viva questions based on the student's actual written code
        """
        features = self.extract_code_features(code)
        questions = []

        cls_name = features["classes"][0] if features["classes"] else "your primary class"
        method_name = features["methods"][0] if features["methods"] else "the calculation method"

        # Question 1: Architectural / Design Choice
        if features["constructors"]:
            questions.append({
                "id": "q1",
                "question": f"In `{cls_name}`, you instantiated dependencies through the constructor. Why is constructor injection preferable to hardcoding dependencies inside methods?",
                "key_concepts": ["dependency injection", "immutability", "coupling", "testability", "null safety"]
            })
        elif "class" in code:
            questions.append({
                "id": "q1",
                "question": f"In `{cls_name}`, how does encapsulation protect your internal state from uncontrolled external modification?",
                "key_concepts": ["encapsulation", "private", "getter", "setter", "data hiding", "state"]
            })
        else:
            questions.append({
                "id": "q1",
                "question": f"In your implementation of `{method_name}`, what edge case conditions could cause unexpected execution or runtime failure?",
                "key_concepts": ["edge case", "null", "boundary", "validation", "exception", "zero"]
            })

        # Question 2: Implementation Mechanics
        if "super(" in code or "extends" in code or "super().__init__" in code:
            questions.append({
                "id": "q2",
                "question": f"Your solution extends a base class. How does your subclass override behavior while still leveraging inherited functionality?",
                "key_concepts": ["override", "inheritance", "polymorphism", "super", "reuse"]
            })
        elif "for" in code or "while" in code:
            questions.append({
                "id": "q2",
                "question": f"What is the asymptotic time complexity of your loop construct inside `{method_name}`, and can it be optimized?",
                "key_concepts": ["time complexity", "O(n)", "linear", "constant", "iteration", "performance"]
            })
        else:
            questions.append({
                "id": "q2",
                "question": f"What is the return type and data flow contract of your `{method_name}` function?",
                "key_concepts": ["return", "data type", "output", "contract", "pure function"]
            })

        return questions

    def evaluate_answer(
        self, 
        question: Dict[str, Any], 
        student_answer: str, 
        code: str
    ) -> Dict[str, Any]:
        """
        Evaluates the student's explanation against expected conceptual keywords and code intent.
        """
        answer_clean = student_answer.lower().strip()
        if not answer_clean or len(answer_clean) < 10:
            return {
                "match_score": 25,
                "status": "Incomplete",
                "feedback": "Answer is too brief or ambiguous. Please provide a substantive technical justification linking your reasoning to your code implementation.",
                "concept_solid": False
            }

        key_concepts = question.get("key_concepts", [])
        matched_keys = [k for k in key_concepts if k in answer_clean]

        # Score calculation based on conceptual depth
        match_ratio = len(matched_keys) / max(len(key_concepts), 1)
        length_bonus = min(len(answer_clean) / 100.0, 0.3)
        raw_score = int(min(1.0, (match_ratio * 0.7) + length_bonus + 0.3) * 100)

        # Check for superficial / evasive answers
        evasive = any(p in answer_clean for p in ["i don't know", "idk", "just copied", "ai wrote", "not sure"])
        if evasive:
            raw_score = 20

        if raw_score >= 75:
            feedback = f"Excellent technical explanation. Your response accurately demonstrated understanding of {' and '.join(matched_keys[:2]) if matched_keys else 'core principles'}."
            concept_solid = True
        elif raw_score >= 50:
            feedback = f"Good foundational understanding, but your explanation could more explicitly address edge cases and architectural constraints."
            concept_solid = False
        else:
            feedback = f"Explanation does not adequately reflect the mechanics of your submitted code. Reviewing prerequisite concepts is recommended."
            concept_solid = False

        return {
            "match_score": raw_score,
            "status": "Verified" if concept_solid else "Needs Review",
            "matched_concepts": matched_keys,
            "feedback": feedback,
            "concept_solid": concept_solid
        }
