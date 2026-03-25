use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct FeedQuery {
    pub query: String,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FeedItem {
    pub id: Uuid,
    pub search_query: String,
    pub title: String,
    pub url: String,
    pub published_at: DateTime<Utc>,
    pub bucket: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FeedResponse {
    pub items: Vec<FeedItem>,
    pub total: i64,
    pub page: i64,
    pub has_more: bool,
}

// Extracted news article format from basic News APIs
#[derive(Debug, Deserialize)]
pub struct NewsApiArticle {
    pub title: String,
    pub url: String,
    #[serde(rename = "publishedAt")]
    pub published_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct NewsApiResponse {
    pub status: String,
    pub articles: Option<Vec<NewsApiArticle>>,
}

// OpenRouter categorization format (LLM Structured JSON)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategorizedArticle {
    pub title: String,
    pub bucket: String, // "Ground breaker", "Plus One", "Long shot"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenRouterCategoryResponse {
    pub articles: Vec<CategorizedArticle>,
}
