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

/* Vídeos tocam sozinhos só no slide ativo; a animação do Dijkstra recomeça a cada entrada. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('.stage'); if (!stage) return;
  const algoData = {}; let algoRun = 0;
  async function algo(canvas) {
    const run = ++algoRun; const url = canvas.dataset.algo;
    const d = algoData[url] || (algoData[url] = await (await fetch(url)).json());
    const cx = canvas.getContext('2d'); const k = canvas.width / 960; const box = canvas.closest('.algo-stage').querySelector('.algo-result');
    box?.classList.remove('on');
    cx.clearRect(0, 0, canvas.width, canvas.height);
    const cells = d.visitadas; const per = Math.max(1, Math.ceil(cells.length / 210));
    let i = 0;
    await new Promise((ok) => { const f = () => { if (run !== algoRun) return ok();
      for (let n = 0; n < per && i < cells.length; n++, i++) { const [x, y] = cells[i]; const t = i / cells.length;
        cx.fillStyle = `hsla(${200 - t * 110},70%,${55 - t * 10}%,.55)`; cx.fillRect((x - 2.3) * k, (y - 2.3) * k, 4.6 * k, 4.6 * k); }
      if (i < cells.length) requestAnimationFrame(f); else ok(); }; reduce ? (i = cells.length, ok()) : requestAnimationFrame(f); });
    if (run !== algoRun) return;
    const P = d.caminho; const seg = P.slice(1).map((q, j) => Math.hypot(q[0] - P[j][0], q[1] - P[j][1])); const L = seg.reduce((a, b) => a + b, 0);
    const t0 = performance.now(), dur = reduce ? 1 : 1600;
    await new Promise((ok) => { const f = (t) => { if (run !== algoRun) return ok(); const want = Math.min(1, (t - t0) / dur) * L;
      cx.save(); cx.strokeStyle = '#142942'; cx.lineWidth = 9 * k; cx.lineCap = cx.lineJoin = 'round'; cx.beginPath(); cx.moveTo(P[0][0] * k, P[0][1] * k);
      let acc = 0; for (let j = 1; j < P.length; j++) { const s = seg[j - 1]; if (acc + s <= want) { cx.lineTo(P[j][0] * k, P[j][1] * k); acc += s; } else { const r = (want - acc) / s; cx.lineTo((P[j - 1][0] + (P[j][0] - P[j - 1][0]) * r) * k, (P[j - 1][1] + (P[j][1] - P[j - 1][1]) * r) * k); break; } }
      cx.stroke(); cx.strokeStyle = '#c8ef9d'; cx.lineWidth = 4 * k; cx.stroke(); cx.restore();
      if (want < L) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    [[d.inicio, '#142942'], [d.fim, '#5c9e43']].forEach(([p, c]) => { cx.fillStyle = c; cx.beginPath(); cx.arc(p[0] * k, p[1] * k, 11 * k, 0, 7); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 3 * k; cx.stroke(); });
    box?.classList.add('on');
    setTimeout(() => { if (run === algoRun && canvas.closest('.slide').classList.contains('active')) algo(canvas); }, 6000);
  }
  function enter(slide) {
    document.querySelectorAll('.slide:not(.active) video.auto-video').forEach((v) => v.pause());
    slide.querySelectorAll('video.auto-video').forEach((v) => { try { v.currentTime = 0; } catch (_) {} v.play().catch(() => {}); });
    const c = slide.querySelector('canvas[data-algo]'); if (c) algo(c); else algoRun++;
  }
  new MutationObserver((list) => list.forEach((m) => { if (m.target.classList?.contains('slide') && m.target.classList.contains('active') && !String(m.oldValue).includes('active')) enter(m.target); }))
    .observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const first = document.querySelector('.slide.active'); if (first) enter(first);
})();
