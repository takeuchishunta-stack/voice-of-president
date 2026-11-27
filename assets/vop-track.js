// VOICE OF PRESIDENT — 記事ページの計測とシェア（Furutori 追加）
// GA4（gtag）が読み込まれている時だけ送る。1つの操作で1回だけ送る
(() => {
  const B = document.body.dataset;
  const base = { media_id: B.media || 'vop', article_id: B.article || '' };
  const track = (name, p = {}) => { try { window.gtag && window.gtag('event', name, { ...base, ...p }); } catch (e) {} };
  const on = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => fn(el)));

  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    track('share_click', { placement: 'share', share_via: 'copy' });
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'コピーしました'; } catch (e) { window.prompt('URL', b.dataset.copy); }
  }));
  on('.vop-share a', a => track('share_click', { placement: 'share', share_via: a.dataset.via || '' }));
  on('.vop-rel a', a => track('related_article_click', { placement: 'related', destination_media: base.media_id, link_url: a.getAttribute('href') }));
  on('.vop-next', a => track('related_article_click', { placement: 'next', destination_media: base.media_id, link_url: a.getAttribute('href') }));
  on('.vop-sis a', a => track('sister_media_click', { placement: 'another_angle', destination_media: a.dataset.dest || '', link_url: a.href }));
  on('.vop-net a', a => track('sister_media_click', { placement: 'sister_media', destination_media: a.dataset.dest || '', link_url: a.href }));

  // 読了：本文の末尾が画面に入った ＋ タブが表で開いていた時間の合計が30秒、の両方で1回だけ
  const end = document.querySelector('[data-body-end]');
  if (!end) return;
  let seen = false, ms = 0, done = false, last = document.visibilityState === 'visible' ? Date.now() : 0;
  const tick = () => { if (last) { const n = Date.now(); ms += n - last; last = n; } };
  const check = () => {
    tick();
    if (!done && seen && ms >= 30000) { done = true; clearInterval(iv); track('article_end_view', { placement: 'article_end', engaged_seconds: Math.round(ms / 1000) }); }
  };
  document.addEventListener('visibilitychange', () => { tick(); last = document.visibilityState === 'visible' ? Date.now() : 0; check(); });
  const iv = setInterval(check, 1000);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { seen = true; io.disconnect(); check(); } });
    io.observe(end);
  }
})();
