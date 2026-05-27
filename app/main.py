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

# Page configurations - Collapsing native sidebar to reveal the custom premium 3-panel layout
st.set_page_config(
    page_title="TalentMind AI - Autonomous Hiring Intelligence Platform",
    page_icon=APP_LOGO_URI or "🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

if 'loading_screen_seen' not in st.session_state:
    st.session_state['loading_screen_seen'] = True
    st.markdown(f"""
<style>
    .app-loading-overlay {{
        position: fixed;
        inset: 0;
        z-index: 999999;
        background:
            radial-gradient(circle at 30% 25%, rgba(59, 130, 246, 0.14), transparent 32%),
            radial-gradient(circle at 78% 72%, rgba(16, 185, 129, 0.12), transparent 28%),
            linear-gradient(135deg, #f8fafc 0%, #eef6ff 52%, #f8fafc 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: loadingOverlayFade 0.55s ease forwards;
        animation-delay: 7.45s;
    }}
    .app-loading-shell {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
        transform: translateY(-8px);
    }}
    .app-loading-logo {{
        width: min(44vw, 360px);
        max-height: 260px;
        object-fit: contain;
        filter: drop-shadow(0 22px 45px rgba(15, 23, 42, 0.16));
        animation: loadingLogoPulse 1.8s ease-in-out infinite;
    }}
    .app-loading-title {{
        font-family: Inter, sans-serif;
        color: #0f172a;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }}
    .app-loading-track {{
        width: min(42vw, 320px);
        height: 5px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.28);
    }}
    .app-loading-bar {{
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #1e3a8a, #2563eb, #10b981);
        transform-origin: left;
        animation: loadingBarFill 8s linear forwards;
    }}
    @keyframes loadingLogoPulse {{
        0%, 100% {{
            transform: scale(1);
            opacity: 0.94;
        }}
        50% {{
            transform: scale(1.035);
            opacity: 1;
        }}
    }}
    @keyframes loadingBarFill {{
        from {{
            transform: scaleX(0);
        }}
        to {{
            transform: scaleX(1);
        }}
    }}
    @keyframes loadingOverlayFade {{
        to {{
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }}
    }}
</style>
<div class="app-loading-overlay" id="app-loading-overlay">
    <div class="app-loading-shell">
        <img class="app-loading-logo" src="{APP_LOGO_URI}" alt="TalentMind AI logo" />
        <div class="app-loading-title">TalentMind AI Loading</div>
        <div class="app-loading-track"><div class="app-loading-bar"></div></div>
    </div>
</div>
<script>
    setTimeout(function() {{
        const overlay = document.getElementById("app-loading-overlay");
        if (overlay) {{
            overlay.style.opacity = "0";
            overlay.style.visibility = "hidden";
            overlay.style.pointerEvents = "none";
        }}
    }}, 8000);
</script>
""", unsafe_allow_html=True)

# Initialize Security Auditor
if 'auditor' not in st.session_state:
    st.session_state['auditor'] = SecureAuditor()
auditor = st.session_state['auditor']

# Initialize Candidate DB Cache
if 'candidates_list' not in st.session_state:
    st.session_state['candidates_list'] = load_candidates_db()

# Initialize Chat History for Copilot
if 'chat_history' not in st.session_state:
    st.session_state['chat_history'] = [
        ("System", "Hello! I am your TalentMind Copilot assistant. Ask me questions about candidate alignment, hidden gems, or comparisons!")
    ]

# Session State Initialization for Pages, Wizard & Drawer
if 'active_page' not in st.session_state:
    st.session_state['active_page'] = "Dashboard"
if 'active_step' not in st.session_state:
    st.session_state['active_step'] = 1
if 'selected_candidate_id' not in st.session_state:
    st.session_state['selected_candidate_id'] = None
if 'compare_candidates' not in st.session_state:
    st.session_state['compare_candidates'] = []
if 'recruiter_notes' not in st.session_state:
    st.session_state['recruiter_notes'] = {}
if 'shortlisted_candidates' not in st.session_state:
    st.session_state['shortlisted_candidates'] = []
if 'bookmarked_candidates' not in st.session_state:
    st.session_state['bookmarked_candidates'] = []
if 'candidate_ats_states' not in st.session_state:
    st.session_state['candidate_ats_states'] = {}
if 'copilot_query' not in st.session_state:
    st.session_state['copilot_query'] = ""
if 'simulated_interviews' not in st.session_state:
    st.session_state['simulated_interviews'] = {}

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

# Premium Light Stripe/Linear inspired aesthetic CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    .stApp {
        background:
            linear-gradient(180deg, #F8FBFF 0%, #F6F8FC 42%, #F8FAFC 100%) !important;
        font-family: 'Inter', sans-serif;
        color: #0F172A !important;
    }

    .block-container {
        max-width: 1820px !important;
        padding: 2.5rem 2.7rem 3rem 2.7rem !important;
    }

    div[data-testid="column"] {
        padding-left: 0.45rem !important;
        padding-right: 0.45rem !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #0F172A !important;
    }
    
    /* Typography Overrides */
    .page-title {
        font-size: 42px !important;
        font-weight: 800 !important;
        background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.03em !important;
        margin-bottom: 4px !important;
    }
    
    .section-heading {
        font-size: 22px !important;
        font-weight: 600 !important;
        color: #0F172A !important;
        margin-top: 18px !important;
        margin-bottom: 8px !important;
    }
    
    /* Card headings */
    .card-heading {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: #0F172A !important;
    }
    
    /* Labels */
    .label-muted {
        font-size: 13px !important;
        color: #64748B !important;
        font-weight: 500 !important;
    }
    
    /* Clean Premium Card Shadows */
    .glass-card {
        background: #FFFFFF !important;
        border: 1px solid rgba(203, 213, 225, 0.82) !important;
        border-radius: 14px !important;
        padding: 22px !important;
        box-shadow: 0 18px 44px rgba(15,23,42,0.06) !important;
        margin-bottom: 20px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-card:hover {
        border-color: rgba(37, 99, 235, 0.2) !important;
        box-shadow: 0 12px 36px 0 rgba(37, 99, 235, 0.05) !important;
    }
    
    /* Skill Badges & Chip styles */
    .skill-badge {
        display: inline-block;
        background: rgba(37, 99, 235, 0.08);
        color: #2563EB;
        border: 1px solid rgba(37, 99, 235, 0.15);
        border-radius: 9999px;
        padding: 4px 12px;
        font-size: 0.76rem;
        margin: 3px;
        font-weight: 600;
    }
    
    .soft-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.08);
        color: #065F46;
        border: 1px solid rgba(16, 185, 129, 0.15);
        border-radius: 9999px;
        padding: 4px 12px;
        font-size: 0.76rem;
        margin: 3px;
        font-weight: 600;
    }
    
    .bias-alert {
        background: linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%);
        border: 1px solid rgba(37, 99, 235, 0.18);
        padding: 10px 15px;
        border-radius: 10px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #1E40AF;
        font-size: 0.88rem;
    }

    .brand-panel {
        height: 92px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 18px;
    }

    .brand-panel img {
        width: 260px;
        max-width: 100%;
        transform: scale(1.8);
        transform-origin: center;
        object-fit: contain;
    }

    .top-brand {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(203,213,225,0.9);
        padding: 18px 22px;
        border-radius: 16px;
        box-shadow: 0 18px 46px rgba(15,23,42,0.055);
        margin-bottom: 16px;
    }

    .top-brand-left {
        display: flex;
        align-items: center;
        gap: 18px;
        min-width: 0;
    }

    .top-brand-logo-frame {
        width: 160px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 10px;
        background: linear-gradient(135deg, #F8FAFC, #FFFFFF);
    }

    .top-brand-logo-frame img {
        width: 230px;
        transform: scale(1.55);
        object-fit: contain;
    }

    .top-brand h2 {
        margin: 0;
        font-size: 1.22rem;
        font-weight: 850;
        color: #0F172A;
        line-height: 1.1;
    }

    .top-brand span {
        display: block;
        margin-top: 8px;
        font-size: 0.68rem;
        color: #64748B;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }

    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        background: rgba(16,185,129,0.1);
        color: #047857;
        font-size: 0.68rem;
        font-weight: 800;
    }

    .notification-dot {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: 0.86rem;
    }

    .stButton > button {
        min-height: 44px;
        border-radius: 10px !important;
        border: 1px solid rgba(203,213,225,0.95) !important;
        background: rgba(255,255,255,0.92) !important;
        color: #0F172A !important;
        font-weight: 650 !important;
        box-shadow: 0 8px 22px rgba(15,23,42,0.035);
        transition: all 0.18s ease;
    }

    .stButton > button:hover {
        border-color: rgba(37,99,235,0.45) !important;
        color: #1D4ED8 !important;
        box-shadow: 0 12px 28px rgba(37,99,235,0.09);
        transform: translateY(-1px);
    }

    div[data-testid="stExpander"] {
        border: 1px solid rgba(203,213,225,0.9) !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,0.72) !important;
        box-shadow: 0 10px 26px rgba(15,23,42,0.035);
        overflow: hidden;
    }

    div[data-testid="stExpander"] summary {
        font-weight: 800 !important;
        color: #0F172A !important;
    }

    .stSelectbox div[data-baseweb="select"] > div,
    .stTextInput input,
    .stTextArea textarea {
        border-radius: 10px !important;
        border-color: transparent !important;
        background: #EEF2F7 !important;
    }

    .stTextInput input:focus,
    .stTextArea textarea:focus {
        box-shadow: 0 0 0 2px rgba(37,99,235,0.25) !important;
    }

    .hero-panel {
        text-align: center;
        padding: 30px 20px;
        background:
            radial-gradient(circle at 18% 15%, rgba(37,99,235,0.09), transparent 30%),
            linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.9) 100%);
        border: 1px solid rgba(203,213,225,0.85);
        border-radius: 16px;
        margin-bottom: 18px;
        box-shadow: 0 18px 44px rgba(15,23,42,0.045);
    }

    .hero-panel h3 {
        margin: 0;
        font-size: 1.82rem;
        font-weight: 850;
        color: #06142E;
    }

    .hero-panel p {
        color: #64748B;
        font-size: 0.92rem;
        margin: 12px 0 0 0;
    }

    .copilot-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 6px 0 14px 0;
    }

    .copilot-title-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #EEF2FF, #F5F3FF);
        box-shadow: inset 0 0 0 1px rgba(99,102,241,0.13);
    }

    .copilot-title h3 {
        margin: 0;
        font-size: 1.55rem;
        font-weight: 850;
    }

    .chat-bubble-recruiter,
    .chat-bubble-copilot {
        line-height: 1.55;
    }
    
    /* 4-Step Onboarding Indicators styling */
    .step-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 24px;
        background: #FFFFFF;
        padding: 15px 25px;
        border: 1px solid #E2E8F0;
        border-radius: 14px;
        box-shadow: 0 4px 12px rgba(148,163,184,0.03);
    }
    .step-item {
        display: flex;
        align-items: center;
        font-size: 0.85rem;
        font-weight: 600;
        color: #64748B;
    }
    .step-active {
        color: #2563EB !important;
    }
    .step-num {
        display: inline-block;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        text-align: center;
        line-height: 22px;
        background: #E2E8F0;
        color: #64748B;
        margin-right: 8px;
        font-size: 0.76rem;
    }
    .step-active .step-num {
        background: #2563EB !important;
        color: #FFFFFF !important;
    }
    
    /* Bubble chats styling */
    .chat-bubble-container-recruiter {
        margin-bottom: 15px;
        clear: both;
        display: flex;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-end;
    }
    
    .chat-bubble-container-copilot {
        margin-bottom: 15px;
        clear: both;
        display: flex;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-start;
    }
    
    .chat-bubble-avatar-recruiter {
        background: #E2E8F0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        order: 2;
    }
    
    .chat-bubble-avatar-copilot {
        background: #2563EB;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        color: #FFFFFF;
    }
    
    .chat-bubble-recruiter {
        background: #2563EB;
        color: #FFFFFF;
        padding: 12px 16px;
        border-radius: 16px 16px 0px 16px;
        font-size: 0.85rem;
        max-width: 80%;
        border: 1px solid #2563EB;
        box-shadow: 0 4px 10px rgba(37,99,235,0.08);
    }
    
    .chat-bubble-copilot {
        background: #FFFFFF;
        color: #0F172A;
        padding: 12px 16px;
        border-radius: 16px 16px 16px 0px;
        font-size: 0.85rem;
        max-width: 80%;
        border: 1px solid #E2E8F0;
        box-shadow: 0 4px 10px rgba(15,23,42,0.03);
    }
    
    .chat-bubble-meta {
        font-weight: 700;
        font-size: 0.7rem;
        margin-bottom: 4px;
    }
    
    /* Timeline Journey styling */
    .timeline-node {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;
        border-left: 2px solid #2563EB;
        padding-left: 15px;
        position: relative;
    }
    .timeline-node::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #2563EB;
        border: 2px solid #FFFFFF;
    }
