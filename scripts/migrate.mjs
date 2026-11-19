// One-time migration: reads the legacy articles-data.js (window.VOP_ARTICLES array)
// and loads it into SQLite (data/voice-of-president.db), the new source of truth.
//
// Usage: node scripts/migrate.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, DB_PATH, openDb, upsertTag, linkTag, splitCategory } from './lib.mjs';

const legacyPath = path.join(ROOT, 'articles-data.js');
const src = fs.readFileSync(legacyPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'articles-data.js' });
const articles = sandbox.window.VOP_ARTICLES;
if (!Array.isArray(articles) || !articles.length) {
  throw new Error('Could not read window.VOP_ARTICLES from articles-data.js');
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);

const db = openDb();
db.exec(fs.readFileSync(path.join(ROOT, 'scripts', 'schema.sql'), 'utf8'));

const insertArticle = db.prepare(`
  INSERT INTO articles (id, sort_order, vol, date, category, photo, face, title, subtitle, company, role, name, excerpt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertBlock = db.prepare(`
  INSERT INTO blocks (article_id, seq, type, text, src, caption)
  VALUES (?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN');
try {
  articles.forEach((a, index) => {
    insertArticle.run(
      a.id, index, a.vol, a.date, a.category, a.photo, a.face,
      a.title, a.subtitle, a.company, a.role, a.name, a.excerpt || ''
    );

    (a.blocks || []).forEach((b, seq) => {
      insertBlock.run(a.id, seq, b.t, b.x ?? null, b.src ?? null, b.caption ?? null);
    });

    // Auto-tagging: industry tag(s) from category, plus person and company tags.
    const industryId = splitCategory(a.category).map(label => upsertTag(db, 'industry', label));
    industryId.forEach(tagId => linkTag(db, a.id, tagId));

    const personId = upsertTag(db, 'person', a.name);
    linkTag(db, a.id, personId);

    const companyId = upsertTag(db, 'company', a.company);
    linkTag(db, a.id, companyId);
  });
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

const counts = {
  articles: db.prepare('SELECT COUNT(*) AS n FROM articles').get().n,
  blocks: db.prepare('SELECT COUNT(*) AS n FROM blocks').get().n,
  tags: db.prepare('SELECT COUNT(*) AS n FROM tags').get().n,
  article_tags: db.prepare('SELECT COUNT(*) AS n FROM article_tags').get().n,
};
console.log('Migrated:', counts);
db.close();
