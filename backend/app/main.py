from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.models.entities import init_db
from backend.app.seed.seed_data import populate_seed_data
from backend.app.api import (
    auth, curriculum, adaptive, assessment, telemetry, viva, trainer
)

app = FastAPI(
    title="BrackYou — Adaptive Learning & Assessment API",
    description="Backend microservice engine featuring BKT mastery, prerequisite DAG walk, hardened sandbox, keystroke forensics, and AI viva.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API module routers
app.include_router(auth.router, prefix="/api")
app.include_router(curriculum.router, prefix="/api")
app.include_router(adaptive.router, prefix="/api")
app.include_router(assessment.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")
app.include_router(viva.router, prefix="/api")
app.include_router(trainer.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()
    populate_seed_data()

@app.get("/")
def root():
    return {
        "portal": "BrackYou Adaptive Learning & Assessment Portal",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
