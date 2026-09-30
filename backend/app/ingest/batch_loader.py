"""
UrbanPulse Batch Ingestion & Database Population
Loads generated JSON data into SQLite database and initializes baseline AHI, predictions, and risk scores.
Usage:
    python -m backend.app.ingest.batch_loader
"""

import json
import math
from pathlib import Path
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.database import get_db, init_db

def load_data():
    data_dir = settings.DATA_DIR
    if not (data_dir / "assets.json").exists():
        logger.error(f"No generated data found at {data_dir}. Run 'make data-gen' first.")
        return

    init_db()
    logger.info("Ingesting generated city data into database...")

    with get_db() as conn:
        # 1. Wards
        wards = json.loads((data_dir / "wards.json").read_text())
        conn.executemany("""
        INSERT OR REPLACE INTO wards (ward_id, name, geometry, population, vulnerability_index)
        VALUES (:ward_id, :name, :geometry, :population, :vulnerability_index)
        """, [{
            "ward_id": w["ward_id"],
            "name": w["name"],
            "geometry": json.dumps(w["geometry"]),
            "population": w["population"],
            "vulnerability_index": w["vulnerability_index"]
        } for w in wards])
        logger.info(f"Loaded {len(wards)} wards.")

        # 2. Critical Facilities
        facilities = json.loads((data_dir / "critical_facilities.json").read_text())
        for idx, f in enumerate(facilities, start=1):
            conn.execute("""
            INSERT OR REPLACE INTO critical_facilities (facility_id, name, facility_type, lat, lon, ward_id, capacity)
            VALUES (?, ?, ?, ?, ?, 'WARD-01', 250)
            """, [f"FAC-{idx:03d}", f["name"], f["type"], f["lat"], f["lon"]])
        logger.info(f"Loaded {len(facilities)} critical facilities.")

        # 3. Assets
        assets = json.loads((data_dir / "assets.json").read_text())
        conn.executemany("""
        INSERT OR REPLACE INTO assets (
            asset_id, asset_type, name, geometry, ward_id, install_date,
            material, attributes, design_life_years, last_inspection_date,
            criticality_score, has_sensor, replacement_cost, status
        ) VALUES (
            :asset_id, :asset_type, :name, :geometry, :ward_id, :install_date,
            :material, :attributes, :design_life_years, :last_inspection_date,
            :criticality_score, :has_sensor, :replacement_cost, :status
        )
        """, [{
            "asset_id": a["asset_id"],
            "asset_type": a["asset_type"],
            "name": a["name"],
            "geometry": json.dumps(a["geometry"]),
            "ward_id": a["ward_id"],
            "install_date": a["install_date"],
            "material": a["material"],
            "attributes": json.dumps(a["attributes"]),
            "design_life_years": a["design_life_years"],
            "last_inspection_date": a["last_inspection_date"],
            "criticality_score": a["criticality_score"],
            "has_sensor": a["has_sensor"],
            "replacement_cost": a["replacement_cost"],
            "status": a["status"]
        } for a in assets])
        logger.info(f"Loaded {len(assets)} infrastructure assets.")

        # 4. Maintenance Records
        maint = json.loads((data_dir / "maintenance_records.json").read_text())
        conn.executemany("""
        INSERT OR REPLACE INTO maintenance_records (
            record_id, asset_id, date, type, description, cost,
            downtime_hours, crew_hours, failure_flag, failure_mode, parts_used
        ) VALUES (
            :record_id, :asset_id, :date, :type, :description, :cost,
            :downtime_hours, :crew_hours, :failure_flag, :failure_mode, :parts_used
        )
        """, [{
            "record_id": m["record_id"],
            "asset_id": m["asset_id"],
            "date": m["date"],
            "type": m["type"],
            "description": m["description"],
            "cost": m["cost"],
            "downtime_hours": m["downtime_hours"],
            "crew_hours": m["crew_hours"],
            "failure_flag": m["failure_flag"],
            "failure_mode": m["failure_mode"],
            "parts_used": json.dumps(m["parts_used"])
        } for m in maint])
        logger.info(f"Loaded {len(maint)} historical maintenance events.")

        # 5. Inspections
        inspections = json.loads((data_dir / "inspections.json").read_text())
        conn.executemany("""
        INSERT OR REPLACE INTO inspections (
            inspection_id, asset_id, date, inspector, report_text,
            condition_rating, defects, recommended_action
        ) VALUES (
            :inspection_id, :asset_id, :date, :inspector, :report_text,
            :condition_rating, :defects, :recommended_action
        )
        """, [{
            "inspection_id": i["inspection_id"],
            "asset_id": i["asset_id"],
            "date": i["date"],
            "inspector": i["inspector"],
            "report_text": i["report_text"],
            "condition_rating": i["condition_rating"],
            "defects": json.dumps(i["defects"]),
            "recommended_action": i["recommended_action"]
        } for i in inspections])
        logger.info(f"Loaded {len(inspections)} inspection reports.")

        # 6. Complaints
        complaints = json.loads((data_dir / "complaints.json").read_text())
        conn.executemany("""
        INSERT OR REPLACE INTO complaints (
            complaint_id, received_at, channel, raw_text, language,
            reporter_id, lat, lon, category, subcategory, severity,
            urgency, extracted_entities, linked_asset_id, link_confidence, status
        ) VALUES (
            :complaint_id, :received_at, :channel, :raw_text, :language,
            :reporter_id, :lat, :lon, :category, :subcategory, :severity,
            :urgency, :extracted_entities, :linked_asset_id, :link_confidence, :status
        )
        """, [{
            "complaint_id": c["complaint_id"],
            "received_at": c["received_at"],
            "channel": c["channel"],
            "raw_text": c["raw_text"],
            "language": c["language"],
            "reporter_id": c["reporter_id"],
            "lat": c["lat"],
            "lon": c["lon"],
            "category": c["category"],
            "subcategory": c["subcategory"],
            "severity": c["severity"],
            "urgency": c["urgency"],
            "extracted_entities": json.dumps(c["extracted_entities"]),
            "linked_asset_id": c["linked_asset_id"],
            "link_confidence": c["link_confidence"],
            "status": c["status"]
        } for c in complaints])
        logger.info(f"Loaded {len(complaints)} complaints.")

        # 7. Sensor Readings
        sensors = json.loads((data_dir / "sensors.json").read_text())
        conn.executemany("""
        INSERT INTO sensor_readings (time, sensor_id, asset_id, metric, value, quality_flag)
        VALUES (:time, :sensor_id, :asset_id, :metric, :value, :quality_flag)
        """, sensors)
        logger.info(f"Loaded {len(sensors)} sensor readings.")

        # 8. Compute Baseline AHI, Predictions, and Risk Scores
        logger.info("Computing initial Asset Health Index, failure predictions, and risk rankings...")
        hazards = json.loads((data_dir / "latent_hazards.json").read_text())

        health_batch = []
        pred_batch = []
        risk_batch = []

        for a in assets:
            aid = a["asset_id"]
            h_val = hazards.get(aid, 0.25)
            
            # Anchor WM-0042 specifically for Section 18 scenario
            if aid == "WM-0042":
                health_index = 43.2
                p_30 = 0.48
                p_90 = 0.72
                p_180 = 0.88
                rul_median = 38.0
                band = "high"
                risk_score = 0.74
            else:
                health_index = max(15.0, round(100.0 * (1.0 - h_val * 0.75), 1))
                p_90 = round(min(0.95, h_val * 0.85), 3)
                p_30 = round(p_90 * 0.45, 3)
                p_180 = round(min(0.98, p_90 * 1.35), 3)
                rul_median = max(14.0, round((1.0 - p_90) * 365.0, 1))
                
                crit = a["criticality_score"]
                risk_score = round(p_90 * crit, 3)
                band = "critical" if risk_score > 0.65 else "high" if risk_score > 0.40 else "moderate" if risk_score > 0.18 else "low"

            components = {
                "age_score": round(max(10, 100 - (2026 - int(a["install_date"][:4])) * 1.5), 1),
                "condition_score": round(health_index * 1.05, 1),
                "maintenance_score": 85.0 if aid != "WM-0042" else 35.0,
                "complaint_score": 90.0 if aid != "WM-0042" else 30.0,
                "sensor_score": 95.0 if not a["has_sensor"] else 88.0 if aid != "WM-0042" else 25.0
            }

            top_factors = [
                {"feature": "material", "impact": 0.24, "description": f"Material: {a['material'].replace('_', ' ').title()}"},
                {"feature": "age_years", "impact": 0.18, "description": f"Service age: {2026 - int(a['install_date'][:4])} years"},
                {"feature": "traffic_load", "impact": 0.12, "description": "Heavy arterial traffic corridor"},
                {"feature": "prior_failures", "impact": 0.15 if aid == "WM-0042" else 0.04, "description": "Prior leak history in corridor"}
            ]

            health_batch.append((aid, "2026-09-30", health_index, json.dumps(components), 0.95, "stable" if health_index > 60 else "declining"))
            pred_batch.append((aid, "2026-09-30", "v2.4.0", p_30, p_90, p_180, rul_median, round(rul_median*0.5, 1), round(rul_median*1.6, 1), json.dumps(top_factors), 0.15 if aid != "WM-0042" else 0.88))
            risk_batch.append((aid, "2026-09-30", p_90, a["criticality_score"], a["criticality_score"], risk_score, 1, band))

        conn.executemany("""
        INSERT INTO asset_health (asset_id, as_of_date, health_index, components, confidence, trend)
        VALUES (?, ?, ?, ?, ?, ?)
        """, health_batch)

        conn.executemany("""
        INSERT INTO predictions (
            asset_id, as_of_date, model_version, p_fail_30d, p_fail_90d, p_fail_180d,
            rul_days_median, rul_days_p10, rul_days_p90, top_factors, anomaly_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, pred_batch)

        conn.executemany("""
        INSERT INTO risk_scores (
            asset_id, as_of_date, likelihood, consequence, criticality, risk_score, priority_rank, risk_band
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, risk_batch)

        # 9. Crews
        conn.execute("""
        INSERT OR REPLACE INTO crews (crew_id, name, skills, shift, home_depot, hourly_cost, capacity_hours_per_day)
        VALUES ('CRW-01', 'Alpha Utility Crew', '["water_main", "road_resurfacing", "pipe_repair"]', 'day', '{"lat": 12.9716, "lon": 77.5946}', 120.0, 8.0)
        """)
        conn.execute("""
        INSERT OR REPLACE INTO crews (crew_id, name, skills, shift, home_depot, hourly_cost, capacity_hours_per_day)
        VALUES ('CRW-02', 'Beta Electrical Crew', '["streetlight", "traffic_signal"]', 'day', '{"lat": 12.9800, "lon": 77.6000}', 110.0, 8.0)
        """)

    logger.info("✅ Database population and pipeline initialization complete!")

if __name__ == "__main__":
    load_data()
