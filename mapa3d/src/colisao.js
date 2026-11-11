/* Física do passeio: o que existe no mapa barra quem anda.
   - Grade de obstáculos (25 cm) feita da própria geometria: toda face quase vertical que passa pela faixa de altura do
     corpo (de 0,42 m a 1,9 m acima do chão) vira parede. Assim cones, sebes, bancos, mesas, postes, portões, muros,
     guarita, prédios e as paredes do bloco barram, e o que é baixo (meio-fio, degrau, bloquinho) dá para subir.
     Pisos, rampas e degraus ficam de fora (são chão, não parede). Troncos das árvores entram como círculos.
   - Uma grade para o chão do campus (com o térreo do bloco) e uma para cada andar de cima do bloco.
   - Portas que existem de verdade são abertas na grade: entrada principal e porta de vidro do Anexo.
   - Dentro do bloco a altura vem da planta: andar × pé-direito, e na rampa e na escada a fração da subida (a mesma
     da rota), sem saltos. */
import * as THREE from 'three';
import { PLAN, FH, altura, wp, zonePoly, inPoly, BUILDINGS, byId } from './dados.js';
import { fracaoRampa, escadaPlanta } from './subidas.js';

const RES = 0.25;
const W = PLAN.world;
export const paraPlanta = (x, z) => [(x - W.x0) / W.sx, (z - W.y0) / W.sy];

class Grade {
  constructor(x0, z0, x1, z1) { this.x0 = x0; this.z0 = z0; this.nx = Math.ceil((x1 - x0) / RES); this.nz = Math.ceil((z1 - z0) / RES); this.d = new Uint8Array(this.nx * this.nz); }
  idx(x, z) { const ix = Math.floor((x - this.x0) / RES), iz = Math.floor((z - this.z0) / RES); return ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz ? -1 : iz * this.nx + ix; }
  marca(x, z) { const k = this.idx(x, z); if (k >= 0) this.d[k] = 1; }
  linha(ax, az, bx, bz) { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (RES * 0.45)) + 1; for (let i = 0; i <= n; i++) this.marca(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n); }
  disco(x, z, r, v = 1) { for (let dz = -r; dz <= r + 1e-6; dz += RES * 0.5) for (let dx = -r; dx <= r + 1e-6; dx += RES * 0.5) if (dx * dx + dz * dz <= r * r) { const k = this.idx(x + dx, z + dz); if (k >= 0) this.d[k] = v; } }
  livre(x, z, r) {
    for (let dz = -r; dz <= r + 1e-6; dz += RES) for (let dx = -r; dx <= r + 1e-6; dx += RES) { if (dx * dx + dz * dz > r * r + 0.01) continue; const k = this.idx(x + dx, z + dz); if (k >= 0 && this.d[k]) return false; }
    return true;
  }
}

/* faces quase verticais dentro da faixa do corpo viram linhas na grade */
function rasterizar(obj, grade, faixa, filtro = () => true) {
  obj.updateMatrixWorld(true); const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  obj.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.dinamico || !filtro(m)) return; const pos = m.geometry.attributes.position; if (!pos) return; const ix = m.geometry.index; const mw = m.matrixWorld;
    const tri = ix ? ix.count / 3 : pos.count / 3;
    for (let t = 0; t < tri; t++) {
      const i0 = ix ? ix.getX(t * 3) : t * 3, i1 = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, i2 = ix ? ix.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(mw); b.fromBufferAttribute(pos, i1).applyMatrix4(mw); c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)); const L = n.length(); if (L < 1e-9 || Math.abs(n.y / L) > 0.7) continue;
      const [lo, hi] = faixa((a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3); const y0 = Math.min(a.y, b.y, c.y), y1 = Math.max(a.y, b.y, c.y);
      if (y1 < lo || y0 > hi) continue;
      grade.linha(a.x, a.z, b.x, b.z); grade.linha(b.x, b.z, c.x, c.z); grade.linha(c.x, c.z, a.x, a.z);
    }
  });
}

