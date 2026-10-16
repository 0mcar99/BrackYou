from fastapi import APIRouter, Depends
from backend.app.models.entities import SessionLocal, Concept, ConceptPrerequisite

router = APIRouter(prefix="/curriculum", tags=["curriculum"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/concepts")
def get_concepts(db=Depends(get_db)):
    concepts = db.query(Concept).order_by(Concept.difficulty_order).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "module": c.module,
            "difficulty_order": c.difficulty_order
        }
        for c in concepts
    ]

@router.get("/graph")
def get_curriculum_graph(db=Depends(get_db)):
    concepts = db.query(Concept).order_by(Concept.difficulty_order).all()
    prereqs = db.query(ConceptPrerequisite).all()

    nodes = [
        {
            "id": c.id,
            "title": c.title,
            "module": c.module,
            "difficulty_order": c.difficulty_order,
            "description": c.description
        }
        for c in concepts
    ]

    edges = [
        {
            "source": p.prerequisite_id,
            "target": p.concept_id,
            "weight": p.weight
        }
        for p in prereqs
    ]

    return {
        "nodes": nodes,
        "edges": edges
    }
