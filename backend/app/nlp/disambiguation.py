"""
Metrospheric Location Grounding & Disambiguation Engine
Grounds raw text mentions against the 45+ Nerul Spatial Ontology.
Features:
- Multi-factor scoring: text similarity, geo proximity, category compatibility, and popularity prior.
- Margin check between top-2 candidates to detect underspecified or polysemous mentions.
- Emits ranked candidate cards with confidence, coordinates, and clarifying questions.
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple
from backend.app.nlp.ontology import NERUL_LANDMARKS

# Ambiguous query triggers when ungrounded or underspecified
AMBIGUOUS_TRIGGERS = {
    "station": "Multiple railway stations serve Nerul. Which station is impacted?",
    "stn": "Multiple railway stations serve Nerul. Which station is impacted?",
    "hospital": "Multiple hospitals are located in Nerul. Which hospital are you near?",
    "garden": "Did you mean Wonders Park, Rock Garden, or the Jewel promenade?",
    "park": "Did you mean Wonders Park, Rock Garden, or the Jewel promenade?",
    "college": "Which academic campus are you referring to (SIES, D.Y. Patil, or Sterling)?",
    "school": "Which school in Nerul is affected (Apeejay, DAV, or others)?",
    "market": "Which market area are you referring to (Sector 9 Market or Station West)?",
    "mall": "Did you mean Seawoods Grand Central Mall?",
    "stadium": "Did you mean Dr. D.Y. Patil Sports Stadium in Sector 7?",
    "sector 19": "Did you mean Sector 19A (near Wonders Park) or Sector 19 East?"
}

# Compatibility weights between complaint category and landmark types
CATEGORY_LANDMARK_COMPATIBILITY = {
    "water_leak": {"road": 1.0, "sector": 0.9, "hospital": 0.8, "transit_hub": 0.8, "commercial": 0.7},
    "pipe_burst": {"road": 1.0, "hospital": 0.9, "transit_hub": 0.9, "sector": 0.9, "commercial": 0.8},
    "pothole": {"road": 1.0, "sector": 0.9, "transit_hub": 0.8, "park": 0.7},
    "road_surface_damage": {"road": 1.0, "sector": 0.9, "transit_hub": 0.8},
    "streetlight_outage": {"road": 1.0, "transit_hub": 0.9, "park": 0.9, "sector": 0.85},
    "signal_malfunction": {"road": 1.0, "transit_hub": 0.95, "commercial": 0.85},
    "electrical_hazard": {"road": 1.0, "sector": 0.95, "school": 0.9, "college": 0.9, "transit_hub": 0.9, "commercial": 0.85},
    "drainage_flooding": {"road": 1.0, "park": 0.9, "transit_hub": 0.9, "sector": 0.85},
    "sewer_overflow": {"sector": 1.0, "commercial": 0.9, "road": 0.85},
    "footpath_damage": {"transit_hub": 1.0, "commercial": 0.95, "hospital": 0.9, "road": 0.85}
}

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def compute_text_similarity(query_lower: str, landmark: Dict[str, Any]) -> Tuple[float, str]:
    """Calculates token overlap and exact substring match between query and landmark."""
    name_lower = landmark["name"].lower()
    
    # Exact full name match
    if name_lower in query_lower:
        return 1.0, f"Exact match with {landmark['name']}"
    
    # Check aliases
    for alias in landmark["aliases"]:
        if alias.lower() in query_lower:
            return 0.95, f"Matched via alias '{alias}'"
            
    # Token-based overlap
    q_tokens = set(re.findall(r"\w+", query_lower))
    name_tokens = set(re.findall(r"\w+", name_lower)) - {"dr", "dy", "the", "of", "and", "&"}
    
    overlap = q_tokens & name_tokens
    if overlap:
        # Check nearby roads or sector match in query
        sec = landmark.get("sector", "").lower()
        sec_match = sec and sec in query_lower
        roads = [r.lower() for r in landmark.get("nearby_roads", [])]
        road_match = any(r in query_lower for r in roads)
        
        ratio = len(overlap) / max(len(name_tokens), 1)
        boost = 0.2 if (sec_match or road_match) else 0.0
        score = min(0.92, (ratio * 0.7) + boost)
        return score, f"Partial keyword match on {list(overlap)}"
        
    # Check if nearby roads are mentioned
    for r in landmark.get("nearby_roads", []):
        if r.lower() in query_lower:
            return 0.65, f"Near {r}"
            
    return 0.0, ""

class DisambiguationEngine:
    def __init__(self):
        self.landmarks = NERUL_LANDMARKS

    def ground_location(
        self,
        text: str,
        category: str = "other",
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Ranks candidate landmarks for the input text, flags ambiguities,
        and generates clarifying prompts.
        """
        q_lower = text.lower()
        candidates: List[Dict[str, Any]] = []

        # Check for underspecified ambiguity triggers
        detected_triggers: List[Tuple[str, str]] = []
        for trigger, prompt in AMBIGUOUS_TRIGGERS.items():
            if re.search(rf"\b{re.escape(trigger)}\b", q_lower):
                detected_triggers.append((trigger, prompt))

        compat_map = CATEGORY_LANDMARK_COMPATIBILITY.get(category, {})

        # Check if any landmark is already explicitly matched by full name or alias
        explicit_matched_types = set()
        for lm in self.landmarks:
            s, _ = compute_text_similarity(q_lower, lm)
            if s >= 0.90:
                explicit_matched_types.add(lm["type"])

        for lm in self.landmarks:
            sim_score, reason = compute_text_similarity(q_lower, lm)
            # If query has an underspecified trigger and NO landmark of that type was explicitly matched, boost candidates
            for trig, _ in detected_triggers:
                if trig in ["station", "stn"] and lm["type"] == "transit_hub" and "transit_hub" not in explicit_matched_types:
                    sim_score = max(sim_score, 0.80 if "railway" in lm["name"].lower() else 0.55)
                    reason = "Candidate for station reference"
                elif trig in ["hospital"] and lm["type"] == "hospital" and "hospital" not in explicit_matched_types:
                    sim_score = max(sim_score, 0.75)
                    reason = "Candidate for hospital reference"
                elif trig in ["garden", "park"] and lm["type"] == "park" and "park" not in explicit_matched_types:
                    sim_score = max(sim_score, 0.75)
                    reason = "Candidate for park reference"

            if sim_score > 0.15:
                # Geo proximity factor
                geo_score = 0.5
                if user_lat is not None and user_lon is not None:
                    dist = haversine_m(user_lat, user_lon, lm["lat"], lm["lon"])
                    # Decays with distance in meters
                    geo_score = max(0.1, 1.0 - (dist / 3000.0))

                # Category compatibility factor
                type_compat = compat_map.get(lm["type"], 0.6)
                
                # Popularity prior
                pop = lm.get("popularity_prior", 0.5)

                # Point landmarks (hospitals, stadiums, stations, parks) have higher spatial specificity than general roads
                specificity = 0.15 if lm["type"] not in ["road", "sector"] else 0.0

                # Composite score
                final_score = (
                    (0.40 * sim_score) +
                    (0.20 * geo_score) +
                    (0.15 * type_compat) +
                    (0.10 * pop) +
                    specificity
                )

                candidates.append({
                    "landmark_id": lm["landmark_id"],
                    "name": lm["name"],
                    "aliases": lm.get("aliases", []),
                    "type": lm["type"],
                    "sector": lm["sector"],
                    "address": f"{lm['name']}, {lm['sector']}, Nerul",
                    "lat": lm["lat"],
                    "lon": lm["lon"],
                    "confidence": round(min(0.98, final_score), 2),
                    "raw_score": final_score,
                    "explanation": reason or f"Matched {lm['type']} in {lm['sector']}"
                })

        # Sort candidates descending by confidence
        candidates.sort(key=lambda c: c["raw_score"], reverse=True)
        top_candidates = candidates[:4]

        # Margin check for ambiguity
        is_ambiguous = False
        clarifying_question = None

        if len(top_candidates) >= 2:
            top1 = top_candidates[0]
            top2 = top_candidates[1]
            margin = top1["raw_score"] - top2["raw_score"]
            is_hierarchical = (top1["type"] not in ["road", "sector"]) and (top2["type"] in ["road", "sector"])
            
            # Check if top1 was explicitly named by full name or alias (not merely an underspecified isolated trigger)
            trigger_len = len(detected_triggers[0][0]) if detected_triggers else 0
            is_explicitly_named = False
            for cand_alias in [top1["name"]] + top1.get("aliases", []):
                if cand_alias.lower() in q_lower and len(cand_alias) > trigger_len:
                    is_explicitly_named = True
                    break

            # If margin is small or (underspecified trigger present and not explicitly named)
            if (not is_hierarchical and margin < 0.14) or (detected_triggers and not is_explicitly_named and top1["confidence"] < 0.88):
                is_ambiguous = True
                if detected_triggers:
                    clarifying_question = detected_triggers[0][1]
                else:
                    clarifying_question = f"Did you mean {top1['name']} or {top2['name']}?"
        elif len(top_candidates) == 1:
            if top_candidates[0]["confidence"] < 0.60 and detected_triggers:
                is_ambiguous = True
                clarifying_question = detected_triggers[0][1]
        elif len(top_candidates) == 0:
            # Fallback to general Nerul Node center
            is_ambiguous = True
            clarifying_question = "Could you specify a nearby Nerul landmark or sector number?"
            top_candidates = [{
                "landmark_id": "NRL-DEFAULT",
                "name": "Nerul Node Center",
                "type": "sector",
                "sector": "Sector 20",
                "address": "Nerul Central Sector Corridor, Navi Mumbai",
                "lat": 19.0330,
                "lon": 73.0160,
                "confidence": 0.45,
                "explanation": "Default central coordinate prior"
            }]

        return {
            "is_ambiguous": is_ambiguous,
            "clarifying_question": clarifying_question,
            "top_candidate": top_candidates[0] if top_candidates else None,
            "candidates": top_candidates,
            "total_matches": len(candidates)
        }

disambiguation_engine = DisambiguationEngine()
