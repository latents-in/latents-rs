use axum::{
    routing::{get, post},
    Router,
};
use latents_server::{
    config::Config,
    handlers::{add_to_waitlist, get_waitlist, health_check, serve_static},
    state::AppState,
};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "latents_server=debug,tower_http=debug".into()),
        )
        .init();

    // Load configuration
    let config = Config::from_env()?;
    info!("Starting server in {:?} mode", config.environment);

    // Database connection
    info!("Connecting to database...");
    
    // Parse connection string and disable statement cache for PgBouncer compatibility
    let mut connect_options = config.database_url.parse::<PgConnectOptions>()?;
    connect_options = connect_options.statement_cache_capacity(0);

    let pool = PgPoolOptions::new()
        .max_connections(4) // More conservative for Supabase free/direct connections
        .min_connections(0)
        .acquire_timeout(std::time::Duration::from_secs(60)) // Be very patient on startup
        .idle_timeout(std::time::Duration::from_millis(500)) // Release connections back to pool instantly (500ms)
        .max_lifetime(std::time::Duration::from_secs(30)) // Refresh connections frequently
        .connect_with(connect_options)
        .await?;

    // Run migrations
    info!("Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Migrations completed");

    let state = Arc::new(AppState::new(pool));

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

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("🚀 Server running on http://{}", addr);
    info!("📁 Serving static files from embedded frontend");

    axum::serve(listener, app).await?;

    Ok(())
}
