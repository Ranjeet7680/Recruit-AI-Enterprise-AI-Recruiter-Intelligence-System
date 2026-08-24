"""
Communication Agent: Drafts personalized recruiter communications with Human-in-the-Loop gating.
"""
from typing import Dict, Any, Optional
from src.schemas.agents import EmailDraft
from src.schemas.candidate import CandidateProfile
from src.schemas.job import JobDescription

class CommunicationAgent:
    """Specialized Agent for drafting recruiter outreach, interview invitations, and status notifications."""
    
    def draft_email(
        self,
        candidate: CandidateProfile,
        jd: JobDescription,
        email_type: str = "interview_invite",
        match_score: float = 88.0,
        custom_notes: Optional[str] = None
    ) -> EmailDraft:
        first_name = candidate.name.split(" ")[0]
        
        if email_type == "rejection":
            subject = f"Update on your application for {jd.title} at Nexora"
            body = f"""Dear {first_name},

Thank you very much for taking the time to apply for the {jd.title} position at Nexora.

While we were impressed by your background, we have decided to move forward with candidates whose experience more closely matches our immediate technical requirements for this specific opening.

We will keep your profile in our active talent pool for future opportunities that align with your skillset.

Warm regards,
Nexora Talent Acquisition Team"""
        elif email_type == "offer_extended":
            subject = f"Congratulations! Offer of Employment — {jd.title} at Nexora"
            body = f"""Dear {first_name},

On behalf of Team Nexora, we are thrilled to extend an offer of employment for the position of {jd.title}!

Our team was thoroughly impressed by your technical depth and problem-solving during the evaluation. We believe your expertise will be pivotal in driving our AI Recruiter Intelligence systems.

Your formal offer letter and compensation package details are attached for your review.

Congratulations, and welcome to Nexora!

Best regards,
Ranjeet Kumar
Lead AI Architect & Hiring Team"""
        else: # Default: interview_invite
            skills_highlight = ", ".join(candidate.hard_skills[:3]) if candidate.hard_skills else "Machine Learning"
            subject = f"Invitation to Technical Interview — {jd.title} at Nexora"
            body = f"""Dear {first_name},

Thank you for your interest in joining Nexora as a {jd.title}.

Our AI screening team was highly impressed by your expertise in {skills_highlight} (Match Rating: {match_score}%). We would love to invite you to a 45-minute live technical interview with our engineering team.

During this session, we will discuss your system architecture experience and walk through our vector retrieval pipelines.

Please select a convenient time on our scheduling portal or reply directly with your availability over the next 3 days.

Looking forward to speaking with you!

Best regards,
Nexora Recruitment Intelligence Team"""

        return EmailDraft(
            subject=subject,
            recipient_email=candidate.email,
            recipient_name=candidate.name,
            body=body,
            email_type=email_type,
            human_approval_required=True,
            approved_by_recruiter=False
        )

communication_agent = CommunicationAgent()
