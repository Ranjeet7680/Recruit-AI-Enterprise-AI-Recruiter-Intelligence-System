import os
import sys
import json
import base64
from pathlib import Path
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.parser import CandidateProfile, JobDescription, mask_candidate_profile
from src.jd_understanding import parse_jd
from src.embeddings import VectorSearchEngine
from src.scorer import score_candidate
from src.reranker import rerank_candidates
from src.explain import calculate_shap_breakdown, get_insights, generate_resume_coaching
from src.copilot import CopilotEngine
from src.fraud import detect_profile_fraud
from src.clustering import cluster_candidates

import_err_msg = ""
try:
    from src.security import SecureAuditor
except Exception as security_import_error:
    import_err_msg = str(security_import_error)
    class SecureAuditor:
        def __init__(self):
            self.audit_logs = [
                f"[System] Security auditor fallback active: {import_err_msg}"
            ]

        def _log_system_event(self, user: str, message: str):
            self.audit_logs.append(f"[{user}] {message}")

        def encrypt_field(self, data: str) -> str:
            return data or ""

        def decrypt_field(self, encrypted_data: str) -> str:
            return encrypted_data or ""

        def authorize_profile_access(self, user_role: str, candidate_id: str, action: str = "VIEW") -> bool:
            self._log_system_event(user_role, f"Fallback authorized {action} for Candidate {candidate_id}.")
            return True

        def get_logs(self):
            return self.audit_logs

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
LOGO_DIR = BASE_DIR / "LOGO"
DATA_DIR = BASE_DIR / "data"
CANDIDATES_FILE = DATA_DIR / "candidates.json"
APP_LOGO_PATH = LOGO_DIR / "ChatGPT_Image_May_27__2026__11_24_59_AM-removebg-preview.png"
FALLBACK_APP_LOGO_PATH = LOGO_DIR / "APP LOGO.png"
TEAM_LOGO_PATH = LOGO_DIR / "TEAM LOGO.webp"


def asset_data_uri(path, mime_type):
    if not path.exists():
        return ""
    with open(path, "rb") as asset_file:
        encoded_asset = base64.b64encode(asset_file.read()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded_asset}"


@st.cache_data(show_spinner=False)
def load_candidates_db():
    try:
        with open(CANDIDATES_FILE, "r", encoding="utf-8") as data_file:
            data = json.load(data_file)
        return [CandidateProfile(**candidate) for candidate in data]
    except Exception as exc:
        st.error(f"Unable to load candidates database: {exc}")
        return []


APP_LOGO_URI = asset_data_uri(APP_LOGO_PATH, "image/png") or asset_data_uri(FALLBACK_APP_LOGO_PATH, "image/png")
TEAM_LOGO_URI = asset_data_uri(TEAM_LOGO_PATH, "image/webp")

