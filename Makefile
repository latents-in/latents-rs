.PHONY: build deploy rollback setup-system logs status clean health-check

# Configuration
BINARY_NAME = latents-server
INSTALL_DIR = /opt/latents
SERVICE_NAME = latents
USER = latents
PORT = 5000

# Build targets
build:
	@echo "Building frontend..."
	cd crates/frontend && npm install && npm run build
	@echo "Building Rust server..."
	cargo build --release

# Pre-deploy binary backup
pre-deploy-backup:
	@mkdir -p $(INSTALL_DIR)/backups/pre-deploy
	@if [ -f $(INSTALL_DIR)/bin/$(BINARY_NAME) ]; then \
		TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
		cp $(INSTALL_DIR)/bin/$(BINARY_NAME) $(INSTALL_DIR)/backups/pre-deploy/$(BINARY_NAME)-$$TIMESTAMP; \
		echo "Backed up to $(BINARY_NAME)-$$TIMESTAMP"; \
		find $(INSTALL_DIR)/backups/pre-deploy -type f -name "$(BINARY_NAME)-*" | sort -r | tail -n +6 | xargs -r rm; \
		echo "Cleaned up old backups (keeping last 5)"; \
	fi

# Health check
health-check:
	@echo "Checking health at localhost:$(PORT)/api/health..."
	@sleep 2
	@curl -s http://localhost:$(PORT)/api/health || (echo "Health check failed"; exit 1)

# Deployment
deploy: build pre-deploy-backup
	@echo "Stopping $(SERVICE_NAME) service..."
	sudo systemctl stop $(SERVICE_NAME) || true
	@echo "Deploying binary..."
	sudo cp target/release/$(BINARY_NAME) $(INSTALL_DIR)/bin/$(BINARY_NAME)
	@echo "Starting $(SERVICE_NAME) service..."
	sudo systemctl start $(SERVICE_NAME)
	@echo "Running health check..."
	$(MAKE) health-check
	@echo "✓ Deployment complete"

# Rollback
rollback:
	@echo "Available backups:"
	@ls -1t $(INSTALL_DIR)/backups/pre-deploy/$(BINARY_NAME)-* 2>/dev/null | head -5 | nl
	@echo ""
	@read -p "Enter backup number to restore (1-5): " choice; \
	BACKUP=$$(ls -1t $(INSTALL_DIR)/backups/pre-deploy/$(BINARY_NAME)-* 2>/dev/null | head -$$choice | tail -1); \
	if [ -f "$$BACKUP" ]; then \
		echo "Rolling back to $$BACKUP..."; \
		sudo systemctl stop $(SERVICE_NAME); \
		sudo cp $$BACKUP $(INSTALL_DIR)/bin/$(BINARY_NAME); \
		sudo systemctl start $(SERVICE_NAME); \
		$(MAKE) health-check; \
		echo "✓ Rollback complete"; \
	else \
		echo "Invalid selection"; \
		exit 1; \
	fi

# System setup
setup-system:
	@echo "Setting up $(SERVICE_NAME) system..."
	@sudo useradd -r -s /bin/false $(USER) 2>/dev/null || echo "User $(USER) already exists"
	@sudo mkdir -p $(INSTALL_DIR)/bin $(INSTALL_DIR)/config $(INSTALL_DIR)/backups/pre-deploy $(INSTALL_DIR)/logs
	@sudo chown -R $(USER):$(USER) $(INSTALL_DIR)
	@sudo chmod 755 $(INSTALL_DIR)/bin $(INSTALL_DIR)/config $(INSTALL_DIR)/logs
	@echo "Installing systemd service..."
	@sudo cp systemd/$(SERVICE_NAME).service /etc/systemd/system/
	@sudo systemctl daemon-reload
	@echo "Installing scripts..."
	@sudo mkdir -p /usr/local/bin
	@sudo cp scripts/*.sh /usr/local/bin/
	@sudo chmod +x /usr/local/bin/*.sh
	@echo "Creating production.env template..."
	@if [ ! -f $(INSTALL_DIR)/config/production.env ]; then \
		sudo cp config/production.env.template $(INSTALL_DIR)/config/production.env; \
		sudo chown $(USER):$(USER) $(INSTALL_DIR)/config/production.env; \
		sudo chmod 600 $(INSTALL_DIR)/config/production.env; \
		echo "⚠ Edit $(INSTALL_DIR)/config/production.env with your Supabase credentials"; \
	fi
	@echo "✓ System setup complete"

# Logs
logs:
	journalctl -u $(SERVICE_NAME) -f

# Status
status:
	@echo "=== Service Status ==="
	@sudo systemctl status $(SERVICE_NAME) --no-pager || echo "Service not running"
	@echo ""
	@echo "=== Health Check ==="
	@curl -s http://localhost:$(PORT)/api/health 2>/dev/null || echo "Service unreachable"
	@echo ""
	@echo "=== Latest Backups ==="
	@ls -lht $(INSTALL_DIR)/backups/pre-deploy/$(BINARY_NAME)-* 2>/dev/null | head -3 || echo "No backups found"

# Clean
clean:
	@echo "Cleaning frontend..."
	rm -rf crates/frontend/dist crates/frontend/node_modules
	@echo "Cleaning Rust..."
	cargo clean
	@echo "✓ Clean complete"
