"""
UrbanPulse Entity Linking & Geocoding
Links text entities and spatial coordinates to specific infrastructure assets.
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from backend.app.db.database import get_db

CATEGORY_TO_ASSET_TYPES = {
    "water_leak": ["water_main"],
    "pipe_burst": ["water_main"],
    "pothole": ["road_segment"],
    "road_surface_damage": ["road_segment", "manhole"],
    "sewer_blockage": ["sewer_line", "manhole"],
    "sewer_overflow": ["sewer_line", "manhole"],
    "drainage_flooding": ["storm_drain", "culvert"],
    "streetlight_outage": ["streetlight"],
    "signal_malfunction": ["traffic_signal"],
    "electrical_hazard": ["streetlight", "traffic_signal"],
    "bridge_defect": ["bridge"],
    "footpath_damage": ["footpath"],
    "manhole_cover": ["manhole", "sewer_line"]
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two lat/lon points."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def extract_coord_from_geom(geom: Any) -> Optional[Tuple[float, float]]:
    """Return representative (lat, lon) from GeoJSON Point or LineString."""
    if not isinstance(geom, dict):
        return None
    gtype = geom.get("type")
    coords = geom.get("coordinates")
    if not coords:
        return None
    if gtype == "Point":
        return coords[1], coords[0] # lat, lon
    elif gtype == "LineString" and len(coords) > 0:
        # Midpoint of linestring
        mid_idx = len(coords) // 2
        return coords[mid_idx][1], coords[mid_idx][0]
    return None

class EntityLinker:
    def link_asset(
        self,
        text: str,
        category: str,
        entities: List[Dict[str, Any]],
        lat: Optional[float] = None,
        lon: Optional[float] = None
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        # 1. Direct ASSET_ID matching
        for ent in entities:
            if ent["label"] == "ASSET_ID":
                asset_id = ent["text"].upper()
                with get_db() as conn:
                    row = conn.execute("SELECT asset_id, name, asset_type, geometry FROM assets WHERE asset_id = ?", [asset_id]).fetchone()
                    if row:
                        cand = {
                            "asset_id": row["asset_id"],
                            "name": row["name"],
                            "asset_type": row["asset_type"],
                            "distance_m": 0.0,
                            "confidence": 0.99
                        }
                        return cand, [cand]

        # 2. Extract Street & Landmark cues
        street_cue = next((e["text"].lower() for e in entities if e["label"] == "STREET"), "")
        landmark_cue = next((e["text"].lower() for e in entities if e["label"] == "LANDMARK"), "")
        target_types = CATEGORY_TO_ASSET_TYPES.get(category, ["water_main", "road_segment"])

        candidates: List[Dict[str, Any]] = []

        with get_db() as conn:
            # Query compatible assets, prioritizing street cue if present
            placeholders = ",".join("?" for _ in target_types)
            query = f"SELECT asset_id, name, asset_type, geometry, ward_id FROM assets WHERE asset_type IN ({placeholders})"
            params = list(target_types)
            if street_cue:
                query += " AND name LIKE ?"
                params.append(f"%{street_cue}%")
                
            rows = conn.execute(query, params).fetchall()
            if not rows:
                rows = conn.execute(f"SELECT asset_id, name, asset_type, geometry, ward_id FROM assets WHERE asset_type IN ({placeholders})", target_types).fetchall()
            
            for row in rows:
                name_lower = row["name"].lower()
                score = 0.4 # baseline compatible
                
                # Street matching
                if street_cue and street_cue in name_lower:
                    score += 0.35
                elif any(art.lower() in text.lower() and art.lower() in name_lower for art in ["mg road", "hospital road", "central cross", "market street"]):
                    score += 0.35
                    
                # Landmark matching (e.g. City Hospital near MG Road)
                if landmark_cue and any(lm_word in landmark_cue and lm_word in name_lower for lm_word in ["hospital", "park", "station", "hall", "library"]):
                    score += 0.30
                elif any(lm_word in text.lower() and lm_word in name_lower for lm_word in ["hospital", "park", "station", "hall", "library"]):
                    score += 0.25

                # Spatial distance if coordinates provided
                dist_m = 100.0
                if lat is not None and lon is not None:
                    import json
                    geom = json.loads(row["geometry"]) if isinstance(row["geometry"], str) else row["geometry"]
                    pt = extract_coord_from_geom(geom)
                    if pt:
                        dist_m = haversine_distance(lat, lon, pt[0], pt[1])
                        if dist_m < 250:
                            score += max(0.0, 0.3 * (1.0 - dist_m / 250.0))
                            
                confidence = min(0.95, round(score, 2))
                candidates.append({
                    "asset_id": row["asset_id"],
                    "name": row["name"],
                    "asset_type": row["asset_type"],
                    "distance_m": round(dist_m, 1),
                    "confidence": confidence
                })

        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        top_candidates = candidates[:5]
        best = top_candidates[0] if top_candidates and top_candidates[0]["confidence"] >= 0.5 else None
        
        return best, top_candidates

linker = EntityLinker()
