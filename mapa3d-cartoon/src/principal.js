import { fracaoRampa } from './subidas.js';
/* Bloco principal, feito a partir da planta de 2012 já conferida (prototipo/plan-data.js): cada sala, corredor,
   porta, a rampa, a escada e o pátio interno ficam onde a planta diz. O que entra de novo vem das fotos:
   azulejo amarelo, platibanda de pastilha azul, janelas e condensadoras no pátio interno, corredores de azulejo
   branco com faixa vermelha, piso pintado do pátio, fachada curva do auditório com janelas altas e estreitas. */
import * as THREE from 'three';
import { PLAN, wp, FH, AUD_H, ENTRY_H, zonePoly, insetPoly, lerp2, dist, rng, centroid, inPoly } from './dados.js';
import { Lote } from './geo.js';
import { normalDe, painel, janela, arCond, portaVidro, platibanda, janelasNaAresta, duasAguas, saliencia, paraFora } from './predios.js';
import { placa } from './texturas.js';

const WORLD = PLAN.world;
const toPlanX = (wx) => (wx - WORLD.x0) / WORLD.sx;
const WP = (pl) => pl.map(wp);
const H_TOTAL = 11.7, BAND = H_TOTAL - 3 * FH;
const ALT_SALA = 3.15;

const MAIN = [[235, 24], [727.6, 24], [934.8, 542], [235, 542]];
const AUD = [[20, 24], [235, 24], [235, 492], [197, 492], [147, 488], [127, 476], [100, 452], [86, 440], [78, 416], [72, 392], [68, 380], [67, 332], [20, 332]];
const ENTRY = [[860, 542], [922, 542], [922, 614], [860, 614]];
const STAIR_TOWER = [[168, 182.5], [216, 182.5], [216, 250.8], [168, 250.8]];

/* Aresta a→b (em unidades da planta) com a face virada para longe do ponto de referência. */
function face(aP, bP, refP) {
  const a = wp(aP), b = wp(bP), c = wp(refP), n = normalDe(a, b), m = lerp2(a, b, 0.5);
  return (c[0] - m[0]) * n[0] + (c[1] - m[1]) * n[1] < 0 ? [a, b] : [b, a];
}
const PISO = { classroom: 'pisoSala', laboratory: 'pisoLab', office: 'pisoAdm', staff: 'pisoAdm', reception: 'pisoAdm', restroom: 'pisoWc', auditorium: 'pisoAud' };

/* Sala fechada: paredes para o corredor e uma tampa lisa na cor do uso, com o número em cima. Vista de cima, a sala
   aberta parecia vazia (comentário do usuário); fechada, o andar se lê como uma planta em relevo. */
const TETO = { classroom: 'tetoAula', laboratory: 'tetoLab', office: 'tetoAdm', staff: 'tetoAdm', reception: 'tetoRec', restroom: 'tetoWc' };
function sala(L, z, zona, alt, aberta) {
  const pw = WP(zonePoly(zona)); const out = insetPoly(pw, 0.12), inn = insetPoly(pw, 0.27);
  L.walls('corredor', out, z, z + alt, true, z);
  if (aberta) { L.walls('sala', inn, z, z + alt, false); L.top('branco', out, z + alt, [inn]); L.top(PISO[zona.kind] || 'pisoAdm', inn, z + 0.015); }
  else L.top(TETO[zona.kind] || 'tetoAdm', out, z + alt);
  return inn;
}

