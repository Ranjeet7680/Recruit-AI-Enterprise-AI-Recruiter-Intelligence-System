"""
Candidate Profile, Career Timeline, Skills & Redacted Profile Schemas.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    duration_months: Optional[int] = 0

class EducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    year: str = ""
    gpa: Optional[float] = None

class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    impact: str = ""
    technologies: List[str] = Field(default_factory=list)

class LinkedInActivity(BaseModel):
    recent_posts_summary: Optional[str] = ""
    open_source_contributions: Optional[bool] = False
    certifications: List[str] = Field(default_factory=list)
    recruiter_response_rate: Optional[float] = 0.8
    notice_period_days: Optional[int] = 30
    open_to_work: Optional[bool] = True

class CandidateProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = ""
    title: Optional[str] = "Software Engineer"
    summary: str = ""
    experience_years: float = Field(default=0.0, ge=0.0, le=50.0)
    hard_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    experience_timeline: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    linkedin_activity: Optional[LinkedInActivity] = Field(default_factory=LinkedInActivity)
    location: Optional[str] = "India"
    country: Optional[str] = "India"
    redrob_signals: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_honeypot: Optional[bool] = False
    disqualification_reason: Optional[str] = None

class CandidateSearchQuery(BaseModel):
    query: Optional[str] = Field(None, max_length=500)
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    mask_demographics: bool = True
    min_score: Optional[float] = Field(None, ge=0.0, le=100.0)
