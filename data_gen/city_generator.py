"""
UrbanPulse City Generator - Nerul, Navi Mumbai Edition
Synthesizes 40 municipal sectors in Nerul (Lat 19.0330 N, Lon 73.0160 E),
critical facilities (D.Y. Patil Hospital, Apollo, Terna, SIES, Apeejay, Wonders Park, Seawoods Grand Central),
and 10,000 infrastructure assets across Palm Beach Road, Uran Road, and sector grids.
"""

import random
import json
from typing import List, Dict, Any, Tuple

# Exact Center point of Nerul Node, Navi Mumbai
CENTER_LAT = 19.0330
CENTER_LON = 73.0160

PRIMARY_ARTERIALS = [
    "Palm Beach Road", "Sion-Panvel Highway", "Uran Road", "Dr. D.Y. Patil Vidyanagar Marg",
    "Nerul Station Road", "Wonders Park Marg", "Jewel of Navi Mumbai Arterial", "Sector 19A Spine",
    "Terna Hospital Road", "Seawoods Grand Central Avenue", "Karave Road", "MG Road"
]

LANDMARKS = [
    {"name": "Dr. D.Y. Patil Hospital & Medical College", "type": "hospital", "lat": 19.0435, "lon": 73.0245},
    {"name": "Apollo Hospitals Nerul", "type": "hospital", "lat": 19.0410, "lon": 73.0295},
    {"name": "Terna Speciality Hospital", "type": "hospital", "lat": 19.0380, "lon": 73.0190},
    {"name": "Sunshine Hospital", "type": "hospital", "lat": 19.0315, "lon": 73.0140},
    {"name": "City Hospital", "type": "hospital", "lat": 19.0335, "lon": 73.0165},
    {"name": "Dr. D.Y. Patil Sports Stadium", "type": "sports_stadium", "lat": 19.0445, "lon": 73.0270},
    {"name": "SIES Graduate School of Technology", "type": "college", "lat": 19.0420, "lon": 73.0220},
    {"name": "Apeejay School Nerul", "type": "school", "lat": 19.0355, "lon": 73.0115},
    {"name": "DAV Public School Seawoods", "type": "school", "lat": 19.0185, "lon": 73.0150},
    {"name": "Sterling Institute of Technology", "type": "college", "lat": 19.0285, "lon": 73.0090},
    {"name": "Hotel Yogi Executive", "type": "hotel", "lat": 19.0450, "lon": 73.0290},
    {"name": "The Park Navi Mumbai", "type": "hotel", "lat": 19.0190, "lon": 73.0230},
    {"name": "Seawoods Grand Central Mall", "type": "commercial", "lat": 19.0210, "lon": 73.0180},
    {"name": "Wonders Park", "type": "park", "lat": 19.0290, "lon": 73.0070},
    {"name": "Rock Garden Nerul", "type": "park", "lat": 19.0310, "lon": 73.0085},
    {"name": "Jewel of Navi Mumbai", "type": "lake_park", "lat": 19.0380, "lon": 73.0040},
    {"name": "Nerul Holding Pond", "type": "water_body", "lat": 19.0260, "lon": 73.0010},
    {"name": "Nerul Railway Station", "type": "transit_hub", "lat": 19.0335, "lon": 73.0165},
    {"name": "Seawoods-Darave Railway Station", "type": "transit_hub", "lat": 19.0215, "lon": 73.0175},
    {"name": "Juinagar Railway Station", "type": "transit_hub", "lat": 19.0520, "lon": 73.0170},
    {"name": "Nerul Gymkhana", "type": "recreation", "lat": 19.0360, "lon": 73.0080},
]

