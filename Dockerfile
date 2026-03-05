# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY crates/frontend/package*.json ./
RUN npm ci

COPY crates/frontend/ ./
RUN npm run build

# =============================================================================
# Stage 2: Build Rust Backend
# =============================================================================
FROM rust:1.85-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy workspace configuration
COPY Cargo.toml ./

# Copy server source
COPY crates/server/ ./crates/server/

# Copy built frontend (required for embedding)
COPY --from=frontend-builder /app/frontend/dist ./crates/frontend/dist

# Build release binary
RUN cargo build --release -p latents-server

# =============================================================================
# Stage 3: Runtime
# =============================================================================
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=backend-builder /app/target/release/latents-server /usr/local/bin/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run
CMD ["latents-server"]
