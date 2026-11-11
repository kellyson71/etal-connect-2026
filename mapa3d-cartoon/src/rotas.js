import { fracaoRampa } from './subidas.js';
/* Rotas até uma sala do bloco principal. É a mesma lógica do protótipo (planFor, gridPath, doorOf em
   prototipo/campus3d.js): escolhe a combinação mais rápida de entrada e de escada ou rampa, anda pelo meio dos
   corredores e devolve o trajeto inteiro desde a portaria. Aqui o resultado já sai em 3D, em metros. */
import { PLAN, wp, FH, zonePoly, inPoly } from './dados.js';

const START = [15, 47];
const [VB_W, VB_H] = PLAN.viewBox.split(' ').slice(2).map(Number);
const SCALE = (PLAN.world.sx + PLAN.world.sy) / 2;
const polyLen = (L) => L.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - L[i][0], q[1] - L[i][1]), 0);

const PATHS = new Map();
export function gridPath(level, start, goal) {
  if (!PLAN.floors[level] || !start || !goal) return null;
  const cacheKey = `${level}|${start}|${goal}`; if (PATHS.has(cacheKey)) return PATHS.get(cacheKey);
  const f = PLAN.floors[level]; const STEP = 5;
  f.corridors.forEach((c) => { if (c.points && !c.poly) c.poly = c.points.split(' ').map((q) => q.split(',').map(Number)); });
  const inC = (x, y) => f.corridors.some((c) => (c.poly ? inPoly(x, y, c.poly) : x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h));
  const key = (x, y) => `${x},${y}`; const snap = (p) => [Math.round(p[0] / STEP) * STEP, Math.round(p[1] / STEP) * STEP];
  const nearest = (p) => { let best = null, bd = Infinity; for (let x = 0; x <= VB_W; x += STEP) for (let y = 0; y <= VB_H; y += STEP) if (inC(x, y)) { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = [x, y]; } } return best; };
  const s = inC(...snap(start)) ? snap(start) : nearest(start); const g = inC(...snap(goal)) ? snap(goal) : nearest(goal);
  if (!s || !g) return null;
  const segment = (a, b) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]))); return Array.from({length:n+1}, (_,i) => inC(a[0]+(b[0]-a[0])*i/n, a[1]+(b[1]-a[1])*i/n)).every(Boolean); };
  /* Entradas e portas ficam na borda (ou um pouco fora) dos corredores: a rota começa e termina no ponto de corredor
     mais próximo, como no mapa original. Limitar essa distância deixava a entrada principal sem uso. */
  const cost = new Map([[key(...s), 0]]); const prev = new Map(); const open = []; const seen = new Set();
  const push = (point, value) => { let i=open.length;open.push({point,value});while(i){const parent=(i-1)>>1;if(open[parent].value<=value)break;open[i]=open[parent];i=parent;}open[i]={point,value}; };
  const pop = () => {const first=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let c=i*2+1;if(c+1<open.length&&open[c+1].value<open[c].value)c++;if(open[c].value>=last.value)break;open[i]=open[c];i=c;}open[i]=last;}return first.point;};
  const heuristic = p => Math.hypot(p[0]-g[0],p[1]-g[1]);push(s,heuristic(s));
  while (open.length) {
    const u = pop(); const ku = key(...u); if (seen.has(ku)) continue; seen.add(ku);
    if (u[0] === g[0] && u[1] === g[1]) break;
    [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]].forEach(([dx, dy]) => {
      const v = [u[0] + dx, u[1] + dy]; if (!inC(v[0], v[1]) || !segment(u,v)) return;
      const edge = inC(v[0] - 10, v[1]) && inC(v[0] + 10, v[1]) && inC(v[0], v[1] - 10) && inC(v[0], v[1] + 10) ? 1 : 1.8;
      const turn = prev.has(ku) ? (key(u[0] - dx, u[1] - dy) === prev.get(ku) ? 0 : 3) : 0;
      const nc = cost.get(ku) + edge * STEP + turn; const kv = key(...v);
      if (nc < (cost.get(kv) ?? Infinity)) { cost.set(kv, nc); prev.set(kv, ku); push(v,nc+heuristic(v)); }
    });
  }
  if (!seen.has(key(...g))) return null;
  const path = []; let cur = key(...g); while (cur) { path.unshift(cur.split(',').map(Number)); cur = prev.get(cur); }
  const full = [start, ...path, goal];
  const simple = full.filter((q, i) => i === 0 || i === full.length - 1 || !((full[i - 1][0] === q[0] && q[0] === full[i + 1][0]) || (full[i - 1][1] === q[1] && q[1] === full[i + 1][1])));
  // Remove a escadinha da grade só quando todo o segmento permanece no corredor.
  const clean = [simple[0]]; let at = 0;
  while (at < simple.length - 1) {
    let next = at + 1;
    for (let j = simple.length - 1; j > at + 1; j--) if (segment(simple[at], simple[j])) { next = j; break; }
    clean.push(simple[next]); at = next;
  }
  PATHS.set(cacheKey, clean); return clean;
}
export const zonaDe = (level, id) => PLAN.floors[level]?.zones.find((z) => z.id === id || z.roomNumber === String(id));
/* Porta da sala: a que a planta liga a ela; sem essa ligação, a porta mais próxima da sala (salas que abrem para
   outra sala, como a Direção e o Gabinete); em último caso, o centro. É a regra do mapa original, com a ligação na frente. */
