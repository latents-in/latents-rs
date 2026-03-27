use crate::{
    error::{AppError, Result},
    models::feed::{
        AiSitrepResult, ArticleRef, FeedCard, FeedResponse, IntelligenceReport,
        IntentResult, NewsApiArticle, NewsApiResponse,
    },
    state::AppState,
};
use redis::AsyncCommands;
use reqwest::Client;
use serde_json::json;
use sqlx::types::Json;
use std::{
    collections::HashSet,
    sync::Arc,
    time::Instant,
};
use tokio::sync::Mutex;
use tracing::{error, info, warn};

const RATE_LIMIT_MAX_REQUESTS: u32 = 20;
const RATE_LIMIT_WINDOW_SECS: u64 = 3600;

// Cache TTLs by intent
const TTL_NEWS_SECS: u64 = 600;       // 10 min — news is fresh, short cache
const TTL_INCIDENTS_SECS: u64 = 300;  // 5 min — incidents change fast
const TTL_JOBS_SECS: u64 = 3600;      // 1 hr  — jobs are stable
const TTL_MIXED_SECS: u64 = 600;
const DB_CACHE_HOURS: i64 = 8;        // Re-generate report after 8 hours

pub async fn enforce_rate_limit(ip: &str, state: &Arc<AppState>) -> Result<()> {
    let mut entry = state
        .rate_limit_map
        .entry(ip.to_string())
        .or_insert((0, Instant::now()));

    if entry.1.elapsed().as_secs() > RATE_LIMIT_WINDOW_SECS {
        entry.0 = 0;
        entry.1 = Instant::now();
    }

    if entry.0 >= RATE_LIMIT_MAX_REQUESTS {
        warn!("Rate limit exceeded for IP: {}", ip);
        return Err(AppError::TooManyRequests(
            "Rate limit of 20 requests per hour exceeded".into(),
        ));
    }
    entry.0 += 1;
    Ok(())
}

/// Build a consistent Redis cache key from a normalised query string
fn cache_key(query: &str) -> String {
    let hash = format!("{:x}", md5::compute(query.trim().to_lowercase().as_bytes()));
    format!("intel:{}:{}", &hash[..8], query.len())
}

