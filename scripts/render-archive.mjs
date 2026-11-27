import { esc } from './lib.mjs';
import { pageHead, CFG } from './seo.mjs';

// `articles` is newest-first (sort_order ascending). `industryTags` is a list of
// { label, count } sorted by frequency then label, used to build the filter chips.
export function renderArchivePage(articles, industryTags) {
  const cards = articles.map(a => `
          <a href="/articles/${esc(a.id)}" class="vop-card" data-industries="${esc(a.industries.join('|'))}" data-search="${esc([a.name, a.company, a.title, a.excerpt].join(' ').toLowerCase())}">
            <div style="height:280px; overflow:hidden; position:relative;">
              <img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; object-position:50% 15%;">
              <span style="position:absolute; left:0; top:14px; font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:.26em; color:#8E1D22; background:#FFF8F3; padding:5px 12px; pointer-events:none;">VOL.${esc(a.vol)}</span>
            </div>
            <div style="padding:20px 4px 0; display:flex; flex-direction:column; gap:10px; flex:1;">
              <div style="font-size:11px; letter-spacing:.1em; color:#B08A4A;">${esc(a.industries.join(' / '))}</div>
              <h3 style="margin:0; font-family:'Shippori Mincho',serif; font-size:17px; font-weight:600; line-height:1.6; letter-spacing:.04em; color:#1B1614;">${esc(a.title)}</h3>
              <span style="font-size:11.5px; letter-spacing:.06em; color:rgba(27,22,20,.55);">${esc(a.company)} ／ ${esc(a.name)}</span>
            </div>
          </a>`).join('');

  const chips = industryTags.map(t => `<button type="button" class="vop-chip" data-tag="${esc(t.label)}">${esc(t.label)} <span class="vop-chip-n">${t.count}</span></button>`).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>連載一覧 ― VOICE OF PRESIDENT</title>
<meta name="description" content="VOICE OF PRESIDENTのインタビュー記事一覧。業種やお名前で絞り込み、気になる経営者の歩みを探せます。">
${pageHead({ url: CFG.siteUrl + '/archive', title: '連載一覧 ― VOICE OF PRESIDENT', description: 'VOICE OF PRESIDENTのインタビュー記事一覧。業種やお名前で絞り込み、気になる経営者の歩みを探せます。', image: articles[0] ? CFG.siteUrl + '/' + articles[0].photo : '' })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  body { margin:0; background:#F7F4EF; color:#1B1614; -webkit-font-smoothing:antialiased; }
  a { color:#8E1D22; text-decoration:none; }
  .vop-chip { font-family:'Zen Kaku Gothic New',sans-serif; font-size:12px; letter-spacing:.04em; color:#1B1614; background:#FFFFFF; border:1px solid rgba(27,22,20,.16); border-radius:999px; padding:8px 16px; cursor:pointer; white-space:nowrap; transition:background .15s,border-color .15s,color .15s; }
  .vop-chip:hover { border-color:#8E1D22; }
  .vop-chip.active { background:#8E1D22; border-color:#8E1D22; color:#FFF8F3; }
  .vop-chip-n { opacity:.55; font-size:10.5px; margin-left:2px; }
  .vop-card { display:flex; flex-direction:column; color:inherit; background:#FFFFFF; border:1px solid rgba(27,22,20,.1); transition:box-shadow .2s,transform .2s; }
  .vop-card:hover { box-shadow:0 14px 30px rgba(27,22,20,.12); transform:translateY(-2px); }
  #vop-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:28px; }
  #vop-search { font-family:'Zen Kaku Gothic New',sans-serif; font-size:13px; letter-spacing:.06em; color:#1B1614; border:1px solid rgba(27,22,20,.2); background:#FFFFFF; padding:13px 18px; outline:0; width:100%; box-sizing:border-box; }
  #vop-search:focus { border-color:#8E1D22; }
  #vop-empty { display:none; text-align:center; padding:60px 0; color:rgba(27,22,20,.5); font-size:13px; letter-spacing:.08em; }
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
        <nav style="display:flex; gap:30px; font-size:12.5px; letter-spacing:.14em; color:rgba(27,22,20,.7);"><span style="color:#8E1D22;">連載一覧</span><span>会社概要</span><span>お問い合わせ</span></nav>
      </div>
    </header>

    <div style="padding:72px 56px 0;">
      <div style="display:flex; align-items:baseline; gap:18px;">
        <span style="font-family:'Cormorant Garamond',serif; font-size:13px; letter-spacing:.34em; color:#B08A4A;">ARCHIVE</span>
        <h1 style="margin:0; font-family:'Shippori Mincho',serif; font-size:30px; font-weight:600; letter-spacing:.08em;">連載一覧</h1>
      </div>
      <p style="margin:16px 0 0; font-size:13px; line-height:2; color:rgba(27,22,20,.6); max-width:640px;">業種やお名前、会社名で絞り込んで、気になる経営者のインタビューを探せます。</p>
    </div>

    <div style="padding:36px 56px 0;">
      <input id="vop-search" type="search" placeholder="名前・会社名・キーワードで検索">
    </div>

    <div style="padding:22px 56px 0; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
      <span style="font-size:11px; letter-spacing:.14em; color:rgba(27,22,20,.45); margin-right:4px;">業種で絞り込む：</span>
      ${chips}
      <button type="button" id="vop-clear" style="font-size:11.5px; letter-spacing:.08em; color:#8E1D22; background:none; border:0; border-bottom:1px solid rgba(142,29,34,.4); padding:4px 0; margin-left:8px; cursor:pointer; display:none;">条件をクリア</button>
    </div>

    <div style="padding:16px 56px 0; font-size:11.5px; letter-spacing:.08em; color:rgba(27,22,20,.5);"><span id="vop-count">${articles.length}</span>件の記事</div>

    <div id="vop-grid" style="padding:20px 56px 96px;">${cards}</div>
    <p id="vop-empty">該当する記事が見つかりませんでした。条件を変えてお試しください。</p>

    <footer style="padding:34px 56px; background:#8E1D22; display:flex; justify-content:space-between; align-items:center; font-size:11.5px; letter-spacing:.16em; color:rgba(255,248,243,.72);">
      <a href="/" style="font-family:'Cormorant Garamond',serif; letter-spacing:.3em; font-size:13px; color:#FFF8F3;">VOICE OF PRESIDENT</a>
      <span style="display:flex; gap:26px; white-space:nowrap;"><a href="/privacy" style="color:inherit;">外部送信について</a><span>© 2026</span></span>
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

  function setupFilters() {
    const grid = document.getElementById('vop-grid');
    const cards = Array.from(grid.querySelectorAll('.vop-card'));
    const chips = Array.from(document.querySelectorAll('.vop-chip'));
    const searchInput = document.getElementById('vop-search');
    const countEl = document.getElementById('vop-count');
    const emptyEl = document.getElementById('vop-empty');
    const clearBtn = document.getElementById('vop-clear');
    const activeTags = new Set();

    const params = new URLSearchParams(location.search);
    const initialQ = params.get('q') || '';
    if (initialQ) searchInput.value = initialQ;

    function apply() {
      const q = searchInput.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const industries = card.dataset.industries.split('|');
        const matchesTags = activeTags.size === 0 || industries.some(ind => activeTags.has(ind));
        const matchesSearch = !q || card.dataset.search.includes(q);
        const visible = matchesTags && matchesSearch;
        card.style.display = visible ? '' : 'none';
        if (visible) shown++;
      });
      countEl.textContent = shown;
      emptyEl.style.display = shown === 0 ? 'block' : 'none';
      grid.style.display = shown === 0 ? 'none' : 'grid';
      clearBtn.style.display = (activeTags.size > 0 || q) ? 'inline-block' : 'none';
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (activeTags.has(tag)) { activeTags.delete(tag); chip.classList.remove('active'); }
        else { activeTags.add(tag); chip.classList.add('active'); }
        apply();
      });
    });

    searchInput.addEventListener('input', apply);
    clearBtn.addEventListener('click', () => {
      activeTags.clear();
      chips.forEach(c => c.classList.remove('active'));
      searchInput.value = '';
      apply();
    });

    apply();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupScale();
    setupFilters();
  });
})();
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}
