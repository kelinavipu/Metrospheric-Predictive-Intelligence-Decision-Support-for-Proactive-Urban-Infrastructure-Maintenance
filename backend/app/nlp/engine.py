"""
Metrospheric NLP Engine
Orchestrates preprocessing, anaphora resolution, multi-task query classification,
hybrid NER, temporal normalization, impact extraction, and ambiguity-aware location grounding.
"""

import time
from typing import Dict, Any, Optional
from backend.app.nlp.preprocess import normalize_text
from backend.app.nlp.classifier import classifier
from backend.app.nlp.ner import ner
from backend.app.nlp.linking import linker
from backend.app.nlp.anaphora import anaphora_resolver
from backend.app.nlp.disambiguation import disambiguation_engine
from backend.app.nlp.timeparse import time_normalizer
from backend.app.nlp.impact import impact_extractor
from backend.app.nlp.trainer import query_trainer

class NLPEngine:
    def suggest(self, text: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        """
        Suggestive inference endpoint called in real-time as citizens type.
        Resolves anaphora, detects ambiguities, and recommends places before map tagging.
        """
        t0 = time.perf_counter()
        cleaned_text = normalize_text(text)

        # 1. Anaphora resolution
        anaphora_res = anaphora_resolver.resolve(text)
        effective_text = anaphora_res["resolved_text"] if anaphora_res["has_anaphora"] else text

        # 2. Multi-task classification
        cls_res = classifier.classify(normalize_text(effective_text))
        category = cls_res["category"]
        cat_conf = cls_res["category_confidence"]
        severity = cls_res["severity"]
        urgency = cls_res["urgency"]

        # 3. Location grounding & Disambiguation
        grounding = disambiguation_engine.ground_location(
            text=effective_text,
            category=category,
            user_lat=lat,
            user_lon=lon
        )

        # 4. Multi-label impact and safety flags
        impacts, safety_flag, safety_cues = impact_extractor.extract_impacts(
            text=effective_text,
            category=category,
            severity=severity
        )

        # 5. Temporal normalization
        time_res = time_normalizer.normalize(text)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "problem": category.replace("_", " "),
            "domain": category,
            "category": category,
            "category_confidence": cat_conf,
            "severity": severity,
            "urgency": urgency,
            "safety_flag": safety_flag,
            "safety_cues": safety_cues,
            "impacts": impacts,
            "time": time_res,
            "anaphora": {
                "has_anaphora": anaphora_res["has_anaphora"],
                "resolved_text": anaphora_res["resolved_text"],
                "chains": anaphora_res["anaphora_chains"]
            },
            "location_grounding": {
                "is_ambiguous": grounding["is_ambiguous"],
                "clarifying_question": grounding["clarifying_question"],
                "top_candidate": grounding["top_candidate"],
                "suggestions": grounding["candidates"]
            },
            "needs_review": grounding["is_ambiguous"] or cat_conf < 0.70 or safety_flag,
            "inference_time_ms": round(elapsed_ms, 2)
        }

    def analyze(self, text: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        """Full analysis pipeline providing both legacy fields and structured incident fields."""
        t0 = time.perf_counter()
        
        # Run suggestive pipeline
        suggest_res = self.suggest(text, lat=lat, lon=lon)
        
        # Run hybrid NER & asset linking
        entities = ner.extract_entities(text)
        linked_asset, candidates = linker.link_asset(
            text=text,
            category=suggest_res["category"],
            entities=entities,
            lat=lat,
            lon=lon
        )
        
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        
        return {
            "category": suggest_res["category"],
            "category_confidence": suggest_res["category_confidence"],
            "severity": suggest_res["severity"],
            "urgency": suggest_res["urgency"],
            "failure_mode": suggest_res["category"],
            "entities": entities,
            "linked_asset": linked_asset,
            "candidate_assets": candidates,
            "problem": suggest_res["problem"],
            "domain": suggest_res["domain"],
            "place": suggest_res["location_grounding"],
            "time": suggest_res["time"],
            "impacts": suggest_res["impacts"],
            "safety_flag": suggest_res["safety_flag"],
            "safety_cues": suggest_res["safety_cues"],
            "needs_review": suggest_res["needs_review"],
            "anaphora": suggest_res["anaphora"],
            "inference_time_ms": round(elapsed_ms, 2)
        }

nlp_engine = NLPEngine()
