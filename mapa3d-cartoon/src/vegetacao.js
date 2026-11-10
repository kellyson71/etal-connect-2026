/* Árvores, palmeiras e flores. Cada espécie é uma malha só, repetida por instâncias (uma chamada de desenho por espécie).
   Posições: as mesmas do protótipo (levantamento + copas tiradas do satélite). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { desaturavel } from './texturas.js';
import { listaArvores, rng, inPoly, pts, CANTEIROS_ANEXO, altura } from './dados.js';

/* Copa: esferas de poucas faces, amassadas e com a parte de baixo mais escura. */
function copaGeo(seed, blobs) {
  const R = rng(seed); const partes = blobs.map(([x, y, z, r]) => {
    const g = new THREE.IcosahedronGeometry(r, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.82 + R() * 0.36; p.setXYZ(i, p.getX(i) * k + x, p.getY(i) * k * 0.8 + y, p.getZ(i) * k + z); }
    return g.toNonIndexed();
  });
  const g = mergeGeometries(partes); g.computeVertexNormals();
  const p = g.attributes.position, c = new Float32Array(p.count * 3); let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
  for (let i = 0; i < p.count; i++) { const t = 0.55 + 0.45 * ((p.getY(i) - lo) / (hi - lo)); c[i * 3] = t; c[i * 3 + 1] = t; c[i * 3 + 2] = t; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function troncoGeo(h, r) { const g = new THREE.CylinderGeometry(r * 0.6, r, h, 6, 1, true); g.translate(0, h / 2, 0); return g; }

/* Palmeira: estipe e folhas arqueadas (faixas dobradas em V). */
function palmeiraGeo(alt, n, comp) {
  const partes = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.2, sobe = 0.35 + (i % 3) * 0.25; const seg = 5; const pos = [], idx = [];
    for (let s = 0; s <= seg; s++) {
      const t = s / seg, d = t * comp, y = alt + sobe * comp * t - 0.75 * comp * t * t, w = 0.42 * comp * 0.28 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08));
      const cx = Math.cos(a) * d, cz = Math.sin(a) * d, px = -Math.sin(a) * w, pz = Math.cos(a) * w;
      pos.push(cx + px, y - w * 0.5, cz + pz, cx, y, cz, cx - px, y - w * 0.5, cz - pz);
      if (s < seg) { const k = s * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); partes.push(g.toNonIndexed());
  }
  const g = mergeGeometries(partes); g.computeVertexNormals(); return g;
}

export function instanciar(geo, mat, itens, cast = true) {
  const m = new THREE.InstancedMesh(geo, mat, itens.length); const o = new THREE.Object3D(); const cor = new THREE.Color();
  itens.forEach((t, i) => { o.position.set(t.x, t.z || 0, t.y); o.rotation.set(0, t.rot || 0, 0); o.scale.set(t.s, t.sy || t.s, t.s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (t.cor) m.setColorAt(i, cor.set(t.cor)); });
  m.castShadow = cast; m.receiveShadow = false; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.computeBoundingSphere(); m.frustumCulled = false;
  return m;
}

const VERDES = ['#5c9a48', '#4c8a3c', '#6aa650', '#78a84a'];
const SECOS = ['#8f9a56', '#7e8f4c', '#9aa060'];

/* Modelos da Kenney (CC0): cada um vira duas geometrias, folhas e madeira, já na escala de raio 1. */
const loader = new GLTFLoader();
export async function modelo(nome) {
  const gltf = await loader.loadAsync(new URL(`../assets/modelos/${nome}.glb`, import.meta.url).href);
  gltf.scene.updateMatrixWorld(true); const folhas = [], madeira = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return; let g = o.geometry.clone().applyMatrix4(o.matrixWorld); if (g.index) g = g.toNonIndexed();
    Object.keys(g.attributes).forEach((k) => { if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); });
    (/leaf|grass/i.test(o.material.name) ? folhas : madeira).push(g);
  });
  const junta = (l) => (l.length ? mergeGeometries(l) : null); const f = junta(folhas), m = junta(madeira);
  f.computeBoundingBox(); const b = f.boundingBox; const raio = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2; const k = 1 / raio;
  [f, m].forEach((g) => g && g.scale(k, k, k));
  return { folhas: f, madeira: m };
}

