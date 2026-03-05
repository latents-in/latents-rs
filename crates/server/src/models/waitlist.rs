use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct WaitlistRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 1, max = 255, message = "Name must be between 1 and 255 characters"))]
    pub name: String,
    /// Optional location - if not provided, will be detected from IP
    pub location: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WaitlistResponse {
    pub message: String,
    pub rank: u64,
}

#[derive(Debug, Serialize)]
pub struct WaitlistEntry {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub location: Option<String>,
    pub created_at: DateTime<Utc>,
}
