import os
import json
from typing import List, Dict, Any
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

from src.parser import CandidateProfile, JobDescription

load_dotenv()

def _generate_fallback_questions(cand: CandidateProfile, jd: JobDescription) -> Dict[str, str]:
    """Generates custom technical, behavioral, and project-deep-dive interview questions."""
    tech_skill = cand.hard_skills[0] if cand.hard_skills else "Python"
    soft_skill = cand.soft_skills[0] if cand.soft_skills else "Communication"
    project_name = cand.projects[0].name if cand.projects else "your primary system build"
    project_impact = cand.projects[0].impact if cand.projects else "its deployment"
    
    return {
        "technical": f"Explain the implementation pipeline and optimization challenges you faced using {tech_skill}.",
        "behavioral": f"Give an example of a situation where you had to employ strong {soft_skill} to resolve a team bottleneck.",
        "project_deep_dive": f"In your project '{project_name}', you noted: '{project_impact}'. Can you break down the architectural choices that drove this metric?"
    }

def _predict_recommendation(score: float, risks: List[str]) -> Dict[str, Any]:
    """Empirical recommendation solver with scoring confidence ratings."""
    risk_count = len(risks)
    
    if score >= 85.0 and risk_count <= 1:
        return {"decision": "Fast-Track", "confidence": 94.0}
    elif score >= 74.0 and risk_count <= 2:
        return {"decision": "Hire", "confidence": 86.0}
    elif score >= 58.0:
        return {"decision": "Maybe", "confidence": 71.0}
    else:
        return {"decision": "Reject", "confidence": 78.0}

