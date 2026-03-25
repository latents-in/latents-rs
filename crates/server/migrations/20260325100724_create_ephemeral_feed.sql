-- Add migration script here
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- The ephemeral table
CREATE TABLE ephemeral_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    bucket TEXT NOT NULL CHECK (bucket IN ('Ground breaker', 'Plus One', 'Long shot')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast Cache Hit lookups based on exact query
CREATE INDEX idx_ephemeral_feed_query ON ephemeral_feed(search_query);

-- Index to optimize the deletion of old rows
CREATE INDEX idx_ephemeral_feed_created_at ON ephemeral_feed(created_at);

-- Schedule pg_cron to delete rows older than 24 hours (runs every hour)
SELECT cron.schedule('prune_ephemeral_cache', '0 * * * *', $$
    DELETE FROM ephemeral_feed WHERE created_at < NOW() - INTERVAL '24 hours';
$$);
