/* Entorno do campus, simplificado, para o mapa não ficar solto no vazio: casas do bairro do outro lado da rodovia,
   galpões, a estrada de terra que acompanha o muro até o Seu Assis com a cerca de arame do terreno vizinho,
   mato de caatinga espalhado e serras no horizonte. Posições lidas do satélite (prototipo/campus-entorno.js);
   as casas ao longo das ruas são ilustrativas. */
import * as THREE from 'three';
import { ENT, pts, inPoly, rng, dist, lerp2, ROAD_Y0, ROAD_Y1, byId } from './dados.js';
import { Lote } from './geo.js';
import { paraFora, painel, duasAguas, normalDe } from './predios.js';
import { modelo, instanciar } from './vegetacao.js';
import { desaturavel } from './texturas.js';

const rotRect = (cx, cy, w, d, deg) => { const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * co - v * si, cy + u * si + v * co]); };
const insetPolyLocal = (q, d) => { const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2; return q.map(([x, y]) => [x + Math.sign(cx - x) * d, y + Math.sign(cy - y) * d]); };
const CORES = ['casaBranca', 'casaCreme', 'casaAzul', 'casaSalmao', 'casaAmarela', 'casaVerde'];

function casa(L, q, h, tone) {
  const p = paraFora(q); const mat = CORES[tone % CORES.length];
  L.walls(mat, p, 0, h, true);
  duasAguas(L, tone % 5 === 4 ? 'metal' : 'telha', q, h, 0.9 + (tone % 3) * 0.2, 0.45);
  p.forEach((a, i) => {
    const e = p[(i + 1) % p.length]; const len = dist(a, e);
    if (i === 0) { painel(L, 'porta', a, e, len * 0.5 - 0.45, len * 0.5 + 0.45, 0, 2.1, 0.02); painel(L, 'vidro', a, e, len * 0.2 - 0.5, len * 0.2 + 0.5, 1, 2, 0.02); painel(L, 'vidro', a, e, len * 0.8 - 0.5, len * 0.8 + 0.5, 1, 2, 0.02); }
    else if (len > 5) painel(L, 'vidro', a, e, len * 0.5 - 0.5, len * 0.5 + 0.5, 1, 2, 0.02);
  });
}

/* Cerca de arame: mourões de concreto e três fios. */
function cerca(L, linha) {
  for (let i = 0; i < linha.length - 1; i++) {
    const a = linha[i], b = linha[i + 1]; const len = dist(a, b); const n = Math.max(1, Math.round(len / 4));
    for (let k = 0; k <= n; k++) { const q = lerp2(a, b, k / n); L.tube('concreto', [q[0], 0, q[1]], [q[0], 1.7, q[1]], 0.06, 4); L.tube('concreto', [q[0], 1.7, q[1]], [q[0] + (b[1] - a[1]) / len * 0.25, 1.95, q[1] - (b[0] - a[0]) / len * 0.25], 0.05, 4); }
    [0.5, 1, 1.5].forEach((h) => L.tube('arame', [a[0], h, a[1]], [b[0], h, b[1]], 0.02));
  }
}

/* Seu Assis (foto da rua): a casa rosa de dois andares fica no arquivo de prédios; aqui vai o que a cerca de vida:
   calçada em volta, a área coberta da frente com mesas e cadeiras, o quiosque de telha com a lona azul, a faixa
   vermelha do letreiro e o ônibus escolar amarelo que costuma ficar parado ao lado. */
