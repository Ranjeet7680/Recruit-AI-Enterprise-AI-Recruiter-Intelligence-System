"""
Job Description & Requirements Parsing Schemas.
"""
from typing import List
from pydantic import BaseModel, Field

class JobDescriptionRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50000, description="Full raw Job Description text")

class JobDescription(BaseModel):
    title: str = "Senior AI Engineer"
    experience_level_min: float = 5.0
    experience_level_max: float = 9.0
    hard_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    behavior_traits: List[str] = Field(default_factory=list)
    domain: str = "Artificial Intelligence / Machine Learning"
    key_responsibilities: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=lambda: ["India", "Pune", "Noida", "Remote"])
