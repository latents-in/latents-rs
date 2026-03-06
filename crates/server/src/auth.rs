use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
}

// Magic link authentication (to be implemented)
// JWT-based authentication has been replaced with magic links
