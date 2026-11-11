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

/* ---------- caminhos externos ----------
   Os caminhos a pé do mapa original (prototipo/campus3d.js, ROUTES) viram um grafo: pontos a menos de 1,5 m são o mesmo
   nó. Assim a rota pode ir de qualquer entrada do bloco a qualquer lugar de fora pelo caminho mais curto, em vez de
   sempre sair da portaria. */
const CAMINHOS = [
  [START, [13, 11], [15, -4], [18.4, -11.5]], [START, [13, 11], [6, 3]], [START, [13, 11], [19, 3]], [START, [13, 11], [-24, 11], [-30, 9]],
  [START, [13, 11], [-23, 8], [-27, -8], [-27.3, -19]], [[-27, -8], [-48, -13], [-52.5, -24]],
  [[-48, -13], [-49.5, -50], [-50.5, -58.5], [-59, -58.5]], [[-49.5, -50], [-50, -68], [-41, -74], [-37.5, -80], [-32.5, -81.5]],
  [[-50.5, -58.5], [-61.5, -57.8]], [[-50, -68], [-44.6, -66], [-38.5, -62], [-37.8, -65]], [[-44.6, -66], [-39, -61.5], [-28, -61.5], [-22.5, -66]],
  [[-39, -61.5], [-27, -60], [-20, -56], [-17.8, -52]], [START, [13, 30], [12.6, 16]],
];
export const PONTOS = {
  'bebedouro-anexo': { nome: 'Bebedouro', onde: 'Entrada do Anexo', fora: [-32.5, -81.5] },
  'bebedouro-cantina': { nome: 'Bebedouro', onde: 'Cantina', fora: [-61.5, -57.8] },
  /* no patamar da rampa, canto inferior esquerdo, só no 1º andar (planta) */
  'bebedouro-patamar': { nome: 'Bebedouro', onde: 'Bloco principal, 1º andar (patamar da rampa)', dentro: { level: 1, p: [860, 532] } },
};
const GRAFO = (() => {
  const nos = [], ares = new Map();
  const no = (p) => { let i = nos.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.5); if (i < 0) { i = nos.length; nos.push(p); ares.set(i, []); } return i; };
  CAMINHOS.forEach((L) => L.slice(1).forEach((q, k) => { const a = no(L[k]), b = no(q); if (a === b) return; const d = Math.hypot(nos[a][0] - nos[b][0], nos[a][1] - nos[b][1]); ares.get(a).push([b, d]); ares.get(b).push([a, d]); }));
  return { nos, ares, no: (p) => nos.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.5) };
})();
/* menor caminho externo entre dois pontos que estão no grafo */
function caminhoFora(a, b) {
  const s = GRAFO.no(a), g = GRAFO.no(b); if (s < 0 || g < 0) return null;
  const dist = new Map([[s, 0]]), prev = new Map(), feito = new Set();
  while (true) {
    let u = -1, du = Infinity; dist.forEach((d, k) => { if (!feito.has(k) && d < du) { du = d; u = k; } });
    if (u < 0) return null; if (u === g) break; feito.add(u);
    GRAFO.ares.get(u).forEach(([v, d]) => { if (du + d < (dist.get(v) ?? Infinity)) { dist.set(v, du + d); prev.set(v, u); } });
  }
  const out = []; let c = g; while (c !== undefined) { out.unshift(GRAFO.nos[c]); c = prev.get(c); }
  return out;
}