fn ttl_for_intent(intent: &str) -> u64 {
    match intent {
        "incidents" => TTL_INCIDENTS_SECS,
        "jobs" => TTL_JOBS_SECS,
        _ => TTL_NEWS_SECS,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_intelligence_feed(
    query: String,
    page: i64,
    state: Arc<AppState>,
) -> Result<FeedResponse> {
    let qn = query.trim().to_lowercase();
    let ck = cache_key(&qn);

    // ── L1: Redis cache ───────────────────────────────────────────────────────
    if let Some(redis) = &state.redis {
        let mut conn = redis.lock().await;
        match conn.get::<_, Option<String>>(&ck).await {
            Ok(Some(cached)) => {
                info!("Redis L1 hit for query: {qn}");
                if let Ok(item) = serde_json::from_str::<FeedCard>(&cached) {
                    return Ok(FeedResponse {
                        items: vec![item],
                        total: 1,
                        page,
                        has_more: false,
                        cache_status: "redis".into(),
                    });
                }
            }
            Ok(None) => {}
            Err(e) => warn!("Redis get error (non-fatal): {e}"),
        }
    }

    // ── L2: Postgres cache ────────────────────────────────────────────────────
    let cached_report: Option<IntelligenceReport> = sqlx::query_as(
        "SELECT * FROM intelligence_reports
         WHERE search_query = $1
           AND created_at > NOW() - INTERVAL '8 hours'
         ORDER BY created_at DESC
         LIMIT 1",
    )
    .bind(&qn)
    .fetch_optional(&state.db)
    .await?;

    if let Some(report) = cached_report {
        info!("Postgres L2 hit for query: {qn}");
        let articles = fetch_articles_for_report(report.id, &state.db).await?;
        let card = report_to_card(report, articles, "postgres");
        // Backfill Redis
        backfill_redis(&state, &ck, &card, TTL_MIXED_SECS).await;
        return Ok(FeedResponse {
            items: vec![card],
            total: 1,
            page,
            has_more: false,
            cache_status: "postgres".into(),
        });
    }

    // ── Stampede lock: only one goroutine runs the pipeline per query ─────────
    let lock = state
        .active_fetches
        .entry(qn.clone())
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone();
    let _guard = lock.lock().await;

    // Re-check after acquiring lock
    let rechecked: Option<IntelligenceReport> = sqlx::query_as(
        "SELECT * FROM intelligence_reports
         WHERE search_query = $1
           AND created_at > NOW() - INTERVAL '8 hours'
         ORDER BY created_at DESC
         LIMIT 1",
    )
    .bind(&qn)
    .fetch_optional(&state.db)
    .await?;

    if let Some(report) = rechecked {
        let articles = fetch_articles_for_report(report.id, &state.db).await?;
        let card = report_to_card(report, articles, "postgres");
        state.active_fetches.remove(&qn);
        return Ok(FeedResponse {
            items: vec![card],
            total: 1,
            page,
            has_more: false,
            cache_status: "postgres".into(),
        });
    }

    // ── PIPELINE ──────────────────────────────────────────────────────────────
    info!("Cache miss — running 4-step intelligence pipeline for: {qn}");
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .unwrap();

    // Step 1 — Intent Classification
    let intent = classify_intent(&client, &qn, &state)
        .await
        .unwrap_or_else(|_| IntentResult {
            intent: "news".into(),
            country: "".into(),
            keywords: vec![qn.clone()],
        });
    info!("Intent: {:?}", intent);

    // Step 2 — Aggregate sources using classified keywords
    let search_keywords = if intent.keywords.is_empty() {
        vec![qn.clone()]
    } else {
        intent.keywords.clone()
    };
    let raw_articles = fetch_news_api(&client, &search_keywords.join(" "), &state).await?;

    if raw_articles.is_empty() {
        state.active_fetches.remove(&qn);
        return Ok(FeedResponse {
            items: vec![],
            total: 0,
            page,
            has_more: false,
            cache_status: "live".into(),
        });
    }

    // Step 3 — Deduplicate & rank by recency
    let deduped = dedupe_and_rank(raw_articles);
    let top_articles = deduped.into_iter().take(20).collect::<Vec<_>>();

    // Step 4 — AI Summarization → structured situation report
    let sitrep = ai_summarize(&client, &top_articles, &qn, &state)
        .await
        .unwrap_or_else(|_| AiSitrepResult {
            title: qn.clone(),
            risk_level: "Medium".into(),
            regions: vec!["Global".into()],
            bullets: top_articles
                .iter()
                .take(4)
                .map(|a| a.title.clone())
                .collect(),
            why_it_matters: "No AI summary available — showing raw headlines.".into(),
            opportunity_score: Some(70),
        });

    // ── Persist to Postgres ───────────────────────────────────────────────────
    let safe_risk = match sitrep.risk_level.as_str() {
        "Low" | "Medium" | "High" | "Critical" => sitrep.risk_level.clone(),
        _ => "Medium".into(),
    };
    let safe_intent = match intent.intent.as_str() {
        "news" | "jobs" | "incidents" | "mixed" => intent.intent.clone(),
        _ => "news".into(),
    };
    let bullets_json: serde_json::Value =
        serde_json::to_value(&sitrep.bullets).unwrap_or(json!([]));
    let opp_score = sitrep.opportunity_score.unwrap_or(70).clamp(0, 100);

    let report_id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO intelligence_reports
            (search_query, intent, risk_level, regions, bullets, why_it_matters,
             opportunity_score, source_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id",
    )
    .bind(&qn)
    .bind(&safe_intent)
    .bind(&safe_risk)
    .bind(&sitrep.regions)
    .bind(&bullets_json)
    .bind(&sitrep.why_it_matters)
    .bind(opp_score)
    .bind(top_articles.len() as i32)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        error!("Failed to insert intelligence_report: {e}");
        AppError::InternalError(anyhow::anyhow!("DB insert failed"))
    })?;

    for article in &top_articles {
        let source_name = article
            .source
            .as_ref()
            .and_then(|s| s.name.clone())
            .unwrap_or_else(|| "Unknown".into());
        let pub_at = article.published_at.unwrap_or_else(chrono::Utc::now);
        let _ = sqlx::query(
            "INSERT INTO report_articles (report_id, title, url, source, published_at)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
        )
        .bind(report_id)
        .bind(&article.title)
        .bind(&article.url)
        .bind(&source_name)
        .bind(pub_at)
        .execute(&state.db)
        .await;
    }

    // Build the card
    let article_refs: Vec<ArticleRef> = top_articles
        .iter()
        .take(5)
        .map(|a| ArticleRef {
            title: a.title.clone(),
            url: a.url.clone(),
            source: a
                .source
                .as_ref()
                .and_then(|s| s.name.clone())
                .unwrap_or_default(),
            published_at: a
                .published_at
                .map(|d| d.format("%b %d, %Y").to_string())
                .unwrap_or_else(|| "Unknown".into()),
        })
        .collect();

    let first_source = top_articles
        .first()
        .and_then(|a| a.source.as_ref())
        .and_then(|s| s.name.clone())
        .unwrap_or_else(|| "Multiple Sources".into());

    let card = FeedCard {
        id: report_id.to_string(),
        intent: safe_intent,
        title: sitrep.title,
        risk_level: safe_risk,
        regions: sitrep.regions,
        bullets: sitrep.bullets,
        why_it_matters: sitrep.why_it_matters,
        opportunity_score: opp_score,
        source: first_source,
        source_count: top_articles.len() as i32,
        likes_count: 0,
        saves_count: 0,
        published_at: "Just now".into(),
        cache_status: "live".into(),
        articles: article_refs,
    };

    // ── Backfill Redis L1 ─────────────────────────────────────────────────────
    backfill_redis(&state, &ck, &card, ttl_for_intent(&card.intent)).await;
    state.active_fetches.remove(&qn);

    Ok(FeedResponse {
        items: vec![card],
        total: 1,
        page,
        has_more: false,
        cache_status: "live".into(),
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Like / Save interaction
// ─────────────────────────────────────────────────────────────────────────────

pub async fn toggle_interaction(
    report_id: uuid::Uuid,
    user_id: &str,
    action: &str,
    state: Arc<AppState>,
) -> Result<(bool, i64)> {
    let safe_action = match action {
        "like" | "save" => action,
        _ => return Err(AppError::BadRequest("Invalid action".into())),
    };

    // Try to delete first (toggle off)
    let deleted = sqlx::query(
        "DELETE FROM feed_interactions WHERE report_id=$1 AND user_id=$2 AND action=$3",
    )
    .bind(report_id)
    .bind(user_id)
    .bind(safe_action)
    .execute(&state.db)
    .await?;

    let toggled_off = deleted.rows_affected() > 0;

    if !toggled_off {
        // Toggle on
        let _ = sqlx::query(
            "INSERT INTO feed_interactions (report_id, user_id, action)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        )
        .bind(report_id)
        .bind(user_id)
        .bind(safe_action)
        .execute(&state.db)
        .await;
    }

    // Update report counter
    let col = match safe_action {
        "like" => "likes_count",
        _ => "saves_count",
    };
    let delta: i64 = if toggled_off { -1 } else { 1 };
    let _ = sqlx::query(&format!(
        "UPDATE intelligence_reports SET {col} = GREATEST(0, {col} + $1) WHERE id = $2"
    ))
    .bind(delta)
    .bind(report_id)
    .execute(&state.db)
    .await;

    let new_count: i64 = sqlx::query_scalar(&format!(
        "SELECT {col} FROM intelligence_reports WHERE id = $1"
    ))
    .bind(report_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    Ok((toggled_off, new_count))
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

async fn fetch_articles_for_report(
    report_id: uuid::Uuid,
    db: &sqlx::PgPool,
) -> Result<Vec<crate::models::feed::ReportArticle>> {
    let articles = sqlx::query_as(
        "SELECT * FROM report_articles WHERE report_id = $1 ORDER BY published_at DESC LIMIT 5",
    )
    .bind(report_id)
    .fetch_all(db)
    .await?;
    Ok(articles)
}

fn report_to_card(
    r: IntelligenceReport,
    articles: Vec<crate::models::feed::ReportArticle>,
    cache_status: &str,
) -> FeedCard {
    let article_refs = articles
        .into_iter()
        .map(|a| ArticleRef {
            title: a.title,
            url: a.url,
            source: a.source,
            published_at: a.published_at.format("%b %d, %Y").to_string(),
        })
        .collect();

    let first_source = r
        .search_query
        .split_whitespace()
        .next()
        .unwrap_or("Intelligence")
        .to_string();

    FeedCard {
        id: r.id.to_string(),
        intent: r.intent,
        title: r.search_query.clone(),
        risk_level: r.risk_level,
        regions: r.regions,
        bullets: r.bullets.0,
        why_it_matters: r.why_it_matters,
        opportunity_score: r.opportunity_score,
        source: first_source,
        source_count: r.source_count,
        likes_count: r.likes_count,
        saves_count: r.saves_count,
        published_at: r.created_at.format("%b %d · %H:%M UTC").to_string(),
        cache_status: cache_status.to_string(),
        articles: article_refs,
    }
}

async fn backfill_redis(state: &Arc<AppState>, key: &str, card: &FeedCard, ttl: u64) {
    if let Some(redis) = &state.redis {
        if let Ok(serialized) = serde_json::to_string(card) {
            let mut conn = redis.lock().await;
            if let Err(e) = conn
                .set_ex::<_, _, ()>(key, serialized, ttl)
                .await
            {
                warn!("Redis set error (non-fatal): {e}");
            }
        }
    }
}

fn dedupe_and_rank(mut articles: Vec<NewsApiArticle>) -> Vec<NewsApiArticle> {
    let mut seen_urls = HashSet::new();
    let mut seen_titles = HashSet::new();

    // Sort by published_at descending (most recent first)
    articles.sort_by(|a, b| b.published_at.cmp(&a.published_at));

    articles
        .into_iter()
        .filter(|a| {
            let url_key = a.url.trim().to_lowercase();
            // Normalise title: first 60 chars lowercased
            let title_key = a.title.trim().to_lowercase();
            let title_short = &title_key[..title_key.len().min(60)];

            if seen_urls.contains(&url_key) || seen_titles.contains(title_short) {
                return false;
            }
            seen_urls.insert(url_key);
            seen_titles.insert(title_short.to_string());
            true
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Intent Classifier
// ─────────────────────────────────────────────────────────────────────────────

async fn classify_intent(
    client: &Client,
    query: &str,
    state: &Arc<AppState>,
) -> Result<IntentResult> {
    let system = r#"You are an intent classifier for a global intelligence platform.
Classify the user query into one of: news, jobs, incidents, mixed.
Extract the primary country/region and top 3 search keywords.
Return ONLY valid JSON:
{"intent":"news","country":"India","keywords":["keyword1","keyword2","keyword3"]}"#;

    let payload = json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role":"system","content": system},
            {"role":"user","content": query}
        ],
        "response_format": {"type":"json_object"},
        "max_tokens": 120
    });

    let api_key = state
        .openrouter_keys
        .get_key()
        .ok_or_else(|| AppError::InternalError(anyhow::anyhow!("No OpenRouter key")))?;

    let res = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {api_key}"))
        .header("HTTP-Referer", "https://latents.io")
        .header("X-Title", "Latents Intelligence OS")
        .json(&payload)
        .send()
        .await
        .map_err(|e| AppError::InternalError(anyhow::anyhow!("OpenRouter request failed: {e}")))?;

    if !res.status().is_success() {
        state.openrouter_keys.rotate();
        return Err(AppError::InternalError(anyhow::anyhow!(
            "OpenRouter classify returned {}", res.status()
        )));
    }

    let data: serde_json::Value = res.json().await?;
    let content = data["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("{}");

    serde_json::from_str::<IntentResult>(content)
        .map_err(|e| AppError::InternalError(anyhow::anyhow!("Parse intent failed: {e}")))
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — News API Aggregation
// ─────────────────────────────────────────────────────────────────────────────

async fn fetch_news_api(
    client: &Client,
    query: &str,
    state: &Arc<AppState>,
) -> Result<Vec<NewsApiArticle>> {
    for _ in 0..3u8 {
        let api_key = match state.news_api_keys.get_key() {
            Some(k) => k,
            None => break,
        };

        let url = format!(
            "https://newsapi.org/v2/everything?q={}&pageSize=50&sortBy=publishedAt&language=en",
            urlencoding::encode(query)
        );

        match client.get(&url).header("X-Api-Key", &api_key).send().await {
            Ok(res) if res.status().is_success() => {
                let parsed: NewsApiResponse = res
                    .json()
                    .await
                    .map_err(|e| AppError::InternalError(anyhow::anyhow!("News parse: {e}")))?;
                let articles = parsed
                    .articles
                    .unwrap_or_default()
                    .into_iter()
                    // Drop removed/[Removed] articles
                    .filter(|a| !a.title.contains("[Removed]") && a.url.starts_with("http"))
                    .collect();
                return Ok(articles);
            }
            Ok(res)
                if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS
                    || res.status() == reqwest::StatusCode::UNAUTHORIZED =>
            {
                warn!("NewsAPI key exhausted — rotating");
                state.news_api_keys.rotate();
            }
            Ok(res) => {
                error!("NewsAPI error: {}", res.status());
            }
            Err(e) => {
                warn!("NewsAPI request error: {e}");
            }
        }
    }
    warn!("NewsAPI exhausted all retries");
    Ok(vec![])
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — AI Situation Report Summarizer
// ─────────────────────────────────────────────────────────────────────────────

async fn ai_summarize(
    client: &Client,
    articles: &[NewsApiArticle],
    query: &str,
    state: &Arc<AppState>,
) -> Result<AiSitrepResult> {
    let article_list: Vec<String> = articles
        .iter()
        .take(15)
        .enumerate()
        .map(|(i, a)| {
            let src = a
                .source
                .as_ref()
                .and_then(|s| s.name.as_deref())
                .unwrap_or("Unknown");
            format!("{}. [{}] {}", i + 1, src, a.title)
        })
        .collect();

    let articles_text = article_list.join("\n");

    let system = r#"You are a senior global intelligence analyst.
Given a list of news headlines, produce a structured situation report.

Return ONLY valid JSON in this exact shape:
{
  "title": "concise intelligence title",
  "risk_level": "Low|Medium|High|Critical",
  "regions": ["Region1","Region2"],
  "bullets": ["bullet 1","bullet 2","bullet 3","bullet 4"],
  "why_it_matters": "2-3 sentences explaining impact",
  "opportunity_score": 75
}

Rules:
- title: max 12 words, sharp and specific
- risk_level: Low (informational), Medium (watch closely), High (immediate attention), Critical (severe/life-threatening)
- regions: top 1-4 affected regions, real country/city names
- bullets: 3-5 concise, factual bullets from the headlines
- why_it_matters: neutral analyst perspective, max 60 words
- opportunity_score: 0-100 relevance/urgency score"#;

    let user_msg = format!("Query: \"{query}\"\n\nHeadlines:\n{articles_text}");

    let payload = json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role":"system","content": system},
            {"role":"user","content": user_msg}
        ],
        "response_format": {"type":"json_object"},
        "max_tokens": 600
    });

    for _ in 0..3u8 {
        let api_key = match state.openrouter_keys.get_key() {
            Some(k) => k,
            None => break,
        };

        match client
            .post("https://openrouter.ai/api/v1/chat/completions")
            .header("Authorization", format!("Bearer {api_key}"))
            .header("HTTP-Referer", "https://latents.io")
            .header("X-Title", "Latents Intelligence OS")
            .json(&payload)
            .send()
            .await
        {
            Ok(res) if res.status().is_success() => {
                let data: serde_json::Value = res.json().await?;
                let content = data["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("{}");
                match serde_json::from_str::<AiSitrepResult>(content) {
                    Ok(result) => return Ok(result),
                    Err(e) => warn!("Failed to parse AI sitrep: {e}. Content: {content}"),
                }
            }
            Ok(res)
                if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS
                    || res.status() == reqwest::StatusCode::UNAUTHORIZED =>
            {
                state.openrouter_keys.rotate();
            }
            Ok(res) => error!("OpenRouter summarize error: {}", res.status()),
            Err(e) => warn!("OpenRouter request error: {e}"),
        }
    }

    Err(AppError::InternalError(anyhow::anyhow!(
        "AI summarization failed after retries"
    )))
}
