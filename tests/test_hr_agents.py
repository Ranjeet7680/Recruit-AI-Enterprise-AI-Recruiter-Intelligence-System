"""
Unit & Integration Tests for HR Multi-Agent Automation System.
"""
from src.agents.job_agent import job_agent
from src.agents.resume_agent import resume_agent
from src.agents.matching_agent import matching_agent
from src.agents.interview_agent import interview_agent
from src.agents.communication_agent import communication_agent
from src.agents.analytics_agent import analytics_agent
from src.agents.orchestrator import orchestrator
from src.schemas.agents import FullWorkflowRequest
from src.schemas.job import JobDescription
from src.services.candidate_service import candidate_service

def test_job_agent():
    jd_raw = "We are seeking a Senior AI Engineer with PyTorch, FastAPI, RAG, and FAISS experience (5 to 8 years)."
    jd = job_agent.parse_job_description(jd_raw)
    assert jd.title == "Senior AI Engineer"
    assert "Pytorch" in jd.hard_skills or "PyTorch" in [s.title() for s in jd.hard_skills]
    assert jd.experience_level_min == 5.0

def test_resume_agent():
    candidates = resume_agent.screen_candidates(mask_demographics=True, limit=10)
    assert len(candidates) > 0
    assert "Candidate " in candidates[0].name
    gaps = resume_agent.analyze_resume_gaps(candidates[0])
    assert "verification_status" in gaps

def test_matching_agent():
    jd = JobDescription(title="Senior AI Engineer", hard_skills=["Python", "FastAPI"])
    matches = matching_agent.rank_candidates(jd=jd, top_k=3)
    assert len(matches) > 0
    assert matches[0].match_score >= 50.0

def test_interview_agent():
    candidates = candidate_service.get_all_candidates(mask_demographics=False, limit=1)
    cand = candidates[0]
    jd = JobDescription(title="Senior AI Engineer", hard_skills=["PyTorch", "FAISS"])
    questions = interview_agent.generate_tailored_questions(cand, jd, num_questions=4)
    assert len(questions) > 0
    assert questions[0].question is not None
    assert len(questions[0].expected_answer_points) > 0

def test_communication_agent():
    candidates = candidate_service.get_all_candidates(mask_demographics=False, limit=1)
    cand = candidates[0]
    jd = JobDescription(title="Senior AI Engineer")
    draft = communication_agent.draft_email(cand, jd, email_type="interview_invite", match_score=92.5)
    assert "Invitation to Technical Interview" in draft.subject
    assert draft.human_approval_required is True

def test_analytics_agent():
    insights = analytics_agent.generate_pipeline_insights(total_candidates=100, shortlisted_count=12)
    assert "funnel_conversion_rate" in insights
    assert insights["funnel_conversion_rate"] == "12.0%"

def test_full_orchestrator_workflow():
    req = FullWorkflowRequest(
        jd_text="Senior AI Engineer with PyTorch, FAISS, Docker, and RAG expertise.",
        top_k=3,
        generate_questions=True,
        draft_communications=True,
        mask_demographics=True
    )
    res = orchestrator.run_full_workflow(req)
    assert res.workflow_id.startswith("WF-")
    assert len(res.steps) == 6
    assert res.status == "awaiting_recruiter_approval"
    assert len(res.top_candidates) > 0
    assert len(res.interview_questions) > 0
    assert len(res.email_drafts) > 0

if __name__ == "__main__":
    test_job_agent()
    test_resume_agent()
    test_matching_agent()
    test_interview_agent()
    test_communication_agent()
    test_analytics_agent()
    test_full_orchestrator_workflow()
    print("ALL 7 HR MULTI-AGENT TESTS PASSED 100%!")
