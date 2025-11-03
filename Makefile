.PHONY: backend backend-prod frontend help

help:
	@echo "Available targets:"
	@echo "  backend       - Run FastAPI dev server with reload on 0.0.0.0:8000"
	@echo "  backend-prod  - Run FastAPI server without reload on 0.0.0.0:8000"
	@echo "  frontend      - Run Next.js dev server on http://localhost:3000"

backend:
	@PYTHONPATH=backend python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000

backend-prod:
	@PYTHONPATH=backend python -m uvicorn api:app --host 0.0.0.0 --port 8000

frontend:
	@cd frontend && npm run dev