from typing import Dict, Any, List
from src.parser import CandidateProfile, JobDescription

def calculate_shap_breakdown(score_info: Dict[str, Any], base_value: float = 60.0) -> Dict[str, Any]:
    """
    Computes a mathematical SHAP force contribution breakdown for the 8-factor formula:
      - 25% Technical Fit
      - 20% Experience Fit
      - 15% Semantic Similarity
      - 10% Behavioral Fit
      - 10% Leadership Score
      - 8% Innovation Score
      - 7% Learning Agility
      - 5% Stability Score
    """
    breakdown = score_info["breakdown"]
    final_score = score_info["final_score"]
    weights = score_info.get("weights", {
        "technical": 0.25,
        "experience": 0.20,
        "semantic": 0.15,
        "behavioral": 0.10,
        "leadership": 0.10,
        "innovation": 0.08,
        "agility": 0.07,
        "stability": 0.05
    })
    
    contributions = {
        "Technical Fit": round(weights["technical"] * (breakdown["technical_fit"] - base_value), 2),
        "Experience Fit": round(weights["experience"] * (breakdown["experience_fit"] - base_value), 2),
        "Semantic Similarity": round(weights["semantic"] * (breakdown["semantic_similarity"] - base_value), 2),
        "Behavioral Fit": round(weights["behavioral"] * (breakdown["behavioral_fit"] - base_value), 2),
        "Leadership Score": round(weights["leadership"] * (breakdown["leadership_score"] - base_value), 2),
        "Innovation Score": round(weights["innovation"] * (breakdown["innovation_score"] - base_value), 2),
        "Learning Agility": round(weights["agility"] * (breakdown["learning_agility"] - base_value), 2),
        "Stability Score": round(weights["stability"] * (breakdown["stability_score"] - base_value), 2)
    }
    
    pushes = {}
    pulls = {}
    for feature, val in contributions.items():
        if val >= 0:
            pushes[feature] = val
        else:
            pulls[feature] = val
            
    return {
        "base_value": base_value,
        "final_score": final_score,
        "contributions": contributions,
        "pushes": pushes,
        "pulls": pulls
    }

def get_insights(score_info: Dict[str, Any]) -> List[str]:
    """Generates qualitative strengths based on sub-score performance profiles."""
    breakdown = score_info["breakdown"]
    insights = []
    
    if breakdown["technical_fit"] >= 80:
        insights.append("Outstanding technical competence and ontology match.")
    if breakdown["semantic_similarity"] >= 80:
        insights.append("High contextual and semantic overlap with target JD.")
    if breakdown["experience_fit"] >= 95:
        insights.append("Optimal experience level matching targeted years of experience.")
    if breakdown["leadership_score"] >= 80:
        insights.append("Demonstrates solid leadership capacity and ownership markers.")
    if breakdown["innovation_score"] >= 80:
        insights.append("Highly active open-source and hackathon credentials.")
    if breakdown["learning_agility"] >= 80:
        insights.append("Excellent continuous education and tech adaptability profile.")
        
    return insights

def generate_resume_coaching(score_info: Dict[str, Any], candidate: CandidateProfile, jd: JobDescription) -> List[str]:
    """
    Candidate-facing Resume Improvement engine.
    Analyzes score weaknesses and outputs highly actionable resume critique logs.
    """
    breakdown = score_info["breakdown"]
    critiques = []
    
    if breakdown["technical_fit"] < 70.0:
        # Suggest missing skills
        cand_hard_l = {s.lower() for s in candidate.hard_skills}
        missing = [s for s in jd.hard_skills if s.lower() not in cand_hard_l]
        if missing:
            critiques.append(f"🔴 **Skills Shortage:** Your resume lacks evidence of core required skills: **{', '.join(missing[:3])}**. Consider integrating these keywords if you have corresponding experience.")
        else:
            critiques.append("🔴 **Skills Shortage:** Consider detailing your experience with target developer tooling and framework components.")
            
    # Safe check for project_impact or innovation_score
    proj_impact_val = breakdown.get("project_impact", breakdown.get("innovation_score", 80.0))
    if proj_impact_val < 75.0:
        critiques.append("📈 **Quantifiable Metric Deficit:** Your project descriptions lack concrete metric results. Revise bullet points to use the Google XYZ formula: *'Accomplished [X] as measured by [Y], by doing [Z]'* (e.g., 'Optimized query efficiency by 40%').")
        
    if breakdown["stability_score"] < 70.0:
        critiques.append("⏳ **Tenure & Stability Alert:** Your history shows higher-frequency switching. Highlight long-term project lifecycles and ownership continuity inside your bullet descriptions.")
        
    if breakdown["innovation_score"] < 60.0:
        critiques.append("💻 **Innovation & Community Engagement:** Consider linking active GitHub open-source contributions, hackathon participations, or technical writing blogs to showcase industry presence.")
        
    if not critiques:
        critiques.append("⭐ **Profile Flawless:** Your resume matches all criteria and showcases excellent impact metrics. No critical corrections needed!")
        
    return critiques
