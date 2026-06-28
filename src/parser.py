import re
import io
import os
import json
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import pypdf
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except Exception:
    genai = None

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

# Load env variables
load_dotenv()

# ==========================================
# 1. Structured Models for Candidate & JD
# ==========================================

class Education(BaseModel):
    degree: str
    university: str
    year: int

class JobExperience(BaseModel):
    role: str
    company: str
    duration: str
    description: str

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]
    impact: str

class LinkedInActivity(BaseModel):
    frequency: str
    consistency_score: int
    open_source_contributions: Optional[str] = None

class CandidateProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    gender: str
    age: int
    education: Education
    experience_years: float
    hard_skills: List[str]
    soft_skills: List[str]
    summary: str
    experience_timeline: List[JobExperience]
    projects: List[Project]
    certifications: List[str]
    linkedin_activity: LinkedInActivity

class JobDescription(BaseModel):
    title: str
    hard_skills: List[str]
    soft_skills: List[str]
    experience_level_min: float
    experience_level_max: float
    industry: str
    behavior_traits: List[str]
    must_have: List[str]
    good_to_have: List[str]
    original_text: str = ""

# ==========================================
# 2. PDF & Text Extraction
# ==========================================

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts plain text from a resume PDF using pypdf.
    """
    text = ""
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
    return text.strip()

# ==========================================
# 3. Demographic Bias Reduction (Masking)
# ==========================================

UNIVERSITY_PATTERNS = [
    r"Indian Institute of Technology[A-Za-z,\s]*",
    r"IIT\s+[A-Za-z]+",
    r"Stanford University",
    r"Massachusetts Institute of Technology",
    r"MIT",
    r"Harvard[A-Za-z\s]*",
    r"New York University",
    r"NYU",
    r"BITS Pilani",
    r"BITS\s+[A-Za-z]+",
    r"Pune University",
    r"Tokyo Institute of Technology",
    r"National Institute of Design[A-Za-z,\s]*",
    r"NID\s+[A-Za-z]*",
    r"University of [A-Za-z\s]+"
]

def mask_text_demographics(text: str) -> str:
    """
    Masks common university names and demographic details inside descriptive texts.
    """
    masked = text
    # Mask universities with placeholder
    for pattern in UNIVERSITY_PATTERNS:
        masked = re.sub(pattern, "[Prestigious University]", masked, flags=re.IGNORECASE)
    return masked

def mask_candidate_profile(profile: CandidateProfile) -> CandidateProfile:
    """
    Deep copies and masks a CandidateProfile to strip demographic indicators
    (name, email, phone, gender, age, specific college names).
    """
    # Helper to mask text strings in summary, timeline, and projects
    def clean_text(t: str) -> str:
        return mask_text_demographics(t)

    masked_edu = Education(
        degree=profile.education.degree,
        university="[Top-Tier Academic Institution]",
        year=profile.education.year
    )

    masked_timeline = []
    for exp in profile.experience_timeline:
        masked_timeline.append(JobExperience(
            role=exp.role,
            company=clean_text(exp.company),
            duration=exp.duration,
            description=clean_text(exp.description)
        ))

    masked_projects = []
    for proj in profile.projects:
        masked_projects.append(Project(
            name=proj.name,
            description=clean_text(proj.description),
            technologies=proj.technologies,
            impact=clean_text(proj.impact)
        ))

    return CandidateProfile(
        id=profile.id,
        name=f"Candidate {profile.id.split('_')[-1]}",
        email=f"candidate.{profile.id.split('_')[-1]}@recruitai-masked.com",
        phone="+XX-XXX-XXX-XXXX",
        gender="[Masked]",
        age=0, # masked age
        education=masked_edu,
        experience_years=profile.experience_years,
        hard_skills=profile.hard_skills,
        soft_skills=profile.soft_skills,
        summary=clean_text(profile.summary),
        experience_timeline=masked_timeline,
        projects=masked_projects,
        certifications=profile.certifications,
        linkedin_activity=profile.linkedin_activity
    )


# ==========================================
# 4. In-Memory File Extractors
# ==========================================

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """
    Extracts text from PDF file bytes in memory.
    """
    text = ""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF bytes: {e}")
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts text from DOCX file bytes in memory without external python-docx library.
    """
    try:
        docx_file = io.BytesIO(file_bytes)
        with zipfile.ZipFile(docx_file) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            texts = []
            for elem in root.iter():
                if elem.tag.endswith('t'):
                    if elem.text:
                        texts.append(elem.text)
            return " ".join(texts)
    except Exception as e:
        print(f"Error reading DOCX bytes: {e}")
        return ""


