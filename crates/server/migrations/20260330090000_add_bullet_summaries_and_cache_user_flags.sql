-- Add bullet_summaries to intelligence_reports for per-bullet blurbs
ALTER TABLE intelligence_reports
    ADD COLUMN IF NOT EXISTS bullet_summaries JSONB NOT NULL DEFAULT '[]';