def _rerank_with_heuristics(candidates: List[CandidateProfile], jd: JobDescription, scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Heuristic fallback reranking that injects custom interview questions and recommendations."""
    score_map = {s["candidate_id"]: s for s in scores}
    sorted_candidates = sorted(candidates, key=lambda c: score_map.get(c.id, {}).get("final_score", 0.0), reverse=True)
    
    reranked = []
    for rank, cand in enumerate(sorted_candidates, 1):
        cand_score_info = score_map.get(cand.id, {})
        final_score = cand_score_info.get("final_score", 0.0)
        breakdown = cand_score_info.get("breakdown", {})
        
        # Skill gaps
        cand_hard_l = {s.lower() for s in cand.hard_skills}
        missing = [s for s in jd.hard_skills if s.lower() not in cand_hard_l]
        
        # Risk profiles
        risks = []
        if cand.experience_years < jd.experience_level_min:
            risks.append(f"Under-experienced for target role seniority (possesses {cand.experience_years} years vs expected min of {jd.experience_level_min}).")
        elif cand.experience_years > jd.experience_level_max:
            risks.append(f"Potential over-qualification risk (possesses {cand.experience_years} years vs expected max of {jd.experience_level_max}).")
            
        if len(missing) > 2:
            risks.append(f"Noticeable gap in required tech stack: lacks {', '.join(missing[:3])}.")
            
        if breakdown.get("stability_score", 100.0) < 60.0:
            risks.append("Higher historical job switching frequency (lower Stability Score).")
            
        if not risks:
            risks.append("No critical risk indicators flagged.")

        # Generate questions
        questions = _generate_fallback_questions(cand, jd)
        
        # Predict recommendation
        recommendation = _predict_recommendation(final_score, risks)

        justification = (
            f"Candidate displays a high-performance profile with an innovation score of {breakdown.get('innovation_score', 0.0)}% "
            f"and a learning agility index of {breakdown.get('learning_agility', 0.0)}%. Excellent choice for a {jd.title} position."
        )

        reranked.append({
            "candidate_id": cand.id,
            "name": cand.name,
            "score": final_score,
            "reranked_position": rank,
            "justification": justification,
            "risks": risks,
            "missing_skills": missing,
            "interview_questions": questions,
            "recommendation": recommendation
        })
        
    return reranked

def _rerank_with_llm(candidates: List[CandidateProfile], jd: JobDescription, scores: List[Dict[str, Any]], provider: str) -> List[Dict[str, Any]]:
    """Uses LLM to evaluate why fit, why not, concerns, interview questions, and recommendation decision."""
    candidates_list_str = []
    score_map = {s["candidate_id"]: s for s in scores}
    
    for c in candidates:
        c_score = score_map.get(c.id, {}).get("final_score", 0.0)
        c_desc = (
            f"ID: {c.id}\n"
            f"Name: {c.name}\n"
            f"Experience: {c.experience_years} years\n"
            f"Skills: {', '.join(c.hard_skills)}\n"
            f"Summary: {c.summary}\n"
            f"Projects: " + "; ".join([f"{p.name}: {p.impact}" for p in c.projects]) + "\n"
            f"Formula Hybrid Score: {c_score}\n"
            f"-------------------"
        )
        candidates_list_str.append(c_desc)
        
    candidates_input = "\n".join(candidates_list_str)

    prompt = f"""
    You are an expert recruitment strategist. Evaluate these candidates for the following job profile.
    Output a JSON array of objects with the exact structure below:
    [
        {{
            "candidate_id": "cand_001",
            "reranked_position": 1,
            "justification": "Why candidate fits, referencing experience, projects, and learning agility.",
            "risks": ["Risk 1", "Risk 2"],
            "missing_skills": ["Skill A", "Skill B"],
            "interview_questions": {{
                "technical": "Specific technical question based on their stack",
                "behavioral": "Cultural fit question based on behavioral attributes",
                "project_deep_dive": "Deep-dive inquiry into their metrics"
            }},
            "recommendation": {{
                "decision": "Fast-Track / Hire / Maybe / Reject",
                "confidence": 88.5
            }}
        }}
    ]

    Only return valid parseable JSON. Do not include markdown blocks or wrappers.

    JOB DESCRIPTION:
    Title: {jd.title}
    Expected Experience: {jd.experience_level_min} - {jd.experience_level_max} years
    Required Skills: {', '.join(jd.hard_skills)}

    CANDIDATES:
    {candidates_input}
    """

    try:
        if provider == "gemini":
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
        else: # openai
            client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            raw_text = response.choices[0].message.content.strip()

        # Clean wrappers
        if raw_text.startswith("```"):
            lines = raw_text.splitlines()
            if lines[0].startswith("```json"):
                raw_text = "\n".join(lines[1:-1])
            else:
                raw_text = "\n".join(lines[1:-1])

        results = json.loads(raw_text)
        reranked_map = {res["candidate_id"]: res for res in results}
        
        reranked_list = []
        for cand in candidates:
            cand_score_info = score_map.get(cand.id, {})
            final_score = cand_score_info.get("final_score", 0.0)
            llm_info = reranked_map.get(cand.id, {})
            
            # Fallbacks in case LLM misses keys
            risks = llm_info.get("risks", ["Potential skill alignment checks recommended."])
            questions = llm_info.get("interview_questions", _generate_fallback_questions(cand, jd))
            recom = llm_info.get("recommendation", _predict_recommendation(final_score, risks))
            
            reranked_list.append({
                "candidate_id": cand.id,
                "name": cand.name,
                "score": final_score,
                "reranked_position": llm_info.get("reranked_position", 99),
                "justification": llm_info.get("justification", "Strong candidate displaying core domain alignment."),
                "risks": risks,
                "missing_skills": llm_info.get("missing_skills", []),
                "interview_questions": questions,
                "recommendation": recom
            })
            
        reranked_list = sorted(reranked_list, key=lambda x: x["reranked_position"])
        for i, item in enumerate(reranked_list, 1):
            item["reranked_position"] = i
            
        return reranked_list
    except Exception as e:
        print(f"LLM Reranking failed: {e}. Running heuristics.")
        return _rerank_with_heuristics(candidates, jd, scores)

def rerank_candidates(candidates: List[CandidateProfile], jd: JobDescription, scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Orchestrates candidate reranking. Supports LLM or heuristic fallbacks."""
    if os.environ.get("GEMINI_API_KEY"):
        return _rerank_with_llm(candidates, jd, scores, "gemini")
    elif os.environ.get("OPENAI_API_KEY"):
        return _rerank_with_llm(candidates, jd, scores, "openai")
    else:
        return _rerank_with_heuristics(candidates, jd, scores)