function seuAssis(L) {
  const b = byId('seu-assis'); if (!b) return; const p = paraFora(b.p);
  let k = 0; p.forEach((a, i) => { const e = p[(i + 1) % p.length], f = p[(k + 1) % p.length]; if (a[1] + e[1] > p[k][1] + f[1]) k = i; });
  const a = p[k], e = p[(k + 1) % p.length], n = normalDe(a, e), len = dist(a, e), d = [(e[0] - a[0]) / len, (e[1] - a[1]) / len];
  const pt = (u, v) => [a[0] + d[0] * u + n[0] * v, a[1] + d[1] * u + n[1] * v];
  /* calçada em volta da casa e sob a cobertura */
  const cal = [pt(-4, -dist(p[(k + 1) % p.length], p[(k + 2) % p.length]) - 3), pt(len + 9, -dist(p[(k + 1) % p.length], p[(k + 2) % p.length]) - 3), pt(len + 9, 8), pt(-4, 8)];
  L.prism('concreto', 'cimento', cal, 0, 0.12);
  /* cobertura metálica branca na frente, sobre pilares */
  const c0 = pt(-1, 0), c1 = pt(len + 1, 0), c2 = pt(len + 1, 6), c3 = pt(-1, 6);
  L.quadUp('metal', [c0[0], 3.1, c0[1]], [c1[0], 3.1, c1[1]], [c2[0], 2.6, c2[1]], [c3[0], 2.6, c3[1]]); L.quadDown('forroMetal', [c0[0], 3.05, c0[1]], [c1[0], 3.05, c1[1]], [c2[0], 2.55, c2[1]], [c3[0], 2.55, c3[1]]);
  for (let u = -1; u <= len + 1.01; u += (len + 2) / 4) { const q = pt(u, 5.8); L.tube('cinza', [q[0], 0.12, q[1]], [q[0], 2.6, q[1]], 0.06, 4); }
  painel(L, 'placaAssis', a, e, len * 0.3, len * 0.3 + 6, 3.2, 4.4, 0.05, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  /* quiosque de telha ao lado, com a lona azul na frente */
  const kq = [pt(len + 1.5, -1), pt(len + 8, -1), pt(len + 8, 6), pt(len + 1.5, 6)]; kq.forEach((q) => L.tube('madeira', [q[0], 0.12, q[1]], [q[0], 2.5, q[1]], 0.08, 5)); duasAguas(L, 'telha', kq, 2.5, 0.9, 0.5);
  L.quad2('lonaAzul', [kq[3][0], 1.6, kq[3][1]], [kq[2][0], 1.6, kq[2][1]], [kq[2][0], 2.5, kq[2][1]], [kq[3][0], 2.5, kq[3][1]]);
  /* mesas de plástico com quatro cadeiras */
  const mesa = (q, cor) => { L.box(cor, q[0], q[1], 0.8, 0.8, 0.8, 0.85); L.box('brancoPuro', q[0], q[1], 0.08, 0.08, 0.12, 0.8); [[0.75, 0], [-0.75, 0], [0, 0.75], [0, -0.75]].forEach(([x, y]) => { L.box(cor, q[0] + x, q[1] + y, 0.42, 0.42, 0.12, 0.55); L.box(cor, q[0] + x * 1.25, q[1] + y * 1.25, x ? 0.05 : 0.42, x ? 0.42 : 0.05, 0.55, 0.95); }); };
  for (let i = 0; i < 4; i++) mesa(pt(1.5 + i * (len - 3) / 3, 3), i % 2 ? 'vermelho' : 'brancoPuro');
  mesa(pt(len + 3.3, 2.5), 'vermelho'); mesa(pt(len + 6, 2.5), 'brancoPuro'); mesa(pt(2, 7.2), 'brancoPuro'); mesa(pt(len - 2, 7.2), 'vermelho');
  /* ônibus escolar */
  const o = pt(len + 16, 2); const ang = Math.atan2(d[1], d[0]) + 0.5; L.box('onibus', o[0], o[1], 9.5, 2.5, 0.5, 3.1, ang, 'onibus'); L.box('vidro', o[0], o[1], 9.56, 2.56, 1.7, 2.6, ang, 'onibus'); L.box('preto', o[0], o[1], 7.4, 2.54, 0.15, 0.6, ang);
}

export function construirEntorno(M, pronto = () => {}) {
  const grupo = new THREE.Group(); grupo.name = 'entorno'; const L = new Lote(); const muro = pts(22);
  /* casas: as lidas do satélite e fileiras ao longo das ruas do bairro */
  const casas = ENT.small.map((h) => ({ q: rotRect(h.c[0], h.c[1], h.w, h.d, h.a), h: h.h }));
  const r = rng(61);
  const bloqueado = (x, y) => y < 104 || ENT.big.some((b) => inPoly(x, y, b.pts)) || (ENT.parking && inPoly(x, y, ENT.parking)) || (x > -44 && x < 40 && y > 76 && y < 150) || (x > -136 && x < -58 && y > 70 && y < 160);
  ENT.streets.forEach((S) => {
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1]; const len = dist(a, b); const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
      for (let s = 12; s < len - 8; s += 19) [1, -1].forEach((lado) => {
        if (r() < 0.28) return; const x = a[0] + ((b[0] - a[0]) * s) / len + nx * lado * 10, y = a[1] + ((b[1] - a[1]) * s) / len + ny * lado * 10;
        if (bloqueado(x, y)) return; casas.push({ q: rotRect(x, y, 8 + r() * 4, 6.5 + r() * 2.5, ang + (lado > 0 ? 180 : 0)), h: 2.9 + r() * 0.6 });
      });
    }
  });
  /* loteamento em obras a noroeste e casas soltas na beira da rodovia, como no satélite */
  [[-250, -40, 20], [-262, -62, 20], [-280, -95, 25], [-300, -150, 20], [-318, -190, 25], [-240, -110, 60], [-150, 92, 0], [-178, 96, 0], [-232, 100, 0], [60, 96, 0], [84, 98, 0], [118, 97, 0], [150, 99, 0], [205, 98, 0], [240, 100, 0]].forEach(([x, y, a]) => casas.push({ q: rotRect(x, y, 9 + r() * 3, 7, a), h: 3 + r() * 0.5 }));
  casas.forEach((c, i) => casa(L, c.q, c.h, i));
  /* casas grandes em frente à Elétrica, do outro lado da rua de terra, ao lado do prédio (foto da rua):
     brancas, de laje, uma delas de dois andares, com muro branco alto em volta. Posição e tamanho aproximados. */
  const casarao = (x, y, w, d, h, escura) => {
    const q = rotRect(x, y, w, d, 0), p = paraFora(q); L.walls('casaBranca', p, 0, h, true); L.top('laje', q, h - 0.3); L.walls('casaBranca', insetPolyLocal(q, 0.2), h - 0.3, h, false);
    p.forEach((a, i) => { const e = p[(i + 1) % p.length]; const len = dist(a, e); const n = Math.max(1, Math.floor(len / 4)); for (let f = 0; f * 3.1 + 2.6 < h; f++) for (let k = 0; k < n; k++) painel(L, 'vidro', a, e, (len * (k + 0.5)) / n - 0.9, (len * (k + 0.5)) / n + 0.9, f * 3.1 + 0.9, f * 3.1 + 2.3, 0.02); });
    if (escura) { L.box('cinzaEscuro', x + w * 0.2, y - d / 2 - 1.2, w * 0.5, 2.4, h * 0.45, h * 0.5); [-1, 1].forEach((s) => L.box('cinzaEscuro', x + w * 0.2 + s * w * 0.24, y - d / 2 - 2.3, 0.2, 0.2, 0, h * 0.45)); }
  };
  casarao(-28, 110, 17, 12, 6.6, true); casarao(-9, 103, 11, 9, 3.7, false); casarao(-12, 131, 14, 11, 6.3, true); casarao(-33, 134, 12, 10, 3.6, false);
  [[[-42, 93], [1, 93]], [[1, 93], [1, 146]], [[1, 146], [-42, 146]], [[-42, 146], [-42, 93]], [[-19, 93], [-19, 120]], [[-42, 121], [1, 121]]].forEach(([a, e]) => L.box('casaBranca', (a[0] + e[0]) / 2, (a[1] + e[1]) / 2, Math.abs(e[0] - a[0]) + 0.2, Math.abs(e[1] - a[1]) + 0.2, 0, 2.3));
  /* galpões */
  ENT.big.forEach((b) => { const p = paraFora(b.pts); L.walls('brancoSujo', p, 0, b.h, true); duasAguas(L, 'metal', b.pts, b.h, 1.4, 0.4); });
  /* cerca do terreno vizinho: acompanha a frente e a estrada de terra que segue rente ao muro até o Seu Assis */
  /* a cerca acompanha a estrada só até o terreno do Seu Assis e ali vira à esquerda (corrigido pelo usuário) */
  cerca(L, [[-170, 58], [-66, 58], [-62.5, 52], [-84.5, 9.5], [-91, -3], [-141, 23]]);
  seuAssis(L);
  ENT.fences.forEach((f) => cerca(L, f));
  /* serras no horizonte */
  const R = rng(7);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + R() * 0.2, d = 1900 + R() * 900, w = 380 + R() * 520, h = 90 + R() * 190; const cx = Math.cos(a) * d, cy = Math.sin(a) * d;
    const base = Array.from({ length: 9 }, (_, k) => [cx + Math.cos(k / 9 * 6.283) * w * (0.8 + R() * 0.4), cy + Math.sin(k / 9 * 6.283) * w * (0.8 + R() * 0.4)]); const top = [cx + (R() - 0.5) * w * 0.4, h, cy + (R() - 0.5) * w * 0.4];
    base.forEach((p, k) => { const n = base[(k + 1) % 9]; L.triUp('serra', [p[0], 0, p[1]], [n[0], 0, n[1]], top); });
  }
  L.build(grupo, M, { name: 'entorno' });

  /* mato de caatinga: moitas baixas e arvoretas secas espalhadas fora do muro, mais verdes nas manchas de vegetação */
  (async () => {
    const [moita, arvoreta, copa] = await Promise.all(['plant_bushLarge', 'tree_default', 'tree_oak'].map(modelo));
    const folha = desaturavel(new THREE.MeshLambertMaterial({ color: 0xffffff })); const casca = desaturavel(new THREE.MeshLambertMaterial({ color: 0x7a6a58 }));
    const Q = rng(37); const moitas = [], secas = [], verdes = [];
    const livre = (x, y) => !inPoly(x, y, muro) && !(y > 46 && y < ROAD_Y1 + 3) && !casas.some((c) => inPoly(x, y, c.q)) && !(x > -136 && x < -58 && y > 76 && y < 160) && !(x > -44 && x < 40 && y > 76 && y < 150);
    const SECO = ['#9a9a62', '#8b8f58', '#a8a070', '#7f8a52', '#b0a47a'];
    for (let n = 0, g = 0; n < 800 && g < 6000; g++) { const x = -700 + Q() * 1300, y = -760 + Q() * 1200; if (!livre(x, y)) continue; moitas.push({ x, y, s: 1.2 + Q() * 2.4, sy: 1.6 + Q() * 2.2, rot: Q() * 6.28, cor: SECO[n % SECO.length] }); n++; }
    for (let n = 0, g = 0; n < 260 && g < 2000; g++) { const x = -650 + Q() * 1200, y = -720 + Q() * 1100; if (!livre(x, y) || (Math.abs(x) < 170 && y > -340 && y < 70)) continue; secas.push({ x, y, s: 2 + Q() * 1.6, sy: 2.4 + Q() * 1.6, rot: Q() * 6.28, cor: SECO[n % SECO.length] }); n++; }
    ENT.green.forEach((gr, gi) => { const xs = gr.pts.map((q) => q[0]), ys = gr.pts.map((q) => q[1]); for (let n = 0, g = 0; n < gr.trees * 4 && g < 2000; g++) { const x = Math.min(...xs) + Q() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + Q() * (Math.max(...ys) - Math.min(...ys)); if (!inPoly(x, y, gr.pts) || Math.abs(x) < 165 && Math.abs(y) < 165) continue; verdes.push({ x, y, s: 3 + Q() * 2.4, sy: 3 + Q() * 2, rot: Q() * 6.28, cor: ['#5c9a48', '#4c8a3c', '#6aa650'][(n + gi) % 3] }); n++; } });
    ENT.trees.forEach(([x, y], i) => { if (Math.abs(x) > 165 || Math.abs(y) > 165) verdes.push({ x, y, s: 2.8 + (i % 2) * 0.8, sy: 3, rot: i, cor: '#5c9a48' }); });
    [[moita, moitas], [arvoreta, secas], [copa, verdes]].forEach(([m, l]) => { if (!l.length) return; grupo.add(instanciar(m.folhas, folha, l, false)); if (m.madeira) grupo.add(instanciar(m.madeira, casca, l.map((t) => ({ ...t, s: t.s * 0.5, cor: null })), false)); });
    pronto();
  })().catch((e) => console.error('entorno:', e));
  return grupo;
}