export function doorOf(level, z) {
  const doors = PLAN.floors[level]?.doors || []; const door = doors.find((d) => d.zoneId === z.id);
  if (door) return [door.x, door.y];
  const p = zonePoly(z); const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const d = (q) => Math.hypot(Math.max(bb[0] - q.x, 0, q.x - bb[2]), Math.max(bb[1] - q.y, 0, q.y - bb[3]));
  const perto = doors.slice().sort((a, b) => d(a) - d(b))[0];
  return perto && d(perto) < 6 ? [perto.x, perto.y] : [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
}
const ENTRANCES = {
  principal: { name: 'entrada principal', plan: PLAN.entrances.principal, campus: [START, [13.3, 11], [15, -4], [18.4, -11.5]] },
  auditorio: { name: 'entrada do auditório', plan: PLAN.entrances.auditorio, campus: [START, [13.3, 11], [-23, 8], [-27, -8], [-27.3, -19]] },
  anexo: { name: 'entrada do Anexo', plan: PLAN.entrances.anexo, campus: [START, [13.3, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-44.6, -66], [-39, -61.5], [-27, -60], [-20, -56], [-17.8, -52]] }, // porta de vidro norte do bloco
};
const VERTS = (() => {
  const f = PLAN.floors[1]; const st = f.zones.find((q) => q.kind === 'stairs');
  const footS = [st.x + st.w + 8, st.y + st.h - 8]; const xw = st.x + st.w * 0.27, xe = st.x + st.w * 0.73, ys = st.y + st.h - 6, yn = st.y + 10;
  return {
    /* escada do modelo novo: sobe pelo lance da esquerda, vira no patamar e volta pelo da direita */
    escada: { where: 'da ala oeste', foot: footS, enter: [footS, [xw, ys]], loop: [[xw, ys], [xw, yn], [xe, yn], [xe, ys]], exit: [footS], weight: 1.6 },
    rampa: { where: 'do lado leste', foot: PLAN.rampFoot, enter: [PLAN.rampFoot], loop: PLAN.rampLoop, exit: [], weight: 1 },
  };
})();

/* Salas que abrem para outra sala (Direção → Gabinete → Sala de estar): segue as portas até achar uma que dê num
   corredor. Devolve as portas da de fora para a de dentro; a rota anda pelo corredor até a primeira e depois atravessa
   as salas. Sem isso, a porta "mais perto do corredor" podia ficar do outro lado de uma parede. */
function cadeiaDePortas(level, z, prof = 0) {
  const f = PLAN.floors[level]; const door = doorOf(level, z); if (!door) return null;
  f.corridors.forEach((c) => { if (c.points && !c.poly) c.poly = c.points.split(' ').map((q) => q.split(',').map(Number)); });
  const inC = (x, y) => f.corridors.some((c) => (c.poly ? inPoly(x, y, c.poly) : x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h));
  const lados = [[0, 6], [0, -6], [6, 0], [-6, 0]];
  if (lados.some(([dx, dy]) => inC(door[0] + dx, door[1] + dy)) || prof > 3) return [door];
  const dentro = (q) => inPoly(q[0], q[1], zonePoly(z));
  for (const [dx, dy] of lados) {
    const q = [door[0] + dx, door[1] + dy]; if (dentro(q)) continue;
    const vizinha = f.zones.find((o) => o.id !== z.id && !['courtyard', 'ramp', 'stairs', 'wall'].includes(o.kind) && inPoly(q[0], q[1], zonePoly(o)));
    if (vizinha) { const resto = cadeiaDePortas(level, vizinha, prof + 1); if (resto) return [...resto, door]; }
  }
  return [door];
}

/* Trajeto da portaria até a porta da sala. Devolve pontos [x, altura, z] e os marcos da viagem. */
export function planejar(level, zonaId, forcar) {
  if (![0,1,2].includes(level) || (forcar && !['rampa','escada'].includes(forcar))) return null;
  const z = zonaDe(level, zonaId); if (!z || z.closed) return null; const cadeia = cadeiaDePortas(level, z); if (!cadeia) return null; const goal = cadeia[0]; let best = null;
  Object.entries(ENTRANCES).forEach(([eid, e]) => (level ? (forcar ? [forcar] : ['escada', 'rampa']) : [null]).forEach((vid) => {
    const v = vid && VERTS[vid]; const a = gridPath(0, e.plan, v ? v.foot : goal); const b = v ? gridPath(level, v.foot, goal) : [];
    if (!a || (v && !b)) return;
    const cost = polyLen(e.campus) + (polyLen(a) + polyLen(b)) * SCALE + (v ? polyLen(v.loop) * SCALE * v.weight * level : 0);
    if (!best || cost < best.cost) best = { cost, eid, vid, a, b };
  }));
  if (!best) return null;
  const H = (l) => l * FH + 0.03; const P3 = (q, l) => { const w = wp(q); return [w[0], H(l), w[1]]; };
  const e = ENTRANCES[best.eid]; const pts = e.campus.map(([x, y], i) => [x, i < 2 ? 0.08 : 0.03, y]); const iEntrada = pts.length - 1;
  best.a.forEach((q) => pts.push(P3(q, 0))); let iSobe = pts.length - 1, iChega = pts.length - 1;
  if (best.vid) {
    const V = VERTS[best.vid]; const total = polyLen(V.loop);
    V.enter.forEach((q) => pts.push(P3(q, 0))); iSobe = pts.length - 1;
    for (let l = 0; l < level; l++) { let run = 0; V.loop.forEach((q, i) => { if (i) run += Math.hypot(q[0] - V.loop[i - 1][0], q[1] - V.loop[i - 1][1]); if (i || l) pts.push(P3(q, l + (best.vid === 'rampa' ? fracaoRampa(q,i,V.loop) : [0,0.5,0.5,1][i]))); }); }
    V.exit.forEach((q) => pts.push(P3(q, level))); iChega = pts.length - 1;
    best.b.slice(1).forEach((q) => pts.push(P3(q, level)));
  }
  /* atravessa as salas intermediárias até a porta da sala de destino */
  cadeia.slice(1).forEach((q) => pts.push(P3(q, level)));
  const metros = pts.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2]), 0);
  const pw = zonePoly(z).map(wp); const centro = pw.reduce((a, q) => [a[0] + q[0] / pw.length, a[1] + q[1] / pw.length], [0, 0]);
  return { door: P3(cadeia.at(-1), level), pts, iEntrada, iSobe, iChega, level, zona: z, poly: pw, centro, entrada: e.name, via: best.vid, onde: best.vid && VERTS[best.vid].where, metros, minutos: Math.max(1, Math.round(metros / 75)) };
}
