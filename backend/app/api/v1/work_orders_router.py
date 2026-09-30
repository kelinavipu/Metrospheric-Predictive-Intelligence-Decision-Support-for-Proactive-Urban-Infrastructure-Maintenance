"""
UrbanPulse Work Orders Router
CRUD operations, lifecycle stage progression, and feedback loop on completion.
"""

import uuid
import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.schemas import WorkOrderCreate, WorkOrderResponse
from backend.app.db.database import get_db

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("")
def list_work_orders(status: Optional[str] = Query(None)):
    with get_db() as conn:
        query = "SELECT * FROM work_orders"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY CASE status WHEN 'in_progress' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'approved' THEN 3 WHEN 'proposed' THEN 4 ELSE 5 END"
        rows = conn.execute(query, params).fetchall()
        
        results = []
        for r in rows:
            item = dict(r)
            item["asset_ids"] = json.loads(item["asset_ids"]) if isinstance(item["asset_ids"], str) else item["asset_ids"]
            results.append(item)
        return results

@router.post("")
def create_work_order(data: dict):
    wo_id = data.get("wo_id") or f"WO-{uuid.uuid4().hex[:6].upper()}"
    asset_ids = data.get("asset_ids", [])
    if isinstance(asset_ids, str):
        asset_ids = [asset_ids]
        
    with get_db() as conn:
        conn.execute("""
        INSERT INTO work_orders (
            wo_id, asset_ids, type, scheduled_start, scheduled_end,
            crew_id, est_cost, est_hours, status, source, rationale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            wo_id,
            json.dumps(asset_ids),
            data.get("type", "corrective"),
            data.get("scheduled_start"),
            data.get("scheduled_end"),
            data.get("crew_id", "CRW-01"),
            data.get("est_cost", 4500.0),
            data.get("est_hours", 4.0),
            data.get("status", "proposed"),
            data.get("source", "predicted"),
            data.get("rationale", "Proactive repair based on high failure probability")
        ])
    return {"status": "created", "wo_id": wo_id}

@router.post("/{wo_id}/approve")
def approve_work_order(wo_id: str):
    with get_db() as conn:
        cur = conn.execute("UPDATE work_orders SET status = 'approved' WHERE wo_id = ?", [wo_id])
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Work order not found")
    return {"status": "approved", "wo_id": wo_id}

@router.post("/{wo_id}/start")
def start_work_order(wo_id: str):
    with get_db() as conn:
        cur = conn.execute("UPDATE work_orders SET status = 'in_progress' WHERE wo_id = ?", [wo_id])
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Work order not found")
    return {"status": "in_progress", "wo_id": wo_id}

@router.post("/{wo_id}/complete")
def complete_work_order(wo_id: str, actual_cost: float = 4200.0, actual_hours: float = 3.5):
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    with get_db() as conn:
        row = conn.execute("SELECT asset_ids FROM work_orders WHERE wo_id = ?", [wo_id]).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Work order not found")
            
        asset_ids = json.loads(row["asset_ids"]) if isinstance(row["asset_ids"], str) else row["asset_ids"]
        
        conn.execute("""
        UPDATE work_orders 
        SET status = 'completed', actual_cost = ?, actual_hours = ?, outcome = 'Successfully repaired and verified'
        WHERE wo_id = ?
        """, [actual_cost, actual_hours, wo_id])
        
        # Feedback loop: restore asset health and reset failure risk
        for aid in asset_ids:
            conn.execute("""
            UPDATE asset_health 
            SET health_index = 95.0, trend = 'improving'
            WHERE asset_id = ?
            """, [aid])
            
            conn.execute("""
            UPDATE predictions
            SET p_fail_30d = 0.02, p_fail_90d = 0.05, rul_days_median = 365.0
            WHERE asset_id = ?
            """, [aid])
            
            conn.execute("""
            UPDATE risk_scores
            SET risk_score = 0.08, risk_band = 'low'
            WHERE asset_id = ?
            """, [aid])
            
            # Record maintenance record
            rec_id = f"MNT-{uuid.uuid4().hex[:6].upper()}"
            conn.execute("""
            INSERT INTO maintenance_records (
                record_id, asset_id, date, type, description, cost, downtime_hours, crew_hours, failure_flag
            ) VALUES (?, ?, ?, 'preventive', 'Work order completed proactive renewal', ?, 0.0, ?, 0)
            """, [rec_id, aid, now_iso[:10], actual_cost, actual_hours])
            
            # Resolve associated active alerts
            conn.execute("UPDATE alerts SET state = 'resolved' WHERE asset_id = ?", [aid])
            
    return {"status": "completed", "wo_id": wo_id, "restored_assets": asset_ids}