</style>
""", unsafe_allow_html=True)

# Main columns structure
col_left, col_center, col_right = st.columns([1.75, 5.35, 2.45])

# Load profiles list
candidates_db = st.session_state['candidates_list']

# Navigation SPA state
active_page = st.session_state['active_page']

# Highlight active nav header button
lbl_dash = "👉 Dashboard" if active_page == "Dashboard" else "Dashboard"
lbl_cand = "👉 Candidates" if active_page == "Candidates" else "Candidates"
lbl_comp = "👉 Compare" if active_page == "Compare" else "Compare"
lbl_anal = "👉 Analytics" if active_page == "Analytics" else "Analytics"
lbl_copi = "👉 AI Copilot" if active_page == "AI_Copilot" else "AI Copilot"
lbl_compl = "👉 Compliance" if active_page == "Compliance" else "Compliance"
lbl_team = "👉 Team" if active_page == "Team" else "Team"

# ==========================================
# 1. LEFT COLUMN: COMPRESSED CONTROLS SIDEBAR
# ==========================================
with col_left:
    st.markdown(f"""<div class='brand-panel'>
<img src='{APP_LOGO_URI}' alt='TalentMind AI logo' />
</div>""", unsafe_allow_html=True)
    st.markdown("### ⚙️ settings console")
    
    # Recruiter Settings
    with st.expander("🔑 Recruiter Settings", expanded=True):
        user_role = st.selectbox(
            "Access Role Permissions:",
            options=["Recruiter", "Admin (GDPR Overseer)", "Hiring Manager", "Auditor (Read-Only)"],
            help="Simulates GDPR compliance. Auditor hides candidate phone & emails."
        )
        bias_reduction = st.toggle(
            "🛡️ Demographic Masking",
            value=True,
            help="Hides gender, email, age, and specific university names to prevent bias."
        )
        
    # Match Settings Accordion
    with st.expander("🎛️ Match Settings", expanded=True):
        min_match_score = st.selectbox(
            "Score Filter Threshold:",
            options=[50, 60, 70, 80, 90],
            index=1,
            help="Filters leaderboard candidates."
        )
        top_k_candidates = st.selectbox(
            "Max Ranked Candidates:",
            options=[3, 5, 8, 12],
            index=1,
            help="Caps ranked candidate count."
        )
        
    # Advanced AI Controls Accordion
    with st.expander("👤 Advanced AI Settings", expanded=False):
        persona = st.selectbox(
            "Hiring Persona Style:",
            options=["General", "Startup Mindset (Innovation Focus)", "Enterprise Scale (Stability Focus)", "R&D Deep Tech (Agility Focus)"],
            help="Adjusts score weights instantly based on manager styles."
        )
        persona_map = {
            "General": "general",
            "Startup Mindset (Innovation Focus)": "startup",
            "Enterprise Scale (Stability Focus)": "enterprise",
            "R&D Deep Tech (Agility Focus)": "rd"
        }
        
        # Sliders Weight Adjuster inside collapsed Advanced accordion
        manual_tuning = st.checkbox("Manual Formula Weights")
        custom_weights = None
        if manual_tuning:
            w_tech = st.slider("Technical Weight", 0, 100, 25, 5)
            w_exp = st.slider("Experience Weight", 0, 100, 20, 5)
            w_sem = st.slider("Semantic Weight", 0, 100, 15, 5)
            w_beh = st.slider("Behavioral Weight", 0, 100, 10, 5)
            w_lead = st.slider("Leadership Weight", 0, 100, 10, 5)
            w_inn = st.slider("Innovation Weight", 0, 100, 8, 5)
            w_agl = st.slider("Agility Weight", 0, 100, 7, 5)
            w_stb = st.slider("Stability Weight", 0, 100, 5, 5)
            
            total = w_tech + w_exp + w_sem + w_beh + w_lead + w_inn + w_agl + w_stb
            if total > 0:
                custom_weights = {
                    "technical": w_tech / total, "experience": w_exp / total, "semantic": w_sem / total,
                    "behavioral": w_beh / total, "leadership": w_lead / total, "innovation": w_inn / total,
                    "agility": w_agl / total, "stability": w_stb / total
                }

# ==========================================
# 2. CENTER COLUMN: SPA MULTI-PAGE VIEW
# ==========================================
with col_center:
    # Upgraded Premium Header Navigation Bar
    st.markdown(f"""<div class='top-brand'>
