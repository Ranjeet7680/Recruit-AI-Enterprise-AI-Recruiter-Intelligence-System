# RecruitAI — Enterprise AI Recruiter Intelligence System

Traditional Applicant Tracking Systems (ATS) fail because keyword stuffing bypasses evaluation, resumes hide actual capabilities, there is no behavioral or domain alignment understanding, and they offer zero explainability. 

**RecruitAI** (or **TalentMind AI**) is a modern, high-scoring hackathon solution designed to act like a senior human recruiter and expert AI analyst combined. It utilizes advanced Semantic Embedding Retrieval, a multi-factor Hybrid Scoring Engine, LLM-based parsing and reranking, and an Explainable AI Dashboard featuring demographic bias reduction.

## 🌐 Live Production Deployment
The application API and interactive landing page are live on Vercel:
- **Production URL**: [https://recruit-ai-enterprise-ai-recruiter.vercel.app](https://recruit-ai-enterprise-ai-recruiter.vercel.app)
- **Health Check Endpoint**: [https://recruit-ai-enterprise-ai-recruiter.vercel.app/api/health](https://recruit-ai-enterprise-ai-recruiter.vercel.app/api/health)

---

## 🚀 Key Features

1. **Bias Reduction System (Demographic Masking)**: Single-toggle masking of names, email, phone, age, and specific universities to ensure candidates are ranked strictly on skills, capabilities, and experience relevance.
2. **JD Intelligence Engine**: Extracts deep semantic intent from Job Descriptions (JDs), mapping hard skills, soft skills, behavioral traits (e.g., "startup ownership"), required experience ranges, and "must-have" vs. "good-to-have" qualifications.
3. **Candidate Intelligence Engine**: Constructs a rich profile schema mapping skill graphs, project impact, experience depth, domain alignment, and activity consistency.
4. **FAISS Semantic Search**: Leverages deep sentence embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and a local vector index to perform instantaneous semantic matches, rather than mere word searches.
5. **Hybrid Scoring Engine**: Employs a comprehensive 6-factor matching formula:
   $$\text{Final Score} = 35\% \text{ Semantic Fit} + 25\% \text{ Skill Match} + 15\% \text{ Experience Relevance} + 10\% \text{ Project Impact} + 10\% \text{ Behavioral Fit} + 5\% \text{ Activity Signal}$$
6. **LLM Reranker**: Performs multi-candidate deep reasoning over top results to supply high-quality recruiter assessments, highlighting missing skills, risks, and interview suggestions.
7. **Explainable AI (XAI) Dashboard**: Beautiful visual breakdown of match scores, highlighting strengths, risks, fit metrics, and a "Fit vs Risk" quadrant graph.

---

## 🛠️ Tech Stack
- **Backend API**: FastAPI (Python), Uvicorn
- **Frontend App**: Next.js (App Router), Tailwind CSS v4, Framer Motion (Animations), Recharts
- **Legacy Dashboard**: Streamlit
- **Vector Search / ML**: Sentence Transformers (`all-MiniLM-L6-v2`), FAISS, NumPy, Pandas, Scikit-learn
- **AI Models**: Google Gemini / OpenAI (with powerful deterministic heuristic fallbacks)
- **PDF Extraction**: PyPDF
- **Visualizations**: Plotly (Backend) / Recharts (Frontend)

---

## 📂 Project Structure
```text
RecruitAI/
 ├── data/
 │   └── candidates.json          # Synthetic candidate database (25+ diverse profiles)
 ├── frontend-next/               # 🌟 NEW: Next.js Hackathon UI
 │   ├── src/app/                 # App Router pages (Dashboard, Candidates, Copilot)
 │   ├── src/components/          # Glassmorphism UI, Charts, and Framer Motion components
 │   └── package.json             # Frontend dependencies
 ├── src/
 │   ├── parser.py                # Text extraction, structured modeling & bias masking
 │   ├── jd_understanding.py      # LLM or heuristic-based JD intent extractor
 │   ├── embeddings.py            # SentenceTransformers vector generation & FAISS matching
 │   ├── scorer.py                # Multi-factor Hybrid Scoring Engine
 │   ├── reranker.py              # LLM-based recruiter ranking & risk analyzer
 │   ├── explain.py               # Strengths/Risks profiling & visual telemetry helpers
 │   └── api.py                   # FastAPI service layer exposing endpoints
 ├── app/
 │   └── main.py                  # Legacy Streamlit Dashboard
 ├── requirements.txt             # Project Python dependencies
 ├── vercel.json                  # Multi-build deployment config (Next.js + FastAPI)
 └── README.md                    # System documentation
```

---

## ⚡ Installation & Quick Start

### 1. Clone & Setup Workspace
Ensure you have Python 3.9+ installed. Install the dependencies:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables (Optional)
Create a `.env` file in the root folder to activate LLM features:
```env
# Optional: To use Google Gemini Models (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: To use OpenAI Models
OPENAI_API_KEY=your_openai_api_key_here
```
*Note: If no API keys are provided, the system seamlessly falls back to a highly powerful rule-based heuristics engine, making it 100% runnable out of the box!*

### 3. Run the App

**Start the FastAPI Backend:**
```bash
uvicorn src.api:app --reload --port 8000
```

**Start the Next.js Frontend:**
Open a new terminal and run:
```bash
cd frontend-next
npm install
npm run dev
```
Then visit `http://localhost:3000` to see the new Hackathon UI.

*(Optional)* Launch the legacy Streamlit Dashboard:
```bash
streamlit run app/main.py
```

---

## 🧠 Winning Scoring Formula Breakdown

- **Semantic Fit (35%)**: Measures vector similarity (cosine) between candidate bio/project summaries and the job description.
- **Skill Match (25%)**: Calculates hard and soft skill overlap, utilizing partial-string mapping and skill synonyms.
- **Experience Relevance (15%)**: Evaluates whether the candidate falls within the desired experience bracket, penalizing severe under-experience or over-experience.
- **Project Impact (10%)**: Analyzes text for quantifiable results and strong action verbs (e.g. *designed*, *slashed response times*, *boosted throughput by 50%*).
- **Behavioral Fit (10%)**: Measures alignment with core personality profiles and behavioral requirements in the JD.
- **Activity Signal (5%)**: Credits active contributors, open-source presence, professional certifications, and career consistency.

---

## 🔌 API Reference & Features

### 🔐 SSO Authentication & Referral Platform
- **Mock Federated SSO Popup**: Exposes a responsive mock SSO gateway for Google, LinkedIn, Microsoft, and Facebook providers (`GET /api/auth/mock-sso`).
- **Social Auth Session Integration**: Signs in recruiters, logs security audits, generates unique tracking links, and registers referral codes (`POST /api/auth/social`).
- **Referral Credits Analytics**: Tracks email invite sign-ups, computes active referrals, and awards credits ($50/referral) dynamically (`GET /api/referrals`).

### 🤖 Recruiter Copilot Engine
- Natural language recruiter assistant endpoint (`POST /api/chat`) supporting:
  - Multi-word skill searches (e.g., *"who knows Docker and PyTorch"*).
  - Head-to-head candidate token-based comparisons (e.g., *"compare Amit vs Priya"*).
  - Innovation/high-impact candidate discoveries (*"underrated hidden gems"*).

### 📊 Endpoints Listing
- **`GET /`**: Renders the complete TalentMind interactive responsive landing page.
- **`GET /api/health`**: Quick API health status check.
- **`GET /api/candidates`**: Retrieves candidates index (supporting GDPR demographic masking).
- **`POST /api/match`**: Main hybrid match engine (handles JDs, scoring breakdown, fraud alerts, interview questions, and SHAP visualizations).
- **`GET /api/talent-clusters`**: Executing dynamic K-Means candidate talent grouping.
- **`GET /api/candidates/{id}/similar`**: KNN-based look-alike profile matcher.
