"""
Analytics & Telemetry Endpoints.
"""
from fastapi import APIRouter, Depends
from src.schemas.analytics import PipelineTelemetryResponse, PipelineStageStat, ScoreDistributionBracket, SkillDemandSupplyItem, ClusterSummary
from src.schemas.auth import UserProfile
from src.api.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])

@router.get("/analytics/pipeline-stats", response_model=PipelineTelemetryResponse)
def get_pipeline_telemetry(current_user: UserProfile = Depends(get_current_user)):
    return PipelineTelemetryResponse(
        total_candidates=58049,
        pipeline_funnel=[
            PipelineStageStat(stage="Sourced", count=58049, dropOff=0, fill="#6366f1"),
            PipelineStageStat(stage="Screened (AI)", count=12420, dropOff=78.6, fill="#8b5cf6"),
            PipelineStageStat(stage="Shortlisted", count=1840, dropOff=85.2, fill="#a855f7"),
            PipelineStageStat(stage="Live Interview", count=420, dropOff=77.2, fill="#00d4ff"),
            PipelineStageStat(stage="Offer Extended", count=96, dropOff=77.1, fill="#10b981"),
        ],
        score_distribution=[
            ScoreDistributionBracket(bracket="90–100%", count=128, label="Exceptional (Tier 1)"),
            ScoreDistributionBracket(bracket="80–89%", count=486, label="High Match (Tier 2)"),
            ScoreDistributionBracket(bracket="70–79%", count=1220, label="Qualified (Tier 3)"),
            ScoreDistributionBracket(bracket="60–69%", count=3450, label="Potential Match"),
            ScoreDistributionBracket(bracket="<60%", count=52765, label="Below Threshold"),
        ],
        skill_demand_supply=[
            SkillDemandSupplyItem(skill="PyTorch / TF", required=95, supply=72),
            SkillDemandSupplyItem(skill="Vector Search", required=90, supply=64),
            SkillDemandSupplyItem(skill="RAG & LLMs", required=88, supply=78),
            SkillDemandSupplyItem(skill="FastAPI / API", required=80, supply=89),
            SkillDemandSupplyItem(skill="Docker / K8s", required=75, supply=68),
            SkillDemandSupplyItem(skill="Fine-Tuning", required=85, supply=54),
        ],
        talent_clusters=[
            ClusterSummary(name="RAG & Retrieval Masters", value=34, color="#6366f1"),
            ClusterSummary(name="Full-Stack ML Engineers", value=28, color="#8b5cf6"),
            ClusterSummary(name="Deep Learning Specialists", value=22, color="#00d4ff"),
            ClusterSummary(name="Data & Infra Pioneers", value=16, color="#10b981"),
        ],
        bias_reduction_stats={
            "demographic_masking_rate": "100%",
            "score_disparity_reduction": "-84.2%",
            "decision_auditability": "100%"
        }
    )

@router.get("/cluster-talent")
def cluster_talent():
    return {
        "clusters": [
            {"id": 0, "name": "RAG & Vector Search Specialists", "count": 34},
            {"id": 1, "name": "Full-Stack AI Application Engineers", "count": 28},
            {"id": 2, "name": "Deep Learning & Model Training Experts", "count": 22},
            {"id": 3, "name": "Data Infrastructure & MLOps Engineers", "count": 16}
        ]
    }