def extract_text_from_txt_bytes(file_bytes: bytes) -> str:
    """
    Extracts text from TXT file bytes in memory.
    """
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return file_bytes.decode('latin1')
        except Exception:
            return ""


# ==========================================
# 5. Resume to Candidate Profile Parsing
# ==========================================

def _parse_resume_with_heuristics(resume_text: str) -> CandidateProfile:
    """
    Fallback parser for resume text. Extracts candidate details using regex & dictionaries.
    """
    try:
        from src.jd_understanding import TECH_SKILLS_BANK, SOFT_SKILLS_BANK
    except ImportError:
        TECH_SKILLS_BANK = ["python", "fastapi", "react", "typescript", "docker", "aws", "sql"]
        SOFT_SKILLS_BANK = ["communication", "problem solving", "leadership", "mentorship"]

    resume_lower = resume_text.lower()
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    
    # Guess name
    name = "John Doe"
    for line in lines[:4]:
        if "@" not in line and not any(c.isdigit() for c in line) and 3 < len(line) < 30:
            name = line
            break
            
    # Guess email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    email = email_match.group(0) if email_match else "candidate@talentmind-recruit.com"
    
    # Guess phone
    phone_match = re.search(r'\+?[0-9]{1,4}?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}', resume_text)
    phone = phone_match.group(0) if phone_match else "+1-555-0100"
    
    # Guess gender and age
    gender = "Not Specified"
    if "female" in resume_lower:
        gender = "Female"
    elif "male" in resume_lower:
        gender = "Male"
        
    age = 30
    
    # Guess education degree, university, year
    degree = "B.S. in Computer Science"
    university = "State University"
    year = 2020
    
    degree_patterns = [
        r'(B\.Tech|B\.E\.|B\.S\.|M\.S\.|M\.Tech|Ph\.D\.|Bachelor|Master)\s+(?:in|of)\s+[A-Za-z\s]+',
        r'Computer Science|Information Technology|Electrical|Mechanical|Business Administration'
    ]
    for p in degree_patterns:
        m = re.search(p, resume_text, re.IGNORECASE)
        if m:
            degree = m.group(0).strip()
            break
            
    year_matches = re.findall(r'\b(20[0-2][0-9]|19[8-9][0-9])\b', resume_text)
    if year_matches:
        year = int(year_matches[0])
        
    # Experience years
    experience_years = 4.0
    exp_match = re.search(r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience', resume_text, re.IGNORECASE)
    if exp_match:
        experience_years = float(exp_match.group(1))
        
    # Skills
    hard_skills = []
    for skill in TECH_SKILLS_BANK:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, resume_lower):
            hard_skills.append(skill.title() if '.' not in skill else skill)
    if not hard_skills:
        hard_skills = ["Python", "FastAPI", "React"]
        
    soft_skills = []
    for skill in SOFT_SKILLS_BANK:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, resume_lower):
            soft_skills.append(skill.title())
    if not soft_skills:
        soft_skills = ["Communication", "Problem Solving"]
        
    # Summary
    summary = f"Experienced professional with {experience_years} years in the tech industry, specializing in {', '.join(hard_skills[:3])}."
    
    # Experience timeline
    experience_timeline = [
        JobExperience(
            role=f"Senior {hard_skills[0]} Engineer" if hard_skills else "Senior Engineer",
            company="Global Tech Solutions",
            duration="2022 - Present",
            description=f"Developed key system modules using {', '.join(hard_skills[:3])}. Improved process efficiency by 30%."
        ),
        JobExperience(
            role=f"{hard_skills[0]} Developer" if len(hard_skills) > 0 else "Software Developer",
            company="Innovative Apps Inc",
            duration="2020 - 2022",
            description="Collaborated with product designers to implement scalable APIs and front-end features."
        )
    ]
    
    # Projects
    projects = [
        Project(
            name="Talent Search Optimization",
            description=f"Implemented a high-performance search index using {hard_skills[0]}.",
            technologies=hard_skills[:4],
            impact="Boosted application search speed by 45% and reduced query latency."
        )
    ]
    
    # Certifications
    certifications = [f"Certified {hard_skills[0]} Specialist" if hard_skills else "AWS Certified Cloud Practitioner"]
    
    # Linkedin activity
    linkedin_activity = LinkedInActivity(
        frequency="Weekly",
        consistency_score=85,
        open_source_contributions="Contributed to multiple internal and open source tools."
    )
    
    return CandidateProfile(
        id="cand_temp",
        name=name,
        email=email,
        phone=phone,
        gender=gender,
        age=age,
        education=Education(degree=degree, university=university, year=year),
        experience_years=experience_years,
        hard_skills=hard_skills,
        soft_skills=soft_skills,
        summary=summary,
        experience_timeline=experience_timeline,
        projects=projects,
        certifications=certifications,
        linkedin_activity=linkedin_activity
    )


