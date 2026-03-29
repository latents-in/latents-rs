use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub direct_url: Option<String>,
    pub port: u16,
    pub environment: Environment,
    pub news_api_keys: Vec<String>,
    pub openrouter_api_keys: Vec<String>,
    /// Optional Redis URL (e.g. redis://localhost:6379 or rediss://... for Upstash TLS)
    pub redis_url: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Environment {
    Development,
    Production,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let database_url =
            env::var("DATABASE_URL").expect("DATABASE_URL must be set in environment");

        let direct_url = env::var("DIRECT_URL").ok();

        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080u16);

        let environment = match env::var("ENVIRONMENT")
            .unwrap_or_else(|_| "development".to_string())
            .as_str()
        {
            "production" => Environment::Production,
            _ => Environment::Development,
        };

        let news_api_keys = env::var("NEWS_API_KEYS")
            .unwrap_or_default()
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| s.trim().to_string())
            .collect();

        let openrouter_api_keys = env::var("OPENROUTER_API_KEYS")
            .unwrap_or_default()
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| s.trim().to_string())
            .collect();

        let redis_url = env::var("REDIS_URL").ok();

        Ok(Self {
            database_url,
            direct_url,
            port,
            environment,
            news_api_keys,
            openrouter_api_keys,
            redis_url,
        })
    }

    pub fn is_development(&self) -> bool {
        self.environment == Environment::Development
    }

    pub fn is_production(&self) -> bool {
        self.environment == Environment::Production
    }
}
