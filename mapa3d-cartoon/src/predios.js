/* Prédios do campus (menos o bloco principal, que tem arquivo próprio).
   Padrão das fotos: parede de azulejo amarelo, platibanda de pastilha azul saliente com forro escuro,
   janelas de vidro escuro e condensadoras de ar-condicionado penduradas na fachada. */
import { ENT, rect, altura, BUILDINGS, signedArea, insetPoly, dist, lerp2, rng, centroid, F, XT, LIMPO, FP } from './dados.js';

/* Contorno orientado para que cada aresta a→b tenha a normal (−dy, dx) apontando para fora. */
export const paraFora = (p) => (signedArea(p) > 0 ? p.slice().reverse() : p);
export const normalDe = (a, b) => { const L = dist(a, b) || 1; return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]; };

/* Retângulo em pé sobre a aresta a→b: u0..u1 em metros a partir de a, afastado d da parede. */
export function painel(L, mat, a, b, u0, u1, h0, h1, d = 0.03, uv) {
  const n = normalDe(a, b), len = dist(a, b);
  const A = lerp2(a, b, u0 / len), B = lerp2(a, b, u1 / len);
  L.quad(mat, [A[0] + n[0] * d, h0, A[1] + n[1] * d], [B[0] + n[0] * d, h0, B[1] + n[1] * d], [B[0] + n[0] * d, h1, B[1] + n[1] * d], [A[0] + n[0] * d, h1, A[1] + n[1] * d], uv);
}
/* Caixa saliente presa à fachada. */
export function saliencia(L, mat, a, b, u0, u1, h0, h1, d0, d1) {
  const n = normalDe(a, b), len = dist(a, b);
  const A = lerp2(a, b, u0 / len), B = lerp2(a, b, u1 / len);
  const q = [[A[0] + n[0] * d0, A[1] + n[1] * d0], [B[0] + n[0] * d0, B[1] + n[1] * d0], [B[0] + n[0] * d1, B[1] + n[1] * d1], [A[0] + n[0] * d1, A[1] + n[1] * d1]];
  L.walls(mat, q, h0, h1, true); L.top(mat, q, h1); L.top(mat, q, h0, [], false);
}
/* Janela de correr: caixilho claro, vidro escuro e montante no meio. */
export function janela(L, a, b, u, w, h0, h1, o = {}) {
  painel(L, o.caixilho || 'caixilho', a, b, u - w / 2 - 0.05, u + w / 2 + 0.05, h0 - 0.05, h1 + 0.05, 0.02);
  painel(L, o.vidro || 'vidro', a, b, u - w / 2, u + w / 2, h0, h1, 0.04);
  const n = o.folhas || 2;
  for (let i = 1; i < n; i++) painel(L, o.caixilho || 'caixilho', a, b, u - w / 2 + (w * i) / n - 0.025, u - w / 2 + (w * i) / n + 0.025, h0, h1, 0.05);
}
/* Condensadora de ar-condicionado sobre mão-francesa. */
export function arCond(L, a, b, u, h) {
  saliencia(L, 'ar', a, b, u - 0.42, u + 0.42, h, h + 0.6, 0.12, 0.45);
  painel(L, 'cinza', a, b, u - 0.3, u + 0.1, h + 0.08, h + 0.52, 0.46);
  saliencia(L, 'cinzaEscuro', a, b, u - 0.4, u + 0.4, h - 0.05, h, 0.02, 0.45);
}
/* Porta de vidro com bandeira. */
export function portaVidro(L, a, b, u, w, h = 2.3) {
  painel(L, 'caixilho', a, b, u - w / 2 - 0.08, u + w / 2 + 0.08, 0, h + 0.5, 0.02);
  painel(L, 'vidro', a, b, u - w / 2, u + w / 2, 0.05, h, 0.04);
  painel(L, 'vidro', a, b, u - w / 2, u + w / 2, h + 0.08, h + 0.44, 0.04);
  painel(L, 'caixilho', a, b, u - 0.03, u + 0.03, 0.05, h, 0.05);
}

