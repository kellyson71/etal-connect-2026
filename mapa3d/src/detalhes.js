/* O que dá cara ao campus nas fotos: a cobertura metálica do pátio (treliça espacial branca sobre pilares),
   o pergolado de madeira, o totem do IFRN, a portaria vermelha, sebes floridas, postes e bancos. */
import * as THREE from 'three';
import { pts, byId, GARDEN, HEDGES, GUARITA, PEDESTRE, ROAD_Y0, lerp2, dist, insetPoly, signedArea, rect, altura, CALCADA_FUNDOS, REDES } from './dados.js';

import { Lote } from './geo.js';
import { painel, paraFora, duasAguas } from './predios.js';
import { placa, desaturavel } from './texturas.js';

function coberturaPatio(L) {
  const b = byId('patio'); const xs = b.p.map((q) => q[0]), ys = b.p.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const H = b.h, D = 1.5, nx = 14, ny = 9, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, ym = (y0 + y1) / 2, RISE = 0.7;
  const zt = (y) => H + RISE * (1 - Math.abs(y - ym) / ((y1 - y0) / 2));
  const top = (i, j) => { const y = y0 + j * dy; return [x0 + i * dx, zt(y) - 0.12, y]; };
  const bot = (i, j) => { const y = y0 + (j + 0.5) * dy; return [x0 + (i + 0.5) * dx, zt(y) - D, y]; };
  const r = 0.045;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    if (i < nx) L.tube('aco', top(i, j), top(i + 1, j), r);
    if (j < ny) L.tube('aco', top(i, j), top(i, j + 1), r);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i < nx - 1) L.tube('aco', bot(i, j), bot(i + 1, j), r);
    if (j < ny - 1) L.tube('aco', bot(i, j), bot(i, j + 1), r);
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([a, c]) => L.tube('aco', bot(i, j), top(i + a, j + c), r * 0.8));
  }
  /* telhas metálicas em duas águas */
  const A = (x, y) => [x, zt(y), y]; const o = 0.6;
  [[y0 - o, ym], [ym, y1 + o]].forEach(([ya, yb]) => {
    const uv = [[0, 0], [x1 - x0 + 2 * o, 0], [x1 - x0 + 2 * o, yb - ya], [0, yb - ya]];
    L.quadUp('metal', A(x0 - o, ya), A(x1 + o, ya), A(x1 + o, yb), A(x0 - o, yb), uv);
    const dn = (v) => [v[0], v[1] - 0.05, v[2]]; L.quadDown('forroMetal', dn(A(x0 - o, ya)), dn(A(x1 + o, ya)), dn(A(x1 + o, yb)), dn(A(x0 - o, yb)));
  });
  /* pilares brancos quadrados, com capitel de quatro mãos-francesas */
  /* os pilares ficam nas pontas da cobertura, não recuados para o meio (corrigido pelo usuário) */
  [x0 + 0.5 * dx, x0 + 7 * dx, x1 - 0.5 * dx].forEach((x0p) => [y0 + 0.5 * dy, y1 - 0.5 * dy].forEach((y) => {
    /* o pilar do canto da entrada do bloco caía dentro do hall: fica do lado de fora, rente à parede da entrada */
    const x = x0p > 18 && y < -12 ? 15.9 : x0p;
    const hb = zt(y) - D; L.box('branco', x, y, 0.6, 0.6, 0, hb - 1.2);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, c]) => L.tube('aco', [x, hb - 1.2, y], [x + a * dx / 2, zt(y + c * dy / 2) - D, y + c * dy / 2], 0.07));
  }));
  /* bancos e mesas de pingue-pongue (foto 19) */
  [[x0 + 4, y1 - 1.2], [x0 + 12, y1 - 1.2], [x1 - 12, y1 - 1.2], [x1 - 4, y1 - 1.2]].forEach(([x, y]) => bancoMadeira(L, x, y, 0));
  [[-6, -4], [3, -4]].forEach(([x, y]) => { L.box('azulMesa', x, y, 2.74, 1.52, 0.7, 0.76); L.box('branco', x, y, 0.03, 1.7, 0.76, 0.91); [[-1.1, -0.6], [1.1, -0.6], [1.1, 0.6], [-1.1, 0.6]].forEach(([a, c]) => L.box('cinzaEscuro', x + a, y + c, 0.05, 0.05, 0, 0.7)); });
}
export function bancoMadeira(L, x, y, ang, z = 0) {
  const co = Math.cos(ang), si = Math.sin(ang); const at = (u, v) => [x + u * co - v * si, y + u * si + v * co];
  const e = at(0, 0.26);
  L.box('madeiraClara', x, y, 1.7, 0.45, z + 0.4, z + 0.46, ang); L.box('madeiraClara', e[0], e[1], 1.7, 0.06, z + 0.52, z + 0.9, ang);
  [-0.75, 0.75].forEach((u) => { const c = at(u, 0.05); L.box('cinzaEscuro', c[0], c[1], 0.06, 0.5, z, z + 0.42, ang); });
}

