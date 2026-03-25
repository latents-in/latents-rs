use axum::{
    extract::{Query, State},
    http::{StatusCode, HeaderMap},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

use crate::{
    error::{AppError, Result},
    models::feed::{FeedQuery, FeedResponse},
    services::feed_service::{get_ephemeral_feed, enforce_rate_limit},
    state::AppState,
};

pub async fn get_feed(
    headers: HeaderMap,
    State(state): State<Arc<AppState>>,
    Query(params): Query<FeedQuery>,
) -> Result<impl IntoResponse> {
    let client_ip = headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or("").trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());
    
    // 1. Enforce rate Limit (max 10 calls per IP per hour)
    enforce_rate_limit(&client_ip, &state).await?;

    let page = params.page.unwrap_or(1);
    if page < 1 {
        return Err(AppError::BadRequest("Page must be > 0".into()));
    }
    
    if params.query.trim().is_empty() {
        return Err(AppError::BadRequest("Search query cannot be empty".into()));
    }

    // 2. Fetch the ephemeral feed (Hit or Miss)
    let (items, total_count) = get_ephemeral_feed(params.query.clone(), page, state).await?;
    
    // 3. Construct response mapping exactly to structured OpenRouter format expectations
    let has_more = (page * 20) < total_count;
    
    let response = FeedResponse {
        items,
        total: total_count,
        page,
        has_more,
    };
    
    Ok((StatusCode::OK, Json(response)))
}
