/* Chão do campus e do entorno, na mesma ordem de camadas do protótipo (drawGround em campus3d.js).
   Cada camada é uma malha desenhada em ordem, sem gravar profundidade: nada pisca quando a câmera se afasta. */
import * as THREE from 'three';
import { inPoly, CANTEIROS_ANEXO, BAIXO, BAIXO_H, CALCADAS, CALCADA_L, noAnexo, byId, pts, F, XT, ENT, FLATS, GARDEN, ROAD_Y0, ROAD_Y1, ROAD_MID, CROSS_X, CROSS_W, GUARITA, PEDESTRE, rect, lerp2, dist, insetPoly, signedArea, rng } from './dados.js';
import { Lote } from './geo.js';
import { duasAguas, painel } from './predios.js';

/* Faixa de largura w ao longo de uma linha. */
function faixa(L, mat, linha, w, fechar = false) {
  const P = fechar ? [...linha, linha[0]] : linha;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1]; const len = dist(a, b); if (len < 0.01) continue; const n = [-(b[1] - a[1]) / len * w / 2, (b[0] - a[0]) / len * w / 2];
    L.top(mat, [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]], 0);
    const c = Array.from({ length: 8 }, (_, k) => [b[0] + Math.cos(k / 8 * 6.283) * w / 2, b[1] + Math.sin(k / 8 * 6.283) * w / 2]); L.top(mat, c, 0);
  }
}
const quadAt = (q, u, v) => lerp2(lerp2(q[0], q[1], u), lerp2(q[3], q[2], u), v);

