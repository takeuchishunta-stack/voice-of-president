// VOICE OF PRESIDENT — 記事ページの書き出し
// articles-data.js（記事データの正）から、記事ごとの静的ページ /interview/{id}/ と
// 連載一覧・検索・サイトマップ・robots.txt を作る。Vercel のビルドで毎回走る（vercel.json）。
// 手元で確かめる時：node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/site.config.json'), 'utf8'));
const net = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/network.json'), 'utf8'));
const SITE = (process.env.SITE_URL || cfg.siteUrl).replace(/\/$/, '');
const AN = cfg.analytics || {};
const GA4 = String(process.env.GA4_ID || AN.ga4MeasurementId || '').trim();
const MEDIA = AN.mediaId || 'vop';
if (GA4 && !/^G-[A-Z0-9]{4,}$/.test(GA4)) throw new Error(`GA4 の測定ID の形が違います：${GA4}`);
// GA4 のタグ。測定ID が空なら何も出さない。記事のイベントは /assets/article.js が送る
const gaTag = () => GA4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4}',{media_id:'${MEDIA}'});</script>
` : '';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'articles-data.js'), 'utf8'), ctx);
const list = ctx.window.VOP_ARTICLES || [];
if (!list.length) throw new Error('articles-data.js から記事が読めませんでした');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s || '').replace(/[\s　]/g, '');
const iso = d => { const m = String(d).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : ''; };
const abs = p => /^https?:/.test(p) ? p : `${SITE}/${String(p).replace(/^\//, '')}`;
const url = a => `/interview/${a.id}/`;
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const plainTitle = t => String(t).replace(/^「|」$/g, '').replace(/\s+/g, '');

// 関連記事：業種と副題の2文字の重なりで近い記事を選ぶ（同点は新しい順）
const grams = s => { s = norm(s); const g = new Set(); for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2)); return g; };
const sim = (a, b) => { const x = grams(a.category + a.subtitle), y = grams(b.category + b.subtitle); let n = 0; x.forEach(v => y.has(v) && n++); return n / Math.max(1, Math.min(x.size, y.size)); };
const related = a => list.filter(b => b.id !== a.id).map(b => ({ b, s: sim(a, b) })).sort((p, q) => q.s - p.s || iso(q.b.date).localeCompare(iso(p.b.date))).slice(0, 3).map(x => x.b);
const sisters = a => net.articles.filter(n => n.name === norm(a.name));

const head = ({ title, desc, canonical, image, type = 'website', jsonld = [], articleId = '' }) => `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(image)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta property="og:locale" content="ja_JP">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Cormorant+Garamond:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Cormorant+Garamond:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap"></noscript>
<link rel="stylesheet" href="/assets/article.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
${gaTag()}</head>
<body data-media="${MEDIA}"${articleId ? ` data-article="${esc(articleId)}"` : ''}>
<a class="skip" href="#main">本文へ</a>
<header class="hd">
  <a class="hd-logo" href="/">VOICE OF PRESIDENT</a><span class="hd-tag">${esc(cfg.tagline)}</span>
  <nav class="hd-nav"><a href="/archive.html">連載一覧</a><a href="/search.html">記事を探す</a></nav>
</header>`;

const foot = `<footer class="ft">
  <a class="ft-logo" href="/">VOICE OF PRESIDENT</a>
  <span>© ${new Date().getFullYear()} ${esc(cfg.publisher)}</span>
</footer>
<script src="/assets/article.js" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;

function block(b) {
  switch (b.t) {
    case 'lead': return `<p class="lead">${esc(b.x)}</p>`;
    case 'h': return `<h2 class="h">${esc(b.x)}</h2>`;
    case 'q': return `<blockquote class="q"><p>「${esc(b.x)}」</p></blockquote>`;
    case 'img': return `<figure class="fig"><img src="/${esc(b.src)}" alt="${esc(b.caption || '')}" loading="lazy" decoding="async">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    case 'prof': return '';
    default: return `<p>${esc(b.x)}</p>`;
  }
}

function card(b, label) {
  return `<a class="card" href="${url(b)}">
    <span class="card-img"><img src="/${esc(b.face || b.photo)}" alt="" loading="lazy" decoding="async"></span>
    <span class="card-tx"><span class="card-meta">${label || `VOL.${esc(b.vol)}　${esc(b.category)}`}</span><span class="card-ttl">${esc(b.title)}</span><span class="card-who">${esc(b.company)} ／ ${esc(b.name)}</span></span>
  </a>`;
}