/* Mesa redonda de concreto com três bancos curvos. Com furo, fica em volta do tronco de uma árvore (jardim). */
export function mesaRedonda(L, x, y, furo = 0, tampo = 'brancoPuro') {
  const disco = (r, n = 12, a0 = 0, a1 = 6.283) => Array.from({ length: n }, (_, i) => { const a = a0 + ((a1 - a0) * i) / (n - (a1 - a0 > 6 ? 0 : 1)); return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
  const R = furo ? 1.05 : 0.6;
  if (furo) { L.top(tampo, disco(R, 14), 0.76, [disco(furo, 10)]); L.walls('brancoPuro', disco(R, 14), 0.66, 0.76, true); L.walls('brancoPuro', disco(furo, 10), 0.66, 0.76, false); [0.5, 2.6, 4.7].forEach((a) => L.box('brancoPuro', x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.8, 0.3, 0.3, 0, 0.66, a)); }
  else { L.prism('brancoPuro', tampo, disco(R), 0.68, 0.76); L.prism('brancoPuro', null, disco(0.16, 8), 0, 0.68); }
  [0, 2.1, 4.2].forEach((a) => { const arc = [...disco(R + 0.65, 5, a, a + 1.5), ...disco(R + 0.3, 5, a, a + 1.5).reverse()]; L.prism('brancoPuro', 'brancoPuro', arc, 0.32, 0.44); const m = [x + Math.cos(a + 0.75) * (R + 0.47), y + Math.sin(a + 0.75) * (R + 0.47)]; L.box('brancoPuro', m[0], m[1], 0.25, 0.25, 0, 0.32, a); });
}

function pergolado(L, flores) {
  const b = byId('coberta'); const xs = b.p.map((q) => q[0]), ys = b.p.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const H = 2.9;
  const colsX = [x0 + 0.5, (x0 + x1) / 2, x1 - 0.5], nY = 5;
  colsX.forEach((x) => {
    for (let j = 0; j < nY; j++) { const y = y0 + 0.6 + (j * (y1 - y0 - 1.2)) / (nY - 1); L.tube('madeira', [x, 0, y], [x, H, y], 0.11, 6); }
    L.box('madeira', x, (y0 + y1) / 2, 0.14, y1 - y0, H, H + 0.22);
  });
  for (let y = y0 + 0.2; y < y1; y += 0.55) L.box('madeira', (x0 + x1) / 2, y, x1 - x0 + 0.6, 0.07, H + 0.22, H + 0.4);
  /* mesas redondas de concreto com bancos curvos */
  [[x0 + 3.2, y0 + 4], [x1 - 3.2, y0 + 9], [x0 + 3.2, y1 - 6], [x1 - 3.4, y1 - 2.6]].forEach(([x, y]) => mesaRedonda(L, x, y));
  /* primavera (buganvília) por cima */
  for (let x = x0; x <= x1; x += 2.1) for (let y = y0; y <= y1; y += 2.3) flores.push([x + Math.sin(y * 3) * 0.6, H + 0.55, y + Math.cos(x * 2) * 0.5, 1.2 + (Math.sin(x * y) + 1) * 0.35]);
}

function totem(L, M) {
  const b = byId('obelisco'); const p = paraFora(b.p); L.prism('totem', 'totem', p, 0, b.h);
  const xs = b.p.map((q) => q[0]), ys = b.p.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys), y0 = Math.min(...ys);
  M.totemFrente = new THREE.MeshLambertMaterial({ map: placa(256, 1024, (g, w, h) => {
    g.fillStyle = '#eceeef'; g.fillRect(0, 0, w, h);
    const cs = 44, gap = 8, ox = (w - (3 * cs + 2 * gap)) / 2, oy = 40;
    [[0, 0, 1], [0, 1, 0], [0, 2, 0], [1, 0, 0], [1, 1, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0], [3, 0, 0], [3, 1, 0]].forEach(([r, c, red]) => {
      const x = ox + c * (cs + gap), y = oy + r * (cs + gap);
      if (red) { g.fillStyle = '#d0231f'; g.beginPath(); g.arc(x + cs / 2, y + cs / 2, cs / 2, 0, 7); g.fill(); } else { g.fillStyle = '#2f9e44'; g.fillRect(x, y, cs, cs); }
    });
    g.fillStyle = '#d9dbdc'; g.fillRect(30, 300, w - 60, 560); g.strokeStyle = '#b4b6b8'; g.strokeRect(30, 300, w - 60, 560);
    g.save(); g.translate(w / 2, 580); g.rotate(-Math.PI / 2); g.fillStyle = '#3e4248'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 54px system-ui, sans-serif'; g.fillText('INSTITUTO FEDERAL', 0, -52); g.font = '700 38px system-ui, sans-serif'; g.fillText('DO RIO GRANDE DO NORTE', 0, 2); g.font = '500 34px system-ui, sans-serif'; g.fillText('Campus Pau dos Ferros', 0, 50); g.restore();
  }) });
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  painel(L, 'totemFrente', [x0, y1], [x1, y1], 0, x1 - x0, 0, b.h, 0.01, uv);
  painel(L, 'totemFrente', [x1, y0], [x0, y0], 0, x1 - x0, 0, b.h, 0.01, uv);
}

/* Entrada (fotos da rua): a guarita de azulejo branco com telha fica junto ao portão de pedestres, com a janela do porteiro
   à esquerda e o portão vermelho duplo à direita. O portão de veículos é um portão comum; por dentro, uma fileira de
   blocos amarelos sai dele e faz a curva para a esquerda, separando o estacionamento. */
function portaria(L) {
  /* A guarita (sala do porteiro) ocupa o trecho de muro entre o portão de veículos e o de pedestres, com a janelinha
     preta para a rua e uma portinha de lado, na passagem de pedestres. O vão do portão de pedestres fica de frente para
     a passarela da entrada (pts 9, x 11,5–15,0), que chega direto nele (corrigido pelo usuário em 11/11/2026). */
  const b = byId('portaria'); const ys = b.p.map((q) => q[1]);
  const x0 = GUARITA[0], xg = GUARITA[1], x1 = GUARITA[2], y0 = Math.min(...ys), y1 = Math.max(...ys), H = 2.9, WY = 48.335;
  const sala = rect(x0, y0 + 0.6, xg, y1 - 0.3);
  L.walls('muro', sala, 0, H, true); L.walls('vermelho', insetPoly(sala, -0.02), 0.15, 0.4, true);
  painel(L, 'cinzaEscuro', [xg, y1 - 0.3], [x0, y1 - 0.3], 0.5, 2.3, 1, 2.1, 0.03); painel(L, 'vidroAceso', [xg, y1 - 0.3], [x0, y1 - 0.3], 0.6, 2.2, 1.08, 2.02, 0.05);
  painel(L, 'vidro', [x0, y0 + 0.6], [xg, y0 + 0.6], 0.6, 2.2, 1.08, 2.02, 0.04);
  /* portinha da guarita, no lado da passagem de pedestres */
  painel(L, 'cinzaEscuro', [xg, y0 + 0.6], [xg, y1 - 0.3], 0.6, 1.4, 0, 2.05, 0.03);
  [xg, x1].forEach((x) => L.box('muro', x, WY, 0.35, 0.5, 0, H));
  const folha = (x, dir, len, y = WY) => { const a = [x, y], e = [x + dir * len * 0.25, y - len * 0.97]; L.quad2('grade', [a[0], 0.12, a[1]], [e[0], 0.12, e[1]], [e[0], 2.2, e[1]], [a[0], 2.2, a[1]]); [0.12, 1.15, 2.2].forEach((h) => L.tube('acoVermelho', [a[0], h, a[1]], [e[0], h, e[1]], 0.04)); [a, e].forEach((q) => L.tube('acoVermelho', [q[0], 0, q[1]], [q[0], 2.25, q[1]], 0.05)); };
  const vao = x1 - xg - 0.35; folha(xg + 0.2, 1, vao / 2); folha(x1 - 0.2, -1, vao / 2);
  duasAguas(L, 'telha', rect(x0, y0 + 0.3, x1, y1), H, 0.75, 0.45);
  L.top('branco', rect(x0, y0 + 0.6, xg, y1 - 0.3), H, [], false);
  /* portão de veículos */
  const v = byId('portao-veiculos'); const vx0 = 1.5, vx1 = 8.5;
  [vx0, vx1].forEach((x) => L.box('muro', x, WY, 0.45, 0.45, 0, v.h));
  folha(vx0 + 0.25, 1, 3.2); folha(vx1 - 0.25, -1, 3.2);
  /* portão dos ônibus, na ponta esquerda da frente, ao lado da estrada de terra (foto da rua): vermelho, largo, fechado */
  { const bx0 = -48.4, bx1 = -41.4; [bx0, bx1].forEach((x) => L.box('muro', x, WY, 0.45, 0.45, 0, 2.6)); const m = (bx0 + bx1) / 2;
    [[bx0 + 0.25, m - 0.04], [m + 0.04, bx1 - 0.25]].forEach(([a, e]) => { L.quad2('grade', [a, 0.12, WY], [e, 0.12, WY], [e, 2.3, WY], [a, 2.3, WY]); [0.12, 1.2, 2.3].forEach((h) => L.tube('acoVermelho', [a, h, WY], [e, h, WY], 0.045)); [a, e].forEach((x) => L.tube('acoVermelho', [x, 0, WY], [x, 2.35, WY], 0.05)); }); }
  /* blocos amarelos: do portão para dentro e curva para a esquerda */
  const linha = [[5, 47.2], [5, 41], [4.2, 38.6], [2, 37.2], [-2, 36.8], [-26, 36.8]]; let resto = 0;
  for (let i = 0; i < linha.length - 1; i++) { const a = linha[i], e = linha[i + 1]; const len = dist(a, e); const ang = Math.atan2(e[1] - a[1], e[0] - a[0]); for (let d = resto; d < len; d += 0.75) { const q = lerp2(a, e, d / len); L.box('meioFio', q[0], q[1], 0.55, 0.3, 0, 0.22, ang); } resto = (resto + Math.ceil((len - resto) / 0.75) * 0.75) - len; }
  /* fileiras de blocos onde os carros param de frente, debaixo das árvores do estacionamento */
  [[-27, 1, 34.3], [-23.5, 7, 21.6]].forEach(([xa, xb, y]) => { for (let x = xa; x <= xb; x += 0.75) L.box('meioFio', x, y, 0.55, 0.3, 0, 0.22); });
  /* os cones da rua são peças soltas (ver cones(), mais abaixo): no passeio dá para empurrar e derrubar */
}

function sebes(L) {
  const bloco = (q, h = 1.05) => { L.walls('sebe', paraFora(q), 0, h, true); L.top('sebeFlor', q, h); };
  HEDGES.forEach((q) => bloco(q));
  [12, 13].forEach((i) => bloco(pts(i), 0.9));
  /* canteiro ao longo da fachada, debaixo da cobertura do pátio, até a entrada do bloco (fotos do pátio) */
  L.walls('concreto', rect(-20.2, -16.5, 15.9, -14.7), 0, 0.25, true); bloco(rect(-20, -16.4, 15.7, -14.9), 0.75);
  /* jardim da direita: canteiro redondo no encontro dos caminhos e as mesas de pedra em volta de duas árvores */
  L.prism('concreto', 'sebeFlor', Array.from({ length: 14 }, (_, i) => [GARDEN.hub[0] + Math.cos(i / 14 * 6.283) * 1.3, GARDEN.hub[1] + Math.sin(i / 14 * 6.283) * 1.3]), 0, 0.4);
  [[42.5, 37.5], [39, 27.5]].forEach(([x, y]) => mesaRedonda(L, x, y, 0.45, 'vermelho'));
  /* canto à direita da entrada do bloco: mesa de xadrez, com o murinho da área dos servidores atrás */
  /* O murinho só liga a quina do bloco ao muro do campus (uns 3 m), com o portãozinho vermelho. */
  { const y = -16.9, xa = 21.45, xb = 21.668 + ((y + 23.169) / 71.504) * 34.106 - 0.1; mesaRedonda(L, 23.2, -13.2, 0, 'xadrez'); L.box('muro', (xa + 1.1 + xb) / 2, y, xb - xa - 1.1, 0.18, 0, 1.9); L.quad2('grade', [xa, 0.1, y], [xa + 1.1, 0.1, y], [xa + 1.1, 1.9, y], [xa, 1.9, y]); [xa, xa + 1.1].forEach((x) => L.tube('acoVermelho', [x, 0, y], [x, 1.95, y], 0.04)); }
  /* sebe em volta dos dois jardins junto ao bloco, só nas bordas que dão para o caminho */
  [19, 21].forEach((i) => {
    const p = pts(i); const s = signedArea(p) > 0 ? 1 : -1;
    p.forEach((a, k) => {
      const b = p[(k + 1) % p.length]; const len = dist(a, b); if (len < 1.5) return;
      const n = [(-(b[1] - a[1]) / len) * s, ((b[0] - a[0]) / len) * s];
      const m = lerp2(a, b, 0.5); if (m[1] < -16.6 || m[0] < -41.5) return; // encostado na parede do bloco
      const A = lerp2(a, b, 0.4 / len), B = lerp2(a, b, 1 - 0.4 / len);
      bloco([[A[0] + n[0] * 0.15, A[1] + n[1] * 0.15], [B[0] + n[0] * 0.15, B[1] + n[1] * 0.15], [B[0] + n[0] * 1.05, B[1] + n[1] * 1.05], [A[0] + n[0] * 1.05, A[1] + n[1] * 1.05]], 0.7);
    });
  });
}

function postes(L, luzes) {
  /* rodovia: poste de concreto com braço e luminária */
  for (let x = -326; x <= 230; x += 32) if (Math.abs(x - 10) > 12) {
    const y = ROAD_Y0 - 0.5; L.tube('concreto', [x, 0, y], [x, 9, y], 0.14, 5); L.tube('cinza', [x, 8.6, y], [x, 9.1, y + 2.4], 0.05); L.box('cinzaEscuro', x, y + 2.4, 0.3, 0.7, 9, 9.15); L.box('globo', x, y + 2.4, 0.22, 0.55, 8.95, 9); luzes.push([x, y + 2.6, 11, 0.02]);
    L.tube('cinzaEscuro', [x - 0.9, 8.2, y], [x + 0.9, 8.2, y], 0.04);
  }
  /* poste de jardim com dois globos (fotos 04 e 07) */
  const globo = (x, y, ang = 0) => {
    luzes.push([x, y, 6.5, 0.02]);
    L.tube('preto', [x, 0, y], [x, 2.9, y], 0.045, 5);
    [-1, 1].forEach((d) => { const ex = x + Math.cos(ang) * d * 0.55, ey = y + Math.sin(ang) * d * 0.55; L.tube('preto', [x, 2.9, y], [ex, 3.2, ey], 0.03); L.tube('preto', [ex, 3.2, ey], [ex, 3, ey], 0.03); const c = (r) => Array.from({ length: 8 }, (_, i) => [ex + Math.cos(i / 8 * 6.283) * r, ey + Math.sin(i / 8 * 6.283) * r]); L.prism('globo', 'globo', c(0.16), 2.7, 3); });
  };
  globo(GARDEN.lamp[0], GARDEN.lamp[1]); globo(-37.5, -17.2, 0.6); globo(-30, -13.2, 0.1); globo(24.6, -11.4, 0); globo(18.5, 20, 1.57); globo(18.5, 36, 1.57); globo(8, 30, 1.57);
  /* postes altos do estacionamento (foto 16) */
  [[2, 40], [-18, 28], [-40, 40]].forEach(([x, y]) => { L.tube('branco', [x, 0, y], [x, 8, y], 0.09, 5); L.box('globo', x, y, 0.5, 0.5, 8, 8.2); luzes.push([x, y, 13, 0.02]); });
  /* pátio coberto bem iluminado, portaria, entrada do bloco, pergolado e a Elétrica */
  [[-13, -9], [0, -9], [13, -9], [-13, 4], [0, 4], [13, 4]].forEach(([x, y]) => luzes.push([x, y, 10, 0.16]));
  luzes.push([13.3, 47, 7, 0.02], [18.4, -11, 6, 0.14], [-48.5, -39, 9, 0.02], [20, 131, 12, 0.06], [-37, -86, 8, 0.02]);
}

/* Cones na rua, na direção da faixa de pedestres: uma malha por cone, com a faixa branca pintada nos vértices. */
const CONES = [[5, 58.5], [5, 56], [5, 53.5], [5, 51], [13.4, 60.5], [15, 60.5], [16.6, 60.5]];
function cones(grupo) {
  const perfil = [[0, 0], [0.2, 0], [0.2, 0.035], [0.135, 0.04], [0.098, 0.3], [0.097, 0.305], [0.077, 0.45], [0.076, 0.455], [0.04, 0.7], [0, 0.7]];
  const geo = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 10); const pos = geo.attributes.position, cor = new Float32Array(pos.count * 3);
  const laranja = new THREE.Color(0xf26a1b), branco = new THREE.Color(0xf7f7f2);
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); (y > 0.302 && y < 0.453 ? branco : laranja).toArray(cor, i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3)); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); desaturavel(mat);
  return CONES.map(([x, y]) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, altura(x, y), y); m.castShadow = true; m.userData.dinamico = true; m.name = 'cone'; grupo.add(m); return { mesh: m, x, z: y, y: altura(x, y), vx: 0, vz: 0, cai: false, tomba: 0, rola: 0, qx: 1, qz: 0 }; });
}

