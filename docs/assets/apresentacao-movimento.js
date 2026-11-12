/* Dados das animações: embutidos no HTML (funciona com duplo clique, em file://) ou, sem eles, buscados do arquivo. */
async function carregar(url) { const nome = url.split('/').pop(); const tag = document.querySelector(`script[data-dados="${nome}"]`); return tag ? JSON.parse(tag.textContent) : (await fetch(url)).json(); }
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
    const d = cache[url] || (cache[url] = await carregar(url));
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

/* "Como a rota é calculada": a rota de exemplo em seis atos, com os dados do próprio código do mapa
   (scripts/gerar-rota-apresentacao.mjs → rota-completa.json). 1 Dijkstra nas calçadas; 2 custo de cada entrada;
   3 A* no térreo, com a grade e o caminho alisado; 4 escada × rampa; 5 A* no 2º andar até a porta; 6 a rota inteira
   em 3D, pelos três andares. A câmera vai do campus para dentro do bloco sem corte (planta e campus têm a mesma
   orientação). Recomeça sozinha enquanto o slide estiver aberto. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('.stage'); if (!stage) return;
  let run = 0; const cache = {};
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cl = (t) => Math.max(0, Math.min(1, t));
  const ATOS = [[0, 4.6], [4.6, 7.4], [7.4, 12.6], [12.6, 15.4], [15.4, 19.6], [19.6, 25]]; const FIM = 29;
  const COR = { tinta: '#142942', verde: '#5c9e43', claro: '#c8ef9d', azul: '#3b6ac2', ambar: '#e8a825', laranja: '#e8542b' };
  /* soFinal: só o último quadro (a rota inteira), para o PDF e para a visão geral dos slides */
  async function animar(canvas, soFinal = false) {
    const me = soFinal ? run : ++run; const url = canvas.dataset.rota;
    const d = cache[url] || (cache[url] = await carregar(url));
    const slide = canvas.closest('.slide'); const cx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
    const W0 = d.mundo; const wp = (q) => [W0.x0 + q[0] * W0.sx, W0.y0 + q[1] * W0.sy]; const PU = (W0.sx + W0.sy) / 2;
    const passos = slide.querySelectorAll('[data-rc-ato]'); const tit = slide.querySelector('[data-rc-titulo]'), sub = slide.querySelector('[data-rc-sub]');
    /* câmeras: o campus inteiro e o bloco principal */
    const caixa = (pts, folga) => { const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const x0 = Math.min(...xs) - folga, x1 = Math.max(...xs) + folga, y0 = Math.min(...ys) - folga, y1 = Math.max(...ys) + folga; return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: Math.min(W / (x1 - x0), H / (y1 - y0)) }; };
    const camCampus = caixa([...d.nos, ...d.lugares.filter((l) => l.id !== 'portaria').flatMap((l) => l.p)], 4);
    const camBloco = caixa(d.andares[0].mundo, 3);
    let cam = camCampus; const mix = (a, b, t) => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t) });
    const S = (q) => [W / 2 + (q[0] - cam.cx) * cam.s, H / 2 + (q[1] - cam.cy) * cam.s];
    const poly = (pts, fill, stroke, lw = 1.5) => { cx.beginPath(); pts.forEach((q, i) => { const s = S(q); i ? cx.lineTo(...s) : cx.moveTo(...s); }); cx.closePath(); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw; cx.stroke(); } };
    const linha = (pts, cor, lw, ate = 1, borda = null) => { if (pts.length < 2) return null; const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])); const L = seg.reduce((a, b) => a + b, 0); const want = L * ate; let acc = 0, head = pts[0];
      cx.beginPath(); cx.moveTo(...S(pts[0]));
      for (let i = 1; i < pts.length; i++) { if (acc + seg[i - 1] <= want) { head = pts[i]; cx.lineTo(...S(head)); acc += seg[i - 1]; } else { const r = (want - acc) / seg[i - 1]; head = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]; cx.lineTo(...S(head)); break; } }
      cx.lineCap = cx.lineJoin = 'round'; if (borda) { cx.strokeStyle = borda; cx.lineWidth = lw + 7; cx.stroke(); } cx.strokeStyle = cor; cx.lineWidth = lw; cx.stroke(); return head; };
    const ponto = (q, cor, r = 15) => { const s = S(q); cx.beginPath(); cx.arc(s[0], s[1], r, 0, 7); cx.fillStyle = cor; cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 3.5; cx.stroke(); };
    const texto = (q, t, cor = COR.tinta, tam = 34, fundo = '#fff') => { const s = S(q); cx.font = `700 ${tam}px Geologica, system-ui, sans-serif`; const w = cx.measureText(t).width; cx.fillStyle = fundo; cx.beginPath(); cx.roundRect(s[0] - w / 2 - 14, s[1] - tam - 30, w + 28, tam + 20, 12); cx.fill(); cx.fillStyle = cor; cx.textAlign = 'center'; cx.fillText(t, s[0], s[1] - 26); };
    const campus = (a) => { cx.globalAlpha = a; d.lugares.forEach((l) => poly(l.p, l.id === 'principal' ? '#d9e1ec' : l.id === 'patio' ? '#e3efd8' : '#e8edf3', '#c6d0de')); cx.globalAlpha = 1; };
    const FUNDO = { corridor: '#f6f8fb', classroom: '#ffffff', laboratory: '#ffffff', office: '#ffffff', restroom: '#eef3fb', stairs: '#f6dfa8', ramp: '#cdd9f2', courtyard: '#dbe9cf', auditorium: '#e3e8f3', lounge: '#f3efe6', reception: '#f6f8fb' };
    const andar = (l, a, destaque = null) => { if (a <= 0) return; const f = d.andares[l]; cx.globalAlpha = a; poly(f.contorno.map(wp), '#eef2f7', '#9fb0c6', 2.5);
      f.corredores.forEach((c) => poly(c.map(wp), '#fbfcfe', null)); f.zonas.forEach((z) => poly(z.p.map(wp), z.n && destaque === z.n ? '#c8ef9d' : FUNDO[z.k] || '#fff', '#b8c5d6', 1.2));
      if (cam.s > 6) { cx.font = `700 ${Math.min(28, cam.s * 1.2)}px Geologica, system-ui, sans-serif`; cx.fillStyle = '#6b7c95'; cx.textAlign = 'center'; f.zonas.forEach((z) => { if (!z.n) return; const c = z.p.reduce((s, q) => [s[0] + q[0] / z.p.length, s[1] + q[1] / z.p.length], [0, 0]); const s = S(wp(c)); cx.fillText(z.n, s[0], s[1] + 6); }); }
      cx.globalAlpha = 1; };
    const busca = (b, ate, a = 1) => { const n = Math.floor(b.visitados.length * ate); const lado = 5 * PU * cam.s; cx.globalAlpha = a;
      for (let i = 0; i < n; i++) { const q = wp(b.visitados[i]); const s = S(q); const t = i / b.visitados.length; cx.fillStyle = `hsla(${205 - t * 105},75%,${58 - t * 12}%,${i > n - 40 ? 0.95 : 0.5})`; cx.fillRect(s[0] - lado / 2, s[1] - lado / 2, lado, lado); }
      cx.globalAlpha = 1; return n; };
    const legenda = (t, s) => { if (tit && tit.textContent !== t) tit.textContent = t; if (sub && sub.textContent !== s) sub.textContent = s; };
    const ato = (k) => passos.forEach((p) => p.classList.toggle('on', +p.dataset.rcAto === k));
    const dist = Object.fromEntries(d.ordem.map(([n, dd]) => [n, dd]));
    const escolhida = d.entradas.find((e) => e.nome === d.escolhida); const via = d.vias.find((v) => v.via === d.via);
    const foraPts = d.rota.pts.slice(0, d.rota.iEntrada + 1).map((q) => [q[0], q[2]]);
    const [b0, b2] = d.busca;
    /* 3D: andares empilhados, vistos de lado */
    const T = 3.054, K = 0.55, LIFT = 26; const pr = (x, y, z) => [x * Math.cos(T) - y * Math.sin(T), (x * Math.sin(T) + y * Math.cos(T)) * K - z * LIFT];
    const tudo = []; d.andares.forEach((f) => f.mundo.forEach((q) => tudo.push(pr(q[0], q[1], f.level)))); d.rota.pts.forEach((q) => tudo.push(pr(q[0], q[2], q[1] / 3.45)));
    const xs = tudo.map((p) => p[0]), ys = tudo.map((p) => p[1]); const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys); const sc3 = Math.min((W - 160) / (X1 - X0), (H - 200) / (Y1 - Y0));
    const S3 = (x, y, z) => { const p = pr(x, y, z); return [80 + (p[0] - X0) * sc3 + ((W - 160) - (X1 - X0) * sc3) / 2, 120 + (p[1] - Y0) * sc3 + ((H - 200) - (Y1 - Y0) * sc3) / 2]; };
    const pts3 = d.rota.pts.map((q) => [q[0], q[2], q[1] / 3.45]); const seg3 = pts3.slice(1).map((q, i) => Math.hypot(q[0] - pts3[i][0], q[1] - pts3[i][1], (q[2] - pts3[i][2]) * 3.45)); const L3 = seg3.reduce((a, b) => a + b, 0);
    function cena3d(t) {
      d.andares.forEach((f) => { const sobe = ease(cl(t * 2.2 - f.level * 0.35)); cx.globalAlpha = 0.25 + 0.75 * sobe; cx.beginPath(); f.mundo.forEach((q, i) => { const s = S3(q[0], q[1], f.level * sobe); i ? cx.lineTo(...s) : cx.moveTo(...s); }); cx.closePath(); cx.fillStyle = ['rgba(220,230,240,.75)', 'rgba(214,226,240,.75)', 'rgba(205,220,238,.8)'][f.level]; cx.fill(); cx.strokeStyle = '#9fb0c6'; cx.lineWidth = 2; cx.stroke();
        const lab = S3(f.mundo[0][0], f.mundo[0][1], f.level * sobe); cx.fillStyle = '#6b7c95'; cx.font = '700 32px Geologica, system-ui, sans-serif'; cx.textAlign = 'left'; cx.fillText(f.label, lab[0] + 14, lab[1] + 6); });
      cx.globalAlpha = 1; const want = L3 * ease(cl((t - 0.3) / 0.7)); let acc = 0; cx.beginPath(); let head = S3(...pts3[0]); cx.moveTo(...head);
      for (let i = 1; i < pts3.length; i++) { const s = seg3[i - 1]; if (acc + s <= want) { head = S3(...pts3[i]); cx.lineTo(...head); acc += s; } else { const r = s ? (want - acc) / s : 0; const a = pts3[i - 1], b = pts3[i]; head = S3(a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, a[2] + (b[2] - a[2]) * r); cx.lineTo(...head); break; } }
      cx.lineCap = cx.lineJoin = 'round'; cx.strokeStyle = '#fff'; cx.lineWidth = 22; cx.stroke(); cx.strokeStyle = COR.verde; cx.lineWidth = 12; cx.stroke();
      const s0 = S3(...pts3[0]); cx.beginPath(); cx.arc(s0[0], s0[1], 12, 0, 7); cx.fillStyle = COR.tinta; cx.fill(); cx.beginPath(); cx.arc(head[0], head[1], 14, 0, 7); cx.fillStyle = COR.verde; cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 4; cx.stroke();
    }
    function quadro(t) {
      cx.clearRect(0, 0, W, H);
      const k = ATOS.findIndex(([a, b]) => t >= a && t < b); ato(k < 0 ? 5 : k);
      if (t < ATOS[2][0]) {
        /* 1 e 2: calçadas */
        cam = camCampus; campus(1);
        d.arestas.forEach(([a, b]) => { cx.beginPath(); cx.moveTo(...S(d.nos[a])); cx.lineTo(...S(d.nos[b])); cx.strokeStyle = '#cfd8e4'; cx.lineWidth = 8; cx.lineCap = 'round'; cx.stroke(); });
        const tv = cl(t / (ATOS[0][1] - 0.4)); const n = Math.ceil(d.ordem.length * ease(tv));
        d.ordem.slice(0, n).forEach(([no, , pai], i) => { if (pai >= 0) { cx.beginPath(); cx.moveTo(...S(d.nos[pai])); cx.lineTo(...S(d.nos[no])); cx.strokeStyle = COR.azul; cx.lineWidth = 10; cx.stroke(); } const s = S(d.nos[no]); cx.beginPath(); cx.arc(s[0], s[1], i === n - 1 && tv < 1 ? 18 : 11, 0, 7); cx.fillStyle = i === n - 1 && tv < 1 ? COR.ambar : COR.azul; cx.fill(); });
        ponto(d.inicio, COR.tinta, 18); texto(d.inicio, 'Portaria');
        d.entradas.forEach((e) => { if (dist[e.no] === undefined || !d.ordem.slice(0, n).some(([no]) => no === e.no)) return; texto(e.pos, t < ATOS[1][0] ? `${Math.round(dist[e.no])} m` : `${e.total}`, t >= ATOS[1][0] && e === escolhida ? '#fff' : COR.tinta, 32, t >= ATOS[1][0] && e === escolhida ? COR.verde : '#fff'); });
        if (t < ATOS[1][0]) legenda('Calçadas: Dijkstra', `${n} de ${d.ordem.length} pontos visitados, do mais perto para o mais longe`);
        else { const tt = ease(cl((t - ATOS[1][0]) / 1.6)); linha(foraPts, COR.claro, 12, tt, COR.tinta); legenda('Qual entrada?', d.entradas.map((e) => `${e.nome.replace('entrada ', '').replace('do ', '')}: ${e.total}`).join(' · ') + ' (calçada + dentro)'); }
        return;
      }
      if (t < ATOS[4][0]) {
        /* 3 e 4: térreo */
        const z = ease(cl((t - ATOS[2][0]) / 1.2)); cam = mix(camCampus, camBloco, z); campus(1 - z * 0.6); andar(0, z); linha(foraPts, COR.claro, 10, 1, COR.tinta);
        if (t < ATOS[3][0]) { const tb = cl((t - ATOS[2][0] - 1) / 2.6); const n = busca(b0, ease(tb));
          if (tb >= 1) { const tl = cl((t - ATOS[2][0] - 3.7) / 1.2); cx.setLineDash([10, 10]); linha(b0.grade.map(wp), COR.laranja, 6, 1); cx.setLineDash([]); linha(b0.final.map(wp), COR.claro, 10, ease(tl), COR.tinta); }
          legenda('Térreo: A*', tb < 1 ? `${n.toLocaleString('pt-BR')} células visitadas, indo em direção à subida` : 'Laranja: o caminho da grade · verde: alisado, em linha reta onde dá');
        } else { busca(b0, 1, 0.25); linha(b0.final.map(wp), COR.claro, 10, 1, COR.tinta);
          const zs = d.andares[0].zonas; const pulso = 0.5 + 0.5 * Math.sin(t * 6);
          zs.filter((zz) => zz.k === 'stairs' || zz.k === 'ramp').forEach((zz) => { const ok = (zz.k === 'stairs') === (d.via === 'escada'); poly(zz.p.map(wp), ok ? `rgba(92,158,67,${0.35 + 0.35 * pulso})` : 'rgba(59,106,194,.25)', ok ? COR.verde : COR.azul, 3); const c = zz.p.reduce((s, q) => [s[0] + q[0] / zz.p.length, s[1] + q[1] / zz.p.length], [0, 0]); const v = d.vias.find((x) => x.via === (zz.k === 'stairs' ? 'escada' : 'rampa')); texto(wp(c), `${zz.k === 'stairs' ? 'Escada' : 'Rampa'} ${v.custo}`, ok ? '#fff' : COR.tinta, 30, ok ? COR.verde : '#fff'); });
          legenda('Escada ou rampa?', `Escada ${d.vias[0].custo} (cada andar pesa ${String(d.vias[0].peso).replace('.', ',')}×) · rampa ${d.vias[1].custo} · vence a ${d.via}`);
        }
        return;
      }
      if (t < ATOS[5][0]) {
        /* 5: 2º andar */
        cam = camBloco; const tf = ease(cl((t - ATOS[4][0]) / 0.8)); andar(0, 1 - tf); andar(2, tf, d.destino.split(' ')[1]);
        const tb = cl((t - ATOS[4][0] - 0.8) / 2); const n = busca(b2, ease(tb));
        if (tb >= 1) { const tl = cl((t - ATOS[4][0] - 2.9) / 1); linha(b2.final.map(wp), COR.claro, 10, ease(tl), COR.tinta); ponto(wp(b2.final.at(-1)), COR.verde, 13); if (tl >= 1) texto(wp(b2.final.at(-1)), d.destino.split(' · ')[0], '#fff', 30, COR.verde); }
        legenda(`${d.andares[2].label}: A*`, tb < 1 ? `${n.toLocaleString('pt-BR')} células, do alto da ${d.via} até a porta` : `Chegou à porta do ${d.destino.split(' · ')[0]}`);
        return;
      }
      /* 6: a rota inteira, nos três andares */
      const t6 = cl((t - ATOS[5][0]) / (ATOS[5][1] - ATOS[5][0])); cena3d(t6);
      legenda('A rota inteira', t6 < 0.95 ? 'Calçada, térreo, escada pelo 1º andar e 2º andar' : `${d.rota.metros} m · cerca de ${d.rota.minutos} min a pé (metros ÷ 75)`);
    }
    if (reduce || soFinal) { quadro(ATOS[5][1] - 0.01); return; }
    const t0 = performance.now();
    await new Promise((ok) => { const f = (now) => { if (me !== run) return ok(); const t = (now - t0) / 1000; quadro(Math.min(t, ATOS[5][1] - 0.001)); if (t < FIM) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    if (me === run && slide.classList.contains('active')) animar(canvas);
  }
  function enter(slide) { const c = slide.querySelector('canvas[data-rota]'); if (c) animar(c); else run++; }
  document.querySelectorAll('canvas[data-rota]').forEach((c) => animar(c, true));
  new MutationObserver((list) => list.forEach((m) => { if (m.target.classList?.contains('slide') && m.target.classList.contains('active') && !String(m.oldValue).includes('active')) enter(m.target); }))
    .observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const first = document.querySelector('.slide.active'); if (first) enter(first);
})();
