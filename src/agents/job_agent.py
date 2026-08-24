"""
Job Description Agent: Parses JD, extracts mandatory/optional skills & competency matrix.
"""
import re
from typing import Dict, Any, List
from src.schemas.job import JobDescription

class JobAgent:
    """Specialized Agent for Job Description requirement extraction and taxonomy mapping."""
    
    def parse_job_description(self, jd_text: str) -> JobDescription:
        text_l = jd_text.lower()
        
        # Hard skills extraction
        tech_keywords = [
            "pytorch", "tensorflow", "fastapi", "docker", "kubernetes",
            "rag", "faiss", "pinecone", "milvus", "qdrant", "langchain",
            "python", "react", "next.js", "typescript", "aws", "gcp", "azure",
            "postgresql", "mongodb", "redis", "scikit-learn", "nlp", "llm"
        ]
        extracted_skills = [kw.title() for kw in tech_keywords if re.search(r"\b" + re.escape(kw) + r"\b", text_l)]
        if not extracted_skills:
            extracted_skills = ["Python", "Machine Learning", "FastAPI", "Docker"]
            
        # Seniority extraction
        exp_min = 5.0
        exp_max = 9.0
        exp_match = re.search(r"(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years|yoe)", text_l)
        if exp_match:
            exp_min = float(exp_match.group(1))
            exp_max = float(exp_match.group(2))
            
        # Title extraction
        title = "Senior AI Engineer"
        if "frontend" in text_l or "react" in text_l:
            title = "Senior Frontend Engineer"
        elif "backend" in text_l:
            title = "Senior Backend Engineer"
        elif "devops" in text_l or "cloud" in text_l:
            title = "Senior DevOps / MLOps Engineer"
            
        return JobDescription(
            title=title,
            experience_level_min=exp_min,
            experience_level_max=exp_max,
            hard_skills=extracted_skills,
            soft_skills=["System Architecture", "Leadership", "Technical Communication", "Agile Execution"],
            behavior_traits=["Ownership", "First-principles Thinking", "Continuous Learning"],
            domain="Enterprise AI / Machine Learning Systems",
            key_responsibilities=[
                "Architect and scale low-latency vector retrieval pipelines",
                "Deploy production microservices with FastAPI and Docker containerization",
                "Collaborate cross-functionally with product and engineering teams"
            ]
        )

job_agent = JobAgent()
