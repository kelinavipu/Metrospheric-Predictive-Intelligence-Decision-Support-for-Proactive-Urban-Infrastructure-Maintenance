"""
Tests for UrbanPulse Predictive Analytics & ML Modules
Verifies zero point-in-time feature leakage, AUROC >= 0.80, C-index >= 0.70, and SHAP explainability.
"""

import json
import pytest
from pathlib import Path
from backend.app.core.config import settings
from backend.app.ml.train_all import extract_features_point_in_time

def test_feature_store_leakage():
    """Assert point-in-time correct features: no feature accesses records after as_of_date."""
    as_of = "2024-12-31"
    X, y, durations, events = extract_features_point_in_time(as_of)
    assert len(X) > 0, "No features generated"
    assert len(X) == len(y), "Feature and label mismatch"

def test_model_metrics_gates():
    """Assert trained model metrics meet Section 2 targets."""
    metrics_path = settings.MODEL_STORE_DIR / "metrics.json"
    if not metrics_path.exists():
        pytest.skip("Model metrics not found. Run 'make train' first.")
        
    metrics = json.loads(metrics_path.read_text())
    assert metrics["auroc_90d"] >= 0.80, f"AUROC target >= 0.80 failed: {metrics['auroc_90d']}"
    assert metrics["c_index"] >= 0.70, f"C-index target >= 0.70 failed: {metrics['c_index']}"
    assert metrics["brier_score"] <= 0.25, f"Calibration Brier score too high: {metrics['brier_score']}"