function escada(L, z, zona) {
  const [a, , c] = WP(zonePoly(zona)); const x0 = a[0] + 0.15, x1 = c[0] - 0.15, y0 = a[1] + 0.15, y1 = c[1] - 0.15;
  const meio = (x0 + x1) / 2, larg = (x1 - x0) / 2 - 0.06, pat = 1.25, n = 10, r = FH / (2 * n), t = (y1 - y0 - pat - 0.3) / n;
  for (let i = 0; i < n; i++) {
    L.box('concreto', (x0 + meio) / 2, y1 - 0.3 - (i + 0.5) * t, larg, t, z + i * r - 0.1, z + (i + 1) * r, 0, 'cimento');
    L.box('concreto', (meio + x1) / 2, y0 + pat + (i + 0.5) * t, larg, t, z + FH / 2 + i * r - 0.1, z + FH / 2 + (i + 1) * r, 0, 'cimento');
  }
  L.box('concreto', meio, y0 + pat / 2, x1 - x0, pat, z + FH / 2 - 0.15, z + FH / 2, 0, 'cimento');
  /* corrimão no meio */
  /* entre os dois lances há uma parede inteira, não corrimão: quem sobe não vê quem desce (informado pelo usuário) */
  L.box('corredorLiso', meio, (y0 + pat + y1) / 2, 0.12, y1 - y0 - pat, z, z + FH - 0.3, 0, 'branco');
}

/* A rampa é fechada por paredes: uma no meio, entre a pista que sobe e a que volta, e outra do lado da circulação.
   Quem sobe não vê quem desce. O piso é de borracha preta (informado pelo usuário). */
function paredesRampa(L, z) {
  const topo = z + FH - 0.3;
  const m0 = wp([752.5, 190]), m1 = wp([876, 498]); const n = normalDe(m0, m1); const q = [[m0[0] - n[0] * 0.07, m0[1] - n[1] * 0.07], [m1[0] - n[0] * 0.07, m1[1] - n[1] * 0.07], [m1[0] + n[0] * 0.07, m1[1] + n[1] * 0.07], [m0[0] + n[0] * 0.07, m0[1] + n[1] * 0.07]];
  L.walls('corredor', q, z, topo, true, z); L.top('branco', q, topo);
  const a = wp([705, 165]), b = wp([841, 505]); const k = normalDe(a, b); const p = [[a[0] - k[0] * 0.07, a[1] - k[1] * 0.07], [b[0] - k[0] * 0.07, b[1] - k[1] * 0.07], [b[0] + k[0] * 0.07, b[1] + k[1] * 0.07], [a[0] + k[0] * 0.07, a[1] + k[1] * 0.07]];
  L.walls('corredor', p, z, topo, true, z); L.top('branco', p, topo);
}

function rampa(L, z) {
  const P = []; PLAN.rampLoop.forEach((q) => { const w = wp(q); if (!P.length || dist(P[P.length - 1], w) > 0.05) P.push(w); });
  const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + dist(P[i - 1], P[i]));
  const total = acc[acc.length - 1], hw = 1.12;
  const sec = P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const L_ = dist(a, b) || 1; const n = [-(b[1] - a[1]) / L_, (b[0] - a[0]) / L_];
    const sourceIndex = i === P.length - 1 ? PLAN.rampLoop.length - 1 : PLAN.rampLoop.findIndex(q => dist(wp(q), p) < 0.001);
    const h = z + fracaoRampa(PLAN.rampLoop[sourceIndex], sourceIndex, PLAN.rampLoop) * FH;
    return { l: [p[0] + n[0] * hw, h, p[1] + n[1] * hw], r: [p[0] - n[0] * hw, h, p[1] - n[1] * hw], u: acc[i] };
  });
  for (let i = 0; i < sec.length - 1; i++) {
    const s = sec[i], e = sec[i + 1]; const uv = [[0, s.u], [hw * 2, s.u], [hw * 2, e.u], [0, e.u]];
    L.quadUp('borracha', s.l, s.r, e.r, e.l, uv);
    const d = (v) => [v[0], v[1] - 0.18, v[2]];
    L.quadDown('laje', d(s.l), d(s.r), d(e.r), d(e.l));
    [['l', 1], ['r', 1]].forEach(([k]) => {
      const up = (v, hh) => [v[0], v[1] + hh, v[2]];
      L.quad2('branco', d(s[k]), d(e[k]), up(e[k], 0.12), up(s[k], 0.12));
    });
  }
}

