-- Add sentiment_score to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_score FLOAT DEFAULT 0.0;

-- Ensure importance_score is float (matching existing)
-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON articles(sentiment_score);