ASSET_TYPES_CONFIG = {
    "water_main": {"share": 0.22, "materials": ["cast_iron", "ductile_iron", "pvc", "steel"], "life": [50, 75]},
    "road_segment": {"share": 0.25, "materials": ["asphalt", "concrete"], "life": [15, 25]},
    "sewer_line": {"share": 0.16, "materials": ["concrete", "clay", "pvc"], "life": [40, 60]},
    "storm_drain": {"share": 0.10, "materials": ["reinforced_concrete", "corrugated_metal"], "life": [30, 50]},
    "streetlight": {"share": 0.12, "materials": ["aluminum", "steel"], "life": [15, 20]},
    "traffic_signal": {"share": 0.04, "materials": ["electronic_led", "steel_mast"], "life": [10, 15]},
    "bridge": {"share": 0.02, "materials": ["prestressed_concrete", "structural_steel"], "life": [60, 100]},
    "footpath": {"share": 0.05, "materials": ["paver_blocks", "concrete_slab"], "life": [10, 15]},
    "culvert": {"share": 0.02, "materials": ["concrete_box", "steel_pipe"], "life": [35, 50]},
    "manhole": {"share": 0.02, "materials": ["cast_iron", "precast_concrete"], "life": [40, 60]}
}

NERUL_SECTOR_NAMES = [
    "Sector 1 (Sea Breeze)", "Sector 2 (Nerul Bus Depot)", "Sector 3 (Residential)", "Sector 4 (Nerul West)",
    "Sector 5 (D.Y. Patil Hospital & SIES)", "Sector 6 (West Enclave)", "Sector 7 (D.Y. Patil Stadium)",
    "Sector 8 (Central Residential)", "Sector 9 (Nerul West)", "Sector 10 (Market Plaza)",
    "Sector 11 (East Commercial)", "Sector 12 (Residential)", "Sector 13 (Transit Link)",
    "Sector 14 (Green Avenue)", "Sector 15 (Apeejay School Corridor)", "Sector 16 (Palm Beach Enclave)",
    "Sector 17 (East High St)", "Sector 18 (Palm Beach Water Main)", "Sector 19A (Wonders Park & Rock Garden)",
    "Sector 19 (Shiravane Border)", "Sector 20 (Nerul Station Hub)", "Sector 21 (East Market Spine)",
    "Sector 22 (Terna Hospital & College)", "Sector 23 (Apollo Hospitals & Nerul East)", "Sector 24 (MIDC Link)",
    "Sector 25 (East Hillside)", "Sector 26 (Parsik View)", "Sector 27 (Shiravane Hill)",
    "Sector 28 (Jewel of Navi Mumbai)", "Sector 29 (Nerul East)", "Sector 30 (Transit Corridor)",
    "Sector 34 (Juinagar Border)", "Sector 36 (Marine Enclave)", "Sector 40 (Darave Junction)",
    "Sector 42 (Seawoods North)", "Sector 44 (Seawoods Garden)", "Sector 46 (NRI Complex Link)",
    "Sector 48 (Seawoods Grand Central & DAV)", "Sector 50 (Seawoods Waterfront)", "Ward 40 (Nerul Arterial Corridor)"
]

def generate_wards(num_wards: int = 40) -> List[Dict[str, Any]]:
    wards = []
    grid_size = 7
    d_lat = 0.0058
    d_lon = 0.0058
    
    for i in range(num_wards):
        row = i // grid_size
        col = i % grid_size
        w_id = f"WARD-{i+1:02d}"
        
        min_lat = CENTER_LAT - (grid_size/2 - row) * d_lat
        max_lat = min_lat + d_lat
        min_lon = CENTER_LON - (grid_size/2 - col) * d_lon
        max_lon = min_lon + d_lon
        
        polygon = {
            "type": "Polygon",
            "coordinates": [[
                [min_lon, min_lat],
                [max_lon, min_lat],
                [max_lon, max_lat],
                [min_lon, max_lat],
                [min_lon, min_lat]
            ]]
        }
        
        pop = random.randint(12000, 48000)
        vuln = round(random.uniform(0.15, 0.85), 2)
        name = NERUL_SECTOR_NAMES[i] if i < len(NERUL_SECTOR_NAMES) else f"Nerul Sector {i+1}"
        
        wards.append({
            "ward_id": w_id,
            "name": f"Nerul {name}",
            "geometry": polygon,
            "population": pop,
            "vulnerability_index": vuln
        })
    return wards