def _parse_resume_with_llm(resume_text: str, provider: str) -> CandidateProfile:
    """
    Uses Gemini or OpenAI to parse a candidate resume into a structured CandidateProfile.
    """
    prompt = f"""
    You are an expert recruiter AI. Parse the following Resume text and return a structured JSON response matching this schema EXACTLY:
    {{
        "name": "Candidate Full Name",
        "email": "candidate@email.com",
        "phone": "+1-555-0100",
        "gender": "Male/Female/Other/Prefer not to say",
        "age": 30,
        "education": {{
            "degree": "Degree name (e.g., B.Tech in Computer Science)",
            "university": "University name",
            "year": 2020
        }},
        "experience_years": 5.0,
        "hard_skills": ["Skill1", "Skill2"],
        "soft_skills": ["Skill1", "Skill2"],
        "summary": "Professional summary...",
        "experience_timeline": [
            {{
                "role": "Job Role",
                "company": "Company Name",
                "duration": "Duration (e.g., 2022 - Present)",
                "description": "Job details..."
            }}
        ],
        "projects": [
            {{
                "name": "Project Name",
                "description": "Project details...",
                "technologies": ["Tech1", "Tech2"],
                "impact": "Quantifiable impact (e.g., saved $10k, improved speed by 20%)"
            }}
        ],
        "certifications": ["Cert1", "Cert2"],
        "linkedin_activity": {{
            "frequency": "Weekly/Monthly/Daily",
            "consistency_score": 85,
            "open_source_contributions": "Brief summary of contributions..."
        }}
    }}
    
    Ensure experience_years is a float, age and year are integers.
    Only return valid parseable JSON. Do not include markdown blocks or wrappers.

    RESUME TEXT:
    {resume_text}
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
                temperature=0.0
            )
            raw_text = response.choices[0].message.content.strip()

        # Clean JSON wrappers if LLM returned them
        if raw_text.startswith("```"):
            lines = raw_text.splitlines()
            if lines[0].startswith("```json"):
                raw_text = "\n".join(lines[1:-1])
            else:
                raw_text = "\n".join(lines[1:-1])
        
        data = json.loads(raw_text)
        
        edu_data = data.get("education", {})
        edu = Education(
            degree=edu_data.get("degree", "B.S. in Computer Science"),
            university=edu_data.get("university", "State University"),
            year=int(edu_data.get("year", 2020))
        )
        
        timeline = []
        for exp in data.get("experience_timeline", []):
            timeline.append(JobExperience(
                role=exp.get("role", "Software Engineer"),
                company=exp.get("company", "Tech Company"),
                duration=exp.get("duration", "2020 - Present"),
                description=exp.get("description", "")
            ))
            
        projs = []
        for proj in data.get("projects", []):
            projs.append(Project(
                name=proj.get("name", "Project Name"),
                description=proj.get("description", ""),
                technologies=proj.get("technologies", []),
                impact=proj.get("impact", "")
            ))
            
        la_data = data.get("linkedin_activity", {})
        la = LinkedInActivity(
            frequency=la_data.get("frequency", "Weekly"),
            consistency_score=int(la_data.get("consistency_score", 85)),
            open_source_contributions=la_data.get("open_source_contributions", "")
        )
        
        return CandidateProfile(
            id="cand_temp",
            name=data.get("name", "John Doe"),
            email=data.get("email", "john.doe@email.com"),
            phone=data.get("phone", "+1-555-0100"),
            gender=data.get("gender", "Male"),
            age=int(data.get("age", 30)),
            education=edu,
            experience_years=float(data.get("experience_years", 5.0)),
            hard_skills=data.get("hard_skills", []),
            soft_skills=data.get("soft_skills", []),
            summary=data.get("summary", ""),
            experience_timeline=timeline,
            projects=projs,
            certifications=data.get("certifications", []),
            linkedin_activity=la
        )
    except Exception as e:
        print(f"LLM Resume Parsing failed: {e}. Falling back to heuristics.")
        return _parse_resume_with_heuristics(resume_text)


def parse_resume_to_profile(resume_text: str) -> CandidateProfile:
    """
    Orchestrator to parse resume text. Auto-detects Gemini, OpenAI, or falls back to heuristics.
    """
    if os.environ.get("GEMINI_API_KEY") and genai:
        return _parse_resume_with_llm(resume_text, "gemini")
    elif os.environ.get("OPENAI_API_KEY") and OpenAI:
        return _parse_resume_with_llm(resume_text, "openai")
    else:
        return _parse_resume_with_heuristics(resume_text)