export function construirDetalhes(M) {
  const grupo = new THREE.Group(); grupo.name = 'detalhes'; const flores = [];
  const L = new Lote();
  const luzes = [];
  const destaque=(name,build,cor)=>{const g=new THREE.Group();g.name=name;g.userData.event=cor;const lote=new Lote();build(lote);lote.build(g,M,{name});grupo.add(g);};
  destaque('patio',l=>coberturaPatio(l),'patio');destaque('obelisco',l=>totem(l,M),null);
  pergolado(L, flores); portaria(L); sebes(L); postes(L, luzes);
  L.build(grupo, M, { name: 'det' });
  /* poças de luz no chão, somadas à cena: só aparecem à noite */
  const P = new Lote(); luzes.forEach(([x, y, r, h]) => P.quad('poca', [x - r, h, y + r], [x + r, h, y + r], [x + r, h, y - r], [x - r, h, y - r], [[0, 0], [1, 0], [1, 1], [0, 1]]));
  P.build(grupo, M, { cast: false, receive: false, order: 5, name: 'pocas' });
  /* fundos do bloco: calçada de uns 3,8 m na saída da porta de vidro, com faixa tátil, e as redes entre as árvores */
  { const F = new Lote(); F.prism('concreto', 'calcadaChao', CALCADA_FUNDOS, 0, 0.05);
    F.top('faixaAmarelaChao', [[-27, -54.2], [-8.5, -54.2], [-8.5, -53.9], [-27, -53.9]], 0.055);
    for (let i = 0; i < REDES.length - 1; i++) {
      const [ax, ay] = REDES[i], [bx, by] = REDES[i + 1]; const x0 = ax + 0.35, x1 = bx - 0.35, n = 10, cor = ['redeA', 'redeB', 'redeC'][i % 3];
      const pt = (t) => { const x = x0 + (x1 - x0) * t, s = 4 * t * (1 - t); return { x, h: 1.35 - 0.62 * s, w: 0.06 + 0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.12) / 0.76))) }; };
      for (let j = 0; j < n; j++) { const p = pt(j / n), q = pt((j + 1) / n); F.quad2(cor, [p.x, p.h, ay - p.w], [q.x, q.h, by - q.w], [q.x, q.h + 0.02, by + q.w], [p.x, p.h + 0.02, ay + p.w]); }
      F.tube('cinzaEscuro', [ax, 1.5, ay], [x0, 1.35, ay], 0.012); F.tube('cinzaEscuro', [bx, 1.5, by], [x1, 1.35, by], 0.012);
    }
    F.build(grupo, M, { name: 'fundos' }).forEach((m) => { m.userData.dinamico = true; }); }
  return { grupo, flores, cones: cones(grupo) };
}