/* Platibanda de pastilha: faixa saliente no alto, forro por baixo, mureta por dentro e a laje/telhado no fundo. */
export function platibanda(L, p, h, o = {}) {
  const bandH = o.bandH ?? 1.3, over = o.over ?? 0.3, furos = o.furos || [];
  const fora = insetPoly(p, -over), dentro = insetPoly(p, 0.18), base = h - bandH;
  L.walls(o.matBand || 'pastilha', fora, base, h, true);
  L.top('beiral', fora, base, [p], false);
  L.top('branco', fora, h, [dentro]);
  L.walls('branco', dentro, h - 0.7, h, false);
  furos.forEach((f) => {
    /* No vão de um pátio a faixa avança para dentro do vão e a mureta fica do lado do telhado. */
    const ff = insetPoly(f, over), fd = insetPoly(f, -0.18);
    L.walls(o.matBand || 'pastilha', ff, base, h, false); L.top('beiral', f, base, [ff], false);
    L.top('branco', fd, h, [ff]); L.walls('branco', fd, h - 0.7, h, true);
  });
  if (o.telhado !== false) L.top(o.telhado || 'laje', dentro, h - 0.7, furos.map((f) => insetPoly(f, -0.18)));
  return { dentro, base };
}

/* Janelas repartidas por uma aresta, andar por andar. */
export function janelasNaAresta(L, a, b, o) {
  const len = dist(a, b); const { floors, fh, w = 1.5, hj = 1.1, sill = 1.1, passo = 3.4, margem = 1.2, R, ar = 0.3, base = 0, pula } = o; // o.acesas: fração de janelas com luz à noite
  const n = Math.floor((len - margem * 2 + (passo - w)) / passo); if (n < 1) return;
  const u0 = (len - (n - 1) * passo) / 2;
  for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
    const u = u0 + i * passo; if (pula && pula(f, u, len)) continue;
    const z = base + f * fh + sill;
    const hsh = Math.abs(Math.sin(a[0] * 12.9898 + a[1] * 78.233 + u * 37.719 + f * 11.13) * 43758.5453) % 1;
    janela(L, a, b, u, w, z, z + hj, o.acesas && hsh < o.acesas ? { ...o, vidro: 'vidroAceso' } : o);
    if (R && R() < ar) arCond(L, a, b, u + (R() > 0.5 ? 1 : -1) * (w / 2 + 0.6), z + (R() > 0.5 ? -0.1 : -0.9));
  }
}

/* Prédio comum: paredes, janelas, platibanda. */
export function predioComum(L, b, o = {}) {
  const p = paraFora(b.p); const floors = b.floors || 1; const bandH = o.bandH ?? 1.25; const fh = (b.h - bandH) / floors;
  const R = rng(Math.abs(Math.round(p[0][0] * 31 + p[0][1] * 17)) + 3);
  L.walls(o.mat || 'azulejo', p, 0, b.h - bandH, true);
  p.forEach((a, i) => {
    const e = p[(i + 1) % p.length];
    janelasNaAresta(L, a, e, { acesas: o.acesas ?? 0.04, floors, fh, R, w: o.w ?? 1.5, hj: o.hj ?? 1.05, sill: o.sill ?? 1.15, passo: o.passo ?? 3.6, ar: o.ar ?? 0.3, folhas: o.folhas, pula: o.pula && ((f, u, len) => o.pula(i, f, u, len)) });
    if (o.porta && o.porta.aresta === i) portaVidro(L, a, e, dist(a, e) * (o.porta.t ?? 0.5), o.porta.w ?? 2.2);
  });
  return platibanda(L, p, b.h, { bandH, over: o.over, telhado: o.telhado, matBand: o.matBand });
}

