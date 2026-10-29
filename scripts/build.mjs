// VOICE OF PRESIDENT — 記事ページの書き出し
// articles-data.js（記事データの正）から、記事ごとの静的ページ /interview/{id}/ と
// 連載一覧・検索・サイトマップ・robots.txt を作る。Vercel のビルドで毎回走る（vercel.json）。
// 手元で確かめる時：node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/site.config.json'), 'utf8'));
const net = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/network.json'), 'utf8'));
const SITE = (process.env.SITE_URL || cfg.siteUrl).replace(/\/$/, '');
const AN = cfg.analytics || {};
// GA4 は本番（Vercel の production）だけで出す。手元で確かめる時は GA4_FORCE=1
const GA4 = (process.env.VERCEL_ENV === 'production' || process.env.GA4_FORCE === '1') ? String(process.env.GA4_ID || AN.ga4MeasurementId || '').trim() : '';
const MEDIA = AN.mediaId || 'vop';
if (GA4 && !/^G-[A-Z0-9]{4,}$/.test(GA4)) throw new Error(`GA4 の測定ID の形が違います：${GA4}`);
// GA4 のタグ。測定ID が空なら何も出さない。記事のイベントは /assets/article.js が送る
const gaTag = (articleId = '') => GA4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4}"></script>
<script data-article="${articleId}">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4}',{allow_google_signals:false,allow_ad_personalization_signals:false,media_id:'${MEDIA}',article_id:(document.currentScript&&document.currentScript.dataset.article)||''});</script>
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
// 見出し画像（scripts/make-og.mjs で作った images/og/{id}.jpg）があれば SNS の表示画像に使う
const ogv = f => { const p = path.join(ROOT, f); return fs.existsSync(p) ? abs(f) + '?v=' + crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8) : null; };
const og = a => {
  if (!okFor(a)) return null;
  const wide = ogv(`images/og/${a.id}.jpg`); if (!wide) return null;
  return { wide, imgs: [ogv(`images/og/${a.id}-675.jpg`), ogv(`images/og/${a.id}-4x3.jpg`), ogv(`images/og/${a.id}-1x1.jpg`)].filter(Boolean) };
};
// 強調引用（scripts/og-quotes.json の pull）。本文に無い言葉なら書き出しを止める
const QJ = fs.existsSync(path.join(ROOT, 'scripts/og-quotes.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/og-quotes.json'), 'utf8')) : {};
// 本番では、本人の了承（approved に日付）がある記事だけ見出し画像と強調引用を出す。プレビュー・手元では全部出す
// 了承前の物を出してよいのは、Vercel のプレビューと手元（CI でない）だけ。分からない時は出さない側に倒す
const E = process.env;
const DRAFT_OK = E.VERCEL_ENV === 'preview' || (!E.VERCEL && !E.NETLIFY && !E.CI);
const okFor = a => DRAFT_OK || Boolean((QJ.approved || {})[a.id]);
const ogAltOf = a => { const q = (QJ.quotes || {})[a.id]; return q ? `${cfg.siteName}｜${a.name}さん「${q.replace(/\|/g, '').replace(/。$/, '')}」` : `${a.name}さんの写真`; };
const pullOf = a => {
  const q = okFor(a) && (QJ.pull || {})[a.id]; if (!q) return '';
  if (!(a.blocks || []).some(b => (b.x || '').includes(q))) throw new Error(`強調引用が本文にありません（${a.id}）：${q}`);
  return `<aside class="pull" aria-label="${esc(a.name)}さんの言葉"><p>${esc(q.replace(/。$/, ''))}</p><span>${esc(a.name)}</span></aside>`;
};
// 中ほど（本文の45%あたり）の見出しの前に差す
const withPull = a => {
  const bl = (a.blocks || []).map(block), pq = pullOf(a);
  if (!pq) return bl;
  const B = a.blocks || [];
  const hs = B.map((b, i) => b.t === 'h' ? i : -1).filter(i => i > 0 && B[i - 1].t !== 'q');
  if (!hs.length) return bl;
  const at = hs.reduce((m, i) => Math.abs(i - bl.length * 0.45) < Math.abs(m - bl.length * 0.45) ? i : m, hs[0]);
  bl.splice(at, 0, pq); return bl;
};
const sisters = a => net.articles.filter(n => n.name === norm(a.name));

