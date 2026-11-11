/* Câmera por "pose": alvo, distância, elevação e azimute. Interpolar a pose (e não a posição) faz a câmera girar em
   volta do alvo em arco, sem cortar caminho por dentro dos prédios, e permite girar devagar até a porta da sala. */
import * as THREE from 'three';

export const AZ0 = 0.3; // padrão: da frente do campus (rodovia), um pouco à direita
export const pose = (t, d, e, a = AZ0) => ({ t: t.clone(), d, e, a });
export function aplicar(camera, controls, p) {
  const D = new THREE.Vector3(Math.sin(p.a) * Math.cos(p.e), Math.sin(p.e), Math.cos(p.a) * Math.cos(p.e));
  camera.position.copy(p.t).addScaledVector(D, p.d); controls.target.copy(p.t); camera.lookAt(p.t);
}
export function daCamera(camera, controls) {
  const v = camera.position.clone().sub(controls.target); const d = v.length();
  return { t: controls.target.clone(), d, e: Math.asin(THREE.MathUtils.clamp(v.y / d, -1, 1)), a: Math.atan2(v.x, v.z) };
}
const ang = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
export function mistura(p, q, t) { return { t: p.t.clone().lerp(q.t, t), d: Math.exp(Math.log(p.d) + (Math.log(q.d) - Math.log(p.d)) * t), e: p.e + (q.e - p.e) * t, a: ang(p.a, q.a, t) }; }
export const suave = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * t * (t * (t * 6 - 15) + 10); };

/* Enquadra pontos na área livre da tela (fora do cartão de baixo e da busca de cima). */
export function enquadrar(camera, pontos, { e = 52, a = AZ0, min = 24, folga = 1.12 } = {}) {
  const el = THREE.MathUtils.degToRad(e);
  const box = new THREE.Box3().setFromPoints(pontos), centro = box.getCenter(new THREE.Vector3());
  const D = new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el));
  const dir = new THREE.Vector3(D.z, 0, -D.x).normalize(), up = new THREE.Vector3().crossVectors(D, dir).normalize();
  const W = innerWidth, H = innerHeight, cartao = document.querySelector('#cartao')?.getBoundingClientRect();
  const estreita = W < 700; const topo = estreita ? 150 : 96, baixo = cartao && cartao.height > 0 && estreita ? Math.max(40, H - cartao.top + 14) : 40;
  const esq = !estreita && cartao ? Math.min(W * 0.45, cartao.right + 24) : 16, dirP = 72;
  const uH = Math.max(0.3, (H - topo - baixo) / H), uW = Math.max(0.3, (W - esq - dirP) / W);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let d = min / (2 * tan * Math.min(uH, camera.aspect * uW));
  for (const p of pontos) { const v = p.clone().sub(centro); d = Math.max(d, (Math.abs(v.dot(dir)) * folga) / (tan * camera.aspect * uW) + v.dot(D), (Math.abs(v.dot(up)) * folga) / (tan * uH) + v.dot(D)); }
  const alvo = centro.clone().addScaledVector(up, -((baixo - topo) / H) * d * tan).addScaledVector(dir, -((esq - dirP) / W) * d * tan * camera.aspect);
  return { t: alvo, d, e: el, a };
}
