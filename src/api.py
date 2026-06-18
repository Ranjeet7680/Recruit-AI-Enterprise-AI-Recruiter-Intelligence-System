import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
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

try:
    from src.security import SecureAuditor
except Exception as security_import_error:
    class SecureAuditor:
        def __init__(self):
            self.audit_logs = [
                f"[System] Security auditor fallback active: {security_import_error}"
            ]

        def _log_system_event(self, user: str, message: str):
            self.audit_logs.append(f"[{user}] {message}")

        def authorize_profile_access(self, user_role: str, candidate_id: str, action: str = "VIEW") -> bool:
            self._log_system_event(user_role, f"Fallback authorized {action} for Candidate {candidate_id}.")
            return True

        def get_logs(self):
            return self.audit_logs

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

@app.get("/")
def read_root():
    return FileResponse(os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "index.html"))

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
            
            # Transform interview_questions from dict to array for frontend compatibility
            iq_raw = rank_item["interview_questions"]
            if isinstance(iq_raw, dict):
                interview_questions_list = [v for v in iq_raw.values() if v]
            elif isinstance(iq_raw, list):
                interview_questions_list = iq_raw
            else:
                interview_questions_list = [str(iq_raw)]

            # Transform fraud_assessment to use frontend-expected field names
            fraud_score_map = {"Clean": 0, "Low": 20, "Medium": 55, "High": 90}
            fraud_threat = fraud_data.get("threat_level", "Clean")
            fraud_normalized = {
                "flagged": fraud_data.get("is_suspicious", False),
                "fraud_score": fraud_score_map.get(fraud_threat, 0),
                "threat_level": fraud_threat,
                "anomalies": fraud_data.get("warnings", []),
            }

            # Transform recommendation from {decision, confidence} to a user-friendly string
            rec_raw = rank_item["recommendation"]
            if isinstance(rec_raw, dict):
                rec_decision = rec_raw.get("decision", "Review")
                rec_conf = rec_raw.get("confidence", 80.0)
                recommendation_str = f"{rec_decision} ({rec_conf}% confidence)"
            else:
                recommendation_str = str(rec_raw)

            # Serialize candidate Pydantic model to dict
            cand_dict = cand_profile.model_dump()

            final_list.append({
                "rank": rank_item["reranked_position"],
                "candidate": cand_dict,
                "overall_score": score_data["final_score"],
                "breakdown": score_data["breakdown"],
                "justification": rank_item["justification"],
                "risks": rank_item["risks"],
                "missing_skills": rank_item["missing_skills"],
                "interview_questions": interview_questions_list,
                "recommendation": recommendation_str,
                "fraud_assessment": fraud_normalized,
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


class AuditLogRequest(BaseModel):
    user: str
    message: str


@app.post("/api/security/audit-log")
def api_add_audit_log(req: AuditLogRequest):
    auditor._log_system_event(req.user, req.message)
    return {"status": "success", "logs": auditor.get_logs()}



# ================= SOCIAL SSO AUTH & REFERRAL PLATFORM =================

REFERRALS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "referrals.json")

def load_referrals_db() -> Dict[str, Any]:
    if not os.path.exists(REFERRALS_FILE):
        # Initial default database
        default_data = {
            "referrers": {
                "sarah.jenkins@talentmind.ai": {
                    "code": "TM-SARAH-2026",
                    "referred_emails": [
                        {
                            "email": "alex.chen@talentmind.ai",
                            "date": "2026-06-15",
                            "status": "Active"
                        },
                        {
                            "email": "lisa.wang@hiring.com",
                            "date": "2026-06-16",
                            "status": "Active"
                        }
                    ]
                }
            },
            "referred_by": {
                "alex.chen@talentmind.ai": "TM-SARAH-2026",
                "lisa.wang@hiring.com": "TM-SARAH-2026"
            }
        }
        os.makedirs(os.path.dirname(REFERRALS_FILE), exist_ok=True)
        try:
            with open(REFERRALS_FILE, "w", encoding="utf-8") as f:
                json.dump(default_data, f, indent=2)
        except Exception as e:
            print(f"Error writing default referrals: {e}")
        return default_data
    try:
        with open(REFERRALS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading referrals: {e}")
        return {"referrers": {}, "referred_by": {}}

def save_referrals_db(data: Dict[str, Any]):
    try:
        with open(REFERRALS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving referrals: {e}")

def generate_referral_code(email: str) -> str:
    import hashlib
    prefix = email.split('@')[0].upper().replace('.', '')[:7]
    h = hashlib.md5(email.encode('utf-8')).hexdigest().upper()[:4]
    return f"TM-{prefix}-{h}"

class SocialAuthRequest(BaseModel):
    provider: str
    email: str
    name: str
    referral_code: Optional[str] = None

@app.get("/api/auth/mock-sso", response_class=HTMLResponse)
def mock_sso(provider: str = "Google"):
    provider_clean = provider.strip().capitalize()
    
    config = {
        "Google": {
            "bg": "#f8f9fa",
            "card_bg": "#ffffff",
            "primary": "#1a73e8",
            "primary_hover": "#1557b0",
            "logo": """<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>""",
            "title": "Sign in with Google",
            "subtitle": "Use your Google workspace account",
            "btn_text": "Next",
            "default_email": "jane.doe@gmail.com",
            "default_name": "Jane Doe"
        },
        "Facebook": {
            "bg": "#f0f2f5",
            "card_bg": "#ffffff",
            "primary": "#1877f2",
            "primary_hover": "#166fe5",
            "logo": """<svg width="40" height="40" viewBox="0 0 24 24" fill="#1877f2" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>""",
            "title": "Log Into Facebook",
            "subtitle": "Connect your recruiter workspace",
            "btn_text": "Log In",
            "default_email": "jane.recruiter@facebook.com",
            "default_name": "Jane Facebook"
        },
        "Microsoft": {
            "bg": "#ebf3fc",
            "card_bg": "#ffffff",
            "primary": "#0067b8",
            "primary_hover": "#005da6",
            "logo": """<svg width="32" height="32" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f35325" d="M0 0h11v11H0z"/>
                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                <path fill="#ffba08" d="M12 12h11v11H12z"/>
            </svg>""",
            "title": "Sign in",
            "subtitle": "Use your work or school account",
            "btn_text": "Sign In",
            "default_email": "jane.recruiter@microsoft.com",
            "default_name": "Jane Microsoft"
        },
        "Linkedin": {
            "bg": "#f3f2ef",
            "card_bg": "#ffffff",
            "primary": "#0a66c2",
            "primary_hover": "#004182",
            "logo": """<svg width="34" height="34" viewBox="0 0 24 24" fill="#0a66c2" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>""",
            "title": "Sign in",
            "subtitle": "Stay updated on your professional world",
            "btn_text": "Sign In",
            "default_email": "jane.doe@linkedin.com",
            "default_name": "Jane LinkedIn"
        }
    }
    
    cfg = config.get(provider_clean, config["Google"])
    
    html_content = f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=device-width, initial-scale=1.0">
        <title>Sign in with {provider_clean}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Inter', sans-serif;
                background-color: {cfg["bg"]};
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: #1f2937;
            }}
            .card {{
                background-color: {cfg["card_bg"]};
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                width: 100%;
                max-width: 400px;
                padding: 40px 32px;
                box-sizing: border-box;
                border: 1px solid #e5e7eb;
            }}
            .logo-container {{
                display: flex;
                justify-content: center;
                margin-bottom: 24px;
            }}
            h1 {{
                font-size: 20px;
                font-weight: 600;
                text-align: center;
                margin: 0 0 8px 0;
                color: #111827;
            }}
            .subtitle {{
                font-size: 13px;
                color: #6b7280;
                text-align: center;
                margin: 0 0 28px 0;
            }}
            .form-group {{
                margin-bottom: 18px;
            }}
            label {{
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}
            input {{
                width: 100%;
                padding: 11px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 13px;
                box-sizing: border-box;
                outline: none;
                transition: border-color 0.2s;
            }}
            input:focus {{
                border-color: {cfg["primary"]};
            }}
            .btn-primary {{
                width: 100%;
                padding: 11px;
                background-color: {cfg["primary"]};
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
                margin-top: 10px;
            }}
            .btn-primary:hover {{
                background-color: {cfg["primary_hover"]};
            }}
            .footer {{
                margin-top: 28px;
                font-size: 10px;
                color: #9ca3af;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo-container">
                {cfg["logo"]}
            </div>
            <h1>{cfg["title"]}</h1>
            <p class="subtitle">{cfg["subtitle"]}</p>
            
            <form id="login-form">
                <div class="form-group">
                    <label for="email">Work Email</label>
                    <input type="email" id="email" value="{cfg["default_email"]}" required>
                </div>
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" value="{cfg["default_name"]}" required>
                </div>
                <button type="submit" class="btn-primary">{cfg["btn_text"]}</button>
            </form>
            
            <div class="footer">
                Secured by TalentMind Federated SSO Gateway.
            </div>
        </div>

        <script>
            document.getElementById('login-form').addEventListener('submit', function(e) {{
                e.preventDefault();
                const email = document.getElementById('email').value;
                const name = document.getElementById('name').value;
                
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'social-login-success',
                        provider: '{provider_clean}',
                        email: email,
                        name: name
                    }}, '*');
                }}
                window.close();
            }});
        </script>
    </body>
    </html>"""
    return HTMLResponse(content=html_content, status_code=200)

@app.post("/api/auth/social")
def api_auth_social(request: SocialAuthRequest):
    provider = request.provider
    email = request.email
    name = request.name
    ref_code = request.referral_code

    auditor._log_system_event(provider, f"User {name} ({email}) authenticated via {provider} SSO.")
    
    db = load_referrals_db()
    
    # Check if user already has a referrer registry, else create one
    user_ref_data = None
    for r_email, r_data in db["referrers"].items():
        if r_email.lower() == email.lower():
            user_ref_data = r_data
            break
            
    if not user_ref_data:
        new_code = generate_referral_code(email)
        user_ref_data = {
            "code": new_code,
            "referred_emails": []
        }
        db["referrers"][email] = user_ref_data
        
    # Check if user is referred by someone
    if ref_code and email.lower() not in [k.lower() for k in db["referred_by"].keys()]:
        referrer_email = None
        for r_email, r_data in db["referrers"].items():
            if r_data["code"] == ref_code:
                referrer_email = r_email
                break
                
        if referrer_email and referrer_email.lower() != email.lower():
            import datetime
            db["referred_by"][email] = ref_code
            db["referrers"][referrer_email]["referred_emails"].append({
                "email": email,
                "date": datetime.date.today().strftime("%Y-%m-%d"),
                "status": "Active"
            })
            auditor._log_system_event("System", f"Referral code {ref_code} applied. {referrer_email} referred {email}.")
            
    save_referrals_db(db)
    
    return {
        "status": "success",
        "email": email,
        "name": name,
        "referral_code": user_ref_data["code"]
    }

@app.get("/api/referrals")
def api_get_referrals(email: str = Query(..., description="User email to look up referrals")):
    db = load_referrals_db()
    
    referrer_info = None
    for r_email, r_data in db["referrers"].items():
        if r_email.lower() == email.lower():
            referrer_info = r_data
            break
            
    if not referrer_info:
        code = generate_referral_code(email)
        referrer_info = {
            "code": code,
            "referred_emails": []
        }
        db["referrers"][email] = referrer_info
        save_referrals_db(db)
        
    referred_list = referrer_info["referred_emails"]
    referrals_count = len(referred_list)
    total_credits = referrals_count * 50
    
    referral_link = f"https://recruit-ai-enterprise-ai-recruiter.vercel.app/?ref={referrer_info['code']}"
    
    return {
        "referral_code": referrer_info["code"],
        "referral_link": referral_link,
        "referred_users": referred_list,
        "total_credits": total_credits,
        "referrals_count": referrals_count
    }

