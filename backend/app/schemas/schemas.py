"""
UrbanPulse Pydantic Schemas
Strict API data contracts for validation, serialization, and OpenAPI documentation.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfile(BaseModel):
    sub: str
    name: str
    role: str

# Assets
class AssetBase(BaseModel):
    asset_id: str
    asset_type: str
    name: str
    geometry: Dict[str, Any]
    ward_id: str
    install_date: str
    material: str
    attributes: Dict[str, Any]
    design_life_years: int
    last_inspection_date: Optional[str] = None
    criticality_score: float = 0.5
    has_sensor: bool = False
    replacement_cost: float
    status: str = "active"

class AssetResponse(AssetBase):
    health_index: Optional[float] = None
    risk_score: Optional[float] = None
    risk_band: Optional[str] = "moderate"
    p_fail_90d: Optional[float] = None
    rul_days_median: Optional[float] = None

class AssetDetailResponse(AssetResponse):
    health_components: Optional[Dict[str, float]] = None
    p_fail_30d: Optional[float] = None
    p_fail_180d: Optional[float] = None
    rul_days_p10: Optional[float] = None
    rul_days_p90: Optional[float] = None
    top_factors: Optional[List[Dict[str, Any]]] = None
    timeline: List[Dict[str, Any]] = []
    linked_complaints: List[Dict[str, Any]] = []
    recent_sensors: List[Dict[str, Any]] = []

# Complaints
class ComplaintCreate(BaseModel):
    raw_text: str
    channel: str = "app"
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    reporter_id: Optional[str] = None

class ComplaintResponse(BaseModel):
    complaint_id: str
    received_at: str
    channel: str
    raw_text: str
    category: Optional[str] = None
    severity: int = 1
    urgency: str = "routine"
    extracted_entities: Optional[List[Dict[str, Any]]] = None
    linked_asset_id: Optional[str] = None
    link_confidence: float = 0.0
    duplicate_of: Optional[str] = None
    status: str = "open"
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    color_tag: Optional[str] = "grey"

class ComplaintStatusUpdate(BaseModel):
    status: str # open, triaged, dispatched, resolved
    notes: Optional[str] = None

class ComplaintReviewRequest(BaseModel):
    category: Optional[str] = None
    severity: Optional[int] = None
    urgency: Optional[str] = None
    linked_asset_id: Optional[str] = None

# NLP
class NLPAnalyzeRequest(BaseModel):
    text: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class EntitySpan(BaseModel):
    text: str
    label: str
    start: int
    end: int

class CandidateAsset(BaseModel):
    asset_id: str
    name: str
    asset_type: str
    distance_m: float
    confidence: float

class NLPAnalyzeResponse(BaseModel):
    category: str
    category_confidence: float
    severity: int
    urgency: str
    failure_mode: Optional[str] = None
    entities: List[EntitySpan] = []
    linked_asset: Optional[CandidateAsset] = None
    candidate_assets: List[CandidateAsset] = []
    problem: Optional[str] = None
    domain: Optional[str] = None
    place: Optional[Dict[str, Any]] = None
    time: Optional[Dict[str, Any]] = None
    impacts: Optional[List[str]] = []
    safety_flag: Optional[bool] = False
    safety_cues: Optional[List[str]] = []
    needs_review: Optional[bool] = False
    anaphora: Optional[Dict[str, Any]] = None
    inference_time_ms: float

class LocationCandidate(BaseModel):
    landmark_id: str
    name: str
    type: str
    sector: str
    address: str
    lat: float
    lon: float
    confidence: float
    explanation: Optional[str] = None

class NLPSuggestResponse(BaseModel):
    problem: str
    domain: str
    category: str
    category_confidence: float
    severity: int
    urgency: str
    safety_flag: bool
    safety_cues: List[str] = []
    impacts: List[str] = []
    time: Dict[str, Any]
    anaphora: Dict[str, Any]
    location_grounding: Dict[str, Any]
    needs_review: bool
    inference_time_ms: float

class NLPTrainResponse(BaseModel):
    status: str
    samples_trained: int
    vocabulary_size: int
    category_accuracy: float
    severity_accuracy: float
    model_path: str
    last_trained_at: str

# Health
class HealthIndexResponse(BaseModel):
    asset_id: str
    health_index: float
    confidence: float
    trend: str
    components: Dict[str, float]
    as_of_date: str

class HealthSummaryResponse(BaseModel):
    avg_health_index: float
    assets_healthy_count: int
    assets_fair_count: int
    assets_critical_count: int
    by_type: Dict[str, float]

# Predictions & Survival
class FactorExplanation(BaseModel):
    feature: str
    impact: float # positive increases failure probability, negative decreases
    description: str

class PredictionResponse(BaseModel):
    asset_id: str
    as_of_date: str
    model_version: str
    p_fail_30d: float
    p_fail_90d: float
    p_fail_180d: float
    rul_days_median: float
    rul_days_p10: float
    rul_days_p90: float
    top_factors: List[FactorExplanation]
    anomaly_score: float

class SurvivalPoint(BaseModel):
    days: int
    survival_prob: float

class SurvivalCurveResponse(BaseModel):
    asset_id: str
    median_rul_days: float
    curve: List[SurvivalPoint]

# Risk & Prioritization
class RiskWeights(BaseModel):
    likelihood: float = 0.35
    consequence: float = 0.35
    safety: float = 0.15
    equity: float = 0.10
    cost_effectiveness: float = 0.05

class RiskItem(BaseModel):
    asset_id: str
    name: str
    asset_type: str
    ward_id: str
    likelihood: float
    consequence: float
    risk_score: float
    priority_rank: int
    risk_band: str # low, moderate, high, critical
    rationale: str

class RiskOverrideRequest(BaseModel):
    asset_id: str
    override_band: str
    rationale: str

# Optimization & What-If
class BudgetOptimizeRequest(BaseModel):
    total_budget: float = 500000.0
    planning_horizon_days: int = 90
    min_spend_per_ward: float = 2000.0
    safety_override: bool = True
    equity_weight: float = 0.15

class WorkOrderProposal(BaseModel):
    asset_id: str
    action: str # inspect, repair, rehabilitate, replace
    cost: float
    est_hours: float
    risk_reduction: float
    benefit_cost_ratio: float
    priority_rank: int

class BudgetOptimizeResponse(BaseModel):
    total_allocated: float
    total_risk_reduced: float
    roi_multiple: float
    interventions: List[WorkOrderProposal]
    by_ward: Dict[str, float]
    by_type: Dict[str, float]

class SimulationRequest(BaseModel):
    horizon_years: int = 3
    budget_multiplier: float = 1.0
    weather_severity: float = 1.0
    crew_capacity: int = 10

class PolicyTrajectory(BaseModel):
    policy: str # reactive, time_based, predictive
    annual_costs: List[float]
    annual_failures: List[int]
    total_cost: float
    total_failures: int
    avg_downtime_hours: float

class SimulationResponse(BaseModel):
    reactive: PolicyTrajectory
    time_based: PolicyTrajectory
    predictive: PolicyTrajectory
    cost_savings_pct: float
    failure_reduction_pct: float

# Work Orders
class WorkOrderCreate(BaseModel):
    asset_ids: List[str]
    type: str = "corrective"
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    crew_id: Optional[str] = "CRW-01"
    est_cost: float = 4500.0
    est_hours: float = 4.0
    source: str = "predicted"
    rationale: Optional[str] = None

class WorkOrderResponse(BaseModel):
    wo_id: str
    asset_ids: List[str]
    type: str
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    crew_id: Optional[str] = None
    est_cost: float
    est_hours: float
    actual_cost: Optional[float] = None
    actual_hours: Optional[float] = None
    status: str
    source: str
    rationale: Optional[str] = None
    outcome: Optional[str] = None

# Alerts & Notifications
class AlertResponse(BaseModel):
    alert_id: str
    created_at: str
    asset_id: Optional[str] = None
    kind: str
    severity: str
    message: str
    acknowledged_by: Optional[str] = None
    state: str

class AlertAckRequest(BaseModel):
    acknowledged_by: str = "Admin"

# KPIs
class KPISummary(BaseModel):
    avg_health_index: float
    critical_assets_count: int
    high_assets_count: int
    predicted_failures_30d: int
    predicted_failures_90d: int
    open_work_orders: int
    backlog_cost: float
    avoided_cost_estimate: float
    system_readiness: str = "Optimal"
