# RecruitAI (TalentMind AI) — Enterprise Recruiter Intelligence System

RecruitAI (also known as **TalentMind AI**) is a state-of-the-art, high-scoring enterprise hiring, evaluation, and video screening platform. Traditional Applicant Tracking Systems (ATS) fail because keyword stuffing bypasses evaluation, resumes hide actual capabilities, there is no behavioral or domain alignment understanding, and they offer zero explainability. 

RecruitAI acts like a senior human recruiter and expert AI analyst combined. It utilizes advanced Semantic Embedding Retrieval, a multi-factor Hybrid Scoring Engine, LLM-based parsing and reranking, a Real-Time Video Interview Screen (Zoom App), and an Explainable AI Dashboard featuring demographic bias reduction, a synthesised sound system, and a voice-to-voice recruiter copilot.

---

## Live Production Deployment
The application API, interactive landing page, and developer interfaces are fully live:
- **Production Web Application**: [https://recruit-ai-enterprise-ai-recruiter.vercel.app](https://recruit-ai-enterprise-ai-recruiter.vercel.app)
- **FastAPI Backend Health Check**: [https://recruit-ai-enterprise-ai-recruiter.vercel.app/api/health](https://recruit-ai-enterprise-ai-recruiter.vercel.app/api/health)

---

##  Key Features & Capabilities

### 1.  Real-Time Video Interview Screen (Zoom Reference App)
* **Draggable PiP Tiles**: Custom Picture-in-Picture candidate tiles that can be dragged and repositioned freely during live calls.
* **Audio Waveform Visualizers**: Real-time waveform telemetry displaying microphone activity for both candidate and interviewer.
* **Live Recruiter Scorecard**: In-call interactive sliding gauges (1-5 star scales) across multiple vectors (Technical Depth, Communication, Culture Fit, Problem Solving).
* **Cross-Device Optimization**: Tailored UI layout that adapts seamlessly to desktop wide screens and mobile portrait viewports with zero layout breakage.

### 2.  Voice-to-Voice & Text-to-Text AI Copilot
* **Hands-Free Voice Mode**: Uses Web Speech API (`SpeechRecognition` + `SpeechSynthesis`) to allow voice-only conversations. Copilot replies are spoken aloud.
* **Voice Speed & Pitch Modulations**: Adjustable text-to-speech rendering settings (0.5x to 2.0x speeds, pitch levels).
* **Recruiter Intelligence**: Natural language assistant capable of complex parsing (e.g. *"who knows Docker and PyTorch"*, *"compare Amit vs Priya"*).

### 3.Drag-and-Drop JD Importer
* **Multi-Format Ingestion**: Supports drag-and-drop or click-to-upload for PDF, DOCX, and TXT files (up to 5MB).
* **History Caching**: Maintains uploaded JD history for rapid swapping.
* **Clear & Refresh Operations**: Allows recruiters to quickly reset the matching pipeline.

### 4.Hybrid Multi-Factor Scoring Engine
Every candidate profile is scored using a rigorous 6-factor deterministic model:
$$\text{Final Score} = 35\% \text{ Semantic Fit} + 25\% \text{ Skill Match} + 15\% \text{ Experience Relevance} + 10\% \text{ Project Impact} + 10\% \text{ Behavioral Fit} + 5\% \text{ Activity Signal}$$
* **Semantic Fit (35%)**: SentenceTransformers (`all-MiniLM-L6-v2`) semantic similarity against the JD text.
* **Skill Match (25%)**: Overlap scoring with support for synonyms and acronym normalization.
* **Experience Relevance (15%)**: Assesses fit within target experience bracket.
* **Project Impact (10%)**: Quantitative telemetry checking for metrics, dollar savings, and action verbs.
* **Behavioral Fit (10%)**: Tone and culture alignment checks.
* **Activity Signal (5%)**: Credits active contributors, open-source presence, and professional certifications.

### 5. Demographic Masking (Bias Reduction)
* **Single-Toggle Masking**: Instantly hide names, emails, phones, universities, and ages to evaluate candidates strictly on skills and experience.
* **GDPR & HIPAA Alignment**: Prevents unconscious bias and complies with equal opportunity hiring policies.

### 6. Explainable AI (XAI) & Analytics
* **SHAP / Feature Breakdowns**: Clearly shows why a candidate scored the way they did.
* **Fit vs Risk Quadrant**: Plots candidates dynamically based on potential and risk.
* **K-Means Talent Clustering**: Automatically clusters talent pool into logical groups (e.g., "Full-Stack Guru", "Data Wizards").
* **KNN Look-Alikes**: Retrieve similar candidate profiles to a selected profile with a single click.

### 7. Social Auth & Referral Credits
* **Federated SSO Gateways**: Support for Google, LinkedIn, Microsoft, and Facebook mock logins.
* **Referral Module**: Invite colleagues, track clicks, and earn hiring credits ($50/referral).

### 8. Synthesized Web Audio Sound System
* **Zero External Files**: All interface sounds are programmatically synthesized in real-time via the Web Audio API (`AudioContext`).
* **ADSR Envelopes**: Clean attack-decay-sustain-release curves for click, pop, chimes, slider ticks, and level-up audio alerts.
* **Reverb & Lowpass Filters**: Programmable convolver-like impulse noise and biquad filters to add warmth and spatial depth to UI responses.
* **SoundToggle Switch**: Floating toggle controls allowing users to globalize mute/unmute audio settings (stored and retrieved from `localStorage`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts |
| **Backend API** | FastAPI (Python), Uvicorn, Pydantic v2 |
| **Vector Search / ML** | SentenceTransformers (`all-MiniLM-L6-v2`), FAISS Vector Index, NumPy, Scikit-learn |
| **Data Parsing** | PyPDF, Python Docx, Built-in structured parsers |
| **AI Models** | Google Gemini API (with robust heuristic fallback engines) |
| **Deployment** | Vercel Serverless Functions (Python API & Next.js Frontend) |

---

##  Technical Architecture & React 19 Purity Standards

To conform with React 19 strict compilation standards, the application implements specific architecture guidelines:
1. **Initial State Purity**: Initializing states with dynamic calls like `Date.now()` or `Math.random()` inside the render body is avoided. Initial states are set using lazy initializers (e.g., `useState(() => Msg[])`) to avoid running impure functions during render cycles.
2. **Cascading State Updates Prevention**: Calling `setState` synchronously within a `useEffect` hook causes cascading renders. When retrieving preferences from client-side sources like `localStorage` or updating visibility stats, calls are scheduled asynchronously (using `requestAnimationFrame` or `setTimeout`) to allow React 19 to finish rendering cleanly.
3. **Web Speech API Strict Typing**: Custom definitions for `SpeechRecognition` events and results (`SpeechEvent`, `SpeechResult`) are enforced, eliminating the use of `any` type casts on microphone buffers and transcripts.

---

## System Directory Structure

```text
RecruitAI/
 ├── api/                         # Vercel Serverless Function Endpoints
 │   ├── index.py                 # Backend Entrypoint for Vercel
 │   └── requirements.txt         # Serverless Python Dependencies
 ├── src/                         # Python Core Engines
 │   ├── parser.py                # Resumes/JD extraction & bias masking
 │   ├── jd_understanding.py      # Job Description intent parser
 │   ├── embeddings.py            # SentenceTransformers vector generation & FAISS search
 │   ├── scorer.py                # Multi-factor scoring engine
 │   ├── reranker.py              # LLM-based recruiter ranking & risk analyzer
 │   ├── explain.py               # Telemetry, SHAP breakdowns & coaching
 │   ├── copilot.py               # AI Copilot chatbot logic
 │   ├── api.py                   # FastAPI app routes & middleware
 │   ├── app/                     # Next.js Application Core
 │   │   ├── analytics/           # Analytics Page
 │   │   ├── candidates/          # Candidates Match Page
 │   │   ├── copilot/             # Recruiter Copilot (Voice & Text)
 │   │   ├── interviews/          # Real-time Video Call / Zoom reference app
 │   │   ├── settings/            # App Settings (Pitch, Speed, SSO, Referrals)
 │   │   ├── layout.tsx           # Base Shell & Sidebar Nav
 │   │   └── page.tsx             # Main Recruiter Dashboard
 │   └── components/              # Shared UI Widgets (KPICards, Charts, BottomNav)
 ├── data/                        # Local DB
 │   └── candidates.json          # Synthetic Candidates DB (25+ profiles)
 ├── vercel.json                  # Multi-build Deployment Configuration
 ├── package.json                 # Next.js Dependencies
 ├── tsconfig.json                # TypeScript Configurations
 └── README.md                    # System Documentation
```

---

## Installation & Quick Start

### 1. Clone & Setup Python Environment
Ensure you have Python 3.10+ installed:
```bash
# Install backend dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
# Google Gemini Key (Optional - falls back to heuristics)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Backend API
```bash
uvicorn src.api:app --reload --port 8000
```

### 4. Run the Next.js Frontend
```bash
# Install node packages
npm install

# Start Next.js dev server
npm run dev
```
Open `http://localhost:3000` to interact with the system.

---

## 🔌 API Endpoints Reference

### SSO & Referral Gateway
* `GET /api/auth/mock-sso` - Launches federated provider SSO gateways.
* `POST /api/auth/social` - Processes session metadata and audit logs.
* `GET /api/referrals` - Retrieves referral metrics and credit stats.

### Copilot Chat Engine
* `POST /api/chat` - Natural language recruiter assistant with candidate comparisons.

###  Matching & Analytics Engine
* `GET /api/candidates` - Candidate directory (demographic masking supported).
* `POST /api/match` - Triggers matching, SHAP visualizers, fraud detectors, and interview questions.
* `GET /api/talent-clusters` - K-Means talent pool cluster mapping.
* `GET /api/candidates/{id}/similar` - KNN similar profile look-alike engine.

---

## Deployment to Vercel

The application is configured to deploy as a combined Next.js frontend and Python FastAPI serverless backend using `vercel.json` rewrites. 

To deploy locally using Vercel CLI:
```bash
# 1. Pull the remote settings matching the project ID
npx vercel pull --yes

# 2. Compile and package the production resources
npx vercel build

# 3. Deploy to production
npx vercel deploy --prod
```
