"""
Candidate Service: Data ingestion, PII masking, directory loading, and search.
"""
import os
import json
import re
from typing import List, Optional, Dict, Any
from src.schemas.candidate import CandidateProfile
from src.core.config import settings
from src.core.logging import logger

class CandidateService:
    def __init__(self):
        self._cache: List[CandidateProfile] = []
        self._load_candidates()

    def _load_candidates(self):
        """Loads candidates from processed data directory or fallback sample."""
        paths_to_try = [
            os.path.join(settings.PROCESSED_DATA_DIR, "candidates.json"),
            os.path.join(settings.DATA_DIR, "candidates.json"),
            os.path.join(settings.SAMPLE_DATA_DIR, "sample_candidates.json"),
        ]
        
        for path in paths_to_try:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        raw_data = json.load(f)
                        if isinstance(raw_data, list):
                            self._cache = [self._normalize_candidate(c) for c in raw_data]
                            logger.info(f"Loaded {len(self._cache)} candidates from {path}")
                            return
                except Exception as e:
                    logger.error(f"Failed loading candidate file {path}: {e}")
        
        logger.warning("No candidate file found. Initializing empty candidate repository.")
        self._cache = []

    def _normalize_candidate(self, c: Dict[str, Any]) -> CandidateProfile:
        """Ensures dict conforms to CandidateProfile model."""
        cid = str(c.get("id") or c.get("candidate_id") or "CAND_0000000")
        name = c.get("name") or f"Candidate {cid}"
        email = c.get("email") or f"{cid.lower()}@demo.nexora.ai"
        
        # Profile extraction if nested (like in Redrob challenge schema)
        profile = c.get("profile", {})
        if profile:
            yoe = float(profile.get("years_of_experience", c.get("experience_years", 3.0)))
            title = profile.get("current_title", c.get("title", "Engineer"))
            summary = profile.get("summary", c.get("summary", ""))
            loc = profile.get("location", c.get("location", "India"))
            country = profile.get("country", c.get("country", "India"))
        else:
            yoe = float(c.get("experience_years", 3.0))
            title = c.get("title", "Engineer")
            summary = c.get("summary", "")
            loc = c.get("location", "India")
            country = c.get("country", "India")

        skills = [s.get("name") if isinstance(s, dict) else str(s) for s in c.get("skills", c.get("hard_skills", []))]

        # Normalize Education
        raw_edu = c.get("education", [])
        education_list = []
        if isinstance(raw_edu, dict):
            education_list.append({
                "institution": raw_edu.get("university") or raw_edu.get("institution", "University"),
                "degree": raw_edu.get("degree", "Degree"),
                "year": str(raw_edu.get("year", ""))
            })
        elif isinstance(raw_edu, list):
            for e in raw_edu:
                if isinstance(e, dict):
                    education_list.append({
                        "institution": e.get("university") or e.get("institution", "University"),
                        "degree": e.get("degree", "Degree"),
                        "year": str(e.get("year", ""))
                    })

        # Normalize LinkedIn Activity
        raw_la = c.get("linkedin_activity", {})
        la_dict = {}
        if isinstance(raw_la, dict):
            la_dict = {
                "recent_posts_summary": raw_la.get("recent_posts_summary", ""),
                "open_source_contributions": bool(raw_la.get("open_source_contributions", False)),
                "certifications": raw_la.get("certifications", []),
                "recruiter_response_rate": float(raw_la.get("recruiter_response_rate", 0.8)),
                "notice_period_days": int(raw_la.get("notice_period_days", 30)),
                "open_to_work": bool(raw_la.get("open_to_work", True))
            }

        return CandidateProfile(
            id=cid,
            name=name,
            email=email,
            phone=c.get("phone", ""),
            title=title,
            summary=summary,
            experience_years=yoe,
            hard_skills=skills,
            soft_skills=c.get("soft_skills", ["Communication", "Problem Solving"]),
            experience_timeline=c.get("experience_timeline", c.get("career_history", [])),
            education=education_list,
            projects=c.get("projects", []),
            linkedin_activity=la_dict,
            location=loc,
            country=country,
            redrob_signals=c.get("redrob_signals", {})
        )

    def get_all_candidates(self, mask_demographics: bool = True, query: Optional[str] = None, limit: int = 50) -> List[CandidateProfile]:
        results = self._cache
        if query:
            q_lower = query.lower()
            results = [
                c for c in results
                if q_lower in c.name.lower()
                or q_lower in c.summary.lower()
                or any(q_lower in s.lower() for s in c.hard_skills)
            ]
            
        sliced = results[:limit]
        if mask_demographics:
            return [self.mask_profile(c) for c in sliced]
        return sliced

    def get_candidate_by_id(self, candidate_id: str, mask_demographics: bool = True) -> Optional[CandidateProfile]:
        for c in self._cache:
            if c.id == candidate_id:
                return self.mask_profile(c) if mask_demographics else c
        return None

    def mask_profile(self, candidate: CandidateProfile) -> CandidateProfile:
        """Sanitizes all PII for GDPR / EEO compliance."""
        masked = candidate.model_copy(deep=True)
        masked.name = f"Candidate {candidate.id}"
        masked.email = f"candidate.{candidate.id.lower()}@anonymized.org"
        masked.phone = "[REDACTED]"
        masked.location = "India"
        for edu in masked.education:
            edu.institution = "Verified Technical Institution"
            edu.year = "[REDACTED]"
        return masked

    def add_candidate(self, candidate: CandidateProfile) -> CandidateProfile:
        self._cache.insert(0, candidate)
        logger.info(f"Added new candidate {candidate.id} to repository cache.")
        return candidate

candidate_service = CandidateService()