/* Telhado de duas águas sobre um retângulo (4 pontos), com a cumeeira no sentido do lado maior. */
export function duasAguas(L, mat, q, h, rise, beiral = 0.5) {
  const p = insetPoly(q, -beiral); const longo = dist(p[0], p[1]) >= dist(p[1], p[2]) ? p : [p[1], p[2], p[3], p[0]];
  const [a, b, c, d] = longo; const m0 = lerp2(a, d, 0.5), m1 = lerp2(b, c, 0.5); const s = signedArea(longo) > 0 ? 1 : -1;
  const A = [a[0], h, a[1]], B = [b[0], h, b[1]], C = [c[0], h, c[1]], D = [d[0], h, d[1]], M0 = [m0[0], h + rise, m0[1]], M1 = [m1[0], h + rise, m1[1]];
  const w = dist(a, d) / 2, len = dist(a, b); const uv = [[0, 0], [len, 0], [len, w], [0, w]];
  if (s > 0) { L.quad(mat, B, A, M0, M1, uv); L.quad(mat, D, C, M1, M0, uv); L.tri('branco', A, D, M0); L.tri('branco', C, B, M1); }
  else { L.quad(mat, A, B, M1, M0, uv); L.quad(mat, C, D, M0, M1, uv); L.tri('branco', D, A, M0); L.tri('branco', B, C, M1); }
}

/* Ginásio: paredes baixas e cobertura metálica em arco. */
function ginasio(L, b) {
  const p = paraFora(b.p); const wall = b.h - b.rise; L.walls('azulejo', p, 0, wall * 0.45, true); L.walls('branco', p, wall * 0.45, wall, true);
  const q = dist(p[0], p[1]) >= dist(p[1], p[2]) ? p : [p[1], p[2], p[3], p[0]]; const N = 10;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N; const h0 = wall + b.rise * Math.sin(Math.PI * t0), h1 = wall + b.rise * Math.sin(Math.PI * t1);
    const a0 = lerp2(q[0], q[3], t0), b0 = lerp2(q[1], q[2], t0), a1 = lerp2(q[0], q[3], t1), b1 = lerp2(q[1], q[2], t1);
    const A = [a0[0], h0, a0[1]], B = [b0[0], h0, b0[1]], C = [b1[0], h1, b1[1]], D = [a1[0], h1, a1[1]];
    const len = dist(q[0], q[1]), w = dist(q[0], q[3]) / N; const uv = [[0, i * w], [len, i * w], [len, (i + 1) * w], [0, (i + 1) * w]];
    if (signedArea(q) > 0) L.quad('metal', B, A, D, C, uv); else L.quad('metal', A, B, C, D, uv);
    /* fechamento das pontas */
    [[a0, a1], [b1, b0]].forEach(([u, v], k) => { const P0 = [u[0], wall, u[1]], P1 = [v[0], wall, v[1]], P2 = [v[0], k ? h0 : h1, v[1]], P3 = [u[0], k ? h1 : h0, u[1]]; L.quad('branco', P0, P1, P2, P3); L.quad('branco', P1, P0, P3, P2); });
  }
}
/* Coreto: deck hexagonal com pilares e telhado em pirâmide de seis águas. */
function coreto(L, b) {
  const p = paraFora(b.p), m = centroid(p); const hb = b.h - 0.2;
  L.prism('concreto', 'cimento', p, 0, 0.35);
  p.forEach((q) => { const c = lerp2(m, q, 0.92); L.box('branco', c[0], c[1], 0.3, 0.3, 0.35, hb); });
  const fora = p.map((q) => lerp2(m, q, 1.18)); const top = [m[0], hb + 1.6, m[1]];
  fora.forEach((a, i) => {
    const e = fora[(i + 1) % fora.length]; const A = [a[0], hb, a[1]], E = [e[0], hb, e[1]];
    L.triUp('telha', A, E, top); L.triDown('madeira', A, E, [m[0], hb + 0.02, m[1]]);
    L.tube('madeira', A, top, 0.06);
  });
  L.walls('madeira', fora, hb - 0.16, hb, true);
}
/* Prédio novo: já está de pé, com dois andares, mas sem acabamento: reboco cinza, sem pintura nem revestimento,
   e só os vãos das janelas (informado pelo usuário). */