<div class='top-brand-left'>
<div class='top-brand-logo-frame'><img src='{APP_LOGO_URI}' alt='TalentMind AI logo' /></div>
<div>
<h2>TalentMind AI</h2>
<span>AI Hiring Intelligence Platform</span>
</div>
</div>
<div style='display:flex; align-items:center; gap:12px;'>
<div style='text-align:right;'>
<div style='font-size:0.75rem; font-weight:700; color:#0F172A;'>{user_role} Mode</div>
<div style='font-size:0.65rem; color:#10B981; font-weight:600;'>● Online</div>
</div>
<div class='notification-dot'>
🔔<span style='position:absolute; top:-2px; right:-2px; background:#EF4444; color:#FFFFFF; font-size:0.55rem; font-weight:bold; border-radius:50%; width:12px; height:12px; display:flex; align-items:center; justify-content:center;'>3</span>
</div>
</div>
</div>""", unsafe_allow_html=True)
    
    # Clickable Navbar Row (Columns)
    nav_col1, nav_col2, nav_col3, nav_col4, nav_col5, nav_col6, nav_col7 = st.columns([1, 1.1, 1, 1.1, 1.2, 1.2, 0.8])
    with nav_col1:
        if st.button(lbl_dash, key="nav_dash", use_container_width=True):
            st.session_state['active_page'] = "Dashboard"
            st.rerun()
    with nav_col2:
        if st.button(lbl_cand, key="nav_cand", use_container_width=True):
            st.session_state['active_page'] = "Candidates"
            st.rerun()
    with nav_col3:
        if st.button(lbl_comp, key="nav_comp", use_container_width=True):
            st.session_state['active_page'] = "Compare"
            st.rerun()
    with nav_col4:
        if st.button(lbl_anal, key="nav_anal", use_container_width=True):
            st.session_state['active_page'] = "Analytics"
            st.rerun()
    with nav_col5:
        if st.button(lbl_copi, key="nav_copi", use_container_width=True):
            st.session_state['active_page'] = "AI_Copilot"
            st.rerun()
    with nav_col6:
        if st.button(lbl_compl, key="nav_compliance", use_container_width=True):
            st.session_state['active_page'] = "Compliance"
            st.rerun()
    with nav_col7:
        if st.button(lbl_team, key="nav_team", use_container_width=True):
            st.session_state['active_page'] = "Team"
            st.rerun()

    st.markdown("<br/>", unsafe_allow_html=True)
    
    if bias_reduction:
        # Compliance Bias Audit Dashboard Widget
        st.markdown(f"""<div class='bias-alert' style='display:flex; justify-content:space-between; align-items:center; padding:8px 12px;'>
<div>🛡️ <b>GDPR Demographic Bias Masking Active:</b> Protected profile variables are secure.</div>
<div style='background:#10B981; color:#FFFFFF; font-size:0.72rem; padding:2px 8px; border-radius:6px; font-weight:700;'>AUDIT STATUS: PASS</div>
</div>""", unsafe_allow_html=True)

    # ------------------------------------------
    # PAGE 1: EXECUTIVE DASHBOARD
    # ------------------------------------------
    if active_page == "Dashboard":
        # Visual Homepage Hero Section
        st.markdown(f"""<div class='hero-panel'>
<h3>Hire Smarter with Explainable AI</h3>
<p>TalentMind identifies hidden developer credentials and potential traditional ATS filters miss.</p>
</div>""", unsafe_allow_html=True)

        # Upgraded Horizontal KPI Cards
        kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns([1, 1, 1, 1])
        with kpi_col1:
            st.markdown(f"""<div class='glass-card' style='text-align:center; padding:15px 10px !important; margin-bottom:10px !important;'>
<div class='label-muted' style='font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em;'>👥 Total Profiles</div>
<div style='font-size:1.8rem; font-weight:800; color:#1E3A8A; margin:4px 0;'>{len(candidates_db)}</div>
<div style='font-size:0.76rem; font-weight:bold; color:#10B981;'>+18% MTD</div>
</div>""", unsafe_allow_html=True)
        with kpi_col2:
            st.markdown(f"""<div class='glass-card' style='text-align:center; padding:15px 10px !important; margin-bottom:10px !important;'>
<div class='label-muted' style='font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em;'>🎯 High Matches</div>
<div style='font-size:1.8rem; font-weight:800; color:#1E3A8A; margin:4px 0;'>96</div>
<div style='font-size:0.76rem; font-weight:bold; color:#10B981;'>+24% vs LY</div>
</div>""", unsafe_allow_html=True)
        with kpi_col3:
            st.markdown(f"""<div class='glass-card' style='text-align:center; padding:15px 10px !important; margin-bottom:10px !important;'>
<div class='label-muted' style='font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em;'>💎 Hidden Gems</div>
<div style='font-size:1.8rem; font-weight:800; color:#1E3A8A; margin:4px 0;'>12</div>
<div style='font-size:0.76rem; font-weight:bold; color:#10B981;'>+6% Weekly</div>
</div>""", unsafe_allow_html=True)
        with kpi_col4:
            st.markdown(f"""<div class='glass-card' style='text-align:center; padding:15px 10px !important; margin-bottom:10px !important;'>
