"""
Main FastAPI Application Entrypoint for Nexora Enterprise AI Recruiter.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.core.config import settings
from src.core.logging import logger
from src.api.routes import auth, candidates, matching, copilot, analytics, agents

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Autonomous AI Recruitment Platform featuring 6-Factor Deterministic Scoring, Anti-Cheat, and RBAC.",
    version=settings.APP_VERSION
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files (e.g. video-call-redesign)
video_dir = os.path.join(settings.BASE_DIR, "video-call-redesign")
if os.path.exists(video_dir):
    app.mount("/video-call-redesign", StaticFiles(directory=video_dir), name="video-call-redesign")

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
app.include_router(copilot.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(agents.router, prefix="/api")

# Legacy/Compatibility aliases
app.include_router(matching.router, prefix="")
app.include_router(copilot.router, prefix="")

@app.get("/")
def read_root():
    frontend_index = os.path.join(settings.BASE_DIR, "frontend", "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {"status": "online", "system": settings.APP_NAME}

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nexora-enterprise-engine",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

logger.info(f"Initialized {settings.APP_NAME} v{settings.APP_VERSION}")
