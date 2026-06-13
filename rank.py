#!/usr/bin/env python3
"""
Redrob Hackathon Candidate Ranking CLI.
Ranks candidates from candidates.jsonl against the Senior AI Engineer job description.
Outputs a valid submission CSV matching the hackathon format.
"""

import json
import re
import argparse
import csv
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return None

def evaluate_candidate(cand):
    cid = cand.get("candidate_id")
    profile = cand.get("profile", {})
    yoe = profile.get("years_of_experience", 0.0)
    current_title = profile.get("current_title", "").lower()
    headline = profile.get("headline", "").lower()
    summary = profile.get("summary", "").lower()
    location = profile.get("location", "").lower()
    country = profile.get("country", "").lower()
    
    # 1. Honeypot Filters (Forced to relevance tier 0)
    skills = cand.get("skills", [])
    for sk in skills:
        if sk.get("proficiency") == "expert" and sk.get("duration_months") == 0:
            return -9999.0, [], "Honeypot: expert skill with 0 duration"
            
    history = cand.get("career_history", [])
    total_history_months = sum(job.get("duration_months", 0) for job in history)
    total_history_years = total_history_months / 12.0
    if abs(total_history_years - yoe) > 2.0:
        return -9999.0, [], f"Honeypot: experience mismatch (yoe={yoe:.1f}, history={total_history_years:.1f})"
        
    # 2. Keyword Stuffer Filters (Non-tech titles)
    non_tech_keywords = [
        "hr", "recruiter", "talent acquisition", "marketing", "sales", "content", "writer", 
        "graphic", "designer", "accountant", "finance", "mechanical", "civil", "electrical", 
        "operations", "customer support", "business analyst"
    ]
    
    is_non_tech = False
    for kw in non_tech_keywords:
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, current_title) or re.search(pattern, headline):
            is_non_tech = True
            break
            
    if is_non_tech:
        has_tech_history = False
        for job in history:
            job_title = job.get("title", "").lower()
            if any(tech_kw in job_title for tech_kw in ["software", "developer", "engineer", "ml", "ai", "scientist"]):
                has_tech_history = True
                break
        if not has_tech_history:
            return -1000.0, [], f"Keyword stuffer: non-tech title '{profile.get('current_title')}' and no tech history"
            
    # 3. IT Services / Consulting Disqualifier
    service_firms = [
        "tcs", "tata consultancy", "infosys", "wipro", "accenture", "cognizant", "capgemini",
        "hcl", "tech mahindra", "l&t", "lnt", "mindtree", "deloitte", "pwc", "ey", "kpmg"
    ]
    if history:
        all_services = True
        for job in history:
            comp = job.get("company", "").lower()
            ind = job.get("industry", "").lower()
            is_service = False
            if ind in ["it services", "consulting", "it services and it consulting"]:
                is_service = True
            if any(sf in comp for sf in service_firms):
                is_service = True
            if not is_service:
                all_services = False
                break
        if all_services:
            return -500.0, [], "Consulting only career path"
            
    # 4. Experience Scoring (Sweet spot: 5-9 years, ideally 6-8)
    exp_score = 0.0
    if 5.0 <= yoe <= 9.0:
        exp_score = 10.0
        if 6.0 <= yoe <= 8.0:
            exp_score += 2.0
    elif 4.0 <= yoe < 5.0:
        exp_score = 6.0
    elif 9.0 < yoe <= 11.0:
        exp_score = 7.0
    elif 3.0 <= yoe < 4.0:
        exp_score = 3.0
    elif 11.0 < yoe <= 14.0:
        exp_score = 3.0
    else:
        exp_score = 0.0
        
    # 5. Title & Domain Match (Senior AI Engineer)
    title_score = 0.0
    target_title_keywords = ["ml", "machine learning", "ai", "nlp", "computer vision", "data scientist", "deep learning", "search", "retrieval", "recommendation"]
    if any(kw in current_title for kw in target_title_keywords):
        title_score = 15.0
        if "senior" in current_title or "lead" in current_title:
            title_score += 5.0
    elif any(kw in current_title for kw in ["software engineer", "backend", "developer", "data engineer"]):
        title_score = 8.0
        if "senior" in current_title or "lead" in current_title:
            title_score += 2.0
            
    # 6. Skills Score
    core_skills = ["embeddings", "retrieval", "vector search", "faiss", "sentence transformers", "pytorch", "tensorflow", "nlp", "information retrieval", "ranking", "milvus", "pinecone", "qdrant", "weaviate", "elasticsearch", "opensearch", "bge", "e5"]
    nice_skills = ["lora", "qlora", "peft", "llm fine-tuning", "fine-tuning", "learning-to-rank", "xgboost", "distributed systems", "open-source", "fastapi", "docker", "kubernetes", "python", "git"]
    
    skills_score = 0.0
    matched_skills = []
    
    prof_weights = {"expert": 1.0, "advanced": 0.8, "intermediate": 0.5, "beginner": 0.2}
    
    for sk in skills:
        name = sk.get("name", "").lower()
        prof = sk.get("proficiency", "beginner")
        dur = sk.get("duration_months", 0)
        
        weight = prof_weights.get(prof, 0.2)
        dur_years = dur / 12.0
        
        if any(cs in name for cs in core_skills):
            skills_score += 4.0 * weight * (1.0 + min(dur_years, 5.0) * 0.2)
            matched_skills.append(sk.get("name"))
        elif any(ns in name for ns in nice_skills):
            skills_score += 1.5 * weight * (1.0 + min(dur_years, 5.0) * 0.1)
            matched_skills.append(sk.get("name"))
            
    # 7. Semantic Match
    semantic_score = 0.0
    jd_keywords = [
        "rag", "embeddings", "retrieval", "vector search", "vector database", "faiss", "pinecone", 
        "milvus", "qdrant", "weaviate", "ranking", "rerank", "ndcg", "mrr", "map", "a/b testing", 
        "fine-tuning", "lora", "qlora", "peft", "applied ml", "nlp", "information retrieval", 
        "recommendation", "product company"
    ]
    
    full_text = f"{headline} {summary}"
    for job in history:
        full_text += f" {job.get('title', '')} {job.get('description', '')}"
    for proj in cand.get("projects", []):
        full_text += f" {proj.get('name', '')} {proj.get('description', '')} {proj.get('impact', '')}"
        
    full_text_lower = full_text.lower()
    for kw in jd_keywords:
        count = full_text_lower.count(kw)
        if count > 0:
            semantic_score += 1.0 * min(count, 3)
            
    # 8. Location Match
    location_score = 0.0
    indian_cities = ["pune", "noida", "hyderabad", "mumbai", "delhi", "ncr", "bangalore", "bengaluru", "chennai"]
    
    signals = cand.get("redrob_signals", {})
    willing_to_relocate = signals.get("willing_to_relocate", False)
    
    is_in_india = (country == "india") or any(city in location for city in indian_cities)
    if is_in_india:
        location_score = 5.0
        if any(pref in location for pref in ["pune", "noida"]):
            location_score += 3.0
    else:
        if willing_to_relocate:
            location_score = 3.0
        else:
            location_score = -10.0
            
    # 9. Notice Period Match
    notice_days = signals.get("notice_period_days", 90)
    notice_score = 0.0
    if notice_days <= 30:
        notice_score = 5.0
    elif notice_days <= 60:
        notice_score = 2.0
    elif notice_days > 90:
        notice_score = -3.0
        
    # 10. Behavioral & Activity Signals Multiplier
    rrr = signals.get("recruiter_response_rate", 0.5)
    otw = signals.get("open_to_work_flag", False)
    otw_bonus = 2.0 if otw else 0.0
    
    last_active = parse_date(signals.get("last_active_date"))
    recency_multiplier = 1.0
    if last_active:
        days_inactive = (datetime(2026, 6, 13) - last_active).days
        if days_inactive > 180:
            recency_multiplier = 0.6
        elif days_inactive > 90:
            recency_multiplier = 0.8
        elif days_inactive <= 30:
            recency_multiplier = 1.1
            
    roles_count = len(history)
    stability_score = 0.0
    if roles_count > 0:
        avg_tenure = yoe / roles_count
        if avg_tenure < 1.5 and roles_count >= 2:
            stability_score = -5.0
        elif avg_tenure >= 3.0:
            stability_score = 3.0
            
    base_score = (
        exp_score + 
        title_score + 
        skills_score + 
        semantic_score + 
        location_score + 
        notice_score + 
        otw_bonus + 
        stability_score
    )
    
    final_score = base_score * recency_multiplier * (0.5 + 0.5 * rrr)
    return final_score, matched_skills, ""

