"""
UrbanPulse Synthetic Data Generation CLI
Generates city infrastructure, 5-year history, complaints, sensors, and gold evaluation sets.
Usage:
    python -m data_gen.generate --size medium --seed 42
"""

import argparse
import random
import json
from pathlib import Path
from backend.app.core.config import settings
from backend.app.core.logging import logger
from data_gen.city_generator import generate_wards, generate_assets, LANDMARKS
from data_gen.hazard_model import simulate_history
from data_gen.complaint_generator import generate_complaints
from data_gen.sensor_generator import generate_sensor_readings

SIZE_CONFIG = {
    "small": {"assets": 1000, "complaints": 1000},
    "medium": {"assets": 10000, "complaints": 5000},
    "large": {"assets": 50000, "complaints": 20000}
}

def main():
    parser = argparse.ArgumentParser(description="UrbanPulse Synthetic Data Generator")
    parser.add_argument("--size", choices=["small", "medium", "large"], default="medium", help="Dataset size tier")
    parser.add_argument("--seed", type=int, default=42, help="Random generator seed")
    args = parser.parse_args()

    random.seed(args.seed)
    cfg = SIZE_CONFIG[args.size]
    out_dir = settings.DATA_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    labels_dir = out_dir / "labels"
    labels_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Generating synthetic dataset [Tier: {args.size}, Assets: {cfg['assets']}, Seed: {args.seed}]...")

    # 1. Generate 40 Wards
    wards = generate_wards(40)
    logger.info(f"Generated {len(wards)} municipal wards.")

    # 2. Generate Assets
    assets = generate_assets(cfg["assets"], wards)
    logger.info(f"Generated {len(assets)} infrastructure assets across 10 classes.")

    # 3. Latent Hazard & 5-year Maintenance History
    maintenance, inspections, true_hazards = simulate_history(assets, 2021, 2026)
    logger.info(f"Simulated {len(maintenance)} historical maintenance records and {len(inspections)} inspections.")

    # 4. Realistic Citizen Complaints & Hand-crafted Gold Set
    complaints, gold_set = generate_complaints(assets, cfg["complaints"])
    logger.info(f"Generated {len(complaints)} citizen complaints and {len(gold_set)} gold test items.")

    # 5. IoT Sensor Readings (15% assets)
    sensors = generate_sensor_readings(assets, readings_per_sensor=40)
    logger.info(f"Generated {len(sensors)} sensor readings across instrumented assets.")

    # Write JSON files to data/
    (out_dir / "wards.json").write_text(json.dumps(wards, indent=2))
    (out_dir / "critical_facilities.json").write_text(json.dumps(LANDMARKS, indent=2))
    (out_dir / "assets.json").write_text(json.dumps(assets, indent=2))
    (out_dir / "maintenance_records.json").write_text(json.dumps(maintenance, indent=2))
    (out_dir / "inspections.json").write_text(json.dumps(inspections, indent=2))
    (out_dir / "complaints.json").write_text(json.dumps(complaints, indent=2))
    (out_dir / "sensors.json").write_text(json.dumps(sensors, indent=2))
    (out_dir / "latent_hazards.json").write_text(json.dumps(true_hazards, indent=2))
    (labels_dir / "gold_evaluation_set.json").write_text(json.dumps(gold_set, indent=2))

    logger.info(f"✅ Data generation complete! All files saved to {out_dir}")

if __name__ == "__main__":
    main()
