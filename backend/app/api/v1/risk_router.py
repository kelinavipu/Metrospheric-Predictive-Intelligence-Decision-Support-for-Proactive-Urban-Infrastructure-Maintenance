"""
UrbanPulse Risk & Prioritization Router
Calculates Risk = Likelihood x Consequence, multi-criteria priority ranking, and manual overrides.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query, Body
from backend.app.schemas.schemas import RiskWeights, RiskItem, RiskOverrideRequest
from backend.app.db.database import get_db
import datetime

router = APIRouter(prefix="/risk", tags=["Risk & Prioritization"])

CURRENT_WEIGHTS = RiskWeights()

@router.get("/weights")
def get_weights():
    return CURRENT_WEIGHTS.model_dump()

@router.put("/weights")
def update_weights(weights: RiskWeights):
    global CURRENT_WEIGHTS
    CURRENT_WEIGHTS = weights
    return {"status": "updated", "weights": CURRENT_WEIGHTS.model_dump()}

@router.get("/ranking", response_model=List[RiskItem])
def get_risk_ranking(limit: int = Query(25, ge=1, le=200)):
    with get_db() as conn:
        rows = conn.execute("""
        SELECT a.asset_id, a.name, a.asset_type, a.ward_id,
               r.likelihood, r.consequence, r.criticality, r.risk_score,
               r.priority_rank, r.risk_band,
               a.material, a.install_date
        FROM risk_scores r
        JOIN assets a ON r.asset_id = a.asset_id
        ORDER BY r.risk_score DESC
        LIMIT ?
        """, [limit]).fetchall()
        
        items = []
        for idx, r in enumerate(rows, start=1):
            rationale = f"{r['asset_type'].replace('_', ' ').title()} with high criticality ({r['criticality']:.2f}) and {r['likelihood']*100:.1f}% failure probability."
            items.append({
                "asset_id": r["asset_id"],
                "name": r["name"],
                "asset_type": r["asset_type"],
                "ward_id": r["ward_id"],
                "likelihood": round(r["likelihood"], 3),
                "consequence": round(r["consequence"], 3),
                "risk_score": round(r["risk_score"], 3),
                "priority_rank": idx,
                "risk_band": r["risk_band"],
                "rationale": rationale
            })
        return items

@router.post("/override")
def override_risk_band(req: RiskOverrideRequest):
    valid_bands = ["low", "moderate", "high", "critical"]
    if req.override_band.lower() not in valid_bands:
        raise HTTPException(status_code=400, detail=f"Invalid band. Must be one of {valid_bands}")
        
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    with get_db() as conn:
        conn.execute("""
        UPDATE risk_scores SET risk_band = ? WHERE asset_id = ?
        """, [req.override_band.lower(), req.asset_id])
        
        # Log to audit trail
        conn.execute("""
        INSERT INTO audit_logs (timestamp, user_id, action, entity_type, entity_id, details)
        VALUES (?, 'planner-admin', 'OVERRIDE_RISK_BAND', 'asset', ?, ?)
        """, [now_iso, req.asset_id, f"Overridden to {req.override_band}. Rationale: {req.rationale}"])
        
    return {"status": "success", "asset_id": req.asset_id, "new_band": req.override_band}
