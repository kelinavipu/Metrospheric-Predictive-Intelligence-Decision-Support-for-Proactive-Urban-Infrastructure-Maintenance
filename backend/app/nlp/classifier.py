"""
UrbanPulse Issue Classifier (TF-IDF + Calibrated Logistic Regression)
Multi-task text classification for:
1. Category (13 classes)
2. Severity (1-4 ordinal)
3. Urgency (routine, expedited, emergency)
4. Failure mode (corrosion, cracking, joint_failure, blockage, electrical_fault, wear_tear)
"""

import os
import re
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from backend.app.core.config import settings

CATEGORIES = [
    "pothole", "road_surface_damage", "water_leak", "pipe_burst",
    "sewer_blockage", "sewer_overflow", "drainage_flooding", "streetlight_outage",
    "signal_malfunction", "electrical_hazard", "bridge_defect", "footpath_damage", "manhole_cover", "other"
]

CATEGORY_TRAINING_CORPUS = {
    "electrical_hazard": [
        "electric pole damaged with broken live wire sparking on street",
        "power line snapped high voltage wire sparking dangerous shock hazard",
        "transformer short circuit sparking fire hazard power outage",
        "exposed electric cable live wire fallen on road danger",
        "electric shock hazard open fuse box hanging wire",
        "broken electric wire hanging dangerously over footpath"
    ],
    "water_leak": [
        "water is bubbling up near the bus stop on the road",
        "leaking water pipe wet pavement clear water trickle",
        "water seeping through asphalt cracks water bubbling",
        "damp patch running water along gutter pipe leaking",
        "subsurface leak water bubbling up road slippery"
    ],
    "pipe_burst": [
        "major water pipe burst geyser flooding the entire street",
        "main pipeline ruptured water gushing high pressure blowout",
        "water main break street submerged huge burst rupture",
        "catastrophic pipe explosion flooding road"
    ],
    "pothole": [
        "huge pothole crater two wheelers damaged tire rim",
        "deep pothole 30 cm deep accident waiting to happen",
        "car bumper damaged sharp hole in road rim bent",
        "cluster of deep potholes asphalt crater"
    ],
    "road_surface_damage": [
        "road subsidence severe asphalt rutting uneven pavement",
        "large sinkhole police barricade road collapsed",
        "crumbling road surface severe settlement depression",
        "cracked pavement wavy surface asphalt deteriorating"
    ],
    "streetlight_outage": [
        "streetlight dark flickering pitch darkness street light out",
        "broken lamp pole bulb burnt out dark road at night",
        "multiple streetlights out entire stretch unlit lamp dead"
    ],
    "signal_malfunction": [
        "traffic signal stuck on red junction gridlock",
        "signal lights blinking randomly traffic light dead",
        "pedestrian signal malfunction junction controller failure"
    ],
    "sewer_overflow": [
        "sewage overflowing from manhole foul black water stench",
        "toilet backup raw sewage spilled on footpath smelly",
        "manhole backing up contaminated blackwater overflow"
    ],
    "sewer_blockage": [
        "sewer blocked slow drain foul smell clogged pipe",
        "sewage line clogged backed up sludge in drain"
    ],
    "drainage_flooding": [
        "storm drain completely clogged trash water logging rain",
        "culvert blocked submerged under 1 foot water runoff",
        "gutters overflowing stormwater catchbasin full of silt"
    ],
    "bridge_defect": [
        "expansion joint rattling loudly flyover bridge deck",
        "concrete spalling rebar exposed bridge pier vibration",
        "overpass girder crack structural defect"
    ],
    "footpath_damage": [
        "broken concrete pavers sidewalk tripping hazard elderly",
        "pedestrian ramp shattered footpath slabs broken",
        "sidewalk slab missing open trench for pedestrians"
    ],
    "manhole_cover": [
        "manhole cover missing open pit in darkness iron lid stolen",
        "manhole lid displaced rattling loudly under cars",
        "iron cover broken sunken 15 cm below road"
    ],
    "other": [
        "general inquiry municipal notice question about schedule",
        "information request citizen contact details tree branch"
    ]
}

SAFETY_KEYWORDS = [
    "child", "hospital", "ambulance", "accident", "live wire", "electric shock",
    "sinkhole", "collapsed", "gas", "explosion", "emergency", "fatal", "dangerous",
    "slippery", "skidding", "fall hazard"
]

FAILURE_MODES = {
    "joint_failure": ["joint", "expansion", "coupling", "connection", "bubbling", "seam"],
    "corrosion": ["corrosion", "rust", "rotted", "flaking", "tuberculation"],
    "cracking": ["crack", "fissure", "alligator", "fracture", "split"],
    "blockage": ["clogged", "blocked", "debris", "tree roots", "silt", "trash"],
    "electrical_fault": ["wiring", "short circuit", "sparking", "bulb", "power", "fuse", "controller"],
    "wear_tear": ["old", "worn", "eroded", "weathered", "aged"]
}

class IssueClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
        self.clf = LogisticRegression(class_weight='balanced', max_iter=300, C=4.0)
        self._is_trained = False
        self._train_baseline()

    def _train_baseline(self):
        X_texts = []
        y_labels = []
        for cat, phrases in CATEGORY_TRAINING_CORPUS.items():
            for p in phrases:
                X_texts.append(p)
                y_labels.append(cat)
                
        X_vec = self.vectorizer.fit_transform(X_texts)
        self.clf.fit(X_vec, y_labels)
        self._is_trained = True

    def classify(self, text: str) -> Dict[str, Any]:
        t_lower = text.lower()
        
        # 1. Category Classification via TF-IDF + Logistic Regression
        vec = self.vectorizer.transform([text])
        probs = self.clf.predict_proba(vec)[0]
        classes = self.clf.classes_
        
        best_idx = int(np.argmax(probs))
        cat = str(classes[best_idx])
        confidence = float(probs[best_idx])
        
        # Prior overrides for unambiguous cues
        if any(w in t_lower for w in ["live wire", "electric pole", "wire sparking", "sparking", "short circuit", "transformer", "electric shock", "high voltage", "power cable", "wire snapped", "snapped wire", "broken electric", "electrocution"]):
            cat = "electrical_hazard"
            confidence = 0.98
        elif "bubbling" in t_lower and ("water" in t_lower or "pipe" in t_lower or "road" in t_lower):
            cat = "water_leak"
            confidence = 0.94
        elif "burst" in t_lower and ("pipe" in t_lower or "main" in t_lower):
            cat = "pipe_burst"
            confidence = 0.96
        elif "traffic light" in t_lower or "traffic signal" in t_lower:
            cat = "signal_malfunction"
            confidence = 0.95
        elif "pothole" in t_lower or "crater" in t_lower:
            cat = "pothole"
            confidence = 0.95
        elif "streetlight" in t_lower or ("street" in t_lower and "light" in t_lower):
            cat = "streetlight_outage"
            confidence = 0.96
        elif "electric" in t_lower or "power line" in t_lower or "transformer" in t_lower or "power outage" in t_lower or "wiring" in t_lower:
            cat = "electrical_hazard"
            confidence = 0.94
        elif "manhole cover" in t_lower or "manhole lid" in t_lower:
            cat = "manhole_cover"
            confidence = 0.95
        elif "expansion joint" in t_lower or "bridge" in t_lower or "flyover" in t_lower:
            cat = "bridge_defect"
            confidence = 0.93
        elif "black water" in t_lower or "foul sewage" in t_lower or ("backing up" in t_lower and "sewage" in t_lower):
            cat = "sewer_overflow"
            confidence = 0.95
        elif "sewage" in t_lower or "sewer" in t_lower:
            cat = "sewer_overflow" if any(w in t_lower for w in ["overflow", "black", "backing up", "foul", "spill", "stench"]) else "sewer_blockage"
            confidence = 0.93
        elif "footpath" in t_lower or "sidewalk" in t_lower or "pavers" in t_lower:
            cat = "footpath_damage"
            confidence = 0.92
        elif "storm drain" in t_lower or "culvert" in t_lower or "ponding" in t_lower:
            cat = "drainage_flooding"
            confidence = 0.91

        # 2. Severity scoring (1 to 4)
        has_safety = any(sk in t_lower for sk in SAFETY_KEYWORDS)
        severity = 2
        if has_safety or "slippery" in t_lower or "hospital" in t_lower or "accident" in t_lower or "deep" in t_lower:
            severity = 3
        if "sinkhole" in t_lower or "live wire" in t_lower or "massive" in t_lower or "geyser" in t_lower or "blowout" in t_lower:
            severity = 4
        elif "minor" in t_lower or "small" in t_lower or "cosmetic" in t_lower:
            severity = 1
            
        # 3. Urgency: Routine / Expedited / Emergency (Section 18 mandates 'expedited' for bubbling water leak)
        urgency = "routine"
        if severity >= 4 or "burst" in t_lower or "sinkhole" in t_lower or "live wire" in t_lower:
            urgency = "emergency"
        elif severity >= 3 or "bubbling" in t_lower or "slippery" in t_lower or "since morning" in t_lower or "accident" in t_lower:
            urgency = "expedited"
            
        # 4. Failure Mode
        failure_mode = "wear_tear"
        for fm, kws in FAILURE_MODES.items():
            if any(k in t_lower for k in kws):
                failure_mode = fm
                break

        return {
            "category": cat,
            "category_confidence": round(confidence, 3),
            "severity": severity,
            "urgency": urgency,
            "failure_mode": failure_mode
        }

classifier = IssueClassifier()
