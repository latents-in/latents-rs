use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct WaitlistRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct WaitlistResponse {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct WaitlistEntry {
    pub id: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
}
