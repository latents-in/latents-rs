# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY crates/frontend/package*.json ./
RUN npm install

COPY crates/frontend/ ./
RUN npm run build


# =============================================================================
# Stage 2: Rust Dependency Builder (cache layer)
# =============================================================================
FROM rust:1.88-alpine AS deps

RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy only dependency files
COPY Cargo.toml Cargo.lock ./

# Create dummy server to compile dependencies
RUN mkdir -p crates/server/src
RUN echo "fn main() {}" > crates/server/src/main.rs

# Build dependencies (this layer will cache)
RUN cargo build --release -p latents-server


# =============================================================================
# Stage 3: Build Real Backend
# =============================================================================
FROM deps AS backend-builder

# Copy real source now
COPY crates/server ./crates/server

# Copy frontend dist
COPY --from=frontend-builder /app/frontend/dist ./crates/frontend/dist

# Build final binary
RUN cargo build --release -p latents-server


# =============================================================================
# Stage 4: Runtime
# =============================================================================
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=backend-builder /app/target/release/latents-server /usr/local/bin/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["latents-server"]
