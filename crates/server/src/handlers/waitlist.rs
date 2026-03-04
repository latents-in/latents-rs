use crate::{
    error::{AppError, Result},
    models::{WaitlistRequest, WaitlistResponse, WaitlistEntry},
    state::AppState,
    db::waitlist as waitlist_db,
};
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use validator::Validate;

pub async fn add_to_waitlist(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<WaitlistRequest>,
) -> Result<impl IntoResponse> {
    // Validate email
    payload.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Insert into database
    let created = waitlist_db::create_waitlist_entry(&state.db, &payload.email).await?;

    if created {
        Ok((
            StatusCode::CREATED,
            Json(WaitlistResponse {
                message: "Email added successfully".to_string(),
            }),
        ))
    } else {
        Err(AppError::Conflict("Email already on the waitlist".to_string()))
    }
}

pub async fn get_waitlist(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<WaitlistEntry>>> {
    let entries = waitlist_db::get_all_waitlist_entries(&state.db).await?;
    Ok(Json(entries))
}
