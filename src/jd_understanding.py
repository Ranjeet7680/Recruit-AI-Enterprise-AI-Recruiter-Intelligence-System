import os
import re
import json
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI

from src.parser import JobDescription

# Load env variables
load_dotenv()

# Predefined dictionaries for the Heuristics Fallback Engine
TECH_SKILLS_BANK = [
    "python", "pytorch", "tensorflow", "fastapi", "docker", "aws", "sql", "scikit-learn", 
    "nltk", "react", "typescript", "next.js", "tailwindcss", "node.js", "jest", "graphql", 
    "redux", "git", "kubernetes", "terraform", "ansible", "jenkins", "github actions", 
    "bash", "prometheus", "grafana", "r", "pandas", "numpy", "xgboost", "tableau", 
    "spark", "agile", "jira", "ab testing", "figma", "user research", "wireframing", 
    "prototyping", "java", "spring boot", "redis", "kafka", "hibernate", "microservices", 
    "seo", "google analytics", "copywriting", "social media", "crm", "wireshark", 
    "metasploit", "nmap", "linux", "cissp", "ceh", "llm", "langchain", "nlp", "go", "ebpf"
]

SOFT_SKILLS_BANK = [
    "leadership", "ownership", "team player", "problem solving", "communication", 
    "technical writing", "critical thinking", "risk management", "crisis resolution", 
    "collaboration", "mentorship", "empathy", "user advocacy", "adaptability", 
    "analytical thinking", "research mindset", "presentation skills", "stakeholder management", 
    "strategic vision", "public speaking", "emotional intelligence", "conflict resolution", 
    "curiosity", "self-starter", "work ethc", "creativity", "storytelling", "agility"
]

BEHAVIORAL_TRAITS_BANK = [
    "startup mindset", "ownership", "fast learner", "autonomous", "proactive", 
    "resilient", "attention to detail", "growth mindset", "result-oriented", 
    "customer-centric", "adaptive", "passionate", "collaborative"
]

INDUSTRIES_BANK = [
    "saas", "fintech", "ai", "machine learning", "cybersecurity", "e-commerce", 
    "logistics", "aerospace", "healthcare", "edutech", "marketing", "retail", "cloud"
]

def _parse_jd_with_heuristics(jd_text: str) -> JobDescription:
    """
    Highly robust regex and keyword-dictionary based fallback extractor.
    Operates with zero API costs or external service dependencies.
    """
    jd_lower = jd_text.lower()
    
    # 1. Skill Extraction
    extracted_hard = []
    for skill in TECH_SKILLS_BANK:
        # Match whole word or exact pattern (e.g. next.js, all-mpnet)
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, jd_lower):
            extracted_hard.append(skill.title() if '.' not in skill else skill)
            
    extracted_soft = []
    for skill in SOFT_SKILLS_BANK:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, jd_lower):
            extracted_soft.append(skill.title())

    # 2. Behavioral Traits
    extracted_behavior = []
    for trait in BEHAVIORAL_TRAITS_BANK:
        if trait in jd_lower:
            extracted_behavior.append(trait.title())
            
    # 3. Industry
    extracted_industry = "General Tech"
    for ind in INDUSTRIES_BANK:
        if ind in jd_lower:
            extracted_industry = ind.upper() if len(ind) <= 4 else ind.title()
            break

    # 4. Experience Parsing
    # Look for patterns like "3-5 years", "5+ years", "min 2 years", "at least 4 years"
    min_exp, max_exp = 0.0, 15.0
    exp_matches = re.findall(r'(\d+)\s*-\s*(\d+)\s*(?:years|yrs)', jd_lower)
    if exp_matches:
        min_exp = float(exp_matches[0][0])
        max_exp = float(exp_matches[0][1])
    else:
        plus_matches = re.findall(r'(\d+)\s*\+\s*(?:years|yrs)', jd_lower)
        if plus_matches:
            min_exp = float(plus_matches[0])
            max_exp = min_exp + 5.0
        else:
            min_matches = re.findall(r'(?:min|minimum|at\s+least)\s*(\d+)\s*(?:years|yrs)', jd_lower)
            if min_matches:
                min_exp = float(min_matches[0])
                max_exp = min_exp + 5.0

    # 5. Must Have vs Good to Have
    # Simple semantic splitting based on lines containing required/nice phrases
    must_have = []
    good_to_have = []
    lines = jd_text.split('\n')
    for line in lines:
        line_l = line.lower()
        if any(w in line_l for w in ["must", "require", "essential", "have to", "strong experience in"]):
            # Extract nouns or matches
            for s in extracted_hard:
                if s.lower() in line_l and s not in must_have:
                    must_have.append(s)
        if any(w in line_l for w in ["nice to", "plus", "bonus", "prefer", "good to have", "desired"]):
            for s in extracted_hard:
                if s.lower() in line_l and s not in good_to_have:
                    good_to_have.append(s)
                    
    # Ensure must_have is not empty
    if not must_have and extracted_hard:
        must_have = extracted_hard[:2]
    if not good_to_have and len(extracted_hard) > 2:
        good_to_have = [extracted_hard[-1]]

    # Guess title
    title = "Software Engineer"
    title_matches = [
        ("machine learning engineer", "ML Engineer"),
        ("ml engineer", "ML Engineer"),
        ("data scientist", "Data Scientist"),
        ("frontend", "Frontend Engineer"),
        ("back-end", "Backend Engineer"),
        ("backend", "Backend Engineer"),
        ("devops", "DevOps Engineer"),
        ("security", "Security Specialist"),
        ("product manager", "Product Manager"),
        ("designer", "UI/UX Designer")
    ]
    for pattern, placeholder in title_matches:
        if pattern in jd_lower:
            title = placeholder
            break

    return JobDescription(
        title=title,
        hard_skills=extracted_hard if extracted_hard else ["Python"],
        soft_skills=extracted_soft if extracted_soft else ["Communication"],
        experience_level_min=min_exp,
        experience_level_max=max_exp,
        industry=extracted_industry,
        behavior_traits=extracted_behavior if extracted_behavior else ["Ownership"],
        must_have=must_have if must_have else ["Python"],
        good_to_have=good_to_have,
        original_text=jd_text
    )

