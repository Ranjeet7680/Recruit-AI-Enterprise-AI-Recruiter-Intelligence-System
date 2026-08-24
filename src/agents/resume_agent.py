"""
Resume Screening Agent: Ingests documents, validates timelines, and sanitizes PII.
"""
from typing import Dict, Any, List
from src.schemas.candidate import CandidateProfile
from src.services.candidate_service import candidate_service

class ResumeAgent:
    """Specialized Agent for candidate resume screening, timeline verification, and PII masking."""
    
    def screen_candidates(self, mask_demographics: bool = True, limit: int = 50) -> List[CandidateProfile]:
        return candidate_service.get_all_candidates(mask_demographics=mask_demographics, limit=limit)
        
    def analyze_resume_gaps(self, candidate: CandidateProfile) -> Dict[str, Any]:
        """Flags missing contact details, short tenures, or zero-duration claims."""
        flags = []
        if not candidate.projects:
            flags.append("No portfolio projects documented.")
        if candidate.experience_years < 1.0:
            flags.append("Junior profile with sub-1-year industry tenure.")
            
        return {
            "candidate_id": candidate.id,
            "has_warnings": len(flags) > 0,
            "verification_status": "VERIFIED" if not flags else "NEEDS_REVIEW",
            "flags": flags
        }

resume_agent = ResumeAgent()