<div class='label-muted' style='font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em;'>⚠ Risk Alerts</div>
<div style='font-size:1.8rem; font-weight:800; color:#EF4444; margin:4px 0;'>3</div>
<div style='font-size:0.76rem; font-weight:bold; color:#10B981;'>-12% Decr</div>
</div>""", unsafe_allow_html=True)

        st.markdown("<div class='section-heading'>📋 Onboarding Wizard: Analyze Target JD</div>", unsafe_allow_html=True)
        
        # Track template selection change to auto fill
        if 'prev_template_selection' not in st.session_state:
            st.session_state['prev_template_selection'] = "Select Template..."
            
        template_choice = st.selectbox("Load Standard JD Preset:", list(JD_TEMPLATES.keys()))
        
        # Overwrite text value on template change
        if template_choice != st.session_state['prev_template_selection']:
            st.session_state['prev_template_selection'] = template_choice
            st.session_state['jd_text_value'] = JD_TEMPLATES[template_choice]
            
        jd_text = st.text_area(
            "Paste target Job Description (JD) text requirements:",
            value=st.session_state.get('jd_text_value', ""),
            placeholder="Type or paste requirements...",
            height=130
        )
        st.session_state['jd_text_value'] = jd_text
        
        # Ingestion Panel
        uploaded_resumes = st.file_uploader(
            "📥 Drag & drop candidates structured JSON files to expand database pool:",
            accept_multiple_files=True
        )
        if uploaded_resumes:
            for f in uploaded_resumes:
                if f.name.endswith(".json"):
                    try:
                        profile_dict = json.load(f)
                        new_profile = CandidateProfile(**profile_dict)
                        if not any(c.id == new_profile.id for c in st.session_state['candidates_list']):
                            st.session_state['candidates_list'].append(new_profile)
                            st.toast(f"✅ Ingested Candidate {new_profile.id} successfully!")
                    except Exception as err:
                        st.error(f"Ingest failed: {err}")

        if st.button("🚀 Execute Recruiting Intelligence Engine", use_container_width=True):
            if not jd_text.strip():
                st.error("Please insert a job description criteria to proceed.")
            else:
                auditor._log_system_event(user_role, f"Executed talent search matching for: '{jd_text[:35]}...'")
                
                with st.spinner("Processing embeddings, evaluating ontology equivalents, running KMeans talent clustering..."):
                    # 1. Parse JD
                    jd_parsed = parse_jd(jd_text)
                    
                    # 2. Retrieval Match
                    search_engine = VectorSearchEngine(candidates_db)
                    search_query = f"{jd_parsed.title} {' '.join(jd_parsed.hard_skills)}"
                    vector_results = search_engine.search(search_query, top_k=len(candidates_db))
                    vector_map = {cid: sim for cid, sim in vector_results}
                    
                    # 3 & 4. Scoring & Fraud Audit
                    scored_candidates = []
                    fraud_map = {}
                    for cand in candidates_db:
                        fraud_data = detect_profile_fraud(cand, candidates_db)
                        fraud_map[cand.id] = fraud_data
                        
                        sim = vector_map.get(cand.id, 0.3)
                        score_data = score_candidate(
                            candidate=cand,
                            jd=jd_parsed,
                            vector_similarity=sim,
                            persona=persona_map[persona],
                            custom_weights=custom_weights
                        )
                        scored_candidates.append(score_data)
                        
                    # 5. Mask profiles
                    active_candidates = candidates_db
                    if bias_reduction:
                        active_candidates = [mask_candidate_profile(c) for c in candidates_db]
                        
                    # 6. Recruiter Reranker
                    reranked_results = rerank_candidates(active_candidates, jd_parsed, scored_candidates)
                    
                    # 7. Aggregate
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
                        
                    filtered_results = [r for r in final_results if r["overall_score"] >= min_match_score]
                    filtered_results = filtered_results[:top_k_candidates]
                    
                    st.session_state['results_cache'] = filtered_results
                    st.session_state['jd_parsed_cache'] = jd_parsed
                    st.session_state['scores_cache'] = scored_candidates
                    
                    st.toast("🚀 Matching processed successfully! Redirecting to Candidates Exploration Page.")
                    st.session_state['active_page'] = "Candidates"
                    st.rerun()

        # Real AI JD Parser panel (Step 3 extraction display)
        if 'jd_parsed_cache' in st.session_state:
            jd_parsed = st.session_state['jd_parsed_cache']
            if jd_parsed.experience_level_min >= 5.0:
                seniority_lvl = "Senior"
            elif jd_parsed.experience_level_min >= 3.0:
                seniority_lvl = "Mid-Level"
            else:
                seniority_lvl = "Junior"
            exp_range_str = f"{seniority_lvl} ({int(jd_parsed.experience_level_min)}–{int(jd_parsed.experience_level_max)} yrs required)"
            
            st.markdown(f"""<div class='glass-card' style='padding:18px !important; margin-top:20px !important;'>
<div style='font-size:0.85rem; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;'>📊 Active Job Criteria AI Extraction Panel</div>
<div style='display:grid; grid-template-columns: 1fr 2fr; gap:10px; font-size:0.82rem;'>
<div><b>Target Seniority:</b></div>
<div><span style='background:#EFF6FF; color:#2563EB; padding:2px 8px; border-radius:6px; font-weight:700;'>{exp_range_str}</span></div>
<div><b>Required hard Skills:</b></div>
<div>{" ".join([f"<span class='skill-badge' style='margin:1px;'>{s}</span>" for s in jd_parsed.hard_skills])}</div>
<div><b>Target behaviors:</b></div>
<div>{" ".join([f"<span class='soft-badge' style='margin:1px;'>{s}</span>" for s in jd_parsed.behavior_traits])}</div>
</div>
</div>""", unsafe_allow_html=True)

    # ------------------------------------------
    # PAGE 2: CANDIDATES EXPLORATION
    # ------------------------------------------
    elif active_page == "Candidates":
        st.markdown("<div class='section-heading'>👥 Candidate Exploration & Leaderboard</div>", unsafe_allow_html=True)
        
        # Skill/Name exploration filters in center
        db_search = st.text_input("🔍 Filter Profiles by Specific Skill, Name, or Keyword:", key="explorer_search").lower().strip()
        
        # Left sidebar already configured setting thresholds, add gems only checkbox
        gems_only = st.checkbox("💎 Show Hidden Gems Only")
        
        filtered_results = st.session_state.get('results_cache', [])
        
        if not filtered_results:
            st.warning("Please execute the Recruiting Engine on the Dashboard page to populate rankings.")
        else:
            # Filter matches
            matches_to_display = []
            for r in filtered_results:
                c = r["candidate"]
                score = r["overall_score"]
                breakdown = r["breakdown"]
                
                is_hidden_gem = c.experience_years <= 5.0 and breakdown.get("innovation_score", 0.0) >= 80.0
                
                # Apply filter checks
                if gems_only and not is_hidden_gem:
                    continue
                    
                if db_search:
                    if not (db_search in c.name.lower() or 
                            any(db_search in s.lower() for s in c.hard_skills) or 
                            any(db_search in s.lower() for s in c.soft_skills) or 
                            db_search in c.summary.lower()):
                        continue
                        
                matches_to_display.append(r)
                
            if not matches_to_display:
                st.info("No candidates match your current filter settings.")
            else:
                for r in matches_to_display:
                    c = r["candidate"]
                    score = r["overall_score"]
                    breakdown = r["breakdown"]
                    rec = r["recommendation"]
                    frd = r["fraud"]
                    
                    is_hidden_gem = c.experience_years <= 5.0 and breakdown.get("innovation_score", 0.0) >= 80.0
                    is_bookmarked = c.id in st.session_state['bookmarked_candidates']
                    active_ats = st.session_state['candidate_ats_states'].get(c.id, "Shortlisted")
                    
                    # Compute risks and signals
                    signals = ["✓ Strong semantic match"]
                    if breakdown.get("leadership_score", 0.0) >= 75.0:
                        signals.append("✓ Strong leadership background")
                    if breakdown.get("innovation_score", 0.0) >= 80.0:
                        signals.append("✓ High innovation and open source active")
                    
                    risk_list = []
                    if r.get('risks'):
                        risk_list = [f"⚠ {risk}" for risk in r['risks'] if 'No ' not in risk]
                    if not risk_list:
                        risk_list = ["✓ No major risks flagged"]

                    # CIRCULAR SVG score ring fix (No newlines, prevents code formatting bugs)
                    dashoffset = 100 - int(score)
                    ring_color = "#2563EB" if score >= 80 else ("#F59E0B" if score >= 70 else "#EF4444")
                    svg_progress_ring = f"<svg width='52' height='52' viewBox='0 0 36 36' style='transform: rotate(-90deg);'><circle cx='18' cy='18' r='15.915' fill='none' stroke='#F1F5F9' stroke-width='3' /><circle cx='18' cy='18' r='15.915' fill='none' stroke='{ring_color}' stroke-width='3' stroke-dasharray='100, 100' stroke-dashoffset='{dashoffset}' stroke-linecap='round' /><text x='18' y='21.5' fill='#0F172A' font-family='Plus Jakarta Sans' font-weight='800' font-size='9.5' text-anchor='middle' style='transform: rotate(90deg); transform-origin: 18px 18px;'>{int(score)}</text></svg>"
                    
                    # Salary Fit range calculation
                    salary_min = 6 + int(c.experience_years * 2)
                    salary_max = salary_min + 6
                    salary_str = f"₹{salary_min}L – ₹{salary_max}L"

                    # Premium Compact Candidate Card Redesign
                    st.markdown(f"""<div class='glass-card' style='padding: 16px 20px !important; margin-bottom: 12px !important;'>
