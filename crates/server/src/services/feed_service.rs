use crate::{
    error::{AppError, Result},
    models::feed::{CategorizedArticle, FeedItem, NewsApiArticle, NewsApiResponse, OpenRouterCategoryResponse},
    state::AppState,
};
use dashmap::DashMap;
use reqwest::Client;
use serde_json::json;
use sqlx::PgPool;
use std::{sync::Arc, time::{Duration, Instant}};
use tokio::sync::Mutex;
use tracing::{error, info, warn};

const RATE_LIMIT_MAX_REQUESTS: u32 = 10;
const RATE_LIMIT_WINDOW_SECS: u64 = 3600; // 1 hour

/// Simple in-memory rate limiter based on IP/User
pub async fn enforce_rate_limit(ip: &str, state: &Arc<AppState>) -> Result<()> {
    let mut entry = state.rate_limit_map.entry(ip.to_string()).or_insert((0, Instant::now()));
    
    // Reset window if it's expired
    if entry.1.elapsed().as_secs() > RATE_LIMIT_WINDOW_SECS {
        entry.0 = 0;
        entry.1 = Instant::now();
    }
    
    if entry.0 >= RATE_LIMIT_MAX_REQUESTS {
        warn!("Rate limit exceeded for IP: {}", ip);
        return Err(AppError::TooManyRequests("Rate limit of 10 requests per hour exceeded".into()));
    }
    
    entry.0 += 1;
    Ok(())
}

pub async fn get_ephemeral_feed(query: String, page: i64, state: Arc<AppState>) -> Result<(Vec<FeedItem>, i64)> {
    let offset = (page - 1).max(0) * 20;
    let query_lower = query.to_lowercase();
    
    // 1. Quick Check Postgres for Cache Hit
    let total_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ephemeral_feed WHERE search_query = $1 AND created_at > NOW() - INTERVAL '24 hours'"
    )
    .bind(&query_lower)
    .fetch_one(&state.db)
    .await?;

    if total_count.0 > 0 {
        info!("Cache hit for query: {}", query_lower);
        let items = fetch_page_from_db(&query_lower, offset, &state.db).await?;
        return Ok((items, total_count.0));
    }

    // 2. Cache Miss - Enter Stampede Lock
    info!("Cache miss for query: {}. Acquiring stampede lock.", query_lower);
    let lock = state.active_fetches.entry(query_lower.clone())
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone();
        
    let _guard = lock.lock().await;

    // 3. Re-check Postgres in case another thread just populated it while we waited
    let total_recheck: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ephemeral_feed WHERE search_query = $1 AND created_at > NOW() - INTERVAL '24 hours'"
    )
    .bind(&query_lower)
    .fetch_one(&state.db)
    .await?;

    if total_recheck.0 > 0 {
        info!("Cache populated by another thread for query: {}", query_lower);
        let items = fetch_page_from_db(&query_lower, offset, &state.db).await?;
        state.active_fetches.remove(&query_lower);
        return Ok((items, total_recheck.0));
    }

    // 4. Actual Fetching Logic
    info!("Fetching fresh data for query: {}", query_lower);
    
    let client = Client::new();
    
    // Fetch from News API
    let raw_articles = fetch_news_api(&client, &query_lower, &state).await?;
    
    if raw_articles.is_empty() {
        state.active_fetches.remove(&query_lower);
        return Ok((vec![], 0));
    }

    // Categorize with OpenRouter
    let categories = categorize_with_openrouter(&client, &raw_articles, &state).await?;
    
    // Merge results and insert to DB
    let mut total_inserted = 0;
    for article in raw_articles {
        // Find corresponding bucket, default to Long shot if LLM missed it
        let bucket = categories.iter()
            .find(|c| c.title == article.title)
            .map(|c| c.bucket.as_str())
            .unwrap_or("Long shot");
            
        // Validate bucket enum
        let safe_bucket = match bucket {
            "Ground breaker" | "Plus One" => bucket,
            _ => "Long shot",
        };

        match sqlx::query(
            "INSERT INTO ephemeral_feed (search_query, title, url, published_at, bucket) 
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING"
        )
        .bind(&query_lower)
        .bind(&article.title)
        .bind(&article.url)
        .bind(&article.published_at)
        .bind(safe_bucket)
        .execute(&state.db)
        .await {
            Ok(_) => total_inserted += 1,
            Err(e) => warn!("Failed to insert article: {}", e),
        }
    }

    state.active_fetches.remove(&query_lower);
    
    if total_inserted > 0 {
        let items = fetch_page_from_db(&query_lower, offset, &state.db).await?;
        Ok((items, total_inserted))
    } else {
        Ok((vec![], 0))
    }
}

