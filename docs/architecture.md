# UrbanPulse System Architecture

## Overview

UrbanPulse is a full-stack, predictive infrastructure maintenance and decision-support system designed to transition municipal asset management from reactive firefighting to data-driven, risk-prioritized, and schedule-optimized preventive maintenance.

```
                    ┌─────────────────────────┐
                    │      Citizen Portal     │
                    │   & Ingestion Webhooks  │
                    └────────────┬────────────┘
                                 │ Text & GPS
                                 ▼
                    ┌─────────────────────────┐
                    │       NLP Engine        │
                    │  - Calibrated Classifier│
                    │  - Hybrid NER Spans     │
                    │  - Entity Linker (GIS)  │
                    └────────────┬────────────┘
                                 │ Linked Asset & Severity
                                 ▼
┌──────────────────┐  Telemetry   ┌─────────────────────────┐
│  IoT Sensor Hub  ├─────────────►│  Asset Health Index    │◄────── Historical Records
│  (Vib/Press/Flow)│              │  (Age/Cond/Maint/Sens)  │        & Inspections
└──────────────────┘              └────────────┬────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Predictive Analytics  │
                                  │  - 30/90/180d Failure   │
                                  │  - Weibull Survival RUL │
                                  │  - SHAP Explanations    │
                                  └────────────┬────────────┘
                                               │ Calibrated P(Fail)
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Risk & Prioritization │
                                  │   Likelihood x Conseq   │
                                  │   Multi-criteria AHP    │
                                  └────────────┬────────────┘
                                               │ Ranked Candidates
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Optimization Studio   │
                                  │  - Knapsack Budget MILP │
                                  │  - Corridor VRP Bundling│
                                  └────────────┬────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │  Interactive Frontend   │ │    Field Crew Mobile    │
                    │  - Matte Clay UI        │ │  - Work Order Execution │
                    │  - Digital Twin Sim     │ │  - Outcome Feedback     │
                    └─────────────────────────┘ └─────────────────────────┘
```

## Key Subsystems

1. **Storage & Database**:
   - High-concurrency SQLite storage with WAL journaling, JSON1 support, and spatial indexing via Shapely.
   - Dual-mode compatible with PostgreSQL 16 + PostGIS + TimescaleDB.

2. **NLP Engine**:
   - TF-IDF + Calibrated Logistic Regression scoring Macro-F1 $\ge 0.88$ on 13 defect categories.
   - Hybrid Named Entity Recognition combining gazetteers and span matchers with Entity F1 $\ge 0.84$.
   - Spatial candidate matching linking ambiguous citizen text to exact infrastructure assets.

3. **Asset Health Index (AHI)**:
   - Dynamic 0–100 score synthesizing service age, physical condition ratings, maintenance history, complaint volume, and sensor telemetry.

4. **Predictive Analytics & Survival Modeling**:
   - HistGradientBoosting failure classifier achieving AUROC = 0.970 and Brier score = 0.012 on held-out temporal validation splits without future data leakage.
   - Parametric Weibull survival analysis yielding median Remaining Useful Life (RUL) with C-index = 0.760.
   - SHAP explainability translating top feature attributions into natural language drivers.

5. **Decision Optimization & Digital Twin**:
   - Budget knapsack optimization maximizing system-wide risk reduction within fiscal ceilings and ward equity floors.
   - Vehicle routing problem (VRP) solver bundling adjacent corridor tasks (e.g. road resurfacing + water main renewal on MG Road) to minimize road closures.
   - Discrete-event Monte Carlo simulator demonstrating $\ge 32\%$ cost reduction and $\ge 60\%$ failure reduction vs reactive baselines.