function prBox() {
  const p = cfg.pr;
  if (!p || !p.enabled || !p.href) return '';
  return `<aside class="pr" aria-label="広告">
    <div class="pr-lbl"><span>PR</span>広告主：${esc(p.advertiser)}</div>
    <a class="pr-box" href="${esc(p.href)}" rel="sponsored noopener" target="_blank" data-pr data-banner="${esc(p.bannerId || 'localboost-gbp-report')}">
      <span class="pr-eye">${esc(p.eyebrow)}</span><strong>${esc(p.title)}</strong><span class="pr-tx">${esc(p.text)}</span><span class="pr-cta">${esc(p.cta)} →</span>
    </a>
  </aside>`;
}

function articlePage(a, i) {
  const canonical = SITE + url(a);
  const prof = (a.blocks || []).find(b => b.t === 'prof');
  const desc = clip(a.excerpt || a.subtitle, 118);
  const title = `${plainTitle(a.title)}｜${a.name}（${a.company}）― ${cfg.siteName}`;
  const date = iso(a.date);
  const next = list[(i + 1) % list.length];
  const rel = related(a).filter(b => b.id !== next.id).slice(0, 3);
  const sis = sisters(a);
  const c = a.companyInfo;
  const share = encodeURIComponent(canonical), shareT = encodeURIComponent(`${plainTitle(a.title)}｜${a.name}さん（${a.company}）`);
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: clip(plainTitle(a.title) + '｜' + a.name, 110), description: desc, image: [abs(a.photo)], datePublished: `${date}T09:00:00+09:00`, dateModified: `${date}T09:00:00+09:00`, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: cfg.publisher, url: SITE + '/' }, publisher: { '@type': 'Organization', name: cfg.siteName, url: SITE + '/' }, about: { '@type': 'Person', name: a.name, jobTitle: a.role, worksFor: { '@type': 'Organization', name: a.company, ...(c && c.url ? { url: c.url } : {}) } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: cfg.siteName, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: '連載一覧', item: SITE + '/archive.html' }, { '@type': 'ListItem', position: 3, name: `${a.name}さん` }] }
  ];
  const rows = c ? [['所在地', c.address], ['連絡先', c.tel], ['代表者', c.rep], ['設立', c.established], ['事業内容', c.business], ['許可番号', c.license]].filter(([, v]) => v) : [];

  return head({ title, desc, canonical, image: abs(a.photo), type: 'article', jsonld, articleId: a.id }) + `
<main id="main">
  <nav class="crumb" aria-label="パンくず"><a href="/">トップ</a><span>›</span><a href="/archive.html">連載一覧</a><span>›</span><span>${esc(a.name)}さん</span></nav>
  <section class="hero">
    <div class="hero-tx">
      <span class="hero-vol" aria-hidden="true">VOL<br>${esc(a.vol)}</span>
      <p class="hero-meta"><span>VOL.${esc(a.vol)}</span><i></i><span>${esc(a.category)}</span></p>
      <h1>${esc(a.title)}</h1>
      <p class="hero-sub">${esc(a.subtitle)}</p>
      <p class="hero-who"><i></i>${esc(a.company)}　${esc(a.role)} ／ ${esc(a.name)}</p>
      <p class="hero-date"><time datetime="${date}">${esc(a.date)}</time>　取材・文 ${esc(cfg.publisher)}</p>
    </div>
    <div class="hero-ph"><img src="/${esc(a.photo)}" alt="${esc(a.name)}さん" fetchpriority="high" decoding="async"></div>
  </section>

  <article class="body">
    ${(a.blocks || []).map(block).join('\n    ')}
    <span class="body-end" data-body-end aria-hidden="true"></span>
    ${prof ? `<section class="prof" aria-label="プロフィール"><img src="/${esc(a.face || a.photo)}" alt="" loading="lazy"><div><span class="eyebrow">PROFILE</span><strong>${esc(a.name)}<small>${esc(a.company)}　${esc(a.role)}</small></strong><p>${esc(prof.x)}</p></div></section>` : ''}
    ${c ? `<section class="co" aria-label="会社情報"><p><span class="eyebrow">COMPANY</span><strong>${esc(c.name)}</strong></p><dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a>` : ''}</section>` : ''}

    <section class="share" aria-label="この記事をシェア">
      <span class="eyebrow">SHARE</span>
      <a href="https://twitter.com/intent/tweet?url=${share}&amp;text=${shareT}" target="_blank" rel="noopener">X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${share}" target="_blank" rel="noopener">Facebook</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${share}" target="_blank" rel="noopener">LINE</a>
      <button type="button" data-copy="${esc(canonical)}">URLをコピー</button>
    </section>
  </article>

  <section class="next">
    <a href="${url(next)}"><span class="eyebrow">NEXT INTERVIEW ／ VOL.${esc(next.vol)}</span><strong>${esc(next.title)}</strong><span>${esc(next.company)} ／ ${esc(next.name)}</span></a>
    <span class="next-ph"><img src="/${esc(next.photo)}" alt="" loading="lazy"></span>
  </section>

  ${rel.length ? `<section class="rel"><h2 class="sec-h"><span class="eyebrow">RELATED</span>あわせて読みたい</h2><div class="cards">${rel.map(b => card(b)).join('')}</div></section>` : ''}

  ${prBox()}

  ${sis.length ? `<section class="sis"><h2 class="sec-h"><span class="eyebrow">ANOTHER ANGLE</span>${esc(a.name)}さんの別の切り口の記事</h2><ul>${sis.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-dest="${esc(s.site)}"><span>${esc(s.site)}｜${esc(s.angle)}</span>${esc(s.title)}</a></li>`).join('')}</ul></section>` : ''}

  <section class="net"><h2 class="sec-h"><span class="eyebrow">SISTER MEDIA</span>姉妹メディア</h2><ul>${net.sites.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-dest="${esc(s.site || s.name)}"><strong>${esc(s.name)}</strong><span>${esc(s.desc)}</span></a></li>`).join('')}</ul></section>

  <p class="back"><a class="btn" href="/archive.html">連載一覧へ</a><a href="/">トップページ</a></p>
