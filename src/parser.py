import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import pypdf

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
