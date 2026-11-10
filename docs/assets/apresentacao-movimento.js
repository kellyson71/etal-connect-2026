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

/* Passos automáticos (data-steps) e a corrida escada × rampa. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('.stage'); if (!stage) return;
  let stepTimer = 0, raceRun = 0; const cache = {};
  function steps(root) {
    clearInterval(stepTimer); if (!root) return;
    const n = +root.dataset.steps, ms = +root.dataset.interval || 1500; let s = -1;
    const set = (k) => { for (let i = 0; i <= n; i++) root.classList.toggle('s' + i, i === k); root.querySelectorAll('[data-step]').forEach((el) => el.classList.toggle('on', +el.dataset.step <= k)); };
    const tick = () => { s = (s + 1) % (n + 1 + (root.matches('.qrf') ? 0 : 0)); set(s); };
    if (reduce) { set(n - 1); return; } tick(); stepTimer = setInterval(tick, ms);
  }
  async function race(canvas) {
    const run = ++raceRun; const url = canvas.dataset.race;
    const d = cache[url] || (cache[url] = await (await fetch(url)).json());
    const cx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
    const slide = canvas.closest('.slide'); const costEl = (v) => slide.querySelector(`[data-race-cost="${v}"]`);
    slide.querySelector('.race-win')?.classList.remove('on'); slide.querySelectorAll('.race-row').forEach((r) => r.classList.remove('win'));
    const T = 3.054, K = 0.55, LIFT = 26;
    const pr = (x, y, z) => [x * Math.cos(T) - y * Math.sin(T), (x * Math.sin(T) + y * Math.cos(T)) * K - z * LIFT];
    const all = []; d.andares.forEach((f) => f.outline.forEach((q) => all.push(pr(q[0], q[1], f.level))));
    ['escada', 'rampa'].forEach((v) => d[v].campus.concat(d[v].path).forEach((q) => all.push(pr(q[0], q[1], q[2] || 0))));
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sc = Math.min((W - 80) / (x1 - x0), (H - 80) / (y1 - y0));
    const S = (x, y, z) => { const p = pr(x, y, z); return [40 + (p[0] - x0) * sc + ((W - 80) - (x1 - x0) * sc) / 2, 40 + (p[1] - y0) * sc + ((H - 80) - (y1 - y0) * sc) / 2]; };
    const floors = () => {
      d.andares.forEach((f) => {
        const poly = (pts, fill, stroke) => { cx.beginPath(); pts.forEach((q, i) => { const s = S(q[0], q[1], f.level); i ? cx.lineTo(s[0], s[1]) : cx.moveTo(s[0], s[1]); }); cx.closePath(); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = 2; cx.stroke(); } };
        poly(f.outline, 'rgba(220,230,240,.55)', '#b9c8d6');
        f.zones.forEach((z) => { if (['courtyard', 'wall'].includes(z.kind)) return; poly(z.poly, z.kind === 'stairs' ? 'rgba(232,168,37,.45)' : z.kind === 'ramp' ? 'rgba(59,106,194,.35)' : 'rgba(255,255,255,.75)', 'rgba(150,170,190,.6)'); });
      });
    };
    const routes = ['escada', 'rampa'].map((v) => {
      const pts = d[v].campus.map((q) => [q[0], q[1], 0]).concat(d[v].path.map((q) => [q[0], q[1], q[2] || 0]));
      const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], (q[2] - pts[i][2]) * 3.45));
      return { v, pts, seg, L: seg.reduce((a, b) => a + b, 0), cost: d[v].cost, color: v === 'escada' ? '#e8a825' : '#3b6ac2' };
    });
    const dur = reduce ? 1 : 9000; const t0 = performance.now();
    await new Promise((ok) => { const f = (t) => { if (run !== raceRun) return ok();
      const k = Math.min(1, (t - t0) / dur); cx.clearRect(0, 0, W, H); floors();
      routes.forEach((r) => { const k2 = Math.min(1, k * 200 / r.cost); const want = k2 * r.L; let acc = 0; cx.beginPath();
        let head = S(...r.pts[0]); cx.moveTo(...head);
        for (let i = 1; i < r.pts.length; i++) { const s = r.seg[i - 1]; const a = r.pts[i - 1], b = r.pts[i];
          if (acc + s <= want) { head = S(...b); cx.lineTo(...head); acc += s; } else { const q = s ? (want - acc) / s : 0; head = S(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q); cx.lineTo(...head); break; } }
        cx.strokeStyle = '#fff'; cx.lineWidth = 14; cx.lineCap = cx.lineJoin = 'round'; cx.stroke(); cx.strokeStyle = r.color; cx.lineWidth = 8; cx.stroke();
        cx.fillStyle = r.color; cx.beginPath(); cx.arc(head[0], head[1], 13, 0, 7); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 4; cx.stroke();
        const el = costEl(r.v); if (el) el.textContent = Math.round(r.cost * k2); });
      if (k < 1) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    if (run !== raceRun) return;
    const win = d.escolha; slide.querySelector(`.race-row.${win}`)?.classList.add('win'); slide.querySelector('.race-win')?.classList.add('on');
    setTimeout(() => { if (run === raceRun && slide.classList.contains('active')) race(canvas); }, 5000);
  }
  function enter(slide) { steps(slide.querySelector('[data-steps]')); const c = slide.querySelector('canvas[data-race]'); if (c) race(c); else raceRun++; }
  new MutationObserver((list) => list.forEach((m) => { if (m.target.classList?.contains('slide') && m.target.classList.contains('active') && !String(m.oldValue).includes('active')) enter(m.target); }))
    .observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const first = document.querySelector('.slide.active'); if (first) enter(first);
})();
