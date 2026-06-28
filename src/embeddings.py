import os
import numpy as np
from typing import List, Dict, Tuple, Any

from src.parser import CandidateProfile, JobDescription

# Dual-Mode Search Engine: Tries SentenceTransformers first, falls back to Scikit-learn TF-IDF if PyTorch is broken.
USE_FALLBACK = False
_EMBEDDING_MODEL = None

try:
    from sentence_transformers import SentenceTransformer
    import faiss
except Exception as e:
    print(f"Loading SentenceTransformers/FAISS failed: {e}. Activating robust TF-IDF fallback vector engine.")
    USE_FALLBACK = True

# Standard Scikit-learn TF-IDF fallback vector matcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_embedding_model():
    """Retrieves standard cached lightweight embedding model or returns None if in fallback mode."""
    global _EMBEDDING_MODEL, USE_FALLBACK
    if USE_FALLBACK:
        return None
    try:
        model_name = "all-MiniLM-L6-v2"
        if _EMBEDDING_MODEL is None:
            _EMBEDDING_MODEL = SentenceTransformer(model_name)
        return _EMBEDDING_MODEL
    except Exception as e:
        print(f"Error loading model: {e}. Switching to TF-IDF vector fallback.")
        USE_FALLBACK = True
        return None

def build_candidate_rich_text(profile: CandidateProfile) -> str:
    """Synthesizes structured career profiles into dense semantic descriptions."""
    experience_str = " ".join([
        f"Role: {exp.role} at {exp.company}. Achievements: {exp.description}."
        for exp in profile.experience_timeline
    ])
    
    projects_str = " ".join([
        f"Project: {proj.name}. Description: {proj.description}. Technologies: {', '.join(proj.technologies)}. Impact: {proj.impact}."
        for proj in profile.projects
    ])
    
    return (
        f"Profile: {profile.summary} "
        f"Skills: {', '.join(profile.hard_skills)}. "
        f"Soft qualities: {', '.join(profile.soft_skills)}. "
        f"History: {experience_str} "
        f"Projects: {projects_str} "
        f"Certs: {', '.join(profile.certifications)}."
    )

class VectorSearchEngine:
    """Manages dense/sparse vector representations and matching."""
    _embedding_cache = {}  # Cache candidate text -> embedding vector
    _query_cache = {}      # Cache query text -> query embedding vector

    def __init__(self, candidates: List[CandidateProfile]):
        global USE_FALLBACK
        self.candidates = candidates
        self.candidate_ids = [c.id for c in candidates]
        self.texts = [build_candidate_rich_text(c) for c in candidates]
        
        # Always initialize TF-IDF model so fallback works at runtime
        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        self.embeddings = self.vectorizer.fit_transform(self.texts)
        
        # Initialize standard model
        get_embedding_model()
        
        if USE_FALLBACK:
            self.index = None
        else:
            try:
                self.dimension = 384
                self.index = faiss.IndexFlatIP(self.dimension)
                self._index_candidates()
            except Exception as e:
                print(f"FAISS index setup failed: {e}. Switching to TF-IDF.")
                USE_FALLBACK = True
                self.index = None

    def _index_candidates(self):
        model = get_embedding_model()
        
        # Retrieve from cache or compute if missing
        embeddings_list = []
        texts_to_encode = []
        indices_to_encode = []
        
        for idx, text in enumerate(self.texts):
            if text in VectorSearchEngine._embedding_cache:
                embeddings_list.append(VectorSearchEngine._embedding_cache[text])
            else:
                embeddings_list.append(None)
                texts_to_encode.append(text)
                indices_to_encode.append(idx)
                
        if texts_to_encode:
            try:
                encoded = model.encode(texts_to_encode, show_progress_bar=False)
                for idx, vec in zip(indices_to_encode, encoded):
                    VectorSearchEngine._embedding_cache[self.texts[idx]] = vec
                    embeddings_list[idx] = vec
            except Exception as e:
                print(f"Error encoding embeddings during indexing: {e}")
                raise e
                
        embeddings = np.array(embeddings_list, dtype=np.float32)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)

    def search(self, query_text: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """Queries index and returns lists of matching (candidate_id, score) pairs."""
        if USE_FALLBACK:
            query_vec = self.vectorizer.transform([query_text])
            similarities = cosine_similarity(query_vec, self.embeddings).flatten()
            
            # Sort scores
            results = []
            for idx in np.argsort(similarities)[::-1]:
                results.append((self.candidate_ids[idx], float(similarities[idx])))
            return results[:top_k]
        else:
            try:
                model = get_embedding_model()
                
                # Retrieve query vector from cache or compute if missing
                if query_text in VectorSearchEngine._query_cache:
                    query_vector = VectorSearchEngine._query_cache[query_text]
                else:
                    query_vector = model.encode([query_text], show_progress_bar=False)
                    VectorSearchEngine._query_cache[query_text] = query_vector
                
                # Copy query vector to avoid mutating cached value
                query_vector_copy = np.array(query_vector, dtype=np.float32).copy()
                faiss.normalize_L2(query_vector_copy)
                
                scores, indices = self.index.search(query_vector_copy, min(top_k, len(self.candidate_ids)))
                results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx != -1:
                        results.append((self.candidate_ids[idx], float(score)))
                return results
            except Exception as e:
                print(f"Dense search failed: {e}. Running fallback TF-IDF match.")
                query_vec = self.vectorizer.transform([query_text])
                similarities = cosine_similarity(query_vec, self.embeddings).flatten()
                results = []
                for idx in np.argsort(similarities)[::-1]:
                    results.append((self.candidate_ids[idx], float(similarities[idx])))
                return results[:top_k]

    def find_similar_candidates(self, candidate_id: str, top_n: int = 4) -> List[Tuple[str, float]]:
        """
        K-Nearest Neighbors Candidate Similarity Discovery.
        Queries the index using a candidate's own embedding vector.
        """
        if candidate_id not in self.candidate_ids:
            return []
            
        target_idx = self.candidate_ids.index(candidate_id)
        
        if USE_FALLBACK:
            target_vec = self.embeddings[target_idx]
            similarities = cosine_similarity(target_vec, self.embeddings).flatten()
            
            results = []
            for idx in np.argsort(similarities)[::-1]:
                cid = self.candidate_ids[idx]
                if cid != candidate_id: # Exclude self
                    results.append((cid, float(similarities[idx])))
            return results[:top_n]
        else:
            try:
                model = get_embedding_model()
                target_cand = self.candidates[target_idx]
                target_text = build_candidate_rich_text(target_cand)
                target_vector = model.encode([target_text], show_progress_bar=False)
                faiss.normalize_L2(target_vector)
                
                scores, indices = self.index.search(np.array(target_vector, dtype=np.float32), min(top_n + 1, len(self.candidate_ids)))
                results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx != -1:
                        cid = self.candidate_ids[idx]
                        if cid != candidate_id:
                            results.append((cid, float(score)))
                return results[:top_n]
            except Exception as e:
                print(f"Dense similarity failed: {e}. Running fallback TF-IDF match.")
                target_vec = self.embeddings[target_idx]
                similarities = cosine_similarity(target_vec, self.embeddings).flatten()
                results = []
                for idx in np.argsort(similarities)[::-1]:
                    cid = self.candidate_ids[idx]
                    if cid != candidate_id:
                        results.append((cid, float(similarities[idx])))
                return results[:top_n]
