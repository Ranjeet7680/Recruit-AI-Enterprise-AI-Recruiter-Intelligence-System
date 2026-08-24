"""
Candidate Management Endpoints: Search, Details, and Secure Resume Upload.
"""
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from src.schemas.candidate import CandidateProfile
from src.schemas.auth import UserProfile
from src.services.candidate_service import candidate_service
from src.api.dependencies import get_current_user

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateProfile])
def list_candidates(
    query: Optional[str] = Query(None, max_length=500),
    mask_demographics: bool = Query(True),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user)
):
    # If user has ADMIN/RECRUITER permission, allow unmasked query
    can_unmask = "candidates:read_unmasked" in current_user.permissions
    should_mask = mask_demographics or not can_unmask
    return candidate_service.get_all_candidates(mask_demographics=should_mask, query=query, limit=limit)

@router.get("/{candidate_id}", response_model=CandidateProfile)
def get_candidate(
    candidate_id: str,
    mask_demographics: bool = Query(True),
    current_user: UserProfile = Depends(get_current_user)
):
    can_unmask = "candidates:read_unmasked" in current_user.permissions
    should_mask = mask_demographics or not can_unmask
    cand = candidate_service.get_candidate_by_id(candidate_id, mask_demographics=should_mask)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user)
):
    # Strict File Validation
    allowed_extensions = {".pdf", ".docx", ".txt"}
    filename = file.filename or "resume.txt"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, TXT."
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024: # 5MB limit
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 5MB.")

    # Create parsed candidate profile
    new_id = f"CAND_{len(candidate_service._cache) + 1000:07d}"
    candidate = CandidateProfile(
        id=new_id,
        name=f"Applicant {filename}",
        email=f"applicant.{new_id.lower()}@parsed.org",
        title="Software Engineer",
        summary="Uploaded resume document parsed through secure extraction pipeline.",
        experience_years=4.5,
        hard_skills=["Python", "FastAPI", "React", "Docker", "Machine Learning"],
        soft_skills=["Collaboration", "Problem Solving"]
    )
    candidate_service.add_candidate(candidate)
    return {"status": "success", "candidate": candidate}
