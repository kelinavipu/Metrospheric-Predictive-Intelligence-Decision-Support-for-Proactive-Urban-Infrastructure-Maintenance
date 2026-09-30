"""
Automated Test Suite for Metrospheric Suggestive NLP Engine
Tests:
- Pronominal & locative anaphora resolution
- Ambiguity detection & location grounding against Nerul spatial ontology
- Temporal normalization relative to received_at
- Multi-label impact & emergency safety flag extraction
- Query-based model training & CPU inference latency benchmark
"""

import pytest
import time
from backend.app.nlp.anaphora import anaphora_resolver
from backend.app.nlp.disambiguation import disambiguation_engine
from backend.app.nlp.timeparse import time_normalizer
from backend.app.nlp.impact import impact_extractor
from backend.app.nlp.trainer import query_trainer
from backend.app.nlp.engine import nlp_engine

def test_pronominal_anaphora_resolution():
    text = "A severe water pipe burst occurred on Palm Beach Road. It has flooded the roadway."
    res = anaphora_resolver.resolve(text)
    assert res["has_anaphora"]
    chains = res["anaphora_chains"]
    assert any(c["pronoun"].lower() == "it" and "pipe burst" in c["antecedent"].lower() for c in chains)
    assert "[pipe burst]" in res["resolved_text"].lower()

def test_locative_anaphora_resolution():
    text = "Large crater and pothole opened near Wonders Park. There multiple cars had tire punctures."
    res = anaphora_resolver.resolve(text)
    assert res["has_anaphora"]
    chains = res["anaphora_chains"]
    assert any(c["pronoun"].lower() == "there" and "wonders park" in c["antecedent"].lower() for c in chains)
    assert "[at wonders park]" in res["resolved_text"].lower()

def test_combined_pronominal_and_locative_anaphora():
    text = "Major pipe burst near Dr. D.Y. Patil Hospital. It is spraying water high into the air and there the road is closed."
    res = anaphora_resolver.resolve(text)
    assert len(res["anaphora_chains"]) >= 2
    types = {c["antecedent_type"] for c in res["anaphora_chains"]}
    assert "defect_asset" in types
    assert "landmark_location" in types

def test_ambiguity_detection_underspecified_station():
    text = "Broken footpath and open trench near the station"
    grounding = disambiguation_engine.ground_location(text, category="footpath_damage")
    assert grounding["is_ambiguous"] is True
    assert grounding["clarifying_question"] is not None
    assert len(grounding["candidates"]) >= 2
    names = [c["name"] for c in grounding["candidates"]]
    assert any("Railway Station" in n for n in names)

def test_unambiguous_explicit_landmark():
    text = "Traffic signal lights completely off at Dr. D.Y. Patil Hospital junction"
    grounding = disambiguation_engine.ground_location(text, category="signal_malfunction")
    assert grounding["is_ambiguous"] is False
    assert "D.Y. Patil Hospital" in grounding["top_candidate"]["name"]
    assert grounding["top_candidate"]["confidence"] >= 0.80

def test_temporal_normalization():
    res1 = time_normalizer.normalize("Water main leak ongoing since morning")
    assert res1["has_time"] is True
    assert "T08:00:00" in res1["normalized_iso"]

    res2 = time_normalizer.normalize("Pothole reported yesterday evening")
    assert res2["has_time"] is True
    assert res2["confidence"] >= 0.90

def test_impact_and_safety_flags():
    # Regular impact
    text1 = "Pothole on Sector 19A road, traffic is blocked and two wheelers are skidding"
    impacts1, safety1, cues1 = impact_extractor.extract_impacts(text1, category="pothole", severity=2)
    assert "traffic_blocked" in impacts1
    assert "injury_risk" in impacts1
    assert not safety1

    # Safety critical hazard
    text2 = "Live wire sparking dangerously near school children on pavement"
    impacts2, safety2, cues2 = impact_extractor.extract_impacts(text2, category="streetlight_outage", severity=4)
    assert safety2 is True
    assert len(cues2) >= 1

def test_full_nlp_suggest_engine_latency():
    text = "Severe sewer overflow near Seawoods Grand Central since yesterday. It is bubbling up and there pedestrian access is blocked."
    t0 = time.perf_counter()
    s = nlp_engine.suggest(text)
    latency_ms = (time.perf_counter() - t0) * 1000.0

    assert latency_ms < 150.0  # Well below 300ms CPU budget
    assert s["anaphora"]["has_anaphora"] is True
    assert s["location_grounding"]["top_candidate"] is not None
    assert "Seawoods" in s["location_grounding"]["top_candidate"]["name"]
    assert s["category"] in ["sewer_overflow", "drainage_flooding"]

def test_query_model_train_and_predict():
    train_res = query_trainer.train(use_db=False)
    assert train_res["status"] == "trained"
    assert train_res["samples_trained"] >= 5
    
    pred = query_trainer.predict("Water pipe burst geyser flooding Palm Beach Road")
    assert pred["category"] in ["pipe_burst", "water_leak"]
    assert pred["severity"] >= 3

def test_electrical_hazard_classification():
    text = "Electric pole damaged with broken live wire sparking on the street near Apeejay School in Sector 15!"
    res = nlp_engine.suggest(text)
    assert res["category"] == "electrical_hazard"
    assert res["severity"] == 4
    assert res["urgency"] == "emergency"
    assert res["safety_flag"] is True
    assert "live wire" in res["safety_cues"]
    assert res["location_grounding"]["top_candidate"]["name"] == "Apeejay School Nerul"

