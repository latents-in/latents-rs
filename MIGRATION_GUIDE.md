# Migration Guide: Node.js → Rust

## Overview

This guide helps you migrate from the Express.js + Prisma backend to the Rust Axum + SQLx backend.

## What Stayed the Same

- ✅ React frontend (unchanged)
- ✅ PostgreSQL database
- ✅ API endpoints (`/api/waitlist`)
- ✅ Database schema (`waitlist` table)

## What Changed

| Aspect | Before (Node.js) | After (Rust) |
|--------|------------------|--------------|
| **Runtime** | Node.js | Tokio async runtime |
| **Web Framework** | Express.js | Axum |
| **Database ORM** | Prisma | SQLx (compile-time checked SQL) |
| **Language** | JavaScript | Rust |
| **Deployment** | Node.js + static files | Single binary |
| **Bundle Size** | ~100MB+ (Node + deps) | ~5-10MB (single binary) |
| **Memory Usage** | Higher | Lower |
| **Startup Time** | Slower | Instant |

## Migration Steps

### Step 1: Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Step 2: Environment Variables

Copy your existing `.env` from the Node.js backend:

```bash
# Old (Node.js)
DATABASE_URL="postgres://..."
PORT=5000

# New (Rust) - Same format!
DATABASE_URL="postgres://..."
PORT=5000
RUST_LOG=latents_server=debug
```

### Step 3: Database Migration

The database schema is identical. SQLx migrations are provided in `crates/server/migrations/`.

Run migrations:
```bash
cargo install sqlx-cli --no-default-features --features native-tls,postgres
cd crates/server
cargo sqlx migrate run
```

### Step 4: Build Frontend

The frontend doesn't change, but we need to build it for embedding:

```bash
cd crates/frontend
npm install
npm run build
cd ../..
```

### Step 5: Build & Run Server

```bash
# Development
cargo run -p latents-server

# Production
cargo build --release -p latents-server
./target/release/latents-server
```

## API Compatibility

The Rust backend maintains full API compatibility:

### POST /api/waitlist
```bash
# Request (unchanged)
curl -X POST http://localhost:5000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Response (unchanged)
{"message": "Email added successfully"}

# Error (unchanged)
{"error": "Email already on the waitlist"}
```

### GET /api/waitlist
```bash
# Response (unchanged)
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

## Frontend Configuration

Update your frontend `.env` to point to the Rust backend:

```bash
# crates/frontend/.env.local
VITE_API_URL=http://localhost:5000
```

## Deployment Options

### Option 1: Single Binary (Recommended)

The Rust binary embeds the frontend, so you only deploy one file:

```bash
cargo build --release
# Deploy: target/release/latents-server
```

Set environment variable:
```bash
DATABASE_URL=postgres://... ./latents-server
```

### Option 2: Docker

```bash
docker-compose up --build
```

### Option 3: Separate Frontend

If you prefer to keep frontend on a CDN:

1. Build and upload `crates/frontend/dist/` to your CDN
2. Deploy just the Rust binary
3. Configure CORS in the Rust backend (already enabled)

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
cd crates/server
cargo sqlx migrate info
```

### Frontend Not Loading

Make sure you built the frontend:
```bash
cd crates/frontend && npm run build
```

The Rust server embeds files from `crates/frontend/dist/` at compile time.

### Hot Reload During Development

```bash
cargo install cargo-watch
cargo watch -p latents-server -x run
```

## Performance Comparison

| Metric | Node.js | Rust |
|--------|---------|------|
| Cold Start | ~1-2s | ~10ms |
| Memory (idle) | ~100MB | ~10MB |
| Memory (load) | ~200MB | ~20MB |
| RPS (single core) | ~10k | ~100k+ |
| Binary Size | N/A (needs Node) | ~5-10MB |

## Next Steps

1. ✅ Migrate backend to Rust
2. 🔄 Add authentication (JWT support ready)
3. 🔄 Add rate limiting (tower-governor)
4. 🔄 Add caching (Redis)
5. 🔄 Add metrics (Prometheus)
