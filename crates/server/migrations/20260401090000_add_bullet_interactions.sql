-- Bullet-level interactions for per-bullet like/save (instagram-style)
CREATE TABLE IF NOT EXISTS bullet_interactions (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    bullet_index INT NOT NULL,
    user_id TEXT NOT NULL,
    liked BOOLEAN NOT NULL DEFAULT FALSE,
    saved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bullet_interactions_unique
    ON bullet_interactions (report_id, bullet_index, user_id);

CREATE INDEX IF NOT EXISTS bullet_interactions_like_idx
    ON bullet_interactions (report_id, bullet_index) WHERE liked = TRUE;

CREATE INDEX IF NOT EXISTS bullet_interactions_save_idx
    ON bullet_interactions (report_id, bullet_index) WHERE saved = TRUE;