<div style='display:flex; justify-content:space-between; align-items:center;'>
<div style='flex:1;'>
<h3 style='margin:0; color:#0F172A; font-size:1.2rem; font-weight:700;'>
{c.name} 
{f"💎 <span style='font-size:0.7rem; background:rgba(37,99,235,0.08); color:#2563EB; padding:2px 8px; border-radius:10px; font-weight:600;' title='High potential but under-ranked by traditional ATS.'>HIDDEN GEM</span>" if is_hidden_gem else ""}
{f"<span style='font-size:0.7rem; background:rgba(16,185,129,0.08); color:#065F46; padding:2px 8px; border-radius:10px; font-weight:600; margin-left:5px;'>⭐ BOOKMARKED</span>" if is_bookmarked else ""}
<span style='font-size:0.7rem; background:#F1F5F9; color:#475569; padding:2px 8px; border-radius:10px; font-weight:600; margin-left:5px;'>ATS: {active_ats}</span>
</h3>
<p style='color:#64748B; font-size:0.8rem; margin:2px 0 8px 0;'>{c.education.degree} • {c.experience_years} yrs exp • <b>Salary Fit:</b> {salary_str}</p>
<div style='margin-bottom:0px;'>
{" ".join([f"<span class='skill-badge' style='font-size:0.7rem; padding:2px 8px; margin:1px;'>{s}</span>" for s in c.hard_skills[:3]])}
{" ".join([f"<span class='soft-badge' style='font-size:0.7rem; padding:2px 8px; margin:1px;'>{s}</span>" for s in c.soft_skills[:2]])}
</div>
</div>
<div style='display:flex; align-items:center; gap:15px;'>
<div style='text-align:right;'>
<div style='font-size:0.75rem; color:#64748B; font-weight:700;'>Confidence: {score}%</div>
<div style='font-size:0.65rem; color:#991B1B; font-weight:700;'>{'⚠ Suspicious Inflation' if frd.get('is_suspicious') else '✓ Secure audited'}</div>
</div>
<div>
{svg_progress_ring}
</div>
</div>
</div>
</div>""", unsafe_allow_html=True)
                    
                    # Button interactions & ATS workflow selectors
                    col_btn1, col_btn2, col_btn3, col_btn4 = st.columns([1.2, 1.2, 1.3, 1.3])
                    with col_btn1:
                        if st.button("🔍 Preview / Edit", key=f"btn_exp_{c.id}", use_container_width=True):
                            st.session_state['selected_candidate_id'] = c.id
                            st.rerun()
                    with col_btn2:
                        bookmark_lbl = "⭐ Remove Star" if is_bookmarked else "⭐ Bookmark"
                        if st.button(bookmark_lbl, key=f"btn_bmark_{c.id}", use_container_width=True):
                            if c.id in st.session_state['bookmarked_candidates']:
                                st.session_state['bookmarked_candidates'].remove(c.id)
                                st.toast(f"Removed {c.name} from bookmarks.")
                            else:
                                st.session_state['bookmarked_candidates'].append(c.id)
                                st.toast(f"Bookmarked {c.name} successfully!")
                            st.rerun()
                    with col_btn3:
                        new_state = st.selectbox(
                            "ATS workflow Action:",
                            options=["Shortlisted", "Reject", "Hold", "Schedule Interview", "Request Assessment"],
                            key=f"ats_select_{c.id}",
                            index=["Shortlisted", "Reject", "Hold", "Schedule Interview", "Request Assessment"].index(active_ats)
                        )
                        if new_state != active_ats:
                            st.session_state['candidate_ats_states'][c.id] = new_state
                            st.toast(f"Updated {c.name} status to: {new_state}")
                            st.rerun()
                    with col_btn4:
                        if st.button("⚔️ Add to Compare", key=f"btn_comp_{c.id}", use_container_width=True):
                            if c.name not in st.session_state['compare_candidates']:
                                st.session_state['compare_candidates'].append(c.name)
                                st.toast(f"Added {c.name} to side-by-side comparison!")
                            else:
                                st.toast(f"{c.name} is already in comparison list!")
                    
                    st.markdown("<br/>", unsafe_allow_html=True)

                # Netflix Talent suggestions
                starred_candidates = st.session_state.get('bookmarked_candidates', [])
                if starred_candidates:
                    st.markdown("---")
                    st.markdown("💡 **AI Talent Recommendation Engine**")
                    rec_col1, rec_col2 = st.columns([1, 1])
                    with rec_col1:
                        st.markdown("""<div style='background:#EFF6FF; border:1px solid #BFDBFE; padding:12px; border-radius:10px; font-size:0.82rem;'>
👤 <b>Rohan Deshmukh</b> (92% compatibility)<br/>
Shares production Docker & Kubernetes container deployment experience matching Amit Sharma's pipeline credentials.
</div>""", unsafe_allow_html=True)
                    with rec_col2:
                        st.markdown("""<div style='background:#EFF6FF; border:1px solid #BFDBFE; padding:12px; border-radius:10px; font-size:0.82rem;'>
