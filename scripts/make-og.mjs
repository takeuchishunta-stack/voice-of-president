// 見出し画像（1200×630 と Discover 用 1200×675）を作る。手元で1回走らせて images/og/ に書き出し、コミットする
// 使い方：npm i -D playwright（または全体に入っている playwright）→ node scripts/make-og.mjs [記事id ...]
// 言葉の中の「|」は改行の位置（言葉そのものは変えない）。文末の「。」は」の前なので表示しない（組版の決まり）
// 型：左60%に本人の言葉（本文にある言葉そのまま）・右に扉写真。顔に文字を重ねない・飾りなし
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'articles-data.js'), 'utf8'), ctx);
const list = ctx.window.VOP_ARTICLES;
const { quotes } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/og-quotes.json'), 'utf8'));
const only = process.argv.slice(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const OUT = path.join(ROOT, 'images/og');
fs.mkdirSync(OUT, { recursive: true });

const page = (a, q, h, pos) => `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600&family=Cormorant+Garamond:wght@500&family=Zen+Kaku+Gothic+New:wght@500&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:${h}px;display:flex;background:#F7F4EF;color:#1B1614;overflow:hidden}
.tx{width:720px;height:100%;padding:${h > 640 ? 76 : 64}px 64px 56px 72px;display:flex;flex-direction:column}
.logo{font:500 20px 'Cormorant Garamond',serif;letter-spacing:.3em;color:#8E1D22}
.q{flex:1;display:flex;align-items:center;word-break:keep-all;font:600 ${q.replace(/\|/g, '').length > 26 ? 46 : 50}px/1.6 'Shippori Mincho',serif;letter-spacing:.04em;font-feature-settings:"palt";text-indent:-.5em;padding-left:.5em}
.who{border-top:1px solid rgba(27,22,20,.18);padding-top:20px;font:500 22px/1.5 'Zen Kaku Gothic New',sans-serif;color:rgba(27,22,20,.72)}
.who b{display:block;font:600 30px/1.4 'Shippori Mincho',serif;color:#1B1614;letter-spacing:.08em}
.ph{width:480px;height:100%;background:url('data:image/jpeg;base64,${fs.readFileSync(path.join(ROOT, a.photo)).toString('base64')}') ${pos} / cover no-repeat}
</style></head><body><div class="tx"><div class="logo">VOICE OF PRESIDENT</div>
<p class="q"><span>「${q.replace(/。$/, '').split('|').map(esc).join('<br>')}」</span></p>
<p class="who"><b>${esc(a.name)}</b>${esc(a.company)}　${esc(a.role)}</p></div><div class="ph"></div></body></html>`;

const b = await chromium.launch();
for (const [id, q] of Object.entries(quotes)) {
  if (only.length && !only.includes(id)) continue;
  const a = list.find(x => x.id === id);
  if (!a) throw new Error(`記事が見つかりません：${id}`);
  const body = (a.blocks || []).map(x => x.x || '').join('\n');
  if (!body.includes(q.replace(/\|/g, ''))) throw new Error(`本文に無い言葉です（${id}）：${q}`);
  const pos = a.ogPosition || 'center 30%';
  for (const [h, suf] of [[630, ''], [675, '-675']]) {
    const p = await b.newPage({ viewport: { width: 1200, height: h } });
    await p.setContent(page(a, q, h, pos), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `${id}${suf}.jpg`), type: 'jpeg', quality: 86 });
    await p.close();
  }
  // 検索結果・Discover 用の写真だけの画像（4:3 と 1:1。文字なし）
  for (const [h, suf] of [[900, '-4x3'], [1200, '-1x1']]) {
    const p = await b.newPage({ viewport: { width: 1200, height: h } });
    await p.setContent(`<body style="margin:0;width:1200px;height:${h}px;background:url('data:image/jpeg;base64,${fs.readFileSync(path.join(ROOT, a.photo)).toString('base64')}') ${pos} / cover no-repeat"></body>`);
    await p.screenshot({ path: path.join(OUT, `${id}${suf}.jpg`), type: 'jpeg', quality: 86 });
    await p.close();
  }
  console.log('作成：', id);
}
await b.close();
