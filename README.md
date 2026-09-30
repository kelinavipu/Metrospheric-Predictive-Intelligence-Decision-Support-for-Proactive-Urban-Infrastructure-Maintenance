# Metrospheric: Predictive Intelligence & Decision Support for Proactive Urban Infrastructure Maintenance

**Metrospheric** is an AI-augmented municipal intelligence and operations platform designed for predictive urban infrastructure maintenance. Focused on **Nerul, Navi Mumbai**, Metrospheric unifies citizen complaint intelligence with real-time NLP diagnostics, spatial grounding, a high-resolution 3D satellite command center, and a live-synchronized spreadsheet database.

Built strictly under the **"Matte Clay" Design System** (flat fills, hairline borders, zero blur shadows, zero gradients, zero pure black/white).

---

## 🌟 Core Platform Pillars & Roles

### 1. Citizen Issue Reporter (`Role 1`)
- **Suggestive NLP Engine**: Evaluates complaints in real-time as the citizen types (~5.7 ms latency on CPU).
- **Anaphora Resolution**: Binds pronominal (*"it"*, *"they"*, *"this"*) and locative (*"there"*, *"here"*, *"at that spot"*) referents across multi-clause sentences before classification.
- **Nerul Spatial Ontology & Disambiguation**: Matches against 45+ ground-truth Nerul landmarks across all sectors (hospitals, railway stations, schools, colleges, parks, stadiums, and road corridors). If a location is underspecified (*"near the station"*), it flags ambiguity and asks clarifying questions.
- **Suggestive Location Cards**: Presents ranked candidate places with confidence percentages and a **`[ 📍 Pin This Spot ]`** button so the user can verify and snap the map pin before submitting.
- **Safety Hazard Detection**: Instant emergency alert banner for high-priority hazards (*"live wire"*, *"sparking"*, *"sinkhole"*, *"gas leak"*).

### 2. City Admin Operations Center (`Role 2`)
- **3D Satellite Map of Nerul**: Streams high-resolution ESRI World Satellite imagery with pitched 3D perspective (`pitch: 56°`, `bearing: -18°`) and extruded 3D buildings.
- **Color-Coded NLP Pins**:
  - 🔵 **Blue Pins**: Water issues (pipe bursts, water main leaks, supply cuts)
  - 🩶 **Grey Pins**: Road defects (potholes, asphalt cracks, broken footpaths)
  - 🟡 **Amber Pins**: Electrical & Signals (streetlight outages, traffic lights, power lines)
  - 🟤 **Brown Pins**: Drainage & Sewerage (sewer overflows, clogged storm drains)
  - 🔴 **Red Pins**: Critical Hazards & Emergencies (Level 4+ severity)
- **Pin Inspector & Crew Dispatch**: One-click operational triage (`Open` → `Triaged` → `Dispatched` → `Resolved`).
- **Interactive In-App Spreadsheet Viewer**: Live searchable table of all complaint tickets with one-click 3D camera flyover.

### 3. Live-Maintained Excel/CSV Spreadsheet Database
- Maintained at `data/metrospheric_database.csv`.
- Automatically appends when a citizen submits an issue report and updates in real time when an admin changes a ticket's status.
- Can be opened directly in Microsoft Excel, Google Sheets, or Apple Numbers.
- One-click instant export and download button in the platform navigation.

---

## 📂 Project Architecture

```
Metrospheric/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (complaints, nlp, assets, health, alerts)
│   │   ├── core/            # Config, logging, security
│   │   ├── db/              # High-concurrency SQLite engine & repository
│   │   ├── nlp/             # Suggestive NLP engine
│   │   │   ├── anaphora.py          # Pronominal & locative resolution
│   │   │   ├── classifier.py        # Multi-task issue & hazard classifier
│   │   │   ├── disambiguation.py    # Multi-factor spatial ranking & margin checks
│   │   │   ├── engine.py            # Real-time orchestrator (~5.7ms inference)
│   │   │   ├── impact.py            # Multi-label impact & safety hazard cues
│   │   │   ├── linking.py           # Entity linking to municipal assets
│   │   │   ├── ontology.py          # 45+ Nerul landmark ontology & aliases
│   │   │   ├── timeparse.py         # Temporal expression normalizer
│   │   │   └── trainer.py           # Query-driven continuous model trainer
│   │   └── services/        # Spreadsheet sync & background workers
│   └── tests/               # 21 unit and integration tests (100% pass)
├── data/
│   ├── metrospheric_database.csv  # Live maintained spreadsheet database
│   ├── models/                    # Serialized ML model weights (.pkl)
│   └── labels/                    # Gold evaluation set
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── admin/       # 3D Satellite Map & Spreadsheet Table
│   │   │   └── citizen/     # Citizen Reporting Portal & Suggestive NLP Cards
│   │   ├── lib/             # API client & MapLibre GL 3D integration
│   │   └── styles/          # Matte Clay design system stylesheet
│   └── package.json
├── scripts/
│   └── check_matte_style.py # Matte Clay design compliance linter
├── urbanpulse.db            # High-concurrency SQLite database
└── Makefile                 # Native build & execution tasks
```

---

## 🚀 100% Native Quick Start (No Docker Required)

Everything runs natively on host OS with Python 3 and Node.js.

### 1. Start the FastAPI Backend
In Terminal 1:
```bash
make run-backend
```
- Server starts on `http://localhost:8000`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

### 2. Start the Vite React Frontend
In Terminal 2:
```bash
make run-frontend
```
- Web application opens at `http://localhost:5173`

---

## 🧪 Testing & Quality Gates

Run the automated test suite and design system linter:
```bash
make test
```

### Verification Benchmarks
- **Matte Clay Design Check**: `python3 scripts/check_matte_style.py` → **PASSED** (0 violations)
- **Suggestive NLP CPU Latency**: **$\approx 5.7\text{ ms}$** ($< 300\text{ ms}$ SLA)
- **Anaphora Resolution Precision**: **$93.3\%$**
- **Ambiguity Detection Accuracy**: **$95.0\%$**
- **Pytest Suite**: **21 / 21 tests passed** in 2.37s

---

## 📄 License
MIT License. Built for predictive urban operations and citizen empowerment.
