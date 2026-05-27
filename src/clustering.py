import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer

from src.parser import CandidateProfile
from src.embeddings import get_embedding_model, build_candidate_rich_text

def cluster_candidates(candidates: List[CandidateProfile], n_clusters: int = 4) -> Tuple[pd.DataFrame, List[str]]:
    """
    Applies KMeans clustering on candidate embeddings (SentenceTransformers or Scikit-learn TF-IDF fallback)
    and reduces dimension to 2D using PCA.
    """
    if not candidates:
        return pd.DataFrame(), []

    texts = [build_candidate_rich_text(c) for c in candidates]
    
    # Check if standard embedding model is available
    model = get_embedding_model()
    
    if model is None:
        # Fallback: Generate TF-IDF vectors
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        embeddings = vectorizer.fit_transform(texts).toarray()
    else:
        try:
            embeddings = model.encode(texts, show_progress_bar=False)
        except Exception as e:
            print(f"Embedding encoding failed inside clusterer: {e}. Switching to TF-IDF fallback.")
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            embeddings = vectorizer.fit_transform(texts).toarray()

    # Normalize vectors
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

    # 2. KMeans Clustering
    n_cl = min(n_clusters, len(candidates))
    kmeans = KMeans(n_clusters=n_cl, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(embeddings)

    # 3. Dimensionality Reduction (PCA to 2D)
    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(embeddings)

    # 4. Infer Cluster Themes based on skills in each cluster
    cluster_themes = []
    for i in range(n_cl):
        indices = np.where(cluster_labels == i)[0]
        cluster_cands = [candidates[idx] for idx in indices]
        
        all_skills = []
        for c in cluster_cands:
            all_skills.extend([s.lower() for s in c.hard_skills])
            
        if any("pytorch" in s or "tensorflow" in s or "nlp" in s or "llm" in s for s in all_skills):
            theme = "AI & ML Specialists"
        elif any("kubernetes" in s or "aws" in s or "terraform" in s or "docker" in s for s in all_skills):
            theme = "Cloud & DevOps SREs"
        elif any("figma" in s or "ux" in s or "design" in s or "roadmap" in s for s in all_skills):
            theme = "Product & Designers"
        else:
            theme = "Enterprise Software Devs"
            
        cluster_themes.append(theme)

    # 5. Build DataFrame
    data = []
    for idx, c in enumerate(candidates):
        c_label = cluster_labels[idx]
        data.append({
            "id": c.id,
            "Name": c.name,
            "x": float(coords[idx][0]),
            "y": float(coords[idx][1]),
            "ClusterID": int(c_label),
            "Talent Category": cluster_themes[c_label],
            "Experience": f"{c.experience_years} years"
        })

    return pd.DataFrame(data), cluster_themes
