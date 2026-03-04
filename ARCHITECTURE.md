# Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Latents (Rust)                           │
│                         Monorepo                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Axum Server                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │  CORS       │  │   Tracing   │  │  Static Files   │  │   │
│  │  │  Layer      │→ │   Layer     │→ │    (Embedded)   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │                              │                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │              Router                              │  │   │
│  │  │  ├── GET  /api/health                          │  │   │
│  │  │  ├── POST /api/waitlist ───────┐               │  │   │
│  │  │  ├── GET  /api/waitlist        │               │  │   │
│  │  │  └── GET  /* ──────────────────┼──────┐        │  │   │
│  │  │                                │      │        │  │   │
│  │  └────────────────────────────────┼──────┼────────┘  │   │
│  │                                   │      │           │   │
│  │  ┌────────────────────────────────┘      │           │   │
│  │  │         AppState (Arc)                │           │   │
│  │  │  ┌───────────────────────┐            │           │   │
│  │  └──┤      PgPool           │◄───────────┘           │   │
│  │     └───────────────────────┘                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                                │
│  ┌───────────────────────────┴───────────────────────────┐   │
│  │                   SQLx / PostgreSQL                   │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │           waitlist table                        │  │   │
│  │  │  ┌──────────┬─────────────┬───────────────────┐ │  │   │
│  │  │  │ id (PK)  │ email (UQ)  │ name              │ │  │   │
│  │  │  │ uuid     │ varchar     │ varchar           │ │  │   │
│  │  │  ├──────────┼─────────────┼───────────────────┤ │  │   │
│  │  │  │ location │ created_at  │                   │ │  │   │
│  │  │  │ varchar  │ timestamptz │                   │ │  │   │
│  │  │  └──────────┴─────────────┴───────────────────┘ │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           Embedded Frontend (rust-embed)              │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │  crates/frontend/dist/                          │  │   │
│  │  │  ├── index.html                                 │  │   │
│  │  │  ├── assets/                                    │  │   │
│  │  │  │   ├── index-*.js                            │  │   │
│  │  │  │   └── index-*.css                           │  │   │
│  │  │  └── vite.svg                                  │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────────┘

                         ↓ Single Binary Output

┌─────────────────────────────────────────────────────────────────┐
│              target/release/latents-server (~5-10MB)            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Rust Binary   │  │  Static Assets  │  │  Migrations     │  │
│  │   (Axum)        │  │  (Embedded)     │  │  (Embedded)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Single Binary Deployment**
- Frontend static files are embedded at compile time using `rust-embed`
- No need for nginx or separate static file server
- Simplified deployment: just one binary + env vars

### 2. **Compile-Time SQL Validation**
- SQLx checks SQL queries at compile time against actual database
- No runtime SQL errors due to typos or schema mismatches
- Migrations are embedded and run automatically on startup

### 3. **Layered Architecture**
```
HTTP Request
    ↓
CORS Layer (tower-http)
    ↓
Trace Layer (logging)
    ↓
Router (Axum)
    ↓
Handler (extract state, validate, execute)
    ↓
Database (SQLx + PostgreSQL)
```

### 4. **Zero-Cost Abstractions**
- Static file serving has no runtime overhead
- Database connections are pooled (deadpool-sqlx)
- No reflection or dynamic dispatch in hot paths

## Request Flow

```
1. Browser → GET /
   ↓
2. Axum Router → Static file handler
   ↓
3. rust-embed → Read index.html from binary
   ↓
4. Browser → React app loads
   ↓
5. User submits email
   ↓
6. Browser → POST /api/waitlist {email}
   ↓
7. Axum → Validation (validator crate)
   ↓
8. Axum → SQLx query
   ↓
9. PostgreSQL → INSERT / CONFLICT check
   ↓
10. JSON Response → Browser
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Tokio | Async runtime |
| Web | Axum | HTTP server |
| Middleware | tower-http | CORS, tracing, compression |
| Database | SQLx + PostgreSQL | Type-safe SQL |
| Migrations | sqlx-migrate | Schema versioning |
| Embedding | rust-embed | Static files in binary |
| Validation | validator | Input validation |
| Logging | tracing | Structured logging |
| Serialization | serde | JSON handling |
| Geolocation | ipapi.co | IP to location lookup |

## Geolocation Feature

The waitlist endpoint automatically detects user location through multiple methods:

1. **Browser Geolocation API** (Primary): Uses the browser's `navigator.geolocation` to get precise coordinates, then reverse geocodes to a human-readable location.

2. **IP-based Geolocation** (Fallback): If browser geolocation is denied or unavailable, the server extracts the client IP using `axum-client-ip` and queries ipapi.co for location data.

3. **Manual Input** (Override): Users can manually enter their location, which takes precedence over automatic detection.

### Location Detection Flow

```
User submits waitlist form
       ↓
Frontend checks browser geolocation
       ↓
If available → Reverse geocode to city/region/country
       ↓
Send location to backend with name/email
       ↓
If no browser location → Backend extracts IP from request
       ↓
Query ipapi.co for location data
       ↓
Store in database with name, email, and location
```

### Dependencies for Geolocation

```toml
# In Cargo.toml
reqwest = { version = "0.12", features = ["json"] }
axum-client-ip = "1.0"
```

## Extending the Architecture

### Adding Authentication
```rust
// Add to Cargo.toml
tower-sessions = "0.14"
axum-login = "0.10"

// Add layer
.layer(SessionManagerLayer::new())
.layer(AuthManagerLayer::new(backend, &session_layer))
```

### Adding Rate Limiting
```rust
// Add to Cargo.toml
tower-governor = "0.6"

// Add layer
.layer(GovernorLayer {
    config: Arc::new(GovernorConfig::default()),
})
```

### Adding Caching
```rust
// Add to Cargo.toml
redis = { version = "0.29", features = ["tokio-comp"] }

// Add to AppState
redis: redis::aio::ConnectionManager
```