const head = ({ title, desc, canonical, image, ogSize = false, ogAlt = '', type = 'website', jsonld = [], articleId = '' }) => `<!DOCTYPE html>
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
<meta name="robots" content="max-image-preview:large">
${image ? `<meta property="og:image" content="${esc(image)}">${ogSize ? `\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${esc(ogAlt)}">` : ''}\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta property="og:locale" content="ja_JP">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Cormorant+Garamond:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Cormorant+Garamond:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap"></noscript>
<link rel="stylesheet" href="/assets/article.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
${gaTag(articleId)}</head>
<body data-media="${MEDIA}"${articleId ? ` data-article="${esc(articleId)}"` : ''}>
<a class="skip" href="#main">本文へ</a>
<header class="hd">
  <a class="hd-logo" href="/">VOICE OF PRESIDENT</a><span class="hd-tag">${esc(cfg.tagline)}</span>
  <nav class="hd-nav"><a href="/archive.html">連載一覧</a><a href="/search.html">記事を探す</a></nav>
</header>`;

const foot = `<footer class="ft">
  <a class="ft-logo" href="/">VOICE OF PRESIDENT</a>
  <a href="/privacy.html">プライバシーと外部送信</a>
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
  const o = og(a);
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: clip(plainTitle(a.title) + '｜' + a.name, 110), description: desc, image: o ? o.imgs : [abs(a.photo)], datePublished: `${date}T09:00:00+09:00`, dateModified: `${date}T09:00:00+09:00`, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: cfg.publisher, url: SITE + '/' }, publisher: { '@type': 'Organization', name: cfg.siteName, url: SITE + '/' }, about: { '@type': 'Person', name: a.name, jobTitle: a.role, worksFor: { '@type': 'Organization', name: a.company, ...(c && c.url ? { url: c.url } : {}) } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: cfg.siteName, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: '連載一覧', item: SITE + '/archive.html' }, { '@type': 'ListItem', position: 3, name: `${a.name}さん` }] }
  ];
  const rows = c ? [['所在地', c.address], ['連絡先', c.tel], ['代表者', c.rep], ['設立', c.established], ['事業内容', c.business], ['許可番号', c.license]].filter(([, v]) => v) : [];

  return head({ title, desc, canonical, image: o ? o.wide : abs(a.photo), ogSize: !!o, ogAlt: ogAltOf(a), type: 'article', jsonld, articleId: a.id }) + `
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
    ${withPull(a).join('\n    ')}
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

  ${sis.length ? `<section class="sis"><h2 class="sec-h"><span class="eyebrow">ANOTHER ANGLE</span>${esc(a.name)}さんの別の切り口の記事</h2><ul>${sis.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-dest="${esc(s.media_id || s.site)}"><span>${esc(s.site)}｜${esc(s.angle)}</span>${esc(s.title)}</a></li>`).join('')}</ul></section>` : ''}

  <section class="net"><h2 class="sec-h"><span class="eyebrow">SISTER MEDIA</span>姉妹メディア</h2><ul>${net.sites.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-dest="${esc(s.media_id || s.name)}"><strong>${esc(s.name)}</strong><span>${esc(s.desc)}</span></a></li>`).join('')}</ul></section>

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

// 外部送信の公表（電気通信事業法の外部送信規律）。GA4 は測定ID がある時だけ載せる
function privacyPage() {
  const rows = [
    ['Google Fonts（Google LLC）', '文字の表示のため、閲覧した端末の IP アドレス・ブラウザの種類などが送られます。', '文字を表示するため', 'https://policies.google.com/privacy?hl=ja'],
    ['Vercel Web Analytics（Vercel Inc.）', '見たページ・参照元・端末やブラウザの種類・国など（個人を特定しない形で集計）。', 'サイトの利用状況を知り、改善するため', 'https://vercel.com/legal/privacy-policy'],
    ...(GA4 ? [['Google アナリティクス（Google LLC）', '見たページ・参照元・滞在時間・記事の読了や関連記事・広告枠・シェアのクリック・端末やブラウザの種類・おおよその地域・Cookie の識別子など。姉妹メディア（NEXT PRESIDENTS・Medical Voices・ATHLETE BRIDGE）と同じ1つの計測で集計します。', 'サイトの利用状況を知り、記事と導線を改善するため', 'https://policies.google.com/technologies/partner-sites?hl=ja']] : [])
  ];
  return head({ title: `プライバシーと外部送信 ― ${cfg.siteName}`, desc: `${cfg.siteName}で利用者の情報を外部に送る仕組みについて。`, canonical: SITE + '/privacy.html' }) + `
<main id="main" class="list pv">
  <h1 class="list-h"><span class="eyebrow">PRIVACY</span>プライバシーと外部送信</h1>
  <div class="body">
  <p>${esc(cfg.siteName)}では、サイトの表示と改善のために、次のサービスに閲覧の情報を送っています。氏名やメールアドレスなど、個人を直接特定する情報は送りません。</p>
  ${rows.map(([n, i, w, u]) => `<h2 class="h">${esc(n)}</h2><p>送る情報：${esc(i)}</p><p>目的：${esc(w)}</p><p>送り先の方針：<a href="${u}" target="_blank" rel="noopener">${esc(u)}</a></p>`).join('\n  ')}
  ${GA4 ? `<p>Google アナリティクスへの送信を止めたい時は、<a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener">Google アナリティクス オプトアウト アドオン</a>を使うか、ブラウザで Cookie を無効にしてください。</p>` : ''}
  ${GA4 ? `<p>Google アナリティクスは、Google の広告向けの機能（Google シグナル・広告のパーソナライズ）を使わない設定にしています。</p>` : ''}
  <p>運営：${esc(cfg.operator || cfg.publisher)}</p>
  </div>
</main>
` + foot;
}

function write(rel, html) { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }

// トップ（手書きの index.html）にも同じタグを差す。印の間を毎回作り直すので、ID が空なら印ごと消えて元の形に戻る
{
  const f = path.join(ROOT, 'index.html');
  const html = fs.readFileSync(f, 'utf8').replace(/\n?<!-- vop-ga4 -->[\s\S]*?<!-- \/vop-ga4 -->/, '');
  fs.writeFileSync(f, GA4 ? html.replace('</head>', `<!-- vop-ga4 -->\n${gaTag()}<!-- /vop-ga4 -->\n</head>`) : html);
}
// 了承前の見出し画像は、本番の配信物から消す（URL を直接打っても開けないように）
if (fs.existsSync(path.join(ROOT, 'images/og'))) for (const f of fs.readdirSync(path.join(ROOT, 'images/og'))) {
  const id = f.replace(/(-675|-4x3|-1x1)?\.jpg$/, '');
  if (!okFor({ id })) fs.rmSync(path.join(ROOT, 'images/og', f));
}
fs.rmSync(path.join(ROOT, 'interview'), { recursive: true, force: true });
list.forEach((a, i) => write(`interview/${a.id}/index.html`, articlePage(a, i)));
write('archive.html', archivePage());
write('search.html', searchPage());
write('privacy.html', privacyPage());
const urls = [['/', iso(list[0].date)], ['/archive.html', iso(list[0].date)], ...list.map(a => [url(a), iso(a.date)])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${SITE}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`書き出し完了：記事 ${list.length} 本、連載一覧・検索・sitemap.xml・robots.txt（${SITE}）`);
