"""
UrbanPulse Alerts Router
Provides alert querying, acknowledgment, and state resolution.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.schemas import AlertResponse, AlertAckRequest
from backend.app.db.repository import Repository
from backend.app.db.database import get_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    state: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    return Repository.get_alerts(state=state, limit=limit)

@router.post("/{alert_id}/ack")
def acknowledge_alert(alert_id: str, req: AlertAckRequest):
    success = Repository.acknowledge_alert(alert_id, req.acknowledged_by)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "acknowledged", "alert_id": alert_id}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    with get_db() as conn:
        cur = conn.execute("UPDATE alerts SET state = 'resolved' WHERE alert_id = ?", [alert_id])
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved", "alert_id": alert_id}
