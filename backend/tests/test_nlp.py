"""
Tests for UrbanPulse NLP Module
Evaluates multi-task classification Macro-F1, entity-level NER F1, latency, and entity linking.
Target: Macro-F1 >= 0.85, Entity F1 >= 0.80, Latency < 500ms on CPU.
"""

import json
import pytest
from pathlib import Path
from backend.app.core.config import settings
from backend.app.nlp.engine import nlp_engine

@pytest.fixture
def gold_set():
    gold_path = settings.DATA_DIR / "labels" / "gold_evaluation_set.json"
    if not gold_path.exists():
        pytest.skip("Gold evaluation set not found. Run 'make data-gen' first.")
    return json.loads(gold_path.read_text())

def test_nlp_classification_macro_f1(gold_set):
    """Assert Macro-F1 >= 0.85 on gold evaluation set."""
    true_labels = []
    pred_labels = []
    
    for item in gold_set:
        text = item["text"]
        true_cat = item["category"]
        analysis = nlp_engine.analyze(text)
        pred_cat = analysis["category"]
        
        true_labels.append(true_cat)
        pred_labels.append(pred_cat)

    # Compute Macro-F1
    all_classes = set(true_labels)
    f1_scores = []
    
    for cls in all_classes:
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p == cls)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t != cls and p == cls)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p != cls)
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        f1_scores.append(f1)
        
    macro_f1 = sum(f1_scores) / len(f1_scores)
    print(f"\nEvaluated {len(gold_set)} gold complaints: Macro-F1 = {macro_f1:.3f}")
    assert macro_f1 >= 0.85, f"Expected Macro-F1 >= 0.85, got {macro_f1:.3f}"

def test_nlp_ner_entity_f1(gold_set):
    """Assert entity-level F1 >= 0.80."""
    total_gold = 0
    total_pred = 0
    correct = 0

    for item in gold_set:
        text = item["text"]
        gold_ents = item.get("entities", [])
        analysis = nlp_engine.analyze(text)
        pred_ents = analysis["entities"]

        total_gold += len(gold_ents)
        total_pred += len(pred_ents)

        gold_labels = {(e["text"].lower().strip(), e["label"]) for e in gold_ents}
        pred_labels = {(e["text"].lower().strip(), e["label"]) for e in pred_ents}

        correct += len(gold_labels.intersection(pred_labels))

    prec = correct / (total_pred + 1e-6)
    rec = correct / (total_gold + 1e-6)
    entity_f1 = (2 * prec * rec) / (prec + rec + 1e-6)

    print(f"\nEvaluated NER Spans: Precision = {prec:.3f}, Recall = {rec:.3f}, F1 = {entity_f1:.3f}")
    assert entity_f1 >= 0.80, f"Expected Entity-level F1 >= 0.80, got {entity_f1:.3f}"

def test_nlp_latency_benchmark(gold_set):
    """Assert CPU inference time is < 500 ms per complaint (target < 100ms)."""
    item = gold_set[0]
    analysis = nlp_engine.analyze(item["text"])
    assert analysis["inference_time_ms"] < 500.0, f"Latency too high: {analysis['inference_time_ms']} ms"

def test_section_18_anchor_nlp():
    """Verify Section 18 exact scenario NLP outputs."""
    sample_text = "Water is bubbling up near the bus stop opposite City Hospital on MG Road, been there since morning, road is getting slippery."
    res = nlp_engine.analyze(sample_text)

    assert res["category"] == "water_leak"
    assert res["severity"] == 3
    assert res["urgency"] == "expedited"
    
    entity_texts = [e["text"].lower() for e in res["entities"]]
    assert any("hospital" in t for t in entity_texts)
    assert any("mg road" in t for t in entity_texts)

    # Linked asset
    assert res["linked_asset"] is not None
    assert res["linked_asset"]["asset_id"] == "WM-0042"
    assert res["linked_asset"]["confidence"] >= 0.80
