/* Montagem de malhas: tudo que usa o mesmo material vira uma malha só (poucas chamadas de desenho, bom para celular).
   Pontos do mapa (x, y) em metros; no three.js ficam (x, altura, y). UV em metros: a textura diz o seu tamanho real. */
import * as THREE from 'three';
import { signedArea, dist } from './dados.js';

export class Lote {
  constructor() { this.bufs = new Map(); }
  buf(mat) {
    let b = this.bufs.get(mat);
    if (!b) { b = { p: [], n: [], u: [], i: [] }; this.bufs.set(mat, b); }
    return b;
  }
  /* Quatro cantos em sentido anti-horário, vistos de frente. Cada canto é [x, altura, z]. */
  quad(mat, A, B, C, D, uv) {
    const b = this.buf(mat); const k = b.p.length / 3;
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    b.p.push(...A, ...B, ...C, ...D); b.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    if (uv) b.u.push(...uv[0], ...uv[1], ...uv[2], ...uv[3]);
    else { const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz); b.u.push(0, 0, w, 0, w, h, 0, h); }
    b.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  /* Quadrilátero que sempre olha para cima (pisos inclinados, rampas). */
  quadUp(mat, A, B, C, D, uv) {
    const ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]);
    if (ny >= 0) this.quad(mat, A, B, C, D, uv); else this.quad(mat, B, A, D, C, uv && [uv[1], uv[0], uv[3], uv[2]]);
  }
  quadDown(mat, A, B, C, D) { const ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]); if (ny < 0) this.quad(mat, A, B, C, D); else this.quad(mat, B, A, D, C); }
  triUp(mat, A, B, C) { const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); if (ny >= 0) this.tri(mat, A, B, C); else this.tri(mat, A, C, B); }
  triDown(mat, A, B, C) { const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); if (ny < 0) this.tri(mat, A, B, C); else this.tri(mat, A, C, B); }
  /* Face fina vista dos dois lados. */
  quad2(mat, A, B, C, D) { this.quad(mat, A, B, C, D); this.quad(mat, B, A, D, C); }
  tri(mat, A, B, C) {
    const b = this.buf(mat); const k = b.p.length / 3;
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    b.p.push(...A, ...B, ...C); b.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); b.u.push(A[0], A[2], B[0], B[2], C[0], C[2]); b.i.push(k, k + 1, k + 2);
  }
  /* Parede de a até b. A face olha para a direita de quem anda de a para b (vista de cima, com +y para baixo). */
  wall(mat, a, b, h0, h1, u0 = 0, vBase = 0) {
    const L = dist(a, b);
    this.quad(mat, [a[0], h0, a[1]], [b[0], h0, b[1]], [b[0], h1, b[1]], [a[0], h1, a[1]], [[u0, h0 - vBase], [u0 + L, h0 - vBase], [u0 + L, h1 - vBase], [u0, h1 - vBase]]);
    return u0 + L;
  }
  /* Paredes em volta de um contorno. fora = true: faces para fora (prédio); false: para dentro (pátio, sala). */
  walls(mat, poly, h0, h1, fora = true, vBase = 0) {
    const p = (signedArea(poly) > 0) === fora ? poly.slice().reverse() : poly; let u = 0;
    p.forEach((a, i) => { u = this.wall(mat, a, p[(i + 1) % p.length], h0, h1, u, vBase); });
  }
  /* Polígono deitado na altura h, com furos. uvFn(x, y) opcional. */
  top(mat, poly, h, holes = [], up = true, uvFn = null) {
    const c = poly.map((q) => new THREE.Vector2(q[0], q[1])); const hs = holes.map((hh) => hh.map((q) => new THREE.Vector2(q[0], q[1])));
    const all = [...poly, ...holes.flat()]; const faces = THREE.ShapeUtils.triangulateShape(c, hs);
    const b = this.buf(mat); const k = b.p.length / 3; const ny = up ? 1 : -1;
    all.forEach((q) => { b.p.push(q[0], h, q[1]); b.n.push(0, ny, 0); const uv = uvFn ? uvFn(q[0], q[1]) : q; b.u.push(uv[0], uv[1]); });
    faces.forEach(([i0, i1, i2]) => {
      const A = all[i0], B = all[i1], C = all[i2];
      /* No three.js, com z = y do mapa, a face olha para cima quando o giro (x, y) é negativo. */
      const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      if ((cross < 0) === up) b.i.push(k + i0, k + i1, k + i2); else b.i.push(k + i0, k + i2, k + i1);
    });
  }
  /* Prisma: contorno levantado de h0 a h1, com tampa. */
  prism(matWall, matTop, poly, h0, h1, vBase = 0) { this.walls(matWall, poly, h0, h1, true, vBase); if (matTop) this.top(matTop, poly, h1); }
  /* Caixa com eixo no centro, girada de ang (radianos) no chão. */
  box(mat, cx, cy, w, d, h0, h1, ang = 0, matTop = mat) {
    const co = Math.cos(ang), si = Math.sin(ang);
    const q = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * co - v * si, cy + u * si + v * co]);
    this.prism(mat, matTop, q, h0, h1);
  }
  /* Tubo fino de A a B (pontos [x, altura, z]) com seção triangular: serve para treliças, postes e grades. */
  tube(mat, A, B, r, lados = 3) {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]; const L = Math.hypot(...d) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
    const ref = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let ux = d[1] * ref[2] - d[2] * ref[1], uy = d[2] * ref[0] - d[0] * ref[2], uz = d[0] * ref[1] - d[1] * ref[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = d[1] * uz - d[2] * uy, vy = d[2] * ux - d[0] * uz, vz = d[0] * uy - d[1] * ux;
    const ring = (P) => Array.from({ length: lados }, (_, i) => { const a = (i / lados) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r; return [P[0] + ux * c + vx * s, P[1] + uy * c + vy * s, P[2] + uz * c + vz * s]; });
    const ra = ring(A), rb = ring(B);
    for (let i = 0; i < lados; i++) { const j = (i + 1) % lados; this.quad(mat, ra[j], ra[i], rb[i], rb[j]); }
  }
  /* Cria as malhas e põe no grupo. */
  build(group, mats, { cast = true, receive = true, order = 0, name = '' } = {}) {
    const out = [];
    this.bufs.forEach((b, key) => {
      if (!b.i.length) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      if (b.u.length === (b.p.length / 3) * 2) g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      g.setIndex(b.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(b.i, 1) : new THREE.Uint16BufferAttribute(b.i, 1));
      const m = new THREE.Mesh(g, mats[key] || mats.falta);
      if (!mats[key]) console.warn('material sem definição:', key);
      m.castShadow = cast; m.receiveShadow = receive; m.renderOrder = order; m.name = name + ':' + key; m.matrixAutoUpdate = false;
      group.add(m); out.push(m);
    });
    return out;
  }
}

export const tris = (obj) => { let n = 0; obj.traverse((o) => { if (o.isMesh) { const c = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; n += (c / 3) * (o.isInstancedMesh ? o.count : 1); } }); return Math.round(n); };
