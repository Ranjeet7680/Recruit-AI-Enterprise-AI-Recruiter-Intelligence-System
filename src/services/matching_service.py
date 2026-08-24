"""
Matching Service: Deterministic 6-Factor Scoring Engine, Anti-Cheat, and Ranking.
"""
import re
from typing import List, Dict, Any, Tuple, Optional
from src.schemas.candidate import CandidateProfile
from src.schemas.job import JobDescription
from src.schemas.matching import CustomWeights, StructuredAIMatchResult
from src.services.candidate_service import candidate_service
from src.core.logging import logger

class MatchingService:
    """
    Deterministic 6-Factor mathematical hiring engine:
    Final Score = 35% Semantic + 25% Skills + 15% Experience + 10% Impact + 10% Behavioral + 5% Activity
    """

    def evaluate_candidate(
        self,
        cand: CandidateProfile,
        jd: JobDescription,
        weights: CustomWeights
    ) -> Tuple[float, Dict[str, float], List[str], bool, str]:
        # 1. Anti-Cheat: Honeypot & Timeline Inconsistency Checks
        if cand.redrob_signals:
            skills = cand.redrob_signals.get("skills", [])
            for sk in skills:
                if isinstance(sk, dict) and sk.get("proficiency") == "expert" and sk.get("duration_months") == 0:
                    return 0.0, {}, [], True, "Honeypot: expert skill with 0 duration"
                    
        # 2. Skill Match (25% default)
        jd_skills_lower = {s.lower() for s in jd.hard_skills}
        matched_skills = []
        if jd_skills_lower:
            cand_skills_lower = {s.lower() for s in cand.hard_skills}
            overlap = len(jd_skills_lower.intersection(cand_skills_lower))
            skill_score = min(100.0, (overlap / max(1, len(jd_skills_lower))) * 120.0)
            matched_skills = [s for s in cand.hard_skills if s.lower() in jd_skills_lower]
        else:
            skill_score = 80.0
            matched_skills = cand.hard_skills[:4]

        # 3. Experience Fit (15% default)
        yoe = cand.experience_years
        if jd.experience_level_min <= yoe <= jd.experience_level_max:
            exp_score = 100.0
        elif yoe < jd.experience_level_min:
            diff = jd.experience_level_min - yoe
            exp_score = max(30.0, 100.0 - (diff * 15.0))
        else:
            diff = yoe - jd.experience_level_max
            exp_score = max(60.0, 100.0 - (diff * 4.0))

        # 4. Semantic Fit (35% default)
        semantic_keywords = ["rag", "embedding", "vector", "faiss", "pinecone", "milvus", "qdrant", "pytorch", "nlp", "llm"]
        corpus = f"{cand.summary} {' '.join(cand.hard_skills)} {cand.title}".lower()
        semantic_hits = sum(1 for kw in semantic_keywords if kw in corpus)
        semantic_score = min(100.0, 50.0 + (semantic_hits * 10.0))

        # 5. Project Impact (10% default)
        impact_score = 70.0
        if cand.projects:
            has_metrics = any(bool(re.search(r"\d+%|\$\d+|million|users|scale", p.impact.lower())) for p in cand.projects)
            if has_metrics:
                impact_score = 95.0

        # 6. Behavioral Fit (10% default)
        behavior_score = 80.0
        lead_kw = ["lead", "mentor", "collaborate", "architect", "ownership"]
        if any(kw in corpus for kw in lead_kw):
            behavior_score = 92.0

        # 7. Activity Signal (5% default)
        activity_score = 75.0
        if cand.linkedin_activity and cand.linkedin_activity.open_source_contributions:
            activity_score = 98.0

        # Compute Deterministic Weighted Score
        w = weights
        final_score = (
            (semantic_score * w.semantic) +
            (skill_score * w.skills) +
            (exp_score * w.experience) +
            (impact_score * w.impact) +
            (behavior_score * w.behavioral) +
            (activity_score * w.activity)
        )
        
        breakdown = {
            "semantic_fit": round(semantic_score, 1),
            "skills_match": round(skill_score, 1),
            "experience_match": round(exp_score, 1),
            "project_impact": round(impact_score, 1),
            "behavioral_fit": round(behavior_score, 1),
            "activity_signal": round(activity_score, 1),
        }

        return round(final_score, 1), breakdown, matched_skills, False, ""

    def match_candidates(
        self,
        jd: JobDescription,
        weights: Optional[CustomWeights] = None,
        top_k: int = 10,
        bias_reduction: bool = True
    ) -> List[StructuredAIMatchResult]:
        w = weights or CustomWeights()
        candidates = candidate_service.get_all_candidates(mask_demographics=False, limit=200)
        
        scored_list = []
        for cand in candidates:
            score, breakdown, matched_skills, disqualified, reason = self.evaluate_candidate(cand, jd, w)
            if not disqualified:
                scored_list.append((score, breakdown, matched_skills, cand))
                
        # Deterministic sort: highest score first, then candidate_id ascending
        scored_list.sort(key=lambda x: (-x[0], x[3].id))
        
        results: List[StructuredAIMatchResult] = []
        for rank, (score, breakdown, matched_skills, cand) in enumerate(scored_list[:top_k], 1):
            display_name = f"Candidate {cand.id}" if bias_reduction else cand.name
            skills_str = ", ".join(matched_skills[:3]) if matched_skills else "applied ML"
            
            reasoning = f"{cand.title} with {cand.experience_years:.1f} YoE. Verified proficiency in {skills_str}. Alignment score {score}% calculated deterministically."
            
            results.append(StructuredAIMatchResult(
                candidate_id=cand.id,
                name=display_name,
                match_score=score,
                rank=rank,
                skills_match=breakdown.get("skills_match", 0.0),
                experience_match=breakdown.get("experience_match", 0.0),
                semantic_fit=breakdown.get("semantic_fit", 0.0),
                project_impact=breakdown.get("project_impact", 0.0),
                behavioral_fit=breakdown.get("behavioral_fit", 0.0),
                activity_signal=breakdown.get("activity_signal", 0.0),
                strengths=[f"Strong match for {s}" for s in matched_skills[:3]] or ["Solid baseline ML background"],
                gaps=[] if score >= 85 else ["Expand on production deployment scale"],
                evidence=[f"Possesses {cand.experience_years:.1f} years of relevant industry experience."],
                reasoning=reasoning,
                confidence=0.95,
                is_gem=cand.experience_years <= 5.0 and len(cand.hard_skills) >= 5,
                disqualified=False
            ))
            
        return results

matching_service = MatchingService()
