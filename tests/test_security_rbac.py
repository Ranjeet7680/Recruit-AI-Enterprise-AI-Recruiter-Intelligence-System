"""
Unit Tests for Security, JWT Authentication, RBAC, and PII Masking.
"""
from src.core.security import create_access_token, verify_token, UserRole, SecureAuditor
from src.schemas.candidate import CandidateProfile
from src.services.candidate_service import candidate_service

def test_jwt_token_flow():
    token = create_access_token("user-test-1", "test@nexora.ai", UserRole.RECRUITER)
    assert token is not None
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == "user-test-1"
    assert payload["role"] == "RECRUITER"

def test_rbac_authorization():
    auditor = SecureAuditor()
    assert auditor.authorize_action("ADMIN", "settings:write") is True
    assert auditor.authorize_action("VIEWER", "settings:write") is False
    assert auditor.authorize_action("RECRUITER", "candidates:read_unmasked") is True
    assert auditor.authorize_action("VIEWER", "candidates:read_unmasked") is False

def test_demographic_masking():
    cand = CandidateProfile(
        id="CAND_9999999",
        name="John Doe",
        email="john.doe@example.com",
        phone="+1-555-0199",
        summary="Experienced engineer",
        experience_years=6.0
    )
    masked = candidate_service.mask_profile(cand)
    assert masked.name == "Candidate CAND_9999999"
    assert "john.doe" not in masked.email
    assert masked.phone == "[REDACTED]"

if __name__ == "__main__":
    test_jwt_token_flow()
    test_rbac_authorization()
    test_demographic_masking()
    print("All security & RBAC unit tests passed successfully!")