/* rampa e escada pela planta: fração da subida (0 embaixo, 1 no andar de cima) no ponto mais perto do percurso */
const RAMPA = PLAN.floors[1].zones.find((z) => z.kind === 'ramp'), ESCADA = PLAN.floors[1].zones.find((z) => z.kind === 'stairs');
const E = escadaPlanta(ESCADA, W.sy); const POLY_RAMPA = zonePoly(RAMPA), POLY_ESCADA = E.furo; // a faixa de piso do lado sul é chão do andar
const LOOP_ESCADA = { pts: E.loop, fr: E.fr };
const LOOP_RAMPA = { pts: PLAN.rampLoop, fr: PLAN.rampLoop.map((q, i, l) => fracaoRampa(q, i, l)) };
function fracao(loop, p) {
  let best = Infinity, f = 0;
  for (let i = 0; i < loop.pts.length - 1; i++) {
    const a = loop.pts[i], b = loop.pts[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], L = ex * ex + ey * ey; if (L < 1e-6) continue;
    const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L)); const d = Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ey * t);
    if (d < best) { best = d; f = loop.fr[i] + (loop.fr[i + 1] - loop.fr[i]) * t; }
  }
  return f;
}
const CONTORNO = PLAN.floors[0].outlinePts;

export function criarColisao({ chao, partes, principal }) {
  const G0 = new Grade(-300, -260, 140, 200);
  const caixa = new THREE.Box3().setFromObject(principal.grupo); caixa.expandByScalar(2);
  const G = [G0, new Grade(caixa.min.x, caixa.min.z, caixa.max.x, caixa.max.z), new Grade(caixa.min.x, caixa.min.z, caixa.max.x, caixa.max.z)];
  const corpo = (k) => (x, z) => { const g = k ? k * FH : altura(x, z); return [g + 0.42, g + 1.9]; };
  const semPiso = (m) => !/:(concreto|cimento|borracha|laje|branco)$/.test(m.name); // degraus, pista e a bordinha da rampa são chão
  [chao, ...partes].forEach((o) => o && rasterizar(o, G0, corpo(0)));
  ['casca', 'nivel-0'].forEach((n) => rasterizar(principal.grupo.getObjectByName(n), G0, corpo(0)));
  rasterizar(principal.grupo.getObjectByName('subida-0'), G0, corpo(0), semPiso);
  rasterizar(principal.grupo.getObjectByName('nivel-1'), G[1], corpo(1)); rasterizar(principal.grupo.getObjectByName('subida-1'), G[1], corpo(1), semPiso);
  rasterizar(principal.grupo.getObjectByName('nivel-2'), G[2], corpo(2));
  /* troncos das árvores */
  partes.forEach((o) => o?.traverse((m) => {
    if (!m.isInstancedMesh || !m.userData.tronco) return; const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); M.decompose(p, q, s); G0.disco(p.x, p.z, Math.min(0.5, Math.max(0.16, m.userData.tronco * s.x))); }
  }));
  /* portas de verdade: abertas na grade */
  [[PLAN.entrances.principal, 1.35], [PLAN.entrances.anexo, 0.7]].forEach(([e, r]) => { const w = wp(e); G0.disco(w[0], w[1], r, 0); });
  /* portas das salas: o vão fica livre (a folha é móvel e abre quando empurrada) */
  /* saída para o pátio pelo hall do auditório e a porta do auditório, por dentro */
  [[[181, 490.7], 0.95], [[118, 302], 1.05]].forEach(([q, r]) => { const w = wp(q); G0.disco(w[0], w[1], r, 0); });
  PLAN.floors.forEach((f, k) => f.doors.forEach((d) => { const w = wp([d.x, d.y]), h = d.axis === 'h'; [-0.4, 0, 0.4].forEach((o) => G[k].disco(w[0] + (h ? 0 : o), w[1] + (h ? o : 0), 0.5, 0)); }));

  /* andar e altura dentro do bloco; fora dele, o terreno */
  const cache = new Map(); const raio = new THREE.Raycaster(); raio.far = 60; const baixo = new THREE.Vector3(0, -1, 0);
  function terreno(x, z) {
    const k = Math.round(x * 2) + ',' + Math.round(z * 2); let y = cache.get(k);
    if (y === undefined) { raio.set(new THREE.Vector3(Math.round(x * 2) / 2, 30, Math.round(z * 2) / 2), baixo); const hit = raio.intersectObject(chao, true)[0]; y = hit ? hit.point.y : 0; if (cache.size > 40000) cache.clear(); cache.set(k, y); }
    return y;
  }
  const noBloco = (x, z) => { const p = paraPlanta(x, z); return inPoly(p[0], p[1], CONTORNO); };
  /* estado de quem anda: andar atual e, na rampa ou escada, o andar de baixo da subida */
  function alturaEm(st, x, z) {
    if (!noBloco(x, z)) { st.nivel = 0; st.sub = null; return terreno(x, z); }
    const p = paraPlanta(x, z); const via = inPoly(p[0], p[1], POLY_RAMPA) ? 'rampa' : inPoly(p[0], p[1], POLY_ESCADA) ? 'escada' : null;
    if (via) {
      const f = fracao(via === 'rampa' ? LOOP_RAMPA : LOOP_ESCADA, p);
      if (!st.sub || st.sub.via !== via) st.sub = { via, base: Math.min(1, Math.max(0, f < 0.5 ? st.nivel : st.nivel - 1)) };
      const y = (st.sub.base + f) * FH + 0.03; st.nivelAgora = Math.min(2, Math.max(0, Math.round((y - 0.03) / FH - 0.35 + 0.35))); return y;
    }
    if (st.sub) { st.nivel = Math.min(2, Math.max(0, Math.round((st.yAntes - 0.03) / FH))); st.sub = null; }
    return st.nivel * FH + 0.03;
  }
  const grade = (st) => G[Math.min(2, Math.max(0, st.sub ? Math.round(((st.yAntes ?? 0) - 0.03) / FH - 0.15) : st.nivel))] || G0;
  /* tenta mover um círculo; desliza nos eixos se bater */
  function mover(st, pos, nx, nz, r) {
    const g = noBloco(nx, nz) || noBloco(pos.x, pos.z) ? grade(st) : G0;
    if (g.livre(nx, nz, r)) { pos.x = nx; pos.z = nz; return false; }
    const dx = nx - pos.x, dz = nz - pos.z, d = Math.hypot(dx, dz); if (d < 1e-6) return true;
    /* bateu: tenta seguir desviando aos poucos para um lado e para o outro (até quase de lado). Assim a pessoa desliza
       em parede em qualquer direção — as da rampa são inclinadas na planta e, só com os eixos x e z, ela travava. */
    for (const a of [0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.45, -1.45]) {
      const c = Math.cos(a), s2 = Math.sin(a), k = Math.max(0.5, c); const tx = pos.x + (dx * c - dz * s2) * k, tz = pos.z + (dx * s2 + dz * c) * k;
      if (g.livre(tx, tz, r)) { pos.x = tx; pos.z = tz; return true; }
    }
    return true;
  }
  /* voo: só os prédios mais altos que a pessoa barram (polígonos do levantamento com a altura) */
  const ALTOS = BUILDINGS.filter((b) => b.p && b.h).map((b) => ({ p: b.p, h: b.id === 'principal' ? 11.9 : b.h + 0.3 }));
  function bateVoo(x, z, y) { return ALTOS.some((b) => y < b.h && inPoly(x, z, b.p)); }
  return { mover, alturaEm, terreno, noBloco, bateVoo, livre: (x, z, r) => G0.livre(x, z, r), G };
}
void byId;