/* ---------- trechos dentro do bloco ---------- */
const H = (l) => l * FH + 0.03; const P3 = (q, l) => { const w = wp(q); return [w[0], H(l), w[1]]; };
/* subida (ou descida) de um andar a outro pela escada ou rampa, em pontos 3D */
function subida(vid, de, ate) {
  const V = VERTS[vid]; const out = []; const sobe = ate > de;
  const um = (l) => { const pts = []; V.loop.forEach((q, i) => pts.push(P3(q, l + (vid === 'rampa' ? fracaoRampa(q, i, V.loop) : [0, 0.5, 0.5, 1][i])))); return pts; };
  for (let l = Math.min(de, ate); l < Math.max(de, ate); l++) { const t = um(l); out.push(...(l === Math.min(de, ate) ? t : t.slice(1))); }
  return sobe ? out : out.reverse();
}
/* de um ponto da planta (andar A) a outro (andar B), dentro do bloco; escolhe escada ou rampa */
function trechoDentro(lA, pA, lB, pB, forcar) {
  if (lA === lB) { const g = gridPath(lA, pA, pB); return g && { pts: g.map((q) => P3(q, lA)), via: null, iSobe: -1, iChega: -1, custo: polyLen(g) * SCALE }; }
  let best = null;
  (forcar ? [forcar] : ['escada', 'rampa']).forEach((vid) => {
    const V = VERTS[vid]; const a = gridPath(lA, pA, V.foot), b = gridPath(lB, V.foot, pB); if (!a || !b) return;
    const custo = (polyLen(a) + polyLen(b)) * SCALE + polyLen(V.loop) * SCALE * V.weight * Math.abs(lB - lA);
    if (best && custo >= best.custo) return;
    const ida = lB > lA; const pts = a.map((q) => P3(q, lA));
    if (ida) V.enter.forEach((q) => pts.push(P3(q, lA)));
    const iSobe = pts.length - 1; pts.push(...subida(vid, lA, lB));
    if (ida) V.exit.forEach((q) => pts.push(P3(q, lB))); else V.enter.slice().reverse().forEach((q) => pts.push(P3(q, lB)));
    const iChega = pts.length - 1; b.slice(1).forEach((q) => pts.push(P3(q, lB)));
    best = { pts, via: vid, iSobe, iChega, custo };
  });
  return best;
}
const metrosDe = (pts) => pts.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2]), 0);
const campus3 = (L) => L.map(([x, y], i) => [x, i < 2 ? 0.08 : 0.03, y]);

/* ---------- destinos e origens ----------
   Destino: { level, zonaId } (sala) ou { ponto: id } (bebedouro). Origem: null (portaria) ou { level, zonaId } (sala).
   Devolve pontos 3D e os marcos da viagem: iEntrada (onde entra no bloco), iSobe e iChega (escada ou rampa). */
