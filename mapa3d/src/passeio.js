/* Passeio pelo campus, inspirado no Sketchbook (swift502, MIT): o personagem e o carro são os modelos dele; o resto foi
   escrito de novo para o nosso mapa, sem motor de física.
   - A pé: terceira pessoa, andar/correr/pular, com o rosto (o papel na frente da cabeça) trocado pela foto do perfil.
     Não atravessa os prédios (polígonos do levantamento); o chão vem do próprio terreno, por raio, com cache.
   - Carros na BR-405, nas duas faixas, mantendo distância entre si e parando para quem estiver na frente.
   - Carros estacionados nas vagas do estacionamento (fileiras de blocos amarelos): dá para entrar (abre a porta, senta,
     fecha), dirigir e sair. O carro fica onde foi deixado.
   Teclado: WASD/setas, Shift corre, Espaço pula (no carro, freio de mão), E entra/sai. Celular: controle na tela.
   Arrastar gira a câmera; roda ou pinça aproxima. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SOLIDS, ROAD_Y0, ROAD_Y1, byId, pts, lerp2 } from './dados.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const BASE = new URL('../assets/sketchbook/', import.meta.url).href;
const FAIXAS = [{ z: ROAD_Y0 + 2.6, dir: 1 }, { z: ROAD_Y1 - 2.6, dir: -1 }]; // mão dupla: cada faixa num sentido
const VAGAS = [ // carros de frente para os blocos amarelos
  ...[-24.5, -19.3, -11.5, -6.3, -1.1].map((x) => ({ x, z: 31.9, h: 0 })),
  ...[-20.8, -15.6, -7.8, 2.6].map((x) => ({ x, z: 24.0, h: Math.PI })),
];
const CORES = [0xc0392b, 0x2f55c8, 0xf2f2ee, 0x2b2f36, 0x9aa3ad, 0x3f8f1a, 0xe0a526, 0x7a2a8c, 0xd8d3c4, 0x1f6f8b];

/* ---------- colisão com os prédios (2D, em x/z) ---------- */
const POLIS = SOLIDS.map((p) => { const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]); return { p, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; });
function dentro(x, z, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; }
/* muro do campus, com os três vãos da frente (ônibus, veículos, pedestres), como em terreno.js */
const MURO = (() => {
  const m = pts(22) || []; const seg = [];
  m.forEach((a, i) => {
    const b = m[(i + 1) % m.length]; const frente = (a[1] + b[1]) / 2 > 40;
    if (i === 4) { seg.push([a, lerp2(a, b, 0.46)], [lerp2(a, b, 0.54), b]); return; }
    if (!frente) { seg.push([a, b]); return; }
    const [l, r] = a[0] < b[0] ? [a, b] : [b, a]; let x = l[0];
    [[-48.4, -41.4], [1.5, 8.5], [11.8, 18.3]].forEach(([g0, g1]) => { seg.push([[x, l[1]], [g0, l[1]]]); x = g1; }); seg.push([[x, l[1]], [r[0], l[1]]]);
  });
  return seg.map(([a, b]) => ({ a, b, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]) }));
})();
function empurrarMuro(pos, r) {
  let bateu = false; r += 0.15;
  for (const s of MURO) {
    if (pos.x < s.x0 - r || pos.x > s.x1 + r || pos.z < s.z0 - r || pos.z > s.z1 + r) continue;
    const ex = s.b[0] - s.a[0], ez = s.b[1] - s.a[1], L = ex * ex + ez * ez || 1; const t = clamp(((pos.x - s.a[0]) * ex + (pos.z - s.a[1]) * ez) / L, 0, 1);
    const qx = s.a[0] + ex * t, qz = s.a[1] + ez * t; const d = Math.hypot(pos.x - qx, pos.z - qz);
    if (d < r && d > 1e-4) { pos.x = qx + ((pos.x - qx) / d) * r; pos.z = qz + ((pos.z - qz) / d) * r; bateu = true; }
  }
  return bateu;
}
/* empurra um círculo (x, z, r) para fora dos prédios e do muro; devolve true se encostou */
function empurrar(pos, r) {
  let bateu = empurrarMuro(pos, r);
  for (const P of POLIS) {
    if (pos.x < P.x0 - r || pos.x > P.x1 + r || pos.z < P.z0 - r || pos.z > P.z1 + r) continue;
    let best = Infinity, bx = 0, bz = 0; const p = P.p;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]; const ex = b[0] - a[0], ez = b[1] - a[1], L = ex * ex + ez * ez || 1;
      const t = clamp(((pos.x - a[0]) * ex + (pos.z - a[1]) * ez) / L, 0, 1); const qx = a[0] + ex * t, qz = a[1] + ez * t; const d = Math.hypot(pos.x - qx, pos.z - qz);
      if (d < best) { best = d; bx = qx; bz = qz; }
    }
    const inside = dentro(pos.x, pos.z, p);
    if (inside || best < r) {
      let nx = pos.x - bx, nz = pos.z - bz, n = Math.hypot(nx, nz) || 1; nx /= n; nz /= n; if (inside) { nx = -nx; nz = -nz; }
      pos.x = bx + nx * r; pos.z = bz + nz * r; bateu = true;
    }
  }
  return bateu;
}

