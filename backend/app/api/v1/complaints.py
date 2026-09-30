"""
UrbanPulse Complaints Router
Handles live complaint ingestion, synchronous NLP parsing, asset linkage, and human review feedback.
"""

import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Response
from backend.app.schemas.schemas import ComplaintCreate, ComplaintResponse, ComplaintReviewRequest, ComplaintStatusUpdate
from backend.app.db.repository import Repository
from backend.app.nlp.engine import nlp_engine
from backend.app.db.database import get_db
from backend.app.services.spreadsheet_db import sync_database_to_csv, get_csv_content, CSV_PATH

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def compute_color_tag(category: str, severity: int) -> str:
    if severity >= 4:
        return "red"
    cat = (category or "").lower()
    if any(k in cat for k in ["water", "pipe", "leak"]):
        return "blue"
    elif any(k in cat for k in ["road", "pothole", "footpath", "bridge", "surface"]):
        return "grey"
    elif any(k in cat for k in ["street", "light", "signal", "electric", "wire", "power", "hazard"]):
        return "amber"
    elif any(k in cat for k in ["sewer", "drainage", "manhole", "sanitation", "flood"]):
        return "brown"
    return "grey"

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    return Repository.get_complaints(limit=limit, offset=offset)

@router.post("", response_model=ComplaintResponse)
def submit_complaint(req: ComplaintCreate):
    # 1. Run NLP synchronously
    analysis = nlp_engine.analyze(req.raw_text, lat=req.lat, lon=req.lon)
    
    complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    
    linked_id = analysis["linked_asset"]["asset_id"] if analysis["linked_asset"] else None
    confidence = analysis["linked_asset"]["confidence"] if analysis["linked_asset"] else 0.0
    color_tag = compute_color_tag(analysis["category"], analysis["severity"])

    complaint_data = {
        "complaint_id": complaint_id,
        "received_at": now_iso,
        "channel": req.channel,
        "raw_text": req.raw_text,
        "language": "en",
        "reporter_id": req.reporter_id,
        "lat": req.lat,
        "lon": req.lon,
        "address": req.address,
        "color_tag": color_tag,
        "photo_url": req.photo_url,
        "category": analysis["category"],
        "subcategory": analysis["failure_mode"],
        "severity": analysis["severity"],
        "urgency": analysis["urgency"],
        "extracted_entities": analysis["entities"],
        "linked_asset_id": linked_id,
        "link_confidence": confidence,
        "duplicate_of": None,
        "status": "open"
    }
    
    Repository.insert_complaint(complaint_data)
    try:
        sync_database_to_csv()
    except Exception:
        pass
    
    # If high severity and linked to an asset, update asset health and post alert
    if linked_id and analysis["severity"] >= 3:
        with get_db() as conn:
            # Drop asset health
            conn.execute("""
            UPDATE asset_health 
            SET health_index = MAX(10.0, health_index - 18.0), trend = 'declining'
            WHERE asset_id = ?
            """, [linked_id])
            
            # Increase p_fail
            conn.execute("""
            UPDATE predictions
            SET p_fail_30d = MIN(0.95, p_fail_30d + 0.35),
                p_fail_90d = MIN(0.98, p_fail_90d + 0.30)
            WHERE asset_id = ?
            """, [linked_id])

            # Escalate risk score to Critical
            conn.execute("""
            UPDATE risk_scores
            SET likelihood = MIN(0.95, likelihood + 0.35),
                risk_score = MIN(0.98, risk_score + 0.35),
                risk_band = 'critical'
            WHERE asset_id = ?
            """, [linked_id])

        # Create alert
        alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        Repository.insert_alert({
            "alert_id": alert_id,
            "created_at": now_iso,
            "asset_id": linked_id,
            "kind": "predicted_failure",
            "severity": "critical" if analysis["severity"] >= 3 else "high",
            "message": f"Critical complaint on {linked_id}: {analysis['category'].replace('_', ' ').title()} - {req.raw_text[:70]}...",
            "acknowledged_by": None,
            "state": "active"
        })

    return complaint_data

@router.post("/{complaint_id}/review")
def review_complaint(complaint_id: str, req: ComplaintReviewRequest):
    with get_db() as conn:
        updates = []
        params = []
        if req.category:
            updates.append("category = ?")
            params.append(req.category)
        if req.severity is not None:
            updates.append("severity = ?")
            params.append(req.severity)
        if req.urgency:
            updates.append("urgency = ?")
            params.append(req.urgency)
        if req.linked_asset_id:
            updates.append("linked_asset_id = ?")
            params.append(req.linked_asset_id)
            updates.append("link_confidence = 1.0")

        if not updates:
            return {"status": "no change"}

        params.append(complaint_id)
        cur = conn.execute(f"UPDATE complaints SET {', '.join(updates)} WHERE complaint_id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Complaint not found")
            
        return {"status": "updated", "complaint_id": complaint_id}

@router.patch("/{complaint_id}/status")
def update_status(complaint_id: str, req: ComplaintStatusUpdate):
    success = Repository.update_complaint_status(complaint_id, req.status)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint not found")
    try:
        sync_database_to_csv()
    except Exception:
        pass
    return {"status": "ok", "complaint_id": complaint_id, "new_status": req.status}

@router.get("/export/csv")
def export_csv_database():
    content = get_csv_content()
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="metrospheric_database.csv"'
        }
    )

@router.get("/database/summary")
def get_database_summary():
    path = sync_database_to_csv()
    complaints = Repository.get_complaints(limit=5000)
    return {
        "filename": "metrospheric_database.csv",
        "file_path": str(path),
        "csv_file": str(path),
        "size_bytes": path.stat().st_size if path.exists() else 0,
        "total_records": len(complaints)
    }


