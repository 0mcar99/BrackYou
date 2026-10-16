import os
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    create_engine, Column, Integer, Float, String, Text, Boolean, 
    DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brackyou.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(20), default="student")  # student, trainer, admin
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    masteries = relationship("StudentMastery", back_populates="student", cascade="all, delete-orphan")
    sessions = relationship("AssessmentSession", back_populates="student", cascade="all, delete-orphan")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(50), primary_key=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(100), nullable=False)
    difficulty_order = Column(Integer, default=1)

    questions = relationship("Question", back_populates="primary_concept")


class ConceptPrerequisite(Base):
    __tablename__ = "concept_prerequisites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    concept_id = Column(String(50), ForeignKey("concepts.id"), nullable=False)
    prerequisite_id = Column(String(50), ForeignKey("concepts.id"), nullable=False)
    weight = Column(Float, default=1.0)


class StudentMastery(Base):
    __tablename__ = "student_mastery"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    concept_id = Column(String(50), ForeignKey("concepts.id"), nullable=False)
    p_known = Column(Float, default=0.10)
    evidence_count = Column(Integer, default=0)
    confidence = Column(String(20), default="low")  # low, medium, high
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", back_populates="masteries")
    concept = relationship("Concept")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True)
    title = Column(String(200), nullable=False)
    prompt = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=False)
    solution_sample = Column(Text, nullable=True)
    language = Column(String(30), default="java")
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    primary_concept_id = Column(String(50), ForeignKey("concepts.id"), nullable=False)

    primary_concept = relationship("Concept", back_populates="questions")
    test_cases = relationship("HiddenTestCase", back_populates="question", cascade="all, delete-orphan")


class HiddenTestCase(Base):
    __tablename__ = "hidden_test_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String(50), ForeignKey("questions.id"), nullable=False)
    name = Column(String(100), default="Test Case")
    input_data = Column(Text, default="")
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)
    timeout_ms = Column(Integer, default=3000)

    question = relationship("Question", back_populates="test_cases")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(String(50), primary_key=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    question_id = Column(String(50), ForeignKey("questions.id"), nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="in_progress")  # in_progress, completed, flagged

    student = relationship("User", back_populates="sessions")
    question = relationship("Question")
    submissions = relationship("Submission", back_populates="session", cascade="all, delete-orphan")
    events = relationship("SessionEvent", back_populates="session", cascade="all, delete-orphan")
    signals = relationship("IntegritySignal", back_populates="session", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(50), primary_key=True)
    session_id = Column(String(50), ForeignKey("assessment_sessions.id"), nullable=False)
    code = Column(Text, nullable=False)
    passed_tests = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    execution_time_ms = Column(Integer, default=0)
    status = Column(String(30), default="passed")  # passed, failed, tle, mle, error
    stdout = Column(Text, default="")
    stderr = Column(Text, default="")
    test_details = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("AssessmentSession", back_populates="submissions")
    viva_records = relationship("VivaRecord", back_populates="submission", cascade="all, delete-orphan")


class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("assessment_sessions.id"), nullable=False)
    timestamp_offset_ms = Column(Integer, nullable=False)
    event_type = Column(String(30), nullable=False)  # key, paste, delete, run, blur, focus
    payload = Column(JSON, default=dict)

    session = relationship("AssessmentSession", back_populates="events")


class IntegritySignal(Base):
    __tablename__ = "integrity_signals"

    id = Column(String(50), primary_key=True)
    session_id = Column(String(50), ForeignKey("assessment_sessions.id"), nullable=False)
    signal_type = Column(String(50), nullable=False)  # large_paste, rhythm_anomaly, missing_cycle, uniform_burst
    timestamp_offset_ms = Column(Integer, nullable=False)
    severity = Column(String(20), default="info")  # info, review_recommended, high
    evidence_description = Column(Text, nullable=False)
    trainer_disposition = Column(String(30), default="pending")  # pending, explained, conversation, escalated
    student_rebuttal = Column(Text, nullable=True)

    session = relationship("AssessmentSession", back_populates="signals")


class VivaRecord(Base):
    __tablename__ = "viva_records"

    id = Column(String(50), primary_key=True)
    submission_id = Column(String(50), ForeignKey("submissions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    student_answer = Column(Text, nullable=True)
    match_score = Column(Integer, default=0)  # 0 to 100
    rubric_feedback = Column(Text, default="")
    evaluated_at = Column(DateTime, nullable=True)

    submission = relationship("Submission", back_populates="viva_records")


def init_db():
    Base.metadata.create_all(bind=engine)
