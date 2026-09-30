"""
UrbanPulse Models & MLOps Router
Tracks model registry, champion/challenger versions, calibration, and drift monitors.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("")
def list_models():
    return [
        {
            "name": "failure_prediction_tabular",
            "version": "v2.4.0",
            "type": "HistGradientBoostingClassifier",
            "status": "champion",
            "auroc": 0.842,
            "pr_auc": 0.628,
            "brier_score": 0.084,
            "last_retrained": "2026-09-28",
            "drift_psi": 0.042,
            "drift_status": "stable"
        },
        {
            "name": "failure_prediction_challenger",
            "version": "v2.5.0-rc1",
            "type": "XGBoost + Stacking",
            "status": "challenger",
            "auroc": 0.856,
            "pr_auc": 0.645,
            "brier_score": 0.079,
            "last_retrained": "2026-09-30",
            "drift_psi": 0.038,
            "drift_status": "stable"
        },
        {
            "name": "survival_rul_weibull",
            "version": "v1.8.2",
            "type": "Parametric Weibull AFT",
            "status": "champion",
            "c_index": 0.738,
            "brier_integrated": 0.112,
            "last_retrained": "2026-09-25",
            "drift_psi": 0.051,
            "drift_status": "stable"
        },
        {
            "name": "sensor_anomaly_autoencoder",
            "version": "v1.2.0",
            "type": "Reconstruction Error Autoencoder",
            "status": "champion",
            "recall_at_5pct_fpr": 0.835,
            "lead_time_days": 18.4,
            "last_retrained": "2026-09-20",
            "drift_psi": 0.062,
            "drift_status": "stable"
        },
        {
            "name": "complaint_multitask_nlp",
            "version": "v3.1.0",
            "type": "Calibrated TF-IDF Multi-task",
            "status": "champion",
            "macro_f1": 0.884,
            "entity_f1": 0.842,
            "last_retrained": "2026-09-29",
            "drift_psi": 0.025,
            "drift_status": "stable"
        }
    ]

@router.get("/{name}/metrics")
def get_model_metrics(name: str):
    return {
        "model_name": name,
        "calibration_curve": [
            {"predicted": 0.05, "empirical": 0.048},
            {"predicted": 0.15, "empirical": 0.142},
            {"predicted": 0.25, "empirical": 0.239},
            {"predicted": 0.35, "empirical": 0.362},
            {"predicted": 0.45, "empirical": 0.448},
            {"predicted": 0.55, "empirical": 0.560},
            {"predicted": 0.65, "empirical": 0.635},
            {"predicted": 0.75, "empirical": 0.771},
            {"predicted": 0.85, "empirical": 0.842},
            {"predicted": 0.95, "empirical": 0.938}
        ],
        "lift_chart": [
            {"decile": 1, "lift": 3.8, "cumulative_lift": 3.8},
            {"decile": 2, "lift": 2.6, "cumulative_lift": 3.2},
            {"decile": 3, "lift": 1.7, "cumulative_lift": 2.7},
            {"decile": 4, "lift": 1.1, "cumulative_lift": 2.3},
            {"decile": 5, "lift": 0.5, "cumulative_lift": 1.9}
        ]
    }

@router.post("/retrain")
def trigger_retraining():
    return {
        "status": "initiated",
        "job_id": "job-retrain-992",
        "message": "Retraining pipeline initiated in background."
    }
