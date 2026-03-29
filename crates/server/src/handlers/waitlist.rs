use crate::{
    db::waitlist as waitlist_db,
    error::{AppError, Result},
    models::{WaitlistEntry, WaitlistRequest, WaitlistResponse},
    state::AppState,
};
use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use std::sync::Arc;
use validator::Validate;

pub async fn add_to_waitlist(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<WaitlistRequest>,
) -> Result<impl IntoResponse> {
    // Validate request
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Determine location:
    // 1. If location is provided in request (from browser geolocation), use it
    // 2. Otherwise, location is None (no geolocation service configured)
    let location = payload.location;
    let role = payload.role.clone();

    // Insert or get user from database and fetch rank
    let rank = waitlist_db::create_waitlist_entry(
        &state.db,
        &payload.email,
        &payload.name,
        location.as_deref(),
        payload.role.as_deref(),
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(WaitlistResponse {
            message: "Successfully processed waitlist entry".to_string(),
            rank,
            role,
        }),
    ))
}

pub async fn get_waitlist(State(state): State<Arc<AppState>>) -> Result<Json<Vec<WaitlistEntry>>> {
    let entries = waitlist_db::get_all_waitlist_entries(&state.db).await?;
    Ok(Json(entries))
}
