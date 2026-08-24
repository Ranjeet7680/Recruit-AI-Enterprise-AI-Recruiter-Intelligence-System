"""
Pipeline Telemetry & Analytics Schemas.
"""
from typing import List, Dict
from pydantic import BaseModel

class PipelineStageStat(BaseModel):
    stage: str
    count: int
    dropOff: float
    fill: str

class ScoreDistributionBracket(BaseModel):
    bracket: str
    count: int
    label: str

class SkillDemandSupplyItem(BaseModel):
    skill: str
    required: int
    supply: int

class ClusterSummary(BaseModel):
    name: str
    value: int
    color: str

class PipelineTelemetryResponse(BaseModel):
    total_candidates: int
    pipeline_funnel: List[PipelineStageStat]
    score_distribution: List[ScoreDistributionBracket]
    skill_demand_supply: List[SkillDemandSupplyItem]
    talent_clusters: List[ClusterSummary]
    bias_reduction_stats: Dict[str, str]
