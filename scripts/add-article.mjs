// Inserts a new article (with its body blocks and tags) into the SQLite DB
// as the newest entry (sort_order 0), shifting all existing articles back by one.
// This is the standard way to add an article going forward: write a data
// module like scripts/articles/<id>.mjs, then run:
//   node scripts/add-article.mjs scripts/articles/<id>.mjs
//   node scripts/build.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openDb, upsertTag, linkTag, splitCategory } from './lib.mjs';

const modulePath = process.argv[2];
if (!modulePath) {
  console.error('Usage: node scripts/add-article.mjs <path-to-article-module>');
  process.exit(1);
}
const { default: a } = await import(pathToFileURL(path.resolve(modulePath)).href);

const db = openDb();

const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(a.id);
if (existing) {
  console.error(`Article id "${a.id}" already exists.`);
  process.exit(1);
}

db.exec('BEGIN');
try {
  // Two-step shift avoids transiently colliding with the UNIQUE constraint.
  db.prepare('UPDATE articles SET sort_order = -(sort_order + 1)').run();
  db.prepare('UPDATE articles SET sort_order = -sort_order').run();
  db.prepare(`
    INSERT INTO articles (id, sort_order, vol, date, category, photo, face, title, subtitle, company, role, name, excerpt)
    VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(a.id, a.vol, a.date, a.category, a.photo, a.face, a.title, a.subtitle, a.company, a.role, a.name, a.excerpt);

  a.blocks.forEach((b, i) => {
    db.prepare('INSERT INTO blocks (article_id, seq, type, text, src, caption) VALUES (?, ?, ?, ?, ?, ?)')
      .run(a.id, i, b.type, b.text ?? null, b.src ?? null, b.caption ?? null);
  });

  for (const label of splitCategory(a.category)) {
    linkTag(db, a.id, upsertTag(db, 'industry', label));
  }
  linkTag(db, a.id, upsertTag(db, 'person', a.name));
  linkTag(db, a.id, upsertTag(db, 'company', a.company));

  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log(`Inserted article "${a.id}" (VOL.${a.vol}) as the newest entry.`);
db.close();
