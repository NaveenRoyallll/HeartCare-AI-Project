.PHONY: help setup backend mobile doctor-dashboard test lint clean migrate seed docker-up docker-down test-backend test-ai

help:
	@echo "CardioGuard AI - Development Commands"
	@echo "====================================="
	@echo "make setup              - Set up all development environments"
	@echo "make backend            - Start the backend API server"
	@echo "make mobile             - Start the mobile app (Expo)"
	@echo "make doctor-dashboard   - Start the doctor dashboard"
	@echo "make test               - Run all tests"
	@echo "make test-backend       - Run backend tests only"
	@echo "make test-ai            - Run AI module tests only"
	@echo "make lint               - Run linters"
	@echo "make migrate            - Run database migrations"
	@echo "make seed               - Seed the database with synthetic data"
	@echo "make clean              - Clean build artifacts"
	@echo "make docker-up          - Start all Docker services"
	@echo "make docker-down        - Stop all Docker services"

setup:
	@echo "Setting up backend..."
	cd backend && python -m venv venv && .\venv\Scripts\pip install -r requirements.txt
	@echo "Setting up mobile..."
	cd frontend/mobile && npm install
	@echo "Setting up doctor dashboard..."
	cd frontend/doctor-dashboard && npm install
	@echo "Setup complete!"

backend:
	cd backend && .\venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

mobile:
	cd frontend/mobile && npx expo start

doctor-dashboard:
	cd frontend/doctor-dashboard && npm run dev

test:
	$(MAKE) test-backend
	$(MAKE) test-ai

test-backend:
	cd backend && .\venv\Scripts\python -m pytest tests/ -v

test-ai:
	cd ai && python -m pytest tests/ -v

lint:
	cd backend && .\venv\Scripts\ruff check .
	cd frontend/doctor-dashboard && npm run lint

migrate:
	cd backend && .\venv\Scripts\python -m alembic upgrade head

seed:
	cd backend && .\venv\Scripts\python -m scripts.seed_database

clean:
	rm -rf backend/venv backend/__pycache__ backend/cardioguard.db
	rm -rf frontend/mobile/node_modules frontend/doctor-dashboard/node_modules
	rm -rf frontend/doctor-dashboard/.next

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
