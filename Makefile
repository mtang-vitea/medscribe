.PHONY: backend backend-prod frontend help docker-build compose-up compose-prod compose-dev compose-down compose-logs

help:
	@echo "Available targets:"
	@echo "  backend        - Run FastAPI dev server with reload on 0.0.0.0:8093"
	@echo "  backend-prod   - Run FastAPI server without reload on 0.0.0.0:8093"
	@echo "  frontend       - Run Next.js dev server on http://localhost:8094"
	@echo "  docker-build   - Build all Docker images"
	@echo "  compose-up     - Start services with docker compose (prod)"
	@echo "  compose-prod   - Start services in detached mode (prod)"
	@echo "  compose-dev    - Start services with live reload for backend (dev)"
	@echo "  compose-down   - Stop and remove services"
	@echo "  compose-logs   - Tail compose logs"

backend:
	@PYTHONPATH=backend python -m uvicorn api:app --reload --host 0.0.0.0 --port 8093

backend-prod:
	@PYTHONPATH=backend python -m uvicorn api:app --host 0.0.0.0 --port 8093

frontend:
	@cd frontend && npm run dev -- --port 8094

# Docker/Compose helpers
compose-up:
	@docker-compose --project-name medscribe --profile prod up --build

compose-prod:
	@docker-compose --project-name medscribe --profile prod up --build -d

compose-dev:
	@docker-compose \
		--project-name medscribe \
		--profile dev \
		--file docker-compose.yml \
		--file docker-compose.dev.yml \
		up --build

compose-down:
	@docker-compose --project-name medscribe down -v

compose-logs:
	@docker-compose --project-name medscribe logs -f