/* Mureta de azulejo com tampo, de a até b. */
function mureta(L, a, b, z, h = 1.1) {
  const n = normalDe(a, b); const q = [[a[0] - n[0] * 0.08, a[1] - n[1] * 0.08], [b[0] - n[0] * 0.08, b[1] - n[1] * 0.08], [b[0] + n[0] * 0.08, b[1] + n[1] * 0.08], [a[0] + n[0] * 0.08, a[1] + n[1] * 0.08]];
  L.walls('azulejo', q, z, z + h, true, 0); L.top('branco', q, z + h);
  L.tube('vermelho', [a[0], z + h + 0.12, a[1]], [b[0], z + h + 0.12, b[1]], 0.035);
}

function banco(L, x, y, ang, z = 0) {
  const co = Math.cos(ang), si = Math.sin(ang); const at = (u, v) => [x + u * co - v * si, y + u * si + v * co];
  const s = at(0, 0), e = at(0, 0.28);
  L.box('madeira', s[0], s[1], 1.6, 0.45, z + 0.4, z + 0.46, ang); L.box('madeira', e[0], e[1], 1.6, 0.06, z + 0.5, z + 0.9, ang);
  [-0.7, 0.7].forEach((u) => { const c = at(u, 0.05); L.box('cinzaEscuro', c[0], c[1], 0.06, 0.5, z, z + 0.42, ang); });
}

