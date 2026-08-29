(() => {
  function setupHero() {
    const slides = Array.from(document.querySelectorAll('[data-hero]'));
    const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
    const num = document.getElementById('w-hero-num');
    if (slides.length < 2) return;
    let i = 0;
    let timer = null;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.style.opacity = k === i ? '1' : '0';
        s.style.pointerEvents = k === i ? 'auto' : 'none';
      });
      dots.forEach((d, k) => { d.style.background = k === i ? '#8E1D22' : 'rgba(27,22,20,.18)'; });
      if (num) num.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
    };
    show(0);
    const start = () => { timer = setInterval(() => show(i + 1), 10000); };
    const stop = () => { clearInterval(timer); };
    start();
    dots.forEach((d, k) => d.addEventListener('click', () => { stop(); show(k); start(); }));
    const stage = document.getElementById('w-hero-stage');
    if (stage) {
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', start);
    }
  }

  function setupScale() {
    const el = document.getElementById('vop-scaler');
    const inner = document.getElementById('vop-page');
    if (!el || !inner) return;
    const fit = () => {
      const w = document.documentElement.clientWidth;
      const s = Math.min(1, w / 1240);
      el.style.transform = s < 1 ? 'scale(' + s + ')' : 'none';
      const h = inner.scrollHeight;
      el.style.marginBottom = s < 1 ? -(h * (1 - s)) + 'px' : '';
    };
    window.addEventListener('resize', fit, { passive: true });
    fit();
    if (window.ResizeObserver) {
      new ResizeObserver(fit).observe(inner);
    }
    setTimeout(fit, 400);
    setTimeout(fit, 1600);
  }

  function setupShelf() {
    const el = document.getElementById('vop-shelf');
    const bar = document.getElementById('vop-shelf-bar');
    if (!el || !bar) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      const ratio = el.clientWidth / el.scrollWidth;
      const wpc = Math.max(8, ratio * 100);
      bar.style.width = wpc + '%';
      const p = max > 0 ? el.scrollLeft / max : 0;
      bar.style.left = (p * (100 - wpc)) + '%';
    };
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
    let down = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sl = el.scrollLeft; el.style.cursor = 'grabbing'; });
    const up = () => { down = false; el.style.cursor = 'grab'; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointermove', e => { if (down) el.scrollLeft = sl - (e.clientX - sx); });
  }

  function setupReveal() {
    const els = Array.from(document.querySelectorAll('[data-rv]'));
    if (!els.length) return;
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 1.1s cubic-bezier(.16,1,.3,1), transform 1.1s cubic-bezier(.16,1,.3,1)';
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupScale();
    setupReveal();
    setupShelf();
    setupHero();
  });
})();