def generate_assets(total_assets: int, wards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    assets = []
    type_counts = {k: int(v["share"] * total_assets) for k, v in ASSET_TYPES_CONFIG.items()}
    remainder = total_assets - sum(type_counts.values())
    type_counts["road_segment"] += remainder

    asset_num = 1
    
    for atype, count in type_counts.items():
        cfg = ASSET_TYPES_CONFIG[atype]
        for i in range(count):
            ward = random.choice(wards)
            coords = ward["geometry"]["coordinates"][0]
            min_lon, min_lat = coords[0]
            max_lon, max_lat = coords[2]
            
            lat1 = random.uniform(min_lat, max_lat)
            lon1 = random.uniform(min_lon, max_lon)
            
            if random.random() < 0.40:
                street_name = random.choice(PRIMARY_ARTERIALS)
            else:
                sector_num = random.randint(1, 50)
                street_name = f"Nerul Sector {sector_num} Internal Road {random.randint(1, 12)}"
                
            material = random.choice(cfg["materials"])
            design_life = random.randint(cfg["life"][0], cfg["life"][1])
            install_year = random.randint(1975, 2023)
            install_date = f"{install_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            
            if atype in ("road_segment", "water_main", "sewer_line", "storm_drain", "footpath"):
                d_l = random.uniform(0.001, 0.003)
                geom = {
                    "type": "LineString",
                    "coordinates": [[lon1, lat1], [lon1 + d_l * 0.7, lat1 + d_l * 0.7]]
                }
            else:
                geom = {
                    "type": "Point",
                    "coordinates": [lon1, lat1]
                }
                
            cost_map = {
                "water_main": 45000, "road_segment": 65000, "sewer_line": 55000,
                "storm_drain": 35000, "bridge": 450000, "streetlight": 3500,
                "traffic_signal": 18000, "footpath": 8500, "culvert": 22000, "manhole": 4500
            }
            repl_cost = cost_map.get(atype, 20000) * random.uniform(0.8, 1.4)
            has_sensor = atype in ("bridge", "water_main", "traffic_signal") and random.random() < 0.40
            
            is_critical_corridor = any(k in street_name for k in ["Hospital", "D.Y. Patil", "Apollo", "Palm Beach", "MG Road"])
            crit = random.uniform(0.70, 0.96) if is_critical_corridor else random.uniform(0.20, 0.75)
            
            prefix_map = {
                "water_main": "WM", "road_segment": "RD", "sewer_line": "SW",
                "storm_drain": "ST", "streetlight": "SL", "traffic_signal": "TS",
                "bridge": "BR", "footpath": "FP", "culvert": "CV", "manhole": "MH"
            }
            
            if atype == "water_main" and i == 0:
                aid = "WM-0042"
                name = "MG Road Water Main (Section 42 - Opp City Hospital)"
                street_name = "MG Road"
                install_date = "1964-04-12"
                material = "cast_iron"
                crit = 0.94
                has_sensor = True
                geom = {
                    "type": "LineString",
                    "coordinates": [[CENTER_LON, CENTER_LAT], [CENTER_LON + 0.002, CENTER_LAT + 0.001]]
                }
            else:
                if atype == "water_main" and asset_num == 42:
                    asset_num += 1
                aid = f"{prefix_map.get(atype, 'AS')}-{asset_num:04d}"
                name = f"{street_name} {atype.replace('_', ' ').title()}"

            attributes = {
                "diameter_mm": random.choice([150, 300, 450, 600]) if "main" in atype or "line" in atype else None,
                "lanes": random.choice([2, 4, 6]) if "road" in atype else None,
                "length_m": round(random.uniform(50, 350), 1) if geom["type"] == "LineString" else None,
                "soil_zone": random.choice(["coastal_marine_clay", "decomposed_basalt", "sandy_loam", "estuarine_alluvium"]),
                "traffic_load": "heavy" if street_name in PRIMARY_ARTERIALS else "light"
            }

            assets.append({
                "asset_id": aid,
                "asset_type": atype,
                "name": name,
                "geometry": geom,
                "ward_id": ward["ward_id"],
                "install_date": install_date,
                "material": material,
                "attributes": attributes,
                "design_life_years": design_life,
                "last_inspection_date": "2025-11-10",
                "criticality_score": round(crit, 3),
                "has_sensor": 1 if has_sensor else 0,
                "replacement_cost": round(repl_cost, 2),
                "status": "active"
            })
            asset_num += 1

    return assets