export function construirTerreno(M) {
  const grupo = new THREE.Group(); grupo.name = 'terreno'; let ordem = -200;
  const camada = (fn) => { const L = new Lote(); fn(L); L.build(grupo, M, { cast: false, receive: true, order: ordem++, name: 'chao' }); };
  const muro = pts(22);

  /* 1. dentro do muro */
  camada((L) => L.top('terraChao', rect(-260, -340, 120, 60), 0));
  camada((L) => {
    L.top('matoChao', [[-62, -150], [-137.5, -290], [-185.1, -283], [-132.5, -193.7], [-112, -188], [-92, -158]], 0);
    L.top('gramaChao', [[-190, -290], [-130, -295], [-112, -240], [-128, -226], [-152, -226]], 0);
    L.top('gramaChao', rect(11, 11, 60, 50), 0);
    L.top('chaoChao', [[-112, -62], [-72, -58], [-72, 11], [-40, 60], [-70, 60]], 0);
    /* Entre o bloco principal, a cantina e o Anexo é tudo piso de bloquete, como em frente à cantina (informado pelo usuário). */
    L.top('intertravadoChao', [[-59, -52], [-2, -53], [-2, -70], [-23, -91], [-38, -117], [-66, -100], [-58, -70]], 0);
    L.top('paraleloChao', rect(-200, 11, 11, 60), 0);
  });
  camada((L) => {
    L.top('intertravadoChao', [[-72, -58], [-58, -52], [24, -52], [37, -12], [37, 11], [-72, 11]], 0);
    const M6 = muro[6], M7 = muro[7], M8 = muro[8]; const W = 6.5;
    const off = (a, b) => { const len = dist(a, b); const nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len; const s = nx > 0 ? 1 : -1; return [nx * s * W, ny * s * W]; };
    const oA = off(M8, M7), oB = off(M7, M6);
    L.top('calcadaChao', [M8, M7, [M7[0] + oA[0], M7[1] + oA[1]], [M8[0] + oA[0], M8[1] + oA[1]]], 0);
    L.top('calcadaChao', [M7, M6, [M6[0] + oB[0], M6[1] + oB[1]], [M7[0] + oB[0], M7[1] + oB[1]]], 0);
    [XT.forecourt, XT.pad].forEach((q) => q && L.top('calcadaChao', q, 0));
    /* do ginásio para os fundos é calçamento, não areia (informado pelo usuário) */
    L.top('paraleloChao', insetPoly(byId('ginasio').p, -9), 0); L.top('paraleloChao', insetPoly(byId('academia').p, -6), 0);
  });
  camada((L) => CALCADAS.forEach((id) => L.top('faixaAmarelaChao', insetPoly(byId(id).p, -CALCADA_L), 0)));
  camada((L) => {
    CALCADAS.forEach((id) => L.top('passarelaChao', insetPoly(byId(id).p, -(CALCADA_L - 0.3)), 0));
  });
  camada((L) => {
    /* Nos fundos não há caminho até a estufa e a Casa do Mel: é terreno gramado, com um pouco de mato (informado pelo usuário). */
    /* Jardim à direita da entrada: caminhos largos de placas, com faixa amarela dos dois lados (foto do jardim). */
    faixa(L, 'faixaAmarelaChao', GARDEN.edge, 2.9, true); GARDEN.spokes.forEach((q) => faixa(L, 'faixaAmarelaChao', [GARDEN.hub, q], 2.7));
  });
  camada((L) => {
    faixa(L, 'passarelaChao', GARDEN.edge, 2.4, true); GARDEN.spokes.forEach((q) => faixa(L, 'passarelaChao', [GARDEN.hub, q], 2.2));
    /* chão de areia debaixo das mesas de pedra */
    [[42.5, 37.5], [39, 27.5]].forEach(([x, y]) => L.top('terraForaChao', Array.from({ length: 14 }, (_, i) => [x + Math.cos(i / 14 * 6.283) * 3.2, y + Math.sin(i / 14 * 6.283) * 3.2]), 0));
  });

  /* 2. fora do muro: tudo que passou da divisa é coberto */
  camada((L) => L.top('terraForaChao', rect(-3200, -3200, 3200, 3200), 0, [muro]));
  /* manchas de capim seco e de chão batido, para o terreno de fora não ficar liso */
  camada((L) => { const r = rng(91); for (let i = 0; i < 90; i++) { const x = -900 + r() * 1700, y = -950 + r() * 1500, s = 40 + r() * 110; const p = Array.from({ length: 9 }, (_, k) => { const a = (k / 9) * 6.283, d = s * (0.35 + r() * 0.3); return [x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8]; }); if (p.some((q) => inPoly(q[0], q[1], muro))) continue; L.top(i % 3 ? 'matoChao' : 'chaoChao', p, 0); } });
  camada((L) => {
    ENT.green.forEach((g) => L.top('gramaChao', g.pts, 0));
    ENT.lots.forEach((l) => L.top('chaoChao', l.pts, 0));
  });
  camada((L) => {
    ENT.streets.forEach((s) => faixa(L, 'estradaChao', s, 4.5));
    faixa(L, 'estradaChao', [[7.5, 77], [9.5, 100], [12.5, 174], [13, 205]], 6);
    ENT.roads.forEach((r) => faixa(L, 'estradaChao', r.pts, r.w));
    if (ENT.parking) { L.top('calcadaChao', ENT.parking, 0); L.top('calcadaChao', rect(-106, 76, -90, 78), 0); }
  });
  camada((L) => {
    L.top('asfaltoChao', rect(-900, ROAD_Y0, 900, ROAD_Y1), 0);
    L.top('paraleloChao', rect(-900, 49, 900, ROAD_Y0), 0);
    L.top('calcadaChao', [[13.5, ROAD_Y1], [34.6, ROAD_Y1], [34.6, 95.6], [13.5, 95.6]], 0);
  });
  camada((L) => {
    L.top('faixaChao', rect(-900, ROAD_Y0 + 0.3, 900, ROAD_Y0 + 0.5), 0); L.top('faixaChao', rect(-900, ROAD_Y1 - 0.5, 900, ROAD_Y1 - 0.3), 0);
    L.top('faixaAmarelaChao', rect(-900, ROAD_MID - 0.26, 900, ROAD_MID - 0.1), 0); L.top('faixaAmarelaChao', rect(-900, ROAD_MID + 0.1, 900, ROAD_MID + 0.26), 0);
    for (let y = ROAD_Y0 + 0.7; y < ROAD_Y1 - 0.8; y += 1) L.top('faixaChao', rect(CROSS_X - CROSS_W / 2, y, CROSS_X + CROSS_W / 2, y + 0.5), 0);
  });
  camada((L) => {
    L.top('paraleloChao', rect(1.5, 61, 8.5, ROAD_Y0), 0);
    /* Calçada em frente ao portão de pedestres, até a faixa: outra textura, quase no nível do chão. */
    L.top('calcadaChao', rect(GUARITA[1], 50.4, GUARITA[2], ROAD_Y0), 0);
    /* Canteiros em forma de pílula junto ao muro, com borda de tijolo e grama: é neles que ficam as árvores da frente. */
    const pilula = (cx, cy, meio, r) => { const p = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; p.push([cx + meio + Math.cos(a) * r, cy + Math.sin(a) * r]); } for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + (i / 8) * Math.PI; p.push([cx - meio + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
    [[-31.6, 5], [-18.8, 2.5], [-0.4, 2.5], [25.8, 2.5], [32.5, 2.5], [45, 6]].forEach(([x, m]) => { L.top('tijoloChao', pilula(x, 52.2, m, 1.6), 0); });
  });
  camada((L) => [[-31.6, 5], [-18.8, 2.5], [-0.4, 2.5], [25.8, 2.5], [32.5, 2.5], [45, 6]].forEach(([x, m]) => { const p = []; const r = 1.3; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; p.push([x + m + Math.cos(a) * r, 52.2 + Math.sin(a) * r]); } for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + (i / 8) * Math.PI; p.push([x - m + Math.cos(a) * r, 52.2 + Math.sin(a) * r]); } L.top('gramaChao', p, 0); }));

  /* 3. por cima: quadras, jardins, caminhos e pisos */
  camada((L) => {
    FLATS.forEach((b) => {
      if (b.id === 'piscina') { L.top('calcadaChao', b.p, 0); }

      else if (b.id === 'campo') L.top('campoChao', b.p, 0);
    });
    /* Os dois jardins junto ao bloco são gramados, com sebe de ixora em volta (fotos do usuário). */
    L.top('gramaChao', pts(19), 0); L.top('gramaChao', pts(21), 0);
    CANTEIROS_ANEXO.forEach((k) => { L.top('faixaAmarelaChao', insetPoly(k.q, -0.25), 0); });

  });
  camada((L) => {
    CANTEIROS_ANEXO.forEach((k) => L.top('gramaChao', k.q, 0));
    faixa(L, 'intertravadoChao', pts(20), 1.1);
    const c = pts(9); const x0 = Math.min(...c.map((q) => q[0])), x1 = Math.max(...c.map((q) => q[0])), y0 = Math.min(...c.map((q) => q[1])), y1 = Math.max(...c.map((q) => q[1]));
    void x0; void x1; void y0; void y1;
    /* linhas das quadras */
    const campo = FLATS.find((b) => b.id === 'campo'); if (campo) {
      const q = [campo.p[0], campo.p[3], campo.p[2], campo.p[1]]; const ln = (u0, v0, u1, v1) => faixa(L, 'faixaChao', [quadAt(q, u0, v0), quadAt(q, u1, v1)], 0.25);
      const box = (u0, u1, v0, v1) => { ln(u0, v0, u1, v0); ln(u1, v0, u1, v1); ln(u1, v1, u0, v1); ln(u0, v1, u0, v0); };
      box(0.05, 0.95, 0.05, 0.95); ln(0.5, 0.05, 0.5, 0.95); box(0.05, 0.2, 0.28, 0.72); box(0.8, 0.95, 0.28, 0.72);
    }

  });

  /* Piscina: borda e água um pouco abaixo. */
  const S = new Lote(); const pq = F('piscina');
  /* Pátio coberto e passarela da entrada: um degrau acima do paralelepípedo do estacionamento (fotos do usuário). */
  S.prism('concreto', 'cimento', pts(5), 0, 0.12);
  { const c = pts(9); const x0 = Math.min(...c.map((q) => q[0])), x1 = Math.max(...c.map((q) => q[0])), y0 = Math.min(...c.map((q) => q[1])), y1 = Math.max(...c.map((q) => q[1]));
    S.walls('concreto', rect(x0, y0, x1, y1), 0, 0.08, true); S.top('passarela', rect(x0 + 0.4, y0, x1 - 0.4, y1), 0.08); S.top('tatil', rect(x0, y0, x0 + 0.4, y1), 0.08); S.top('tatil', rect(x1 - 0.4, y0, x1, y1), 0.08); }
  /* Caminho entre o bloco e o Anexo, em volta do coreto: placas um degrau acima do bloquete, com a faixa amarela nas
     bordas. Em volta do coreto o chão é o mesmo bloquete, sem terra (corrigido pelo usuário). */
  const plaza = F('caminho entre bloco e anexo');
  if (plaza) {
    S.walls('meioFio', plaza, 0, 0.1, true); S.top('passarela', plaza, 0.1);
    const sg = signedArea(plaza) > 0 ? 1 : -1;
    plaza.forEach((a, i) => { const b = plaza[(i + 1) % plaza.length]; const len = dist(a, b); if (len < 0.05) return; const n = [(-(b[1] - a[1]) / len) * sg * 0.22, ((b[0] - a[0]) / len) * sg * 0.22]; S.top('faixaAmarela', [a, b, [b[0] + n[0], b[1] + n[1]], [a[0] + n[0], a[1] + n[1]]], 0.103); });
  }
  /* Ilha gramada entre a calçada da frente e a rodovia: mureta baixa de tijolo em volta, aberta nos dois portões. */
  { const q = pts(25); const xa = Math.min(...q.map((p) => p[0])), xb = Math.max(...q.map((p) => p[0])), ya = Math.min(...q.map((p) => p[1])), yb = Math.max(...q.map((p) => p[1]));
    [[xa, 1.5], [8.5, GUARITA[1]], [GUARITA[2], xb]].forEach(([x0, x1]) => { const r = rect(x0, ya, x1, yb), d = insetPoly(r, 0.22); S.walls('tijolo', r, 0, 0.28, true); S.walls('tijolo', d, 0.18, 0.28, false); S.top('tijolo', r, 0.28, [d]); S.top('grama', d, 0.18); }); }
  /* Quadra de vôlei: caixa de areia elevada, com a mureta em volta, postes e rede. */
  { const v = FLATS.find((b) => b.id === 'volei'); if (v) { const d = insetPoly(v.p, 0.25); S.walls('concreto', v.p, 0, 0.4, true); S.walls('concreto', d, 0.3, 0.4, false); S.top('concreto', v.p, 0.4, [d]); S.top('areia', d, 0.3);
    const q = dist(v.p[0], v.p[1]) >= dist(v.p[1], v.p[2]) ? v.p : [v.p[1], v.p[2], v.p[3], v.p[0]]; const a = quadAt(q, 0.5, 0.08), e = quadAt(q, 0.5, 0.92);
    [a, e].forEach((p) => S.tube('cinzaEscuro', [p[0], 0.3, p[1]], [p[0], 2.75, p[1]], 0.05, 5)); S.quad2('rede', [a[0], 1.75, a[1]], [e[0], 1.75, e[1]], [e[0], 2.7, e[1]], [a[0], 2.7, a[1]]);
    S.top('faixa', [quadAt(q, 0.1, 0.12), quadAt(q, 0.9, 0.12), quadAt(q, 0.9, 0.88), quadAt(q, 0.1, 0.88)], 0.305, [[quadAt(q, 0.105, 0.13), quadAt(q, 0.895, 0.13), quadAt(q, 0.895, 0.87), quadAt(q, 0.105, 0.87)]]); } }
  /* Grade em volta da área da piscina. */
  { const ap = F('area da piscina'); if (ap) ap.forEach((a, i) => { const b = ap[(i + 1) % ap.length]; const len = dist(a, b); S.quad2('alambrado', [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 1.9, b[1]], [a[0], 1.9, a[1]]); S.tube('cinza', [a[0], 1.9, a[1]], [b[0], 1.9, b[1]], 0.03); for (let d = 0; d < len; d += 2.5) { const p = lerp2(a, b, d / len); S.tube('cinza', [p[0], 0, p[1]], [p[0], 1.95, p[1]], 0.035); } }); }
  /* Terreno rebaixado: chão de terra 65 cm abaixo, com o arrimo das calçadas em volta e a escada atrás do Anexo. */
  S.top('terra', BAIXO, BAIXO_H); S.walls('concreto', BAIXO, BAIXO_H, 0, false);
  for (let i = 0; i < 5; i++) { const c = noAnexo(3.25 + 0.15 + i * 0.3, 14); S.box('concreto', c[0], c[1], 0.3, 2.4, BAIXO_H, -0.18 * (i + 1) + 0.01, Math.atan2(-0.8617, -0.5075), 'cimento'); }
  { const a = noAnexo(3.25, 12.7), e = noAnexo(4.8, 12.7); S.tube('vermelho', [a[0], 0.9, a[1]], [e[0], 0, e[1]], 0.035); const a2 = noAnexo(3.25, 15.3), e2 = noAnexo(4.8, 15.3); S.tube('vermelho', [a2[0], 0.9, a2[1]], [e2[0], 0, e2[1]], 0.035); }
  if (pq) { S.top('branco', pq, 0.12, [insetPoly(pq, 0.5)]); S.walls('branco', pq, 0, 0.12, true); S.top('agua', insetPoly(pq, 0.5), 0.04); }

  /* Muro: branco, com faixa vermelha na frente, aberto na portaria e no portão de veículos. */
  const H = 2.3; const s = signedArea(muro) > 0 ? 1 : -1;
  const trecho = (a, b, frente) => {
    const len = dist(a, b); if (len < 0.05) return; const n = [-(b[1] - a[1]) / len * 0.1, (b[0] - a[0]) / len * 0.1];
    const q = [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]];
    S.walls('muro', q, 0, H, true); S.top('muro', q, H);
    if (frente) { const f = [[a[0] + n[0] * 1.3, a[1] + n[1] * 1.3], [b[0] + n[0] * 1.3, b[1] + n[1] * 1.3], [b[0] - n[0] * 1.3, b[1] - n[1] * 1.3], [a[0] - n[0] * 1.3, a[1] - n[1] * 1.3]]; S.walls('vermelho', f, 1, 1.45, true); }
  };
  /* O campo de futebol também é do campus: o muro dá a volta nele. A passagem entre a piscina e o campo é um vão no
     muro antigo. As duas casinhas ao lado do campo estão em posição estimada (o usuário não confirmou no local). */
  { const P0 = [-151.667, -225.887], P3 = [-186.312, -205.48], u = [0.5075, 0.8617], v = [-0.8617, 0.5075];
    const c1 = [P0[0] - u[0] * 9 - v[0] * 2, P0[1] - u[1] * 9 - v[1] * 2], c2 = [P3[0] - u[0] * 9 + v[0] * 2, P3[1] - u[1] * 9 + v[1] * 2];
    trecho(muro[4], c1, false); trecho(c1, c2, false); trecho(c2, muro[5], false);
    [10, 27].forEach((d) => { const c = [P0[0] - u[0] * 5 + v[0] * d, P0[1] - u[1] * 5 + v[1] * d]; const q = [[-3, -2], [3, -2], [3, 2], [-3, 2]].map(([a, b]) => [c[0] + v[0] * a + u[0] * b, c[1] + v[1] * a + u[1] * b]); S.walls('branco', q, 0, 2.7, true); duasAguas(S, 'telha', q, 2.7, 0.9, 0.4); painel(S, 'porta', q[3], q[2], 2.4, 3.3, 0, 2.1, 0.02); }); }
  muro.forEach((a, i) => {
    const b = muro[(i + 1) % muro.length]; const frente = (a[1] + b[1]) / 2 > 40;
    if (i === 4) { const m0 = lerp2(a, b, 0.46), m1 = lerp2(a, b, 0.54); trecho(a, m0, false); trecho(m1, b, false); return; }
    if (!frente) return trecho(a, b, false);
    const [l, r] = a[0] < b[0] ? [a, b] : [b, a]; let x = l[0];
    /* três vãos: o portão dos ônibus na ponta esquerda, o de veículos e o de pedestres */
    [[-48.4, -41.4], [1.5, 8.5], PEDESTRE].forEach(([g0, g1]) => { trecho([x, l[1]], [g0, l[1]], true); x = g1; });
    trecho([x, l[1]], [r[0], l[1]], true);
  });
  void s;
  S.build(grupo, M, { name: 'muro' });
  return grupo;
}
