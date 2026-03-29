use axum::{
    Router,
    routing::{get, post},
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
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "latents_server=debug,tower_http=info".into()),
        )
        .init();

    let config = Config::from_env()?;
    info!("Starting server in {:?} mode", config.environment);

    // Fail fast if runtime DB points to Supabase transaction pooler.
    if config.database_url.contains(":6543") {
        anyhow::bail!(
            "DATABASE_URL is using Supabase transaction pooler (:6543). \
             SQLx runtime queries can fail there with prepared statement errors. \
             Use the session pooler or direct connection on :5432 instead."
        );
    }

    info!("DATABASE_URL configured");
    if config.direct_url.is_some() {
        info!("DIRECT_URL configured");
    } else {
        info!("DIRECT_URL not set");
    }

    // Runtime connection options
    info!("Connecting to database...");
    let mut connect_options = config.database_url.parse::<PgConnectOptions>()?;
    connect_options = connect_options.statement_cache_capacity(0);

    // Migration connection options
    info!("Running database migrations...");
    let migration_options = if let Some(direct) = &config.direct_url {
        info!("Using DIRECT_URL for migrations");
        direct.parse::<PgConnectOptions>()?
    } else {
        info!("No DIRECT_URL set; using DATABASE_URL for migrations");
        connect_options.clone()
    };

    let migration_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_with(migration_options)
        .await?;

    sqlx::migrate!("./migrations")
        .set_ignore_missing(true)
        .run(&migration_pool)
        .await?;
    migration_pool.close().await;
    info!("Migrations completed successfully");

    // Main app pool
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(60))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .connect_with(connect_options)
        .await?;
    info!("Database pool ready");

    // Optional Redis
    let redis_conn = if let Some(url) = &config.redis_url {
        info!("Connecting to Redis...");
        match redis::Client::open(url.as_str()) {
            Ok(client) => match redis::aio::ConnectionManager::new(client).await {
                Ok(mgr) => {
                    info!("Redis connection established");
                    Some(mgr)
                }
                Err(e) => {
                    tracing::warn!(
                        "Redis connection failed (non-fatal, falling back to DB cache): {e}"
                    );
                    None
                }
            },
            Err(e) => {
                tracing::warn!("Invalid REDIS_URL (non-fatal): {e}");
                None
            }
        }
    } else {
        info!("No REDIS_URL set; using Postgres-only caching");
        None
    };

    let state = Arc::new(AppState::new(
        pool,
        config.news_api_keys.clone(),
        config.openrouter_api_keys.clone(),
        redis_conn,
    ));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/waitlist", post(add_to_waitlist).get(get_waitlist))
        .route("/api/feed", get(latents_server::handlers::get_feed))
        .route(
            "/api/feed/{id}/interact",
            post(latents_server::handlers::interact_feed),
        )
        .fallback(serve_static)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!("Server running on http://{}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}
