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

    // 1. Insert the user (or ignore if already exists)
    let _ = sqlx::query(
        r#"
        INSERT INTO waitlist (id, email, name, location, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
        "#,
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(email.to_lowercase())
    .bind(name)
    .bind(location)
    .bind(role)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    // 2. Get this user's rank using ROW_NUMBER() which gives a guaranteed unique sequential rank
    let rank: i64 = sqlx::query_scalar(
        r#"
        SELECT row_num FROM (
            SELECT email, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as row_num
            FROM waitlist
        ) ranked
        WHERE email = $1
        "#,
    )
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