export function construirPrincipal(M) {
  const grupo = new THREE.Group(); grupo.name = 'principal';
  const mk = (n) => { const g = new THREE.Group(); g.name = n; grupo.add(g); return g; };
  const gCasca = mk('casca'), gTetosBaixos = mk('tetos-baixos'), gCobertura = mk('cobertura');
  const gNiveis = [0, 1, 2].map((k) => mk('nivel-' + k));
  const gSubidas = [0, 1].map((k) => mk('subida-' + k));
  const vasos = []; const rotulos = [];

  const court = zonePoly(PLAN.floors[0].zones.find((z) => z.kind === 'courtyard'));
  const courtW = WP(court);
  const zRampa = zonePoly(PLAN.floors[1].zones.find((z) => z.kind === 'ramp'));
  const zEscada = PLAN.floors[1].zones.find((z) => z.kind === 'stairs');

  /* ---------- andares ---------- */
  PLAN.floors.forEach((f, k) => {
    const L = new Lote(); const z = k * FH + 0.03; const topo = k === 2 ? 3 * FH : z + FH - 0.03 + 0.03;
    const R = rng(101 + k * 37);
    /* laje e piso */
    const contorno = WP(k === 0 ? f.outlinePts : MAIN);
    const furos = [courtW]; if (k > 0) { furos.push(insetPoly(WP(zRampa), 0.06)); furos.push(WP(zonePoly(zEscada))); }
    L.top('piso', contorno, z, furos);
    if (k > 0) { L.top('laje', contorno, z - 0.3, furos, false); furos.forEach((h) => L.walls('branco', h, z - 0.3, z, false)); }

    /* fachadas de fora, com janelas */
    const fach = (aP, bP, refP, o = {}) => {
      const [a, b] = face(aP, bP, refP); L.wall('azulejo', a, b, z - 0.03, topo, 0, 0);
      if (o.semJanela) return [a, b];
      janelasNaAresta(L, a, b, { acesas: 0.05, floors: 1, fh: FH, base: z, R, w: o.w ?? 1.5, hj: o.hj ?? 1.1, sill: o.sill ?? 1.15, passo: o.passo ?? 3.5, ar: o.ar ?? 0.28, margem: 1, pula: o.pula && ((ff, u, len) => o.pula(toPlanX(lerp2(a, b, u / len)[0]), u, len)) });
      return [a, b];
    };
    const dentro = [500, 300];
    /* norte: no térreo, a porta de vidro no fim da circulação da esquerda */
    const [na, nb] = fach([235, 24], [727.6, 24], dentro, { pula: k === 0 ? (x) => x > 330 && x < 390 : null });
    if (k === 0) { const u = dist(na, wp([359.5, 24])); portaVidro(L, na, nb, u, 2); }
    /* leste (inclinada): banheiros e rampa, janelas menores e altas */
    fach([727.6, 24], [934.8, 542], dentro, { w: 1.1, hj: 0.7, sill: 1.7, passo: 4.4, ar: 0 });
    /* sul: de frente para o pátio coberto. No térreo abre para o hall de entrada. */
    if (k === 0) { fach([235, 542], [860, 542], dentro); fach([922, 542], [934.8, 542], dentro, { semJanela: true }); } else fach([235, 542], [934.8, 542], dentro);
    /* oeste: acima do telhado do auditório */
    if (k > 0) fach([235, 24], [235, 542], dentro, { semJanela: true });
    else fach([235, 492], [235, 542], dentro, { semJanela: true });

    /* pátio interno: paredes compridas com janelas e muitas condensadoras; as pontas são abertas para os corredores */
    const pat = (aP, bP, refP) => {
      const [a, b] = face(aP, bP, refP); L.wall('azulejo', a, b, z - 0.03, topo, 0, 0);
      janelasNaAresta(L, a, b, { floors: 1, fh: FH, base: z, R, w: 1.3, hj: 1.05, sill: 1.2, passo: 3.3, ar: 0.6, margem: 0.9 });
    };
    pat([378, 238], [692, 238], [500, 200]); pat([378, 327], [729.3, 327], [500, 360]);
    if (k > 0) {
      mureta(L, wp([378, 238]), wp([378, 327]), z); mureta(L, wp([692, 238]), wp([729.3, 327]), z);
      } else {
      L.top('patioInterno', courtW, z + 0.012, [], true, (() => { const xs = courtW.map((q) => q[0]), ys = courtW.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); return (x, y) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)]; })());
      const c0 = lerp2(courtW[0], courtW[3], 0.5), c1 = lerp2(courtW[1], courtW[2], 0.5);
      [0.1, 0.33, 0.62, 0.86].forEach((t, i) => { const q = lerp2(c0, c1, t); vasos.push([q[0], q[1] + (i % 2 ? 1.3 : -1.3), z]); });
      const b0 = lerp2(c0, c1, 0.2), b1 = lerp2(c0, c1, 0.75);
      banco(L, b0[0], courtW[0][1] + 0.7, Math.PI, z); banco(L, b1[0], courtW[3][1] - 0.7, 0, z);
    }

    /* salas, banheiros, áreas de descanso */
    f.zones.forEach((zona) => {
      if (zona.kind === 'courtyard' || zona.kind === 'ramp' || zona.kind === 'stairs') return;
      if (zona.kind === 'wall') { L.prism('corredor', 'branco', WP(zonePoly(zona)), z, z + ALT_SALA, z); return; }
      if (zona.kind === 'lounge') {
        const pw = WP(zonePoly(zona)); L.top('pisoLounge', insetPoly(pw, 0.1), z + 0.015);
        const c = centroid(pw); const larg = Math.abs(pw[1][0] - pw[0][0]), prof = Math.abs(pw[2][1] - pw[1][1]);
        if (larg > prof) [-0.3, 0.3].forEach((t) => { L.box('sofa', c[0] + t * larg, c[1], 1.3, 0.75, z, z + 0.42); L.box('sofa', c[0] + t * larg, c[1] - 0.3, 1.3, 0.16, z + 0.42, z + 0.8); });
        else { L.box('sofa', c[0], c[1] + prof * 0.25, 0.75, 1.5, z, z + 0.42); L.box('cinza', c[0] + 0.3, c[1] - prof * 0.25, 0.5, 1.6, z, z + 1.8); }
        return;
      }
      if (zona.kind === 'auditorium') {
        const inn = sala(L, z, zona, AUD_H - 1.9, true);
        const xs = inn.map((q) => q[0]), ys = inn.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        L.box('palco', (x0 + x1) / 2, y0 + 2.2, x1 - x0 - 0.4, 4.2, z, z + 0.85);
        const n = 11, passo = (y1 - y0 - 7.2) / n;
        for (let i = 0; i < n; i++) [-1, 1].forEach((s) => { const w = (x1 - x0) / 2 - 1.3; L.box('poltrona', (x0 + x1) / 2 + s * (w / 2 + 0.6), y0 + 6 + i * passo, w, 0.55, z, z + 0.45 + i * 0.05); L.box('poltrona', (x0 + x1) / 2 + s * (w / 2 + 0.6), y0 + 6.3 + i * passo, w, 0.12, z + 0.45, z + 0.95 + i * 0.05); });
        return;
      }
      sala(L, z, zona, ALT_SALA);
      /* número e nome curto em cima da tampa, de frente para quem olha da entrada */
      const pw = WP(zonePoly(zona)); const c = centroid(pw); const xs = pw.map((q) => q[0]), ys = pw.map((q) => q[1]); const lw = Math.min(6.4, Math.max(...xs) - Math.min(...xs) - 0.8), lh = lw / 2.6;
      if (zona.roomNumber || zona.word) rotulos.push({ zona, k, x: c[0], y: c[1] + (zona.kind === 'restroom' ? 1 : 0), z: z + ALT_SALA + 0.03, w: lw, h: lh, num: zona.roomNumber || '', nome: zona.word || (zona.kind === 'classroom' ? 'SALA' : zona.kind === 'laboratory' ? 'LAB' : '') });
    });
    /* portas */
    /* Portas (foto do corredor): batente cinza embutido na parede da sala, folha cinza-azulada com visor, bandeira em cima
       e capacho no corredor. A parede fica do lado da sala; o lado certo sai da própria planta. */
    const salas = f.zones.filter((q) => !['courtyard', 'ramp', 'stairs', 'lounge', 'wall'].includes(q.kind)).map((q) => zonePoly(q));
    f.doors.forEach((d) => {
      const h = d.axis === 'h'; const lado = [1, -1].find((s) => salas.some((pl) => inPoly(d.x + (h ? 0 : s * 4), d.y + (h ? s * 4 : 0), pl))) || 1;
      const c = wp([d.x, d.y]); const ang = h ? 0 : Math.PI / 2; const at = (u, v) => (h ? [c[0] + u, c[1] + v * lado] : [c[0] + v * lado, c[1] + u]);
      const cx = (u, v, w, dd, h0, h1, mat) => { const q = at(u, v); L.box(mat, q[0], q[1], w, dd, h0, h1, ang); };
      cx(-0.5, 0.195, 0.08, 0.24, z, z + 2.5, 'batente'); cx(0.5, 0.195, 0.08, 0.24, z, z + 2.5, 'batente'); cx(0, 0.195, 1.08, 0.24, z + 2.1, z + 2.18, 'batente'); cx(0, 0.195, 1.08, 0.24, z + 2.46, z + 2.54, 'batente');
      cx(0, 0.195, 0.92, 0.21, z, z + 2.1, 'portaFolha'); cx(0, 0.195, 0.92, 0.19, z + 2.18, z + 2.46, 'vidro');
      cx(0.2, 0.195, 0.2, 0.225, z + 1.35, z + 1.8, 'vidro'); cx(-0.36, 0.195, 0.05, 0.3, z + 0.98, z + 1.06, 'cinzaEscuro');
      cx(0, -0.32, 0.8, 0.5, z, z + 0.02, 'capacho');
    });
    /* recepção: balcão */
    const rec = f.zones.find((q) => q.kind === 'reception');
    if (rec) { const pw = WP(zonePoly(rec)); const c = centroid(pw); L.box('madeira', c[0], pw[0][1] + 0.5, 2.6, 0.6, z, z + 1.05); }
    /* subida */
    /* a subida de cada andar fica num grupo à parte: vendo o 1º andar aparece a rampa que chega nele, não a que segue para o 2º por cima */
    if (k < 2) { const S = new Lote(); escada(S, z, zEscada); rampa(S, z); S.build(gSubidas[k], M, { name: 'sobe' + k }); }
    paredesRampa(L, z);
    L.build(gNiveis[k], M, { name: 'n' + k });
  });

  /* ---------- auditório e entrada (casca sempre visível) ---------- */
  {
    const L = new Lote(); const base = AUD_H - 1.8; const R = rng(55);
    const ref = [120, 200];
    AUD.forEach((aP, i) => {
      const bP = AUD[(i + 1) % AUD.length];
      if (aP[0] === 235 && bP[0] === 235) return; // divisa com o bloco de três andares
      const [a, b] = face(aP, bP, ref); const len = dist(a, b);
      L.wall('azulejo', a, b, 0, base, 0, 0);
      const curva = i >= 3 && i <= 10;
      if (curva && len > 1.5) {
        /* janelas altas e estreitas, com moldura saliente de azulejo (foto 07) */
        const n = Math.max(1, Math.floor(len / 2.4));
        for (let j = 0; j < n; j++) { const u = (len * (j + 0.5)) / n; saliencia(L, 'moldura', a, b, u - 0.5, u + 0.5, 0.75, 3.75, 0, 0.09); painel(L, 'caixilho', a, b, u - 0.36, u + 0.36, 0.95, 3.55, 0.1); painel(L, 'vidro', a, b, u - 0.31, u + 0.31, 1, 3.5, 0.11); painel(L, 'caixilho', a, b, u - 0.02, u + 0.02, 1, 3.5, 0.12); }
      }
      if (aP[1] === 492 && bP[1] === 492) portaVidro(L, a, b, dist(a, wp([220, 492])), 1.9);
      if (aP[1] === 24 && bP[1] === 24) portaVidro(L, a, b, dist(a, wp([225, 24])), 1.5);
      if (aP[0] === 20 && bP[0] === 20) janelasNaAresta(L, a, b, { floors: 1, fh: 5, base: 0, R, w: 1.2, hj: 0.7, sill: 4.2, passo: 5, ar: 0.5 });
    });
    /* entrada: volume de pastilha azul, com porta larga e o letreiro (foto 06) */
    const ent = WP(ENTRY);
    [[[860, 542], [860, 614]], [[860, 614], [922, 614]], [[922, 614], [922, 542]]].forEach(([aP, bP], i) => {
      const [a, b] = face(aP, bP, [891, 560]); L.wall('pastilha', a, b, 0, ENTRY_H, 0, 0);
      if (i === 1) {
        const len = dist(a, b);
        painel(L, 'preto', a, b, len * 0.22, len * 0.78, 0, 2.6, 0.03); painel(L, 'vidro', a, b, len * 0.25, len * 0.75, 0.05, 2.5, 0.05); painel(L, 'caixilho', a, b, len * 0.495, len * 0.505, 0.05, 2.5, 0.06);
        painel(L, 'placaEntrada', a, b, len * 0.06, len * 0.94, 2.9, 5.2, 0.05, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
    });
    L.build(gCasca, M, { name: 'casca' });

    const T = new Lote();
    const audBand = AUD.map(([x, y]) => [x === 235 ? 229.6 : x, y]);
    platibanda(T, paraFora(WP(audBand)), AUD_H, { bandH: 1.8, over: 0.35 });
    T.top('laje', WP(AUD), AUD_H - 0.72);
    /* caixa da escada/reservatório que sobe acima do telhado do auditório */
    const torre = paraFora(WP(STAIR_TOWER)); T.walls('azulejo', torre, AUD_H - 0.7, H_TOTAL - BAND, true); platibanda(T, torre, H_TOTAL, { bandH: BAND, over: 0.25 });
    T.top('laje', ent, ENTRY_H - 0.02); T.walls('branco', insetPoly(ent, -0.06), ENTRY_H - 0.02, ENTRY_H + 0.18, true); T.top('branco', insetPoly(ent, -0.06), ENTRY_H + 0.18);
    T.build(gTetosBaixos, M, { name: 'tetos' });
  }

  /* ---------- cobertura do bloco de três andares ---------- */
  {
    const L = new Lote(); const p = paraFora(WP(MAIN));
    platibanda(L, p, H_TOTAL, { bandH: BAND, over: 0.3, furos: [courtW] });
    /* telhado de fibrocimento em duas águas, cumeeira no meio de cada ala (dissertação) */
    const hB = H_TOTAL - 0.68; const xe = (y) => 727.6 + ((y - 24) / (542 - 24)) * (934.8 - 727.6);
    duasAguas(L, 'fibro', insetPoly(WP([[235, 24], [xe(24), 24], [xe(238), 238], [235, 238]]), 0.3), hB, 0.55, 0);
    duasAguas(L, 'fibro', insetPoly(WP([[235, 327], [xe(327), 327], [xe(542), 542], [235, 542]]), 0.3), hB, 0.55, 0);
    L.top('fibro', insetPoly(WP([[235, 238], [378, 238], [378, 327], [235, 327]]), 0.25), hB + 0.02);
    L.top('fibro', insetPoly(WP([[692, 238], [xe(238), 238], [xe(327), 327], [729.3, 327]]), 0.25), hB + 0.02);
    L.build(gCobertura, M, { name: 'cobertura' });
  }

  /* rótulos das salas */
  rotulos.forEach((r) => {
    const tx = placa(256, 98, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1f2f57'; g.font = '800 54px system-ui, sans-serif'; g.fillText(r.num, w / 2, r.nome ? 34 : 50); g.fillStyle = '#56627e'; g.font = '700 21px system-ui, sans-serif'; if (r.nome) g.fillText(r.nome, w / 2, r.num ? 78 : 50); });
    const geo = new THREE.PlaneGeometry(r.w, r.h); geo.rotateX(-Math.PI / 2); geo.translate(r.x, r.z, r.y);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.renderOrder = 3; m.matrixAutoUpdate = false; gNiveis[r.k].add(m); r.mesh = m;
  });

  /* O bloco tem materiais só dele. Todos são cortados por um plano horizontal: baixar esse plano "fatia" o prédio de
     cima para baixo, até o andar que se quer ver, sem peças sumindo de repente. Também é por isso que o resto do campus
     pode perder a cor sem que o bloco perca. */
  const plano = new THREE.Plane(new THREE.Vector3(0, -1, 0), 40); const acesos = [];
  grupo.traverse((o) => { if (!o.isMesh) return; const era = o.material; o.material = o.material.clone(); o.material.clippingPlanes = [plano]; if (era === M.vidroAceso) acesos.push(o.material); });
  const ALTO = 14; const corteDe = (n) => (n === 'tudo' ? ALTO : (n + 1) * FH - 0.22);
  let nivelAtual = 'tudo';
  const subidas = (n) => gSubidas.forEach((g, k) => { g.visible = n === 'tudo' || k < Math.max(n, 1); });
  function cortar(h) { plano.constant = h; }
  function resetStack() { gNiveis.forEach(g => { g.position.y = 0; g.visible = true; }); gCasca.visible = true; gTetosBaixos.visible = true; gCobertura.visible = true; }
  function mostrar(n) { resetStack(); nivelAtual = n; subidas(n); cortar(corteDe(n)); }
  /* Abre o bloco até o andar n: t de 0 (inteiro) a 1 (cortado logo acima das salas do andar). */
  function abrir(n, t) { if(t>=1)nivelAtual=n; resetStack(); subidas(t > 0.5 ? n : 'tudo'); cortar(ALTO + (corteDe(n) - ALTO) * t); }
  function separar(t = 1) { resetStack(); nivelAtual = 'separados'; cortar(40); gCasca.visible = false; gTetosBaixos.visible = false; gCobertura.visible = false; gSubidas.forEach(g => g.visible = false); gNiveis.forEach((g,k) => g.position.y = k * 9 * t); }
  function syncRooms() {
    rotulos.forEach(r => {
      const num=r.zona.roomNumber||'';if(num===r.num)return;r.num=num;
      const tx=placa(256,98,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#1f2f57';g.font='800 54px system-ui';g.fillText(num,w/2,34);g.font='700 21px system-ui';g.fillText(r.nome||'',w/2,78);});
      r.mesh.material.map.dispose();r.mesh.material.map=tx;r.mesh.material.needsUpdate=true;
    });
  }
  return { grupo, mostrar, abrir, separar, syncRooms, vasos, acesos, altoSala: ALT_SALA, nivel: () => nivelAtual };
}

/* Materiais que só o bloco principal usa. */
export function materiaisPrincipal(M, T) {
  M.pisoLounge = new THREE.MeshLambertMaterial({ map: T.piso, color: 0xcfe6c4 });
  M.sofa = new THREE.MeshLambertMaterial({ color: 0x5a6b8a });
  const teto = (c) => new THREE.MeshLambertMaterial({ color: c });
  M.tetoAula = teto(0xf4ead0); M.tetoLab = teto(0xd3e3f0); M.tetoAdm = teto(0xefe5d6); M.tetoRec = teto(0xf3dcae); M.tetoWc = teto(0xd2e8e6);
  M.batente = new THREE.MeshLambertMaterial({ color: 0x8a9096 });
  M.portaFolha = new THREE.MeshLambertMaterial({ color: 0x6f7f8c });
  M.capacho = new THREE.MeshLambertMaterial({ color: 0x5c6b3a });
  M.corredorLiso = new THREE.MeshLambertMaterial({ map: T.corredor });
  M.borracha = new THREE.MeshLambertMaterial({ map: T.borracha });
  M.poltrona = new THREE.MeshLambertMaterial({ color: 0x8c2f2a });
  M.placaEntrada = new THREE.MeshLambertMaterial({ map: placa(512, 128, (g, w, h) => {
    /* placa branca com a marca e o "Bem-vindo (a)!"; embaixo, letras brancas sobre a pastilha (foto da entrada) */
    g.fillStyle = '#27338f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f6f8'; g.fillRect(w * 0.14, 0, w * 0.72, h * 0.66);
    g.fillStyle = '#2f9e44'; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) g.fillRect(w * 0.2 + c * 13, 12 + r * 13, 11, 11); g.fillStyle = '#d0231f'; g.beginPath(); g.arc(w * 0.2 - 8, 17, 6, 0, 7); g.fill();
    g.fillStyle = '#1b1d21'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '800 20px system-ui, sans-serif'; g.fillText('INSTITUTO FEDERAL', w * 0.28, 18); g.font = '500 13px system-ui, sans-serif'; g.fillText('Rio Grande do Norte · Campus Pau dos Ferros', w * 0.28, 38);
    g.fillStyle = '#2f9e44'; g.textAlign = 'center'; g.font = 'italic 600 20px system-ui, sans-serif'; g.fillText('Bem-vindo (a)!', w / 2, h * 0.52);
    g.fillStyle = '#ffffff'; g.font = '800 26px system-ui, sans-serif'; g.fillText('BLOCO PRINCIPAL', w / 2, h * 0.85);
  }) });
}
