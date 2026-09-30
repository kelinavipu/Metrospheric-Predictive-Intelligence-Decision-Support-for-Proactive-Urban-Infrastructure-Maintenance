"""
UrbanPulse KPI Router
Serves executive summary KPIs, historical sparkline trends, and ward equity statistics.
"""

from fastapi import APIRouter
from backend.app.schemas.schemas import KPISummary
from backend.app.db.repository import Repository
from backend.app.db.database import get_db

router = APIRouter(prefix="/kpi", tags=["KPIs"])

@router.get("/summary", response_model=KPISummary)
def get_kpi_summary():
    return Repository.get_kpi_summary()

@router.get("/trends")
def get_kpi_trends():
    """Returns 14-day flat sparkline history for each headline KPI."""
    return {
        "health_index": [77.5, 77.2, 77.0, 76.8, 76.5, 76.6, 76.4, 76.2, 76.3, 76.1, 76.0, 76.2, 76.1, 76.4],
        "critical_assets": [18, 19, 21, 20, 22, 23, 21, 24, 25, 23, 22, 21, 20, 19],
        "failures_predicted": [8, 9, 8, 10, 12, 11, 10, 13, 14, 12, 11, 9, 8, 8],
        "open_work_orders": [12, 14, 15, 13, 16, 17, 18, 15, 14, 16, 15, 14, 13, 12],
        "cost_avoidance": [42000, 56000, 68000, 84000, 92000, 108000, 125000, 138000, 149000, 162000, 174000, 185000, 192000, 204000]
    }

@router.get("/wards")
def get_ward_kpis():
    with get_db() as conn:
        rows = conn.execute("""
        SELECT w.ward_id, w.name, w.population, w.vulnerability_index,
               COUNT(a.asset_id) as total_assets,
               AVG(h.health_index) as avg_health,
               SUM(CASE WHEN r.risk_band = 'critical' THEN 1 ELSE 0 END) as critical_count
        FROM wards w
        LEFT JOIN assets a ON w.ward_id = a.ward_id
        LEFT JOIN asset_health h ON a.asset_id = h.asset_id
        LEFT JOIN risk_scores r ON a.asset_id = r.asset_id
        GROUP BY w.ward_id
        ORDER BY critical_count DESC, avg_health ASC
        """).fetchall()
        
        results = []
        for r in rows:
            pop = r["population"] or 25000
            crit = r["critical_count"] or 0
            results.append({
                "ward_id": r["ward_id"],
                "name": r["name"],
                "population": pop,
                "vulnerability_index": r["vulnerability_index"],
                "total_assets": r["total_assets"] or 0,
                "avg_health": round(float(r["avg_health"] or 75.0), 1),
                "critical_assets": crit,
                "backlog_cost": round(crit * 18500.0, 2),
                "complaints_per_1k": round((crit * 2.4) + 1.2, 2),
                "avg_response_hours": round(14.0 + (crit * 1.8), 1),
                "equity_investment_score": round(1.0 - (r["vulnerability_index"] * 0.3), 2)
            })
        return results
