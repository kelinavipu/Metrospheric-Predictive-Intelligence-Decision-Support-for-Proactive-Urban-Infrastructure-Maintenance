"""
UrbanPulse End-to-End Demo Scenario Runner (Section 18)
Executes the complete operational scenario:
1. Citizen complaint submission & NLP processing
2. Entity extraction & GIS linkage to WM-0042
3. Health Index degradation & Critical alert triggering
4. MILP optimization & corridor job bundling along MG Road
5. Planner approval & Field crew work order dispatch
6. Crew completion feedback loop & health restoration
7. What-If annual policy comparison
"""

import json
from typing import Dict, Any
from backend.app.nlp.engine import nlp_engine
from backend.app.db.repository import Repository
from backend.app.db.database import get_db
from backend.app.api.v1.optimize_router import optimize_budget, run_simulation
from backend.app.schemas.schemas import BudgetOptimizeRequest, SimulationRequest

class DemoScenarioRunner:
    @staticmethod
    def run_full_scenario() -> Dict[str, Any]:
        results = {}

        # ----------------------------------------------------
        # Step 1 & 2: Citizen complaint submission & NLP
        # ----------------------------------------------------
        complaint_text = "Water is bubbling up near the bus stop opposite City Hospital on MG Road, been there since morning, road is getting slippery."
        analysis = nlp_engine.analyze(complaint_text, lat=12.9716, lon=77.5946)
        
        assert analysis["category"] == "water_leak", f"Expected water_leak, got {analysis['category']}"
        assert analysis["severity"] == 3, f"Expected severity 3, got {analysis['severity']}"
        assert analysis["urgency"] == "expedited", f"Expected expedited, got {analysis['urgency']}"
        assert analysis["linked_asset"] is not None, "Failed to link asset"
        assert analysis["linked_asset"]["asset_id"] == "WM-0042", f"Expected WM-0042, got {analysis['linked_asset']['asset_id']}"
        assert analysis["linked_asset"]["confidence"] >= 0.80, f"Expected confidence >= 0.80, got {analysis['linked_asset']['confidence']}"
        
        linked_id = analysis["linked_asset"]["asset_id"]
        results["step_1_nlp"] = {
            "text": complaint_text,
            "category": analysis["category"],
            "severity": analysis["severity"],
            "urgency": analysis["urgency"],
            "linked_asset": analysis["linked_asset"]
        }

        # ----------------------------------------------------
        # Step 3 & 4: Asset health drops & Critical alert fires
        # ----------------------------------------------------
        with get_db() as conn:
            # Drop health index and raise failure risk
            conn.execute("""
            UPDATE asset_health 
            SET health_index = 28.5, trend = 'declining'
            WHERE asset_id = ?
            """, [linked_id])

            conn.execute("""
            UPDATE predictions
            SET p_fail_30d = 0.82, p_fail_90d = 0.94, rul_days_median = 18.0
            WHERE asset_id = ?
            """, [linked_id])

            conn.execute("""
            UPDATE risk_scores
            SET likelihood = 0.94, risk_score = 0.88, risk_band = 'critical'
            WHERE asset_id = ?
            """, [linked_id])

            # Trigger Critical alert
            conn.execute("""
            INSERT OR REPLACE INTO alerts (alert_id, created_at, asset_id, kind, severity, message, state)
            VALUES ('ALT-DEMO-01', '2026-09-30T14:00:00Z', ?, 'predicted_failure', 'critical',
                    'URGENT: Imminent main failure on MG Road near City Hospital. Severe leak confirmed.', 'active')
            """, [linked_id])

        updated_asset = Repository.get_asset_by_id(linked_id)
        active_alerts = Repository.get_alerts(state="active", limit=5)
        
        results["step_2_alert"] = {
            "asset_id": linked_id,
            "new_health_index": updated_asset["health_index"],
            "new_p_fail_30d": updated_asset["p_fail_30d"],
            "risk_band": updated_asset["risk_band"],
            "alert": next((a for a in active_alerts if a["asset_id"] == linked_id), None)
        }

        # ----------------------------------------------------
        # Step 5: Optimization & Corridor Job Bundling
        # ----------------------------------------------------
        opt_req = BudgetOptimizeRequest(total_budget=300000.0, safety_override=True)
        opt_res = optimize_budget(opt_req)
        
        # Verify WM-0042 is funded in the top interventions
        funded_ids = [item["asset_id"] for item in opt_res["interventions"]]
        assert linked_id in funded_ids, f"Expected {linked_id} to be funded in optimization"

        results["step_3_optimization"] = {
            "total_allocated": opt_res["total_allocated"],
            "total_risk_reduced": opt_res["total_risk_reduced"],
            "roi_multiple": opt_res["roi_multiple"],
            "wm42_funded": True
        }

        # ----------------------------------------------------
        # Step 6: Approval, Dispatch, and Crew Completion
        # ----------------------------------------------------
        wo_id = "WO-DEMO-MG01"
        with get_db() as conn:
            # Bundle WM-0042 with adjacent preventive jobs on MG Road
            conn.execute("""
            INSERT OR REPLACE INTO work_orders (
                wo_id, asset_ids, type, scheduled_start, scheduled_end, crew_id, est_cost, est_hours, status, source, rationale
            ) VALUES (?, '["WM-0042", "RD-0108"]', 'corrective', '2026-10-01', '2026-10-02', 'CRW-01', 12500.0, 6.0, 'scheduled', 'predicted',
                     'Emergency main replacement bundled with road resurfacing on MG Road')
            """, [wo_id])

            # Crew marks complete
            conn.execute("""
            UPDATE work_orders 
            SET status = 'completed', actual_cost = 11800.0, actual_hours = 5.5, outcome = 'Repaired joint and restored flow'
            WHERE wo_id = ?
            """, [wo_id])

            # Restore health
            conn.execute("UPDATE asset_health SET health_index = 96.0, trend = 'improving' WHERE asset_id = ?", [linked_id])
            conn.execute("UPDATE predictions SET p_fail_30d = 0.02, p_fail_90d = 0.04, rul_days_median = 365.0 WHERE asset_id = ?", [linked_id])
            conn.execute("UPDATE risk_scores SET risk_score = 0.04, risk_band = 'low' WHERE asset_id = ?", [linked_id])
            conn.execute("UPDATE alerts SET state = 'resolved' WHERE asset_id = ?", [linked_id])

        restored_asset = Repository.get_asset_by_id(linked_id)
        results["step_4_completion"] = {
            "wo_id": wo_id,
            "restored_health_index": restored_asset["health_index"],
            "restored_p_fail_90d": restored_asset["p_fail_90d"],
            "restored_risk_band": restored_asset["risk_band"]
        }

        # ----------------------------------------------------
        # Step 7: What-If Simulator Policy Savings
        # ----------------------------------------------------
        sim_res = run_simulation(SimulationRequest(horizon_years=3, weather_severity=1.0))
        assert sim_res["cost_savings_pct"] >= 15.0, f"Expected savings >= 15%, got {sim_res['cost_savings_pct']}%"

        results["step_5_simulation"] = {
            "savings_pct": sim_res["cost_savings_pct"],
            "reactive_cost": sim_res["reactive"]["total_cost"],
            "predictive_cost": sim_res["predictive"]["total_cost"]
        }


        return results

runner = DemoScenarioRunner()
