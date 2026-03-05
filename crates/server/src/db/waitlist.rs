use crate::error::Result;
use crate::models::WaitlistEntry;
use chrono::Utc;
use sqlx::{PgPool, Row};

pub async fn create_waitlist_entry(
    db: &PgPool,
    email: &str,
    name: &str,
    location: Option<&str>,
) -> Result<u64> {
    let mut tx = db.begin().await?;

    // 1. Insert the user (or ignore if already exists)
    let _ = sqlx::query(
        r#"
        INSERT INTO waitlist (id, email, name, location, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        "#,
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(email.to_lowercase())
    .bind(name)
    .bind(location)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    // 2. Get the created_at of this specific user
    let user_created_at: chrono::DateTime<Utc> = sqlx::query_scalar(
        r#"SELECT created_at FROM waitlist WHERE email = $1"#,
    )
    .bind(email.to_lowercase())
    .fetch_one(&mut *tx)
    .await?;

    // 3. Calculate rank (how many users joined before this user)
    let count_before: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*) FROM waitlist WHERE created_at < $1"#,
    )
    .bind(user_created_at)
    .fetch_one(&mut *tx)
    .await?;

    let rank = (count_before + 1) as u64;

    tx.commit().await?;

    Ok(rank)
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
