-- ─────────────────────────────────────────────────────────────
-- Users (full profile as specified)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  phone_number      TEXT,
  password_hash     TEXT NOT NULL,
  username          TEXT UNIQUE NOT NULL,
  avatar_url        TEXT,
  bio               TEXT,
  full_name         TEXT,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  education         TEXT,
  interests         TEXT[] DEFAULT '{}',
  preferred_lang    TEXT DEFAULT 'en',
  timezone          TEXT DEFAULT 'UTC',
  notification_prefs JSONB DEFAULT '{"email": true, "push": false}',
  onboarding_done   BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  theme_pref        TEXT DEFAULT 'dark',
  last_active_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- Refresh tokens
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─────────────────────────────────────────────────────────────
-- Articles (standalone, linked from intelligence_reports or channels)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  content          TEXT,
  summary          TEXT,
  source_url       TEXT UNIQUE NOT NULL,
  image_url        TEXT,
  source_name      TEXT,
  author           TEXT,
  tags             TEXT[] DEFAULT '{}',
  published_at     TIMESTAMPTZ,
  importance_score FLOAT DEFAULT 0.0,
  recency_score    FLOAT DEFAULT 0.0,
  engagement_score FLOAT DEFAULT 0.0,
  relevance_score  FLOAT DEFAULT 0.0,
  like_count       INT DEFAULT 0,
  save_count       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_importance ON articles(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published  ON articles(published_at DESC);

-- ─────────────────────────────────────────────────────────────
-- User Likes & Saves for articles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_article_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_user_article_likes ON user_article_likes(user_id);

CREATE TABLE IF NOT EXISTS user_article_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_user_article_saves ON user_article_saves(user_id);

-- ─────────────────────────────────────────────────────────────
-- Chats (ChatGPT-style conversation threads)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id, updated_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at ASC);

-- ─────────────────────────────────────────────────────────────
-- Channels (user-added websites for news monitoring)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS channels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  name           TEXT,
  rss_url        TEXT,
  use_firecrawl  BOOLEAN DEFAULT false,
  is_active      BOOLEAN DEFAULT true,
  last_fetched   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(user_id);
