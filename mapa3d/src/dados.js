/* Dados do campus para o modelo novo.
   Tudo vem dos mesmos arquivos do protótipo (levantamento, planta de 2012, entorno, copas do satélite).
   As listas de prédios e as medidas abaixo são as de prototipo/campus3d.js, que já foram conferidas:
   aqui nada muda de lugar, só ganha detalhe. Coordenadas em metros; +y é a frente (rodovia). */

const W = window;
export const E = W.CAMPUS.elementos;
export const LIMPO = W.CAMPUS_LIMPO || { survey: {}, fundo: {}, extras: {} };
export const FUNDO = W.CAMPUS_FUNDO || [];
export const ENT = W.CAMPUS_ENTORNO || { roads: [], streets: [], green: [], trees: [], lots: [], fences: [], small: [], big: [] };
export const VERDE = W.CAMPUS_VERDE || null;
export const PLAN = W.PLAN;
export const XT = LIMPO.extras;

export const pts = (i) => LIMPO.survey[i] || (E[i] && E[i].pontos) || null;
export const F = (n) => LIMPO.fundo[n] || FUNDO.find((e) => e.nome === n)?.pontos || null;
export const FP = (n) => FUNDO.filter((e) => e.nome === n && e.tipo === 'Point').map((e) => e.pontos[0]);

export const NORTH = [-0.9984, 0.0573], EAST = [-0.0573, -0.9984];
export const SITE = { lat: -6.146, lon: -38.205, tz: -3, doy: 330 };
/* Sol de Pau dos Ferros em 26/11: elevação e azimute (a partir do norte, sentido horário), em graus. */
export function sunAt(h) {
  const r = Math.PI / 180, dec = 23.44 * Math.sin((360 / 365) * (284 + SITE.doy) * r);
  const B = (360 / 365) * (SITE.doy - 81) * r, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solar = h + (SITE.lon - SITE.tz * 15) / 15 + eot / 60;
  const H = 15 * (solar - 12) * r, la = SITE.lat * r, d = dec * r;
  const el = Math.asin(Math.sin(la) * Math.sin(d) + Math.cos(la) * Math.cos(d) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(la) - Math.tan(d) * Math.cos(la)) + Math.PI;
  return { el: el / r, az: (az / r + 360) % 360 };
}

export const ROAD_Y0 = 66.2, ROAD_Y1 = 76.6, ROAD_MID = 71.4;
/* Portaria (x): guarita de 8,9 a 11,5, entre o portão de veículos (1,5–8,5) e o de pedestres (11,5–15,05), que fica de
   frente para a passarela da entrada. PEDESTRE é o vão no muro (guarita + portão). */
export const GUARITA = [8.9, 11.5, 15.05];
export const PEDESTRE = [8.7, 15.05];
export const CROSS_X = 14, CROSS_W = 4;
export const APTO = [[14.2, 95.6], [34.6, 95.6], [34.6, 120.6], [14.2, 120.6]];
export const FH = 3.45; // altura de um pavimento do bloco principal (pé-direito de 3,00 m + laje)
export const AUD_H = 9;
export const ENTRY_H = 6.2;

const geom = (list) => list.map((b) => ({ ...b, p: b.pontos || pts(b.el) })).filter((b) => b.p);

