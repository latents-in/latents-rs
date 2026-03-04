use crate::error::Result;
use crate::models::WaitlistEntry;
use chrono::Utc;
use sqlx::{PgPool, Row};

pub async fn create_waitlist_entry(
    db: &PgPool,
    email: &str,
    name: &str,
    location: Option<&str>,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        INSERT INTO waitlist (id, email, name, location, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(email.to_lowercase())
    .bind(name)
    .bind(location)
    .bind(Utc::now())
    .fetch_optional(db)
    .await?;

    Ok(result.is_some())
}

pub async fn get_all_waitlist_entries(db: &PgPool) -> Result<Vec<WaitlistEntry>> {
    let rows = sqlx::query(
        r#"
        SELECT id, email, name, location, created_at
        FROM waitlist
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(db)
    .await?;

    let entries = rows
        .into_iter()
        .map(|row| WaitlistEntry {
            id: row.get("id"),
            email: row.get("email"),
            name: row.get("name"),
            location: row.get("location"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(entries)
}
