"""
UrbanPulse Predictions Router
Serves failure probabilities (30/90/180d), survival curves (RUL), and SHAP explainability.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.schemas import PredictionResponse, SurvivalCurveResponse
from backend.app.db.database import get_db
import json
import math

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/{asset_id}", response_model=PredictionResponse)
def get_prediction(asset_id: str):
    with get_db() as conn:
        row = conn.execute("""
        SELECT * FROM predictions WHERE asset_id = ? ORDER BY id DESC LIMIT 1
        """, [asset_id]).fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Predictions for asset '{asset_id}' not found")
            
        factors = json.loads(row["top_factors"]) if isinstance(row["top_factors"], str) else row["top_factors"]
        return {
            "asset_id": row["asset_id"],
            "as_of_date": row["as_of_date"],
            "model_version": row["model_version"],
            "p_fail_30d": row["p_fail_30d"],
            "p_fail_90d": row["p_fail_90d"],
            "p_fail_180d": row["p_fail_180d"],
            "rul_days_median": row["rul_days_median"],
            "rul_days_p10": row["rul_days_p10"],
            "rul_days_p90": row["rul_days_p90"],
            "top_factors": factors,
            "anomaly_score": row["anomaly_score"]
        }

@router.get("/survival/{asset_id}", response_model=SurvivalCurveResponse)
def get_survival_curve(asset_id: str):
    with get_db() as conn:
        row = conn.execute("""
        SELECT rul_days_median, p_fail_90d FROM predictions WHERE asset_id = ? ORDER BY id DESC LIMIT 1
        """, [asset_id]).fetchone()
        
        median_rul = row["rul_days_median"] if row else 180.0
        # Weibull survival curve computation: S(t) = exp(-(t / lambda)^k)
        # median = lambda * (ln 2)^(1/k) -> lambda = median / (ln 2)^(1/k)
        k = 1.8 # shape parameter indicating wear-out
        scale = median_rul / (math.log(2) ** (1.0 / k))
        
        curve = []
        for days in range(0, 365, 15):
            prob = math.exp(-((days / scale) ** k))
            curve.append({"days": days, "survival_prob": round(prob, 3)})
            
        return {
            "asset_id": asset_id,
            "median_rul_days": median_rul,
            "curve": curve
        }

@router.get("/{asset_id}/explain")
def get_explanation(asset_id: str):
    with get_db() as conn:
        row = conn.execute("""
        SELECT a.name, a.material, a.install_date, p.top_factors, p.p_fail_90d, h.health_index
        FROM assets a
        LEFT JOIN predictions p ON a.asset_id = p.asset_id
        LEFT JOIN asset_health h ON a.asset_id = h.asset_id
        WHERE a.asset_id = ?
        ORDER BY p.id DESC, h.id DESC LIMIT 1
        """, [asset_id]).fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        factors = json.loads(row["top_factors"]) if row["top_factors"] else []
        
        # Build plain language narrative
        bullets = []
        for f in factors[:4]:
            feat = f.get("feature", "")
            impact = f.get("impact", 0.0)
            desc = f.get("description", "")
            direction = "elevates failure risk" if impact > 0 else "moderates failure risk"
            bullets.append(f"{desc} ({direction} by {abs(round(impact*100, 1))}%)")
            
        return {
            "asset_id": asset_id,
            "p_fail_90d": row["p_fail_90d"] or 0.2,
            "health_index": row["health_index"] or 70.0,
            "top_factors": factors,
            "narrative_bullets": bullets
        }

@router.get("/top/failures")
def get_top_predicted_failures(limit: int = Query(10, ge=1, le=50)):
    with get_db() as conn:
        rows = conn.execute("""
        SELECT a.asset_id, a.name, a.asset_type, a.ward_id, p.p_fail_30d, p.p_fail_90d, p.rul_days_median, r.risk_band, r.risk_score
        FROM predictions p
        JOIN assets a ON p.asset_id = a.asset_id
        JOIN risk_scores r ON p.asset_id = r.asset_id
        ORDER BY p.p_fail_90d DESC, r.risk_score DESC
        LIMIT ?
        """, [limit]).fetchall()
        return [dict(r) for r in rows]