export const BUILDINGS = geom([
  { id: 'principal', el: 0, h: 11.7, floors: 3, label: 'Bloco principal' },
  { id: 'anexo', el: 1, h: 7.4, floors: 2, label: 'Anexo', skylight: true },
  { id: 'laboratorios', el: 3, h: 9.3, floors: 2, label: 'Bloco dos Laboratórios', solar: 0.86 },
  { id: 'cantina', el: 4, h: 4.8, floors: 1, label: 'Cantina', solar: 0.88 },
  { id: 'diretoria', el: 6, h: 4.8, floors: 1, label: 'Direção Geral' },
  { id: 'biblioteca', el: 7, h: 4.8, floors: 1, label: 'Biblioteca' },
  { id: 'portaria', el: 8, h: 3.35, floors: 0, kind: 'gate', label: 'Portaria' },
  { id: 'portao-veiculos', pontos: [[1.5, 47.9], [8.5, 47.9], [8.5, 48.8], [1.5, 48.8]], h: 2.6, kind: 'gate', vehicles: true },
  { id: 'auxiliar', pontos: F('predio auxiliar'), h: 4.8, floors: 1, label: 'Prédio auxiliar' },
  { id: 'coliseu', pontos: F('colisel'), h: 3.2, kind: 'hex', label: 'Coreto' },
  { id: 'centro-medico', pontos: F('centro medico'), h: 4.8, floors: 1, label: 'Centro médico' },
  { id: 'vestiario', pontos: F('vestiario'), h: 4.8, floors: 1, label: 'Vestiário' },
  { id: 'obelisco', pontos: [[9.9, 12.3], [11.2, 12.3], [11.2, 12.8], [9.9, 12.8]], h: 5.6, kind: 'stele', label: 'Obelisco' },
  { id: 'manutencao', pontos: F('quartinho de manutencao'), h: 3, floors: 0 },
  { id: 'ginasio', pontos: F('quadra'), h: 8, rise: 3.6, kind: 'gym', label: 'Ginásio' },
  { id: 'predio-nadic', pontos: F('predio nadic 2 andares'), h: 9.4, floors: 2, kind: 'obra', label: 'Novo prédio (em obras)' },
  { id: 'academia', pontos: F('Polígono sem título'), h: 4.8, floors: 1, label: 'Academia' },
  { id: 'estufa', pontos: F('jardim (estufa simples)'), h: 2.8, kind: 'greenhouse', label: 'Estufa' },
  { id: 'casa-mel', pontos: F('casa do mel'), h: 4.8, floors: 1, tile: true, label: 'Casa do Mel' },
  { id: 'seu-assis', pontos: F('seu assis (restaurante famioliar ao lado)'), h: 7.4, floors: 2, tile: true, label: 'Seu Assis' },
  { id: 'apartamentos', pontos: APTO, h: 13.4, floors: 4, kind: 'apto', label: 'Apartamentos' },
  { id: 'brisanet', pontos: [[-128, 120], [-66, 120], [-66, 152], [-128, 152]], h: 8, kind: 'loja', label: 'Brisanet' },
  { id: 'eletrica', pontos: [[15.5, 121.2], [30.5, 121.2], [30.5, 141], [15.5, 141]], h: 4, kind: 'bar', label: 'Elétrica' },
]);
export const COVERS = geom([
  { id: 'patio', el: 5, h: 7.2, label: 'Pátio' },
  { id: 'coberta', el: 18, h: 4.8, label: 'Coberta', wood: true },
]);
export const FLATS = geom([
  { id: 'piscina', pontos: F('area da piscina'), label: 'Piscina' },
  { id: 'volei', pontos: F('quadra de volei'), label: 'Vôlei' },
  { id: 'campo', pontos: F('campo de futeboll'), label: 'Campo' },
]);
export const byId = (id) => [...BUILDINGS, ...COVERS, ...FLATS].find((b) => b.id === id);

/* ---------- geometria no plano ---------- */
export const centroid = (p) => p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
export const inPoly = (x, y, p) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  }
  return c;
};
export const signedArea = (p) => p.reduce((s, q, i) => { const n = p[(i + 1) % p.length]; return s + q[0] * n[1] - n[0] * q[1]; }, 0) / 2;
export const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export function rng(seed) { let x = seed; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); }
/* Desloca o contorno: d > 0 para dentro, d < 0 para fora. */
export function insetPoly(p, d) {
  const n = p.length; const s = signedArea(p) > 0 ? 1 : -1;
  const lines = p.map((a, i) => { const b = p[(i + 1) % n]; const L = dist(a, b) || 1; const nx = (-(b[1] - a[1]) / L) * s, ny = ((b[0] - a[0]) / L) * s; return [[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d]]; });
  return lines.map((l, i) => {
    const m = lines[(i - 1 + n) % n]; const [p1, p2] = m, [p3, p4] = l;
    const den = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    if (Math.abs(den) < 1e-9) return p3;
    const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / den;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  });
}

