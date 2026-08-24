"""
End-to-End API Integration Tests for Nexora Enterprise Engine.
"""
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["service"] == "nexora-enterprise-engine"

def test_auth_and_rbac():
    # Login as Recruiter
    r = client.post(
        "/api/auth/token",
        json={"email": "recruiter@nexora.ai", "password": "password123", "role": "RECRUITER"}
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert token is not None

    # Get User Profile
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["role"] == "RECRUITER"

def test_candidate_retrieval_and_masking():
    r = client.get("/api/candidates?limit=5&mask_demographics=true")
    assert r.status_code == 200
    candidates = r.json()
    assert "Candidate " in candidates[0]["name"]
    assert "@anonymized.org" in candidates[0]["email"]
    assert candidates[0]["phone"] == "[REDACTED]"

def test_deterministic_matching():
    payload = {
        "jd_text": "Looking for a Senior AI Engineer with PyTorch, Embeddings, FAISS, and RAG expertise.",
        "top_k": 3,
        "bias_reduction": True
    }
    r = client.post("/api/match", json=payload)
    assert r.status_code == 200
    res = r.json()
    assert len(res["top_matches"]) > 0
    top = res["top_matches"][0]
    assert "match_score" in top
    assert top["match_score"] >= 70.0
    assert len(top["strengths"]) > 0

def test_copilot_assistant():
    payload = {
        "message": "Who is the best DevOps candidate?",
        "persona": "technical"
    }
    r = client.post("/api/copilot/chat", json=payload)
    assert r.status_code == 200
    res = r.json()
    assert "reply" in res
    assert "confidence" in res

def test_pipeline_telemetry():
    r = client.get("/api/analytics/pipeline-stats")
    assert r.status_code == 200
    stats = r.json()
    assert stats["total_candidates"] == 58049
    assert len(stats["pipeline_funnel"]) == 5

if __name__ == "__main__":
    test_health()
    test_auth_and_rbac()
    test_candidate_retrieval_and_masking()
    test_deterministic_matching()
    test_copilot_assistant()
    test_pipeline_telemetry()
    print("ALL 6 END-TO-END FASTAPI INTEGRATION TESTS PASSED 100%!")