# Page configurations
st.set_page_config(
    page_title="TalentMind AI - Autonomous Hiring Intelligence Platform",
    page_icon=APP_LOGO_URI or "🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize Session States
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False
if 'auth_mode' not in st.session_state:
    st.session_state['auth_mode'] = 'login'
if 'signup_step' not in st.session_state:
    st.session_state['signup_step'] = 1
if 'selected_plan' not in st.session_state:
    st.session_state['selected_plan'] = 'pro'
if 'dark_mode' not in st.session_state:
    st.session_state['dark_mode'] = False
if 'demographicMasking' not in st.session_state:
    st.session_state['demographicMasking'] = True
if 'scoreThreshold' not in st.session_state:
    st.session_state['scoreThreshold'] = 60
if 'active_page' not in st.session_state:
    st.session_state['active_page'] = "Welcome"
if 'is_sidebar_collapsed' not in st.session_state:
    st.session_state['is_sidebar_collapsed'] = False
if 'show_notifications' not in st.session_state:
    st.session_state['show_notifications'] = False
if 'show_profile' not in st.session_state:
    st.session_state['show_profile'] = False
if 'auditor' not in st.session_state:
    st.session_state['auditor'] = SecureAuditor()
if 'candidates_list' not in st.session_state:
    st.session_state['candidates_list'] = load_candidates_db()
if 'high_contrast' not in st.session_state:
    st.session_state['high_contrast'] = False
if 'reduce_animations' not in st.session_state:
    st.session_state['reduce_animations'] = False
if 'chat_history' not in st.session_state:
    st.session_state['chat_history'] = [
        ("copilot", "Hi Sarah! I am your TalentMind recruiting co-pilot. How can I assist you with sourcing metrics today?")
    ]
if 'selected_candidate_id' not in st.session_state:
    st.session_state['selected_candidate_id'] = None
if 'compare_candidates' not in st.session_state:
    st.session_state['compare_candidates'] = []
if 'recruiter_notes' not in st.session_state:
    st.session_state['recruiter_notes'] = {}
if 'shortlisted_candidates' not in st.session_state:
    st.session_state['shortlisted_candidates'] = []
if 'copilot_query' not in st.session_state:
    st.session_state['copilot_query'] = ""
if 'simulated_interviews' not in st.session_state:
    st.session_state['simulated_interviews'] = {}
if 'team_members' not in st.session_state:
    st.session_state['team_members'] = [
        {"name": "Ranjeet Kumar (Leader)", "role": "Team Leader & AI Architect", "last_login": "Just now", "status": "Active", "email": "rajranjeet7680@gmail.com"},
        {"name": "GLS Santhosh", "role": "AI Engineer & Data Scientist", "last_login": "5 mins ago", "status": "Active", "email": "glssanthosh1306@gmail.com"},
        {"name": "Abhishek Kantharia", "role": "Full-Stack & Systems Engineer", "last_login": "15 mins ago", "status": "Active", "email": "abhishek11111997@gmail.com"}
    ]
if 'interviews_list' not in st.session_state:
    st.session_state['interviews_list'] = [
        {"candidate": "Aria Sterling", "panelist": "Tom Rivera, Sarah Jenkins", "date": "2026-06-17", "time": "14:00", "status": "CONFIRMED"},
        {"candidate": "Marcus Vane", "panelist": "Tom Rivera", "date": "2026-06-17", "time": "16:30", "status": "CONFIRMED"}
    ]
if 'notifications' not in st.session_state:
    st.session_state['notifications'] = [
        {"icon": "👤", "title": "Aria Sterling Applied", "desc": "Match rating calculated at 94%"},
        {"icon": "🎙️", "title": "Interview Feedback Logged", "desc": "Tom Rivera submitted scorecard evaluation"},
        {"icon": "🛡️", "title": "GDPR Compliance Clean", "desc": "Audit report logs successfully flushed"}
    ]

# References
auditor = st.session_state['auditor']
candidates_db = st.session_state['candidates_list']

# JD presets definition
JD_TEMPLATES = {
    "Select Template...": "",
    "Senior NLP / ML Engineer": (
        "We are looking for a Senior ML Engineer with production deployment experience, "
        "leadership skills, and a startup mindset. Must have experience with Python, "
        "LLMs, PyTorch, FastAPI, and Docker. Experience with AWS ECS/Sagemaker and "
        "vector databases is highly required. Should be able to take complete ownership "
        "and optimize model inference latency for product scale. 3-5 years minimum experience."
    ),
    "Frontend Specialist (React/Next.js)": (
        "Seeking a highly collaborative Frontend Developer specializing in building responsive "
        "web platforms in React and Next.js. Required skills include TypeScript, TailwindCSS, "
        "Next.js, and Jest. Experience optimizing client-side performance, core web vitals, "
        "and managing design systems is highly desired. Should have 5+ years of experience."
    ),
    "Cloud DevOps & SRE Lead": (
        "Looking for an action-oriented Cloud SRE or DevOps Engineer to manage massive containerized "
        "infrastructure. Required skills: AWS, Kubernetes (CKA a plus), Docker, Terraform, Ansible, "
        "and CI/CD pipelines via GitHub Actions. Experience with GitOps, system telemetry (Prometheus/Grafana), "
        "and shell scripting. Must have a strong ownership mindset. 5-8 years experience."
    )
}

# General styling variables
sidebar_width = "80px" if st.session_state['is_sidebar_collapsed'] else "260px"

# Pre-populate results_cache with default evaluations to avoid empty states
if 'results_cache' not in st.session_state:
    try:
        from src.jd_understanding import parse_jd
        from src.scorer import score_candidate
        from src.reranker import rerank_candidates
        from src.explain import calculate_shap_breakdown, get_insights, generate_resume_coaching
        
        default_jd_text = JD_TEMPLATES["Cloud DevOps & SRE Lead"]
        jd_parsed = parse_jd(default_jd_text)
        engine = VectorSearchEngine(st.session_state['candidates_list'])
        search_query = f"{jd_parsed.title} {' '.join(jd_parsed.hard_skills)}"
        vector_results = engine.search(search_query, top_k=len(st.session_state['candidates_list']))
        vector_map = {cid: sim for cid, sim in vector_results}
        
        scored_candidates = []
        fraud_map = {}
        for cand in st.session_state['candidates_list']:
            fraud_data = detect_profile_fraud(cand, st.session_state['candidates_list'])
            fraud_map[cand.id] = fraud_data
            sim = vector_map.get(cand.id, 0.4)
            score_data = score_candidate(cand, jd_parsed, sim, "general")
            scored_candidates.append(score_data)
            
        reranked = rerank_candidates(st.session_state['candidates_list'], jd_parsed, scored_candidates)
        scored_map = {s["candidate_id"]: s for s in scored_candidates}
        
        default_results = []
        for rank_item in reranked[:10]:
            c_id = rank_item["candidate_id"]
            cand_profile = next(c for c in st.session_state['candidates_list'] if c.id == c_id)
            score_data = scored_map[c_id]
            fraud_data = fraud_map[c_id]
            
            shap = calculate_shap_breakdown(score_data)
            insights = get_insights(score_data)
            coach_tips = generate_resume_coaching(score_data, cand_profile, jd_parsed)
            
            default_results.append({
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
        st.session_state['results_cache'] = default_results
    except Exception as e:
        print(f"Error pre-populating results_cache: {e}")
        st.session_state['results_cache'] = []

# Injected CSS styles
st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    .stApp {{
        background: #fcf8ff !important;
        font-family: 'Inter', sans-serif;
        color: #1b1b24 !important;
    }}
    .block-container {{
        max-width: 1820px !important;
        padding: 1rem 1.5rem !important;
    }}
    h1, h2, h3, h4, h5, h6 {{
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        color: #1b1b24 !important;
    }}
    .glass-card {{
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        border: 1px solid #E2E8F0;
        padding: 16px;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        margin-bottom: 15px;
    }}
    .hero-banner {{
        background: linear-gradient(135deg, #3525cd 0%, #6b38d4 100%);
        color: white !important;
        padding: 24px;
        border-radius: 16px;
        margin-bottom: 20px;
        box-shadow: 0 10px 25px -5px rgba(53, 37, 205, 0.15);
    }}
    .hero-banner h2, .hero-banner p {{
        color: white !important;
    }}
    .skill-badge {{
        background: #f0ecf9;
        color: #6b38d4;
        font-weight: 700;
        font-size: 0.72rem;
        padding: 3px 8px;
        border-radius: 6px;
        display: inline-block;
        margin-right: 4px;
        margin-bottom: 4px;
    }}
    .soft-badge {{
        background: #F0FDF4;
        color: #16A34A;
        font-weight: 700;
        font-size: 0.72rem;
        padding: 3px 8px;
        border-radius: 6px;
        display: inline-block;
        margin-right: 4px;
        margin-bottom: 4px;
    }}
    .bias-alert {{
        background: #F0FDF4;
        border: 1px solid #BBF7D0;
        color: #16A34A;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 0.82rem;
        margin-bottom: 15px;
    }}
    .chat-bubble-container-user {{
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        align-items: flex-start;
        justify-content: flex-end;
    }}
    .chat-bubble-container-copilot {{
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        align-items: flex-start;
        justify-content: flex-start;
    }}
    .chat-bubble-user {{
        background: #3525cd;
        color: #FFFFFF;
        padding: 10px 14px;
        border-radius: 12px 12px 0px 12px;
        font-size: 0.8rem;
        max-width: 85%;
        box-shadow: 0 4px 10px rgba(53,37,205,0.1);
    }}
    .chat-bubble-copilot {{
        background: #FFFFFF;
        color: #1b1b24;
        padding: 10px 14px;
        border-radius: 12px 12px 12px 0px;
        font-size: 0.8rem;
        max-width: 85%;
        border: 1px solid #E2E8F0;
    }}
    .diff-added {{
        background-color: rgba(16, 185, 129, 0.15);
        color: #065f46;
        border-radius: 4px;
        padding: 1px 3px;
    }}
    .diff-removed {{
        background-color: rgba(239, 68, 68, 0.15);
        color: #991b1b;
        text-decoration: line-through;
        border-radius: 4px;
        padding: 1px 3px;
    }}
    .sidebar-button {{
        text-align: left !important;
        justify-content: flex-start !important;
    }}
</style>
""", unsafe_allow_html=True)

# GDPR Bias Masking Active Banner
if st.session_state['dark_mode']:
    st.markdown("""
    <style>
        .stApp {
            background: linear-gradient(180deg, #0b0a0f 0%, #13121a 42%, #0b0a0f 100%) !important;
            color: #f3effc !important;
        }
        /* Style headers, paragraphs, lists, table cells, and labels, avoiding broad div/span overrides */
        .stApp h1, .stApp h2, .stApp h3, .stApp h4, .stApp h5, .stApp h6, .stApp p, .stApp label, .stApp th, .stApp td, .stApp li {
            color: #f3effc !important;
        }
        .glass-card {
            background: rgba(25, 24, 34, 0.75) !important;
            border-color: rgba(70, 69, 85, 0.3) !important;
        }
        .chat-bubble-copilot {
            background: #1b1a24 !important;
            color: #f3effc !important;
            border-color: #333244 !important;
        }
    </style>
    """, unsafe_allow_html=True)

# Accessibility settings overrides for high contrast and animations in Streamlit
if st.session_state.get('high_contrast', False):
    st.markdown("""
    <style>
        .stApp {
            color: #000000 !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, div, th, td, button {
            color: #000000 !important;
            font-weight: 800 !important;
        }
        .stButton button {
            border: 2px solid #000000 !important;
        }
        [data-testid="stSidebar"] {
            border-right: 2px solid #000000 !important;
        }
        .glass-card, [class*="border"] {
            border-color: #000000 !important;
            border-width: 2px !important;
        }
    </style>
    """, unsafe_allow_html=True)
    if st.session_state.get('dark_mode', False):
        st.markdown("""
        <style>
            .stApp {
                color: #ffffff !important;
                background: #000000 !important;
            }
            h1, h2, h3, h4, h5, h6, p, span, label, div, th, td, button {
                color: #ffffff !important;
                font-weight: 800 !important;
            }
            .stButton button {
                border: 2px solid #ffffff !important;
            }
            [data-testid="stSidebar"] {
                border-right: 2px solid #ffffff !important;
            }
            .glass-card, [class*="border"] {
                border-color: #ffffff !important;
                border-width: 2px !important;
            }
        </style>
        """, unsafe_allow_html=True)

if st.session_state.get('reduce_animations', False):
    st.markdown("""
    <style>
        *, *::before, *::after {
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            scroll-behavior: auto !important;
        }
    </style>
    """, unsafe_allow_html=True)


# ==========================================
# AUTHENTICATION ROUTING PANEL
# ==========================================
if not st.session_state['logged_in']:
    auth_col1, auth_col2, auth_col3 = st.columns([1, 1.8, 1])
    with auth_col2:
        st.markdown("<br/><br/>", unsafe_allow_html=True)
        
        # LOGIN SCREEN
        if st.session_state['auth_mode'] == 'login':
            st.markdown("""<div class='glass-card' style='padding:30px !important;'>
            <div style='text-align:center; margin-bottom:20px;'>
                <h2 style='margin:0; color:#4f46e5;'>TalentMind AI</h2>
                <p style='color:#64748B; font-size:0.8rem; margin:0;'>Enterprise Sourcing Platform</p>
            </div>
            <h3 style='text-align:center; font-size:1.2rem; margin-bottom:5px;'>Sign In to Your Workspace</h3>
            <p style='text-align:center; font-size:0.75rem; color:#64748B; margin-bottom:20px;'>Access recruiter intelligence models</p>
            </div>""", unsafe_allow_html=True)
            
            with st.form("login_form"):
                email = st.text_input("Business Email", value="sarah.jenkins@talentmind.ai")
                password = st.text_input("Password", value="••••••••", type="password")
                submit = st.form_submit_button("Sign In", use_container_width=True)
                if submit:
                    st.session_state['auth_mode'] = 'mfa'
                    st.rerun()
                    
            st.markdown("<p style='text-align:center; font-size:0.75rem; color:#64748B; margin-top:10px;'>Or continue with SSO</p>", unsafe_allow_html=True)
            soc_col1, soc_col2, soc_col3 = st.columns(3)
            with soc_col1:
                if st.button("Google", use_container_width=True):
                    st.session_state['logged_in'] = True
                    st.toast("Authenticated via Google SSO", icon="✅")
                    st.rerun()
            with soc_col2:
                if st.button("Microsoft", use_container_width=True):
                    st.session_state['logged_in'] = True
                    st.toast("Authenticated via Microsoft SSO", icon="✅")
                    st.rerun()
            with soc_col3:
                if st.button("LinkedIn", use_container_width=True):
                    st.session_state['logged_in'] = True
                    st.toast("Authenticated via LinkedIn SSO", icon="✅")
                    st.rerun()
                    
            st.markdown("<br/>", unsafe_allow_html=True)
            link_col1, link_col2 = st.columns(2)
            with link_col1:
                if st.button("Forgot password?", use_container_width=True):
                    st.session_state['auth_mode'] = 'forgot'
                    st.rerun()
            with link_col2:
                if st.button("Sign Up Workspace", use_container_width=True):
                    st.session_state['auth_mode'] = 'signup'
                    st.session_state['signup_step'] = 1
                    st.rerun()

        # MFA SCREEN
        elif st.session_state['auth_mode'] == 'mfa':
            st.markdown("""<div class='glass-card' style='padding:30px !important; text-align:center;'>
            <h3 style='color:#4f46e5; margin-bottom:5px;'>Secure Verification</h3>
            <p style='color:#64748B; font-size:0.8rem; margin-bottom:25px;'>We sent a 6-digit confirmation code. Enter code below.</p>
            </div>""", unsafe_allow_html=True)
            
            with st.form("mfa_form"):
                code = st.text_input("Enter 6-digit MFA Code", value="123456")
                verify = st.form_submit_button("Verify & Continue", use_container_width=True)
                if verify:
                    st.session_state['logged_in'] = True
                    st.session_state['active_page'] = "Welcome"
                    st.toast("Welcome back, Sarah!", icon="👋")
                    st.rerun()
            if st.button("Back to Login", use_container_width=True):
                st.session_state['auth_mode'] = 'login'
                st.rerun()

        # FORGOT PASSWORD
        elif st.session_state['auth_mode'] == 'forgot':
            st.markdown("""<div class='glass-card' style='padding:30px !important;'>
            <h3 style='color:#4f46e5; margin-bottom:5px;'>Recover Password</h3>
            <p style='color:#64748B; font-size:0.8rem; margin-bottom:20px;'>We will send instructions to overwrite your credentials domain.</p>
            </div>""", unsafe_allow_html=True)
            
            with st.form("forgot_form"):
                email = st.text_input("Business Email")
                submit = st.form_submit_button("Send Reset Link", use_container_width=True)
                if submit:
                    st.toast("Credentials recovery link dispatched.", icon="✉️")
                    st.session_state['auth_mode'] = 'login'
                    st.rerun()
            if st.button("Back to Login", use_container_width=True):
                st.session_state['auth_mode'] = 'login'
                st.rerun()

        # SIGNUP WIZARD
        elif st.session_state['auth_mode'] == 'signup':
            step = st.session_state['signup_step']
            st.markdown(f"""<div class='glass-card' style='padding:30px !important;'>
            <span style='font-size:0.7rem; font-weight:700; color:#4f46e5;'>STEP {step} OF 3</span>
            <h3 style='margin-top:5px; margin-bottom:20px;'>Initialize Recruiting Account</h3>
            </div>""", unsafe_allow_html=True)
            
            if step == 1:
                st.write("**Company Workspace Settings**")
                company = st.text_input("Company Name", value="Acme Corp")
                size = st.selectbox("Company Size", ["1-50 employees", "51-200 employees", "201-1000 employees", "1000+ employees"])
                sector = st.selectbox("Industry Sector", ["Technology & SaaS", "Financial Services", "Healthcare", "Manufacturing"])
                if st.button("Next: Invite Team", use_container_width=True):
                    st.session_state['signup_step'] = 2
                    st.rerun()
            elif step == 2:
                st.write("**Invite Recruiting Panelists**")
                rec_email = st.text_input("Hiring Manager Email", value="tom.rivera@acme.com")
                role = st.selectbox("Role Role Permissions", ["Standard Recruiter", "Admin Profile (Full Access)", "Interviewer Reviewer"])
                col_b1, col_b2 = st.columns(2)
                with col_b1:
                    if st.button("Back", use_container_width=True):
                        st.session_state['signup_step'] = 1
                        st.rerun()
                with col_b2:
                    if st.button("Next: Choose Plan", use_container_width=True):
                        st.session_state['signup_step'] = 3
                        st.rerun()
            elif step == 3:
                st.write("**Select Platform Pricing Tier**")
                plan = st.radio("Subscription Tier", ["Free Starter ($0)", "Professional ($149/mo)", "Enterprise AI ($499/mo)"])
                col_b1, col_b2 = st.columns(2)
                with col_b1:
                    if st.button("Back", use_container_width=True):
                        st.session_state['signup_step'] = 2
                        st.rerun()
                with col_b2:
                    if st.button("Complete Onboarding", use_container_width=True):
                        st.session_state['logged_in'] = True
                        st.session_state['active_page'] = "Welcome"
                        st.toast("Organization workspace successfully provisioned!", icon="🚀")
                        st.rerun()

# ==========================================
# SAAS APP LOGGED-IN WORKSPACE
# ==========================================
else:
    # Set up dynamic width columns
    if st.session_state['is_sidebar_collapsed']:
        col_left, col_center, col_right = st.columns([0.45, 5.85, 2.7])
    else:
        col_left, col_center, col_right = st.columns([1.65, 4.65, 2.7])

    # ------------------------------------------
    # LEFT COLUMN: COLLAPSIBLE NAVIGATION SIDEBAR
    # ------------------------------------------
    with col_left:
        # Header Branding
        if not st.session_state['is_sidebar_collapsed']:
            st.markdown(f"""<div style='display:flex; align-items:center; gap:8px; margin-bottom:15px;'>
                <div style='background:#4f46e5; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.1rem; font-weight:bold;'>🧠</div>
                <div>
                    <h3 style='margin:0; font-size:1.02rem; font-weight:800; color:#4f46e5;'>TalentMind AI</h3>
                    <span style='font-size:0.6rem; color:#64748B; text-transform:uppercase;'>Platform Suite</span>
                </div>
            </div>""", unsafe_allow_html=True)
        else:
            st.markdown("""<div style='background:#4f46e5; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.1rem; font-weight:bold; margin-bottom:15px;'>🧠</div>""", unsafe_allow_html=True)
        
        # Sidebar Collapse Switcher Button
        col_lbl = "Expand" if st.session_state['is_sidebar_collapsed'] else "Collapse Sidebar"
        if st.button(col_lbl, use_container_width=True):
            st.session_state['is_sidebar_collapsed'] = not st.session_state['is_sidebar_collapsed']
            st.rerun()
            
        st.markdown("<br/>", unsafe_allow_html=True)
        
        # Navigation Actions
        nav_pages = [
            ("Welcome", "🏠 Welcome Home"),
            ("Dashboard", "📊 Dashboard"),
            ("Jobs", "📂 Jobs & JDs"),
            ("Candidates", "👥 Candidates Explorer"),
            ("Decision", "⚔️ Decision Center"),
            ("Interviews", "🎙️ Interviews Panel"),
            ("Analytics", "📈 Analytics & Reports"),
            ("Compliance", "🛡️ Compliance Logs"),
            ("Team", "👥 Team Management"),
            ("Settings", "⚙️ System Settings")
        ]
        
        for tab_id, tab_lbl in nav_pages:
            # Highlight selected
            is_active = st.session_state['active_page'] == tab_id
            btn_lbl = f"👉 {tab_lbl}" if (is_active and not st.session_state['is_sidebar_collapsed']) else tab_lbl
            if st.session_state['is_sidebar_collapsed']:
                # Icons only
                btn_lbl = tab_lbl.split(" ")[0]
            
            if st.button(btn_lbl, key=f"nav_btn_{tab_id}", use_container_width=True):
                st.session_state['active_page'] = tab_id
                st.rerun()
                
        st.markdown("<hr style='margin:12px 0;'/>", unsafe_allow_html=True)
        
        # Settings Controls Drawer (Only visible if expanded)
        if not st.session_state['is_sidebar_collapsed']:
            with st.expander("⚙️ Settings Console", expanded=True):
                user_role = st.selectbox("Role Persona Style:", ["Recruiter", "Admin GDPR", "Hiring Manager"])
                bias_reduction = st.toggle("Demographic Masking", value=st.session_state['demographicMasking'])
                if bias_reduction != st.session_state['demographicMasking']:
                    st.session_state['demographicMasking'] = bias_reduction
                    st.toast("GDPR masking settings synchronized.", icon="🛡️")
                    st.rerun()
                score_threshold = st.slider("Score Limit", 0, 100, st.session_state['scoreThreshold'])
                if score_threshold != st.session_state['scoreThreshold']:
                    st.session_state['scoreThreshold'] = score_threshold
                    st.rerun()
        
        # Logout
        if st.button("🚪 Logout" if not st.session_state['is_sidebar_collapsed'] else "🚪", use_container_width=True, key="sidebar_logout"):
            st.session_state['logged_in'] = False
            st.rerun()


    # ------------------------------------------
    # CENTER COLUMN: PRIMARY SPA PAGE VIEW
    # ------------------------------------------
    with col_center:
        # TOP HEADER NAVIGATION ACTIONS
        header_col1, header_col2 = st.columns([2.5, 1.5])
        with header_col1:
            search_query = st.text_input("🔍 Global Search:", placeholder="Search candidates, JDs, navigation...", label_visibility="collapsed")
            if search_query:
                # Basic Routing Keyword Switcher
                keywords = {
                    "welcome": ["home", "welcome"],
                    "dashboard": ["funnel", "dash"],
                    "jobs": ["job", "analyzer", "requisition", "editor"],
                    "candidates": ["candidate", "database", "gems"],
                    "decision": ["compare", "radar", "duel", "verdict", "offer"],
                    "interviews": ["interview", "schedule", "calendar"],
                    "analytics": ["analytics", "cluster", "reports", "export"],
                    "compliance": ["gdpr", "compliance", "audit", "logs"],
                    "team": ["team", "manager", "permission"],
                    "settings": ["setting", "billing", "integration"]
                }
                for page_tab, kw_list in keywords.items():
                    if any(kw in search_query.lower() for kw in kw_list):
                        st.session_state['active_page'] = page_tab
                        st.toast(f"Routed to {page_tab.upper()}", icon="🔍")
                        st.rerun()
        with header_col2:
            h_btn_col1, h_btn_col2, h_btn_col3 = st.columns(3)
            with h_btn_col1:
                # Theme toggle
                t_icon = "Light Theme" if st.session_state['dark_mode'] else "Dark Theme"
                if st.button(t_icon, use_container_width=True, key="theme_toggle"):
                    st.session_state['dark_mode'] = not st.session_state['dark_mode']
                    st.rerun()
            with h_btn_col2:
                # Notifications bell
                if st.button("Alerts", use_container_width=True, key="bell_toggle"):
                    st.session_state['show_notifications'] = not st.session_state['show_notifications']
                    st.session_state['show_profile'] = False
                    st.rerun()
            with h_btn_col3:
                # Profile button
                if st.button("Profile", use_container_width=True, key="profile_toggle"):
                    st.session_state['show_profile'] = not st.session_state['show_profile']
                    st.session_state['show_notifications'] = False
                    st.rerun()

        # Notifications Dropdown Rendering
        if st.session_state['show_notifications']:
            st.markdown("""<div class='glass-card' style='margin-bottom:15px; border-left:4px solid #4f46e5;'>
            <div style='display:flex; justify-content:between; align-items:center; border-b pb-2 mb-2;'>
                <b style='font-size:0.8rem;'>System Alerts &amp; Notifications</b>
            </div>
            </div>""", unsafe_allow_html=True)
            for notif in st.session_state['notifications']:
                st.markdown(f"**{notif['icon']} {notif['title']}**: {notif['desc']}")
            if st.button("Clear all read notifications", use_container_width=True):
                st.session_state['notifications'] = []
                st.toast("Cleared alerts", icon="✅")
                st.rerun()
            st.markdown("<hr/>", unsafe_allow_html=True)

        # Profile Dropdown Rendering
        if st.session_state['show_profile']:
            st.markdown("""<div class='glass-card' style='text-align:center;'>
            <h4 style='margin:0;'>Sarah Jenkins</h4>
            <span style='font-size:0.75rem; color:#64748B;'>Talent Acquisition Director</span>
            <p style='font-size:0.7rem; color:#10B981; font-weight:700;'>● Workspace Active</p>
            </div>""", unsafe_allow_html=True)
            if st.button("System Settings Page", use_container_width=True):
                st.session_state['active_page'] = "Settings"
                st.session_state['show_profile'] = False
                st.rerun()
            if st.button("Logout Workspace", use_container_width=True):
                st.session_state['logged_in'] = False
                st.rerun()
            st.markdown("<hr/>", unsafe_allow_html=True)

        # Active page routing
        active_tab = st.session_state['active_page']
        
        # Bias Shield active status bar
        if st.session_state['demographicMasking']:
            st.markdown("""<div class='bias-alert'>
            🛡️ <b>GDPR Demographic Bias Masking Active:</b> Sourcing variables sanitized.
            </div>""", unsafe_allow_html=True)

        # ------------------------------------------
        # PAGE 1: WELCOME HOME
        # ------------------------------------------
        if active_tab == "Welcome":
            st.markdown("""<div class='hero-banner'>
            <h2>Welcome Back, Sarah Jenkins!</h2>
            <p>TalentMind AI has parsed 12 new applicants today. Let's analyze alignment metrics.</p>
            </div>""", unsafe_allow_html=True)
            
            # KPI Cards
            w_col1, w_col2, w_col3, w_col4 = st.columns(4)
            with w_col1:
                st.markdown("""<div class='glass-card' style='text-align:center;'>
                <span style='font-size:0.65rem; color:#64748B; font-weight:700; text-transform:uppercase;'>Open Positions</span>
                <h2 style='margin:2px 0;'>4 Roles</h2>
                </div>""", unsafe_allow_html=True)
            with w_col2:
                st.markdown("""<div class='glass-card' style='text-align:center;'>
                <span style='font-size:0.65rem; color:#64748B; font-weight:700; text-transform:uppercase;'>Pipeline Pools</span>
                <h2 style='margin:2px 0;'>12 Active</h2>
                </div>""", unsafe_allow_html=True)
            with w_col3:
                st.markdown("""<div class='glass-card' style='text-align:center;'>
                <span style='font-size:0.65rem; color:#64748B; font-weight:700; text-transform:uppercase;'>Interviews Today</span>
                <h2 style='margin:2px 0;'>3 Cards</h2>
                </div>""", unsafe_allow_html=True)
            with w_col4:
                st.markdown("""<div class='glass-card' style='text-align:center;'>
                <span style='font-size:0.65rem; color:#64748B; font-weight:700; text-transform:uppercase;'>Hiring Cycle</span>
                <h2 style='margin:2px 0;'>18 Days</h2>
                </div>""", unsafe_allow_html=True)

            # Recommendations & Schedule
            w_block1, w_block2 = st.columns([1.5, 1])
            with w_block1:
                st.write("**📅 Upcoming Evaluations Today**")
                for iv in st.session_state['interviews_list']:
                    st.markdown(f"""<div class='glass-card' style='display:flex; justify-content:space-between; align-items:center;'>
                    <div>
                        <b>{iv['candidate']}</b><br/>
                        <span style='font-size:0.75rem; color:#64748B;'>{iv['panelist']} • {iv['time']}</span>
                    </div>
                    </div>""", unsafe_allow_html=True)
                    if st.button(f"Join Call Room ({iv['candidate']})"):
                        st.toast("Opening secure Zoom session integration.", icon="🎥")
            with w_block2:
                st.write("**🧠 AI Hiring recommendations**")
                st.markdown("""<div class='glass-card' style='border-left:4px solid #4f46e5; background:#EFF6FF; color:#1E3A8A; font-size:0.8rem;'>
                <b>Compare Finalists</b><br/>
                Final interview reviews mapped. Check comparison matrices in the Decision Center.
                </div>""", unsafe_allow_html=True)
                if st.button("Open Decision Center", use_container_width=True):
                    st.session_state['active_page'] = "Decision"
                    st.rerun()

        # ------------------------------------------
        # PAGE 2: DASHBOARD funnel
        # ------------------------------------------
        elif active_tab == "Dashboard":
            st.markdown("<h3 style='margin:0;'>Pipeline Conversion Funnel</h3>", unsafe_allow_html=True)
            
            fig = go.Figure(go.Funnel(
                y=["Sourced", "Screened", "Interviewed", "Decision", "Hired"],
                x=[128, 84, 32, 8, 3],
                textinfo="value+percent initial",
                marker={"color": ["#4f46e5", "#6b38d4", "#7c3aed", "#8455ef", "#10b981"]}
            ))
            fig.update_layout(height=280, margin=dict(l=10, r=10, t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig, use_container_width=True)

            # Recent Activity
            st.write("**📈 Recruiter Activity logs**")
            st.markdown("""
            - **Sarah Jenkins** updated React frontend architect JD (10 min ago)
            - **Tom Rivera** submitted scorecard evaluations on Marcus Vane (2 hours ago)
            - **System Auditor** masked database demographics fields (3 hours ago)
            """)

        # ------------------------------------------
        # PAGE 3: JOBS & JD ANALYZER WORKSPACE
        # ------------------------------------------
        elif active_tab == "Jobs":
            jobs_tab1, jobs_tab2, jobs_tab3 = st.tabs([
                "📋 Requisitions",
                "➕ Create Job",
                "🔍 JD Analyzer Workspace"
            ])
            
            with jobs_tab1:
                st.write("**Active Job Requisitions**")
                st.markdown("""
                - **Lead DevOps & Infrastructure Engineer** | Compliance: 95% | 12 candidates
                - **Senior React Frontend Architect** | Compliance: 55% | 8 candidates
                - **Technical Product Manager (Core Platform)** | Compliance: 85% | 5 candidates
                """)
                if st.button("Load DevOps JD into Workspace"):
                    st.session_state['jd_text_value'] = JD_TEMPLATES["Cloud DevOps & SRE Lead"]
                    st.toast("Loaded DevOps template.", icon="📋")
                    st.rerun()
                    
            with jobs_tab2:
                st.write("**Create Job Requisition**")
                title = st.text_input("Role Title")
                skills = st.text_input("Tech Stack Required")
                text = st.text_area("Base Description")
                if st.button("Suggest JD Template"):
                    st.session_state['jd_text_value'] = JD_TEMPLATES["Frontend Specialist (React/Next.js)"]
                    st.toast("React template suggested.", icon="✨")
                    st.rerun()
                    
            with jobs_tab3:
                st.write("**JD Analyzer Workspace**")
                template_choice = st.selectbox("Load Standard JD Preset:", list(JD_TEMPLATES.keys()))
                if template_choice != "Select Template...":
                    st.session_state['jd_text_value'] = JD_TEMPLATES[template_choice]
                    
                jd_text = st.text_area("Job Description Requirements Editor:", value=st.session_state.get('jd_text_value', ''), height=150)
                st.session_state['jd_text_value'] = jd_text
                
                # Ingest JSON candidates
                uploaded_resumes = st.file_uploader("📥 Expand talent pool with candidates JSON:", accept_multiple_files=True)
                if uploaded_resumes:
                    for f in uploaded_resumes:
                        if f.name.endswith(".json"):
                            try:
                                profile_dict = json.load(f)
                                new_profile = CandidateProfile(**profile_dict)
                                if not any(c.id == new_profile.id for c in st.session_state['candidates_list']):
                                    st.session_state['candidates_list'].append(new_profile)
                                    st.toast(f"Ingested {new_profile.name}", icon="✅")
                            except Exception as err:
                                st.error(err)
                                
                if st.button("🚀 Deep Analysis & Match", use_container_width=True):
                    # Trigger evaluations
                    if not jd_text.strip():
                        st.error("Please add description text.")
                    else:
                        st.toast("Running matching models...", icon="⚙️")
                        jd_parsed = parse_jd(jd_text)
                        search_engine = VectorSearchEngine(candidates_db)
                        search_query = f"{jd_parsed.title} {' '.join(jd_parsed.hard_skills)}"
                        vector_results = search_engine.search(search_query, top_k=len(candidates_db))
                        vector_map = {cid: sim for cid, sim in vector_results}
                        
                        scored_candidates = []
                        fraud_map = {}
                        for cand in candidates_db:
                            fraud_data = detect_profile_fraud(cand, candidates_db)
                            fraud_map[cand.id] = fraud_data
                            
                            sim = vector_map.get(cand.id, 0.3)
                            score_data = score_candidate(cand, jd_parsed, sim, "general")
                            scored_candidates.append(score_data)
                            
                        active_candidates = candidates_db
                        if st.session_state['demographicMasking']:
                            active_candidates = [mask_candidate_profile(c) for c in candidates_db]
                            
                        reranked_results = rerank_candidates(active_candidates, jd_parsed, scored_candidates)
                        
                        scored_map = {s["candidate_id"]: s for s in scored_candidates}
                        final_results = []
                        for rank_item in reranked_results:
                            c_id = rank_item["candidate_id"]
                            cand_profile = next(c for c in active_candidates if c.id == c_id)
                            score_data = scored_map[c_id]
                            fraud_data = fraud_map[c_id]
                            
                            final_results.append({
                                "rank": rank_item["reranked_position"],
                                "candidate": cand_profile,
                                "overall_score": score_data["final_score"],
                                "breakdown": score_data["breakdown"],
                                "justification": rank_item["justification"],
                                "risks": rank_item["risks"],
                                "missing_skills": rank_item["missing_skills"],
                                "interview_questions": rank_item["interview_questions"],
                                "recommendation": rank_item["recommendation"],
                                "fraud": fraud_data,
                                "shap": calculate_shap_breakdown(score_data),
                                "insights": get_insights(score_data),
                                "coach": generate_resume_coaching(score_data, cand_profile, jd_parsed)
                            })
                            
                        filtered_results = [r for r in final_results if r["overall_score"] >= st.session_state['scoreThreshold']]
                        
                        st.session_state['results_cache'] = filtered_results
                        st.session_state['jd_parsed_cache'] = jd_parsed
                        st.session_state['scores_cache'] = scored_candidates
                        st.toast("Evaluations completed!", icon="🚀")
                        st.session_state['active_page'] = "Candidates"
                        st.rerun()

                # Scoring widgets
                score_words = len(jd_text.split())
                score_calc = min(98, max(30, 40 + score_words // 2))
                
                # SVG score gauge
                dashoffset = 251 - (251 * (score_calc / 100))
                st.markdown(f"""<div class='glass-card' style='display:flex; align-items:center; gap:20px;'>
                <svg width="80" height="80" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                    <circle cx="50" cy="50" r="40" stroke="#f0ecf9" stroke-width="8" fill="transparent"/>
                    <circle cx="50" cy="50" r="40" stroke="#4f46e5" stroke-dasharray="251.2" stroke-dashoffset="{dashoffset}" stroke-width="8" fill="transparent" stroke-linecap="round"/>
                </svg>
                <div>
                    <b>JD Sourcing Score: {score_calc}%</b>
                    <p style='font-size:0.75rem; color:#64748B; margin:0;'>Vocabulary match rate index against database ontology.</p>
                </div>
                </div>""", unsafe_allow_html=True)
                
                # Suggestions
                st.write("**AI Rewrite suggestions:**")
                sug_col1, sug_col2 = st.columns(2)
                with sug_col1:
                    st.markdown("""<div class='glass-card' style='font-size:0.75rem;'>
                    Include DevOps tool deployment targets (Terraform/Kubernetes).
                    </div>""", unsafe_allow_html=True)
                    if st.button("Apply suggestion 1"):
                        st.session_state['jd_text_value'] = jd_text + "\n- Must understand Terraform and Kubernetes scaling targets."
                        st.rerun()
                with sug_col2:
                    st.markdown("""<div class='glass-card' style='font-size:0.75rem;'>
                    Provide specific project outcomes deliverables metrics.
                    </div>""", unsafe_allow_html=True)
                    if st.button("Apply suggestion 2"):
                        st.session_state['jd_text_value'] = jd_text + "\n- Deliver 50% model inference latency reductions in production workloads."
                        st.rerun()

                if st.button("Publish Requisition to targeted boards"):
                    st.toast("Job published successfully to LinkedIn and Indeed!", icon="🚀")

        # ------------------------------------------
        # PAGE 4: CANDIDATES DATABASE
        # ------------------------------------------
        elif active_tab == "Candidates":
            st.markdown("<h3 style='margin:0;'>Sourcing Matches Explorer</h3>", unsafe_allow_html=True)
            db_search = st.text_input("🔍 Filter Profiles by Specific Skill, Name, or Keyword:", key="db_cand_search").lower().strip()
            gems_only = st.checkbox("💎 Show Hidden Gems Only", key="gems_only_db")
            
            filtered_results = st.session_state.get('results_cache', [])
            
            if not filtered_results:
                st.warning("Please execute evaluations in the Jobs tab to load candidates rankings.")
            else:
                matches_to_display = []
                for r in filtered_results:
                    c = r["candidate"]
                    score = r["overall_score"]
                    breakdown = r["breakdown"]
                    
                    is_hidden_gem = c.experience_years <= 5.0 and breakdown.get("innovation_score", 0.0) >= 80.0
                    
                    if gems_only and not is_hidden_gem:
                        continue
                    if db_search:
                        if not (db_search in c.name.lower() or 
                                any(db_search in s.lower() for s in c.hard_skills) or 
                                any(db_search in s.lower() for s in c.soft_skills)):
                            continue
                    matches_to_display.append(r)
                    
                if not matches_to_display:
                    st.info("No candidates match settings.")
                else:
                    for r in matches_to_display:
                        c = r["candidate"]
                        score = r["overall_score"]
                        role = c.experience_timeline[0].role if c.experience_timeline else "Engineer"
                        is_hidden_gem = c.experience_years <= 5.0 and r["breakdown"].get("innovation_score", 0.0) >= 80.0
                        
                        st.markdown(f"""<div class='glass-card' style='display:flex; justify-content:space-between; align-items:center;'>
                        <div>
                            <b>{c.name}</b> { "💎" if is_hidden_gem else "" }<br/>
                            <span style='font-size:0.75rem; color:#64748B;'>{role} • {c.experience_years} YoE • {score}% Match</span>
                        </div>
                        </div>""", unsafe_allow_html=True)
                        if st.button(f"Analyze Fit details for {c.name}"):
                            st.session_state['selected_candidate_id'] = c.id
                            st.rerun()

        # ------------------------------------------
        # PAGE 5: DECISION CENTER COMPARISON
        # ------------------------------------------
        elif active_tab == "Decision":
            st.markdown("<h3 style='margin:0;'>Decision Board Duel Comparison</h3>", unsafe_allow_html=True)
            
            results = st.session_state.get('results_cache', [])
            if not results:
                st.warning("Please execute match logic on JDs to comparison.")
            else:
                comp_col1, comp_col2 = st.columns(2)
                with comp_col1:
                    opt_a = st.selectbox("Select Finalist A:", options=[r["candidate"].name for r in results], index=0)
                with comp_col2:
                    opt_b = st.selectbox("Select Finalist B:", options=[r["candidate"].name for r in results], index=min(1, len(results)-1))
                    
                itemA = next(r for r in results if r["candidate"].name == opt_a)
                itemB = next(r for r in results if r["candidate"].name == opt_b)
                
                cA = itemA["candidate"]
                cB = itemB["candidate"]
                
                # Radar Chart comparison via Plotly
                categories = ['Technical Fit', 'Experience Fit', 'Semantic Match', 'Behavioral Fit', 'Leadership Index', 'Stability Score']
                fig = go.Figure()
                fig.add_trace(go.Scatterpolar(
                    r=[itemA["breakdown"].get('technical_fit', 50), itemA["breakdown"].get('experience_fit', 50), itemA["breakdown"].get('semantic_similarity', 50), itemA["breakdown"].get('behavioral_fit', 50), itemA["breakdown"].get('leadership_score', 50), itemA["breakdown"].get('stability_score', 50)],
                    theta=categories, fill='toself', name=cA.name, line_color="#4f46e5"
                ))
                fig.add_trace(go.Scatterpolar(
                    r=[itemB["breakdown"].get('technical_fit', 50), itemB["breakdown"].get('experience_fit', 50), itemB["breakdown"].get('semantic_similarity', 50), itemB["breakdown"].get('behavioral_fit', 50), itemB["breakdown"].get('leadership_score', 50), itemB["breakdown"].get('stability_score', 50)],
                    theta=categories, fill='toself', name=cB.name, line_color="#6b38d4"
                ))
                fig.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0, 100])), showlegend=True, height=280, margin=dict(l=40, r=40, t=10, b=10), paper_bgcolor="rgba(0,0,0,0)")
                st.plotly_chart(fig, use_container_width=True)

                # Risks & Culture Fit
                c_fit_a = itemA["breakdown"].get("behavioral_fit", 80)
                c_fit_b = itemB["breakdown"].get("behavioral_fit", 75)
                st.write("**Culture fit metrics:**")
                st.markdown(f"""
                - **{cA.name}**: {c_fit_a}/100
                - **{cB.name}**: {c_fit_b}/100
                """)
                
                st.write("**Hiring actions selection:**")
                dec_col1, dec_col2, dec_col3 = st.columns(3)
                with dec_col1:
                    if st.button("Generate Offer PDF"):
                        text_content = f"Offer Letter Requisition\n\nCandidate: {cA.name}\nTimestamp: {new_profile.id if 'new_profile' in locals() else '2026'}"
                        b64 = base64.b64encode(text_content.encode()).decode()
                        href = f'<a href="data:file/txt;base64,{b64}" download="Offer_Letter_{cA.name}.txt">⬇️ Click to Download Letter</a>'
                        st.markdown(href, unsafe_allow_html=True)
                        st.toast("Offer document generated.", icon="📄")
                with dec_col2:
                    if st.button("Log Rejection Reason"):
                        st.toast(f"Logged rejection reason for {cB.name}", icon="🛑")
                with dec_col3:
                    if st.button("Escalate to Board"):
                        st.toast("Escalated review metrics.", icon="⚡")

        # ------------------------------------------
        # PAGE 6: INTERVIEWS PANEL
        # ------------------------------------------
        elif active_tab == "Interviews":
            st.write("**Interviews Schedule Manager**")
            for iv in st.session_state['interviews_list']:
                st.markdown(f"""<div class='glass-card'>
                <b>{iv['candidate']}</b> • Status: <span style='color:#10B981; font-weight:bold;'>{iv['status']}</span><br/>
                <span style='font-size:0.75rem; color:#64748B;'>Panelists: {iv['panelist']} | Time: {iv['date']} {iv['time']}</span>
                </div>""", unsafe_allow_html=True)
                
            st.write("**Schedule Interview Form**")
            with st.form("schedule_form"):
                cand_name = st.text_input("Candidate Name")
                panelist_name = st.text_input("Interviewer Panelist", value="Tom Rivera")
                date_val = st.date_input("Date Selection")
                time_val = st.text_input("Time Hour", value="15:00")
                sub_form = st.form_submit_button("Schedule")
                if sub_form:
                    st.session_state['interviews_list'].append({
                        "candidate": cand_name, "panelist": panelist_name, "date": str(date_val), "time": time_val, "status": "CONFIRMED"
                    })
                    st.toast("Interview scheduled.", icon="✅")
                    st.rerun()

        # ------------------------------------------
        # PAGE 7: ANALYTICS & REPORTS
        # ------------------------------------------
        elif active_tab == "Analytics":
            st.write("**K-Means Talent Clustering**")
            
            n_clusters_val = int(st.selectbox("Select Clusters (K):", [3, 4, 5], index=1))
            
            with st.spinner("Executing PCA dimensions..."):
                df, themes = cluster_candidates(candidates_db, n_clusters=n_clusters_val)
                if not df.empty:
                    # Plotly scatter plot with custom colors
                    fig_clust = px.scatter(
                        df, 
                        x="x", 
                        y="y", 
                        color="Talent Category", 
                        hover_data=["Name", "Experience"], 
                        title="K-Means Talent Embeddings Projection (PCA 2D)",
                        labels={"x": "PCA Component 1", "y": "PCA Component 2"},
                        color_discrete_sequence=["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"]
                    )
                    fig_clust.update_traces(marker=dict(size=12, line=dict(width=1.5, color='White')))
                    fig_clust.update_layout(
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        margin=dict(l=10, r=10, t=40, b=10)
                    )
                    st.plotly_chart(fig_clust, use_container_width=True)
                    
                    # Display Cluster theme details
                    st.write("**Talent Cohort Breakdowns**")
                    cols = st.columns(min(n_clusters_val, 3))
                    for idx, theme in enumerate(themes):
                        col_idx = idx % len(cols)
                        with cols[col_idx]:
                            st.markdown(f"""
                            <div class='glass-card' style='border-top: 4px solid {["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"][idx % 5]}; margin-bottom: 10px;'>
                                <b>{theme}</b> <span style='font-size: 0.7rem; color: #64748B;'>(Cluster {idx})</span>
                            </div>
                            """, unsafe_allow_html=True)
                            cluster_members = df[df["ClusterID"] == idx]
                            for _, member in cluster_members.iterrows():
                                st.write(f"- **{member['Name']}** ({member['Experience']})")
                else:
                    st.write("No candidates to cluster. Load or search profiles first.")
                    
            st.write("**Export Reports center**")
            rep_col1, rep_col2 = st.columns(2)
            with rep_col1:
                if st.button("Export Efficiency CSV"):
                    csv_data = "Metric,Score\nTime-to-Hire,18 Days\nBias Shield,Passed\n"
                    b64 = base64.b64encode(csv_data.encode()).decode()
                    st.markdown(f'<a href="data:file/csv;base64,{b64}" download="Sourcing_Report.csv">⬇️ Download CSV File</a>', unsafe_allow_html=True)
            with rep_col2:
                if st.button("Export Compliance PDF"):
                    st.toast("Compliance PDF generated successfully.", icon="📄")

        # ------------------------------------------
        # PAGE 8: COMPLIANCE LOGS
        # ------------------------------------------
        elif active_tab == "Compliance":
            st.write("**GDPR Masking Settings controls**")
            slider_val = st.slider("Candidate profile retention limits (Months):", 1, 24, 6)
            
            st.write("**Security Audit Access logs ledger:**")
            for log in reversed(auditor.get_logs()):
                st.markdown(f"`{log}`")

        # ------------------------------------------
        # PAGE 9: TEAM MANAGEMENT
        # ------------------------------------------
        elif active_tab == "Team":
            st.markdown("### 👥 Team Workspace - INNOVATOR TEAM")
            st.write("Manage active workspace memberships, roles, permissions and audits.")
            for member in st.session_state['team_members']:
                st.markdown(f"""
                - **{member['name']}** (`{member.get('email', '')}`)  
                  **Role**: {member['role']} | **Last Login**: {member['last_login']} | **Status**: {member['status']}
                """)
            new_member = st.text_input("Invite business recruiter email:")
            if st.button("Dispatch Workspace Invitation"):
                if new_member:
                    st.toast(f"Invitation dispatched to {new_member}!", icon="✉️")
                else:
                    st.warning("Please enter a valid email address.")

        # ------------------------------------------
        # PAGE 10: SYSTEM SETTINGS
        # ------------------------------------------
        elif active_tab == "Settings":
            st.markdown("## ⚙️ System Settings")
            st.markdown("Configure global workspace preferences, accessibility options, regional settings, support documentation, and referrals.")
            
            col_pref, col_access = st.columns(2)
            
            with col_pref:
                st.markdown("### 🏢 Workspace Preferences")
                st.text_input("Hex Brand Accent Color:", value="#3525cd", disabled=True)
                st.text_input("Company Workspace Domain:", value="talentmind.ai", disabled=True)
                
                st.markdown("### 🌐 Regional & Language")
                st.selectbox("App Language:", ["English (Device Default)", "Español (Spanish)", "Français (French)", "Deutsch (German)", "日本語 (Japanese)"])
                
            with col_access:
                st.markdown("### ♿ Accessibility & Visuals")
                st.markdown("Customize your visual preferences for maximum comfort and readability.")
                contrast_toggle = st.toggle("Increase Contrast", value=st.session_state.get('high_contrast', False), help="Heighten text visibility and outline contrasts.")
                animation_toggle = st.toggle("Reduce Animations", value=st.session_state.get('reduce_animations', False), help="Disable UI transitions and movement effects.")
                
                if contrast_toggle != st.session_state.get('high_contrast', False):
                    st.session_state['high_contrast'] = contrast_toggle
                    st.rerun()
                if animation_toggle != st.session_state.get('reduce_animations', False):
                    st.session_state['reduce_animations'] = animation_toggle
                    st.rerun()
            
            st.markdown("---")
            
            col_referral, col_help = st.columns(2)
            
            with col_referral:
                st.markdown("### 🎁 Invite a Friend & Referral Program")
                st.markdown("Invite teammates or hiring partners onto TalentMind AI and earn billing credits.")
                
                st.text_input("Your Referral Code:", value="TM-ALPHA-2026", disabled=True)
                st.text_input("Invitation Link:", value="https://talentmind.ai/invite?ref=TM-ALPHA-2026", disabled=True)
                
                invite_msg = (
                    "Hey! I've been using TalentMind AI to streamline our enterprise recruiting. "
                    "It features automated resume parsing, compliance checks, and real-time AI scoring. "
                    "Try it out using my referral code: TM-ALPHA-2026. "
                    "Join here: https://talentmind.ai/invite?ref=TM-ALPHA-2026"
                )
                st.text_area("Shareable Invitation Message:", value=invite_msg, height=120, disabled=True)
                if st.button("🔗 Copy & Share Invitation Message", use_container_width=True):
                    st.toast("Referral invitation copied to clipboard!", icon="✅")
                    
                st.markdown("#### 🚀 App updates & releases")
                st.markdown("""
                - **v2.4.1 Stable**: Modern purple design update.
                - **v2.4.0**: Added Contrast & Animation accessibility settings.
                - **v2.3.9**: Implemented referral generator and unified language options.
                """)
                
            with col_help:
                st.markdown("### 🛠️ Help & Support Feedback")
                st.markdown("Access help directories, report technical bugs, or review compliance rules.")
                
                with st.expander("❓ Help Centre & FAQs"):
                    st.markdown("""
                    **Q: How does AI Match scoring work?**  
                    *Ans: The LLM model computes a semantic similarity score between the parsed resume coordinates and the JD's requirements.*
                    
                    **Q: What does Demographic Masking shield do?**  
                    *Ans: Toggling ON replaces names, gender, location, and age markers with neutral tags to protect hiring integrity.*
                    
                    **Q: How do I link other ATS platforms?**  
                    *Ans: Administrators can synchronize Greenhouse, Greenhouse API, or Workday credentials in the integrations drawer.*
                    """)
                    
                with st.expander("📬 Contact Support"):
                    st.write("Send a secure ticket to the engineering operations team.")
                    inquiry_cat = st.selectbox("Category:", ["Technical Bug", "Billing issue", "Data Privacy", "Feature Request"])
                    support_msg = st.text_area("Message / Issue Description:", placeholder="Describe your inquiry...")
                    if st.button("Submit Support Ticket", use_container_width=True):
                        if support_msg:
                            st.toast("Ticket submitted successfully! Support will reply shortly.", icon="✉️")
                        else:
                            st.warning("Please enter a message before submitting.")
                            
                with st.expander("🛡️ Privacy Policy"):
                    st.markdown("""
                    **1. Embedding Extraction**  
                    All resumes parsed are converted into anonymous vectors. No identity attributes are processed.
                    
                    **2. Data Security & Logs**  
                    Workspace audit trails tracking compliance scores are encrypted with TLS 1.3 in-transit and AES-256 at-rest.
                    
                    **3. Right to Erasure**  
                    Candidates and recruiters can invoke erasure procedures directly to prune old records from the indexing engine.
                    """)
            
            st.markdown("---")
            st.write("**Linked Marketplace Integrations**")
            st.markdown("""
            - **Slack Notifications**: Linked (Status: secure)
            - **Zoom Video Call Rooms**: Linked (Status: secure)
            - **Greenhouse ATS**: Disconnected
            """)
            if st.button("Link Greenhouse ATS"):
                st.toast("Greenhouse API linked successfully.", icon="🔌")


    # ------------------------------------------
    # RIGHT COLUMN: DETAIL DRAWER OR FLOAT COPILOT
    # ------------------------------------------
    with col_right:
        selected_id = st.session_state['selected_candidate_id']
        
        if selected_id:
            st.markdown("### 📋 Profile deep-dive Drawer")
            if st.button("❌ Close Deep-Dive Drawer", use_container_width=True):
                st.session_state['selected_candidate_id'] = None
                st.rerun()
                
            # Get candidate
            cand_profile = next((c for c in candidates_db if c.id == selected_id), None)
            if cand_profile:
                st.write(f"**Name**: {cand_profile.name}")
                st.write(f"**Tenure**: {cand_profile.experience_years} years experience")
                
                # Journeys
                st.write("**Experience Timeline journey:**")
                for exp in cand_profile.experience_timeline:
                    st.markdown(f"- **{exp.role}** at {exp.company} ({exp.duration})")
                    
                # Mock simulation
                st.write("**🎙️ AI Mock Interview Simulation**")
                if st.button("Run simulated screening"):
                    st.session_state['simulated_interviews'][selected_id] = True
                    
                if st.session_state['simulated_interviews'].get(selected_id):
                    st.markdown("""
                    **AI**: Explain how you slashed latency by 50% in production.<br/>
                    **Ans**: We configured Redis caching, optimized SQL queries indexing, and removed blocking threads inside Docker layers.
                    """, unsafe_allow_html=True)
                else:
                    st.write("Click button above to evaluate mock screening response dials.")
        else:
            # Standard AI Copilot chat pane
            st.markdown("### 💬 Copilot Chat Assistant")
            
            # Quick Suggested chips
            st.write("**Quick recommendations:**")
            col_chip1, col_chip2 = st.columns(2)
            with col_chip1:
                if st.button("💎 Hidden Gems?", key="float_gems"):
                    st.session_state['copilot_query'] = "Are there any hidden gems?"
                    st.rerun()
            with col_chip2:
                if st.button("Who knows Docker?", key="float_docker"):
                    st.session_state['copilot_query'] = "Who knows Docker?"
                    st.rerun()
                    
            chat_input = st.text_input("Ask assistant or search queries:", value=st.session_state.get('copilot_query', ''), key="copilot_chat_input")
            
            final_query = ""
            if st.session_state.get('copilot_query'):
                final_query = st.session_state['copilot_query']
                st.session_state['copilot_query'] = ""
            elif chat_input:
                final_query = chat_input
                
            if final_query:
                dummy_jd = parse_jd("Software Engineer")
                dummy_engine = VectorSearchEngine(candidates_db)
                dummy_sim = dummy_engine.search(dummy_jd.title, top_k=len(candidates_db))
                dummy_map = {cid: sim for cid, sim in dummy_sim}
                
                dummy_scores = []
                for cand in candidates_db:
                    sim = dummy_map.get(cand.id, 0.3)
                    dummy_scores.append(score_candidate(cand, dummy_jd, sim, "general"))
                    
                copilot_instance = CopilotEngine(candidates_db, dummy_scores)
                response = copilot_instance.process_query(final_query)
                st.session_state['chat_history'].append((final_query, response))
                
            # Render logs
            for q, r_msg in reversed(st.session_state['chat_history']):
                st.markdown(f"<div class='chat-bubble-container-user'><div class='chat-bubble-user'><b>You</b>: {q}</div></div>", unsafe_allow_html=True)
                st.markdown(f"<div class='chat-bubble-container-copilot'><div class='chat-bubble-copilot'><b>Copilot</b>: {r_msg}</div></div>", unsafe_allow_html=True)
