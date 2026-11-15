/* Gestos de dois dedos no celular, como nos apps de mapa (15/11/2026). Com o MapControls, a pinça também girava e inclinava a câmera sem querer (os dois dedos nunca andam
   juntos), e o mapa tremia. Aqui cada parte do gesto é separada:
   - pinça: aproxima e afasta no ponto entre os dedos (o que está debaixo deles fica parado);
   - arrastar com os dois dedos: move o mapa junto;
   - girar os dedos: gira o mapa, só depois de um giro claro (evita girar ao fazer pinça);
   - arrastar os dois dedos para cima ou para baixo, juntos e sem abrir: inclina a câmera.
   Um dedo continua com o MapControls (arrastar, com inércia). Tocar no mapa durante uma animação de câmera solta a
   câmera na hora (o estado do bloco termina sozinho). */
import * as THREE from 'three';

export function criarGestos({ camera, controls, canvas, pedir, soltar }) {
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: null };
  const dedos = new Map();
  let g = null;
  const chao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    raio = new THREE.Raycaster();
  /* ponto do chão debaixo de um ponto da tela (na altura do alvo da câmera) */
  function noChao(x, y) {
    const r = canvas.getBoundingClientRect();
    raio.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera);
    chao.constant = -controls.target.y;
    return raio.ray.intersectPlane(chao, new THREE.Vector3());
  }
  const medir = () => {
    const [a, b] = [...dedos.values()];
    return {
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
      d: Math.hypot(b.x - a.x, b.y - a.y),
      ang: Math.atan2(b.y - a.y, b.x - a.x),
      ay: a.y,
      by: b.y,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    soltar?.();
    if (dedos.size === 2 && controls.enabled) {
      const m = medir();
      g = { ...m, giro: 0, modo: null, inicio: m };
    }
  });
  const fim = (e) => {
    dedos.delete(e.pointerId);
    if (dedos.size < 2) g = null;
  };
  canvas.addEventListener('pointerup', fim);
  canvas.addEventListener('pointercancel', fim);
  canvas.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!g || dedos.size !== 2 || !controls.enabled) return;
    const m = medir();
    /* decide o gesto no começo: inclinar (dois dedos para cima ou para baixo, juntos) ou o resto (pinça, mover, girar) */
    if (!g.modo) {
      const dy = m.my - g.inicio.my,
        dd = Math.abs(m.d - g.inicio.d),
        dx = Math.abs(m.mx - g.inicio.mx);
      /* cada dedo chega num evento separado: no meio do passo só um andou, então a decisão tolera essa diferença */
      const ya = m.ay - g.inicio.ay,
        yb = m.by - g.inicio.by,
        juntos = ya * yb >= 0;
      let da0 = m.ang - g.inicio.ang;
      da0 = Math.abs(Math.atan2(Math.sin(da0), Math.cos(da0)));
      const vertical = juntos && dd < 20 && dx <= Math.abs(dy) * 0.6 + 4 && da0 < 0.3;
      if (vertical && Math.abs(dy) > 16) g.modo = 'inclinar';
      else if (vertical && Math.abs(dy) <= 16 && dd < 10) return;
      else if (dd > 12 || Math.hypot(m.mx - g.inicio.mx, dy) > 12 || da0 > 0.2) g.modo = 'mapa';
      else return;
    }
    const alvo = controls.target,
      off = camera.position.clone().sub(alvo);
    if (g.modo === 'inclinar') {
      /* para cima deita a câmera (vê mais o horizonte), para baixo olha mais de cima */
      const s = new THREE.Spherical().setFromVector3(off);
      s.phi = THREE.MathUtils.clamp(s.phi - (m.my - g.my) * 0.0045, 0.12, controls.maxPolarAngle);
      off.setFromSpherical(s);
      camera.position.copy(alvo).add(off);
      camera.lookAt(alvo);
    } else {
      const p0 = noChao(g.mx, g.my),
        p1 = noChao(m.mx, m.my);
      /* mover junto com os dedos */
      if (p0 && p1) {
        const d = p0.clone().sub(p1);
        alvo.add(d);
        camera.position.add(d);
      }
      /* pinça no ponto entre os dedos */
      const k = THREE.MathUtils.clamp(g.d / Math.max(1, m.d), 0.5, 2);
      const dist = off.length();
      const kk = THREE.MathUtils.clamp(dist * k, controls.minDistance, controls.maxDistance) / dist;
      const c = noChao(m.mx, m.my);
      if (c && kk !== 1) {
        alvo.sub(c).multiplyScalar(kk).add(c);
        camera.position.sub(c).multiplyScalar(kk).add(c);
      }
      /* giro: só depois de um giro claro (12°), para a pinça não girar o mapa */
      let da = m.ang - g.ang;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      g.giro += da;
      if (Math.abs(g.giro) > 0.21 && c) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -da);
        alvo.sub(c).applyQuaternion(q).add(c);
        camera.position.sub(c).applyQuaternion(q).add(c);
      }
      camera.lookAt(alvo);
    }
    Object.assign(g, { mx: m.mx, my: m.my, d: m.d, ang: m.ang });
    controls.update();
    pedir();
  });
  /* toque duplo num lugar vazio: aproxima até a metade da distância, no ponto tocado (mapas fazem assim) */
  function aproximar(x, y, ir) {
    const c = noChao(x, y);
    if (!c) return;
    const off = camera.position.clone().sub(controls.target);
    const d = Math.max(controls.minDistance, off.length() * 0.5);
    const t = controls.target.clone().lerp(c, 0.5);
    const s = new THREE.Spherical().setFromVector3(off);
    ir({ t, d, e: Math.PI / 2 - s.phi, a: s.theta });
  }
  return { aproximar };
}
