"""
UrbanPulse Latent Hazard Model
Implements a mathematical Weibull degradation process to simulate realistic failure events.
Tracks the ground-truth hazard rate for rigorous model evaluation without data leakage.
"""

import math
import random
import uuid
from typing import List, Dict, Any, Tuple

MATERIAL_HAZARD_MULTIPLIER = {
    "cast_iron": 1.45,
    "asphalt": 1.30,
    "clay": 1.25,
    "corrugated_metal": 1.35,
    "ductile_iron": 0.95,
    "pvc": 0.85,
    "concrete": 0.80,
    "prestressed_concrete": 0.70,
    "structural_steel": 0.90,
    "electronic_led": 1.10,
    "paver_blocks": 1.15
}

def compute_hazard_rate(
    age_years: float,
    design_life: int,
    material: str,
    traffic_load: str,
    soil_zone: str,
    prior_failures: int
) -> float:
    """Computes instant Weibull hazard rate h(t)."""
    k = 2.2 # Weibull shape parameter indicating accelerating wear
    base_scale = design_life * 0.95
    
    mat_mult = MATERIAL_HAZARD_MULTIPLIER.get(material, 1.0)
    traffic_mult = 1.35 if traffic_load == "heavy" else 1.0
    soil_mult = 1.25 if "expansive" in soil_zone or "moist" in soil_zone else 1.0
    repeat_mult = 1.0 + (prior_failures * 0.20)
    
    adjusted_scale = base_scale / (mat_mult * traffic_mult * soil_mult)
    
    ratio = max(0.05, age_years / adjusted_scale)
    base_hazard = (k / adjusted_scale) * (ratio ** (k - 1))
    
    total_hazard = base_hazard * repeat_mult
    return min(0.99, total_hazard)

def simulate_history(
    assets: List[Dict[str, Any]],
    start_year: int = 2021,
    end_year: int = 2026
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, float]]:
    """
    Simulates 5 years of maintenance records, inspections, and true hazard values.
    """
    maintenance_records = []
    inspections = []
    true_hazards = {}
    
    for asset in assets:
        aid = asset["asset_id"]
        install_year = int(asset["install_date"][:4])
        design_life = asset["design_life_years"]
        material = asset["material"]
        traffic = asset["attributes"]["traffic_load"]
        soil = asset["attributes"]["soil_zone"]
        
        failures_count = 0
        
        for yr in range(start_year, end_year):
            age = max(1.0, yr - install_year)
            hazard = compute_hazard_rate(age, design_life, material, traffic, soil, failures_count)
            
            # Annual failure probability: P(fail in 1 yr) = 1 - exp(-hazard)
            p_fail_annual = 1.0 - math.exp(-hazard)
            
            # Anchor WM-0042 to have multiple prior leaks for demo scenario
            if aid == "WM-0042":
                p_fail_annual = 0.85
                
            # Sample failure event
            if random.random() < p_fail_annual:
                failures_count += 1
                month = random.randint(1, 12)
                day = random.randint(1, 28)
                rec_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
                
                cost = asset["replacement_cost"] * random.uniform(0.12, 0.35)
                downtime = random.uniform(4.0, 36.0)
                
                maintenance_records.append({
                    "record_id": rec_id,
                    "asset_id": aid,
                    "date": f"{yr}-{month:02d}-{day:02d}",
                    "type": "corrective" if random.random() < 0.75 else "emergency",
                    "description": f"Corrective repair following failure on {asset['asset_type'].replace('_', ' ')}",
                    "cost": round(cost, 2),
                    "downtime_hours": round(downtime, 1),
                    "crew_hours": round(downtime * 0.7, 1),
                    "failure_flag": 1,
                    "failure_mode": "joint_failure" if "main" in asset["asset_type"] else "cracking",
                    "parts_used": ["clamp", "sealant", "coupler"]
                })
            elif random.random() < 0.20:
                # Scheduled preventive maintenance
                month = random.randint(1, 12)
                day = random.randint(1, 28)
                rec_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
                maintenance_records.append({
                    "record_id": rec_id,
                    "asset_id": aid,
                    "date": f"{yr}-{month:02d}-{day:02d}",
                    "type": "preventive",
                    "description": f"Routine servicing and preventive overhaul",
                    "cost": round(asset["replacement_cost"] * 0.04, 2),
                    "downtime_hours": 0.0,
                    "crew_hours": 3.0,
                    "failure_flag": 0,
                    "failure_mode": None,
                    "parts_used": ["filter", "lubricant"]
                })
                
        # Generate inspection report for 2025
        rating = 5 if hazard < 0.15 else 4 if hazard < 0.35 else 3 if hazard < 0.60 else 2 if hazard < 0.80 else 1
        inspections.append({
            "inspection_id": f"INSP-{uuid.uuid4().hex[:6].upper()}",
            "asset_id": aid,
            "date": "2025-10-18",
            "inspector": "Chief Eng. R. Jenkins",
            "report_text": f"Visual inspection conducted on {asset['name']}. Condition rated {rating}/5.",
            "condition_rating": rating,
            "defects": ["surface_corrosion", "joint_wear"] if rating <= 2 else ["minor_cracking"] if rating == 3 else [],
            "recommended_action": "Urgent renewal required" if rating <= 2 else "Routine monitoring"
        })
        
        true_hazards[aid] = round(hazard, 4)
        
    return maintenance_records, inspections, true_hazards
