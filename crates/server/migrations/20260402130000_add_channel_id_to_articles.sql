-- Link articles to channels for Firecrawl/RSS provenance
ALTER TABLE articles ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_articles_channel ON articles(channel_id);
