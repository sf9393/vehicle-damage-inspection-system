.DEFAULT_GOAL := help
PYTHON ?= python3
VENV := .venv

.PHONY: help test run-api install-api build-web clean

help:
	@echo "make test       Run API unit tests and syntax checks"
	@echo "make install-api Install the complete model inference runtime"
	@echo "make run-api    Start the local inference API on http://localhost:8080"
	@echo "make build-web  Build the dashboard (requires Node 22+)"

test:
	PYTHON_BIN=$(PYTHON) ./scripts/test.sh

install-api:
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/python -m pip install --upgrade pip
	$(VENV)/bin/python -m pip install -r api/requirements.txt

run-api: install-api
	ALLOWED_ORIGINS=http://localhost:3000 $(VENV)/bin/uvicorn api.main:app --reload --port 8080

build-web:
	npm ci
	npm run build

clean:
	@echo "Remove .venv and generated build directories manually if required."
