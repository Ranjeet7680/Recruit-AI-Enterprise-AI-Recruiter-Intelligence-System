import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.parser import CandidateProfile, JobDescription, mask_candidate_profile
from src.jd_understanding import parse_jd
from src.embeddings import VectorSearchEngine
from src.scorer import score_candidate
from src.reranker import rerank_candidates
from src.explain import calculate_shap_breakdown, get_insights, generate_resume_coaching
from src.copilot import CopilotEngine
from src.fraud import detect_profile_fraud
from src.clustering import cluster_candidates
from src.security import SecureAuditor

app = FastAPI(
    title="TalentMind AI — Autonomous Hiring Intelligence Platform API",
    description="Enterprise recruiting pipeline API featuring 8-factor matches, fraud alerts, K-Means clustering, and security controls.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auditor = SecureAuditor()

# In-memory candidates cache
CANDIDATES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "candidates.json")

def load_candidates_db() -> List[CandidateProfile]:
    try:
        with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [CandidateProfile(**c) for c in data]
    except Exception as e:
        print(f"Error loading candidates: {e}")
        return []

# Requests
class JobDescriptionRequest(BaseModel):
    text: str

class MatchRequest(BaseModel):
    jd_text: str
    persona: str = "general"
    custom_weights: Optional[Dict[str, float]] = None
    bias_reduction: bool = False
    top_k: int = 10

class ChatRequest(BaseModel):
    message: str
    jd_text: Optional[str] = None
    persona: str = "general"

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "talent-mind-platform-engine"}

@app.get("/api/candidates")
def api_get_candidates(role: str = "recruiter", bias_reduction: bool = False):
    """Retrieves candidates index with RBAC authorization and GDPR masking logs."""
    if not auditor.authorize_profile_access(role, "ALL", "LIST"):
        raise HTTPException(status_code=403, detail="Access Denied: Insufficient Role Permissions.")
        
    candidates = load_candidates_db()
    if bias_reduction:
        return [mask_candidate_profile(c) for c in candidates]
    return candidates

@app.post("/api/match")
def api_match(request: MatchRequest):
    """
    Talent matching engine orchestrator:
    1. Parse Job Description.
    2. Vector retrieves.
    3. 8-factor scores with Persona templates.
    4. Fraud checks.
    5. Recruiter Reranker & questions.
    6. XAI explanations & coach.
    """
    candidates = load_candidates_db()
    if not candidates:
        raise HTTPException(status_code=500, detail="Candidates database offline.")
        
    try:
        # 1. Parse JD
        jd_parsed = parse_jd(request.jd_text)
        
        # 2. FAISS retrieve
        search_engine = VectorSearchEngine(candidates)
        search_query = f"{jd_parsed.title} {' '.join(jd_parsed.hard_skills)}"
        vector_results = search_engine.search(search_query, top_k=len(candidates))
        vector_map = {cid: sim for cid, sim in vector_results}
        
        # 3 & 4. Score & Fraud check
        scored_candidates = []
        fraud_map = {}
        for cand in candidates:
            # Fraud check
            fraud_data = detect_profile_fraud(cand, candidates)
            fraud_map[cand.id] = fraud_data
            
            # 8-factor Scorer
            sim = vector_map.get(cand.id, 0.3)
            score_data = score_candidate(
                candidate=cand,
                jd=jd_parsed,
                vector_similarity=sim,
                persona=request.persona,
                custom_weights=request.custom_weights
            )
            scored_candidates.append(score_data)
            
        # 5. Rerank
        active_candidates = candidates
        if request.bias_reduction:
            active_candidates = [mask_candidate_profile(c) for c in candidates]
            
        reranked_results = rerank_candidates(active_candidates, jd_parsed, scored_candidates)
        
        # 6. Format Response
        scored_map = {s["candidate_id"]: s for s in scored_candidates}
        final_list = []
        
        for rank_item in reranked_results[:request.top_k]:
            c_id = rank_item["candidate_id"]
            cand_profile = next(c for c in active_candidates if c.id == c_id)
            score_data = scored_map[c_id]
            fraud_data = fraud_map[c_id]
            
            # XAI SHAP & Coach
            shap = calculate_shap_breakdown(score_data)
            insights = get_insights(score_data)
            coach_tips = generate_resume_coaching(score_data, cand_profile, jd_parsed)
            
            final_list.append({
                "rank": rank_item["reranked_position"],
                "candidate": cand_profile,
                "overall_score": score_data["final_score"],
                "breakdown": score_data["breakdown"],
                "justification": rank_item["justification"],
                "risks": rank_item["risks"],
                "missing_skills": rank_item["missing_skills"],
                "interview_questions": rank_item["interview_questions"],
                "recommendation": rank_item["recommendation"],
                "fraud_assessment": fraud_data,
                "shap": shap,
                "insights": insights,
                "resume_coach": coach_tips
            })
            
        return {
            "job_description": jd_parsed,
            "results": final_list
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def api_chat(request: ChatRequest):
    """Interactive Recruiter Copilot Chat Gateway."""
    candidates = load_candidates_db()
    
    # Pre-calculate simple scores to back the copilot
    jd_parsed = parse_jd(request.jd_text or "Software Engineer")
    search_engine = VectorSearchEngine(candidates)
    vector_results = search_engine.search(jd_parsed.title, top_k=len(candidates))
    vector_map = {cid: sim for cid, sim in vector_results}
    
    scores = []
    for cand in candidates:
        sim = vector_map.get(cand.id, 0.3)
        score_data = score_candidate(cand, jd_parsed, sim, request.persona)
        scores.append(score_data)
        
    copilot = CopilotEngine(candidates, scores)
    response_msg = copilot.process_query(request.message)
    return {"message": response_msg}

@app.get("/api/talent-clusters")
def api_talent_clusters(clusters: int = 4):
    """Executes dynamic KMeans talent clustering and coordinates mapping."""
    candidates = load_candidates_db()
    df, themes = cluster_candidates(candidates, n_clusters=clusters)
    return {
        "clusters_themes": themes,
        "data": df.to_dict(orient="records")
    }

@app.get("/api/candidates/{candidate_id}/similar")
def api_candidate_similar(candidate_id: str, count: int = 4):
    """Finds candidates similar to a target candidate profile (KNN Vector discovery)."""
    candidates = load_candidates_db()
    engine = VectorSearchEngine(candidates)
    similar = engine.find_similar_candidates(candidate_id, top_n=count)
    
    results = []
    for cid, sim in similar:
        cand = next(c for c in candidates if c.id == cid)
        results.append({
            "candidate": cand,
            "similarity_score": round(sim * 100.0, 1)
        })
    return results

@app.get("/api/security/audit-logs")
def api_audit_logs():
    return {"logs": auditor.get_logs()}
