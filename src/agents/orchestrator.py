"""
HR AI Orchestrator: Central coordinator managing the multi-agent recruitment pipeline.
Enforces Human-in-the-Loop (HITL) review before actions are executed.
"""
import time
import uuid
from typing import Dict, Any, List

from src.schemas.agents import (
    FullWorkflowRequest, FullWorkflowResponse, AgentStepResult, AgentType,
    TailoredQuestion, EmailDraft
)
from src.agents.job_agent import job_agent
from src.agents.resume_agent import resume_agent
from src.agents.matching_agent import matching_agent
from src.agents.interview_agent import interview_agent
from src.agents.communication_agent import communication_agent
from src.agents.analytics_agent import analytics_agent
from src.services.candidate_service import candidate_service
from src.core.logging import logger

class HRAIOrchestrator:
    """
    Central Controller for the Multi-Agent HR Pipeline:
    JD Agent -> Resume Agent -> Matching Agent -> Interview Agent -> Recruiter Review Gate -> Comm Agent -> Analytics Agent
    """
    
    def run_full_workflow(self, req: FullWorkflowRequest) -> FullWorkflowResponse:
        workflow_id = f"WF-{uuid.uuid4().hex[:8].upper()}"
        steps: List[AgentStepResult] = []
        
        # Step 1: Job Description Agent
        t0 = time.time()
        jd = job_agent.parse_job_description(req.jd_text)
        steps.append(AgentStepResult(
            agent=AgentType.JOB,
            status="completed",
            summary=f"Parsed '{jd.title}' with {len(jd.hard_skills)} core technical competencies.",
            details={"title": jd.title, "hard_skills": jd.hard_skills, "yoe_range": f"{jd.experience_level_min}-{jd.experience_level_max}"},
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Step 2: Resume Screening Agent
        t0 = time.time()
        candidates = resume_agent.screen_candidates(mask_demographics=req.mask_demographics, limit=50)
        steps.append(AgentStepResult(
            agent=AgentType.RESUME,
            status="completed",
            summary=f"Screened and verified {len(candidates)} candidate profiles from talent database.",
            details={"candidate_count": len(candidates), "demographic_masking": req.mask_demographics},
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Step 3: Candidate Matching Agent
        t0 = time.time()
        top_matches = matching_agent.rank_candidates(jd=jd, top_k=req.top_k, bias_reduction=req.mask_demographics)
        steps.append(AgentStepResult(
            agent=AgentType.MATCHING,
            status="completed",
            summary=f"Deterministically scored and ranked top {len(top_matches)} matches. Top score: {top_matches[0].match_score if top_matches else 0}%.",
            details={"ranked_count": len(top_matches), "top_score": top_matches[0].match_score if top_matches else 0},
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Step 4: Interview Agent (Generate tailored questions per top candidate)
        t0 = time.time()
        interview_questions_map: Dict[str, List[TailoredQuestion]] = {}
        if req.generate_questions:
            for match in top_matches[:3]:
                cand_full = candidate_service.get_candidate_by_id(match.candidate_id, mask_demographics=False)
                if cand_full:
                    qs = interview_agent.generate_tailored_questions(cand_full, jd, num_questions=4)
                    interview_questions_map[match.candidate_id] = qs
                    
        steps.append(AgentStepResult(
            agent=AgentType.INTERVIEW,
            status="completed",
            summary=f"Generated {sum(len(q) for q in interview_questions_map.values())} tailored technical & behavioral questions.",
            details={"candidates_with_questions": list(interview_questions_map.keys())},
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Step 5: Communication Agent (Draft interview invites)
        t0 = time.time()
        email_drafts_map: Dict[str, EmailDraft] = {}
        if req.draft_communications:
            for match in top_matches[:3]:
                cand_full = candidate_service.get_candidate_by_id(match.candidate_id, mask_demographics=False)
                if cand_full:
                    draft = communication_agent.draft_email(
                        candidate=cand_full,
                        jd=jd,
                        email_type="interview_invite",
                        match_score=match.match_score
                    )
                    email_drafts_map[match.candidate_id] = draft
                    
        steps.append(AgentStepResult(
            agent=AgentType.COMMUNICATION,
            status="completed",
            summary=f"Drafted {len(email_drafts_map)} personalized recruiter emails awaiting human approval.",
            details={"draft_count": len(email_drafts_map), "status": "PENDING_RECRUITER_APPROVAL"},
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Step 6: HR Analytics Agent
        t0 = time.time()
        analytics_data = analytics_agent.generate_pipeline_insights(
            total_candidates=len(candidates),
            shortlisted_count=len(top_matches)
        )
        steps.append(AgentStepResult(
            agent=AgentType.ANALYTICS,
            status="completed",
            summary=f"Generated pipeline velocity telemetry. Conversion rate: {analytics_data['funnel_conversion_rate']}.",
            details=analytics_data,
            duration_ms=int((time.time() - t0) * 1000)
        ))
        
        # Human-in-the-Loop Review Gate
        human_review_gate = {
            "required": True,
            "status": "AWAITING_RECRUITER_APPROVAL",
            "message": "AI Orchestration completed. Recruiter must review candidate matches and approve email drafts before dispatch.",
            "authorized_roles": ["ADMIN", "RECRUITER"]
        }
        
        logger.info(f"Completed multi-agent workflow {workflow_id} with {len(steps)} steps.")
        
        return FullWorkflowResponse(
            workflow_id=workflow_id,
            status="awaiting_recruiter_approval",
            steps=steps,
            top_candidates=[m.model_dump() for m in top_matches],
            interview_questions=interview_questions_map,
            email_drafts=email_drafts_map,
            analytics_insights=analytics_data,
            human_review_gate=human_review_gate
        )

orchestrator = HRAIOrchestrator()
