import re
from typing import List, Dict, Any
from src.parser import CandidateProfile

def detect_profile_fraud(profile: CandidateProfile, all_profiles: List[CandidateProfile]) -> Dict[str, Any]:
    """
    Evaluates a candidate profile against 4 advanced fraud metrics:
      1. Skill-to-Experience Inflation Ratio
      2. Concurrent Full-time Job Overlaps
      3. Plagiarized / Duplicate Project descriptions
      4. Suspicious/Fake Credentials (template matching)
    """
    warnings = []
    threat_level = "Clean"
    
    # 1. Skill Inflation Check
    total_skills = len(profile.hard_skills) + len(profile.soft_skills)
    years = profile.experience_years
    
    if years <= 1.5 and total_skills >= 25:
        warnings.append(f"Highly inflated skills ledger: listed {total_skills} tools for only {years} years of work tenure.")
        threat_level = "High"
    elif years <= 3.0 and total_skills >= 35:
        warnings.append(f"Suspiciously high tool inventory: listed {total_skills} tools for {years} years of experience.")
        threat_level = "Medium"

    # 2. Project Plagiarism Check
    # Compare project descriptions with other candidates in the database
    for other in all_profiles:
        if other.id == profile.id:
            continue
        for p1 in profile.projects:
            for p2 in other.projects:
                desc1 = p1.description.lower().strip()
                desc2 = p2.description.lower().strip()
                # If they are identical or extremely similar
                if len(desc1) > 20 and (desc1 in desc2 or desc2 in desc1):
                    warnings.append(f"Duplicate project descriptions found matching candidate profile '{other.id}'. Potential plagiarism.")
                    threat_level = "High"
                    break

    # 3. Employment Overlap
    # Check concurrent full-time roles (e.g. both roles active in the same period)
    # Simple keyword heuristic check for overlaps
    active_jobs = 0
    for exp in profile.experience_timeline:
        duration = exp.duration.lower()
        if "present" in duration or "2022 - present" in duration:
            active_jobs += 1
            
    if active_jobs > 1:
        warnings.append("Concurrent active full-time positions detected ('Present' markers in multiple jobs). Potential dual-employment fraud.")
        if threat_level != "High":
            threat_level = "Medium"

    # 4. Empty achievements or generic boilerplate
    generic_templates = ["built software", "worked on team", "developed application", "did tasks"]
    for proj in profile.projects:
        desc_l = proj.description.lower()
        if any(g == desc_l for g in generic_templates):
            warnings.append(f"Extremely generic boilerplate description in project '{proj.name}'.")
            if threat_level == "Clean":
                threat_level = "Low"

    return {
        "candidate_id": profile.id,
        "is_suspicious": len(warnings) > 0,
        "threat_level": threat_level,
        "warnings": warnings
    }
