(() => {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function renderBlock(b) {
    switch (b.t) {
      case 'lead':
        return `<p style="margin:0 0 44px; font-family:'Shippori Mincho',serif; font-size:19px; line-height:2.25; letter-spacing:.05em; color:#1B1614;">${esc(b.x)}</p>`;
      case 'h':
        return `<div style="display:flex; align-items:center; gap:16px; margin:20px 0 32px;">
          <span style="flex:none; width:30px; height:1px; background:#B08A4A;"></span>
          <h2 style="margin:0; font-family:'Shippori Mincho',serif; font-size:24px; font-weight:600; line-height:1.7; letter-spacing:.06em;">${esc(b.x)}</h2>
        </div>`;
      case 'q':
        return `<blockquote style="margin:8px 0 40px; padding:30px 0 30px 34px; border-left:3px solid #8E1D22; background:#F7F4EF;">
          <p style="margin:0; padding-right:28px; font-family:'Shippori Mincho',serif; font-size:21px; line-height:2.1; letter-spacing:.06em; color:#1B1614;">「${esc(b.x)}」</p>
        </blockquote>`;
      case 'prof':
        return null; // rendered separately, appended after the loop
      case 'img':
        return `<figure style="margin:16px 0 44px;">
          <div style="overflow:hidden;"><img src="${esc(b.src)}" alt="${esc(b.caption || '')}" style="width:100%; display:block; object-fit:cover;"></div>
          ${b.caption ? `<figcaption style="margin-top:12px; font-size:12px; letter-spacing:.06em; line-height:1.8; color:rgba(27,22,20,.5);">${esc(b.caption)}</figcaption>` : ''}
        </figure>`;
      case 'p':
      default:
        return `<p style="margin:0 0 34px; font-family:'Shippori Mincho',serif; font-size:16.5px; line-height:2.4; letter-spacing:.04em; color:rgba(27,22,20,.82);">${esc(b.x)}</p>`;
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
        <p style="margin:0; font-size:13px; line-height:2.05; color:rgba(27,22,20,.66);">${esc(prof.x)}</p>
      </div>
    </div>`;
  }

  function render() {
    const list = window.VOP_ARTICLES || [];
    const root = document.getElementById('vop-article');
    if (!root || !list.length) return;

    const id = new URLSearchParams(location.search).get('id');
    let i = list.findIndex(a => a.id === id);
    if (i < 0) i = 0;
    const a = list[i];
    const n = list[(i + 1) % list.length];
    const profBlock = a.blocks.find(b => b.t === 'prof');

    document.title = a.name + ' ― VOICE OF PRESIDENT';

    root.innerHTML = `
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
        <a href="article.html?id=${esc(n.id)}" style="padding:52px 56px; display:flex; flex-direction:column; gap:16px; justify-content:center; color:inherit; min-width:0;">
          <span style="font-family:'Cormorant Garamond',serif; font-size:12px; letter-spacing:.32em; color:#B08A4A; white-space:nowrap;">NEXT INTERVIEW ／ VOL.${esc(n.vol)}</span>
          <h3 style="margin:0; font-family:'Shippori Mincho',serif; font-size:28px; font-weight:400; line-height:1.7; letter-spacing:.06em;">${esc(n.title)}</h3>
          <span style="font-size:12.5px; letter-spacing:.12em; color:rgba(27,22,20,.55);">${esc(n.company)} ／ ${esc(n.name)}</span>
        </a>
        <div style="min-width:0; height:260px; overflow:hidden; border-left:1px solid rgba(27,22,20,.12);">
          <img src="${esc(n.photo)}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:50% 15%;">
        </div>
      </div>
    `;
  }

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

  document.addEventListener('DOMContentLoaded', () => {
    render();
    setupScale();
  });
})();
