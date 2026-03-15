use crate::error::Result;
use crate::models::WaitlistEntry;
use chrono::Utc;
use sqlx::{PgPool, Row};

pub async fn create_waitlist_entry(
    db: &PgPool,
    email: &str,
    name: &str,
    location: Option<&str>,
    role: Option<&str>,
) -> Result<u64> {
    let mut tx = db.begin().await?;

    // 1. Insert the user (or ignore if already exists) and return created_at
    let created_at: chrono::DateTime<Utc> = sqlx::query_scalar(
        r#"
        INSERT INTO waitlist (id, email, name, location, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET
            role = CASE WHEN waitlist.role IS NULL THEN EXCLUDED.role ELSE waitlist.role END,
            name = CASE WHEN waitlist.name IS NULL THEN EXCLUDED.name ELSE waitlist.name END
        RETURNING created_at
        "#,
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(email.to_lowercase())
    .bind(name)
    .bind(location)
    .bind(role)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;

    // 2. Get this user's rank using a highly efficient COUNT(*) based on the created_at index
    let rank: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*) + 1 
        FROM waitlist 
        WHERE created_at < $1 OR (created_at = $1 AND email <= $2)
        "#,
    )
    .bind(created_at)
    .bind(email.to_lowercase())
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(rank as u64)
}

pub async fn get_all_waitlist_entries(db: &PgPool) -> Result<Vec<WaitlistEntry>> {
    let rows = sqlx::query(
        r#"
        SELECT id, email, name, location, role, created_at
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
            role: row.get("role"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(entries)
}
