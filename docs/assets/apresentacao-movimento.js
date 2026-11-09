/* Movimento da apresentação: números que contam ao entrar no slide e profundidade ao mover o mouse. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = (slide) => slide.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count; if (reduce || !to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1100;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0'; setTimeout(() => requestAnimationFrame(step), 450);
  });
  const slides = [...document.querySelectorAll('.slide')];
  new MutationObserver((list) => list.forEach((m) => { if (m.target.classList.contains('active') && !m.oldValue?.includes('active')) count(m.target); }))
    .observe(document.querySelector('.stage'), { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const first = slides.find((s) => s.classList.contains('active')); if (first) count(first);
  if (reduce) return;
  let raf = 0;
  document.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      document.querySelectorAll('.slide.active [data-depth]').forEach((el) => { const d = +el.dataset.depth || 1; el.style.translate = `${(-x * 14 * d).toFixed(1)}px ${(-y * 10 * d).toFixed(1)}px`; });
    });
  });
})();