function alvoDentro(dest) {
  if (dest.ponto) { const P = PONTOS[dest.ponto]; return P?.dentro ? { level: P.dentro.level, cadeia: [P.dentro.p], zona: null, ponto: P } : null; }
  const z = zonaDe(dest.level, dest.zonaId); if (!z || z.closed) return null;
  const cadeia = cadeiaDePortas(dest.level, z); return cadeia && { level: dest.level, cadeia, zona: z };
}
function saidaDe(origem) {
  const z = zonaDe(origem.level, origem.zonaId); if (!z) return null;
  const cadeia = cadeiaDePortas(origem.level, z); return cadeia && { level: origem.level, cadeia: cadeia.slice().reverse(), zona: z };
}
export function rota(dest, origem = null, forcar = null) {
  if (forcar && !['rampa', 'escada'].includes(forcar)) return null;
  const alvo = alvoDentro(dest); const fora = dest.ponto && PONTOS[dest.ponto]?.fora;
  if (!alvo && !fora) return null;
  const src = origem && saidaDe(origem); if (origem && !src) return null;
  let best = null; const tenta = (r) => { if (r && (!best || r.custo < best.custo)) best = r; };
  if (src && alvo) {
    /* de sala a sala: tudo por dentro */
    const t = trechoDentro(src.level, src.cadeia.at(-1), alvo.level, alvo.cadeia[0], forcar);
    if (t) tenta({ ...t, pts: [...src.cadeia.slice(0, -1).map((q) => P3(q, src.level)), ...t.pts, ...alvo.cadeia.slice(1).map((q) => P3(q, alvo.level))], iEntrada: 0, entrada: null, iSobe: t.iSobe + src.cadeia.length - 1, iChega: t.iChega + src.cadeia.length - 1 });
  } else if (alvo) {
    /* da portaria a uma sala: escolhe a entrada */
    Object.values(ENTRANCES).forEach((e) => { const t = trechoDentro(0, e.plan, alvo.level, alvo.cadeia[0], forcar); if (!t) return; const fora3 = campus3(e.campus); const n = fora3.length; tenta({ ...t, custo: t.custo + polyLen(e.campus), pts: [...fora3, ...t.pts, ...alvo.cadeia.slice(1).map((q) => P3(q, alvo.level))], iEntrada: n - 1, entrada: e.name, iSobe: t.iSobe < 0 ? -1 : t.iSobe + n, iChega: t.iChega < 0 ? -1 : t.iChega + n }); });
  } else if (src) {
    /* de uma sala a um lugar de fora: sai pela entrada que der o menor caminho */
    Object.values(ENTRANCES).forEach((e) => {
      const t = trechoDentro(src.level, src.cadeia.at(-1), 0, e.plan, forcar); const porta = e.campus.at(-1); const ext = caminhoFora(porta, fora); if (!t || !ext) return;
      const dentro = [...src.cadeia.slice(0, -1).map((q) => P3(q, src.level)), ...t.pts]; const k = src.cadeia.length - 1;
      tenta({ ...t, custo: t.custo + polyLen(ext), pts: [...dentro, ...campus3(ext)], iEntrada: 0, iSaida: dentro.length - 1, entrada: null, saida: e.name, iSobe: t.iSobe < 0 ? -1 : t.iSobe + k, iChega: t.iChega < 0 ? -1 : t.iChega + k });
    });
  } else {
    /* da portaria a um lugar de fora */
    const ext = caminhoFora(START, fora); if (ext) tenta({ pts: campus3(ext), custo: polyLen(ext), via: null, iSobe: -1, iChega: -1, iEntrada: ext.length - 1, entrada: null });
  }
  if (!best) return null;
  const pts = best.pts; const metros = metrosDe(pts);
  const level = alvo ? alvo.level : 0; const z = alvo?.zona || null;
  const pw = z ? zonePoly(z).map(wp) : null; const fim = pts.at(-1);
  const centro = pw ? pw.reduce((a, q) => [a[0] + q[0] / pw.length, a[1] + q[1] / pw.length], [0, 0]) : [fim[0], fim[2]];
  return {
    pts, iEntrada: best.iEntrada, iSaida: best.iSaida ?? -1, iSobe: best.iSobe, iChega: best.iChega, level, zona: z, poly: pw, centro,
    door: fim, entrada: best.entrada, saida: best.saida || null, via: best.via, onde: best.via && VERTS[best.via].where,
    ponto: dest.ponto ? { id: dest.ponto, ...PONTOS[dest.ponto] } : null, externo: !alvo, origem: src ? { level: src.level, zona: src.zona } : null,
    portaVista: alvo ? portaVista(level, alvo.cadeia.at(-1)) : null,
    metros, minutos: Math.max(1, Math.round(metros / 75)),
  };
}
/* Para onde a porta olha (o lado do corredor), em direção do mapa: serve à câmera da chegada. */
function portaVista(level, p) {
  const f = PLAN.floors[level];
  const inC = (x, y) => f.corridors.some((c) => (c.poly ? inPoly(x, y, c.poly) : x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h));
  const lado = [[0, 8], [0, -8], [8, 0], [-8, 0]].find(([dx, dy]) => inC(p[0] + dx, p[1] + dy));
  return lado ? [Math.sign(lado[0]), Math.sign(lado[1])] : null;
}
/* compatível com as chamadas antigas */
export function planejar(level, zonaId, forcar, origem = null) { return rota({ level, zonaId }, origem, forcar); }
/* bebedouro mais perto, pela rota real a partir da origem */
export function maisPerto(prefixo, origem = null) {
  let best = null; Object.keys(PONTOS).filter((k) => k.startsWith(prefixo)).forEach((k) => { const r = rota({ ponto: k }, origem); if (r && (!best || r.metros < best.metros)) best = r; });
  return best;
}
