use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    models::feed::{FeedQuery, InteractQuery, InteractResponse},
    services::feed_service::{enforce_rate_limit, get_intelligence_feed, toggle_interaction},
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

    enforce_rate_limit(&client_ip, &state).await?;

    let query = params
        .get_query()
        .ok_or_else(|| AppError::BadRequest("Missing query parameter ?q=".into()))?;

    if query.trim().is_empty() {
        return Err(AppError::BadRequest("Query cannot be empty".into()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let response = get_intelligence_feed(query, page, state).await?;

    Ok((StatusCode::OK, Json(response)))
}

pub async fn interact_feed(
    State(state): State<Arc<AppState>>,
    Path(report_id): Path<Uuid>,
    Query(params): Query<InteractQuery>,
) -> Result<impl IntoResponse> {
    if params.user_id.is_empty() {
        return Err(AppError::BadRequest("user_id is required".into()));
    }

    let (toggled_off, new_count) =
        toggle_interaction(report_id, &params.user_id, &params.action, state).await?;

    Ok((
        StatusCode::OK,
        Json(InteractResponse {
            success: true,
            action: params.action,
            toggled_off,
            new_count,
        }),
    ))
}
