// Ported 1:1 from article.js's client-side renderer, so statically generated
// article pages are pixel-identical to the previous client-rendered ones.
import { esc } from './lib.mjs';

function renderBlock(b) {
  switch (b.type) {
    case 'lead':
      return `<p style="margin:0 0 44px; font-family:'Shippori Mincho',serif; font-size:19px; line-height:2.25; letter-spacing:.05em; color:#1B1614;">${esc(b.text)}</p>`;
    case 'h':
      return `<div style="margin:20px 0 32px; padding:26px 28px; border-left:3px solid #8E1D22; background:#F7F4EF;">
          <h2 style="margin:0; font-family:'Shippori Mincho',serif; font-size:24px; font-weight:600; line-height:1.7; letter-spacing:.06em;">${esc(b.text)}</h2>
        </div>`;
    case 'q':
      return `<blockquote style="margin:8px 0 40px;">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;"><span style="flex:none; width:30px; height:1px; background:#B08A4A;"></span></div>
          <p style="margin:0; font-family:'Shippori Mincho',serif; font-size:21px; font-weight:700; line-height:2.1; letter-spacing:.06em; color:#1B1614;">「${esc(b.text)}」</p>
        </blockquote>`;
    case 'prof':
      return null; // rendered separately
    case 'img':
      return `<figure style="margin:16px 0 44px;">
          <div style="overflow:hidden;"><img src="${esc(b.src)}" alt="${esc(b.caption || '')}" style="width:100%; display:block; object-fit:cover;"></div>
          ${b.caption ? `<figcaption style="margin-top:12px; font-size:12px; letter-spacing:.06em; line-height:1.8; color:rgba(27,22,20,.5);">${esc(b.caption)}</figcaption>` : ''}
        </figure>`;
    case 'p':
    default:
      return `<p style="margin:0 0 34px; font-family:'Shippori Mincho',serif; font-size:16.5px; line-height:2.4; letter-spacing:.04em; color:rgba(27,22,20,.82);">${esc(b.text)}</p>`;
  }
}

function renderProfile(a, prof) {
  return `<div style="margin:44px 0 0; padding:38px 40px; border:1px solid rgba(27,22,20,.16); display:flex; gap:30px; align-items:flex-start;">
      <div style="flex:none; width:118px; height:118px; overflow:hidden;">
        <img src="${esc(a.face || a.photo)}" alt="" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div style="min-width:0; display:flex; flex-direction:column; gap:11px;">
        <span style="font-family:'Cormorant Garamond',serif; font-size:11.5px; letter-spacing:.3em; color:#B08A4A;">PROFILE</span>
        <strong style="font-family:'Shippori Mincho',serif; font-size:19px; font-weight:600; letter-spacing:.06em;">${esc(a.name)}　<span style="font-size:13px; font-weight:400; color:rgba(27,22,20,.6);">${esc(a.company)}　${esc(a.role)}</span></strong>
        <p style="margin:0; font-size:13px; line-height:2.05; color:rgba(27,22,20,.66);">${esc(prof.text)}</p>
      </div>
    </div>`;
}

export function renderArticleBody(a) {
  const profBlock = a.blocks.find(b => b.type === 'prof');
  return `
      <div style="position:relative; display:grid; grid-template-columns:1fr 480px; min-height:620px; background:#FFFFFF;">
        <span style="position:absolute; left:40px; top:34px; font-family:'Cormorant Garamond',serif; font-size:140px; line-height:.86; letter-spacing:.02em; color:transparent; -webkit-text-stroke:1px rgba(142,29,34,.14); pointer-events:none; z-index:1;">VOL<br>${esc(a.vol)}</span>
        <div style="position:relative; z-index:2; padding:96px 56px; display:flex; flex-direction:column; justify-content:center; gap:24px; min-width:0;">
          <div style="display:flex; align-items:center; gap:16px; font-family:'Cormorant Garamond',serif; font-size:13px; letter-spacing:.34em; color:#B08A4A; white-space:nowrap;"><span>VOL.${esc(a.vol)}</span><span style="width:38px; height:1px; background:#B08A4A;"></span><span style="color:rgba(27,22,20,.45); font-family:'Zen Kaku Gothic New',sans-serif; letter-spacing:.14em; font-size:12px;">${esc(a.category)}</span></div>
          <h1 style="margin:0; font-family:'Shippori Mincho',serif; font-weight:600; font-size:46px; line-height:1.62; letter-spacing:.06em; text-wrap:pretty;">${esc(a.title)}</h1>
          <p style="margin:0; font-family:'Shippori Mincho',serif; font-size:19px; line-height:1.95; letter-spacing:.06em; color:#8E1D22;">${esc(a.subtitle)}</p>
          <div style="display:flex; align-items:center; gap:14px; font-size:12.5px; letter-spacing:.12em; color:rgba(27,22,20,.6); margin-top:4px;"><span style="width:22px; height:1px; background:rgba(27,22,20,.3);"></span><span>${esc(a.company)}　${esc(a.role)} ／ ${esc(a.name)}</span></div>
          <span style="font-family:'Cormorant Garamond',serif; font-size:11.5px; letter-spacing:.2em; color:rgba(27,22,20,.4);">${esc(a.date)}　TEXT 編集部</span>
        </div>
        <div style="position:relative; overflow:hidden; border-left:38px solid #8E1D22; min-width:0;">
          <div style="position:absolute; inset:-4%; animation:vopKb 26s ease-in-out infinite alternate;">
            <img src="${esc(a.photo)}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:50% 12%;">
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 720px 1fr; padding:88px 0 40px; background:#FFFFFF;">
        <div></div>
        <div style="min-width:0; display:flex; flex-direction:column; gap:0;">
          ${a.blocks.map(renderBlock).filter(Boolean).join('\n')}
          ${profBlock ? renderProfile(a, profBlock) : ''}
        </div>
        <div></div>
      </div>

      <div style="margin:88px 0 0; border-top:1px solid rgba(27,22,20,.12); display:grid; grid-template-columns:1fr 420px; background:#FFFFFF;">
        <a href="/articles/${esc(a.next.id)}" style="padding:52px 56px; display:flex; flex-direction:column; gap:16px; justify-content:center; color:inherit; min-width:0;">
          <span style="font-family:'Cormorant Garamond',serif; font-size:12px; letter-spacing:.32em; color:#B08A4A; white-space:nowrap;">NEXT INTERVIEW ／ VOL.${esc(a.next.vol)}</span>
          <h3 style="margin:0; font-family:'Shippori Mincho',serif; font-size:28px; font-weight:400; line-height:1.7; letter-spacing:.06em;">${esc(a.next.title)}</h3>
          <span style="font-size:12.5px; letter-spacing:.12em; color:rgba(27,22,20,.55);">${esc(a.next.company)} ／ ${esc(a.next.name)}</span>
        </a>
        <div style="min-width:0; height:260px; overflow:hidden; border-left:1px solid rgba(27,22,20,.12);">
          <img src="${esc(a.next.photo)}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:50% 15%;">
        </div>
      </div>
    `;
}

