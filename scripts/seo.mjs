// 検索向けの部品（Furutori 追加・11/27）。竹内さんの記事ページの見た目は変えず、
// <head> の情報（canonical・OGP・構造化データ・GA4）と、本文の後ろの回遊（シェア・関連記事・姉妹メディア）を足す。
// 本文・写真・肩書きには触らない。設定は scripts/site.config.json、姉妹メディアは scripts/network.json。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, esc } from './lib.mjs';

export const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'site.config.json'), 'utf8'));
const NET = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'network.json'), 'utf8'));
const SITE = CFG.siteUrl.replace(/\/$/, '');
const GA4 = (process.env.GA4_ID || CFG.analytics.ga4MeasurementId || '').trim();
const PENDING = new Set(CFG.canonicalPending.ids);

export const articleUrl = a => `${SITE}/articles/${a.id}`;
export const absUrl = p => /^https?:/.test(p) ? p : `${SITE}/${String(p).replace(/^\//, '')}`;
const isoDate = d => String(d).replace(/\./g, '-') + 'T09:00:00+09:00';
const jsonLd = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const normName = s => String(s).replace(/[\s　]/g, '');

export const hasCanonical = a => !PENDING.has(a.id);

// GA4：測定ID が空なら何も出さない。ID があっても本番のドメインで開いた時だけ読み込む（プレビューでは数えない）
export function ga4Tag() {
  if (!GA4) return '';
  const host = new URL(SITE).hostname;
  return `<script>
(function(){if(location.hostname!==${JSON.stringify(host)})return;var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id=${esc(GA4)}';document.head.appendChild(s);
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());
gtag('config',${JSON.stringify(GA4)},{allow_google_signals:false,allow_ad_personalization_signals:false,media_id:${JSON.stringify(CFG.analytics.mediaId)}});})();
</script>`;
}

// 一覧・トップ用の <head> 部品
export function pageHead({ url, title, description, image }) {
  return `<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(CFG.siteName)}">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
${ga4Tag()}`;
}

// 記事ページの <head> 部品
export function articleHead(a) {
  const url = articleUrl(a);
  const img = absUrl(a.photo);
  const title = `${a.title}｜${a.name}（${a.company}）`;
  const desc = a.excerpt || a.subtitle;
  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: desc,
    image: [img],
    datePublished: isoDate(a.date),
    author: { '@type': 'Organization', name: CFG.publisher, url: SITE + '/' },
    publisher: { '@type': 'Organization', name: CFG.siteName, url: SITE + '/' },
    mainEntityOfPage: url,
    about: { '@type': 'Person', name: a.name, jobTitle: a.role, worksFor: { '@type': 'Organization', name: a.company } },
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: CFG.siteName, item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: '連載一覧', item: SITE + '/archive' },
      { '@type': 'ListItem', position: 3, name: `${a.name}さん`, item: url },
    ],
  }];
  return `${hasCanonical(a) ? `<link rel="canonical" href="${esc(url)}">\n` : ''}<meta name="robots" content="max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(CFG.siteName)}">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(a.name)}さん（${esc(a.company)}）">
<meta property="article:published_time" content="${esc(isoDate(a.date))}">
<meta name="twitter:card" content="summary_large_image">
${ld.map(jsonLd).join('\n')}
${ga4Tag()}`;
}

// 関連記事：業種のタグが重なる記事を先に、無ければ公開日が近い記事
export function relatedOf(a, all, n = 3) {
  const mine = new Set(a.industries);
  const idx = all.indexOf(a);
  const byId = new Map(all.map(b => [b.id, b]));
  const picked = ((CFG.related || {})[a.id] || []).map(id => byId.get(id)).filter(b => b && b !== a && b.id !== a.next.id);
  return [...picked, ...all.filter(b => b !== a && b.id !== a.next.id && !picked.includes(b))
    .map(b => ({ b, s: b.industries.filter(t => mine.has(t)).length * 100 - Math.abs(all.indexOf(b) - idx) }))
    .sort((x, y) => y.s - x.s).map(x => x.b)].slice(0, n);
}

export function sistersOf(a) {
  const me = normName(a.name);
  return NET.articles.filter(s => normName(s.name) === me);
}

