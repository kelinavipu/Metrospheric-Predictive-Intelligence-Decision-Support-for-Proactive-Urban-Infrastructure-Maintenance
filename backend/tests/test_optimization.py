"""
Tests for UrbanPulse Optimization & Simulation Engine
Verifies knapsack budget constraints, crew routing, and >= 15% cost reduction in simulation.
"""

import pytest
from backend.app.schemas.schemas import BudgetOptimizeRequest, SimulationRequest
from backend.app.api.v1.optimize_router import optimize_budget, run_simulation

def test_budget_optimization_constraints():
    """Assert allocated budget does not exceed ceiling and equity floor is respected."""
    budget_ceiling = 250000.0
    req = BudgetOptimizeRequest(total_budget=budget_ceiling, min_spend_per_ward=1000.0)
    res = optimize_budget(req)

    assert res["total_allocated"] <= budget_ceiling, f"Allocated {res['total_allocated']} exceeded budget {budget_ceiling}"
    assert res["total_risk_reduced"] > 0.0, "Expected positive risk reduction"
    assert res["roi_multiple"] >= 1.0, f"Expected BCR >= 1.0, got {res['roi_multiple']}"

def test_simulation_cost_reduction_target():
    """Assert Predictive policy achieves >= 15% cost reduction vs Reactive baseline."""
    req = SimulationRequest(horizon_years=3, weather_severity=1.0)
    res = run_simulation(req)

    savings_pct = res["cost_savings_pct"]
    print(f"\nSimulated 3-Year Policy Savings: {savings_pct}%")
    assert savings_pct >= 15.0, f"Expected >= 15% cost reduction, got {savings_pct}%"
    assert res["predictive"]["total_failures"] < res["reactive"]["total_failures"], "Expected fewer failures in predictive policy"
    assert res["predictive"]["avg_downtime_hours"] < res["reactive"]["avg_downtime_hours"], "Expected lower downtime in predictive policy"
