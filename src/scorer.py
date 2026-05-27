import re
from typing import Dict, Any, List
from src.parser import CandidateProfile, JobDescription
from src.ontology_matcher import SkillOntologyEngine

ontology_engine = SkillOntologyEngine()

def calculate_technical_score(candidate: CandidateProfile, jd: JobDescription) -> float:
    """Uses SkillOntologyEngine to calculate technical hard skills compatibility (incorporating equivalents)."""
    score = ontology_engine.evaluate_skill_fit(candidate.hard_skills, jd.hard_skills)
    return round(score * 100.0, 1)

def calculate_experience_score(candidate: CandidateProfile, jd: JobDescription) -> float:
    """Evaluates requested vs possessed years of experience."""
    years = candidate.experience_years
    min_years = jd.experience_level_min
    max_years = jd.experience_level_max
    
    # Perfect fit
    if min_years <= years <= max_years:
        return 100.0
    # Under-experienced
    elif years < min_years:
        diff = min_years - years
        score = 100.0 - (diff * 12.0)
        return max(35.0, score)
    # Over-experienced
    else:
        diff = years - max_years
        score = 100.0 - (diff * 4.0)
        return max(65.0, score)

def calculate_semantic_score(vector_similarity: float) -> float:
    """Translates dense similarity metric to [0, 100]."""
    sim = max(0.0, min(1.0, vector_similarity))
    if sim >= 0.85:
        return 100.0
    elif sim >= 0.3:
        return 40.0 + (sim - 0.3) * (60.0 / 0.55)
    else:
        return sim * (40.0 / 0.3)

def calculate_behavioral_score(candidate: CandidateProfile, jd: JobDescription) -> float:
    """Uses ontology matching to align candidate behaviors with target traits."""
    score = ontology_engine.evaluate_skill_fit(candidate.soft_skills, jd.behavior_traits)
    return round(50.0 + (score * 50.0), 1)

def calculate_leadership_score(candidate: CandidateProfile) -> float:
    """Checks for leadership, mentorship, and manager keywords in summaries and history."""
    corpus = (candidate.summary + " " + " ".join(candidate.soft_skills)).lower()
    for exp in candidate.experience_timeline:
        corpus += " " + exp.role.lower() + " " + exp.description.lower()
        
    lead_keywords = ["lead", "manage", "mentor", "director", "supervise", "head", "architect", "coordinate"]
    matches = sum(1 for kw in lead_keywords if kw in corpus)
    
    # 0 matches = 50%, 1 match = 70%, 2+ matches = 100%
    if matches == 0:
        return 50.0
    elif matches == 1:
        return 75.0
    return 100.0

def calculate_innovation_score(candidate: CandidateProfile) -> float:
    """Credits open-source commits and hackathon/patent keywords."""
    score = 50.0
    
    # Check open source
    os_act = candidate.linkedin_activity.open_source_contributions
    if os_act:
        os_act_l = os_act.lower()
        if "active" in os_act_l or "maintainer" in os_act_l:
            score += 30.0
        elif "commit" in os_act_l or "contributed" in os_act_l:
            score += 15.0
            
    # Check project/hackathon keywords
    proj_text = " ".join([p.description.lower() for p in candidate.projects])
    if "hackathon" in proj_text or "patent" in proj_text or "open-source" in proj_text:
        score += 20.0
        
    return min(100.0, score)

def calculate_learning_agility(candidate: CandidateProfile) -> float:
    """Calculates index based on certifications count and diverse tool adoption."""
    cert_count = len(candidate.certifications)
    # 0 certs = 60%, 1 cert = 80%, 2+ certs = 100%
    score = 60.0 + (cert_count * 20.0)
    
    # Add bonus for diverse technical skills (cross domain agility)
    if len(candidate.hard_skills) > 7:
        score += 10.0
        
    return min(100.0, score)

