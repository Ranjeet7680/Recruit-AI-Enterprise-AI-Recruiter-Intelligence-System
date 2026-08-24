"""
Matching & Algorithmic Scoring Endpoints.
"""
from fastapi import APIRouter, Depends
from src.schemas.matching import MatchRequest, MatchResponse
from src.schemas.job import JobDescription
from src.schemas.auth import UserProfile
from src.services.matching_service import matching_service
from src.api.dependencies import get_current_user

router = APIRouter(prefix="/match", tags=["Matching"])

@router.post("", response_model=MatchResponse)
def match_candidates_against_jd(
    req: MatchRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    jd = JobDescription(
        title="Senior AI Engineer",
        hard_skills=["PyTorch", "Embeddings", "FAISS", "RAG", "FastAPI", "Docker"],
        experience_level_min=5.0,
        experience_level_max=9.0
    )
    
    top_matches = matching_service.match_candidates(
        jd=jd,
        weights=req.custom_weights,
        top_k=req.top_k,
        bias_reduction=req.bias_reduction
    )

    weights_dict = req.custom_weights.model_dump() if req.custom_weights else {
        "semantic": 0.35, "skills": 0.25, "experience": 0.15, "impact": 0.10, "behavioral": 0.10, "activity": 0.05
    }

    return MatchResponse(
        job_title=jd.title,
        candidates_analyzed=len(top_matches) * 5,
        top_matches=top_matches,
        scoring_weights_used=weights_dict,
        bias_reduction_active=req.bias_reduction
    )