function obra(L, b) {
  const p = paraFora(b.p); const fh = b.h / 2;
  L.walls('reboco', p, 0, b.h, true); L.top('laje', insetPoly(p, 0.15), b.h - 0.25); L.top('reboco', p, b.h, [insetPoly(p, 0.15)]); L.walls('reboco', insetPoly(p, 0.15), b.h - 0.25, b.h, false);
  p.forEach((a, i) => {
    const e = p[(i + 1) % p.length]; const len = dist(a, e); const n = Math.floor((len - 2) / 3.6); if (n < 1) return; const u0 = (len - (n - 1) * 3.6) / 2;
    for (let f = 0; f < 2; f++) for (let k = 0; k < n; k++) painel(L, 'preto', a, e, u0 + k * 3.6 - 0.8, u0 + k * 3.6 + 0.8, f * fh + 1.1, f * fh + 2.3, 0.02);
    painel(L, 'reboco2', a, e, 0, len, fh - 0.15, fh + 0.15, 0.03);
    if (i === 0) painel(L, 'preto', a, e, len / 2 - 0.9, len / 2 + 0.9, 0, 2.3, 0.025);
  });
}
/* Estufa: quadrado de estacas com tela de sombreamento (malha de tecido escura), e dentro as plantas em pneus. */
function estufa(L, b) {
  const p = paraFora(b.p); L.walls('sombrite', p, 0, b.h, true); L.walls('sombrite', p, 0, b.h, false); L.top('sombrite', p, b.h); L.top('sombrite', p, b.h - 0.01, [], false);
  p.forEach((q, i) => { L.tube('madeira', [q[0], 0, q[1]], [q[0], b.h, q[1]], 0.07, 5); const e = p[(i + 1) % p.length]; L.tube('madeira', [q[0], b.h, q[1]], [e[0], b.h, e[1]], 0.05); });
  const m = centroid(p); const R = rng(88);
  for (let i = 0; i < 14; i++) { const q = lerp2(m, lerp2(p[i % p.length], p[(i + 1) % p.length], R()), 0.25 + R() * 0.6); const c = (r) => Array.from({ length: 8 }, (_, k) => [q[0] + Math.cos(k / 8 * 6.283) * r, q[1] + Math.sin(k / 8 * 6.283) * r]); L.walls('preto', c(0.38), 0, 0.24, true); L.top('preto', c(0.38), 0.24, [c(0.22)]); L.prism('folha', 'folha', c(0.22), 0.1, 0.45 + R() * 0.35); }
}
/* Casa com telhado de telha cerâmica. */
function casaTelha(L, b, mat = 'branco') {
  const p = paraFora(b.p); L.walls(mat, p, 0, b.h - 1.2, true);
  if (p.length === 4) duasAguas(L, 'telha', p, b.h - 1.2, 1.5, 0.6);
  else { L.top('telha', insetPoly(p, -0.5), b.h - 0.6); L.walls('telha', insetPoly(p, -0.5), b.h - 1.2, b.h - 0.6, true); }
  const R = rng(41); p.forEach((a, i) => janelasNaAresta(L, a, p[(i + 1) % p.length], { floors: b.floors || 1, fh: 3, R, ar: 0, passo: 4.2, sill: 1.1, hj: 1 }));
}
/* Prédio dos apartamentos (foto da rua): térreo de lojas com portas de enrolar e três andares de varandas.
   Na frente, para a rodovia, faixas laranja deitadas; na lateral da rua de terra, pilastras laranja em pé e o painel azul. */
