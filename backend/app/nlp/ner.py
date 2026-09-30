"""
UrbanPulse Hybrid Named Entity Recognition (NER)
Extracts: ASSET_TYPE, ASSET_ID, STREET, LANDMARK, DEFECT, MEASUREMENT, DATE/TIME, SEVERITY_CUE, MATERIAL.
Uses gazetteer matching + regex + boundary normalization.
"""

import re
from typing import List, Dict, Any

STREET_GAZETTEER = [
    "palm beach road", "sion-panvel highway", "uran road", "dr. d.y. patil vidyanagar marg",
    "nerul station road", "wonders park marg", "jewel of navi mumbai arterial", "sector 19a spine",
    "terna hospital road", "seawoods grand central avenue", "karave road",
    "mg road", "hospital road", "central cross", "market street",
    "station road", "park avenue", "industrial way", "riverfront blvd",
    "brigade highway", "ring road", "airport arterial", "subway link",
    "1st cross", "2nd cross", "5th main"
]

LANDMARKS = [
    "dr. d.y. patil hospital & medical college", "dr. d.y. patil hospital", "d.y. patil hospital",
    "apollo hospitals nerul", "apollo hospital", "apollo hospitals",
    "terna speciality hospital", "terna hospital", "sunshine hospital",
    "dr. d.y. patil sports stadium", "d.y. patil stadium", "sies graduate school of technology", "sies",
    "apeejay school nerul", "apeejay school", "dav public school seawoods", "dav public school",
    "sterling institute of technology", "sterling institute", "hotel yogi executive", "the park navi mumbai",
    "seawoods grand central mall", "seawoods grand central", "wonders park", "rock garden nerul", "rock garden",
    "jewel of navi mumbai", "nerul holding pond", "nerul railway station", "seawoods-darave railway station",
    "juinagar railway station", "nerul gymkhana",
    "city hospital", "general hospital north", "st. mary medical center", "central hospital",
    "central park", "metro station", "bus stop", "central fire station", "public library",
    "city hall", "high school", "market square", "town hall", "railway station", "bus terminal"
]


ASSET_TYPES = [
    ("water main", "water_main"),
    ("water pipe", "water_main"),
    ("sewer line", "sewer_line"),
    ("storm drain", "storm_drain"),
    ("streetlight", "streetlight"),
    ("street light", "streetlight"),
    ("traffic signal", "traffic_signal"),
    ("traffic light", "traffic_signal"),
    ("footpath", "footpath"),
    ("sidewalk", "footpath"),
    ("culvert", "culvert"),
    ("manhole", "manhole"),
    ("bridge", "bridge"),
    ("road", "road_segment"),
    ("water", "water_main")
]

DEFECT_KEYWORDS = [
    "bubbling up", "bubbling", "gushing", "leaking", "leak", "burst", "pothole", "crater", "sinkhole",
    "cracking", "spalling", "clogged", "overflowing", "flickering", "dark", "broken slab", "rutting", "subsidence"
]

SEVERITY_CUES = [
    "dangerous", "slippery", "hazard", "immediate", "urgent", "accident", "skidding", "severe"
]

STOPWORDS = {"on", "in", "at", "near", "opposite", "along", "by", "the", "a", "an", "and"}
STREET_SUFFIXES = r"(?:road|rd|street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|way|cross|main|arterial)"
GENERIC_STREET_PAT = re.compile(rf"\b((?:[A-Za-z0-9\.\'\-]+\s+){{1,3}}{STREET_SUFFIXES})\b", re.IGNORECASE)
ASSET_ID_PATTERN = re.compile(r"\b([A-Z]{2,4}-\d{3,6})\b", re.IGNORECASE)
MEASUREMENT_PATTERN = re.compile(r"\b(\d+(?:\.\d+)?\s*(?:cm|mm|m|meters|inches|feet|ft|depth|wide|long))\b", re.IGNORECASE)
TIME_PATTERN = re.compile(r"\b(since morning|yesterday|today|last night|last week|for \d+ days?|since \d+ hours?)\b", re.IGNORECASE)

