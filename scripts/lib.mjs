import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DB_PATH = path.join(ROOT, 'data', 'voice-of-president.db');

export function openDb() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

// A tag's identity is its (type, label) pair -- e.g. ("industry", "AI活用支援").
export function tagSlug(type, label) {
  return `${type}|${label}`;
}

export function upsertTag(db, type, label) {
  const slug = tagSlug(type, label);
  db.prepare('INSERT OR IGNORE INTO tags (slug, label, type) VALUES (?, ?, ?)').run(slug, label, type);
  const row = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug);
  return row.id;
}

export function linkTag(db, articleId, tagId) {
  db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(articleId, tagId);
}

// Splits a category string like "AI活用支援・経営伴走業" into individual industry tags.
export function splitCategory(category) {
  return category.split('・').map(s => s.trim()).filter(Boolean);
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
