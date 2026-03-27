-- Intelligence Reports: one AI-structured report per unique search query
CREATE TABLE IF NOT EXISTS intelligence_reports (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query    TEXT        NOT NULL,
    intent          TEXT        NOT NULL DEFAULT 'news'
                                CHECK (intent IN ('news', 'jobs', 'incidents', 'mixed')),
    risk_level      TEXT        NOT NULL DEFAULT 'Medium'
                                CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    regions         TEXT[]      NOT NULL DEFAULT '{}',
    bullets         JSONB       NOT NULL DEFAULT '[]',
    why_it_matters  TEXT        NOT NULL DEFAULT '',
    opportunity_score INT       NOT NULL DEFAULT 70,
    source_count    INT         NOT NULL DEFAULT 0,
    likes_count     INT         NOT NULL DEFAULT 0,
    saves_count     INT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Source articles that backed an intelligence report
CREATE TABLE IF NOT EXISTS report_articles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID        NOT NULL REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    url             TEXT        NOT NULL,
    source          TEXT        NOT NULL DEFAULT '',
    published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User interactions: likes and saves (user_id = anonymous session UUID from frontend)
CREATE TABLE IF NOT EXISTS feed_interactions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID        NOT NULL REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    user_id     TEXT        NOT NULL,  -- anonymous session UUID or Supabase user ID
    action      TEXT        NOT NULL CHECK (action IN ('like', 'save')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_id, user_id, action)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intel_reports_query   ON intelligence_reports(search_query);
CREATE INDEX IF NOT EXISTS idx_intel_reports_created ON intelligence_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_articles_rid   ON report_articles(report_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_rid ON feed_interactions(report_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_uid ON feed_interactions(user_id);
