// Generates the static site from SQLite (data/voice-of-president.db):
//   - articles/<id>.html   one static page per article (clean URL via vercel.json cleanUrls)
//   - archive.html         the full, tag-filterable article listing
//   - articles-data.js     regenerated for backward compatibility with any legacy consumer
//
// Usage: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openDb } from './lib.mjs';
import { renderArticlePage } from './render-article.mjs';
import { renderArchivePage } from './render-archive.mjs';

const db = openDb();

const articleRows = db.prepare('SELECT * FROM articles ORDER BY sort_order ASC').all();
const blockRows = db.prepare('SELECT * FROM blocks ORDER BY article_id, seq ASC').all();
const tagRows = db.prepare(`
  SELECT at.article_id, t.type, t.label
  FROM article_tags at JOIN tags t ON t.id = at.tag_id
  ORDER BY at.article_id
`).all();

const blocksByArticle = new Map();
for (const b of blockRows) {
  if (!blocksByArticle.has(b.article_id)) blocksByArticle.set(b.article_id, []);
  blocksByArticle.get(b.article_id).push({ type: b.type, text: b.text, src: b.src, caption: b.caption });
}

const tagsByArticle = new Map();
for (const t of tagRows) {
  if (!tagsByArticle.has(t.article_id)) tagsByArticle.set(t.article_id, { industry: [], person: [], company: [] });
  tagsByArticle.get(t.article_id)[t.type].push(t.label);
}

const articles = articleRows.map(row => ({
  ...row,
  blocks: blocksByArticle.get(row.id) || [],
  industries: (tagsByArticle.get(row.id) || { industry: [] }).industry,
}));

// NEXT INTERVIEW wraps forward through sort_order (0 = newest ... N-1 = oldest ... back to 0).
articles.forEach((a, i) => { a.next = articles[(i + 1) % articles.length]; });

// --- articles/<id>.html ---------------------------------------------------
const articlesDir = path.join(ROOT, 'articles');
if (fs.existsSync(articlesDir)) fs.rmSync(articlesDir, { recursive: true });
fs.mkdirSync(articlesDir, { recursive: true });
for (const a of articles) {
  fs.writeFileSync(path.join(articlesDir, `${a.id}.html`), renderArticlePage(a), 'utf8');
}
console.log(`Wrote ${articles.length} article pages to articles/`);

// --- archive.html -----------------------------------------------------------
const industryCounts = new Map();
for (const a of articles) {
  for (const label of a.industries) {
    industryCounts.set(label, (industryCounts.get(label) || 0) + 1);
  }
}
const industryTags = Array.from(industryCounts, ([label, count]) => ({ label, count }))
  .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'));

fs.writeFileSync(path.join(ROOT, 'archive.html'), renderArchivePage(articles, industryTags), 'utf8');
console.log(`Wrote archive.html (${articles.length} articles, ${industryTags.length} industry tags)`);

// --- articles-data.js (legacy export, kept in sync for compatibility) ------
function jsString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}
const legacyLines = [];
legacyLines.push('// Voice of President — 記事データ(SQLiteから自動生成 / node scripts/build.mjs)');
legacyLines.push('window.VOP_ARTICLES = [');
for (const a of articles) {
  legacyLines.push('  {');
  legacyLines.push(`    id: ${jsString(a.id)}, vol: ${jsString(a.vol)}, date: ${jsString(a.date)}, category: ${jsString(a.category)},`);
  legacyLines.push(`    photo: ${jsString(a.photo)}, face: ${jsString(a.face)},`);
  legacyLines.push(`    title: ${jsString(a.title)},`);
  legacyLines.push(`    subtitle: ${jsString(a.subtitle)},`);
  legacyLines.push(`    company: ${jsString(a.company)}, role: ${jsString(a.role)}, name: ${jsString(a.name)},`);
  legacyLines.push(`    excerpt: ${jsString(a.excerpt)},`);
  legacyLines.push('    blocks: [');
  for (const b of a.blocks) {
    const parts = [`t: ${jsString(b.type)}`];
    if (b.text != null) parts.push(`x: ${jsString(b.text)}`);
    if (b.src != null) parts.push(`src: ${jsString(b.src)}`);
    if (b.caption != null) parts.push(`caption: ${jsString(b.caption)}`);
    legacyLines.push(`      { ${parts.join(', ')} },`);
  }
  legacyLines.push('    ]');
  legacyLines.push('  },');
}
legacyLines.push('];');
fs.writeFileSync(path.join(ROOT, 'articles-data.js'), legacyLines.join('\n') + '\n', 'utf8');
console.log('Refreshed articles-data.js');

db.close();