export function renderArticlePage(a) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.name)} ― VOICE OF PRESIDENT</title>
<meta name="description" content="${esc(a.excerpt || a.subtitle)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  body { margin:0; background:#F7F4EF; color:#1B1614; -webkit-font-smoothing:antialiased; }
  a { color:#8E1D22; text-decoration:none; }
  a:hover { color:#B08A4A; }
  @keyframes vopKb { from { transform:scale(1.03); } to { transform:scale(1.12); } }
</style>
</head>
<body>

<section style="padding:0; display:flex; flex-direction:column; font-family:'Zen Kaku Gothic New',sans-serif; background:#F7F4EF; overflow-x:hidden;">
  <div id="vop-scaler" style="width:1240px; transform-origin:top left; margin:0 auto;">
  <div id="vop-page" style="width:1240px; background:#FFFFFF;">

    <header style="display:flex; align-items:center; justify-content:space-between; padding:26px 56px; border-bottom:1px solid rgba(27,22,20,.1); background:#FFFFFF;">
      <div style="display:flex; align-items:baseline; gap:16px;">
        <a href="/" style="font-family:'Cormorant Garamond',serif; font-size:21px; letter-spacing:.3em; color:#8E1D22;">VOICE OF PRESIDENT</a>
        <span style="font-family:'Shippori Mincho',serif; font-size:11px; letter-spacing:.34em; color:rgba(27,22,20,.5);">経営者に、聞く。</span>
      </div>
      <div style="display:flex; align-items:center; gap:28px; white-space:nowrap;">
        <form action="/archive" method="get" style="display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(27,22,20,.28); padding:0 2px 7px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(27,22,20,.5)" stroke-width="2"><circle cx="10.5" cy="10.5" r="7"></circle><line x1="16" y1="16" x2="22" y2="22"></line></svg>
          <input name="q" placeholder="記事を検索" style="width:150px; border:0; outline:0; background:transparent; font-family:'Zen Kaku Gothic New',sans-serif; font-size:12.5px; letter-spacing:.1em; color:#1B1614;">
        </form>
        <nav style="display:flex; gap:30px; font-size:12.5px; letter-spacing:.14em; color:rgba(27,22,20,.7);"><a href="/archive" style="color:inherit;">連載一覧</a><span>会社概要</span><span style="color:#8E1D22;">お問い合わせ</span></nav>
      </div>
    </header>

    <main id="vop-article">${renderArticleBody(a)}</main>

    <div style="display:flex; justify-content:center; gap:36px; padding:52px 0 76px; font-size:12.5px; letter-spacing:.2em; background:#F7F4EF;">
      <a href="/archive" style="display:inline-flex; align-items:center; white-space:nowrap; color:#FFFFFF; background:#8E1D22; padding:17px 30px;">連載一覧へ戻る</a>
      <a href="/" style="display:inline-flex; align-items:center; white-space:nowrap; color:rgba(27,22,20,.7); border-bottom:1px solid rgba(176,138,74,.6); padding-bottom:6px; align-self:center;">トップページ</a>
    </div>

    <footer style="padding:34px 56px; background:#8E1D22; display:flex; justify-content:space-between; align-items:center; font-size:11.5px; letter-spacing:.16em; color:rgba(255,248,243,.72);">
      <a href="/" style="font-family:'Cormorant Garamond',serif; letter-spacing:.3em; font-size:13px; color:#FFF8F3;">VOICE OF PRESIDENT</a>
      <span style="display:flex; gap:26px; white-space:nowrap;"><span>プライバシーポリシー</span><span>© 2026</span></span>
    </footer>

  </div>
  </div>
</section>

<script>
(() => {
  function setupScale() {
    const el = document.getElementById('vop-scaler');
    const inner = document.getElementById('vop-page');
    if (!el || !inner) return;
    const fit = () => {
      const s = Math.min(1, document.documentElement.clientWidth / 1240);
      el.style.transform = s < 1 ? 'scale(' + s + ')' : 'none';
      const h = inner.scrollHeight;
      el.style.marginBottom = s < 1 ? -(h * (1 - s)) + 'px' : '';
    };
    window.addEventListener('resize', fit, { passive: true });
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(inner);
    setTimeout(fit, 400);
    setTimeout(fit, 1600);
  }
  document.addEventListener('DOMContentLoaded', setupScale);
})();
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}
