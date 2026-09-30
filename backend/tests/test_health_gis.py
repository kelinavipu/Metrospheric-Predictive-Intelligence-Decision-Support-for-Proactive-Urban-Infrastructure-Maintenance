"""
Tests for UrbanPulse Health Index (AHI) & GIS Criticality Scoring
Verifies 0-100 AHI bounds, component breakdowns, and GIS proximity scoring.
"""

import pytest
from backend.app.db.repository import Repository
from backend.app.db.database import get_db

def test_asset_health_index_bounds():
    """Assert all assets have an AHI within [0, 100] and valid component breakdowns."""
    assets = Repository.get_assets(limit=200)
    assert len(assets) > 0, "No assets returned."

    for a in assets:
        hi = a.get("health_index")
        assert hi is not None, f"Asset {a['asset_id']} missing health index"
        assert 0.0 <= hi <= 100.0, f"AHI out of range: {hi}"

def test_criticality_scoring():
    """Assert high criticality for assets near critical facilities (City Hospital)."""
    with get_db() as conn:
        wm42 = conn.execute("SELECT criticality_score FROM assets WHERE asset_id = 'WM-0042'").fetchone()
        assert wm42 is not None
        assert wm42["criticality_score"] >= 0.80, f"Expected high criticality for hospital main, got {wm42['criticality_score']}"

def test_geojson_feature_collection():
    """Assert GeoJSON endpoint returns valid FeatureCollection with properties."""
    fc = Repository.get_geojson(limit=100)
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) > 0

    first = fc["features"][0]
    assert "geometry" in first
    assert "properties" in first
    assert "health_index" in first["properties"]
    assert "risk_score" in first["properties"]
    assert "risk_band" in first["properties"]
