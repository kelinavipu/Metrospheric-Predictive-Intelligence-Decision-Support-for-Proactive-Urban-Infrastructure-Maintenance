"""
UrbanPulse Sensors Router
Serves live IoT telemetry, time-series windows, anomaly scores, and simulation ticks.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.db.database import get_db

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("")
def list_sensors():
    with get_db() as conn:
        rows = conn.execute("""
        SELECT DISTINCT s.sensor_id, s.asset_id, s.metric, a.name as asset_name, a.asset_type
        FROM sensor_readings s
        JOIN assets a ON s.asset_id = a.asset_id
        GROUP BY s.sensor_id
        LIMIT 50
        """).fetchall()
        
        sensors = []
        for r in rows:
            latest = conn.execute("""
            SELECT value, time, quality_flag FROM sensor_readings
            WHERE sensor_id = ? ORDER BY time DESC LIMIT 1
            """, [r["sensor_id"]]).fetchone()
            
            val = latest["value"] if latest else 0.0
            flag = latest["quality_flag"] if latest else "good"
            is_anomaly = flag == "anomaly" or val > 85.0
            
            sensors.append({
                "sensor_id": r["sensor_id"],
                "asset_id": r["asset_id"],
                "asset_name": r["asset_name"],
                "asset_type": r["asset_type"],
                "metric": r["metric"],
                "current_value": round(val, 2),
                "is_anomaly": is_anomaly,
                "status": "warning" if is_anomaly else "nominal"
            })
        return sensors

@router.get("/{sensor_id}/series")
def get_sensor_series(sensor_id: str, limit: int = Query(60, ge=10, le=500)):
    with get_db() as conn:
        rows = conn.execute("""
        SELECT time, metric, value, quality_flag
        FROM sensor_readings
        WHERE sensor_id = ?
        ORDER BY time DESC
        LIMIT ?
        """, [sensor_id, limit]).fetchall()
        
        if not rows:
            # Generate simulated clean nominal readings if not seeded yet
            import time as pytime
            import random
            now = int(pytime.time())
            points = []
            for i in range(limit):
                points.append({
                    "time": now - (limit - i) * 60,
                    "value": round(45.0 + random.gauss(0, 2.5), 2),
                    "is_anomaly": False
                })
            return {"sensor_id": sensor_id, "metric": "pressure", "series": points}
            
        points = []
        metric = rows[0]["metric"]
        for r in reversed(rows):
            points.append({
                "time": r["time"],
                "value": round(r["value"], 2),
                "is_anomaly": r["quality_flag"] == "anomaly"
            })
            
        return {"sensor_id": sensor_id, "metric": metric, "series": points}
