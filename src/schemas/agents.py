"""
Pydantic Schemas for HR Multi-Agent System.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class AgentType(str, Enum):
    JOB = "Job Description Agent"
    RESUME = "Resume Screening Agent"
    MATCHING = "Candidate Matching Agent"
    INTERVIEW = "Interview Agent"
    COMMUNICATION = "Communication Agent"
    ANALYTICS = "HR Analytics Agent"
    ORCHESTRATOR = "HR AI Orchestrator"

class TailoredQuestion(BaseModel):
    category: str = Field(..., example="Technical Depth")
    question: str
    target_competency: str
    expected_answer_points: List[str]
    difficulty: str = Field(default="Medium", example="Advanced")

class QuestionGenerationRequest(BaseModel):
    candidate_id: str
    jd_text: Optional[str] = None
    num_questions: int = Field(default=5, ge=1, le=10)

class EmailDraftRequest(BaseModel):
    candidate_id: str
    email_type: str = Field(default="interview_invite", example="interview_invite | rejection | offer_extended")
    custom_notes: Optional[str] = None

class EmailDraft(BaseModel):
    subject: str
    recipient_email: str
    recipient_name: str
    body: str
    email_type: str
    human_approval_required: bool = True
    approved_by_recruiter: bool = False

class AgentStepResult(BaseModel):
    agent: AgentType
    status: str = "completed"
    summary: str
    details: Dict[str, Any]
    duration_ms: int

class FullWorkflowRequest(BaseModel):
    jd_text: str = Field(..., min_length=10)
    top_k: int = Field(default=5, ge=1, le=20)
    generate_questions: bool = True
    draft_communications: bool = True
    mask_demographics: bool = True

class FullWorkflowResponse(BaseModel):
    workflow_id: str
    status: str = "awaiting_recruiter_approval"
    steps: List[AgentStepResult]
    top_candidates: List[Dict[str, Any]]
    interview_questions: Dict[str, List[TailoredQuestion]]
    email_drafts: Dict[str, EmailDraft]
    analytics_insights: Dict[str, Any]
    human_review_gate: Dict[str, Any]
