use dashmap::DashMap;
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

    /// Get the current key
    pub fn get_key(&self) -> Option<String> {
        if self.keys.is_empty() {
            return None;
        }
        let index = self.current_index.load(Ordering::Relaxed) % self.keys.len();
        Some(self.keys[index].clone())
    }

    /// Rotate to the next key (usually called when catching a 429)
    pub fn rotate(&self) {
        self.current_index.fetch_add(1, Ordering::Relaxed);
    }
}

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    
    // API Keys Managers
    pub news_api_keys: Arc<KeyManager>,
    pub openrouter_keys: Arc<KeyManager>,

    // Cache Stampede Lock: Maps a search query to a Mutex to prevent simultaneous fetch requests
    pub active_fetches: Arc<DashMap<String, Arc<Mutex<()>>>>,

    // Simple In-memory Rate Limiting: IP/UserId -> (Request Count, Window Start)
    pub rate_limit_map: Arc<DashMap<String, (u32, std::time::Instant)>>,
}

impl AppState {
    pub fn new(
        db: PgPool, 
        news_api_keys: Vec<String>, 
        openrouter_keys: Vec<String>
    ) -> Self {
        Self {
            db,
            news_api_keys: Arc::new(KeyManager::new(news_api_keys)),
            openrouter_keys: Arc::new(KeyManager::new(openrouter_keys)),
            active_fetches: Arc::new(DashMap::new()),
            rate_limit_map: Arc::new(DashMap::new()),
        }
    }
}