def generate_reasoning(cand, matched_skills):
    profile = cand.get("profile", {})
    yoe = profile.get("years_of_experience", 0.0)
    title = profile.get("current_title", "Engineer")
    loc = profile.get("location", "India")
    
    skills_str = ", ".join(matched_skills[:3]) if matched_skills else "applied ML"
    
    projects = cand.get("projects", [])
    proj_text = ""
    if projects:
        proj_text = f" Shipped '{projects[0].get('name')}' using {projects[0].get('technologies', ['Python'])[0]}."
        
    rrr = cand.get("redrob_signals", {}).get("recruiter_response_rate", 0.5)
    
    reasoning = f"{title} with {yoe:.1f} years of experience. Strong skillset in {skills_str}.{proj_text} Based in {loc} with {int(rrr*100)}% response rate."
    return reasoning

def main():
    parser = argparse.ArgumentParser(description="Rank candidates for Senior AI Engineer JD.")
    parser.add_argument("--candidates", required=True, help="Path to candidates.jsonl")
    parser.add_argument("--out", required=True, help="Path to output CSV")
    args = parser.parse_args()
    
    scored_candidates = []
    
    print(f"Reading candidates from {args.candidates}...")
    with open(args.candidates, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            cand = json.loads(line)
            score, matched_skills, _ = evaluate_candidate(cand)
            if score > -100.0:  # Skip filtered out candidates
                scored_candidates.append((score, matched_skills, cand))
                
    # Sort by score descending, then candidate_id ascending for deterministic tie-breaker
    scored_candidates.sort(key=lambda x: (-x[0], x[2].get("candidate_id")))
    
    print(f"Scored {len(scored_candidates)} candidates. Writing top 100 to {args.out}...")
    
    # Write top 100
    with open(args.out, "w", encoding="utf-8", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["candidate_id", "rank", "score", "reasoning"])
        
        for idx, (score, matched_skills, cand) in enumerate(scored_candidates[:100], 1):
            cid = cand.get("candidate_id")
            reasoning = generate_reasoning(cand, matched_skills)
            writer.writerow([cid, idx, round(score, 4), reasoning])
            
    print("Ranking and CSV generation completed successfully.")

if __name__ == "__main__":
    main()
