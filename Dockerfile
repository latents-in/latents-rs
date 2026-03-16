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

# Copy only dependency files (workspace + inner crate)
COPY Cargo.toml Cargo.lock ./
COPY crates/server/Cargo.toml ./crates/server/

# Create dummy server to compile dependencies
RUN mkdir -p crates/server/src
RUN echo "fn main() {}" > crates/server/src/main.rs
RUN echo "" > crates/server/src/lib.rs

# Build dependencies (this layer will cache)
RUN cargo build --release -p latents-server

# Clean up the dummy code artifacts so Cargo knows it needs to rebuild your actual code later
RUN rm -f target/release/deps/latents_server*
RUN rm -f target/release/deps/liblatents_server*

# =============================================================================
# Stage 3: Build Real Backend
# =============================================================================
FROM deps AS backend-builder

# Copy real source code now
COPY crates/server/src ./crates/server/src
COPY crates/server/migrations ./crates/server/migrations

# Copy frontend dist
COPY --from=frontend-builder /app/frontend/dist ./crates/frontend/dist

# Build final binary (this will be incredibly fast since deps are cached!)
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