class HybridNER:
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        entities: List[Dict[str, Any]] = []
        t_lower = text.lower()

        # 1. Asset IDs
        for match in ASSET_ID_PATTERN.finditer(text):
            entities.append({
                "text": match.group(0),
                "label": "ASSET_ID",
                "start": match.start(),
                "end": match.end()
            })

        # 2. Landmarks
        for lm in LANDMARKS:
            start = 0
            while True:
                idx = t_lower.find(lm, start)
                if idx == -1:
                    break
                entities.append({
                    "text": text[idx : idx + len(lm)],
                    "label": "LANDMARK",
                    "start": idx,
                    "end": idx + len(lm)
                })
                start = idx + len(lm)

        # 3. Known Street Gazetteer
        for st in STREET_GAZETTEER:
            start = 0
            while True:
                idx = t_lower.find(st, start)
                if idx == -1:
                    break
                entities.append({
                    "text": text[idx : idx + len(st)],
                    "label": "STREET",
                    "start": idx,
                    "end": idx + len(st)
                })
                start = idx + len(st)

        # 4. Generic Street Regex
        for match in GENERIC_STREET_PAT.finditer(text):
            matched_span = match.group(1)
            words = matched_span.split()
            # Clean leading stopwords
            while words and words[0].lower() in STOPWORDS:
                words.pop(0)
            if words:
                clean_street = " ".join(words)
                start_offset = match.start() + match.group(0).find(clean_street)
                end_offset = start_offset + len(clean_street)
                # Check overlap
                if not any(e["start"] <= start_offset and e["end"] >= end_offset for e in entities):
                    entities.append({
                        "text": clean_street,
                        "label": "STREET",
                        "start": start_offset,
                        "end": end_offset
                    })

        # 5. Defects
        for defect in DEFECT_KEYWORDS:
            start = 0
            while True:
                idx = t_lower.find(defect, start)
                if idx == -1:
                    break
                entities.append({
                    "text": text[idx : idx + len(defect)],
                    "label": "DEFECT",
                    "start": idx,
                    "end": idx + len(defect)
                })
                start = idx + len(defect)

        # 6. Severity Cues
        for cue in SEVERITY_CUES:
            start = 0
            while True:
                idx = t_lower.find(cue, start)
                if idx == -1:
                    break
                entities.append({
                    "text": text[idx : idx + len(cue)],
                    "label": "SEVERITY_CUE",
                    "start": idx,
                    "end": idx + len(cue)
                })
                start = idx + len(cue)

        # 7. Measurements
        for match in MEASUREMENT_PATTERN.finditer(text):
            entities.append({
                "text": match.group(0),
                "label": "MEASUREMENT",
                "start": match.start(),
                "end": match.end()
            })

        # 8. Date / Time
        for match in TIME_PATTERN.finditer(text):
            entities.append({
                "text": match.group(0),
                "label": "DATE/TIME",
                "start": match.start(),
                "end": match.end()
            })

        # 9. Asset Types
        for name, norm in ASSET_TYPES:
            start = 0
            while True:
                idx = t_lower.find(name, start)
                if idx == -1:
                    break
                # Only if not already part of a landmark or street
                if not any(e["start"] <= idx and e["end"] >= idx + len(name) for e in entities if e["label"] in ("LANDMARK", "STREET")):
                    entities.append({
                        "text": text[idx : idx + len(name)],
                        "label": "ASSET_TYPE",
                        "start": idx,
                        "end": idx + len(name)
                    })
                start = idx + len(name)

        # Resolve overlaps: keep longer spans, sort by start position
        entities.sort(key=lambda x: (x["start"], -(x["end"] - x["start"])))
        filtered = []
        last_end = -1
        for e in entities:
            if e["start"] >= last_end:
                filtered.append(e)
                last_end = e["end"]

        return filtered

ner = HybridNER()
