"""
UrbanPulse Backend Main Application
FastAPI REST API and WebSockets server for Predictive Urban Infrastructure Maintenance.
"""

import asyncio
import json
import random
import time
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.database import init_db
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.assets import router as assets_router
from backend.app.api.v1.complaints import router as complaints_router
from backend.app.api.v1.nlp_router import router as nlp_router
from backend.app.api.v1.health_router import router as health_router
from backend.app.api.v1.predictions_router import router as predictions_router
from backend.app.api.v1.risk_router import router as risk_router
from backend.app.api.v1.optimize_router import router as optimize_router
from backend.app.api.v1.work_orders_router import router as work_orders_router
from backend.app.api.v1.sensors_router import router as sensors_router
from backend.app.api.v1.alerts_router import router as alerts_router
from backend.app.api.v1.kpi_router import router as kpi_router
from backend.app.api.v1.models_router import router as models_router
from backend.app.api.v1.data_router import router as data_router

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Driven Predictive Urban Infrastructure Maintenance & Decision Support System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(assets_router, prefix="/api/v1")
app.include_router(complaints_router, prefix="/api/v1")
app.include_router(nlp_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(optimize_router, prefix="/api/v1")
app.include_router(work_orders_router, prefix="/api/v1")
app.include_router(sensors_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(kpi_router, prefix="/api/v1")
app.include_router(models_router, prefix="/api/v1")
app.include_router(data_router, prefix="/api/v1")

# WebSocket connection managers
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_connections = set()
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead_connections.add(conn)
        self.active_connections -= dead_connections

alerts_manager = ConnectionManager()
sensors_manager = ConnectionManager()

@app.on_event("startup")
def on_startup():
    logger.info("Starting UrbanPulse service...")
    init_db()

@app.get("/healthz")
def healthz():
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}

@app.get("/readyz")
def readyz():
    return {"status": "ready", "database": "connected"}

# WebSocket Endpoints
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await alerts_manager.connect(websocket)
    try:
        while True:
            # Keep-alive ping/pong
            await websocket.receive_text()
    except WebSocketDisconnect:
        alerts_manager.disconnect(websocket)

@app.websocket("/ws/sensors")
async def websocket_sensors(websocket: WebSocket):
    await sensors_manager.connect(websocket)
    try:
        # Stream periodic simulated telemetry ticks
        while True:
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            tick = {
                "time": now_iso,
                "sensor_id": "SN-042",
                "asset_id": "WM-0042",
                "metric": "pressure",
                "value": round(48.5 + random.gauss(0, 1.8), 2),
                "quality_flag": "good"
            }
            await websocket.send_json(tick)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        sensors_manager.disconnect(websocket)
    except Exception:
        sensors_manager.disconnect(websocket)
