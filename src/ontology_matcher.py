import os
import json
from typing import Dict, Any, List

ONTOLOGY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "ontology.json")

class SkillOntologyEngine:
    def __init__(self):
        self.ontology = {"skills": {}, "behavioral": {}}
        self._load_ontology()

    def _load_ontology(self):
        if os.path.exists(ONTOLOGY_FILE):
            try:
                with open(ONTOLOGY_FILE, "r", encoding="utf-8") as f:
                    self.ontology = json.load(f)
            except Exception as e:
                print(f"Error loading ontology: {e}")

    def evaluate_skill_fit(self, candidate_skills: List[str], target_skills: List[str]) -> float:
        """
        Computes an intelligent match overlap between candidate skills and target skills,
        crediting semantic equivalents (e.g. TensorFlow matches PyTorch at 75%).
        """
        if not target_skills:
            return 1.0

        matches_count = 0.0
        cand_lower = {s.lower() for s in candidate_skills}

        for target in target_skills:
            target_l = target.lower()
            
            # Direct match
            if any(target_l == c or target_l in c or c in target_l for c in cand_lower):
                matches_count += 1.0
                continue
                
            # Equivalent match using ontology
            equivalents = self.ontology.get("skills", {}).get(target_l, [])
            equiv_match = False
            for equiv in equivalents:
                if any(equiv == c for c in cand_lower):
                    matches_count += 0.75  # Credit 75% for semantic equivalents
                    equiv_match = True
                    break
            
            if not equiv_match and target_l in self.ontology.get("behavioral", {}):
                # Also check behavioral equivalents
                beh_equivs = self.ontology["behavioral"][target_l]
                for equiv in beh_equivs:
                    if any(equiv == c for c in cand_lower):
                        matches_count += 0.75
                        break

        return round(matches_count / len(target_skills), 2)
