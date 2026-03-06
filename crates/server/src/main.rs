use axum::{
    routing::{get, post},
    Router,
};
use latents_server::{
    config::Config,
    handlers::{add_to_waitlist, get_waitlist, health_check, serve_static},
    state::AppState,
};
use sqlx::postgres::PgPoolOptions;
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
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Disable prepared statements for pgbouncer compatibility
                sqlx::query("DISCARD ALL").execute(conn).await?;
                Ok(())
            })
        })
        .connect(&config.database_url)
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
