use dashmap::DashMap;
use redis::aio::ConnectionManager;
use sqlx::PgPool;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Manages a rotating list of API keys in a highly concurrent thread-safe manner
pub struct KeyManager {
    keys: Vec<String>,
    current_index: AtomicUsize,
}

impl KeyManager {
    pub fn new(keys: Vec<String>) -> Self {
        Self {
            keys,
            current_index: AtomicUsize::new(0),
        }
    }

    pub fn get_key(&self) -> Option<String> {
        if self.keys.is_empty() {
            return None;
        }
        let index = self.current_index.load(Ordering::Relaxed) % self.keys.len();
        Some(self.keys[index].clone())
    }

    pub fn rotate(&self) {
        self.current_index.fetch_add(1, Ordering::Relaxed);
    }
}

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,

    // API Key Managers
    pub news_api_keys: Arc<KeyManager>,
    pub openrouter_keys: Arc<KeyManager>,

    // Cache Stampede Lock: prevents simultaneous fetch for the same query
    pub active_fetches: Arc<DashMap<String, Arc<Mutex<()>>>>,

    // Simple In-memory Rate Limiting
    pub rate_limit_map: Arc<DashMap<String, (u32, std::time::Instant)>>,

    /// Optional Redis L1 cache (None → fall back to Postgres-only cache)
    pub redis: Option<Arc<Mutex<ConnectionManager>>>,
}

impl AppState {
    pub fn new(
        db: PgPool,
        news_api_keys: Vec<String>,
        openrouter_keys: Vec<String>,
        redis: Option<ConnectionManager>,
    ) -> Self {
        Self {
            db,
            news_api_keys: Arc::new(KeyManager::new(news_api_keys)),
            openrouter_keys: Arc::new(KeyManager::new(openrouter_keys)),
            active_fetches: Arc::new(DashMap::new()),
            rate_limit_map: Arc::new(DashMap::new()),
            redis: redis.map(|conn| Arc::new(Mutex::new(conn))),
        }
    }
}