/* ---------- planta de 2012 → metros do mapa ---------- */
const WORLD = PLAN.world;
export const wp = ([x, y]) => [WORLD.x0 + x * WORLD.sx, WORLD.y0 + y * WORLD.sy];
export const PU = (WORLD.sx + WORLD.sy) / 2; // metros por unidade da planta
export const zonePoly = (z) => (z.points ? z.points.split(' ').map((q) => q.split(',').map(Number)) : [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.h], [z.x, z.y + z.h]]);

/* ---------- árvores (mesma seleção do protótipo) ---------- */
export const GARDEN = {
  edge: [[18.4, 13.2], [33.6, 11.6], [51.2, 44.4], [17.7, 42.9]],
  hub: [29.5, 27.3],
  spokes: [[22.1, 13.2], [19.3, 26.7], [36.6, 19.0], [20.8, 43.1], [46.1, 44.2]],
  trees: [[21.1, 19.0], [29.6, 17.0], [33.9, 22.5], [42.5, 37.5], [22.6, 29.7], [27.0, 37.7], [36.5, 31.4], [24.2, 23.2], [39.0, 27.5]],
  lamp: [25.9, 24.8],
};
/* Duas faixas largas de ixora, uma de cada lado da passarela (foto da entrada). A da esquerda começa depois do totem. */
/* Desnível informado pelo usuário: entre a biblioteca e o Anexo, e no pátio das caixas d'água atrás dele, o terreno
   fica bem abaixo das calçadas (adotado 90 cm). Aqui, s corre para os fundos e w para o lado do muro, a partir do canto do Anexo. */
const AX_D = [-65.077, -100.089], AX_S = [-0.5075, -0.8617], AX_W = [0.8617, -0.5075];
export const noAnexo = (s, w) => [AX_D[0] + AX_S[0] * s + AX_W[0] * w, AX_D[1] + AX_S[1] * s + AX_W[1] * w];
export const BAIXO_H = -0.9;
/* As calçadas são coladas nos prédios (Anexo, biblioteca, ginásio, academia), com 3,2 m e borda amarela tátil.
   O terreno baixo é o que sobra entre elas. */
export const CALCADA_L = 3.2;
export const CALCADAS = ['anexo', 'biblioteca', 'ginasio', 'academia'];
export const BAIXO = [[-24, -7.5], [-24, -3.25], [3.25, -3.25], [3.25, 30.9], [23.7, 30.9], [23.7, -5.8], [1, -5.8], [1, -7.5]].map(([s, w]) => noAnexo(s, w));
export const altura = (x, y) => (inPoly(x, y, BAIXO) ? BAIXO_H : 0);

/* Dois canteiros gramados em frente ao Anexo, um de cada lado da porta, com árvores ainda pequenas (foto da fachada). */
export const CANTEIROS_ANEXO = [7.2, 23.7].map((t) => { const A = [-23.226, -90.021], d = [-0.8617, 0.5075], n = [0.5075, 0.8617]; const c = [A[0] + d[0] * t + n[0] * 4.6, A[1] + d[1] * t + n[1] * 4.6]; const q = [[-3.6, -1.9], [3.6, -1.9], [3.6, 1.9], [-3.6, 1.9]].map(([u, v]) => [c[0] + d[0] * u + n[0] * v, c[1] + d[1] * u + n[1] * v]); return { c, q }; });
export const HEDGES = [[[9.6, 13.4], [11.4, 13.4], [11.4, 44.6], [9.6, 44.6]], [[15.15, 11.4], [16.95, 11.4], [16.95, 44.6], [15.15, 44.6]]];
export const SOLIDS = [...BUILDINGS, ...COVERS].filter((b) => b.id !== 'coberta').map((b) => b.p);