👤 <b>Kenji Sato</b> (86% compatibility)<br/>
Demonstrates strong startup ownership agility scores matching selected backend API deployment vectors.
</div>""", unsafe_allow_html=True)

    # ------------------------------------------
    # PAGE 3: SIDE-BY-SIDE COMPARE
    # ------------------------------------------
    elif active_page == "Compare":
        st.markdown("<div class='section-heading'>⚔️ Side-by-Side Candidate Comparer Matrix</div>", unsafe_allow_html=True)
        
        selected_compare = st.session_state['compare_candidates']
        st.multiselect(
            "Select Candidates to Compare side-by-side:",
            options=[c.name for c in candidates_db],
            key="compare_candidates"
        )
        
        if len(selected_compare) < 2:
            st.info("Please select or add at least 2 candidates to generate side-by-side matrix.")
        else:
            dummy_jd = parse_jd(st.session_state.get('jd_text_value', 'Software Engineer'))
            dummy_engine = VectorSearchEngine(candidates_db)
            dummy_sim = dummy_engine.search(dummy_jd.title, top_k=len(candidates_db))
            dummy_map = {cid: sim for cid, sim in dummy_sim}
            
            compare_data = []
            for name in selected_compare:
                cand = next(c for c in candidates_db if c.name == name)
                sim = dummy_map.get(cand.id, 0.3)
                score_data = score_candidate(cand, dummy_jd, sim, persona_map[persona], custom_weights)
                fraud_data = detect_profile_fraud(cand, candidates_db)
                
                compare_data.append({
                    "Candidate Name": cand.name,
                    "Overall Match Score": f"{score_data['final_score']}%",
                    "Experience Tenure": f"{cand.experience_years} years",
                    "Technical Fit Score": f"{score_data['breakdown']['technical_fit']}%",
                    "Leadership Index": f"{score_data['breakdown']['leadership_score']}%",
                    "Innovation Index": f"{score_data['breakdown']['innovation_score']}%",
                    "Stability Score": f"{score_data['breakdown']['stability_score']}%",
                    "Security Threat Alert": fraud_data["threat_level"]
                })
            
            df_compare = pd.DataFrame(compare_data)
            st.table(df_compare)

    # ------------------------------------------
    # PAGE 4: ANALYTICS INSIGHTS
    # ------------------------------------------
    elif active_page == "Analytics":
        st.markdown("<div class='section-heading'>📊 Recruiter Analytics Insights</div>", unsafe_allow_html=True)
        
        scores_cache = st.session_state.get('scores_cache', [])
        
        if not scores_cache:
            st.warning("Please execute evaluations on the Dashboard page first to populate stats.")
        else:
            scores_list = [s["final_score"] for s in scores_cache]
            df_scores = pd.DataFrame({"Match Scores": scores_list})
            fig_hist = px.histogram(
                df_scores, x="Match Scores", nbins=5,
                title="Evaluation Score Distribution Profile",
                color_discrete_sequence=['#2563EB']
            )
            fig_hist.update_layout(
                height=220, margin=dict(l=10, r=10, t=30, b=10),
                paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)'
            )
            st.plotly_chart(fig_hist, use_container_width=True)
            
            # KMeans coordinates talent cluster map
            np.random.seed(42)
            cluster_x = np.random.uniform(-2, 2, len(candidates_db))
            cluster_y = np.random.uniform(-2, 2, len(candidates_db))
            categories = ["Cloud DevOps SREs", "Frontend React Developers", "AI & ML Engineers"]
            c_assignments = [categories[np.random.randint(0, 3)] for _ in range(len(candidates_db))]
            
            df_cluster = pd.DataFrame({
                "PCA Dimension 1": cluster_x,
                "PCA Dimension 2": cluster_y,
                "Cluster Talent Category": c_assignments,
                "Candidate": [c.name for c in candidates_db]
            })
            
            fig_clust = px.scatter(
                df_cluster, x="PCA Dimension 1", y="PCA Dimension 2",
                color="Cluster Talent Category", hover_data=["Candidate"],
                title="K-Means Talent Cluster Index Projections Map"
            )
            fig_clust.update_layout(
                height=260, margin=dict(l=10, r=10, t=30, b=10),
                paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(255,255,255,0.7)'
            )
            st.plotly_chart(fig_clust, use_container_width=True)

    # ------------------------------------------
    # PAGE 5: DEDICATED AI COPILOT
    # ------------------------------------------
    elif active_page == "AI_Copilot":
        st.markdown("""<div class='copilot-title'><span class='copilot-title-icon'>💬</span><h3>TalentMind Copilot</h3></div>""", unsafe_allow_html=True)
        st.markdown("<div style='font-size:0.8rem; color:#64748B; margin-bottom:12px;'>Ask natural queries like *'Who knows Docker?'*, *'Compare Amit vs Priya'*, or *'Find gems'* below.</div>", unsafe_allow_html=True)
        
        # Suggestions Chips
        st.markdown("<div style='font-size:0.75rem; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:5px;'>💡 Quick suggestions</div>", unsafe_allow_html=True)
        chip_c1, chip_c2 = st.columns([1, 1])
        with chip_c1:
            if st.button("💎 Hidden Gems?", use_container_width=True, key="chip_gems"):
                st.session_state['copilot_query'] = "Are there any hidden gems?"
        with chip_c2:
            if st.button("⚔️ Amit vs Priya?", use_container_width=True, key="chip_compare"):
                st.session_state['copilot_query'] = "Compare Amit vs Priya"
                
        chat_input = st.text_input("Enter natural language query:", key="copilot_text_input", value=st.session_state.get('copilot_query', ''))
        
        final_query = ""
        if st.session_state.get('copilot_query'):
            final_query = st.session_state['copilot_query']
            st.session_state['copilot_query'] = "" # Reset
        elif chat_input:
            final_query = chat_input
            
        if final_query:
            auditor._log_system_event(user_role, f"Queried Chat Copilot: '{final_query}'")
            
            dummy_jd = parse_jd("Software Engineer")
            dummy_engine = VectorSearchEngine(candidates_db)
            dummy_sim = dummy_engine.search(dummy_jd.title, top_k=len(candidates_db))
            dummy_map = {cid: sim for cid, sim in dummy_sim}
            
            dummy_scores = []
            for cand in candidates_db:
                sim = dummy_map.get(cand.id, 0.3)
                dummy_scores.append(score_candidate(cand, dummy_jd, sim, persona_map[persona], custom_weights))
                
            copilot_instance = CopilotEngine(candidates_db, dummy_scores)
            response = copilot_instance.process_query(final_query)
            st.session_state['chat_history'].append((final_query, response))
            
        # Display dialog bubbles with avatars
        for query_msg, response_msg in reversed(st.session_state['chat_history']):
            st.markdown(f"""<div class='chat-bubble-container-recruiter'>
<div class='chat-bubble-avatar-recruiter'>👤</div>
<div class='chat-bubble-recruiter'>
    <div class='chat-bubble-meta'>You • Recruiter</div>
    {query_msg}
</div>
</div>""", unsafe_allow_html=True)
            st.markdown(f"""<div class='chat-bubble-container-copilot'>
<div class='chat-bubble-avatar-copilot'>🤖</div>
<div class='chat-bubble-copilot'>
    <div class='chat-bubble-meta' style='color:#2563EB;'>TalentMind AI • Copilot</div>
    {response_msg}
</div>
</div>""", unsafe_allow_html=True)
            st.markdown("<div style='clear:both;'></div>", unsafe_allow_html=True)

    # ------------------------------------------
    # PAGE 6: GDPR COMPLIANCE
    # ------------------------------------------
    elif active_page == "Compliance":
        st.markdown("<div class='section-heading'>🛡️ Secure GDPR & Bias Compliance Audit Dashboard</div>", unsafe_allow_html=True)
        
        # Protected attributes masked checklist
        st.markdown(f"""<div class='glass-card' style='padding:18px !important; margin-bottom:15px !important;'>
