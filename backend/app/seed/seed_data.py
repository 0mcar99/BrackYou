import json
from datetime import datetime, timezone
from backend.app.models.entities import (
    SessionLocal, init_db, User, Concept, ConceptPrerequisite,
    StudentMastery, Question, HiddenTestCase, AssessmentSession,
    Submission, SessionEvent, IntegritySignal, VivaRecord
)

from backend.app.api.auth import hash_password

def populate_seed_data():
    init_db()
    db = SessionLocal()

    # Backfill or update default credentials if seeded previously
    demo_creds = {
        "student_a": ("Alex Chen", "alex@brackyou.dev", "+1-555-0101"),
        "student_b": ("Jonah Miller", "jonah@brackyou.dev", "+1-555-0102"),
        "student_c": ("Priya Patel", "priya@brackyou.dev", "+1-555-0103"),
        "student_d": ("Sam Taylor", "sam@brackyou.dev", "+1-555-0104"),
        "trainer_1": ("Dr. Sarah Vance", "sarah.vance@brackyou.dev", "+1-555-0105"),
    }

    # Check if already seeded
    existing_a = db.query(User).filter(User.id == "student_a").first()
    if existing_a:
        # Backfill missing phone and password
        for uid, (name, email, phone) in demo_creds.items():
            u = db.query(User).filter(User.id == uid).first()
            if u:
                if not u.phone_number:
                    u.phone_number = phone
                if not u.password_hash:
                    u.password_hash = hash_password("password123")
        
        # Ensure sub_demo_alex has the actual tested refactored code (not starter code)
        existing_sub = db.query(Submission).filter(Submission.id == "sub_demo_alex").first()
        if existing_sub and ("TODO: Refactor" in existing_sub.code or "repo=None" in existing_sub.code):
            existing_sub.code = """class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        # Enforcing constructor dependency injection
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))"""

        # Ensure demo events have contentSnapshot populated
        events = db.query(SessionEvent).filter(SessionEvent.session_id == "session_demo_alex").all()
        q1_obj = db.query(Question).filter(Question.id == "q_di_1").first()
        st_code = q1_obj.starter_code if q1_obj else ""
        for ev in events:
            if isinstance(ev.payload, dict) and "contentSnapshot" not in ev.payload:
                new_payload = dict(ev.payload)
                if ev.event_type in ("paste", "run", "submit") and ev.timestamp_offset_ms >= 374000:
                    new_payload["contentSnapshot"] = existing_sub.code if existing_sub else st_code
                else:
                    new_payload["contentSnapshot"] = st_code
                ev.payload = new_payload

        db.commit()
        db.close()
        return

    # 1. Users
    default_pw_hash = hash_password("password123")
    users = [
        User(id="student_a", name="Alex Chen", email="alex@brackyou.dev", phone_number="+1-555-0101", password_hash=default_pw_hash, role="student"),
        User(id="student_b", name="Jonah Miller", email="jonah@brackyou.dev", phone_number="+1-555-0102", password_hash=default_pw_hash, role="student"),
        User(id="student_c", name="Priya Patel", email="priya@brackyou.dev", phone_number="+1-555-0103", password_hash=default_pw_hash, role="student"),
        User(id="student_d", name="Sam Taylor", email="sam@brackyou.dev", phone_number="+1-555-0104", password_hash=default_pw_hash, role="student"),
        User(id="trainer_1", name="Dr. Sarah Vance", email="sarah.vance@brackyou.dev", phone_number="+1-555-0105", password_hash=default_pw_hash, role="trainer"),
    ]
    db.add_all(users)
    db.commit()

    # 2. Concepts (Java OOP Curriculum DAG)
    concepts = [
        Concept(id="variables", title="Variables & Types", description="Primitive types, scoping, memory references", module="Java Basics", difficulty_order=1),
        Concept(id="methods", title="Methods & Execution Flow", description="Parameters, return values, stack frames", module="Java Basics", difficulty_order=2),
        Concept(id="classes_objects", title="Classes & Objects", description="Constructors, encapsulation, object lifecycle", module="OOP Fundamentals", difficulty_order=3),
        Concept(id="inheritance", title="Inheritance & Overriding", description="Subclassing, polymorphism, super constructor calls", module="OOP Fundamentals", difficulty_order=4),
        Concept(id="interfaces", title="Interfaces & Abstraction", description="Contract-driven design, abstract classes", module="Architecture Patterns", difficulty_order=5),
        Concept(id="dependency_injection", title="Dependency Injection", description="Inversion of Control, constructor injection, coupling", module="Architecture Patterns", difficulty_order=6),
        Concept(id="spring_boot", title="Spring Boot Framework", description="Dependency injection containers, annotations, MVC", module="Enterprise Frameworks", difficulty_order=7),
    ]
    db.add_all(concepts)
    db.commit()

    # 3. Prerequisite Edges (DAG)
    prereqs = [
        ConceptPrerequisite(concept_id="methods", prerequisite_id="variables", weight=1.0),
        ConceptPrerequisite(concept_id="classes_objects", prerequisite_id="methods", weight=1.0),
        ConceptPrerequisite(concept_id="inheritance", prerequisite_id="classes_objects", weight=1.0),
        ConceptPrerequisite(concept_id="interfaces", prerequisite_id="inheritance", weight=1.0),
        ConceptPrerequisite(concept_id="dependency_injection", prerequisite_id="inheritance", weight=0.6),
        ConceptPrerequisite(concept_id="dependency_injection", prerequisite_id="interfaces", weight=0.8),
        ConceptPrerequisite(concept_id="spring_boot", prerequisite_id="dependency_injection", weight=1.0),
    ]
    db.add_all(prereqs)
    db.commit()

    # 4. Student Mastery Profiles (The "Two Students" Divergence demonstration)
    # Student A (Alex): OOP Solid -> Ready for Dependency Injection
    mastery_a = [
        StudentMastery(student_id="student_a", concept_id="variables", p_known=0.95, evidence_count=8, confidence="high"),
        StudentMastery(student_id="student_a", concept_id="methods", p_known=0.92, evidence_count=7, confidence="high"),
        StudentMastery(student_id="student_a", concept_id="classes_objects", p_known=0.88, evidence_count=6, confidence="high"),
        StudentMastery(student_id="student_a", concept_id="inheritance", p_known=0.82, evidence_count=5, confidence="high"),
        StudentMastery(student_id="student_a", concept_id="interfaces", p_known=0.76, evidence_count=4, confidence="medium"),
        StudentMastery(student_id="student_a", concept_id="dependency_injection", p_known=0.68, evidence_count=3, confidence="medium"),
        StudentMastery(student_id="student_a", concept_id="spring_boot", p_known=0.20, evidence_count=0, confidence="low"),
    ]

    # Student B (Jonah): Weak OOP -> Inheritance Gap -> Remediation Loop
    mastery_b = [
        StudentMastery(student_id="student_b", concept_id="variables", p_known=0.85, evidence_count=5, confidence="high"),
        StudentMastery(student_id="student_b", concept_id="methods", p_known=0.72, evidence_count=4, confidence="medium"),
        StudentMastery(student_id="student_b", concept_id="classes_objects", p_known=0.45, evidence_count=4, confidence="medium"), # WEAK
        StudentMastery(student_id="student_b", concept_id="inheritance", p_known=0.25, evidence_count=2, confidence="low"),   # CRITICAL
        StudentMastery(student_id="student_b", concept_id="interfaces", p_known=0.15, evidence_count=1, confidence="low"),
        StudentMastery(student_id="student_b", concept_id="dependency_injection", p_known=0.10, evidence_count=0, confidence="low"),
        StudentMastery(student_id="student_b", concept_id="spring_boot", p_known=0.05, evidence_count=0, confidence="low"),
    ]

    # Additional cohort students for trainer heatmap
    mastery_cohort = [
        StudentMastery(student_id="student_c", concept_id="variables", p_known=0.90, evidence_count=6, confidence="high"),
        StudentMastery(student_id="student_c", concept_id="classes_objects", p_known=0.82, evidence_count=5, confidence="high"),
        StudentMastery(student_id="student_c", concept_id="inheritance", p_known=0.78, evidence_count=4, confidence="high"),
        StudentMastery(student_id="student_c", concept_id="interfaces", p_known=0.70, evidence_count=3, confidence="medium"),
        StudentMastery(student_id="student_c", concept_id="dependency_injection", p_known=0.55, evidence_count=2, confidence="medium"),
        StudentMastery(student_id="student_c", concept_id="spring_boot", p_known=0.15, evidence_count=0, confidence="low"),

        StudentMastery(student_id="student_d", concept_id="variables", p_known=0.98, evidence_count=10, confidence="high"),
        StudentMastery(student_id="student_d", concept_id="classes_objects", p_known=0.94, evidence_count=9, confidence="high"),
        StudentMastery(student_id="student_d", concept_id="inheritance", p_known=0.91, evidence_count=8, confidence="high"),
        StudentMastery(student_id="student_d", concept_id="interfaces", p_known=0.88, evidence_count=7, confidence="high"),
        StudentMastery(student_id="student_d", concept_id="dependency_injection", p_known=0.85, evidence_count=6, confidence="high"),
        StudentMastery(student_id="student_d", concept_id="spring_boot", p_known=0.75, evidence_count=5, confidence="high"),
    ]
    db.add_all(mastery_a + mastery_b + mastery_cohort)
    db.commit()

    # 5. Question Bank
    q1 = Question(
        id="q_di_1",
        title="Constructor Dependency Injection in UserService",
        prompt="Refactor the `UserService` class to accept an instance of `UserRepository` via constructor injection instead of directly hardcoding it. Ensure the dependency is immutable and encapsulated.",
        starter_code="""# Python Starter Equivalent
class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo=None):
        # TODO: Refactor to enforce constructor dependency injection
        self.repo = repo

    def fetch_user(self, user_id):
        if not self.repo:
            return "No repository configured"
        return self.repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))
""",
        language="python",
        difficulty="medium",
        primary_concept_id="dependency_injection"
    )

    q2 = Question(
        id="q_inherit_1",
        title="Shape Hierarchy with Method Overriding",
        prompt="Define an abstract `Shape` base class with an `area()` method. Implement `Circle` and `Rectangle` subclasses with their respective calculations.",
        starter_code="""import math

class Shape:
    def area(self):
        raise NotImplementedError("Subclasses must implement area()")

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return round(math.pi * self.radius ** 2, 2)

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

if __name__ == '__main__':
    c = Circle(5)
    r = Rectangle(4, 6)
    print(f"Circle Area: {c.area()}")
    print(f"Rectangle Area: {r.area()}")
""",
        language="python",
        difficulty="medium",
        primary_concept_id="inheritance"
    )

    q3 = Question(
        id="q_obj_1",
        title="Encapsulated Bank Account with Constructor Validation",
        prompt="Implement a `BankAccount` class where the account holder's balance cannot be directly mutated or initialized with a negative number. Provide `deposit()` and `withdraw()` methods.",
        starter_code="""class BankAccount:
    def __init__(self, account_id, initial_balance=0.0):
        if initial_balance < 0:
            raise ValueError("Initial balance cannot be negative")
        self.account_id = account_id
        self._balance = float(initial_balance)

    def deposit(self, amount):
        if amount <= 0:
            return False
        self._balance += amount
        return True

    def withdraw(self, amount):
        if amount <= 0 or amount > self._balance:
            return False
        self._balance -= amount
        return True

    def get_balance(self):
        return self._balance

if __name__ == '__main__':
    acc = BankAccount("ACC-100", 150.0)
    acc.deposit(50.0)
    acc.withdraw(30.0)
    print(f"Final Balance: {acc.get_balance()}")
""",
        language="python",
        difficulty="easy",
        primary_concept_id="classes_objects"
    )

    q_adversarial = Question(
        id="q_adversarial_demo",
        title="Adversarial Sandbox Test (Infinite Loop Containment)",
        prompt="Demonstration of the hardened security sandbox. Submit an infinite loop or process exhaustion snippet to verify 3000ms watchdog termination.",
        starter_code="""import time

def process():
    print("Beginning infinite execution loop...")
    count = 0
    while True:
        count += 1
        # Infinite loop designed to test execution watchdog

if __name__ == '__main__':
    process()
""",
        language="python",
        difficulty="hard",
        primary_concept_id="variables"
    )

    db.add_all([q1, q2, q3, q_adversarial])
    db.commit()

    # 6. Test Cases
    tc_di = [
        HiddenTestCase(question_id="q_di_1", name="Basic Injection", input_data="", expected_output="User_101", is_hidden=False),
        HiddenTestCase(question_id="q_di_1", name="Null Dependency Guard", input_data="", expected_output="User_101", is_hidden=True),
    ]
    tc_inherit = [
        HiddenTestCase(question_id="q_inherit_1", name="Circle & Rectangle Areas", input_data="", expected_output="Circle Area: 78.54\nRectangle Area: 24", is_hidden=False),
        HiddenTestCase(question_id="q_inherit_1", name="Polymorphic Loop Calculation", input_data="", expected_output="Circle Area: 78.54\nRectangle Area: 24", is_hidden=True),
    ]
    tc_obj = [
        HiddenTestCase(question_id="q_obj_1", name="Deposit and Withdraw", input_data="", expected_output="Final Balance: 170.0", is_hidden=False),
        HiddenTestCase(question_id="q_obj_1", name="Negative Overdraft Prevention", input_data="", expected_output="Final Balance: 170.0", is_hidden=True),
    ]
    db.add_all(tc_di + tc_inherit + tc_obj)
    db.commit()

    # 7. Seeded Pre-Recorded Session with Integrity Signals for Alex Chen (Demo Ready!)
    demo_session = AssessmentSession(
        id="session_demo_alex",
        student_id="student_a",
        question_id="q_di_1",
        started_at=datetime.now(timezone.utc),
        submitted_at=datetime.now(timezone.utc),
        status="completed"
    )
    db.add(demo_session)
    db.commit()

    tested_alex_code = """class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        # Enforcing constructor dependency injection
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))"""

    demo_submission = Submission(
        id="sub_demo_alex",
        session_id="session_demo_alex",
        code=tested_alex_code,
        passed_tests=2,
        total_tests=2,
        execution_time_ms=84,
        status="passed",
        stdout="User_101\n",
        stderr="",
        test_details=[
            {"name": "Basic Injection", "passed": True, "is_hidden": False, "execution_time_ms": 42},
            {"name": "Null Dependency Guard", "passed": True, "is_hidden": True, "execution_time_ms": 42}
        ]
    )
    db.add(demo_submission)

    # Telemetry events reproducing a coding timeline with a paste anomaly at 06:14
    demo_events = [
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=10000, event_type="focus", payload={"note": "Session started", "contentSnapshot": q1.starter_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=45000, event_type="key", payload={"key": "c", "line": 5, "contentSnapshot": q1.starter_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=62000, event_type="run", payload={"result": "failed", "contentSnapshot": q1.starter_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=140000, event_type="delete", payload={"count": 14, "contentSnapshot": q1.starter_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=210000, event_type="blur", payload={"reason": "tab_switch", "contentSnapshot": q1.starter_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=257000, event_type="focus", payload={"duration_ms": 47000, "contentSnapshot": q1.starter_code}),
        # Large Paste Event at 06:14 (374000 ms)
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=374000, event_type="paste", payload={"char_count": 340, "line": 8, "text": tested_alex_code, "contentSnapshot": tested_alex_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=410000, event_type="run", payload={"result": "passed", "contentSnapshot": tested_alex_code}),
        SessionEvent(session_id="session_demo_alex", timestamp_offset_ms=450000, event_type="submit", payload={"tests_passed": 2, "contentSnapshot": tested_alex_code})
    ]
    db.add_all(demo_events)

    # Integrity Signals corresponding to the session
    demo_signals = [
        IntegritySignal(
            id="sig_1",
            session_id="session_demo_alex",
            signal_type="large_paste",
            timestamp_offset_ms=374000,
            severity="review_recommended",
            evidence_description="Large paste: 340 characters inserted in a single action at 06:14. Code appeared faster than observed typing rhythm.",
            trainer_disposition="pending",
            student_rebuttal="I consulted the project documentation in another window to verify the constructor signature convention."
        ),
        IntegritySignal(
            id="sig_2",
            session_id="session_demo_alex",
            signal_type="tab_switch_prolonged",
            timestamp_offset_ms=210000,
            severity="info",
            evidence_description="Editor focus lost for 47 seconds between 03:30 and 04:17 before returning to active editing.",
            trainer_disposition="pending",
            student_rebuttal=""
        )
    ]
    db.add_all(demo_signals)

    # Viva record
    demo_viva = VivaRecord(
        id="viva_demo_alex",
        submission_id="sub_demo_alex",
        question_text="In `UserService`, you instantiated dependencies through the constructor. Why is constructor injection preferable to hardcoding dependencies inside methods?",
        student_answer="Constructor injection guarantees that the UserService cannot be instantiated in an invalid state with a null repository, improving testability and loose coupling.",
        match_score=95,
        rubric_feedback="Excellent technical explanation. Your response accurately demonstrated understanding of dependency injection and null safety.",
        evaluated_at=datetime.now(timezone.utc)
    )
    db.add(demo_viva)

    db.commit()
    db.close()
    print("Database successfully initialized and seeded with curriculum, questions, students, and demo replays!")

if __name__ == '__main__':
    populate_seed_data()