def calculate_stability_score(candidate: CandidateProfile) -> float:
    """Evaluates average tenure duration per company to detect job hopping."""
    roles_count = len(candidate.experience_timeline)
    if roles_count == 0:
        return 80.0
        
    avg_tenure = candidate.experience_years / roles_count
    
    # > 3 years avg tenure = 100%
    # 2-3 years = 90%
    # 1-2 years = 70%
    # < 1 year = 40%
    if avg_tenure >= 3.0:
        return 100.0
    elif avg_tenure >= 2.0:
        return 90.0
    elif avg_tenure >= 1.0:
        return 70.0
    return 40.0

def score_candidate(
    candidate: CandidateProfile, 
    jd: JobDescription, 
    vector_similarity: float,
    persona: str = "general",
    custom_weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Applies the official 8-factor Hybrid Scoring Engine:
      Final Score =
        0.25 Technical + 0.20 Experience + 0.15 Semantic + 0.10 Behavioral +
        0.10 Leadership + 0.08 Innovation + 0.07 Agility + 0.05 Stability
    
    Supports dynamic Hiring Manager Persona shifting:
      - 'startup': boosts Innovation & Behavioral weight
      - 'enterprise': boosts Stability & Technical weight
      - 'rd': boosts Learning Agility & Technical weight
    """
    # 1. Calculate base dimensions
    tech = calculate_technical_score(candidate, jd)
    exp = calculate_experience_score(candidate, jd)
    sem = calculate_semantic_score(vector_similarity)
    beh = calculate_behavioral_score(candidate, jd)
    lead = calculate_leadership_score(candidate)
    inn = calculate_innovation_score(candidate)
    agl = calculate_learning_agility(candidate)
    stb = calculate_stability_score(candidate)
    
    # 2. Determine Weights based on Persona or Custom Weights
    weights = {
        "technical": 0.25,
        "experience": 0.20,
        "semantic": 0.15,
        "behavioral": 0.10,
        "leadership": 0.10,
        "innovation": 0.08,
        "agility": 0.07,
        "stability": 0.05
    }
    
    if custom_weights:
        weights.update(custom_weights)
        # Normalize weights to sum to 1.0
        total_w = sum(weights.values())
        weights = {k: v / total_w for k, v in weights.items()}
    elif persona == "startup":
        weights = {
            "technical": 0.20,
            "experience": 0.15,
            "semantic": 0.10,
            "behavioral": 0.15,
            "leadership": 0.10,
            "innovation": 0.18, # boosted
            "agility": 0.10,
            "stability": 0.02  # lowered
        }
    elif persona == "enterprise":
        weights = {
            "technical": 0.30, # boosted
            "experience": 0.20,
            "semantic": 0.10,
            "behavioral": 0.05,
            "leadership": 0.10,
            "innovation": 0.05,
            "agility": 0.05,
            "stability": 0.15  # boosted
        }
    elif persona == "rd":
        weights = {
            "technical": 0.30, # boosted
            "experience": 0.15,
            "semantic": 0.15,
            "behavioral": 0.05,
            "leadership": 0.05,
            "innovation": 0.10,
            "agility": 0.18, # boosted
            "stability": 0.02
        }

    # Calculate final weighted score
    final_score = (
        (tech * weights["technical"]) +
        (exp * weights["experience"]) +
        (sem * weights["semantic"]) +
        (beh * weights["behavioral"]) +
        (lead * weights["leadership"]) +
        (inn * weights["innovation"]) +
        (agl * weights["agility"]) +
        (stb * weights["stability"])
    )
    
    return {
        "candidate_id": candidate.id,
        "final_score": round(final_score, 1),
        "breakdown": {
            "technical_fit": round(tech, 1),
            "experience_fit": round(exp, 1),
            "semantic_similarity": round(sem, 1),
            "behavioral_fit": round(beh, 1),
            "leadership_score": round(lead, 1),
            "innovation_score": round(inn, 1),
            "learning_agility": round(agl, 1),
            "stability_score": round(stb, 1)
        },
        "weights": weights
    }
