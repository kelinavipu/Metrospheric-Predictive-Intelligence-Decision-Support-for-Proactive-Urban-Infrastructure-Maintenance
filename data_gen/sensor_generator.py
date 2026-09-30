"""
UrbanPulse Sensor Telemetry Generator
Generates time-series streams with drift, baseline noise, and degradation precursors.
"""

import random
from typing import List, Dict, Any

METRIC_MAP = {
    "water_main": ("pressure", 50.0, 10.0), # metric, mean, variance
    "bridge": ("strain", 120.0, 15.0),
    "traffic_signal": ("current", 8.5, 1.2),
    "road_segment": ("vibration", 2.2, 0.5)
}

def generate_sensor_readings(
    assets: List[Dict[str, Any]],
    readings_per_sensor: int = 50
) -> List[Dict[str, Any]]:
    sensor_assets = [a for a in assets if a.get("has_sensor") == 1]
    readings = []
    
    # Base timestamp
    start_time = 1759200000 # recent epoch
    
    for asset in sensor_assets:
        aid = asset["asset_id"]
        sid = f"SN-{aid}"
        atype = asset["asset_type"]
        metric, mean, std = METRIC_MAP.get(atype, ("vibration", 5.0, 1.0))
        
        # If WM-0042 (anchor leak), inject progressive pressure drop anomaly
        is_anchor = aid == "WM-0042"
        
        for i in range(readings_per_sensor):
            t_offset = i * 300 # 5 min increments
            t_iso = f"2026-09-30T{12 + (i // 12):02d}:{(i % 12) * 5:02d}:00Z"
            
            val = random.gauss(mean, std)
            quality = "good"
            
            # Anomaly injection for anchor pre-failure
            if is_anchor and i >= readings_per_sensor - 12:
                # Sudden pressure drop and high acoustic variance
                val = max(18.0, mean - (i - (readings_per_sensor - 12)) * 3.5 + random.gauss(0, 4.0))
                quality = "anomaly"
                
            readings.append({
                "time": t_iso,
                "sensor_id": sid,
                "asset_id": aid,
                "metric": metric,
                "value": round(val, 2),
                "quality_flag": quality
            })
            
    return readings
