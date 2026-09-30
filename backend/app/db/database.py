"""
UrbanPulse Database Engine (Native SQLite with WAL and JSON support)
Provides zero-dependency connection handling and schema initialization.
"""

import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from typing import Generator, Any, Dict, List, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger

def get_db_path() -> Path:
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    return settings.DATABASE_PATH

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(
        str(get_db_path()),
        timeout=30.0,
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
    )
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Create all core database tables with proper indexes."""
    logger.info("Initializing UrbanPulse database schema...")
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS wards (
            ward_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            geometry TEXT NOT NULL, -- GeoJSON Polygon
            population INTEGER NOT NULL,
            vulnerability_index REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS critical_facilities (
            facility_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            facility_type TEXT NOT NULL, -- hospital, school, fire_station, transit_hub
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            ward_id TEXT,
            capacity INTEGER DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS assets (
            asset_id TEXT PRIMARY KEY,
            asset_type TEXT NOT NULL,
            name TEXT NOT NULL,
            geometry TEXT NOT NULL, -- GeoJSON Point or LineString
            ward_id TEXT REFERENCES wards(ward_id),
            install_date TEXT NOT NULL,
            material TEXT NOT NULL,
            attributes TEXT NOT NULL, -- JSON dict of type-specific attributes
            design_life_years INTEGER NOT NULL,
            last_inspection_date TEXT,
            criticality_score REAL DEFAULT 0.5,
            has_sensor INTEGER DEFAULT 0,
            replacement_cost REAL NOT NULL,
            status TEXT DEFAULT 'active'
        );

        CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
        CREATE INDEX IF NOT EXISTS idx_assets_ward ON assets(ward_id);
        CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets(criticality_score);

        CREATE TABLE IF NOT EXISTS maintenance_records (
            record_id TEXT PRIMARY KEY,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            date TEXT NOT NULL,
            type TEXT NOT NULL, -- preventive, corrective, emergency, replacement
            description TEXT,
            cost REAL NOT NULL,
            downtime_hours REAL DEFAULT 0.0,
            crew_hours REAL DEFAULT 0.0,
            failure_flag INTEGER DEFAULT 0,
            failure_mode TEXT,
            parts_used TEXT -- JSON
        );

        CREATE INDEX IF NOT EXISTS idx_maint_asset ON maintenance_records(asset_id);
        CREATE INDEX IF NOT EXISTS idx_maint_date ON maintenance_records(date);
        CREATE INDEX IF NOT EXISTS idx_maint_failure ON maintenance_records(failure_flag);

        CREATE TABLE IF NOT EXISTS complaints (
            complaint_id TEXT PRIMARY KEY,
            received_at TEXT NOT NULL,
            channel TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            reporter_id TEXT,
            lat REAL,
            lon REAL,
            photo_url TEXT,
            category TEXT,
            subcategory TEXT,
            severity INTEGER DEFAULT 1,
            urgency TEXT DEFAULT 'routine',
            extracted_entities TEXT, -- JSON
            linked_asset_id TEXT REFERENCES assets(asset_id),
            link_confidence REAL DEFAULT 0.0,
            duplicate_of TEXT,
            status TEXT DEFAULT 'open',
            address TEXT,
            color_tag TEXT DEFAULT 'grey'
        );

        CREATE INDEX IF NOT EXISTS idx_complaints_asset ON complaints(linked_asset_id);
        CREATE INDEX IF NOT EXISTS idx_complaints_cat ON complaints(category);
        CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
        CREATE INDEX IF NOT EXISTS idx_complaints_date ON complaints(received_at);

        CREATE TABLE IF NOT EXISTS inspections (
            inspection_id TEXT PRIMARY KEY,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            date TEXT NOT NULL,
            inspector TEXT NOT NULL,
            report_text TEXT,
            condition_rating INTEGER NOT NULL, -- 1 to 5
            defects TEXT, -- JSON
            recommended_action TEXT,
            report_file_url TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_inspections_asset ON inspections(asset_id);

        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL,
            sensor_id TEXT NOT NULL,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            quality_flag TEXT DEFAULT 'good'
        );

        CREATE INDEX IF NOT EXISTS idx_sensors_asset_time ON sensor_readings(asset_id, time);
        CREATE INDEX IF NOT EXISTS idx_sensors_metric ON sensor_readings(metric);

        CREATE TABLE IF NOT EXISTS asset_health (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            as_of_date TEXT NOT NULL,
            health_index REAL NOT NULL,
            components TEXT NOT NULL, -- JSON
            confidence REAL DEFAULT 1.0,
            trend TEXT DEFAULT 'stable'
        );

        CREATE INDEX IF NOT EXISTS idx_health_asset ON asset_health(asset_id);

        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            as_of_date TEXT NOT NULL,
            model_version TEXT NOT NULL,
            p_fail_30d REAL NOT NULL,
            p_fail_90d REAL NOT NULL,
            p_fail_180d REAL NOT NULL,
            rul_days_median REAL NOT NULL,
            rul_days_p10 REAL NOT NULL,
            rul_days_p90 REAL NOT NULL,
            top_factors TEXT NOT NULL, -- JSON
            anomaly_score REAL DEFAULT 0.0
        );

        CREATE INDEX IF NOT EXISTS idx_predictions_asset ON predictions(asset_id);
        CREATE INDEX IF NOT EXISTS idx_predictions_pfail90 ON predictions(p_fail_90d);

        CREATE TABLE IF NOT EXISTS risk_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL REFERENCES assets(asset_id),
            as_of_date TEXT NOT NULL,
            likelihood REAL NOT NULL,
            consequence REAL NOT NULL,
            criticality REAL NOT NULL,
            risk_score REAL NOT NULL,
            priority_rank INTEGER,
            risk_band TEXT NOT NULL -- low, moderate, high, critical
        );

        CREATE INDEX IF NOT EXISTS idx_risk_asset ON risk_scores(asset_id);
        CREATE INDEX IF NOT EXISTS idx_risk_score ON risk_scores(risk_score);
        CREATE INDEX IF NOT EXISTS idx_risk_band ON risk_scores(risk_band);

        CREATE TABLE IF NOT EXISTS crews (
            crew_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            skills TEXT NOT NULL, -- JSON list of skills
            shift TEXT DEFAULT 'day',
            home_depot TEXT NOT NULL, -- JSON lat/lon
            hourly_cost REAL NOT NULL,
            capacity_hours_per_day REAL DEFAULT 8.0
        );

        CREATE TABLE IF NOT EXISTS work_orders (
            wo_id TEXT PRIMARY KEY,
            asset_ids TEXT NOT NULL, -- JSON list
            type TEXT NOT NULL,
            scheduled_start TEXT,
            scheduled_end TEXT,
            crew_id TEXT REFERENCES crews(crew_id),
            est_cost REAL NOT NULL,
            est_hours REAL NOT NULL,
            actual_cost REAL,
            actual_hours REAL,
            status TEXT DEFAULT 'proposed', -- proposed, approved, scheduled, in_progress, completed
            source TEXT DEFAULT 'predicted',
            rationale TEXT,
            outcome TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);

        CREATE TABLE IF NOT EXISTS alerts (
            alert_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            asset_id TEXT REFERENCES assets(asset_id),
            kind TEXT NOT NULL, -- predicted_failure, anomaly, complaint_spike, sla_breach
            severity TEXT NOT NULL, -- low, moderate, high, critical
            message TEXT NOT NULL,
            acknowledged_by TEXT,
            state TEXT DEFAULT 'active' -- active, acknowledged, resolved
        );

        CREATE INDEX IF NOT EXISTS idx_alerts_state ON alerts(state);
        CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            details TEXT
        );
        """)

        for col in ["address TEXT", "color_tag TEXT DEFAULT 'grey'"]:
            try:
                conn.execute(f"ALTER TABLE complaints ADD COLUMN {col}")
            except Exception:
                pass

    logger.info("Database schema initialized successfully.")
