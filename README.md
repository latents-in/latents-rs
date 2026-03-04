# Latents - Rust Monorepo

A Rust-based monorepo for the Latents application with embedded React frontend.

## Architecture

```
latents-rust/
├── Cargo.toml              # Workspace configuration
├── crates/
│   ├── server/             # Axum HTTP server
│   │   ├── src/
│   │   │   ├── main.rs         # Application entry point
│   │   │   ├── lib.rs          # Library exports
│   │   │   ├── config/         # Configuration management
│   │   │   ├── db/             # Database queries
│   │   │   ├── error.rs        # Error handling
│   │   │   ├── handlers/       # HTTP request handlers
│   │   │   ├── models/         # Data models
│   │   │   └── state.rs        # Application state
│   │   └── migrations/     # SQLx database migrations
│   └── frontend/           # React frontend
│       ├── src/            # React source code
│       └── dist/           # Built static files (embedded in binary)
└── .env                    # Environment configuration
```

## Prerequisites

- Rust 1.85+ (install via [rustup](https://rustup.rs/))
- PostgreSQL database
- Node.js 18+ (for frontend development)

## Quick Start

### 1. First-time Setup

```bash
make setup
```

This will:
- Copy `.env.example` to `.env`
- Install development tools (cargo-watch, sqlx-cli)
- Install frontend dependencies

### 2. Configure Environment

```bash
# Edit .env with your database credentials
nano .env
```

### 3. Start Development Environment

```bash
# Start both backend and frontend with hot reload
make dev
```

## Development (Hot Reload)

### Full Development Environment

```bash
# Start both backend + frontend with hot reload
make dev

# Services:
# - Backend API:  http://localhost:5000
# - Frontend App: http://localhost:5173
```

### Backend Only (Hot Reload)

```bash
make dev-backend
```

Or manually:
```bash
cargo install cargo-watch
cargo watch -p latents-server -x run
```

### Frontend Only (Hot Reload)

```bash
make dev-frontend
```

Or manually:
```bash
cd crates/frontend
npm run dev
```

## Backend Module Structure

```
crates/server/src/
├── main.rs              # Entry point
├── lib.rs               # Library exports
├── config/              # Configuration
│   └── mod.rs           # Environment-based config
├── db/                  # Database layer
│   ├── mod.rs
│   └── waitlist.rs      # Waitlist queries
├── error.rs             # Error types & handling
├── handlers/            # HTTP handlers
│   ├── mod.rs
│   ├── health.rs        # Health check endpoint
│   ├── static_files.rs  # Static file serving
│   └── waitlist.rs      # Waitlist endpoints
├── models/              # Data models
│   ├── mod.rs
│   └── waitlist.rs      # Waitlist models
└── state.rs             # Application state
```

## Building

### Development Build

```bash
# Backend only
cargo build -p latents-server

# Frontend only
cd crates/frontend && npm run build
```

### Production Build

```bash
make build
```

This creates an optimized binary with the frontend embedded at `target/release/latents-server`.

## Running

### Production Mode

```bash
# Requires built frontend
make run
```

### Development Mode

```bash
# Serves static files from embedded frontend
make run-dev
```

## Database

### Run Migrations

```bash
make migrate
```

### Create New Migration

```bash
make migrate-new
# Enter migration name when prompted
```

### Revert Migration

```bash
make migrate-revert
```

## Testing & Quality

```bash
# Run all checks
make check

# Format code
make fmt

# Run clippy
make clippy

# Run tests
make test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/waitlist` | Add email to waitlist (with name and auto-detected location) |
| GET | `/api/waitlist` | Get all waitlist entries |
| GET | `/*` | Serve static frontend files |

### Waitlist API

**POST /api/waitlist**

Request body:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "location": "New York, USA"  // Optional - auto-detected if not provided
}
```

Location detection priority:
1. Location provided in request body
2. Browser geolocation (reverse geocoded)
3. IP-based geolocation (server-side)

## Deployment

### Single Binary Deployment

The Rust server embeds the frontend, so you only need to deploy one binary:

```bash
cargo build --release -p latents-server
# Deploy target/release/latents-server with DATABASE_URL env var
```

### Docker

```bash
make docker-build
make docker-run
```

## Available Make Commands

```bash
make help          # Show all available commands

# Development
make dev           # Full dev environment (backend + frontend)
make dev-backend   # Backend with hot reload
make dev-frontend  # Frontend with hot reload
make dev-full      # Both (using tmux)

# Building
make build         # Production build
make build-backend # Backend only
make build-frontend# Frontend only

# Running
make run           # Production mode
make run-dev       # Development mode

# Database
make migrate       # Run migrations
make migrate-new   # Create migration
make migrate-revert# Revert migration

# Quality
make check         # All checks
make fmt           # Format code
make clippy        # Run clippy
make test          # Run tests

# Setup
make setup         # First-time setup
make install-tools # Install dev tools

# Cleaning
make clean         # Clean artifacts
make reset         # Clean & reinstall
```

## Project Structure Explanation

### Why This Modular Structure?

The backend is organized into modules for better maintainability:

- **`config/`** - Centralized configuration management, supports multiple environments
- **`models/`** - Data structures for requests/responses, validation
- **`db/`** - Database queries separated from HTTP handlers
- **`handlers/`** - HTTP request handlers (thin layer)
- **`error.rs`** - Consistent error handling across the app
- **`state.rs`** - Shared application state (database pool, etc.)

### Adding New Features

To add a new API endpoint:

1. **Create model** in `models/` - Define request/response structs with validation
2. **Create database functions** in `db/` - Add queries
3. **Create handler** in `handlers/` - Implement HTTP handler
4. **Register route** in `main.rs` - Add to router
5. **Export in lib.rs** (if needed for testing)

Example:
```rust
// models/user.rs
#[derive(Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
}

// db/user.rs
pub async fn create_user(db: &PgPool, email: &str) -> Result<User> { ... }

// handlers/user.rs
pub async fn create_user_handler(...) -> Result<impl IntoResponse> { ... }

// main.rs
.route("/api/users", post(create_user_handler))
```

## Migration from Node.js

### What Changed?

| Component | Before | After |
|-----------|--------|-------|
| Backend | Express.js + Prisma | Axum + SQLx |
| Frontend | React (Vite) | Same (unchanged) |
| Deployment | Node.js + static files | Single Rust binary |
| Database ORM | Prisma | SQLx (compile-time SQL) |

### Frontend Changes Required

**None!** The frontend continues to work exactly as before. The Vite dev server proxies `/api` requests to the Rust backend during development.