export function listaArvores() {
  const trees = [];
  const add = (x, y, r, tone = 0) => trees.push({ x, y, r, tone });
  [14, 26, 28, 29, 31, 32, 33, 34].forEach((i) => add(pts(i)[0][0], pts(i)[0][1], 2.6, i % 3));
  [16, 17, 30].forEach((i) => add(pts(i)[0][0], pts(i)[0][1], 4.2, 1));
  GARDEN.trees.forEach((q, i) => add(q[0], q[1], 3 + (i % 3) * 0.5, i % 4));
  const fill = (i, n, seed) => {
    const p = pts(i); const r = rng(seed); const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    let k = 0, guard = 0;
    while (k < n && guard++ < 500) {
      const x = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys));
      if (inPoly(x, y, p)) { add(x, y, 2.1 + r() * 0.8, k % 3); k++; }
    }
  };
  fill(10, 8, 7); fill(11, 9, 19);
  const photo = ([x, y], r, tone) => { if (!SOLIDS.some((p) => inPoly(x, y, p))) add(x, y, r, tone); };
  [[-163.6, -259.3], [-145.9, -284], [-138.2, -274.3], [-147.4, -244.3], [-145.7, -230.3], [-134.4, -235.3], [-118.8, -242.7], [-132.2, -261.2]].forEach((q, i) => photo(q, 2.4 + (i % 3) * 0.6, i % 4));
  (XT.poolTrees || []).forEach((q, i) => photo(q, 3.5, i % 2));
  [[-71.2, -59.5], [-64, -62], [-56.5, -63.8], [-56.9, -69.3], [-60.1, -76.3], [-64, -82.1], [-70.6, -90.1], [-45.1, -58.4], [-43.2, -52.8], [-33, -54.9], [-44.1, -73.8], [-76.8, -25.4], [-74.7, -21]].forEach((q, i) => photo(q, 2.6 + (i % 2) * 0.7, i % 3));
  [[-15.5, -111.6], [-14.2, -125.2], [-4.6, -112], [3.5, -131.2], [-16.3, -148.8], [-93.1, -263.8], [-48.3, -219.7], [-70.5, -192.5], [-63.1, -183.3]].forEach((q, i) => add(q[0], q[1], 3.2 + (i % 2), i % 3));
  if (VERDE) {
    const L = VERDE.meio_lado; const dentro = (x, y) => Math.abs(x * EAST[0] + y * EAST[1]) < L && Math.abs(x * NORTH[0] + y * NORTH[1]) < L;
    for (let i = trees.length - 1; i >= 0; i--) if (dentro(trees[i].x, trees[i].y)) trees.splice(i, 1);
    const muro = pts(22); const postas = [];
    VERDE.trees.slice().sort((a, b) => b[2] - a[2]).forEach(([x, y, r, tipo, tom]) => {
      if (y > ROAD_Y0 - 1 && y < ROAD_Y1 + 1) return;
      if (SOLIDS.some((p) => inPoly(x, y, p))) return;
      const campus = inPoly(x, y, muro) || (y > 46 && y < ROAD_Y0);
      if (r < (campus ? 1.9 : 2.8)) return;
      if (postas.some((q) => Math.hypot(q[0] - x, q[1] - y) < (q[2] + r) * 0.95)) return;
      postas.push([x, y, r]);
      trees.push({ x, y, r: Math.min(4.2, r * 1.05), tone: tom % 3, tipo, campus });
    });
  }
  return trees;
}

/* Fundos do bloco principal (informado pelo usuário): calçada larga na saída da porta de vidro e quatro árvores com redes. */
export const CALCADA_FUNDOS = [[-27, -54.4], [-8.5, -54.4], [-8.5, -50.62], [-27, -50.62]];
export const REDES = [[-24.6, -56.2], [-20.2, -56.2], [-15.8, -56.2], [-11.4, -56.2]];