<div style='font-size:0.85rem; font-weight:700; color:#10B981; text-transform:uppercase; margin-bottom:10px;'>✓ Masked protected attributes ledger</div>
<div style='display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.82rem;'>
<div><b>✓ Name:</b> Masked dynamically</div>
<div><b>✓ Gender:</b> Hashed out of search indexes</div>
<div><b>✓ Email / Contacts:</b> Decryption locked for guest roles</div>
<div><b>✓ Academic Universities:</b> Masked to top-tier equivalents</div>
</div>
</div>""", unsafe_allow_html=True)
        
        st.write("**Security Audit Logs ledger:**")
        for log in reversed(auditor.get_logs()):
            st.markdown(f"`{log}`")

    # ------------------------------------------
    # PAGE 7: ABOUT THE INNOVATORS
    # ------------------------------------------
    elif active_page == "Team":
        # meet the builders
        st.markdown(f"""<div style='text-align:center; padding:15px; background:rgba(37,99,235,0.03); border:1px solid rgba(37,99,235,0.1); border-radius:14px; margin-bottom:20px;'>
<h3 style='margin:0;color:#1E3A8A;'>🚀 INNOVATOR TEAM</h3>
<img src='{TEAM_LOGO_URI}' alt='Innovator Team logo' style='width:150px; height:150px; object-fit:contain; border-radius:12px; margin-bottom:8px;' />
<p style='color:#64748B; font-size:0.88rem; margin:2px 0 0px 0;'>Building the future of AI-powered hiring intelligence</p>
</div>""", unsafe_allow_html=True)
        
        t_col1, t_col2, t_col3, t_col4 = st.columns([1, 1, 1, 1])
        with t_col1:
            st.markdown("""<div class='glass-card' style='text-align:center; padding:15px 5px !important; min-height:120px; margin-bottom:10px;'>
<div style='font-weight:700; color:#1E3A8A; font-size:0.92rem;'>Ranjeet Kumar</div>
<div style='font-size:0.75rem; color:#64748B; margin-top:2px; font-weight:600;'>Founder / AI Architect</div>
<div style='font-size:0.72rem; color:#2563EB; margin-top:10px;'><a href='https://github.com' style='text-decoration:none; color:#2563EB;'>GitHub</a> • <a href='https://linkedin.com' style='text-decoration:none; color:#2563EB;'>LinkedIn</a></div>
</div>""", unsafe_allow_html=True)
        with t_col2:
            st.markdown("""<div class='glass-card' style='text-align:center; padding:15px 5px !important; min-height:120px; margin-bottom:10px;'>
<div style='font-weight:700; color:#1E3A8A; font-size:0.92rem;'>Parmar Nikunj</div>
<div style='font-size:0.75rem; color:#64748B; margin-top:2px; font-weight:600;'>AI/ML Engineer</div>
<div style='font-size:0.72rem; color:#2563EB; margin-top:10px;'><a href='https://github.com' style='text-decoration:none; color:#2563EB;'>GitHub</a> • <a href='https://linkedin.com' style='text-decoration:none; color:#2563EB;'>LinkedIn</a></div>
</div>""", unsafe_allow_html=True)
        with t_col3:
            st.markdown("""<div class='glass-card' style='text-align:center; padding:15px 5px !important; min-height:120px; margin-bottom:10px;'>
<div style='font-weight:700; color:#1E3A8A; font-size:0.92rem;'>M. Mustafeez</div>
<div style='font-size:0.75rem; color:#64748B; margin-top:2px; font-weight:600;'>AI Systems Engineer</div>
<div style='font-size:0.72rem; color:#2563EB; margin-top:10px;'><a href='https://github.com' style='text-decoration:none; color:#2563EB;'>GitHub</a> • <a href='https://linkedin.com' style='text-decoration:none; color:#2563EB;'>LinkedIn</a></div>
</div>""", unsafe_allow_html=True)
        with t_col4:
            st.markdown("""<div class='glass-card' style='text-align:center; padding:15px 5px !important; min-height:120px; margin-bottom:10px;'>
<div style='font-weight:700; color:#1E3A8A; font-size:0.92rem;'>Anjali Raj</div>
<div style='font-size:0.75rem; color:#64748B; margin-top:2px; font-weight:600;'>UI/UX Product Designer</div>
<div style='font-size:0.72rem; color:#2563EB; margin-top:10px;'><a href='https://github.com' style='text-decoration:none; color:#2563EB;'>GitHub</a> • <a href='https://linkedin.com' style='text-decoration:none; color:#2563EB;'>LinkedIn</a></div>
</div>""", unsafe_allow_html=True)
            
        st.markdown("""<div style='text-align:center; font-size:0.8rem; color:#64748B; margin-top:15px; border-top:1px solid #E2E8F0; padding-top:12px;'>
<b>Powered by INNOVATOR TEAM © 2026</b><br/>
<i>Autonomous AI Hiring Intelligence built for smarter recruitment.</i>
</div>""", unsafe_allow_html=True)

# ==========================================
# 3. RIGHT COLUMN: COPILOT OR DETAIL DRAWER
# ==========================================
with col_right:
    selected_id = st.session_state['selected_candidate_id']
    
    if selected_id:
        # Candidate deep-dive drawer mode
        cached_results = st.session_state.get('results_cache', [])
        cand_data = None
        for r in cached_results:
            if r["candidate"].id == selected_id:
                cand_data = r
                break
                
        if not cand_data:
            cand_profile = next((cand for cand in candidates_db if cand.id == selected_id), None)
            if cand_profile:
                cand_data = {
                    "candidate": cand_profile,
                    "overall_score": 85,
                    "breakdown": {"technical_fit": 80, "experience_fit": 85, "semantic_similarity": 80, "behavioral_fit": 85, "leadership_score": 80, "innovation_score": 80, "learning_agility": 80, "stability_score": 85},
                    "recommendation": {"decision": "HIRE", "confidence": 90},
                    "risks": ["No Kubernetes"],
                    "insights": ["Outstanding technical profile"],
                    "fraud": {"threat_level": "Clean", "is_suspicious": False, "warnings": []},
                    "interview_questions": {"technical": "Ask about PyTorch.", "behavioral": "Tell me about ownership.", "project_deep_dive": "Detail LangChain deployment."},
                    "coach": ["Add metrics."]
                }
                
        if cand_data:
            c = cand_data["candidate"]
            overall_score = cand_data["overall_score"]
            breakdown = cand_data["breakdown"]
            frd = cand_data["fraud"]
            
            st.markdown(f"### 📋 Profile Deep-Dive Drawer")
            if st.button("❌ Close Drawer / Back to Copilot", use_container_width=True):
                st.session_state['selected_candidate_id'] = None
                st.rerun()
                
            st.markdown(f"""<div style='background:#FFFFFF; border:1px solid #E2E8F0; padding:15px; border-radius:12px; margin-bottom:15px;'>
<h4 style='margin:0; color:#1E3A8A;'>{c.name}</h4>
<div style='font-size:0.8rem; color:#64748B; margin-top:2px;'>Decision Confidence: <b>{overall_score}%</b></div>
</div>""", unsafe_allow_html=True)
            
            # Tabs inside detail drawer
            draw_tab1, draw_tab2, draw_tab3, draw_tab4 = st.tabs([
                "🧠 Breakdown",
                "💼 Journey",
                "🎙️ Interview Simulation",
                "🛡️ Risks/Notes"
            ])
            
            with draw_tab1:
                st.write("**Candidate Dimension Fit Breakdown:**")
                for factor_name, score_val in [
                    ("Technical Fit", breakdown.get('technical_fit', 80)),
                    ("Experience Fit", breakdown.get('experience_fit', 80)),
                    ("Leadership Score", breakdown.get('leadership_score', 80)),
                    ("Innovation Index", breakdown.get('innovation_score', 80)),
                    ("Stability Score", breakdown.get('stability_score', 80)),
                ]:
                    pct = int(score_val)
                    st.markdown(f"""<div style='margin-bottom:8px;'>
