import os
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

from src.parser import CandidateProfile

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

try:
    import google.generativeai as genai
except Exception:
    genai = None

load_dotenv()

class CopilotEngine:
    def __init__(self, candidates: List[CandidateProfile], scores: List[Dict[str, Any]] = None):
        self.candidates = candidates
        self.scores = scores or []
        self.score_map = {s["candidate_id"]: s for s in self.scores}

    def process_query(self, query: str) -> str:
        """
        Processes recruiter natural language commands, supporting deterministic NLP
        searches for common queries, and falling back to a structured LLM response.
        """
        q = query.lower().strip().rstrip('?.!')
        
        # 1. Search by skills (e.g. "who knows docker")
        skill_match = re.search(r'(?:who knows|search for|find|show me|has|skill|skills)\s+(.+)', q)
        if skill_match:
            skill = skill_match.group(1).strip()
            matching_cands = []
            for c in self.candidates:
                if any(skill in s.lower() for s in c.hard_skills):
                    matching_cands.append(c.name)
            if matching_cands:
                return f"🔍 Here are the candidates who possess **{skill.title()}** skills:\n" + \
                       "\n".join([f"- **{name}**" for name in matching_cands])
            else:
                return f"🔍 I found no candidates with direct **{skill.title()}** skills in the database."

        # 2. Hidden Gems Detector
        if "hidden gem" in q or "underrated" in q:
            gems = []
            # Find candidates with rank > 3, but with innovation score >= 80% or agility >= 75%
            for c in self.candidates:
                score_info = self.score_map.get(c.id, {})
                breakdown = score_info.get("breakdown", {})
                final_score = score_info.get("final_score", 0.0)
                
                innovation_val = breakdown.get("innovation_score", breakdown.get("project_impact", 0.0))
                # Baseline heuristics for hidden gems: experience < 5 years, but innovation score >= 80%
                if c.experience_years <= 5.0 and innovation_val >= 80.0:
                    gems.append((c.name, final_score, c.experience_years, innovation_val))
                    
            if gems:
                gems = sorted(gems, key=lambda x: x[1], reverse=True)
                return "💎 **Hidden Gems Identified:** These candidates have relatively lower years of experience but demonstrate extremely high innovation/project metrics:\n\n" + \
                       "\n".join([f"- **{name}** (Experience: {exp} yrs, Innovation Fit: {inn}%, Match Score: {score}%)" for name, score, exp, inn in gems])
            else:
                return "💎 No hidden gems identified matching the baseline experience-to-impact threshold."

        # 3. Head-to-Head Comparison (e.g. "compare amit vs priya")
        if "vs" in q or "compare" in q:
            matched_names = []
            for c in self.candidates:
                # Token-based name matching to support partial names like "amit" or "priya"
                name_tokens = [t.lower() for t in re.findall(r'[a-zA-Z0-9]+', c.name) if len(t) > 2]
                for token in name_tokens:
                    if re.search(r'\b' + re.escape(token) + r'\b', q):
                        matched_names.append(c)
                        break
                    
            if len(matched_names) >= 2:
                c1, c2 = matched_names[0], matched_names[1]
                s1 = self.score_map.get(c1.id, {}).get("final_score", 0.0)
                s2 = self.score_map.get(c2.id, {}).get("final_score", 0.0)
                
                comparison = (
                    f"⚔️ **Head-to-Head Duel: {c1.name} vs {c2.name}**\n\n"
                    f"| Parameter | {c1.name} | {c2.name} |\n"
                    f"| :--- | :--- | :--- |\n"
                    f"| **Overall Fit Score** | {s1}% | {s2}% |\n"
                    f"| **Experience** | {c1.experience_years} years | {c2.experience_years} years |\n"
                    f"| **Top Hard Skills** | {', '.join(c1.hard_skills[:3])} | {', '.join(c2.hard_skills[:3])} |\n"
                    f"| **Key Project** | {c1.projects[0].name if c1.projects else 'N/A'} | {c2.projects[0].name if c2.projects else 'N/A'} |\n"
                    f"| **Degree** | {c1.education.degree} | {c2.education.degree} |\n\n"
                )
                
                if s1 > s2:
                    comparison += f"💡 **AI Recommendation:** **{c1.name}** is ranked higher primarily due to better semantic fit and skills match."
                else:
                    comparison += f"💡 **AI Recommendation:** **{c2.name}** is ranked higher due to stronger project alignment and tenure."
                return comparison

        # 4. Fallback to LLM if keys available
        if (os.environ.get("GEMINI_API_KEY") and genai) or (os.environ.get("OPENAI_API_KEY") and OpenAI):
            return self._llm_chat_fallback(query)
            
        return (
            "🤖 **TalentMind Copilot:** I can help you search, filter, and compare candidates! Try asking me:\n"
            "- *'Who knows PyTorch?'*\n"
            "- *'Are there any hidden gems?'*\n"
            "- *'Compare Amit vs Priya'*"
        )

    def _llm_chat_fallback(self, query: str) -> str:
        """Invokes LLM for multi-factor conversational analysis of candidate profiles."""
        candidates_summary = []
        for c in self.candidates:
            c_score = self.score_map.get(c.id, {}).get("final_score", 0.0)
            candidates_summary.append(
                f"ID: {c.id}, Name: {c.name}, Exp: {c.experience_years} yrs, "
                f"Skills: {', '.join(c.hard_skills[:4])}, Score: {c_score}%"
            )
        cand_str = "\n".join(candidates_summary)

        prompt = f"""
        You are 'TalentMind Copilot', an AI recruiting assistant. Answer the recruiter's query using the following candidate database:
        {cand_str}

        QUERY: {query}
        Provide a concise, highly professional recruiter response.
        """
        
        try:
            if os.environ.get("GEMINI_API_KEY") and genai:
                genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                return response.text.strip()
            elif os.environ.get("OPENAI_API_KEY") and OpenAI:
                client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            return "LLM provider package is not installed. Please use a direct keyword command."
        except Exception as e:
            return f"Error communicating with LLM Copilot: {e}. Please try a direct keyword command!"
