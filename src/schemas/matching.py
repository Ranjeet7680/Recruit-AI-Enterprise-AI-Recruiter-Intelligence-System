"""
Deterministic Scoring & Structured AI Reasoning Schemas.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CustomWeights(BaseModel):
    semantic: float = Field(default=0.35, ge=0.0, le=1.0)
    skills: float = Field(default=0.25, ge=0.0, le=1.0)
    experience: float = Field(default=0.15, ge=0.0, le=1.0)
    impact: float = Field(default=0.10, ge=0.0, le=1.0)
    behavioral: float = Field(default=0.10, ge=0.0, le=1.0)
    activity: float = Field(default=0.05, ge=0.0, le=1.0)

class MatchRequest(BaseModel):
    jd_text: str = Field(..., min_length=10, max_length=50000)
    persona: str = Field(default="general", max_length=50)
    custom_weights: Optional[CustomWeights] = None
    bias_reduction: bool = True
    top_k: int = Field(default=10, ge=1, le=100)

class StructuredAIMatchResult(BaseModel):
    candidate_id: str
    name: str
    match_score: float = Field(..., ge=0.0, le=100.0, description="Deterministically computed score")
    rank: int = Field(..., ge=1)
    skills_match: float = Field(..., ge=0.0, le=100.0)
    experience_match: float = Field(..., ge=0.0, le=100.0)
    semantic_fit: float = Field(..., ge=0.0, le=100.0)
    project_impact: float = Field(..., ge=0.0, le=100.0)
    behavioral_fit: float = Field(..., ge=0.0, le=100.0)
    activity_signal: float = Field(..., ge=0.0, le=100.0)
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    reasoning: str
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    is_gem: bool = False
    disqualified: bool = False

class MatchResponse(BaseModel):
    job_title: str
    candidates_analyzed: int
    top_matches: List[StructuredAIMatchResult]
    scoring_weights_used: Dict[str, float]
    bias_reduction_active: bool