const H = `font-family:'Cormorant Garamond',serif; font-size:12px; letter-spacing:.32em; color:#B08A4A; white-space:nowrap;`;

// 本文の後ろ（NEXT INTERVIEW の前）に入れる回遊の部品。見た目は竹内さんのページの色と書体にそろえる
export function articleAfterBody(a, all) {
  const url = articleUrl(a);
  const shareText = `${a.title}｜${a.name}さん（${a.company}）`;
  const enc = encodeURIComponent;
  const btn = `display:inline-flex; align-items:center; padding:11px 20px; border:1px solid rgba(27,22,20,.2); font-size:12.5px; letter-spacing:.12em; color:#1B1614; background:#FFFFFF; white-space:nowrap; cursor:pointer; font-family:'Zen Kaku Gothic New',sans-serif;`;
  const share = `<div class="vop-share" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <span style="${H} margin-right:8px;">SHARE</span>
          <a href="https://twitter.com/intent/tweet?text=${enc(shareText)}&amp;url=${enc(url)}" target="_blank" rel="noopener" data-via="x" style="${btn}">X</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}" target="_blank" rel="noopener" data-via="facebook" style="${btn}">Facebook</a>
          <a href="https://social-plugins.line.me/lineit/share?url=${enc(url)}" target="_blank" rel="noopener" data-via="line" style="${btn}">LINE</a>
          <button type="button" data-copy="${esc(url)}" style="${btn}">URLをコピー</button>
        </div>`;

  const sis = sistersOf(a);
  const sisHtml = sis.length ? `<div class="vop-sis" style="margin-top:56px; padding:30px 34px; background:#F7F4EF; border-left:3px solid #B08A4A;">
          <span style="${H}">ANOTHER ANGLE</span>
          <p style="margin:12px 0 16px; font-family:'Shippori Mincho',serif; font-size:16px; line-height:1.9; letter-spacing:.04em;">${esc(a.name)}さんのお話は、姉妹メディアでも別の切り口で読めます。</p>
          ${sis.map(s => `<a href="${esc(s.url)}" data-dest="${esc(s.media_id)}" style="display:block; padding:12px 0; border-top:1px solid rgba(27,22,20,.1); color:#1B1614;"><span style="font-size:12px; letter-spacing:.12em; color:#8E1D22;">${esc(s.site)}</span><span style="font-size:12px; color:rgba(27,22,20,.55);">　${esc(s.angle)}</span>${s.title ? `<br><span style="font-family:'Shippori Mincho',serif; font-size:15px; line-height:1.8;">${esc(s.title)}</span>` : ''}</a>`).join('')}
        </div>` : '';

  const rel = relatedOf(a, all);
  const relHtml = `<div class="vop-rel" style="margin-top:64px;">
          <span style="${H}">RELATED INTERVIEWS</span>
          <h2 style="margin:10px 0 26px; font-family:'Shippori Mincho',serif; font-size:22px; font-weight:600; letter-spacing:.06em;">あわせて読みたい</h2>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:22px;">
          ${rel.map(b => `<a href="/articles/${esc(b.id)}" style="display:flex; flex-direction:column; color:#1B1614; border:1px solid rgba(27,22,20,.1); min-width:0;">
            <span style="display:block; height:170px; overflow:hidden;"><img src="/${esc(String(b.photo).replace(/^\//, ''))}" alt="" loading="lazy" style="width:100%; height:100%; object-fit:cover; object-position:50% 15%;"></span>
            <span style="padding:14px 14px 16px; display:flex; flex-direction:column; gap:8px;">
              <span style="font-size:10.5px; letter-spacing:.1em; color:#B08A4A;">VOL.${esc(b.vol)}　${esc(b.industries.join(' / '))}</span>
              <span style="font-family:'Shippori Mincho',serif; font-size:15px; font-weight:600; line-height:1.65;">${esc(b.title)}</span>
              <span style="font-size:11px; color:rgba(27,22,20,.55);">${esc(b.company)} ／ ${esc(b.name)}</span>
            </span>
          </a>`).join('')}
          </div>
        </div>`;

  const nets = NET.sites.map(s => `<a href="${esc(s.url)}" data-dest="${esc(s.media_id)}" style="display:flex; flex-direction:column; gap:6px; padding:18px 20px; border:1px solid rgba(27,22,20,.12); color:#1B1614; min-width:0;"><span style="font-family:'Cormorant Garamond',serif; font-size:15px; letter-spacing:.16em; color:#8E1D22;">${esc(s.name)}</span><span style="font-size:11.5px; line-height:1.7; color:rgba(27,22,20,.6);">${esc(s.desc)}</span></a>`).join('');
  const netHtml = `<div class="vop-net" style="margin-top:64px;">
          <span style="${H}">SISTER MEDIA</span>
          <div style="margin-top:16px; display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">${nets}</div>
        </div>`;

  return `
      <div data-body-end style="display:grid; grid-template-columns:1fr 720px 1fr; padding:8px 0 8px; background:#FFFFFF;">
        <div></div>
        <div style="min-width:0;">
        ${share}
        ${sisHtml}
        ${relHtml}
        ${netHtml}
        </div>
        <div></div>
      </div>`;
}

