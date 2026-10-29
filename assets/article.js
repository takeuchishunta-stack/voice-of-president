// VOICE OF PRESIDENT — 記事・一覧・検索ページの小さな動き
(() => {
  // 計測：GA4（gtag）があれば送る。無ければ何もしない。1つの操作で1回だけ送る
  const B = document.body.dataset;
  const base = { media_id: B.media || 'vop', article_id: B.article || '' };
  const track = (name, p = {}) => {
    try { window.gtag && window.gtag('event', name, { ...base, ...p }); } catch (e) {}
    try { window.va && window.va('event', { name, data: { ...base, ...p } }); } catch (e) {}
  };
  const once = new Set();
  const trackOnce = (key, name, p) => { if (once.has(key)) return; once.add(key); track(name, p); };
  const onClick = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => fn(el)));

  // シェア
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    track('share_click', { placement: 'share', share_via: 'copy' });
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'コピーしました'; } catch (e) { prompt('URL', b.dataset.copy); }
  }));
  onClick('.share a', a => track('share_click', { placement: 'share', share_via: a.textContent.trim().toLowerCase() }));

  // サイト内の回遊（関連記事・次の記事）
  onClick('.rel a', a => track('related_article_click', { placement: 'related', destination_media: base.media_id, link_url: a.getAttribute('href') }));
  onClick('.next a', a => track('related_article_click', { placement: 'next', destination_media: base.media_id, link_url: a.getAttribute('href') }));

  // 姉妹メディアへ
  onClick('.sis a', a => track('sister_media_click', { placement: 'another_angle', destination_media: a.dataset.dest || '', link_url: a.href }));
  onClick('.net a', a => track('sister_media_click', { placement: 'sister_media', destination_media: a.dataset.dest || '', link_url: a.href }));

  // PR 枠：表示（枠の50%以上が1秒続けて見えた時に1回）とクリック
  document.querySelectorAll('[data-pr]').forEach(a => {
    const p = { placement: 'article_end', banner_id: a.dataset.banner || '', destination_media: 'localboost' };
    a.addEventListener('click', () => track('pr_click', p));
    if (!('IntersectionObserver' in window)) return;
    let t = 0;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (!t) t = setTimeout(() => { trackOnce('pr:' + p.banner_id, 'pr_impression', p); io.disconnect(); }, 1000); }
      else { clearTimeout(t); t = 0; }
    }), { threshold: [0, 0.5] });
    io.observe(a);
  });

  // 読了：本文の末尾が画面に入った ＋ ページを見ていた時間（タブが表で開いている時間）の合計が30秒、の両方で1回
  const end = document.querySelector('[data-body-end]');
  if (end) {
    let seen = false, ms = 0, last = document.visibilityState === 'visible' ? Date.now() : 0, done = false;
    const tick = () => { if (last) { const n = Date.now(); ms += n - last; last = n; } };
    const check = () => {
      tick();
      if (!done && seen && ms >= 30000) { done = true; clearInterval(iv); trackOnce('end', 'article_end_view', { placement: 'article_end', engaged_seconds: Math.round(ms / 1000) }); }
    };
    document.addEventListener('visibilitychange', () => { tick(); last = document.visibilityState === 'visible' ? Date.now() : 0; check(); });
    const iv = setInterval(check, 1000);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { seen = true; io.disconnect(); check(); } });
      io.observe(end);
    }
  }

  const idx = window.VOP_INDEX, q = document.getElementById('q');
  if (!idx || !q) return;
  const out = document.getElementById('slist'), res = document.getElementById('sres');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const run = () => {
    const words = q.value.trim().split(/[\s　]+/).filter(Boolean);
    const hit = words.length ? idx.filter(a => words.every(w => (a.t + a.n + a.c + a.g + a.x).includes(w))) : idx;
    res.textContent = words.length ? `「${words.join(' ')}」の記事：${hit.length}本` : `全${idx.length}本`;
    out.innerHTML = hit.map(a => `<a class="card" href="${a.u}"><span class="card-img"><img src="${esc(a.f)}" alt="" loading="lazy"></span><span class="card-tx"><span class="card-meta">VOL.${esc(a.v)}　${esc(a.g)}</span><span class="card-ttl">${esc(a.t)}</span><span class="card-who">${esc(a.c)} ／ ${esc(a.n)}</span></span></a>`).join('');
  };
  const p = new URLSearchParams(location.search).get('q'); if (p) q.value = p;
  q.addEventListener('input', run); run();
})();
