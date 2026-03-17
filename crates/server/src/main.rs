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

    // --- Temporary Migration Pool ---
    // We prefer using the DIRECT_URL (port 5432) for migrations because PgBouncer 
    // Transaction Mode does not support the prepared statements used by SQLx migrations.
    info!("Running database migrations...");
    let migration_options = if let Some(direct) = &config.direct_url {
        info!("Using DIRECT_URL for migrations");
        direct.parse::<PgConnectOptions>()?
    } else {
        info!("DIRECT_URL not found, attempting migrations on Pooler (WARNING: may fail if not session mode)");
        connect_options.clone()
    };
    
    let migration_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_with(migration_options)
        .await?;

    sqlx::migrate!("./migrations")
        .run(&migration_pool)
        .await?;
        
    // Close the temporary pool
    migration_pool.close().await;
    info!("Migrations completed successfully");

    // --- Main Application Pool ---
    info!("Starting main connection pool...");
    let pool = PgPoolOptions::new()
        .max_connections(100) // Optimal for Supabase Pooler (Transaction Mode)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(60)) // Be very patient on startup
        .idle_timeout(std::time::Duration::from_secs(30)) // Keep connections alive for reuse
        .max_lifetime(std::time::Duration::from_secs(1800)) // 30 minutes
        .connect_with(connect_options)
        .await?;

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
