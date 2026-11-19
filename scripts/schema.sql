-- Voice of President -- article database schema
-- SQLite is the single source of truth for articles, their body blocks, and tags.
-- Run `node scripts/build.mjs` after any change to regenerate the static site.

CREATE TABLE IF NOT EXISTS articles (
  id          TEXT PRIMARY KEY,
  sort_order  INTEGER NOT NULL UNIQUE, -- 0 = newest (VOL. descending)
  vol         TEXT NOT NULL,
  date        TEXT NOT NULL,
  category    TEXT NOT NULL,
  photo       TEXT NOT NULL,
  face        TEXT NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT NOT NULL,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  name        TEXT NOT NULL,
  excerpt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blocks (
  article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  seq         INTEGER NOT NULL,
  type        TEXT NOT NULL, -- lead | h | p | q | prof | img
  text        TEXT,
  src         TEXT,
  caption     TEXT,
  PRIMARY KEY (article_id, seq)
);

CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type  TEXT NOT NULL -- industry | person | company
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
