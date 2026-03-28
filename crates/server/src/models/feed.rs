use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Json;
use uuid::Uuid;

// ── Query params ──────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct FeedQuery {
    /// Frontend sends ?q=  (legacy also accepts ?query=)
    pub q: Option<String>,
    pub query: Option<String>,
    pub page: Option<i64>,
}

impl FeedQuery {
    pub fn get_query(&self) -> Option<String> {
        self.q.clone().or_else(|| self.query.clone())
    }
}

#[derive(Debug, Deserialize)]
pub struct InteractQuery {
    pub user_id: String,
    pub action: String, // "like" | "save"
}

// ── Database row types ────────────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
pub struct IntelligenceReport {
    pub id: Uuid,
    pub search_query: String,
    pub intent: String,
    pub risk_level: String,
    pub regions: Vec<String>,
    /// Stored as JSONB array of strings
    pub bullets: Json<Vec<String>>,
    pub why_it_matters: String,
    pub opportunity_score: i32,
    pub source_count: i32,
    pub likes_count: i32,
    pub saves_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
pub struct ReportArticle {
    pub id: Uuid,
    pub report_id: Uuid,
    pub title: String,
    pub url: String,
    pub source: String,
    pub published_at: DateTime<Utc>,
}

// ── API response types (sent to frontend) ────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedCard {
    pub id: String,
    pub intent: String,
    pub title: String,
    pub risk_level: String,
    pub regions: Vec<String>,
    pub bullets: Vec<String>,
    pub why_it_matters: String,
    pub opportunity_score: i32,
    pub source: String,
    pub source_count: i32,
    pub likes_count: i32,
    pub saves_count: i32,
    pub published_at: String,
    pub cache_status: String,
    pub articles: Vec<ArticleRef>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArticleRef {
    pub title: String,
    pub url: String,
    pub source: String,
    pub published_at: String,
}

#[derive(Debug, Serialize)]
pub struct FeedResponse {
    pub items: Vec<FeedCard>,
    pub total: i64,
    pub page: i64,
    pub has_more: bool,
    pub cache_status: String,
}

#[derive(Debug, Serialize)]
pub struct InteractResponse {
    pub success: bool,
    pub action: String,
    pub toggled_off: bool,
    pub new_count: i64,
}

// ── External API types ────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Clone)]
pub struct NewsApiSource {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct NewsApiArticle {
    pub title: String,
    pub url: String,
    pub source: Option<NewsApiSource>,
    #[serde(rename = "publishedAt")]
    pub published_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct NewsApiResponse {
    pub status: String,
    pub articles: Option<Vec<NewsApiArticle>>,
}

// ── OpenRouter response types ─────────────────────────────────────────────────

/// Step 1: intent classification
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IntentResult {
    pub intent: String,   // "news" | "jobs" | "incidents" | "mixed"
    pub country: String,
    pub keywords: Vec<String>,
}

/// Step 4: AI summarization output
#[derive(Debug, Deserialize, Clone)]
pub struct AiSitrepResult {
    pub title: String,
    pub risk_level: String,         // Low / Medium / High / Critical
    pub regions: Vec<String>,
    pub bullets: Vec<String>,       // 3-5 bullet points
    pub why_it_matters: String,
    pub opportunity_score: Option<i32>,
}

// ── Old compatibility types (kept so ephemeral_feed code still compiles) ─────

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategorizedArticle {
    pub title: String,
    pub bucket: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenRouterCategoryResponse {
    pub articles: Vec<CategorizedArticle>,
}
