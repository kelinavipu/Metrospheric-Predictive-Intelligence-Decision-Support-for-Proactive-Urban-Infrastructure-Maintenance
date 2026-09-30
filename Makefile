.PHONY: help setup data-gen load train test check-style run-backend run-frontend run-dev docker-up docker-down

PYTHON ?= python3
SIZE ?= medium
SEED ?= 42

help:
	@echo "UrbanPulse - Decision Support & Predictive Maintenance System"
	@echo "Commands:"
	@echo "  make setup         - Setup development environment & install dependencies"
	@echo "  make data-gen      - Generate synthetic city data (SIZE=small|medium|large SEED=42)"
	@echo "  make load          - Ingest generated data into the database"
	@echo "  make train         - Train NLP, failure classification, and survival models"
	@echo "  make test          - Run test suites and quality gates"
	@echo "  make check-style   - Verify Matte Clay design system compliance"
	@echo "  make run-backend   - Run FastAPI backend locally"
	@echo "  make run-frontend  - Run Vite frontend locally"
	@echo "  make run-dev       - Run both backend and frontend concurrently"
	@echo "  make docker-up     - Launch full container stack via docker-compose"
	@echo "  make docker-down   - Tear down container stack"

setup:
	@echo "Setting up UrbanPulse..."
	@cp -n .env.example .env || true
	@chmod +x scripts/*.py 2>/dev/null || true

data-gen:
	@echo "Generating synthetic dataset (SIZE=$(SIZE), SEED=$(SEED))..."
	$(PYTHON) -m data_gen.generate --size $(SIZE) --seed $(SEED)

load:
	@echo "Loading generated data into database..."
	$(PYTHON) -m backend.app.ingest.batch_loader

train:
	@echo "Training models and logging metrics..."
	$(PYTHON) -m backend.app.ml.train_all

test: check-style
	@echo "Running test suite..."
	$(PYTHON) -m pytest backend/tests -v

check-style:
	@echo "Checking Matte Clay design system compliance..."
	$(PYTHON) scripts/check_matte_style.py

run-backend:
	@echo "Starting FastAPI backend server on port 8000..."
	$(PYTHON) -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	@echo "Starting Vite frontend server on port 5173..."
	cd frontend && npm run dev

run-dev:
	@echo "Starting UrbanPulse full-stack native application..."
	@echo "Backend will start on http://localhost:8000"
	$(PYTHON) -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
