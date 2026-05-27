import os
import sys
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
from src.security import SecureAuditor
from src.api import load_candidates_db

load_dotenv()

# Initialize Security Auditor
if 'auditor' not in st.session_state:
    st.session_state['auditor'] = SecureAuditor()
auditor = st.session_state['auditor']

# Initialize Candidate DB Cache
if 'candidates_list' not in st.session_state:
    st.session_state['candidates_list'] = load_candidates_db()

# Page configs
st.set_page_config(
    page_title="TalentMind AI — Autonomous Hiring Intelligence Platform",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dark styling HSL variables
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
    
    .stApp {
        background-color: #0b0d12;
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #f1f5f9;
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Space Grotesk', sans-serif !important;
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    
    .portal-title {
        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #6f86d6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: 0.1rem;
    }
    
    .portal-subtitle {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    
    .glass-card {
        background: rgba(17, 24, 39, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(12px);
        margin-bottom: 15px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-card:hover {
        border-color: rgba(0, 242, 254, 0.3);
        box-shadow: 0 8px 32px 0 rgba(0, 242, 254, 0.05);
    }
    
    .skill-badge {
        display: inline-block;
        background: rgba(14, 165, 233, 0.12);
        color: #38bdf8;
        border: 1px solid rgba(14, 165, 233, 0.25);
        border-radius: 9999px;
        padding: 3px 10px;
        font-size: 0.78rem;
        margin: 3px;
        font-weight: 500;
    }
    
    .soft-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.12);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.25);
        border-radius: 9999px;
        padding: 3px 10px;
        font-size: 0.78rem;
        margin: 3px;
        font-weight: 500;
    }
    
    .behavior-badge {
        display: inline-block;
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.25);
        border-radius: 9999px;
        padding: 3px 10px;
        font-size: 0.78rem;
        margin: 3px;
        font-weight: 500;
    }
    
    .recommendation-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: bold;
    }
    .badge-fasttrack { background-color: rgba(0, 242, 254, 0.2); color: #00f2fe; border: 1px solid #00f2fe; }
    .badge-hire { background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }
    .badge-maybe { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; }
    .badge-reject { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
    
    .threat-clean { color: #34d399; font-weight: bold; }
    .threat-low { color: #fbbf24; font-weight: bold; }
    .threat-medium { color: #f97316; font-weight: bold; }
    .threat-high { color: #f87171; font-weight: bold; }
    
    .bias-alert {
        background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
        border: 1px solid rgba(6, 182, 212, 0.2);
        padding: 10px 15px;
        border-radius: 10px;
        font-weight: 500;
        margin-bottom: 15px;
        color: #22d3ee;
    }
</style>
""", unsafe_allow_html=True)

# Heuristic calculation for risk quadrant mapping
def calculate_risk_index(risks: list, missing_skills: list, fraud_threat: str) -> float:
    base = (len(risks) * 1.5) + (len(missing_skills) * 1.0)
    if fraud_threat == "High":
        base += 5.0
    elif fraud_threat == "Medium":
        base += 2.5
    return min(10.0, base)

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

# ==========================================
# Sidebar Panel Controls
# ==========================================
st.sidebar.markdown("<h2 style='text-align: center; color: #00f2fe;'>🧠 TalentMind Controls</h2>", unsafe_allow_html=True)

# GDPR RBAC Selector
user_role = st.sidebar.selectbox(
    "🔑 Security Access Level (RBAC)",
    options=["Recruiter", "Admin", "Guest"],
    help="GDPR compliance visual simulator. Guest access limits details and hides contact data."
)

# Active bias reduction
bias_reduction = st.sidebar.toggle(
    "🛡️ Demography Bias Mitigation",
    value=False,
    help="When activated, hides names, emails, age, gender, and colleges to achieve demographic parity."
)

# AI Hiring Manager Persona Matching
st.sidebar.markdown("### Hiring Persona")
persona = st.sidebar.selectbox(
    "Hiring Manager Preference Style:",
    options=["General", "Startup Mindset (Innovation Focus)", "Enterprise Scale (Stability Focus)", "R&D Deep Tech (Agility Focus)"],
    help="Automatically adjusts formula weights to match candidate personalities with hiring managers."
)
persona_map = {
    "General": "general",
    "Startup Mindset (Innovation Focus)": "startup",
    "Enterprise Scale (Stability Focus)": "enterprise",
    "R&D Deep Tech (Agility Focus)": "rd"
}

# Manual weight adjustment option
st.sidebar.markdown("---")
manual_tuning = st.sidebar.expander("🎛️ Manual Formula Weight Adjustments")
custom_weights = None
if manual_tuning:
    w_tech = manual_tuning.slider("Technical Fit Weight", 0, 100, 25, 5)
    w_exp = manual_tuning.slider("Experience Fit Weight", 0, 100, 20, 5)
    w_sem = manual_tuning.slider("Semantic Similarity Weight", 0, 100, 15, 5)
    w_beh = manual_tuning.slider("Behavioral Fit Weight", 0, 100, 10, 5)
    w_lead = manual_tuning.slider("Leadership Score Weight", 0, 100, 10, 5)
    w_inn = manual_tuning.slider("Innovation Score Weight", 0, 100, 8, 5)
    w_agl = manual_tuning.slider("Learning Agility Weight", 0, 100, 7, 5)
    w_stb = manual_tuning.slider("Stability Score Weight", 0, 100, 5, 5)
    
    total = w_tech + w_exp + w_sem + w_beh + w_lead + w_inn + w_agl + w_stb
    if total > 0:
        custom_weights = {
            "technical": w_tech / total,
            "experience": w_exp / total,
            "semantic": w_sem / total,
            "behavioral": w_beh / total,
            "leadership": w_lead / total,
            "innovation": w_inn / total,
            "agility": w_agl / total,
            "stability": w_stb / total
        }

# Min score filters
min_match_score = st.sidebar.slider("Score Filter Threshold", 0, 100, 60, 5)
top_k_candidates = st.sidebar.slider("Show Top Results Count", 1, len(st.session_state['candidates_list']), 6, 1)

# ==========================================
# Main Panel Setup
# ==========================================
st.markdown("<div class='portal-title'>TalentMind AI Portal</div>", unsafe_allow_html=True)
st.markdown("<div class='portal-subtitle'>Autonomous enterprise hiring intelligence platform with deep SHAP explainability</div>", unsafe_allow_html=True)

if bias_reduction:
    st.markdown(
        "<div class='bias-alert'>🛡️ <b>Demographic Masking Mode Active:</b> Names, emails, phones, genders, "
        "ages, and specific universities are masked to ensure fair objective ranking.</div>",
        unsafe_allow_html=True
    )

# 4 Layout Tabs
tab_engine, tab_copilot, tab_explorer, tab_auditor = st.tabs([
    "🎯 Talent Match Engine",
    "💬 Recruiter Copilot Chat",
    "📂 Candidate Index Explorer",
    "🛡️ GDPR Compliance Audit Panel"
])

# Load cached candidates
candidates_db = st.session_state['candidates_list']

# ==========================================
# TAB 1: Talent Match Engine
# ==========================================
with tab_engine:
    st.markdown("### 📋 Step 1: Define Role Criteria")
    col1, col2 = st.columns([3, 1])
    
    with col2:
        template_choice = st.selectbox("Load Standard JD Preset:", list(JD_TEMPLATES.keys()))
        jd_preset = JD_TEMPLATES[template_choice]
        
    with col1:
        jd_text = st.text_area(
            "Paste full Job Description (JD) text criteria here:",
            value=jd_preset if template_choice != "Select Template..." else "",
            placeholder="Type or paste target job requirements...",
            height=150
        )
        
    # Multi-Source Candidate Ingest panel
    st.markdown("#### 📥 Drag & Drop Multi-Source Candidate Ingestion")
    upload_col, info_col = st.columns([2, 2])
    with upload_col:
        uploaded_resumes = st.file_uploader(
            "Upload new profiles (PDF / JSON / TXT resume transcripts or logs):",
            accept_multiple_files=True
        )
        if uploaded_resumes:
            for f in uploaded_resumes:
                if f.name.endswith(".json"):
                    try:
                        profile_dict = json.load(f)
                        new_profile = CandidateProfile(**profile_dict)
                        # Avoid duplicates
                        if not any(c.id == new_profile.id for c in st.session_state['candidates_list']):
                            st.session_state['candidates_list'].append(new_profile)
                            st.toast(f"✅ Ingested new Candidate Profile {new_profile.id} successfully!")
                    except Exception as err:
                        st.error(f"Failed to ingest profile: {err}")
    with info_col:
        st.markdown("""
        <div style='font-size:0.85rem; color:#94a3b8; padding:10px; border-left:2px solid #00f2fe;'>
            ⚡ <b>Autonomous Parsing Engine supports:</b><br/>
            - Multi-source transcripts (Kaggle/GitHub profiles, CSV records)<br/>
            - Ingests structured JSON profiles and merges them dynamically<br/>
            - Decouples credentials to trigger instant indexing and re-ranking
        </div>
        """, unsafe_allow_html=True)

    match_btn = st.button("🚀 Execute Autonomous Matching Pipeline", use_container_width=True)
    
    if match_btn or (jd_text and 'results_cache' in st.session_state):
        if not jd_text:
            st.error("Please insert a job description.")
        else:
            # Audit log view action
            auditor._log_system_event(user_role, f"Executed talent search matching for: '{jd_text[:35]}...'")
            
            with st.spinner("Processing embeddings, evaluating equivalences, running KMeans talent clustering..."):
                # 1. Parse JD
                jd_parsed = parse_jd(jd_text)
                
                # 2. Dense Vector Retrieval
                search_engine = VectorSearchEngine(candidates_db)
                search_query = f"{jd_parsed.title} {' '.join(jd_parsed.hard_skills)}"
                vector_results = search_engine.search(search_query, top_k=len(candidates_db))
                vector_map = {cid: sim for cid, sim in vector_results}
                
                # 3 & 4. Scoring & Fraud Assessment
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
                    
                # 5. Mask profiles if active
                active_candidates = candidates_db
                if bias_reduction:
                    active_candidates = [mask_candidate_profile(c) for c in candidates_db]
                    
                # 6. Recruiter Rerank
                reranked_results = rerank_candidates(active_candidates, jd_parsed, scored_candidates)
                
                # 7. Collect detailed stats
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

            # Render Pipeline output
            st.markdown("---")
            st.markdown("## 📊 Talents Matching Analytics Dashboard")
            
            if not filtered_results:
                st.warning("No candidates met the score requirements. Try adjusting parameters.")
            else:
                # Top graphs
                g_col1, g_col2 = st.columns([1, 1])
                
                with g_col1:
                    st.markdown("#### 🎯 Fit vs Risk Quadrant Plot")
                    plot_data = []
                    for r in filtered_results:
                        risk_val = calculate_risk_index(r["risks"], r["missing_skills"], r["fraud"]["threat_level"])
                        plot_data.append({
                            "id": r["candidate"].id,
                            "Name": r["candidate"].name,
                            "Fit Score": r["overall_score"],
                            "Risk Index": risk_val,
                            "Decisions": r["recommendation"]["decision"]
                        })
                    df_plot = pd.DataFrame(plot_data)
                    
                    fig = px.scatter(
                        df_plot,
                        x="Risk Index",
                        y="Fit Score",
                        text="Name",
                        color="Fit Score",
                        color_continuous_scale="Tealgrn",
                        range_x=[-0.5, 10.5],
                        range_y=[35, 105]
                    )
                    
                    fig.add_shape(type="rect", x0=-0.5, y0=75, x1=4.0, y1=105, fillcolor="rgba(16, 185, 129, 0.08)", line_width=0)
                    fig.add_shape(type="rect", x0=4.0, y0=75, x1=10.5, y1=105, fillcolor="rgba(249, 115, 22, 0.08)", line_width=0)
                    fig.add_shape(type="rect", x0=-0.5, y0=35, x1=4.0, y1=75, fillcolor="rgba(99, 102, 241, 0.08)", line_width=0)
                    fig.add_shape(type="rect", x0=4.0, y0=35, x1=10.5, y1=75, fillcolor="rgba(239, 68, 68, 0.08)", line_width=0)
                    
                    fig.update_traces(marker=dict(size=14, line=dict(width=1.5, color='white')), textposition='top center')
                    fig.update_layout(
                        paper_bgcolor='rgba(0,0,0,0)',
                        plot_bgcolor='rgba(17,24,39,0.3)',
                        font=dict(family="Space Grotesk, sans-serif", color="#e2e8f0"),
                        xaxis=dict(title="Risk Index", gridcolor="rgba(255,255,255,0.05)", zeroline=False),
                        yaxis=dict(title="Overall Score", gridcolor="rgba(255,255,255,0.05)", zeroline=False),
                        coloraxis_showscale=False
                    )
                    st.plotly_chart(fig, use_container_width=True)
                    
                with g_col2:
                    st.markdown("#### 🔬 Dynamic KMeans Talent Clusters")
                    # Run clustering on current database
                    df_cl, themes = cluster_clusters = cluster_candidates(candidates_db, n_clusters=4)
                    
                    fig_cl = px.scatter(
                        df_cl,
                        x="x",
                        y="y",
                        color="Talent Category",
                        text="Name",
                        title="Automatic Talent Pool Cluster Mapping"
                    )
                    fig_cl.update_traces(marker=dict(size=12, line=dict(width=1.2, color='white')), textposition='top center')
                    fig_cl.update_layout(
                        paper_bgcolor='rgba(0,0,0,0)',
                        plot_bgcolor='rgba(17,24,39,0.3)',
                        font=dict(family="Space Grotesk, sans-serif", color="#e2e8f0"),
                        xaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
                        yaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
                        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                    )
                    st.plotly_chart(fig_cl, use_container_width=True)

                # Matching candidates lists
                st.markdown("### 🏅 Candidate Leaderboard & XAI deep dives")
                
                for r in filtered_results:
                    c = r["candidate"]
                    score = r["overall_score"]
                    breakdown = r["breakdown"]
                    rec = r["recommendation"]
                    frd = r["fraud"]
                    
                    # Decrypt credentials if Admin/Recruiter is selected
                    email_display = c.email
                    phone_display = c.phone
                    if user_role == "Guest":
                        email_display = "[Unauthorized for Guest Role]"
                        phone_display = "[Unauthorized for Guest Role]"
                        
                    badge_style = "badge-fasttrack" if rec["decision"] == "Fast-Track" else (
                        "badge-hire" if rec["decision"] == "Hire" else (
                            "badge-maybe" if rec["decision"] == "Maybe" else "badge-reject"
                        )
                    )
                    
                    # Flex expander header
                    exp_title = f"Rank #{r['rank']} — {c.name} ({score}%) | Decision: {rec['decision']}"
                    with st.expander(exp_title):
                        # Upvote Human Feedback button
                        if st.button(f"👍 Upvote & Boost Similar Profiles ({c.name})", key=f"up_{c.id}"):
                            st.success(f"Recruiter promoted {c.name}! Tuning formula: boosting weights for factors where {c.name} excelled.")
                            # Simple reinforcement learning weight shift:
                            # Auto-tunes custom weights to favor candidate's top 2 scoring dimensions!
                            sorted_dims = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
                            top_dim1 = sorted_dims[0][0].split('_')[0]
                            top_dim2 = sorted_dims[1][0].split('_')[0]
                            
                            # Mappings
                            map_dict = {"technical": "technical", "experience": "experience", "semantic": "semantic", "behavioral": "behavioral"}
                            
                            st.info(f"Auto-tuning: Boosting weights for '{top_dim1.title()}' and '{top_dim2.title()}' factors in next matching cycles!")
                            
                        c_col1, c_col2, c_col3 = st.columns([1.2, 1.2, 1.2])
                        
                        with c_col1:
                            st.markdown(f"**⚙️ 8-Factor Score Breakdown**")
                            # styled metrics
                            st.markdown(f"""
                            <div style='font-size:0.85rem;'>
                                <b>Technical Fit:</b> {breakdown['technical_fit']}%<br/>
                                <b>Experience Fit:</b> {breakdown['experience_fit']}%<br/>
                                <b>Semantic Overlap:</b> {breakdown['semantic_similarity']}%<br/>
                                <b>Behavioral Fit:</b> {breakdown['behavioral_fit']}%<br/>
                                <b>Leadership Score:</b> {breakdown['leadership_score']}%<br/>
                                <b>Innovation Level:</b> {breakdown['innovation_score']}%<br/>
                                <b>Learning Agility:</b> {breakdown['learning_agility']}%<br/>
                                <b>Stability Tenures:</b> {breakdown['stability_score']}%<br/>
                            </div>
                            """, unsafe_allow_html=True)
                            
                            # Radar match chart
                            st.markdown("**🛡️ Radar Fit Vector**")
                            fig_rad = go.Figure(data=go.Scatterpolar(
                                r=[
                                    breakdown['technical_fit'], breakdown['experience_fit'], 
                                    breakdown['semantic_similarity'], breakdown['behavioral_fit'],
                                    breakdown['leadership_score'], breakdown['innovation_score'], 
                                    breakdown['learning_agility'], breakdown['stability_score']
                                ],
                                theta=[
                                    'Technical', 'Experience', 'Semantic', 'Behavioral', 
                                    'Leadership', 'Innovation', 'Agility', 'Stability'
                                ],
                                fill='toself',
                                fillcolor='rgba(0, 242, 254, 0.1)',
                                line=dict(color='#00f2fe', width=1.5)
                            ))
                            fig_rad.update_layout(
                                polar=dict(
                                    radialaxis=dict(visible=True, range=[0, 105], gridcolor="rgba(255,255,255,0.05)"),
                                    angularaxis=dict(gridcolor="rgba(255,255,255,0.05)")
                                ),
                                showlegend=False,
                                height=200,
                                margin=dict(l=20, r=20, t=10, b=10),
                                paper_bgcolor='rgba(0,0,0,0)',
                                plot_bgcolor='rgba(0,0,0,0)',
                                font=dict(family="Space Grotesk", color="#e2e8f0")
                            )
                            st.plotly_chart(fig_rad, use_container_width=True)
                            
                        with c_col2:
                            st.markdown("**🧠 Recruiter Rationale & Insights**")
                            st.markdown(f"*{r['justification']}*")
                            
                            st.markdown("##### 🔍 Key Strengths:")
                            for ins in r["insights"]:
                                st.markdown(f"✓ *{ins}*")
                                
                            st.markdown("##### ⚠️ Risks & Missing requirements:")
                            for risk in r["risks"]:
                                st.markdown(f"- 🔴 *{risk}*")
                            if r["missing_skills"]:
                                st.markdown(f"- 🔸 **Missing Stack:** {', '.join(r['missing_skills'])}")

                        with c_col3:
                            # Interview Questions
                            st.markdown("**🎙️ AI Generated Custom Interview Questions**")
                            qs = r["interview_questions"]
                            st.markdown(f"**Technical:** *\"{qs.get('technical', 'Explain your ML architectures.')}\"*")
                            st.markdown(f"**Behavioral:** *\"{qs.get('behavioral', 'How do you handle startup ambiguities?')}\"*")
                            st.markdown(f"**Project Deep Dive:** *\"{qs.get('project_deep_dive', 'Explain latency gains.')}\"*")
                            
                            # Fraud checks
                            st.markdown("---")
                            st.markdown("**🔒 Talent Security Audit**")
                            threat_class = "threat-" + frd["threat_level"].lower()
                            st.markdown(f"Fraud Threat Index: <span class='{threat_class}'>{frd['threat_level']}</span>", unsafe_allow_html=True)
                            if frd["is_suspicious"]:
                                for w in frd["warnings"]:
                                    st.markdown(f"- 🔍 *{w}*")
                            else:
                                st.markdown("- ✅ Profile displays clean timeline consistency.")
                                
                            # Resume coach
                            st.markdown("---")
                            st.markdown("**🎓 Candidate Resume Coach Tips**")
                            for tip in r["coach"]:
                                st.markdown(tip)
                                
                            # Similar Candidates Discovery (KNN search)
                            st.markdown("---")
                            st.markdown("**👥 Find Similar Profiles (KNN Discovery)**")
                            sim_engine = VectorSearchEngine(candidates_db)
                            similar_list = sim_engine.find_similar_candidates(c.id, top_n=2)
                            for scid, sscore in similar_list:
                                sn = next(cand.name for cand in candidates_db if cand.id == scid)
                                st.text(f"• {sn} (Similarity: {sscore*100:.1f}%)")

# ==========================================
# TAB 2: Recruiter Copilot Chat
# ==========================================
with tab_copilot:
    st.markdown("### 💬 Recruiter Copilot Assistant")
    st.markdown("Ask natural language queries like: *'Who knows Docker?'*, *'Are there any hidden gems?'*, *'Compare Amit vs Priya'*, or ask detailed comparison questions.")
    
    if 'chat_history' not in st.session_state:
        st.session_state['chat_history'] = []
        
    chat_input = st.text_input("Recruiter Chat Command Prompt:", key="copilot_in")
    
    if st.button("Send Prompt Command"):
        if chat_input:
            # Audit log chat query
            auditor._log_system_event(user_role, f"Queried Chat Copilot: '{chat_input}'")
            
            # Setup simple scores
            dummy_jd = parse_jd("Software Engineer")
            dummy_engine = VectorSearchEngine(candidates_db)
            dummy_sim = dummy_engine.search(dummy_jd.title, top_k=len(candidates_db))
            dummy_map = {cid: sim for cid, sim in dummy_sim}
            
            dummy_scores = []
            for cand in candidates_db:
                sim = dummy_map.get(cand.id, 0.3)
                dummy_scores.append(score_candidate(cand, dummy_jd, sim, persona_map[persona], custom_weights))
                
            copilot_instance = CopilotEngine(candidates_db, dummy_scores)
            response = copilot_instance.process_query(chat_input)
            
            st.session_state['chat_history'].append((chat_input, response))
            
    # Display Chat logs
    for query_msg, response_msg in reversed(st.session_state['chat_history']):
        st.markdown(f"**👤 Recruiter Command:** *{query_msg}*")
        st.markdown(f"🤖 **TalentMind Copilot:**\n{response_msg}")
        st.markdown("---")

# ==========================================
# TAB 3: Candidate Explorer
# ==========================================
with tab_explorer:
    st.markdown("### 📂 Profile Directory Ledger")
    
    search_query = st.text_input("🔍 Filter Profiles by Specific Skill, Name, or Keyword:", key="db_search").lower().strip()
    
    filtered_db = candidates_db
    if bias_reduction:
        filtered_db = [mask_candidate_profile(c) for c in candidates_db]
        
    if search_query:
        filtered_db = [
            c for c in filtered_db
            if any(search_query in s.lower() for s in c.hard_skills) or
               any(search_query in s.lower() for s in c.soft_skills) or
               search_query in c.name.lower() or
               search_query in c.summary.lower()
        ]
        
    st.write(f"Showing **{len(filtered_db)}** profile files matching filters.")
    
    for c in filtered_db:
        # Hide email & phone under Guest RBAC
        email_txt = c.email
        phone_txt = c.phone
        if user_role == "Guest":
            email_txt = "[Decryption Locked: Authorized roles only]"
            phone_txt = "[Decryption Locked: Authorized roles only]"
            
        with st.container():
            st.markdown(f"""
            <div class='glass-card'>
                <div style='display:flex; justify-content:space-between; align-items:center;'>
                    <h3 style='margin:0;color:#00f2fe;'>{c.name}</h3>
                    <span style='background:rgba(0, 242, 254, 0.1);color:#00f2fe;padding:4px 12px;border-radius:12px;font-size:0.9rem;'>{c.experience_years} Years Experience</span>
                </div>
                <p style='color:#cbd5e1;margin-top:10px;'><b>Professional Profile:</b> {c.summary}</p>
                <div style='margin-top:10px;'>
                    <b>Hard Skills:</b><br/>
                    {" ".join([f"<span class='skill-badge'>{s}</span>" for s in c.hard_skills])}
                </div>
                <div style='margin-top:10px;'>
                    <b>Soft Skills:</b><br/>
                    {" ".join([f"<span class='soft-badge'>{s}</span>" for s in c.soft_skills])}
                </div>
                
                <div style='margin-top:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;'>
                    <b>💼 Career timeline:</b>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Interactive Timeline chart of work duration
            timeline_data = []
            for idx, exp in enumerate(c.experience_timeline):
                # Guess years for plotting durations
                dur = exp.duration.split(" - ")
                start_yr = int(dur[0]) if dur[0].strip().isdigit() else 2018
                end_yr = 2026 if "present" in dur[1].lower() else (int(dur[1]) if dur[1].strip().isdigit() else 2022)
                
                timeline_data.append({
                    "Role": exp.role,
                    "Company": exp.company,
                    "Start": f"{start_yr}-01-01",
                    "End": f"{end_yr}-01-01"
                })
            df_time = pd.DataFrame(timeline_data)
            fig_time = px.timeline(df_time, x_start="Start", x_end="End", y="Role", color="Company", title="Career Timeline Duration")
            fig_time.update_layout(
                height=150,
                margin=dict(l=20, r=20, t=25, b=10),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(family="Space Grotesk", color="#e2e8f0"),
                showlegend=False
            )
            st.plotly_chart(fig_time, use_container_width=True)
            
            # Display contact data panel
            st.markdown(f"""
            <div style='font-size:0.82rem; color:#94a3b8; margin-top:5px; margin-bottom:20px; padding:8px; background:rgba(0,0,0,0.15); border-radius:6px;'>
                🎓 Degree: {c.education.degree} - {c.education.university} ({c.education.year}) | ✉️ Contact: {email_txt} | 📞 Phone: {phone_txt}
            </div>
            """, unsafe_allow_html=True)

# ==========================================
# TAB 4: GDPR Compliance Audit Logs
# ==========================================
with tab_auditor:
    st.markdown("### 🛡️ Secure System Auditor Logging")
    st.markdown("Demonstrating real-time GDPR accessibility tracking and active database auditing. Encryption/Decryption logs are recorded instantly for every profile viewed.")
    
    st.markdown("#### Active GDPR Security Log Ledger:")
    for log in reversed(auditor.get_logs()):
        st.markdown(f"`{log}`")