export function trackScript() {
  return `<script defer src="/assets/vop-track.js"></script>`;
}

export function sitemapXml(articles) {
  const urls = [
    { loc: SITE + '/', lastmod: articles[0] && isoDate(articles[0].date).slice(0, 10) },
    { loc: SITE + '/archive', lastmod: articles[0] && isoDate(articles[0].date).slice(0, 10) },
    ...articles.filter(hasCanonical).map(a => ({ loc: articleUrl(a), lastmod: isoDate(a.date).slice(0, 10) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

export function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
}

export function privacyPage() {
  const op = CFG.operator || CFG.publisher;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>外部送信について ― ${esc(CFG.siteName)}</title>
<meta name="description" content="${esc(CFG.siteName)}が利用者の端末から外部に送る情報と、その目的について。">
<link rel="canonical" href="${SITE}/privacy">
<style>
  body { margin:0; background:#F7F4EF; color:#1B1614; font-family:'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif; line-height:1.9; }
  main { max-width:720px; margin:0 auto; padding:48px 20px 80px; box-sizing:border-box; }
  h1 { font-size:24px; letter-spacing:.06em; } h2 { font-size:17px; margin-top:36px; }
  table { width:100%; border-collapse:collapse; font-size:14px; } th, td { border:1px solid rgba(27,22,20,.18); padding:10px; text-align:left; vertical-align:top; }
  a { color:#8E1D22; }
</style>
</head>
<body>
<main>
<p><a href="/">${esc(CFG.siteName)}</a></p>
<h1>外部送信について</h1>
<p>当サイトでは、記事がどのように読まれているかを知り、サイトをより読みやすくするために、次のサービスを利用しています。これらのサービスにより、利用者の端末から情報が外部に送られます（電気通信事業法の外部送信規律に基づく公表）。</p>
<h2>送信先と目的</h2>
<table>
<tr><th>サービス・送信先</th><th>送る情報</th><th>目的</th></tr>
<tr><td>Google アナリティクス（Google LLC）</td><td>閲覧したページのURL、参照元、端末・ブラウザの種類、おおまかな地域、ページ内の操作（関連記事・シェアボタンのクリック、記事を最後まで読んだか）、Cookie などの識別子</td><td>アクセスの集計・記事の改善。広告のための機能（Google シグナル・広告のカスタマイズ）は使っていません</td></tr>
<tr><td>Vercel Web Analytics（Vercel Inc.）</td><td>閲覧したページのURL、参照元、端末・ブラウザの種類、おおまかな地域</td><td>アクセスの集計</td></tr>
</table>
<h2>止める方法</h2>
<p>Google アナリティクスへの送信は、Google が提供する<a href="https://tools.google.com/dlpage/gaoptout?hl=ja" rel="noopener" target="_blank">オプトアウト アドオン</a>で止められます。Google のデータの扱いは<a href="https://policies.google.com/technologies/partner-sites?hl=ja" rel="noopener" target="_blank">こちら</a>をご覧ください。</p>
<h2>運営者</h2>
<p>${esc(op)}</p>
</main>
</body>
</html>
`;
}
