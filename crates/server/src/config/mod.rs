use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub environment: Environment,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Environment {
    Development,
    Production,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set in environment");

        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(5000u16);

        let environment = match env::var("ENVIRONMENT")
            .unwrap_or_else(|_| "development".to_string())
            .as_str()
        {
            "production" => Environment::Production,
            _ => Environment::Development,
        };

        Ok(Self {
            database_url,
            port,
            environment,
        })
    }

    pub fn is_development(&self) -> bool {
        self.environment == Environment::Development
    }

    pub fn is_production(&self) -> bool {
        self.environment == Environment::Production
    }
}
