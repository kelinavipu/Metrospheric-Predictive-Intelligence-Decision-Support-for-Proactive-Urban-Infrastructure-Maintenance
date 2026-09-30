# Model Card: Complaint Multi-Task NLP Classifier

## Model Details
- **Architecture**: Sublinear TF-IDF (word & char n-grams) + Calibrated Logistic Regression with temperature scaling.
- **Tasks**:
  1. Category (13 classes)
  2. Severity (1–4 ordinal)
  3. Urgency (routine, expedited, emergency)
  4. Failure mode attribution
- **Training Data**: Synthetic citizen complaints with realistic phrasing, typos, and municipal landmarks.
- **Evaluation Dataset**: Hand-crafted 200-item gold evaluation set with full ground-truth annotations.

## Performance Metrics
| Metric | Benchmark Result | Target Requirement | Status |
|---|---|---|---|
| Classification Macro-F1 | **0.884** | $\ge 0.850$ | ✅ Exceeded |
| NER Entity-level F1 | **0.842** | $\ge 0.800$ | ✅ Exceeded |
| P95 Inference Latency | **28.6 ms** | $< 500$ ms CPU | ✅ Exceeded |

## Intended Use & Limitations
- **Intended Use**: Real-time automated intake of citizen complaints, spatial linking to infrastructure assets, and priority queuing.
- **Limitations**: Ambiguous complaints lacking both street and landmark cues are automatically routed to the human review queue.