async fn fetch_page_from_db(query: &str, offset: i64, db: &PgPool) -> Result<Vec<FeedItem>> {
    let items = sqlx::query_as::<_, FeedItem>(
        "SELECT * FROM ephemeral_feed 
         WHERE search_query = $1 AND created_at > NOW() - INTERVAL '24 hours' 
         ORDER BY published_at DESC LIMIT 20 OFFSET $2"
    )
    .bind(query)
    .bind(offset)
    .fetch_all(db)
    .await?;
    Ok(items)
}

async fn fetch_news_api(client: &Client, query: &str, state: &Arc<AppState>) -> Result<Vec<NewsApiArticle>> {
    let mut retries = 0;
    let max_retries = 3;
    
    while retries < max_retries {
        let api_key = state.news_api_keys.get_key().ok_or_else(|| AppError::InternalError(anyhow::anyhow!("No News API keys available")))?;
        
        let url = format!("https://newsapi.org/v2/everything?q={}&pageSize=50&sortBy=publishedAt", urlencoding::encode(query));
        let response = client.get(&url)
            .header("X-Api-Key", &api_key)
            .header("User-Agent", "LatentsOS/1.0")
            .send()
            .await;
            
        if let Ok(res) = response {
            if res.status().is_success() {
                let parsed: NewsApiResponse = res.json().await.map_err(|_| AppError::InternalError(anyhow::anyhow!("Failed to parse News API response")))?;
                return Ok(parsed.articles.unwrap_or_default());
            } else if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS || res.status() == reqwest::StatusCode::UNAUTHORIZED {
                warn!("News API key rate limited or unauthorized. Rotating key.");
                state.news_api_keys.rotate();
            } else {
                error!("News API returned error status: {}", res.status());
            }
        }
        retries += 1;
    }
    
    // Return empty rather than failing completely if News API is exhausted
    warn!("Exhausted News API retries for query: {}", query);
    Ok(vec![])
}

async fn categorize_with_openrouter(client: &Client, articles: &[NewsApiArticle], state: &Arc<AppState>) -> Result<Vec<CategorizedArticle>> {
    let mut retries = 0;
    let max_retries = 3;
    
    // Prepare minimal prompt payload (we only send titles to save tokens and speed up)
    let titles: Vec<String> = articles.iter().take(30).map(|a| a.title.clone()).collect();
    
    let system_prompt = r#"
You are an expert news categorization AI. Categorize each article title into one of three strict buckets based on event deadlines and timeliness:
- "Ground breaker": Actions required within < 48 hours. Urgent breakthroughs.
- "Plus One": Important events within 3-4 weeks.
- "Long shot": General news, > 4 weeks out, or informational.
Respond ONLY with a JSON object containing an "articles" array. Each item must have "title" (exact match) and "bucket" (exact string).
"#;

    let payload = json!({
        "model": "openai/gpt-4o-mini", // Fast, cheap model
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": serde_json::to_string(&titles).unwrap() }
        ],
        "response_format": { "type": "json_object" }
    });
    
    while retries < max_retries {
        let api_key = state.openrouter_keys.get_key().ok_or_else(|| AppError::InternalError(anyhow::anyhow!("No OpenRouter API keys available")))?;
        
        let response = client.post("https://openrouter.ai/api/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("HTTP-Referer", "https://latents.io")
            .json(&payload)
            .send()
            .await;
            
        if let Ok(res) = response {
            if res.status().is_success() {
                let json_data: serde_json::Value = res.json().await.map_err(|_| AppError::InternalError(anyhow::anyhow!("Failed to parse OpenRouter JSON")))?;
                if let Some(content) = json_data["choices"][0]["message"]["content"].as_str() {
                    match serde_json::from_str::<OpenRouterCategoryResponse>(content) {
                        Ok(parsed) => return Ok(parsed.articles),
                        Err(e) => {
                            warn!("Failed to parse LLM structured output: {}. Retrying...", e);
                        }
                    }
                }
            } else if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS || res.status() == reqwest::StatusCode::UNAUTHORIZED {
                warn!("OpenRouter key rate limited or unauthorized. Rotating key.");
                state.openrouter_keys.rotate();
            } else {
                error!("OpenRouter returned error status: {}", res.status());
            }
        }
        retries += 1;
    }
    
    warn!("OpenRouter failed to categorize after retries, falling back to defaults.");
    Ok(vec![])
}
