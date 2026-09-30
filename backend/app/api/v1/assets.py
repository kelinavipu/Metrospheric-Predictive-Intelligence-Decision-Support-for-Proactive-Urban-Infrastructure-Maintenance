"""
UrbanPulse Assets Router
Provides asset queries, GeoJSON feature collection, and full asset profile with timelines.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.schemas import AssetResponse, AssetDetailResponse
from backend.app.db.repository import Repository

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=List[AssetResponse])
def list_assets(
    asset_type: Optional[str] = Query(None),
    ward_id: Optional[str] = Query(None),
    risk_band: Optional[str] = Query(None),
    min_health: Optional[float] = Query(None),
    max_health: Optional[float] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    return Repository.get_assets(
        asset_type=asset_type,
        ward_id=ward_id,
        risk_band=risk_band,
        min_health=min_health,
        max_health=max_health,
        limit=limit,
        offset=offset
    )

@router.get("/geojson")
def get_geojson(limit: int = Query(5000, ge=1, le=20000)):
    return Repository.get_geojson(limit=limit)

@router.get("/wards")
def get_wards():
    return Repository.get_wards()

@router.get("/{asset_id}", response_model=AssetDetailResponse)
def get_asset_detail(asset_id: str):
    asset = Repository.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    return asset
