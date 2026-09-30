"""
End-to-End Section 18 Demo Scenario Verification Test
Tests the complete real-world workflow from citizen complaint to work order dispatch and restoration.
"""

import pytest
from backend.app.services.demo_runner import runner

def test_complete_section_18_demo_workflow():
    """Verify Section 18 demo scenario end-to-end."""
    results = runner.run_full_scenario()

    # Step 1: NLP Classification & Linking
    step1 = results["step_1_nlp"]
    assert step1["category"] == "water_leak"
    assert step1["severity"] == 3
    assert step1["urgency"] == "expedited"
    assert step1["linked_asset"]["asset_id"] == "WM-0042"
    assert step1["linked_asset"]["confidence"] >= 0.80

    # Step 2: Health Degradation & Critical Alert
    step2 = results["step_2_alert"]
    assert step2["new_health_index"] < 40.0
    assert step2["new_p_fail_30d"] > 0.70
    assert step2["risk_band"] == "critical"
    assert step2["alert"] is not None
    assert step2["alert"]["severity"] == "critical"

    # Step 3: Optimization & MG Road Bundling
    step3 = results["step_3_optimization"]
    assert step3["wm42_funded"] is True
    assert step3["roi_multiple"] >= 1.0

    # Step 4: Completion & Outcome Feedback
    step4 = results["step_4_completion"]
    assert step4["restored_health_index"] >= 90.0
    assert step4["restored_risk_band"] == "low"

    # Step 5: What-If Policy Savings
    step5 = results["step_5_simulation"]
    assert step5["savings_pct"] >= 15.0
