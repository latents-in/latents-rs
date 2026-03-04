use axum::{
    body::Body,
    extract::State,
    http::{header, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{error, info};
use validator::Validate;

// =============================================================================
// Static File Embedding (Frontend)
// =============================================================================

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct FrontendAssets;

// =============================================================================
// Application State
// =============================================================================

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

// =============================================================================
// Data Models
// =============================================================================

#[derive(Debug, Deserialize, Validate)]
struct WaitlistRequest {
    #[validate(email(message = "Invalid email address"))]
    email: String,
}

#[derive(Debug, Serialize)]
struct WaitlistResponse {
    message: String,
}

#[derive(Debug, Serialize)]
struct WaitlistEntry {
    id: String,
    email: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

// =============================================================================
// API Handlers
// =============================================================================

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

/// Add email to waitlist
async fn add_to_waitlist(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<WaitlistRequest>,
) -> impl IntoResponse {
    // Validate email
    if let Err(e) = payload.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
            .into_response();
    }

    let email = payload.email.to_lowercase();

    // Insert into database
    match sqlx::query(
        r#"
        INSERT INTO waitlist (id, email, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(&email)
    .bind(Utc::now())
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(_)) => (
            StatusCode::CREATED,
            Json(WaitlistResponse {
                message: "Email added successfully".to_string(),
            }),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "Email already on the waitlist".to_string(),
            }),
        )
            .into_response(),
        Err(e) => {
            error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Internal server error".to_string(),
                }),
            )
                .into_response()
        }
    }
}

/// Get all waitlist entries
async fn get_waitlist(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match sqlx::query(
        r#"
        SELECT id, email, created_at
        FROM waitlist
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => {
            let entries: Vec<WaitlistEntry> = rows
                .into_iter()
                .map(|row| WaitlistEntry {
                    id: row.get("id"),
                    email: row.get("email"),
                    created_at: row.get("created_at"),
                })
                .collect();
            (StatusCode::OK, Json(entries)).into_response()
        }
        Err(e) => {
            error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Internal server error".to_string(),
                }),
            )
                .into_response()
        }
    }
}

// =============================================================================
// Static File Serving
// =============================================================================

async fn serve_static(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    match FrontendAssets::get(path) {
        Some(content) => {
            let mime_type = mime_guess::from_path(path).first_or_octet_stream();
            Response::builder()
                .header(header::CONTENT_TYPE, mime_type.as_ref())
                .body(Body::from(content.data))
                .unwrap()
        }
        None => {
            // Return index.html for client-side routing (SPA behavior)
            match FrontendAssets::get("index.html") {
                Some(content) => Response::builder()
                    .header(header::CONTENT_TYPE, "text/html")
                    .body(Body::from(content.data))
                    .unwrap(),
                None => Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .body(Body::from("Not Found"))
                    .unwrap(),
            }
        }
    }
}

// =============================================================================
// Main Application
// =============================================================================

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "latents_server=debug,tower_http=debug".into()),
        )
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Database connection
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in environment");

    info!("Connecting to database...");
    
    // Configure connection options for pgbouncer compatibility
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(10)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Disable prepared statements for pgbouncer compatibility
                sqlx::query("DISCARD ALL").execute(conn).await?;
                Ok(())
            })
        })
        .connect(&database_url)
        .await?;
    
    // Run migrations
    info!("Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Migrations completed");

    let state = Arc::new(AppState { db: pool });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // API routes
        .route("/api/health", get(health_check))
        .route("/api/waitlist", post(add_to_waitlist).get(get_waitlist))
        // Static files (catch-all)
        .fallback(serve_static)
        // Middleware
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Get port from environment
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(5000u16);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("🚀 Server running on http://{}", addr);
    info!("📁 Serving static files from embedded frontend");

    axum::serve(listener, app).await?;

    Ok(())
}
