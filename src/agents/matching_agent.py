"""
Candidate Matching Agent: Deterministic multi-factor scoring & gap breakdown.
"""
from typing import List, Dict, Any, Optional
from src.schemas.job import JobDescription
from src.schemas.matching import StructuredAIMatchResult, CustomWeights
from src.services.matching_service import matching_service

class MatchingAgent:
    """Specialized Agent for deterministic ranking and skill-gap identification."""
    
    def rank_candidates(
        self,
        jd: JobDescription,
        weights: Optional[CustomWeights] = None,
        top_k: int = 5,
        bias_reduction: bool = True
    ) -> List[StructuredAIMatchResult]:
        return matching_service.match_candidates(
            jd=jd,
            weights=weights,
            top_k=top_k,
            bias_reduction=bias_reduction
        )

matching_agent = MatchingAgent()
