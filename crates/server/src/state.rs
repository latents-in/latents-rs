use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub supabase_jwt_secret: String,
}

impl AppState {
    pub fn new(db: PgPool, supabase_jwt_secret: String) -> Self {
        Self { db, supabase_jwt_secret }
    }
}
