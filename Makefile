# =============================================================================
# Latents - Rust Monorepo Makefile
# =============================================================================

.PHONY: all build dev dev-backend dev-frontend dev-full check test clean install help deploy rollback pre-deploy-backup health-check

# Default target
all: build

# =============================================================================
# Development (Hot Reload)
# =============================================================================

## Start full development environment (backend + frontend with hot reload)
dev:
	@echo "🚀 Starting full development environment..."
	./scripts/dev.sh

## Start backend with hot reload only
dev-backend:
	@echo "🦀 Starting backend with hot reload..."
	@echo "   Install cargo-watch if not present: cargo install cargo-watch"
	cargo watch -p latents-server -x run

## Start frontend dev server with hot reload
dev-frontend:
	@echo "⚛️  Starting frontend dev server..."
	cd crates/frontend && npm run dev

## Start backend + frontend simultaneously (requires tmux or multiple terminals)
dev-full:
	@echo "🚀 Starting both backend and frontend..."
	@if command -v tmux >/dev/null 2>&1; then \
		tmux new-session -d -s latents-dev './scripts/dev-backend.sh' \; \
			split-window -h 'sleep 2 && ./scripts/dev-frontend.sh' \; \
			attach; \
	else \
		echo "tmux not found. Starting in background processes..."; \
		./scripts/dev-backend.sh & \
		sleep 3 && ./scripts/dev-frontend.sh & \
		wait; \
	fi

# =============================================================================
# Building
# =============================================================================

## Build the entire project
build:
	@echo "🔨 Building project..."
	cd crates/frontend && npm install && npm run build
	cargo build -p latents-server --release

## Build only the backend
build-backend:
	cargo build -p latents-server --release

## Build only the frontend
build-frontend:
	cd crates/frontend && npm install && npm run build

# =============================================================================
# Running
# =============================================================================

## Run the server (production mode - requires built frontend)
run:
	cargo run -p latents-server --release

## Run the server (development mode)
run-dev:
	cargo run -p latents-server

# =============================================================================
# Deployment
# =============================================================================

## Pre-deploy backup (backs up current binary)
pre-deploy-backup:
	@mkdir -p /opt/latents/backups/pre-deploy
	@if [ -f /opt/latents/bin/latents-server ]; then \
		TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
		sudo cp /opt/latents/bin/latents-server /opt/latents/backups/pre-deploy/latents-server-$$TIMESTAMP; \
		echo "Backed up to latents-server-$$TIMESTAMP"; \
		find /opt/latents/backups/pre-deploy -type f -name "latents-server-*" | sort -r | tail -n +6 | xargs -r sudo rm; \
		echo "Cleaned up old backups (keeping last 5)"; \
	fi

## Health check
health-check:
	@echo "Checking health at localhost:8080/api/health..."
	@sleep 2
	@curl -s http://localhost:8080/api/health || (echo "Health check failed"; exit 1)

## Deploy to production server
deploy: build pre-deploy-backup
	@echo "Stopping latents service..."
	sudo systemctl stop latents || true
	@echo "Deploying binary..."
	sudo cp target/release/latents-server /opt/latents/bin/latents-server
	@echo "Starting latents service..."
	sudo systemctl start latents
	@echo "Running health check..."
	$(MAKE) health-check
	@echo "✓ Deployment complete"

## Rollback to previous deployment
rollback:
	@echo "Available backups:"
	@ls -1t /opt/latents/backups/pre-deploy/latents-server-* 2>/dev/null | head -5 | nl
	@echo ""
	@read -p "Enter backup number to restore (1-5): " choice; \
	BACKUP=$$(ls -1t /opt/latents/backups/pre-deploy/latents-server-* 2>/dev/null | head -$$choice | tail -1); \
	if [ -f "$$BACKUP" ]; then \
		echo "Rolling back to $$BACKUP..."; \
		sudo systemctl stop latents; \
		sudo cp $$BACKUP /opt/latents/bin/latents-server; \
		sudo systemctl start latents; \
		$(MAKE) health-check; \
		echo "✓ Rollback complete"; \
	else \
		echo "Invalid selection"; \
		exit 1; \
	fi

# =============================================================================
# Database
# =============================================================================

## Run database migrations
migrate:
	cargo sqlx migrate run --source crates/server/migrations

## Create a new migration
migrate-new:
	@read -p "Migration name: " name; \
	cargo sqlx migrate add $$name --source crates/server/migrations

## Revert last migration
migrate-revert:
	cargo sqlx migrate revert --source crates/server/migrations

# =============================================================================
# Testing & Quality
# =============================================================================

## Run all checks (format, clippy, test)
check:
	cargo fmt --all -- --check
	cargo clippy -p latents-server -- -D warnings
	cargo test -p latents-server

## Format code
fmt:
	cargo fmt --all

## Run clippy
clippy:
	cargo clippy -p latents-server -- -D warnings

## Run tests
test:
	cargo test -p latents-server

## Run tests with output
test-verbose:
	cargo test -p latents-server -- --nocapture

# =============================================================================
# Docker
# =============================================================================

docker-build:
	docker build -t latents .

docker-run:
	docker run -p 8080:8080 --env-file .env latents

# =============================================================================
# Installation & Setup
# =============================================================================

## Install required tools
install-tools:
	@echo "🔧 Installing development tools..."
	cargo install cargo-watch
	cargo install sqlx-cli --no-default-features --features native-tls,postgres
	cd crates/frontend && npm install

## Setup the project (first time)
setup:
	@echo "⚙️  Setting up project..."
	cp -n .env.example .env || true
	$(MAKE) install-tools
	$(MAKE) build-frontend
	@echo "✅ Setup complete! Edit .env file with your database credentials."

# =============================================================================
# Cleaning
# =============================================================================

## Clean build artifacts
clean:
	cargo clean
	rm -rf crates/frontend/dist
	rm -rf crates/frontend/node_modules

## Clean and reinstall dependencies
reset:
	$(MAKE) clean
	cd crates/frontend && npm install
	cargo build

# =============================================================================
# Help
# =============================================================================

## Show this help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development (Hot Reload):"
	@echo "  make dev           - Start full dev environment (backend + frontend)"
	@echo "  make dev-backend   - Start backend with hot reload only"
	@echo "  make dev-frontend  - Start frontend dev server only"
	@echo "  make dev-full      - Start both backend and frontend (using tmux)"
	@echo ""
	@echo "Building:"
	@echo "  make build         - Build entire project (production)"
	@echo "  make build-backend - Build backend only"
	@echo "  make build-frontend- Build frontend only"
	@echo ""
	@echo "Running:"
	@echo "  make run           - Run server (requires built frontend)"
	@echo "  make run-dev       - Run server (development mode)"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy        - Deploy to production (builds, backs up, restarts)"
	@echo "  make rollback      - Rollback to previous deployment"
	@echo ""
	@echo "Database:"
	@echo "  make migrate       - Run database migrations"
	@echo "  make migrate-new   - Create a new migration"
	@echo "  make migrate-revert- Revert last migration"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make check         - Run all checks (fmt, clippy, test)"
	@echo "  make fmt           - Format code"
	@echo "  make clippy        - Run clippy"
	@echo "  make test          - Run tests"
	@echo ""
	@echo "Setup:"
	@echo "  make setup         - First-time project setup"
	@echo "  make install-tools - Install required dev tools"
	@echo ""
	@echo "Cleaning:"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make reset         - Clean and reinstall dependencies"