function apartamentos(L, b) {
  const p = paraFora(b.p); const fh = (b.h - 0.6) / 4;
  L.walls('brancoSujo', p, 0, b.h, true); L.top('telha', insetPoly(p, 0.2), b.h - 0.1); L.top('branco', p, b.h, [insetPoly(p, 0.2)]);
  const xs = b.p.map((q) => q[0]), ys = b.p.map((q) => q[1]); const xo = Math.min(...xs), yf = Math.min(...ys);
  p.forEach((a, i) => {
    const e = p[(i + 1) % p.length]; const len = dist(a, e); const frente = a[1] === yf && e[1] === yf, lateral = a[0] === xo && e[0] === xo;
    if (!frente && !lateral) { janelasNaAresta(L, a, e, { floors: 3, fh, base: fh, ar: 0, passo: 3.6, w: 1.1, hj: 1, sill: 1 }); return; }
    const n = Math.max(2, Math.round(len / 3.6)), vao = len / n;
    for (let k = 0; k < n; k++) {
      const u0 = k * vao, u1 = (k + 1) * vao;
      painel(L, 'cinza', a, e, u0 + 0.5, u1 - 0.5, 0, fh - 0.5, 0.03); // porta de enrolar
      for (let f = 1; f < 4; f++) { painel(L, (k * 7 + f * 3 + i) % 4 === 0 ? 'vidroAceso' : 'preto', a, e, u0 + 0.45, u1 - 0.45, f * fh + 0.15, (f + 1) * fh - 0.35, 0.03); painel(L, frente ? 'laranja' : 'brancoSujo', a, e, u0 + 0.45, u1 - 0.45, f * fh + 0.15, f * fh + 1.05, 0.12); painel(L, 'branco', a, e, u0 + 0.45, u1 - 0.45, f * fh + 1.05, f * fh + 1.12, 0.14); }
      if (lateral) saliencia(L, 'laranja', a, e, u0 - 0.2, u0 + 0.2, fh, b.h, 0, 0.14);
    }
    if (lateral) { const u = a[1] < e[1] ? 1 : len - 6.5; painel(L, 'painelAzul', a, e, u, u + 5.5, fh * 0.9, b.h - 0.8, 0.2, [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  });
}
function galpao(L, b, band = 'laranja') {
  const p = paraFora(b.p); L.walls('branco', p, 0, b.h - 1.6, true); L.walls(band, insetPoly(p, -0.15), b.h - 1.6, b.h, true); L.top('beiral', insetPoly(p, -0.15), b.h - 1.6, [p], false); L.top('metal', insetPoly(p, -0.15), b.h - 0.3);
}
/* Elétrica (foto da rua): galpão baixo de telha metálica colado nos fundos do prédio, aberto para a rua de terra,
   escuro por dentro, com o pórtico de treliça e o letreiro na entrada, balcão, mesas e uma mureta verde na frente. */
/* Brisanet (foto da rodovia): caixa cinza-clara com a testeira laranja larga e o nome em branco, vitrine de vidro na
   frente, e o estacionamento cercado com as coberturas brancas das motos. */
function brisanet(L, b) {
  const p = paraFora(b.p); const ht = b.h - 2.8; const fora = insetPoly(p, -0.35);
  L.walls('brancoSujo', p, 0, ht, true); L.walls('laranja', fora, ht, b.h, true); L.top('beiral', fora, ht, [p], false); L.top('metal', fora, b.h - 0.2);
  const yf = Math.min(...b.p.map((q) => q[1])); const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
  p.forEach((a, i) => { const e = p[(i + 1) % p.length]; const len = dist(a, e); const n = normalDe(a, e); const A = [a[0] + n[0] * 0.35, a[1] + n[1] * 0.35], E = [e[0] + n[0] * 0.35, e[1] + n[1] * 0.35];
    if (a[1] === yf && e[1] === yf) { painel(L, 'vidro', a, e, len * 0.52, len * 0.96, 0.2, ht - 0.5, 0.03); painel(L, 'caixilho', a, e, len * 0.52, len * 0.96, ht - 0.5, ht - 0.4, 0.04); painel(L, 'placaBrisanet', A, E, len * 0.58, len * 0.58 + 13, ht + 0.5, b.h - 0.5, 0.02, u); }
    else if (Math.abs(a[0] - e[0]) < 0.01) painel(L, 'placaBrisanet', A, E, len * 0.5 - 6.5, len * 0.5 + 6.5, ht + 0.5, b.h - 0.5, 0.02, u); });
  /* estacionamento: mureta com alambrado, aberto na frente; coberturas de lona branca das motos; acesso pela rodovia */
  const pk = ENT.parking; if (pk) {
    const xs = pk.map((q) => q[0]), ys = pk.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const seg = (a, e) => { L.box('concreto', (a[0] + e[0]) / 2, (a[1] + e[1]) / 2, Math.abs(e[0] - a[0]) + 0.16, Math.abs(e[1] - a[1]) + 0.16, 0, 0.5); L.quad2('alambrado', [a[0], 0.5, a[1]], [e[0], 0.5, e[1]], [e[0], 2, e[1]], [a[0], 2, a[1]]); L.tube('cinza', [a[0], 2, a[1]], [e[0], 2, e[1]], 0.03); };
    seg([x0, y0], [x0, y1]); seg([x1, y0], [x1, y1]); seg([x0, y0], [-104, y0]); seg([-92, y0], [x1, y0]);
    [-88.5, -81.5, -74.5].forEach((x) => [103.5, 110, 116.5].forEach((y) => { [[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]].forEach(([dx, dy], k, arr) => { L.tube('cinza', [x + dx, 0, y + dy], [x + dx, 2.5, y + dy], 0.05, 4); const nx = arr[(k + 1) % 4]; L.triUp('lona', [x + dx * 1.15, 2.5, y + dy * 1.15], [x + nx[0] * 1.15, 2.5, y + nx[1] * 1.15], [x, 3.7, y]); L.triDown('lona', [x + dx * 1.15, 2.48, y + dy * 1.15], [x + nx[0] * 1.15, 2.48, y + nx[1] * 1.15], [x, 3.68, y]); }); }));
  }
}
function barCoberto(L, b) {
  const xs = b.p.map((q) => q[0]), ys = b.p.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const hf = 3.7, ht = 3; // frente (rua) mais alta que o fundo
  L.top('cimento', rect(x0, y0, x1, y1), 0.04);
  /* paredes escuras no fundo e nos lados, vistas por dentro e por fora */
  [[[x1, y0], [x1, y1]], [[x0, y1], [x1, y1]], [[x0, y0], [x1, y0]]].forEach(([a, e]) => { const za = a[0] === x0 ? hf : ht, ze = e[0] === x0 ? hf : ht; L.quad2('barParede', [a[0], 0, a[1]], [e[0], 0, e[1]], [e[0], ze - 0.25, e[1]], [a[0], za - 0.25, a[1]]); });
  for (let y = y0; y <= y1 + 0.01; y += (y1 - y0) / 4) { L.tube('cinzaEscuro', [x0, 0, y], [x0, hf - 0.1, y], 0.08, 4); L.tube('cinzaEscuro', [(x0 + x1) / 2, 0, y], [(x0 + x1) / 2, (hf + ht) / 2 - 0.1, y], 0.07, 4); L.tube('cinza', [x0 - 0.6, hf, y], [x1, ht - 0.03, y], 0.05); }
  const uv = [[0, 0], [y1 - y0 + 1, 0], [y1 - y0 + 1, x1 - x0 + 0.9], [0, x1 - x0 + 0.9]];
  L.quadUp('metal', [x0 - 0.7, hf + 0.03, y0 - 0.3], [x0 - 0.7, hf + 0.03, y1 + 0.3], [x1 + 0.2, ht, y1 + 0.3], [x1 + 0.2, ht, y0 - 0.3], uv);
  L.quadDown('forroMetal', [x0 - 0.7, hf - 0.02, y0 - 0.3], [x0 - 0.7, hf - 0.02, y1 + 0.3], [x1 + 0.2, ht - 0.05, y1 + 0.3], [x1 + 0.2, ht - 0.05, y0 - 0.3]);
  /* balcão no fundo, mesas e mureta verde */
  L.box('preto', x1 - 2.2, (y0 + y1) / 2, 0.7, 8, 0.04, 1.1); L.box('madeiraClara', x1 - 2.2, (y0 + y1) / 2, 0.9, 8.2, 1.1, 1.16);
  for (let i = 0; i < 6; i++) { const x = x0 + 3 + (i % 2) * 4, y = y0 + 3 + Math.floor(i / 2) * 5.2; const c = Array.from({ length: 8 }, (_, k) => [x + Math.cos(k / 8 * 6.283) * 0.45, y + Math.sin(k / 8 * 6.283) * 0.45]); L.prism('cinzaEscuro', 'vermelho', c, 0.7, 0.75); L.tube('cinzaEscuro', [x, 0.04, y], [x, 0.7, y], 0.05, 4); [[0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8]].forEach(([dx, dy]) => L.box('branco', x + dx, y + dy, 0.4, 0.4, 0.04, 0.46)); }
  const ym = (y0 + y1) / 2;
  [[y0, ym - 2.4], [ym + 2.4, y1]].forEach(([ya, yb]) => L.box('verdeMuro', x0 - 0.05, (ya + yb) / 2, 0.18, yb - ya, 0, 1));
  /* pórtico de treliça com o letreiro */
  const xp = x0 - 1.2; [-1.9, 1.9].forEach((d) => { const y = ym + d; const c = [[-0.2, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2]].map(([u, v]) => [xp + u, y + v]); c.forEach((q, k) => { L.tube('aco', [q[0], 0, q[1]], [q[0], 3.4, q[1]], 0.025); const n = c[(k + 1) % 4]; for (let z = 0; z < 3.4; z += 0.48) L.tube('aco', [q[0], z, q[1]], [n[0], z + 0.48, n[1]], 0.016); }); });
  L.box('preto', xp, ym, 0.16, 4.4, 3.4, 4.3);
  const u = [[0, 0], [1, 0], [1, 1], [0, 1]]; painel(L, 'placaEletrica', [xp - 0.08, ym - 2.1], [xp - 0.08, ym + 2.1], 0, 4.2, 3.45, 4.25, 0.01, u); painel(L, 'placaEletrica', [xp + 0.08, ym + 2.1], [xp + 0.08, ym - 2.1], 0, 4.2, 3.45, 4.25, 0.01, u);
}

/* Claraboia de vidro do Anexo: prisma triangular sobre a laje. */
function claraboia(L, q, h) {
  const p = dist(q[0], q[1]) >= dist(q[1], q[2]) ? q : [q[1], q[2], q[3], q[0]]; const [a, b, c, d] = p; const m0 = lerp2(a, d, 0.5), m1 = lerp2(b, c, 0.5);
  const A = [a[0], h, a[1]], B = [b[0], h, b[1]], C = [c[0], h, c[1]], D = [d[0], h, d[1]], M0 = [m0[0], h + 1.5, m0[1]], M1 = [m1[0], h + 1.5, m1[1]];
  [[A, B, M1, M0], [B, A, M0, M1], [C, D, M0, M1], [D, C, M1, M0]].forEach((f) => L.quad('vidroClaro', ...f));
  [[A, D, M0], [D, A, M0], [B, C, M1], [C, B, M1]].forEach((t) => L.tri('vidroClaro', ...t));
  [[A, M0], [D, M0], [B, M1], [C, M1], [M0, M1], [A, B], [D, C]].forEach(([u, v]) => L.tube('aco', u, v, 0.05));
}
/* Placas solares deitadas sobre a laje. */
function placasSolares(L, p, h, frac) {
  const q = insetPoly(p, 1.2); const longo = dist(q[0], q[1]) >= dist(q[1], q[2]) ? q : [q[1], q[2], q[3], q[0]];
  const n = Math.max(2, Math.round((dist(longo[0], longo[1]) * frac) / 2.2));
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.08) / n * frac, t1 = (i + 0.92) / n * frac;
    const A = lerp2(lerp2(longo[0], longo[1], t0), lerp2(longo[3], longo[2], t0), 0.08), B = lerp2(lerp2(longo[0], longo[1], t1), lerp2(longo[3], longo[2], t1), 0.08);
    const C = lerp2(lerp2(longo[0], longo[1], t1), lerp2(longo[3], longo[2], t1), 0.92), D = lerp2(lerp2(longo[0], longo[1], t0), lerp2(longo[3], longo[2], t0), 0.92);
    const quad = [[A[0], h + 0.15, A[1]], [B[0], h + 0.15, B[1]], [C[0], h + 0.35, C[1]], [D[0], h + 0.35, D[1]]];
    L.quad('solar', ...(signedArea([A, B, C, D]) > 0 ? [quad[1], quad[0], quad[3], quad[2]] : quad));
  }
}

export function construirPredios(L, filtro = () => true, tanques = true) {
  BUILDINGS.filter(filtro).forEach((b) => {
    if (b.id === 'principal' || b.kind === 'gate' || b.kind === 'stele') return; // feitos à parte
    if (b.kind === 'gym') return ginasio(L, b);
    if (b.kind === 'hex') return coreto(L, b);
    if (b.kind === 'obra') return obra(L, b);
    if (b.kind === 'greenhouse') return estufa(L, b);
    if (b.kind === 'apto') return apartamentos(L, b);
    if (b.kind === 'loja') return brisanet(L, b);
    if (b.kind === 'bar') return barCoberto(L, b);
    if (b.tile) return casaTelha(L, b, b.id === 'casa-mel' ? 'azulejoClaro' : 'rosa');
    if (b.id === 'manutencao') { const p = paraFora(b.p); L.walls('branco', p, 0, b.h, true); L.top('laje', p, b.h); return; }
    const o = {};
    if (b.id === 'anexo') {
      /* Fachada da foto: dois níveis de vidraças largas e a porta de vidro no meio do lado que olha para o bloco principal. */
      const pp = paraFora(b.p); let frente = 0; pp.forEach((a, i) => { const e = pp[(i + 1) % pp.length]; const f = pp[(frente + 1) % pp.length]; if (a[1] + e[1] > pp[frente][1] + f[1]) frente = i; });
      Object.assign(o, { acesas: 1, mat: 'azulejoAnexo', w: 3.4, hj: 1.9, sill: 0.95, passo: 6.4, folhas: 4, ar: 0, bandH: 1.5, porta: { aresta: frente, t: 0.5, w: 2.6 }, pula: (i, f, u, len) => i === frente && f === 0 && Math.abs(u - len / 2) < 3.4 });
    }
    if (b.id === 'laboratorios') Object.assign(o, { passo: 3.5, ar: 0.35, acesas: 0.4 });
    if (b.id === 'diretoria') Object.assign(o, { acesas: 0.2 });
    if (b.id === 'cantina') Object.assign(o, { w: 2.2, passo: 4.4, folhas: 3, ar: 0.15 });
    const r = predioComum(L, b, o);
    if (b.skylight) {
      /* claraboia bem no meio do telhado, no sentido do lado maior (corrigido pelo usuário) */
      const q = r.dentro; const par = (a, e) => Math.abs(((e[0] - a[0]) * 7.8 + (e[1] - a[1]) * 13.1) / dist(a, e)); const lg = par(q[0], q[1]) >= par(q[1], q[2]) ? q : [q[1], q[2], q[3], q[0]];
      const pt = (u, v) => lerp2(lerp2(lg[0], lg[1], u), lerp2(lg[3], lg[2], u), v);
      claraboia(L, [pt(0.2, 0.36), pt(0.8, 0.36), pt(0.8, 0.64), pt(0.2, 0.64)], b.h - 0.7);
    }
    if (b.solar) placasSolares(L, r.dentro, b.h - 0.7, b.solar);
  });
  /* Caixas d'água no pátio de serviço. */
  (tanques ? (LIMPO.tanks || FP('caixa dagua')) : []).forEach(([x, y]) => {
    const pol = Array.from({ length: 10 }, (_, i) => [x + Math.cos((i / 10) * 6.283) * 1.1, y + Math.sin((i / 10) * 6.283) * 1.1]);
    const z = altura(x, y); L.prism('azulCaixa', 'azulCaixa', pol, z + 0.4, z + 2.3); L.box('concreto', x, y, 2.4, 2.4, z, z + 0.4);
  });
}