export function construirVegetacao(M, { vasos = [], flores = [], pronto = () => {} } = {}) {
  const grupo = new THREE.Group(); grupo.name = 'vegetacao';
  const R = rng(12); const muro = pts(22);
  /* Correções do usuário: nada de árvore no caminho da entrada (elas ficam à esquerda, sombreando as motos);
     na calçada da frente, só as que ficam junto ao muro; no pátio entre os blocos não são tão grandes. */
  const arvores = listaArvores().filter((t) => !(t.x > 8.6 && t.x < 18 && t.y > 9 && t.y < 47.5) && !(t.tipo !== undefined && t.y > 49 && t.y < 67) && !(t.x > 14 && t.x < 33 && t.y > -18.5 && t.y < -8) && !(Math.hypot(t.x - 42.5, t.y - 37.5) < 3 || Math.hypot(t.x - 39, t.y - 27.5) < 3));
  [[7.4, 17], [7.2, 25.5], [7.4, 34], [7.2, 42]].forEach(([x, y]) => arvores.push({ x, y, r: 3, tone: 1 }));
  [[42.5, 37.5], [39, 27.5]].forEach(([x, y]) => arvores.push({ x, y, r: 3.1, tone: 0 }));
  CANTEIROS_ANEXO.forEach((k) => arvores.push({ x: k.c[0], y: k.c[1], r: 1.5, tone: 2 }));
  arvores.push({ x: 20.6, y: -23.5, r: 2.9, tone: 2 }); // cajarana da área dos servidores, atrás do murinho
  for (let x = -22; x <= 48; x += 8.5) if (!(x > 0 && x < 20)) arvores.push({ x, y: 63.7, r: 1.7, tone: Math.abs(Math.round(x)) % 3 }); // ilha gramada junto à rodovia: árvores menores
  [-33.5, -29.5, -18.8, -0.4, 13, 25.8, 32.5, 42, 48].forEach((x, i) => arvores.push({ x, y: 52.2, r: 2.3 + (i % 3) * 0.25, tone: i % 3 })); // nos canteiros junto ao muro
  const folha = desaturavel(new THREE.MeshLambertMaterial({ color: 0xffffff })); const casca = desaturavel(new THREE.MeshLambertMaterial({ color: 0x7a6248 }));
  const palmMat = desaturavel(new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));

  /* buganvília sobre o pergolado: tufos verdes e rosados */
  if (flores.length) {
    const corMat = desaturavel(new THREE.MeshLambertMaterial({ vertexColors: true }));
    grupo.add(instanciar(copaGeo(9, [[0, 0, 0, 1]]), corMat, flores.map(([x, z, y, s], i) => ({ x, y, z, s, sy: s * 0.45, rot: i, cor: i % 3 === 0 ? '#d6508c' : i % 3 === 1 ? '#5f9a44' : '#e06a9a' }))));
  }
  const potes = vasos.map(([x, y, z]) => ({ x, y, z, s: 1 }));
  if (potes.length) { const g = new THREE.CylinderGeometry(0.42, 0.3, 0.6, 10); g.translate(0, 0.3, 0); grupo.add(instanciar(g, M.brancoPuro, potes)); }

  (async () => {
    /* copas: nim e outras árvores de sombra do campus, em três formas */
    const nomes = ['tree_oak', 'tree_detailed', 'tree_default'];
    const mods = await Promise.all(nomes.map(modelo)); const itens = nomes.map(() => []);
    arvores.forEach((t) => {
      const k = Math.abs(Math.round(t.x * 3 + t.y * 7)) % 3; const dentro = inPoly(t.x, t.y, muro) || (t.y > 46 && t.y < 66);
      const cores = dentro ? VERDES : (R() > 0.45 ? SECOS : VERDES);
      const e = dentro ? 0.88 : 1.05; itens[k].push({ x: t.x, y: t.y, z: altura(t.x, t.y), s: t.r * e, sy: t.r * (0.8 + R() * 0.25), rot: R() * 6.28, cor: cores[(t.tone + k) % cores.length] });
    });
    mods.forEach((m, k) => { if (!itens[k].length) return; grupo.add(instanciar(m.folhas, folha, itens[k])); if (m.madeira) grupo.add(instanciar(m.madeira, casca, itens[k].map((t) => ({ ...t, s: t.s * 0.5, cor: null })))); });

    /* palmeiras: nos vasos do pátio interno e nos canteiros junto ao bloco (fotos 04, 07, 13 e 18) */
    const [alta, baixa] = await Promise.all(['tree_palmDetailedTall', 'tree_palmDetailedShort'].map(modelo));
    const chao = [[-33.5, -18.2, 2.6], [-26.6, -17.4, 2.3], [-22.6, -13.5, 2.1], [-22.4, 2.5, 2.4], [-22.6, 7.5, 2], [22.6, 12.6, 2.2], [-9, 12.4, 2.1], [3, 12.4, 1.9], [-16, 12.6, 2.3], [-15, -15.6, 1.5], [-8, -15.6, 1.7], [-1, -15.6, 1.4], [6, -15.6, 1.6], [12, -15.6, 1.5]].map(([x, y, s]) => ({ x, y, s, sy: s * 1.15, rot: R() * 6, cor: '#5e9a48' }));
    const emVaso = vasos.map(([x, y, z]) => ({ x, y, z: z + 0.5, s: 1.05, sy: 1.25, rot: R() * 6, cor: '#62a04c' }));
    [[alta, chao], [baixa, emVaso]].forEach(([m, l]) => { if (!l.length) return; grupo.add(instanciar(m.folhas, palmMat, l)); if (m.madeira) grupo.add(instanciar(m.madeira, casca, l.map((t) => ({ ...t, cor: null })))); });
    pronto();
  })().catch((e) => console.error('vegetação:', e));
  return grupo;
}
