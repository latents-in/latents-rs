# Latents - Rust Monorepo

A Rust-based monorepo for the Latents application with embedded React frontend.

## Architecture

```
latents-rust/
├── Cargo.toml              # Workspace configuration
├── crates/
│   ├── server/             # Axum HTTP server
│   │   ├── src/main.rs
│   │   └── migrations/     # SQLx database migrations
│   └── frontend/           # React frontend (from original project)
│       ├── src/            # React source code
│       └── dist/           # Built static files (embedded in binary)
└── .env                    # Environment configuration
```

## Prerequisites

- Rust 1.85+ (install via [rustup](https://rustup.rs/))
- PostgreSQL database
- Node.js 18+ (for frontend build only)

## Setup

### 1. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb latents
```

### 3. Build Frontend

```bash
cd crates/frontend
npm install
npm run build
cd ../..
```

### 4. Build & Run Server

```bash
# Development
cargo run -p latents-server

# Release (optimized)
cargo build --release -p latents-server
./target/release/latents-server
```

## Development

### Hot Reload (Backend)

```bash
cargo install cargo-watch
cargo watch -p latents-server -x run
```

### Frontend Development (Separate)

```bash
cd crates/frontend
npm run dev
```

Then update `VITE_API_URL` in `.env.local` to point to the Rust backend.

## Deployment

### Single Binary Deployment

The Rust server embeds the frontend, so you only need to deploy one binary:

```bash
cargo build --release -p latents-server
# Deploy target/release/latents-server with DATABASE_URL env var
```

### Docker

```bash
docker build -t latents .
docker run -p 5000:5000 -e DATABASE_URL=postgres://... latents
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/waitlist` | Add email to waitlist |
| GET | `/api/waitlist` | Get all waitlist entries |
| GET | `/*` | Serve static frontend files |

## Migration from Node.js

### What Changed?

| Component | Before | After |
|-----------|--------|-------|
| Backend | Express.js + Prisma | Axum + SQLx |
| Frontend | React (Vite) | Same (unchanged) |
| Deployment | Node.js + static files | Single Rust binary |
| Database ORM | Prisma | SQLx (compile-time SQL) |

### Frontend Changes Required

**None!** The frontend continues to work exactly as before. Just point `VITE_API_URL` to the Rust backend.

If you want to bundle everything into a single binary:
1. Build the frontend: `npm run build`
2. The Rust binary automatically embeds `crates/frontend/dist/`
3. Deploy just the binary - no separate frontend server needed
