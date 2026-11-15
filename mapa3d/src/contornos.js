/* Contornos do mapa ilustrado (modo Evento): uma linha fina nas quinas vivas dos prédios, como nos mapas de campus
   desenhados. Só arestas com dobra de mais de 30° (e as bordas soltas), então paredes curvas e pisos não ganham risco.
   As linhas são filhas das malhas: acompanham o bloco aberto, os cortes por andar (mesmos planos de corte) e a
   transparência de cada andar. Aparecem com o CART (modo Evento) e somem no modo Campus. */
import * as THREE from 'three';
import { CART, ESC, categoria } from './cartum.js';
import { PLANOS, ISO } from './texturas.js';

const COM = new Set(['parede', 'reboco', 'teto', 'faixaPredio', 'dentro:sala', 'dentro:corredor', 'dentro:corredorLiso']);
const preto = new THREE.Color(0x000000);

export function criarContornos(raizes) {
  const linhas = []; const mats = new Map();
  const matDe = (cor, clip) => {
    const chave = cor.getHexString() + (clip ? ':' + clip.map((p) => p.uuid || p.constant).join(',') : '');
    let m = mats.get(chave); if (m) return m;
    m = new THREE.LineBasicMaterial({ color: cor, transparent: true, depthWrite: false, fog: false });
    if (clip) m.clippingPlanes = clip; mats.set(chave, m); return m;
  };
  for (const raiz of raizes) raiz?.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.material || o.userData.semContorno) return;
    const cat = categoria(o.material); if (!COM.has(cat)) return;
    const geo = new THREE.EdgesGeometry(o.geometry, 30); if (!geo.attributes.position.count) return;
    const u = PLANOS.get(o.material);
    const cor = u && u.uEvento.value ? u.uPlanoEv.value.clone().lerp(preto, 0.5) : new THREE.Color(cat.startsWith('dentro') ? 0x8a8678 : 0x4a5568);
    /* no bloco cada malha tem material próprio (corte e transparência por andar): a linha também */
    const proprio = !!o.material.clippingPlanes?.length;
    const mat = proprio ? new THREE.LineBasicMaterial({ color: cor, transparent: true, depthWrite: false, fog: false, clippingPlanes: o.material.clippingPlanes }) : matDe(cor, null);
    const l = new THREE.LineSegments(geo, mat); l.renderOrder = o.renderOrder; l.raycast = () => {};
    l.userData = { malha: o, proprio, base: cat.startsWith('dentro') ? 0.55 : 0.75 }; o.add(l); linhas.push(l);
  });
  let antes = -1;
  /* a cada quadro: força do modo Evento e transparência da malha (andares que esmaecem no bloco aberto) */
  function atualizar() {
    const k = CART.value, e = ESC.value, iso = ISO.value;
    const vis = k > 0.02; const f = k * (1 - 0.2 * e);
    if (!vis && antes === 0) return; antes = vis ? f : 0;
    /* com o bloco isolado (andares abertos) o resto do campus esmaece: os riscos dele também */
    const fora = 1 - 0.92 * iso;
    for (const l of linhas) {
      const m = l.userData.malha.material; const op = m.transparent ? m.opacity : 1;
      l.visible = vis && op > 0.25; if (!l.visible) continue;
      l.material.opacity = l.userData.base * f * (m.transparent ? op * op : 1) * (l.userData.proprio ? 1 : fora); if (!l.userData.proprio && fora < 0.12) l.visible = false;
    }
  }
  return { atualizar, linhas };
}