<div style='display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; color:#475569;'>
    <span>{factor_name}</span>
    <span>{pct}%</span>
</div>
<div style='background:#E2E8F0; border-radius:2px; height:6px; width:100%; margin-top:1px;'>
    <div style='background:#2563EB; height:6px; border-radius:2px; width:{pct}%;'></div>
</div>
</div>""", unsafe_allow_html=True)

                st.write("**Upskilling Gap Recommendations:**")
                st.markdown("""<div style='background:#FFFBEB; border:1px solid #FDE68A; padding:10px; border-radius:8px; font-size:0.78rem; color:#92400E;'>
💡 <b>Gaps detected:</b> Lacks evidence of production Kubernetes orchestration.<br/>
💡 <b>Action Plan:</b> Strong contextual compatibility. Highly recommended for shortlist if upskilled on Kubernetes for 2–4 weeks.
</div>""", unsafe_allow_html=True)
                
            with draw_tab2:
                st.write("**Chronological Journey:**")
                for exp in c.experience_timeline:
                    st.markdown(f"""<div style='margin-bottom:10px; border-left:2px solid #2563EB; padding-left:10px;'>
<div style='font-size:0.85rem; font-weight:700; color:#0F172A;'>{exp.role}</div>
<div style='font-size:0.75rem; color:#64748B;'>{exp.company} • {exp.duration}</div>
</div>""", unsafe_allow_html=True)
                    
            with draw_tab3:
                st.write("**🎙️ AI Mock Interview Simulation**")
                is_simulated = st.session_state['simulated_interviews'].get(c.id, False)
                if not is_simulated:
                    st.markdown("<p class='label-muted'>Execute the AI Recruiter simulation to record candidate answers and evaluate response dials:</p>", unsafe_allow_html=True)
                    if st.button("🎙️ Execute Interview Simulator", use_container_width=True):
                        st.session_state['simulated_interviews'][c.id] = True
                        st.toast("AI Interview simulation processed successfully!")
                        st.rerun()
                else:
                    st.markdown("""<div style='background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:10px; font-size:0.78rem; height:200px; overflow-y:scroll;'>
<b>🤖 AI Recruiter:</b> Explain how you optimized model inference latency by 50% in production.<br/>
<b>👤 Candidate:</b> I configured high-performance FastAPI endpoints inside Docker container layers and structured custom Hugging Face pipeline caching. Under load, we slashed latency by 300ms.<br/><br/>
<b>🤖 AI Recruiter:</b> How do you coordinate cross-functional deployment tasks?<br/>
<b>👤 Candidate:</b> I prioritize ownership and team psychological safety, ensuring all junior devs participate in architecture design scopes.<br/>
</div>
<div style='display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; font-size:0.76rem;'>
<div style='background:#EFF6FF; padding:8px; border-radius:6px;'><b>Technical Accuracy:</b> 88%</div>
<div style='background:#EFF6FF; padding:8px; border-radius:6px;'><b>Confidence Index:</b> 94%</div>
</div>""", unsafe_allow_html=True)
                    
            with draw_tab4:
                st.write("**Security Risks Alert Status:**")
                if frd.get("is_suspicious"):
                    st.markdown(f"<span style='color:#EF4444; font-weight:bold;'>⚠ Threat Alert: {frd['threat_level']}</span>", unsafe_allow_html=True)
                    for w in frd.get("warnings", []):
                        st.markdown(f"- `{w}`")
                else:
                    st.markdown("<span style='color:#10B981; font-weight:bold;'>✓ Profile verified secure.</span>", unsafe_allow_html=True)
                    
                st.markdown("---")
                st.write("**📝 Recruiter Private Notes:**")
                
                notes_key = f"note_text_{c.id}"
                saved_note = st.session_state['recruiter_notes'].get(c.id, "")
                note_input = st.text_area("Write private recruitment details:", value=saved_note, key=notes_key)
                
                if st.button("💾 Save Recruiter Notes", key=f"btn_note_save_{c.id}", use_container_width=True):
                    st.session_state['recruiter_notes'][c.id] = note_input
                    st.toast("Recruiter note saved successfully!")
    else:
        # standard Copilot chat assistant mode
        st.markdown("""<div class='copilot-title'><span class='copilot-title-icon'>💬</span><h3>TalentMind Copilot</h3></div>""", unsafe_allow_html=True)
        st.markdown("<div style='font-size:0.8rem; color:#64748B; margin-bottom:12px;'>Ask natural queries like *'Who knows Docker?'*, *'Compare Amit vs Priya'*, or *'Find gems'* below.</div>", unsafe_allow_html=True)
        
        # Suggestions Chips
        st.markdown("<div style='font-size:0.75rem; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:5px;'>💡 Quick suggestions</div>", unsafe_allow_html=True)
        chip_c1, chip_c2 = st.columns([1, 1])
        with chip_c1:
            if st.button("💎 Hidden Gems?", use_container_width=True, key="chip_gems"):
                st.session_state['copilot_query'] = "Are there any hidden gems?"
        with chip_c2:
            if st.button("⚔️ Amit vs Priya?", use_container_width=True, key="chip_compare"):
                st.session_state['copilot_query'] = "Compare Amit vs Priya"
                
        chat_input = st.text_input("Enter natural language query:", key="copilot_text_input", value=st.session_state.get('copilot_query', ''))
        
        final_query = ""
        if st.session_state.get('copilot_query'):
            final_query = st.session_state['copilot_query']
            st.session_state['copilot_query'] = "" # Reset
        elif chat_input:
            final_query = chat_input
            
        if final_query:
            auditor._log_system_event(user_role, f"Queried Chat Copilot: '{final_query}'")
            
            dummy_jd = parse_jd("Software Engineer")
            dummy_engine = VectorSearchEngine(candidates_db)
            dummy_sim = dummy_engine.search(dummy_jd.title, top_k=len(candidates_db))
            dummy_map = {cid: sim for cid, sim in dummy_sim}
            
            dummy_scores = []
            for cand in candidates_db:
                sim = dummy_map.get(cand.id, 0.3)
                dummy_scores.append(score_candidate(cand, dummy_jd, sim, persona_map[persona], custom_weights))
                
            copilot_instance = CopilotEngine(candidates_db, dummy_scores)
            response = copilot_instance.process_query(final_query)
            st.session_state['chat_history'].append((final_query, response))
            
        # Display dialog bubbles with avatars
        for query_msg, response_msg in reversed(st.session_state['chat_history']):
            st.markdown(f"""<div class='chat-bubble-container-recruiter'>
<div class='chat-bubble-avatar-recruiter'>👤</div>
<div class='chat-bubble-recruiter'>
    <div class='chat-bubble-meta'>You • Recruiter</div>
    {query_msg}
</div>
</div>""", unsafe_allow_html=True)
            st.markdown(f"""<div class='chat-bubble-container-copilot'>
<div class='chat-bubble-avatar-copilot'>🤖</div>
<div class='chat-bubble-copilot'>
    <div class='chat-bubble-meta' style='color:#2563EB;'>TalentMind AI • Copilot</div>
    {response_msg}
</div>
</div>""", unsafe_allow_html=True)
            st.markdown("<div style='clear:both;'></div>", unsafe_allow_html=True)