def _parse_jd_with_llm(jd_text: str, provider: str) -> JobDescription:
    """
    Uses Gemini or OpenAI API to extract rich metadata and structured criteria from the JD.
    """
    prompt = f"""
    You are a professional recruitment coordinator. Parse the following Job Description (JD) and return a structured JSON response matching this schema EXACTLY:
    {{
        "title": "Exact Role Title",
        "hard_skills": ["List", "Of", "Technical", "Skills"],
        "soft_skills": ["List", "Of", "Soft", "Skills"],
        "experience_level_min": 3.0,
        "experience_level_max": 5.0,
        "industry": "Industry sector (e.g. AI/SaaS, Cybersecurity, etc.)",
        "behavior_traits": ["List", "Of", "Expected", "Traits", "like ownership, startup mindset"],
        "must_have": ["Primary", "required", "skills", "that", "are", "mandatory"],
        "good_to_have": ["Secondary", "nice", "to", "have", "skills"]
    }}
    
    Ensure experience_level_min and experience_level_max are floats representing years.
    Only return valid parseable JSON. Do not include markdown blocks or wrappers.

    JOB DESCRIPTION:
    {jd_text}
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
        return JobDescription(
            title=data.get("title", "Software Engineer"),
            hard_skills=data.get("hard_skills", []),
            soft_skills=data.get("soft_skills", []),
            experience_level_min=float(data.get("experience_level_min", 0.0)),
            experience_level_max=float(data.get("experience_level_max", 15.0)),
            industry=data.get("industry", "General Tech"),
            behavior_traits=data.get("behavior_traits", []),
            must_have=data.get("must_have", []),
            good_to_have=data.get("good_to_have", []),
            original_text=jd_text
        )
    except Exception as e:
        print(f"LLM Parsing failed with error: {e}. Falling back to heuristics.")
        return _parse_jd_with_heuristics(jd_text)

def parse_jd(jd_text: str) -> JobDescription:
    """
    Orchestrator to parse JD text. Auto-detects Gemini, OpenAI, or falls back to heuristics.
    """
    if os.environ.get("GEMINI_API_KEY"):
        return _parse_jd_with_llm(jd_text, "gemini")
    elif os.environ.get("OPENAI_API_KEY"):
        return _parse_jd_with_llm(jd_text, "openai")
    else:
        return _parse_jd_with_heuristics(jd_text)
