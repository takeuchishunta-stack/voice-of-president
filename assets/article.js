// VOICE OF PRESIDENT — 記事・一覧・検索ページの小さな動き
(() => {
  const track = (name, data) => { try { window.va && window.va('event', { name, data }); } catch (e) {} };

  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'コピーしました'; } catch (e) { prompt('URL', b.dataset.copy); }
    track('share', { via: 'copy' });
  }));
  document.querySelectorAll('.share a').forEach(a => a.addEventListener('click', () => track('share', { via: a.textContent })));
  document.querySelectorAll('[data-pr]').forEach(a => a.addEventListener('click', () => track('pr_click', { page: location.pathname })));
  document.querySelectorAll('.sis a, .net a').forEach(a => a.addEventListener('click', () => track('sister_click', { to: a.href })));

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
