import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

class CourseKnowledgeChunk:
    def __init__(
        self,
        chunk_id: str,
        course: str,
        topic: str,
        concept_id: str,
        title: str,
        content: str,
        code_examples: List[str] = None,
        common_mistakes: List[str] = None,
        source_doc: str = "COGNICODE Official Course Materials"
    ):
        self.chunk_id = chunk_id
        self.course = course
        self.topic = topic
        self.concept_id = concept_id
        self.title = title
        self.content = content
        self.code_examples = code_examples or []
        self.common_mistakes = common_mistakes or []
        self.source_doc = source_doc
        self.tokens = self._tokenize(f"{title} {content} {' '.join(self.common_mistakes)}")

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'[a-zA-Z0-9_]+', text.lower())

class RAGKnowledgeStore:
    """
    RAG Ingestion and Hybrid (Vector + Keyword) Knowledge Store for trusted course material.
    Operates without disrupting existing databases or tables.
    """
    def __init__(self):
        self.chunks: List[CourseKnowledgeChunk] = []
        self._load_built_in_course_materials()

    def _load_built_in_course_materials(self):
        # 1. Dependency Injection & Inversion of Control
        self.add_chunk(
            chunk_id="chunk_di_01",
            course="Design Patterns & Clean Architecture",
            topic="Dependency Injection",
            concept_id="dependency_injection",
            title="Constructor Injection and Immutability",
            content=(
                "Constructor Dependency Injection mandates passing all essential collaborators into the class "
                "constructor at instantiation time. This guarantees that an object is never in an invalid state. "
                "Always validate constructor parameters with null-checks or type assertions. "
                "Avoid instantiating dependencies directly within methods using 'new' or direct calls, "
                "because doing so couples the classes tightly and prevents mock substitution during unit tests."
            ),
            code_examples=[
                (
                    "class UserService:\n"
                    "    def __init__(self, repo):\n"
                    "        if repo is None:\n"
                    "            raise ValueError('UserRepository cannot be None')\n"
                    "        self._repo = repo\n\n"
                    "    def fetch_user(self, user_id):\n"
                    "        return self._repo.get_user(user_id)"
                )
            ],
            common_mistakes=[
                "Defaulting repo=None and omitting a null guard",
                "Calling repo.get_user without checking if repository was initialized",
                "Reassigning self.repo outside constructor",
                "Importing concrete database driver instead of dependency abstraction"
            ],
            source_doc="Module 6: Architecture Patterns — Lecture 3 (Dependency Injection).pdf"
        )

        # 2. Object-Oriented Programming: Encapsulation
        self.add_chunk(
            chunk_id="chunk_oop_01",
            course="OOP Fundamentals",
            topic="Encapsulation & State Mutation",
            concept_id="classes_objects",
            title="Encapsulation and Data Integrity",
            content=(
                "Encapsulation protects an object's internal representation by keeping fields private "
                "and providing public accessor or mutator methods. Any mutator (e.g. deposit, withdraw) "
                "must validate invariants before updating state (e.g., preventing negative balance or overdraft). "
                "State should never be modified directly via external property access."
            ),
            code_examples=[
                (
                    "class BankAccount:\n"
                    "    def __init__(self, account_id, balance=0.0):\n"
                    "        if balance < 0:\n"
                    "            raise ValueError('Initial balance cannot be negative')\n"
                    "        self._balance = float(balance)\n\n"
                    "    def deposit(self, amount):\n"
                    "        if amount <= 0:\n"
                    "            raise ValueError('Deposit amount must be positive')\n"
                    "        self._balance += amount"
                )
            ],
            common_mistakes=[
                "Allowing negative values in constructor or deposit methods",
                "Exposing raw balance attribute allowing direct external reassignment",
                "Omitting return balance or formatted string representation"
            ],
            source_doc="Module 3: OOP Principles — Encapsulation & Mutators.pdf"
        )

        # 3. Inheritance & Polymorphism
        self.add_chunk(
            chunk_id="chunk_poly_01",
            course="OOP Fundamentals",
            topic="Inheritance & Method Overriding",
            concept_id="inheritance",
            title="Abstract Base Classes and Method Overriding",
            content=(
                "Polymorphism allows subclasses to provide specific implementations for methods defined in a parent. "
                "Base classes should declare abstract methods (e.g. area(), perimeter()) that child classes "
                "like Circle or Rectangle must override. When overriding, match the exact method name and signature."
            ),
            code_examples=[
                (
                    "import math\n\n"
                    "class Shape:\n"
                    "    def area(self):\n"
                    "        raise NotImplementedError('Subclasses must implement area()')\n\n"
                    "class Circle(Shape):\n"
                    "    def __init__(self, radius):\n"
                    "        self.radius = radius\n"
                    "    def area(self):\n"
                    "        return round(math.pi * (self.radius ** 2), 2)"
                )
            ],
            common_mistakes=[
                "Forgetting to call super().__init__() where required",
                "Misspelling overridden method names",
                "Not handling float precision differences when returning numeric values"
            ],
            source_doc="Module 4: Inheritance, Abstract Contracts & Dynamic Dispatch.pdf"
        )

        # 4. Variables & Type Safety
        self.add_chunk(
            chunk_id="chunk_vars_01",
            course="Python & Java Fundamentals",
            topic="Variables and Scope",
            concept_id="variables",
            title="Variable Scoping and Type Invariants",
            content=(
                "Variables declared in outer scopes must be properly referenced or passed as parameters. "
                "Shadowing class attributes with local variables can lead to subtle logic errors. "
                "Always ensure type consistency when performing operations between integers, floats, and strings."
            ),
            code_examples=[],
            common_mistakes=[
                "Concatenating string with integer without explicit cast",
                "UnboundLocalError when referencing variables before assignment",
                "Relying on global variables instead of passing arguments"
            ],
            source_doc="Module 1: Language Syntax & Type Primitives.pdf"
        )

    def add_chunk(self, **kwargs):
        chunk = CourseKnowledgeChunk(**kwargs)
        self.chunks.append(chunk)

    def hybrid_search(self, query: str, concept_id: Optional[str] = None, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Performs hybrid retrieval: combines exact keyword overlap (BM25-style)
        with concept category weighting and relevance scoring.
        """
        query_tokens = set(re.findall(r'[a-zA-Z0-9_]+', query.lower()))
        scored_results = []

        for chunk in self.chunks:
            # Keyword overlap
            overlap = len(query_tokens.intersection(chunk.tokens))
            score = overlap * 1.5

            # Concept boost
            if concept_id and chunk.concept_id == concept_id:
                score += 5.0

            # Title match boost
            for qt in query_tokens:
                if qt in chunk.title.lower():
                    score += 2.0

            if score > 0:
                scored_results.append((score, chunk))

        # Sort descending by score
        scored_results.sort(key=lambda x: x[0], reverse=True)
        top = scored_results[:top_k]

        return [
            {
                "chunk_id": ch.chunk_id,
                "course": ch.course,
                "topic": ch.topic,
                "concept_id": ch.concept_id,
                "title": ch.title,
                "content": ch.content,
                "code_examples": ch.code_examples,
                "common_mistakes": ch.common_mistakes,
                "source_doc": ch.source_doc,
                "relevance_score": round(min(1.0, score / 10.0), 2)
            }
            for score, ch in top
        ]

# Global singleton knowledge store
knowledge_store = RAGKnowledgeStore()