</main>
` + foot;
}

function archivePage() {
  const cats = [...new Set(list.map(a => a.category))];
  const canonical = SITE + '/archive.html';
  return head({ title: `連載一覧（全${list.length}本）― ${cfg.siteName}`, desc: `${cfg.siteName}の経営者インタビュー全${list.length}本。業種から探せます。`, canonical, image: abs(list[0].photo), jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: '連載一覧', url: canonical, hasPart: list.map(a => ({ '@type': 'Article', headline: plainTitle(a.title), url: SITE + url(a) })) }] }) + `
<main id="main" class="list">
  <h1 class="list-h"><span class="eyebrow">SERIES</span>連載一覧<small>全${list.length}本</small></h1>
  <div class="cards cards-all">${list.map(a => card(a)).join('')}</div>
  <p class="list-cat">業種：${cats.map(c => esc(c)).join('　／　')}</p>
</main>
` + foot;
}

function searchPage() {
  const idx = list.map(a => ({ u: url(a), t: a.title, n: a.name, c: a.company, g: a.category, v: a.vol, f: '/' + (a.face || a.photo), x: [a.subtitle, a.excerpt, ...(a.blocks || []).map(b => b.x || '')].join(' ') }));
  return head({ title: `記事を探す ― ${cfg.siteName}`, desc: `${cfg.siteName}の記事を、経営者名・会社名・業種・言葉で探せます。`, canonical: SITE + '/search.html' }) + `
<main id="main" class="list">
  <h1 class="list-h"><span class="eyebrow">SEARCH</span>記事を探す</h1>
  <form class="sform" role="search" onsubmit="return false"><input id="q" name="q" type="search" placeholder="例：採用、事業承継、秩父、マジシャン" aria-label="キーワード"></form>
  <p id="sres" class="sres" aria-live="polite"></p>
  <div id="slist" class="cards cards-all"></div>
</main>
<script>window.VOP_INDEX=${JSON.stringify(idx).replace(/</g, '\\u003c')};</script>
` + foot;
}

function write(rel, html) { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }

// トップ（手書きの index.html）にも同じタグを差す。印の間を毎回作り直すので、ID が空なら印ごと消えて元の形に戻る
{
  const f = path.join(ROOT, 'index.html');
  const html = fs.readFileSync(f, 'utf8').replace(/\n?<!-- vop-ga4 -->[\s\S]*?<!-- \/vop-ga4 -->/, '');
  fs.writeFileSync(f, GA4 ? html.replace('</head>', `<!-- vop-ga4 -->\n${gaTag()}<!-- /vop-ga4 -->\n</head>`) : html);
}
fs.rmSync(path.join(ROOT, 'interview'), { recursive: true, force: true });
list.forEach((a, i) => write(`interview/${a.id}/index.html`, articlePage(a, i)));
write('archive.html', archivePage());
write('search.html', searchPage());
const urls = [['/', iso(list[0].date)], ['/archive.html', iso(list[0].date)], ...list.map(a => [url(a), iso(a.date)])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${SITE}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`書き出し完了：記事 ${list.length} 本、連載一覧・検索・sitemap.xml・robots.txt（${SITE}）`);
