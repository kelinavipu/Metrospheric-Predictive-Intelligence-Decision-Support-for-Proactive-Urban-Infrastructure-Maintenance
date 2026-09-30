import csv
import io
from pathlib import Path
from typing import List, Dict, Any
from backend.app.core.config import settings
from backend.app.db.database import get_db

CSV_PATH = settings.DATA_DIR / "metrospheric_database.csv"

FIELDNAMES = [
    "Ticket_ID",
    "Date_Time",
    "Citizen_Description",
    "Address",
    "Latitude",
    "Longitude",
    "NLP_Category",
    "NLP_Color_Tag",
    "Defect_Mode",
    "Severity_Level",
    "Urgency",
    "Linked_Asset_ID",
    "NLP_Confidence_Pct",
    "Status"
]

def sync_database_to_csv() -> Path:
    """Syncs all complaints from SQLite into the maintained CSV/Excel file."""
    with get_db() as conn:
        rows = conn.execute("""
        SELECT 
            complaint_id, received_at, raw_text, address, lat, lon,
            category, subcategory, severity, urgency, color_tag,
            linked_asset_id, link_confidence, status
        FROM complaints
        ORDER BY received_at DESC
        """).fetchall()

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for r in rows:
            conf = round(float(r["link_confidence"] or 0.88) * 100)
            writer.writerow({
                "Ticket_ID": r["complaint_id"],
                "Date_Time": r["received_at"],
                "Citizen_Description": r["raw_text"],
                "Address": r["address"] or "Nerul Node Corridor",
                "Latitude": r["lat"] or 19.0330,
                "Longitude": r["lon"] or 73.0160,
                "NLP_Category": r["category"] or "unclassified",
                "NLP_Color_Tag": r["color_tag"] or "grey",
                "Defect_Mode": r["subcategory"] or "general",
                "Severity_Level": r["severity"] or 1,
                "Urgency": r["urgency"] or "routine",
                "Linked_Asset_ID": r["linked_asset_id"] or "N/A",
                "NLP_Confidence_Pct": f"{conf}%",
                "Status": r["status"] or "open"
            })
    return CSV_PATH

def get_csv_content() -> str:
    """Returns the current CSV string for export."""
    sync_database_to_csv()
    if CSV_PATH.exists():
        return CSV_PATH.read_text(encoding="utf-8")
    return ""