/* ---------- rosto: foto do perfil no papel da textura ---------- */
function rostoNaTextura(original, foto, nome) {
  const W = original.image.width, H = original.image.height, k = W / 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(original.image, 0, 0);
  /* o papel fica em x 0–172, y 317–511 (em 512 px) e está de cabeça para baixo na textura */
  const x0 = 0, y0 = 317 * k, w = 173 * k, h = 195 * k;
  g.save(); g.translate(x0 + w, y0 + h); g.rotate(Math.PI);
  g.fillStyle = '#fbfaf2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,120,200,.18)'; g.lineWidth = 1 * k; for (let y = 14 * k; y < h; y += 12 * k) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = 'rgba(220,80,90,.45)'; g.beginPath(); g.moveTo(0, h - 22 * k); g.lineTo(w, h - 22 * k); g.stroke();
  const fx = 14 * k, fy = 10 * k, fw = w - 28 * k, fh = h - 46 * k;
  if (foto) {
    const s = Math.max(fw / foto.width, fh / foto.height), sw = fw / s, sh = fh / s;
    g.drawImage(foto, (foto.width - sw) / 2, Math.max(0, (foto.height - sh) * 0.3), sw, sh, fx, fy, fw, fh);
  } else {
    g.fillStyle = '#22386f'; g.beginPath(); g.arc(w / 2, fy + fh / 2, fw * 0.42, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = `800 ${46 * k}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText((nome || 'Você').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase(), w / 2, fy + fh / 2 + 2 * k);
  }
  g.fillStyle = '#1f2f57'; g.font = `700 ${15 * k}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((nome || 'Visitante').split(/\s+/)[0], w / 2, h - 12 * k);
  g.restore();
  const t = new THREE.CanvasTexture(c); t.flipY = original.flipY; t.colorSpace = original.colorSpace; t.wrapS = original.wrapS; t.wrapT = original.wrapT; t.anisotropy = 4;
  return t;
}

export function criarPasseio({ scene, camera, controls, renderer, chao, pedir }) {
  const grupo = new THREE.Group(); grupo.name = 'passeio'; grupo.visible = false; scene.add(grupo);
  let pronto = null, ativo = false, ultimo = 0;
  let boneco = null, mixer = null, acoes = {}, acaoAtual = null, texOriginal = null, matBoneco = null;
  let modeloCarro = null; const carros = [];
  const st = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), vy: 0, noChao: true, h: 0, estado: 'andar', carro: null, seq: null, correr: false };
  const cam = { yaw: Math.PI, pitch: 0.32, dist: 6.5, alvo: new THREE.Vector3() };
  const teclas = new Set(); const joy = { x: 0, y: 0, ativo: false };
  let foto = { uri: null, nome: '' };

  /* ---------- chão por raio, com cache numa grade de 0,5 m ---------- */
  const raio = new THREE.Raycaster(); raio.far = 60; const cache = new Map(); const baixo = new THREE.Vector3(0, -1, 0);
  function chaoEm(x, z) {
    const k = Math.round(x * 2) + ',' + Math.round(z * 2); let y = cache.get(k);
    if (y === undefined) { raio.set(new THREE.Vector3(Math.round(x * 2) / 2, 30, Math.round(z * 2) / 2), baixo); const hit = raio.intersectObject(chao, true)[0]; y = hit ? hit.point.y : 0; if (cache.size > 40000) cache.clear(); cache.set(k, y); }
    return y;
  }

  /* ---------- carga dos modelos ---------- */
  async function carregar() {
    const loader = new GLTFLoader(); const abrir = (n) => new Promise((ok, erro) => loader.load(BASE + n, ok, undefined, erro));
    const [gb, gc] = await Promise.all([abrir('boxman.glb'), abrir('car.glb')]);
    /* personagem: 1,75 m de altura, de frente para +z */
    boneco = gb.scene; boneco.updateMatrixWorld(true); const caixa = new THREE.Box3().setFromObject(boneco, true); const alt = caixa.max.y - caixa.min.y; boneco.scale.setScalar(1.75 / alt);
    boneco.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.material?.map) { matBoneco = o.material; texOriginal = o.material.map; o.material.metalness = 0; o.material.roughness = 0.8; } } });
    const raiz = new THREE.Group(); raiz.add(boneco); boneco = raiz; grupo.add(boneco);
    mixer = new THREE.AnimationMixer(raiz.children[0]); gb.animations.forEach((a) => { acoes[a.name] = mixer.clipAction(a); });
    aplicarFoto();
    /* carro: 4,3 m de comprimento, frente para +z (a frente é o lado das rodas que esterçam) */
    modeloCarro = gc.scene; modeloCarro.traverse((o) => { if (o.userData?.data === 'collision') { o.visible = false; o.userData.colisao = true; } });
    const cc = new THREE.Box3(); modeloCarro.updateMatrixWorld(true); modeloCarro.traverse((o) => { if (o.isMesh && !o.userData.colisao && !o.parent?.userData?.colisao) cc.expandByObject(o, true); }); const tam = cc.getSize(new THREE.Vector3());
    const porX = tam.x > tam.z; const esc = 4.3 / Math.max(tam.x, tam.z);
    const roda = modeloCarro.getObjectByName('wheel_fl'); const cen = cc.getCenter(new THREE.Vector3());
    let giro = porX ? (roda.position.x > cen.x ? -Math.PI / 2 : Math.PI / 2) : roda.position.z > cen.z ? 0 : Math.PI;
    modeloCarro.userData.ajuste = { esc, giro, chao: -cc.min.y * esc, cen };
    [...VAGAS.map((v, i) => ({ ...v, cor: CORES[i % CORES.length], parado: true })),
      ...FAIXAS.flatMap((f, j) => [0, 1, 2, 3].map((i) => ({ x: -380 + i * 190 + j * 95, z: f.z, h: f.dir > 0 ? Math.PI / 2 : -Math.PI / 2, faixa: f, cor: CORES[(i * 3 + j * 5 + 2) % CORES.length] })))].forEach((c) => carros.push(novoCarro(c)));
  }
  function novoCarro({ x, z, h, cor, faixa = null, parado = false }) {
    const a = modeloCarro.userData.ajuste; const m = modeloCarro.clone(true);
    const raiz = new THREE.Group(); const meio = new THREE.Group(); meio.rotation.y = a.giro; meio.scale.setScalar(a.esc); meio.add(m);
    m.position.set(-a.cen.x, 0, -a.cen.z); meio.position.y = a.chao; raiz.add(meio); grupo.add(raiz);
    const rodas = [], esterco = []; let volante = null; const portas = {};
    m.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); o.material.metalness = 0; o.material.roughness = 0.55; if (/car/i.test(o.material.name)) o.material.color.set(cor); }
      if (o.userData?.data === 'collision') o.visible = false;
      if (o.userData?.data === 'wheel') { rodas.push(o); if (o.userData.steering === 'true') esterco.push(o); }
      if (o.userData?.data === 'steering_wheel') volante = o;
      if (/^door_\d$/.test(o.name)) { portas[o.name] = o; o.userData.giro0 = o.rotation.y; }
    });
    const carro = { raiz, rodas, esterco, volante, portas, pos: new THREE.Vector3(x, 0, z), h, v: 0, volanteAng: 0, faixa, alvoV: faixa ? 11 + Math.random() * 4 : 0, porta: 0,
      banco: m.getObjectByName('seat_1'), entrada: m.getObjectByName('entrance_1') };
    posCarro(carro, 0); return carro;
  }
  const frente = (h) => new THREE.Vector3(Math.sin(h), 0, Math.cos(h));
  function posCarro(c, dt) {
    c.pos.y = chaoEm(c.pos.x, c.pos.z); c.raiz.position.copy(c.pos); c.raiz.rotation.y = c.h;
    c.rodas.forEach((r) => { r.rotation.x += (c.v * dt) / 0.33; });
    c.esterco.forEach((r) => { r.rotation.y = c.volanteAng * 0.55; });
    if (c.volante) c.volante.rotation.z = -c.volanteAng * 2.2;
    const p = c.portas.door_1; if (p) p.rotation.y = p.userData.giro0 - c.porta * 1.1;
  }

  /* ---------- foto ---------- */
  function aplicarFoto() {
    if (!matBoneco || !texOriginal) return;
    const pintar = (img) => { const t = rostoNaTextura(texOriginal, img, foto.nome); if (matBoneco.map !== texOriginal) matBoneco.map.dispose(); matBoneco.map = t; matBoneco.needsUpdate = true; pedir(); };
    if (!foto.uri) return pintar(null);
    const img = new Image(); img.onload = () => pintar(img); img.onerror = () => pintar(null); img.src = foto.uri;
  }
  function setFoto(uri, nome) { foto = { uri: uri || null, nome: nome || '' }; aplicarFoto(); }

  /* ---------- animações ---------- */
  function anim(nome, { vez = false, fade = 0.2, vel = 1 } = {}) {
    const a = acoes[nome]; if (!a) return 0; if (acaoAtual === a && !vez) { a.timeScale = vel; return a.getClip().duration; }
    a.reset(); a.timeScale = vel; a.setLoop(vez ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = vez; a.enabled = true;
    if (acaoAtual) a.crossFadeFrom(acaoAtual, fade, false); a.play(); acaoAtual = a; return a.getClip().duration / vel;
  }

  /* ---------- entrar e sair do carro ---------- */
  const mundo = (o) => o.getWorldPosition(new THREE.Vector3());
  function carroPerto() {
    let best = null, d0 = 3.2; for (const c of carros) { if (c.faixa) continue; const d = mundo(c.entrada).distanceTo(st.pos); if (d < d0) { d0 = d; best = c; } } return best;
  }
  function entrar(c) {
    st.estado = 'entrando'; st.carro = c; const e = mundo(c.entrada); e.y = st.pos.y;
    st.seq = { t: 0, passos: [
      { ms: 450, f: (k, s) => { st.pos.lerpVectors(s.de ??= st.pos.clone(), e, k); st.h = ang(st.h + ang(Math.atan2(c.pos.x - e.x, c.pos.z - e.z) - Math.PI / 2 - st.h) * k); }, ini: () => anim('run', { vel: 0.7 }) },
      { ini: () => anim('open_door_standing_left', { vez: true }), f: (k) => { c.porta = k; } , ms: 700 },
      { ini: () => anim('sit_down_left', { vez: true }), f: (k, s) => { st.pos.lerpVectors(s.de ??= st.pos.clone(), mundo(c.banco).setY(st.pos.y), k); }, ms: 1100 },
      { ini: () => anim('close_door_sitting_left', { vez: true }), f: (k) => { c.porta = 1 - k; }, ms: 700 },
      { ini: () => { anim('driving'); st.estado = 'dirigindo'; c.alvoV = 0; } },
    ] };
  }
  function sair() {
    const c = st.carro; if (!c || Math.abs(c.v) > 1.5) return; st.estado = 'saindo'; c.v = 0;
    st.seq = { t: 0, passos: [
      { ms: 500, f: (k) => { c.porta = k; } },
      { ini: () => anim('stand_up_left', { vez: true }), f: (k, s) => { const e = mundo(c.entrada); st.pos.lerpVectors(s.de ??= st.pos.clone(), e.setY(chaoEm(e.x, e.z)), k); }, ms: 1000 },
      { ini: () => anim('close_door_standing_left', { vez: true }), f: (k) => { c.porta = 1 - k; }, ms: 700 },
      { ini: () => { anim('idle'); st.estado = 'andar'; st.carro = null; } },
    ] };
  }
  function rodarSeq(dt) {
    const s = st.seq; if (!s) return; let p = s.passos[0];
    if (!p.iniciou) { p.iniciou = true; p.ini?.(); p.t = 0; }
    p.t += dt * 1000; const k = p.ms ? clamp(p.t / p.ms, 0, 1) : 1; p.f?.(k * k * (3 - 2 * k), p);
    if (k >= 1) { s.passos.shift(); if (!s.passos.length) st.seq = null; }
  }

  /* ---------- entrada do jogador ---------- */
  function eixo() {
    let x = (teclas.has('KeyD') || teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('KeyA') || teclas.has('ArrowLeft') ? 1 : 0);
    let y = (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0);
    if (joy.ativo) { x = joy.x; y = joy.y; }
    return { x, y, correr: st.correr || teclas.has('ShiftLeft') || teclas.has('ShiftRight') || (joy.ativo && Math.hypot(joy.x, joy.y) > 0.92) };
  }
  const onDown = (e) => { if (!ativo || e.target.closest?.('input,select,textarea')) return; teclas.add(e.code); if (e.code === 'Space') { e.preventDefault(); pular(); } if (e.code === 'KeyE') acao(); };
  const onUp = (e) => teclas.delete(e.code);
  function pular() { if (st.estado === 'andar' && st.noChao) { st.vy = 4.6; st.noChao = false; anim(st.vel.length() > 1 ? 'jump_running' : 'jump_idle', { vez: true, fade: 0.1 }); } }
  function acao() { if (st.estado === 'andar') { const c = carroPerto(); if (c) entrar(c); } else if (st.estado === 'dirigindo') sair(); }

  /* controle na tela e câmera por arrasto */
  function montarHud() {
    const area = $('#joy'), bola = $('#joy i'); let id = null, cx = 0, cy = 0;
    area.addEventListener('pointerdown', (e) => { id = e.pointerId; area.setPointerCapture(id); const r = area.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.ativo = true; mover(e); e.stopPropagation(); });
    const mover = (e) => { if (e.pointerId !== id) return; const R = 48; let dx = e.clientX - cx, dy = e.clientY - cy; const n = Math.hypot(dx, dy); if (n > R) { dx *= R / n; dy *= R / n; } joy.x = dx / R; joy.y = -dy / R; bola.style.transform = `translate(${dx}px,${dy}px)`; };
    area.addEventListener('pointermove', mover);
    const solta = (e) => { if (e.pointerId !== id) return; id = null; joy.ativo = false; joy.x = joy.y = 0; bola.style.transform = ''; };
    area.addEventListener('pointerup', solta); area.addEventListener('pointercancel', solta);
    $('#p-pular').onclick = () => { if (st.estado === 'dirigindo') return; pular(); };
    $('#p-correr').onclick = () => { st.correr = !st.correr; $('#p-correr').setAttribute('aria-pressed', st.correr); };
    $('#p-acao').onclick = acao;
    /* arrastar no mapa gira a câmera; dois dedos ou a roda aproximam */
    const tela = $('#tela'); const toques = new Map(); let pinca = 0;
    tela.addEventListener('pointerdown', (e) => { if (!ativo) return; toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    tela.addEventListener('pointermove', (e) => {
      if (!ativo || !toques.has(e.pointerId)) return; const a = toques.get(e.pointerId);
      if (toques.size === 2) { const [p, q] = [...toques.values()]; const d0 = Math.hypot(p.x - q.x, p.y - q.y); toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [p2, q2] = [...toques.values()]; const d1 = Math.hypot(p2.x - q2.x, p2.y - q2.y); if (pinca) cam.dist = clamp(cam.dist * (d0 / d1), 3, 22); pinca = 1; return; }
      cam.yaw -= (e.clientX - a.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - a.y) * 0.004, 0.05, 1.25); toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); cam.livre = performance.now();
    });
    const fim = (e) => { toques.delete(e.pointerId); if (toques.size < 2) pinca = 0; };
    tela.addEventListener('pointerup', fim); tela.addEventListener('pointercancel', fim);
    tela.addEventListener('wheel', (e) => { if (!ativo) return; e.preventDefault(); cam.dist = clamp(cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 3, 22); }, { passive: false });
  }

  /* ---------- quadro ---------- */
  function tickBoneco(dt) {
    const { x, y, correr } = eixo();
    if (st.estado === 'andar') {
      const f = new THREE.Vector3().subVectors(cam.alvo, camera.position).setY(0).normalize(), d = new THREE.Vector3(-f.z, 0, f.x);
      const quer = f.multiplyScalar(y).add(d.multiplyScalar(x)); const n = Math.min(1, quer.length());
      const v = n > 0.05 ? (correr ? 7 : 4) * n : 0; if (n > 0.05) { quer.normalize(); st.h = ang(st.h + ang(Math.atan2(quer.x, quer.z) - st.h) * Math.min(1, dt * 12)); }
      const alvoVel = frente(st.h).multiplyScalar(v); st.vel.lerp(alvoVel, Math.min(1, dt * (st.noChao ? 10 : 2)));
      st.pos.addScaledVector(st.vel, dt); empurrar(st.pos, 0.35);
      for (const c of carros) { [-1.3, 0, 1.3].forEach((s) => { const q = c.pos.clone().addScaledVector(frente(c.h), s); const o = new THREE.Vector3().subVectors(st.pos, q).setY(0); const dd = o.length(); if (dd < 1.25 && dd > 0.001) st.pos.addScaledVector(o.normalize(), 1.25 - dd); }); }
      const g = chaoEm(st.pos.x, st.pos.z);
      if (!st.noChao) { st.vy -= 12 * dt; st.pos.y += st.vy * dt; if (st.pos.y <= g) { st.pos.y = g; st.noChao = true; st.vy = 0; } }
      else if (st.pos.y - g > 0.6) { st.noChao = false; st.vy = 0; anim('falling'); } else st.pos.y += (g - st.pos.y) * Math.min(1, dt * 14);
      if (st.noChao && (!acaoAtual || !/^(jump|drop|stop)/.test(acaoAtual.getClip().name) || !acaoAtual.isRunning())) anim(v < 0.2 ? 'idle' : correr ? 'sprint' : 'run', { vel: v < 0.2 ? 1 : correr ? 1 : 0.9 + v / 10 });
      $('#p-acao').hidden = !carroPerto(); $('#p-acao').textContent = 'Entrar no carro';
    } else if (st.estado === 'dirigindo') {
      const c = st.carro; const acel = y > 0 ? 7 * y : y < 0 ? (c.v > 0.5 ? 14 * y : 4 * y) : 0;
      c.v += acel * dt; c.v -= c.v * (teclas.has('Space') ? 2.5 : 0.35) * dt; c.v = clamp(c.v, -5, 24); if (Math.abs(c.v) < 0.05 && !y) c.v = 0;
      c.volanteAng += (clamp(-x, -1, 1) * 0.6 - c.volanteAng) * Math.min(1, dt * 6);
      c.h += (c.v / 2.7) * Math.tan(c.volanteAng) * dt; c.pos.addScaledVector(frente(c.h), c.v * dt);
      bateuCarro(c);
      st.pos.copy(mundo(c.banco)); st.h = c.h;
      $('#p-acao').hidden = Math.abs(c.v) > 1.5; $('#p-acao').textContent = 'Sair do carro';
    } else { $('#p-acao').hidden = true; if (st.carro) { st.carro.v *= 0.9; } }
    rodarSeq(dt);
    if (st.estado === 'dirigindo' || st.estado === 'saindo' || st.estado === 'entrando') { if (st.estado !== 'entrando' || st.seq?.passos.length < 4) { /* no banco, acompanha o carro */ } }
    boneco.position.copy(st.pos); if (st.estado === 'dirigindo') boneco.position.copy(mundo(st.carro.banco));
    boneco.rotation.y = st.h; mixer.update(dt);
  }
  function bateuCarro(c) {
    let bateu = false; const f = frente(c.h);
    [-1.4, 0, 1.4].forEach((s) => { const q = c.pos.clone().addScaledVector(f, s); const antes = q.clone(); if (empurrar(q, 1.0)) { bateu = true; c.pos.add(q.sub(antes)); } });
    for (const o of carros) { if (o === c) continue; const d = new THREE.Vector3().subVectors(c.pos, o.pos).setY(0); const n = d.length(); if (n < 2.6 && n > 0.001) { c.pos.addScaledVector(d.normalize(), 2.6 - n); bateu = true; } }
    if (bateu) c.v *= -0.25;
  }
  function tickTransito(dt) {
    for (const c of carros) {
      if (c.faixa) {
        /* distância até o carro da frente (mesma faixa) e até quem estiver na pista à frente */
        let livre = 60; const dir = c.faixa.dir;
        for (const o of carros) if (o !== c && o.faixa === c.faixa) { const dx = (o.pos.x - c.pos.x) * dir; if (dx > 0 && dx < livre) livre = dx; }
        const gente = st.carro && st.estado === 'dirigindo' ? st.carro.pos : st.pos; const dz = Math.abs(gente.z - c.faixa.z), dxg = (gente.x - c.pos.x) * dir; if (dz < 2.6 && dxg > 0 && dxg < livre) livre = dxg;
        const alvo = livre < 7 ? 0 : livre < 22 ? c.alvoV * (livre - 7) / 15 : c.alvoV;
        c.v += clamp(alvo - c.v, -9 * dt, 3 * dt); c.pos.x += c.v * dir * dt; c.pos.z = c.faixa.z;
        if (c.pos.x * dir > 420) c.pos.x -= 840 * dir;
      } else if (c !== st.carro) c.v = 0;
      posCarro(c, dt);
    }
  }
  function tickCamera(dt) {
    const alvo = st.pos.clone().add(new THREE.Vector3(0, st.estado === 'dirigindo' ? 1.6 : 1.45, 0));
    cam.alvo.lerp(alvo, Math.min(1, dt * 10));
    /* atrás de quem anda ou do carro, quando ninguém está girando a câmera */
    const solto = !cam.livre || performance.now() - cam.livre > 2500; const mov = st.estado === 'dirigindo' ? Math.abs(st.carro.v) > 1 : st.vel.length() > 1;
    if (solto && mov) cam.yaw = ang(cam.yaw + ang(st.h + Math.PI - cam.yaw) * Math.min(1, dt * (st.estado === 'dirigindo' ? 3 : 1.2)));
    const dist = st.estado === 'dirigindo' ? Math.max(cam.dist, 8.5) : cam.dist;
    const p = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(dist).add(cam.alvo);
    p.y = Math.max(p.y, chaoEm(p.x, p.z) + 0.6);
    camera.position.copy(p); controls.target.copy(cam.alvo); camera.lookAt(cam.alvo);
  }
  function tick(now) {
    if (!ativo || !boneco) return false;
    const dt = Math.min(0.05, Math.max(0.001, (now - (ultimo || now)) / 1000)); ultimo = now;
    tickTransito(dt); tickBoneco(dt); tickCamera(dt);
    renderer.shadowMap.needsUpdate = true; return true;
  }

  /* ---------- liga e desliga ---------- */
  async function ligar() {
    if (ativo) return; ativo = true; controls.enabled = false; ultimo = 0;
    addEventListener('keydown', onDown); addEventListener('keyup', onUp);
    if (!pronto) { pronto = carregar().then(montarHud); }
    try { await pronto; } catch (e) { console.error(e); ativo = false; controls.enabled = true; throw e; }
    if (!ativo) return;
    /* começa na portaria de pedestres, de frente para o campus */
    if (!st.iniciou) { st.iniciou = true; const p = byId('portaria').p; const xs = p.map((q) => q[0]); st.pos.set((Math.min(...xs) + Math.max(...xs)) / 2 + 2, 0, 44); st.pos.y = chaoEm(st.pos.x, st.pos.z); st.h = Math.PI; cam.yaw = 0; cam.alvo.copy(st.pos); anim('idle'); }
    grupo.visible = true; pedir();
  }
  function desligar() {
    if (!ativo) return; ativo = false; teclas.clear(); grupo.visible = false; controls.enabled = true;
    removeEventListener('keydown', onDown); removeEventListener('keyup', onUp); controls.update(); pedir();
  }
  return { ligar, desligar, tick, setFoto, ativo: () => ativo, estado: () => st, carros, cam };
}
