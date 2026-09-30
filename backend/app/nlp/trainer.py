"""
Metrospheric Query-Driven Model Trainer
Trains calibrated multi-target text classifiers for:
1. Category (13 classes)
2. Ordinal Severity (1 to 4)
3. Urgency (routine, expedited, emergency)
4. Spatial Coordinate Prior Association (Lat, Lon)

Supports continuous retraining on real citizen queries from SQLite & CSV database.
"""

import os
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestCentroid
from sklearn.pipeline import FeatureUnion

from backend.app.core.config import settings
from backend.app.db.database import get_db

MODEL_DIR = settings.DATA_DIR / "models"
MODEL_PATH = MODEL_DIR / "metrospheric_nlp.pkl"

# 5 Canonical Seed Queries for Nerul pilot baseline
CANONICAL_SEED_QUERIES = [
    {
        "text": "Water pipe burst on Palm Beach Road opposite Dr. D.Y. Patil Hospital, water flooding the road",
        "category": "pipe_burst",
        "severity": 3,
        "urgency": "emergency",
        "lat": 19.0435,
        "lon": 73.0245
    },
    {
        "text": "Deep pothole on Sector 19A road near Wonders Park, car tires getting damaged",
        "category": "pothole",
        "severity": 3,
        "urgency": "expedited",
        "lat": 19.0290,
        "lon": 73.0070
    },
    {
        "text": "Streetlights flickering and completely dark on Nerul Station Road corridor",
        "category": "streetlight_outage",
        "severity": 2,
        "urgency": "routine",
        "lat": 19.0330,
        "lon": 73.0160
    },
    {
        "text": "Blocked stormwater drain overflowing with filth near Seawoods Grand Central entrance",
        "category": "drainage_flooding",
        "severity": 3,
        "urgency": "expedited",
        "lat": 19.0210,
        "lon": 73.0180
    },
    {
        "text": "High voltage power line snapped and sparking near D.Y. Patil Sports Stadium gate",
        "category": "other",
        "severity": 4,
        "urgency": "emergency",
        "lat": 19.0445,
        "lon": 73.0270
    }
]

class QueryModelTrainer:
    def __init__(self):
        self.model_path = MODEL_PATH
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.category_clf: Optional[LogisticRegression] = None
        self.severity_clf: Optional[LogisticRegression] = None
        self.urgency_clf: Optional[LogisticRegression] = None
        self.coord_model: Optional[NearestCentroid] = None
        self.trained_samples_count: int = 0
        self.last_trained_at: Optional[str] = None

    def load_training_data(self, use_db: bool = True) -> Tuple[List[str], List[str], List[int], List[str], List[Tuple[float, float]]]:
        texts: List[str] = []
        categories: List[str] = []
        severities: List[int] = []
        urgencies: List[str] = []
        coords: List[Tuple[float, float]] = []

        # 1. Add canonical seed baseline
        for item in CANONICAL_SEED_QUERIES:
            texts.append(item["text"])
            categories.append(item["category"])
            severities.append(item["severity"])
            urgencies.append(item["urgency"])
            coords.append((item["lat"], item["lon"]))

        # 2. Add real queries from SQLite if available
        if use_db:
            try:
                with get_db() as conn:
                    rows = conn.execute("""
                    SELECT raw_text, category, severity, urgency, lat, lon 
                    FROM complaints 
                    WHERE raw_text IS NOT NULL AND length(raw_text) > 5
                    ORDER BY received_at DESC
                    LIMIT 2000
                    """).fetchall()
                    for r in rows:
                        texts.append(r["raw_text"])
                        categories.append(r["category"] or "other")
                        severities.append(int(r["severity"] or 2))
                        urgencies.append(r["urgency"] or "routine")
                        coords.append((float(r["lat"] or 19.0330), float(r["lon"] or 73.0160)))
            except Exception as e:
                print(f"[Trainer] Notice: Could not read DB rows: {e}")

        return texts, categories, severities, urgencies, coords

    def train(self, use_db: bool = True) -> Dict[str, Any]:
        texts, categories, severities, urgencies, coords = self.load_training_data(use_db=use_db)
        
        # Sublinear TF-IDF vectorizer (word 1-3 ngrams)
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            min_df=1,
            token_pattern=r"(?u)\b\w+\b"
        )
        X = self.vectorizer.fit_transform(texts)

        # Multi-task heads
        self.category_clf = LogisticRegression(max_iter=300, class_weight="balanced")
        self.category_clf.fit(X, categories)

        self.severity_clf = LogisticRegression(max_iter=300, class_weight="balanced")
        self.severity_clf.fit(X, severities)

        self.urgency_clf = LogisticRegression(max_iter=300, class_weight="balanced")
        self.urgency_clf.fit(X, urgencies)

        # Coordinate association model - group into discrete ~1km spatial cells
        coord_labels = [f"{round(c[0], 2)}_{round(c[1], 2)}" for c in coords]
        if len(set(coord_labels)) > 1:
            self.coord_model = NearestCentroid()
            self.coord_model.fit(X, coord_labels)

        self.trained_samples_count = len(texts)
        import datetime
        self.last_trained_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Save model
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump({
                "vectorizer": self.vectorizer,
                "category_clf": self.category_clf,
                "severity_clf": self.severity_clf,
                "urgency_clf": self.urgency_clf,
                "coord_model": self.coord_model,
                "trained_samples_count": self.trained_samples_count,
                "last_trained_at": self.last_trained_at
            }, f)

        cat_acc = float(np.mean(self.category_clf.predict(X) == categories))
        sev_acc = float(np.mean(self.severity_clf.predict(X) == severities))

        return {
            "status": "trained",
            "samples_trained": len(texts),
            "vocabulary_size": len(self.vectorizer.vocabulary_),
            "category_accuracy": round(cat_acc, 3),
            "severity_accuracy": round(sev_acc, 3),
            "model_path": str(self.model_path),
            "last_trained_at": self.last_trained_at
        }

    def predict(self, text: str) -> Dict[str, Any]:
        """Predicts multi-target outputs for an incoming query."""
        if not self.vectorizer or not self.category_clf:
            if self.model_path.exists():
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                    self.vectorizer = data["vectorizer"]
                    self.category_clf = data["category_clf"]
                    self.severity_clf = data["severity_clf"]
                    self.urgency_clf = data["urgency_clf"]
                    self.coord_model = data.get("coord_model")
                    self.trained_samples_count = data.get("trained_samples_count", 0)
                    self.last_trained_at = data.get("last_trained_at")
            else:
                self.train(use_db=True)

        X = self.vectorizer.transform([text])
        cat = str(self.category_clf.predict(X)[0])
        cat_probs = self.category_clf.predict_proba(X)[0]
        cat_conf = float(np.max(cat_probs))

        sev = int(self.severity_clf.predict(X)[0])
        urg = str(self.urgency_clf.predict(X)[0])

        return {
            "category": cat,
            "category_confidence": round(cat_conf, 2),
            "severity": sev,
            "urgency": urg
        }

query_trainer = QueryModelTrainer()

if __name__ == "__main__":
    res = query_trainer.train()
    print("Training result:", res)
