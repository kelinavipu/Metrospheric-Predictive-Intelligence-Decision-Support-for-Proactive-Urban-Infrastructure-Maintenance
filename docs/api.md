# UrbanPulse REST API Reference

Base URL: `http://localhost:8000/api/v1`
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 1. Assets
- `GET /assets`: List assets with filtering (`asset_type`, `ward_id`, `risk_band`, `min_health`, `limit`, `offset`).
- `GET /assets/{asset_id}`: Detailed asset profile with timeline, components, and linked complaints.
- `GET /assets/geojson`: GeoJSON FeatureCollection of infrastructure assets for map rendering.
- `GET /assets/wards`: List of 40 municipal wards with boundary polygons and demographic metrics.

## 2. Complaints & NLP
- `GET /complaints`: List complaints.
- `POST /complaints`: Submit a complaint (runs synchronous NLP, entity extraction, asset linking, and alerts).
- `POST /complaints/{id}/review`: Feedback loop for human annotator review.
- `POST /nlp/analyze`: Real-time text analysis returning category, severity, urgency, extracted entities, and linked asset.
- `GET /nlp/metrics`: Benchmark metrics (Macro-F1, entity F1, inference latency).

## 3. Health & Risk
- `GET /health-index/{asset_id}`: Current AHI (0-100) and component breakdown.
- `GET /health-index/summary`: System-wide health index and asset type averages.
- `GET /risk/ranking`: Assets ranked by Risk = Likelihood x Consequence.
- `GET /risk/weights`: Current multi-criteria decision weights.
- `PUT /risk/weights`: Update weights with live re-ranking.
- `POST /risk/override`: Manual planner override with audit trail.

## 4. Predictions & Survival
- `GET /predictions/{asset_id}`: Failure probabilities at 30, 90, 180 days and median RUL.
- `GET /predictions/survival/{asset_id}`: Weibull survival curve data points.
- `GET /predictions/{asset_id}/explain`: SHAP top feature drivers and narrative bullet points.
- `GET /predictions/top/failures`: Top high-risk predicted failures across the city.

## 5. Optimization & Simulation
- `POST /optimize/budget`: Run MILP knapsack budget allocation maximizing risk reduction.
- `POST /optimize/simulate`: Monte Carlo digital twin projecting 1-5 year trajectories.
- `GET /optimize/routes`: Scheduled crew stops with corridor bundling.

## 6. Work Orders & Field Crew
- `GET /work-orders`: List work orders by status.
- `POST /work-orders`: Create a work order.
- `POST /work-orders/{id}/approve`: Move to approved status.
- `POST /work-orders/{id}/start`: Mark work order in progress.
- `POST /work-orders/{id}/complete`: Complete work order and restore asset health.

## 7. Telemetry & Alerts
- `GET /sensors`: Active sensors with current status and anomaly flags.
- `GET /sensors/{id}/series`: Historical telemetry readings.
- `GET /alerts`: Active alerts filtered by state.
- `POST /alerts/{id}/ack`: Acknowledge an alert.
- `POST /alerts/{id}/resolve`: Resolve an alert.
- `WS /ws/alerts`: WebSocket real-time alert feed.
- `WS /ws/sensors`: WebSocket simulated sensor stream.
