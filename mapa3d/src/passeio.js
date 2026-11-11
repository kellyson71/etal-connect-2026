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
import { ROAD_Y0, ROAD_Y1, byId, FH } from './dados.js';
import { criarColisao } from './colisao.js';
import { criarMoveis } from './moveis.js';

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

export function criarPasseio({ scene, camera, controls, renderer, chao, pedir, partes = [], principal, setCorte = () => {}, desktop = false, cones = [], hora = null }) {
  let fis = null, moveis = null; let corte = 99; let ventos = null, piv = null, ossos = {};
  const grupo = new THREE.Group(); grupo.name = 'passeio'; grupo.visible = false; scene.add(grupo);
  /* luz de dentro: sem ela o interior só recebia a claridade do céu (o telhado faz sombra em tudo). Fica sempre na cena,
     com força zero do lado de fora, para o programa de desenho não ser refeito a cada entrada. */
  const luzDentro = new THREE.PointLight(0xfff2dc, 0, 22, 1.25); luzDentro.name = 'luz-dentro'; scene.add(luzDentro);
  const HORAS = [[8, 'Manhã'], [12.5, 'Meio-dia'], [17.4, 'Fim de tarde'], [20, 'Noite']]; let iHora = 1;
  function trocarHora() { if (!hora) return; iHora = (iHora + 1) % HORAS.length; hora(HORAS[iHora][0]); st.noite = HORAS[iHora][0] >= 18.5; aviso?.(HORAS[iHora][1]); }
  let pronto = null, ativo = false, ultimo = 0;
  let boneco = null, mixer = null, acoes = {}, acaoAtual = null, texOriginal = null, matBoneco = null;
  let modeloCarro = null; const carros = [];
  const st = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), vy: 0, noChao: true, h: 0, estado: 'andar', carro: null, seq: null, correr: false };
  const cam = { yaw: Math.PI, pitch: 0.32, dist: 6.5, alvo: new THREE.Vector3(), fov: 38, rolo: 0, fp: 0, fpLigada: true, bob: 0, bobAmp: 0 };
  /* primeira pessoa: dentro do bloco, a pé. cam.fp vai de 0 (terceira pessoa) a 1 (olhos do personagem). */
  const querFp = () => cam.fpLigada && st.dentro && st.estado === 'andar';
  const pitchMin = () => (st.estado === 'voando' ? -1.25 : querFp() ? -1.2 : -0.35);
  /* os botões têm ícone e um nome curto: troca só o nome */
  const nomear = (b, curto, longo = curto) => { if (!b) return; const t = b.querySelector('span'); if (t) t.textContent = curto; else b.textContent = curto; b.setAttribute('aria-label', longo); };
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
    /* raiz (posição e rumo) → pivô no peito (inclinação do voo) → modelo */
    const raiz = new THREE.Group(); piv = new THREE.Group(); piv.position.y = 0.95; boneco.position.y = -0.95; piv.add(boneco); raiz.add(piv);
    const modelo = boneco; boneco = raiz; grupo.add(boneco);
    modelo.traverse((o) => { if (o.isBone) ossos[o.name] = o; });
    mixer = new THREE.AnimationMixer(modelo); gb.animations.forEach((a) => { acoes[a.name] = mixer.clipAction(a); });
    aplicarFoto();
    /* riscos de vento em volta de quem voa rápido */
    { const n = 90, p = new Float32Array(n * 6); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      ventos = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false })); ventos.frustumCulled = false;
      ventos.userData.base = Array.from({ length: n }, () => new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 18)); grupo.add(ventos); }
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
    c.pos.y = fis ? fis.terreno(c.pos.x, c.pos.z) : chaoEm(c.pos.x, c.pos.z); c.raiz.position.copy(c.pos); c.raiz.rotation.y = c.h;
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
      { ini: () => anim('stand_up_left', { vez: true }), f: (k, s) => { const e = mundo(c.entrada); st.pos.lerpVectors(s.de ??= st.pos.clone(), e.setY(fis.terreno(e.x, e.z)), k); }, ms: 1000 },
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
    const sobe = (teclas.has('Space') ? 1 : 0) + (joy.sobe ? 1 : 0) - (teclas.has('KeyC') || teclas.has('ControlLeft') || joy.desce ? 1 : 0);
    return { x, y, sobe, correr: st.correr || teclas.has('ShiftLeft') || teclas.has('ShiftRight') || (joy.ativo && Math.hypot(joy.x, joy.y) > 0.92) };
  }
  const onDown = (e) => {
    if (!ativo || e.target.closest?.('input,select,textarea')) return; if (e.repeat && e.code !== 'Space') return; teclas.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && st.estado === 'andar') pular(); if (e.code === 'KeyE') acao(); if (e.code === 'KeyF') voar(); if (e.code === 'KeyV') trocarVisao(); if (e.code === 'KeyT') trocarHora(); if (e.code === 'KeyR' && st.estado === 'voando') { st.vooTurbo = !st.vooTurbo; aviso?.(st.vooTurbo ? 'Muito rápido' : 'Rápido'); }
  };
  const onUp = (e) => teclas.delete(e.code);
  function pular() { if (st.estado === 'andar' && st.noChao) { st.vy = 4.6; st.noChao = false; anim(st.vel.length() > 1 ? 'jump_running' : 'jump_idle', { vez: true, fade: 0.1 }); } }
  function acao() { if (st.estado === 'andar') { const c = carroPerto(); if (c) entrar(c); } else if (st.estado === 'dirigindo') sair(); }
  /* voar: decola com um impulso; de novo, pousa (cai até o chão e amortece) */
  function voar() {
    if (st.estado === 'voando') { st.estado = 'andar'; cam.pitch = Math.max(cam.pitch, -0.35); st.noChao = false; st.vy = Math.min(0, st.vel.y); st.doVoo = true; marcarVoo(); return; }
    if (st.estado !== 'andar') return;
    if (fis?.noBloco(st.pos.x, st.pos.z)) { aviso?.('Dentro do bloco não dá para voar. Saia pela porta.'); return; }
    st.estado = 'voando'; st.vel.y = 7; st.noChao = false; anim('jump_idle', { vez: true, fade: 0.1 }); st.tVoo = 0; marcarVoo();
  }
  function marcarCorrer() { const b = $('#p-correr'); if (!b) return; const v = st.estado === 'voando'; b.setAttribute('aria-pressed', !!st.correr); b.classList.toggle('turbo', v && !!st.vooTurbo); nomear(b, v ? (st.vooTurbo ? 'Turbo' : st.correr ? 'Rápido' : 'Normal') : 'Correr'); }
  function marcarVoo() { if (st.estado !== 'voando') st.vooTurbo = false; marcarCorrer(); const v = st.estado === 'voando'; document.body.classList.toggle('voando', v); const b = $('#p-voar'); if (b) { b.setAttribute('aria-pressed', v); nomear(b, v ? 'Pousar' : 'Voar'); } }
  let aviso = null;
  /* V (ou o botão): troca entre ver pelos olhos e ver de cima, com o prédio cortado, quando se está dentro do bloco */
  function trocarVisao() { cam.fpLigada = !cam.fpLigada; marcarVisao(); if (st.dentro) aviso?.(cam.fpLigada ? 'Primeira pessoa' : 'Vista de cima'); }
  function marcarVisao() { const b = $('#p-visao'); if (b) { b.hidden = !st.dentro || st.estado !== 'andar'; nomear(b, cam.fpLigada ? 'De cima' : 'Olhos', cam.fpLigada ? 'Ver de cima' : 'Ver pelos olhos'); } }

  /* controle na tela e câmera: arrastar (toque) ou mouse travado (computador) */
  function montarHud() {
    const area = $('#joy'), bola = $('#joy i'); let id = null, cx = 0, cy = 0;
    area.addEventListener('pointerdown', (e) => { id = e.pointerId; area.setPointerCapture(id); const r = area.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.ativo = true; mover(e); e.stopPropagation(); });
    const mover = (e) => { if (e.pointerId !== id) return; const R = 48; let dx = e.clientX - cx, dy = e.clientY - cy; const n = Math.hypot(dx, dy); if (n > R) { dx *= R / n; dy *= R / n; } joy.x = dx / R; joy.y = -dy / R; bola.style.transform = `translate(${dx}px,${dy}px)`; };
    area.addEventListener('pointermove', mover);
    const solta = (e) => { if (e.pointerId !== id) return; id = null; joy.ativo = false; joy.x = joy.y = 0; bola.style.transform = ''; };
    area.addEventListener('pointerup', solta); area.addEventListener('pointercancel', solta);
    /* os botões respondem no toque (pointerdown), não no clique: com um dedo no controle, o segundo dedo não gera
       clique no navegador, e por isso não dava para andar e pular ao mesmo tempo */
    const toque = (b, fn) => { if (!b) return; b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.classList.add('apertado'); fn(); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => b.addEventListener(t, () => b.classList.remove('apertado'))); b.addEventListener('click', (e) => { if (e.detail === 0) fn(); }); };
    toque($('#p-pular'), () => { if (st.estado === 'andar') pular(); });
    /* a pé liga e desliga a corrida; voando passa por normal → rápido → muito rápido */
    toque($('#p-correr'), () => { if (st.estado === 'voando') { if (!st.correr) { st.correr = true; st.vooTurbo = false; } else if (!st.vooTurbo) st.vooTurbo = true; else { st.correr = false; st.vooTurbo = false; } } else st.correr = !st.correr; marcarCorrer(); });
    toque($('#p-hora'), trocarHora);
    toque($('#p-acao'), acao); toque($('#p-voar'), voar); toque($('#p-visao'), trocarVisao);
    const segura = (b, k) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); joy[k] = true; b.setPointerCapture(e.pointerId); }); ['pointerup', 'pointercancel'].forEach((t) => b.addEventListener(t, () => { joy[k] = false; })); };
    segura($('#p-subir'), 'sobe'); segura($('#p-descer'), 'desce');
    const tela = $('#tela'); const toques = new Map(); let pinca = 0;
    /* computador: clicar trava o mouse e ele passa a girar a câmera, como num jogo (Esc solta) */
    tela.addEventListener('click', () => { if (ativo && desktop && document.pointerLockElement !== tela) tela.requestPointerLock?.(); });
    document.addEventListener('mousemove', (e) => { if (!ativo || document.pointerLockElement !== tela) return; cam.yaw -= e.movementX * 0.0024; cam.pitch = clamp(cam.pitch + e.movementY * 0.0018, pitchMin(), 1.3); cam.livre = performance.now(); });
    document.addEventListener('pointerlockchange', () => { document.body.classList.toggle('mouse-preso', document.pointerLockElement === tela); });
    tela.addEventListener('pointerdown', (e) => { if (!ativo || document.pointerLockElement === tela) return; toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    tela.addEventListener('pointermove', (e) => {
      if (!ativo || !toques.has(e.pointerId)) return; const a = toques.get(e.pointerId);
      if (toques.size === 2) { const [p, q] = [...toques.values()]; const d0 = Math.hypot(p.x - q.x, p.y - q.y); toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [p2, q2] = [...toques.values()]; const d1 = Math.hypot(p2.x - q2.x, p2.y - q2.y); if (pinca) cam.dist = clamp(cam.dist * (d0 / d1), 2.5, 24); pinca = 1; return; }
      cam.yaw -= (e.clientX - a.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - a.y) * 0.004, pitchMin(), 1.3); toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); cam.livre = performance.now();
    });
    const fim = (e) => { toques.delete(e.pointerId); if (toques.size < 2) pinca = 0; };
    tela.addEventListener('pointerup', fim); tela.addEventListener('pointercancel', fim);
    tela.addEventListener('wheel', (e) => { if (!ativo) return; e.preventDefault(); cam.dist = clamp(cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 2.5, 24); }, { passive: false });
  }

  /* ---------- quadro ---------- */
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  /* pose de voo por cima da animação: braços para a frente (rápido) ou abertos (parado), pernas para trás */
  /* ângulos medidos no modelo: x 2,6 − 2π leva os braços para cima da cabeça (voo rápido) passando por baixo, pela frente do corpo, como no movimento natural (a mesma pose final que +2,6, que passava por trás); devagar, os braços ficam para trás (x +0,75), um pouco abertos (z −0,2) */
  const AJ = { braco: 2.6 - 2 * Math.PI, tras: 0.75, abre: -0.2, cotovelo: 0.5, perna: 0.35, joelho: 0.5, eixoBraco: 'x', eixoAbre: 'z' };
  function poseVoo(rapido, t) {
    const gira = (nome, x, y = 0, z = 0) => { const o = ossos[nome]; if (!o) return; _q.setFromEuler(_e.set(x, y, z)); o.quaternion.multiply(_q); };
    const eixo = (e, v) => (e === 'x' ? [v, 0, 0] : e === 'y' ? [0, v, 0] : [0, 0, v]);
    const bal = Math.sin(t * 2.2) * 0.07, lento = 1 - rapido;
    const bL = eixo(AJ.eixoBraco, AJ.braco * rapido + AJ.tras * lento), bR = eixo(AJ.eixoBraco, AJ.braco * rapido + AJ.tras * lento); const aL = eixo(AJ.eixoAbre, AJ.abre * lento + bal), aR = eixo(AJ.eixoAbre, -AJ.abre * lento - bal);
    gira('arm_upperL', bL[0] + aL[0], bL[1] + aL[1], bL[2] + aL[2]); gira('arm_upperR', bR[0] + aR[0], bR[1] + aR[1], bR[2] + aR[2]);
    gira('arm_lowerL', AJ.cotovelo * lento * 0.5); gira('arm_lowerR', AJ.cotovelo * lento * 0.5);
    gira('leg_upperL', AJ.perna * rapido + bal); gira('leg_upperR', AJ.perna * rapido * 0.6 - bal);
    gira('leg_lowerL', AJ.joelho * lento); gira('leg_lowerR', AJ.joelho * lento + 0.25);
  }
  function tickBoneco(dt) {
    const { x, y, sobe, correr } = eixo();
    const fC = new THREE.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)), dC = new THREE.Vector3(-fC.z, 0, fC.x);
    let inclina = 0, rolo = 0;
    if (st.estado === 'andar') {
      const quer = fC.clone().multiplyScalar(y).add(dC.clone().multiplyScalar(x)); const n = Math.min(1, quer.length());
      const v = n > 0.05 ? (correr ? 7 : 4) * n : 0; if (n > 0.05) { quer.normalize(); st.h = ang(st.h + ang(Math.atan2(quer.x, quer.z) - st.h) * Math.min(1, dt * 12)); }
      const alvoVel = (cam.fp > 0.5 && n > 0.05 ? quer.clone() : frente(st.h)).multiplyScalar(v); alvoVel.y = 0; const vy0 = st.vel.y; st.vel.lerp(alvoVel, Math.min(1, dt * (st.noChao ? 10 : 1.5))); st.vel.y = vy0;
      st.yAntes = st.pos.y;
      /* dentro do bloco o corpo conta um pouco mais estreito: os lances da escada e as portas são justos na grade de 25 cm */
      fis.mover(st, st.pos, st.pos.x + st.vel.x * dt, st.pos.z + st.vel.z * dt, st.dentro ? 0.24 : 0.3);
      for (const c of carros) [-1.3, 0, 1.3].forEach((s) => { const q = c.pos.clone().addScaledVector(frente(c.h), s); const o = new THREE.Vector3().subVectors(st.pos, q).setY(0); const dd = o.length(); if (dd < 1.25 && dd > 0.001) st.pos.addScaledVector(o.normalize(), 1.25 - dd); });
      const g = fis.alturaEm(st, st.pos.x, st.pos.z);
      if (!st.noChao) {
        st.vy -= 14 * dt; st.pos.y += st.vy * dt;
        if (st.pos.y <= g) { st.pos.y = g; st.noChao = true; const forte = st.vy < -7 || st.doVoo; st.vy = 0; if (forte) anim(Math.hypot(st.vel.x, st.vel.z) > 5 ? 'drop_running_roll' : st.doVoo || st.vy < -9 ? 'drop_idle' : 'drop_running', { vez: true, fade: 0.08 }); st.doVoo = false; }
      } else if (st.pos.y - g > 0.55) { st.noChao = false; st.vy = 0; anim('falling'); } else st.pos.y += (g - st.pos.y) * Math.min(1, dt * 16);
      const ocupada = acaoAtual && /^(jump|drop|stop)/.test(acaoAtual.getClip().name) && acaoAtual.isRunning();
      if (st.noChao && !ocupada) anim(v < 0.2 ? 'idle' : correr ? 'sprint' : 'run', { vel: v < 0.2 ? 1 : correr ? 1 : 0.9 + v / 10 });
      $('#p-acao').hidden = !carroPerto(); nomear($('#p-acao'), 'Entrar', 'Entrar no carro');
    } else if (st.estado === 'voando') {
      /* voo: inércia suave; rápido com Shift (ou controle no máximo); Espaço sobe, C desce */
      st.tVoo += dt;
      /* turbo: segurando Shift (ou Correr ligado) a velocidade máxima sobe aos poucos de 26 até 70 m/s */
      /* três marchas: normal (9 m/s), rápido (Shift ou Correr: 20 m/s) e muito rápido (R, ou Correr de novo: sobe aos poucos até 46 m/s) */
      const marcha = st.vooTurbo ? 2 : correr ? 1 : 0;
      st.turbo = clamp((st.turbo || 0) + (marcha === 2 && y > 0 ? dt * 0.5 : -dt * 1.2), 0, 1); const max = marcha === 2 ? 20 + 26 * st.turbo : marcha === 1 ? 20 : 9;
      /* para a frente é para onde a câmera olha, inclusive para cima e para baixo; os lados ficam na horizontal */
      const olhar = new THREE.Vector3().subVectors(cam.alvo, camera.position).normalize();
      const quer = olhar.multiplyScalar(y).add(dC.clone().multiplyScalar(x)); const n = Math.min(1, quer.length()); if (n > 0) quer.normalize();
      const alvo = quer.multiplyScalar(max * n); alvo.y += sobe * (marcha ? 10 : 6) + Math.sin(st.tVoo * 1.7) * 0.25;
      st.vel.lerp(alvo, Math.min(1, dt * (st.tVoo < 0.5 ? 1.2 : st.turbo > 0.2 ? 1.4 : 2.2)));
      const hz = Math.hypot(st.vel.x, st.vel.z); const hAntes = st.h;
      if (hz > 0.6) st.h = ang(st.h + ang(Math.atan2(st.vel.x, st.vel.z) - st.h) * Math.min(1, dt * 3.2));
      const nx = st.pos.x + st.vel.x * dt, nz = st.pos.z + st.vel.z * dt; let ny = st.pos.y + st.vel.y * dt;
      if (!fis.bateVoo(nx, nz, ny) && !(fis.noBloco(nx, nz) && ny < 12.2)) { st.pos.x = nx; st.pos.z = nz; } else { st.vel.x *= -0.3; st.vel.z *= -0.3; }
      const g = fis.terreno(st.pos.x, st.pos.z); ny = clamp(ny, g + 0.25, 160); if (ny <= g + 0.25 && st.vel.y < 0) st.vel.y = 0; st.pos.y = ny;
      const rapido = clamp((st.vel.length() - 3) / 12, 0, 1);
      /* o corpo segue a direção do voo: deitado na horizontal, mais em pé subindo, de cabeça para baixo mergulhando */
      const sp = st.vel.length(), elev = sp > 0.5 ? Math.asin(clamp(st.vel.y / sp, -1, 1)) : 0, rap3 = clamp((sp - 3) / 12, 0, 1);
      inclina = clamp(rap3 * (1.3 - elev), 0, 2.4) - clamp(st.vel.y / 14, -0.3, 0.3) * (1 - rap3); rolo = clamp(-ang(st.h - hAntes) / Math.max(dt, 1e-3) * 0.18, -0.55, 0.55);
      anim('idle', { fade: 0.4 });
      st.rapido = clamp((st.vel.length() - 15) / 10, 0, 1); /* braços: para trás no voo normal; acima da cabeça só acima de 15 m/s */
    } else if (st.estado === 'dirigindo') {
      const c = st.carro; const acel = y > 0 ? 7 * y : y < 0 ? (c.v > 0.5 ? 14 * y : 4 * y) : 0;
      c.v += acel * dt; c.v -= c.v * (teclas.has('Space') ? 2.5 : 0.35) * dt; c.v = clamp(c.v, -5, 24); if (Math.abs(c.v) < 0.05 && !y) c.v = 0;
      c.volanteAng += (clamp(-x, -1, 1) * 0.6 - c.volanteAng) * Math.min(1, dt * 6);
      const antes = c.pos.clone(), hA = c.h;
      c.h += (c.v / 2.7) * Math.tan(c.volanteAng) * dt; c.pos.addScaledVector(frente(c.h), c.v * dt);
      bateuCarro(c, antes, hA);
      st.pos.copy(mundo(c.banco)); st.h = c.h;
      $('#p-acao').hidden = Math.abs(c.v) > 1.5; nomear($('#p-acao'), 'Sair', 'Sair do carro');
    } else { $('#p-acao').hidden = true; if (st.carro) { st.carro.v *= 0.9; } }
    rodarSeq(dt);
    boneco.position.copy(st.pos); if (st.estado === 'dirigindo') boneco.position.copy(mundo(st.carro.banco));
    boneco.rotation.y = st.h;
    piv.rotation.x += (inclina - piv.rotation.x) * Math.min(1, dt * 4); piv.rotation.z += (rolo - piv.rotation.z) * Math.min(1, dt * 3);
    cam.rolo = piv.rotation.z;
    mixer.update(dt); if (st.estado === 'voando') poseVoo(st.rapido || 0, st.tVoo);
    /* corte do bloco: dentro dele, o prédio é cortado acima do andar (e da cabeça) para a câmera ver por cima */
    const dentro = fis.noBloco(st.pos.x, st.pos.z) && st.estado === 'andar';
    /* o corte fica logo acima da cabeça: as paredes viram meia-parede e as salas ficam abertas por cima, como numa
       maquete; com a parede inteira, quem andava no corredor ficava escondido atrás da sala da frente */
    const alvoCorte = dentro && !cam.fpLigada ? st.pos.y + 1.95 : 99; // pelos olhos, o prédio fica inteiro
    corte = alvoCorte > 50 ? (corte < 14 ? corte + (14.5 - corte) * Math.min(1, dt * 5) : 99) : corte > 50 ? 14 : corte + (alvoCorte - corte) * Math.min(1, dt * 6);
    if (corte > 14.2 && alvoCorte > 50) corte = 99; st.dentro = dentro;
    /* dentro de uma sala, a tampa dela some para se ver lá dentro */
    const andar = Math.min(2, Math.max(0, Math.round((st.pos.y - 0.03) / FH)));
    principal.destampar(dentro && !cam.fpLigada ? andar : -1, dentro && !cam.fpLigada && !st.sub ? principal.salaEm(andar, st.pos.x, st.pos.z) : null, dt);
    marcarVisao();
    setCorte(corte);
    /* portas e cones reagem a quem passa: a pessoa e os carros */
    const corpos = st.estado === 'andar' ? [{ x: st.pos.x, z: st.pos.z, r: 0.32, vx: st.vel.x, vz: st.vel.z, y: st.pos.y }] : [];
    for (const c of carros) { if (c.faixa && Math.abs(c.pos.x - 10) > 60) continue; const f = frente(c.h); [-1.3, 0, 1.3].forEach((s) => corpos.push({ x: c.pos.x + f.x * s, z: c.pos.z + f.z * s, r: 1.0, vx: f.x * c.v, vz: f.z * c.v, y: c.pos.y })); }
    moveis.tick(dt, corpos);
  }
  function bateuCarro(c, antes, hA) {
    let bateu = false; const f = frente(c.h);
    for (const s of [-1.45, 0, 1.45]) { const q = c.pos.clone().addScaledVector(f, s); if (!fis.livre(q.x, q.z, 0.95)) { bateu = true; break; } }
    for (const o of carros) { if (o === c) continue; const d = new THREE.Vector3().subVectors(c.pos, o.pos).setY(0); if (d.length() < 2.4) { bateu = true; break; } }
    if (bateu) { c.pos.copy(antes); c.h = hA; c.v *= -0.25; }
  }
  function tickTransito(dt) {
    for (const c of carros) {
      if (c.faixa) {
        /* distância até o carro da frente (mesma faixa) e até quem estiver na pista à frente */
        let livre = 60; const dir = c.faixa.dir;
        for (const o of carros) if (o !== c && o.faixa === c.faixa) { const dx = (o.pos.x - c.pos.x) * dir; if (dx > 0 && dx < livre) livre = dx; }
        const gente = st.carro && st.estado === 'dirigindo' ? st.carro.pos : st.pos; const dz = Math.abs(gente.z - c.faixa.z), dxg = (gente.x - c.pos.x) * dir; if (dz < 2.6 && dxg > 0 && dxg < livre && gente.y < 3) livre = dxg;
        for (const o of carros) if (!o.faixa) { const dzo = Math.abs(o.pos.z - c.faixa.z), dxo = (o.pos.x - c.pos.x) * dir; if (dzo < 2.6 && dxo > 0 && dxo < livre) livre = dxo; }
        const alvo = livre < 7 ? 0 : livre < 22 ? c.alvoV * (livre - 7) / 15 : c.alvoV;
        c.v += clamp(alvo - c.v, -9 * dt, 3 * dt); c.pos.x += c.v * dir * dt; c.pos.z = c.faixa.z;
        if (c.pos.x * dir > 420) c.pos.x -= 840 * dir;
      } else if (c !== st.carro) c.v = 0;
      posCarro(c, dt);
    }
  }
  /* ---------- efeitos de velocidade ---------- */
  let rastro = null, anel = null, boom = 0, tremor = 0; const trilha = [];
  function efeitos(dt) {
    const voo = st.estado === 'voando', sp = voo ? st.vel.length() : 0;
    if (!rastro) {
      /* rastro: fita atrás do corpo, afinando até sumir */
      const n = 48; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
      const idx = []; for (let i = 0; i < n - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } g.setIndex(idx);
      rastro = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xdff1ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending })); rastro.frustumCulled = false; grupo.add(rastro);
      anel = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false })); anel.visible = false; grupo.add(anel);
    }
    /* rastro */
    trilha.unshift(st.pos.clone().add(new THREE.Vector3(0, 0.9, 0))); if (trilha.length > 48) trilha.length = 48;
    const forca = clamp((sp - 18) / 25, 0, 1); rastro.material.opacity += (forca * 0.4 - rastro.material.opacity) * Math.min(1, dt * 4); rastro.visible = rastro.material.opacity > 0.01;
    if (rastro.visible) {
      const a = rastro.geometry.attributes.position.array, cv = new THREE.Vector3().subVectors(camera.position, st.pos).normalize();
      for (let i = 0; i < 48; i++) {
        const p = trilha[Math.min(i + 3, trilha.length - 1)], q = trilha[Math.min(i + 4, trilha.length - 1)]; const t = new THREE.Vector3().subVectors(p, q); if (t.lengthSq() < 1e-6) t.set(0, 0, 1);
        const lado = new THREE.Vector3().crossVectors(t, cv).normalize().multiplyScalar(0.16 * Math.sin(Math.PI * Math.min(1, (i + 1) / 10)) * (1 - i / 48));
        a.set([p.x + lado.x, p.y + lado.y, p.z + lado.z, p.x - lado.x, p.y - lado.y, p.z - lado.z], i * 6);
      }
      rastro.geometry.attributes.position.needsUpdate = true;
    }
    /* estrondo ao passar de 45 m/s: anel que cresce em volta e tremida na câmera */
    if (voo && sp > 38 && !st.sonico) { st.sonico = true; boom = 1; anel.position.copy(st.pos).add(new THREE.Vector3(0, 0.9, 0)); anel.lookAt(anel.position.clone().add(st.vel)); anel.visible = true; tremor = 0.6; }
    if (sp < 30) st.sonico = false;
    if (boom > 0) { boom = Math.max(0, boom - dt * 1.6); const k = 1 - boom; anel.scale.setScalar(1 + k * 16); anel.material.opacity = boom * 0.8; anel.visible = boom > 0; }
    tremor = Math.max(clamp((sp - 34) / 30, 0, 1) * 0.1, tremor - dt * 1.5);
    /* bordas da tela riscadas pela velocidade */
    const borda = $('#p-veloz'); if (borda) borda.style.opacity = String(clamp((sp - 22) / 35, 0, 0.85));
  }
  function tickVento(dt) {
    if (!ventos) return; const v = st.estado === 'voando' ? st.vel : new THREE.Vector3(); const sp = v.length();
    ventos.material.opacity += (clamp((sp - 8) / 16, 0, 0.75) - ventos.material.opacity) * Math.min(1, dt * 4); ventos.visible = ventos.material.opacity > 0.01; if (!ventos.visible) return;
    const p = ventos.geometry.attributes.position.array, dir = v.clone().normalize(), L = Math.min(9, sp * 0.13);
    ventos.userData.base.forEach((b, i) => {
      b.addScaledVector(v, -dt * (sp > 30 ? 1.1 : 1.6)); ['x', 'y', 'z'].forEach((k) => { const m = k === 'y' ? 4.5 : 9; if (b[k] < -m) b[k] += 2 * m; if (b[k] > m) b[k] -= 2 * m; });
      const a = b.clone().add(st.pos).add(new THREE.Vector3(0, 1, 0)); p.set([a.x, a.y, a.z, a.x - dir.x * L, a.y - dir.y * L, a.z - dir.z * L], i * 6);
    });
    ventos.geometry.attributes.position.needsUpdate = true;
  }
  function tickCamera(dt) {
    const voo = st.estado === 'voando', sp = voo ? st.vel.length() : 0;
    /* transição entre terceira e primeira pessoa: a câmera mergulha até os olhos (e sai deles) sem corte */
    const eraFp = cam.fp; cam.fp = clamp(cam.fp + (querFp() ? dt / 0.75 : -dt / 0.6), 0, 1); const e = cam.fp * cam.fp * (3 - 2 * cam.fp);
    if (querFp() && eraFp === 0) cam.pitch0 = cam.pitch;
    /* ao entrar, o olhar sobe para o horizonte; ao sair, volta para a inclinação de antes (se a pessoa não mexeu) */
    const mexeu = cam.livre && performance.now() - cam.livre < 900;
    if (!mexeu && cam.fp > 0 && cam.fp < 1) { const alvoP = querFp() ? 0.04 : cam.pitch0 ?? 0.32; cam.pitch += (alvoP - cam.pitch) * Math.min(1, dt * 5); }
    const hz = Math.hypot(st.vel.x, st.vel.z);
    /* balanço de quem anda: sobe e desce a cada passo, com um leve vaivém para os lados */
    cam.bobAmp += ((st.noChao && st.estado === 'andar' ? Math.min(1, hz / 4) : 0) - cam.bobAmp) * Math.min(1, dt * 8); cam.bob += hz * dt * 1.75;
    const alturaOlho = (st.estado === 'dirigindo' ? 1.6 : voo ? 1.1 : 1.45) * (1 - e) + 1.62 * e;
    const alvo = st.pos.clone().add(new THREE.Vector3(0, alturaOlho, 0));
    if (e > 0.98) cam.alvo.copy(alvo); else cam.alvo.lerp(alvo, Math.min(1, dt * (voo ? 6 : 10 + 20 * e)));
    /* atrás de quem anda, dirige ou voa, quando ninguém está girando a câmera (no computador, o mouse manda) */
    const solto = !desktop && cam.fp === 0 && (!cam.livre || performance.now() - cam.livre > 2500); const mov = st.estado === 'dirigindo' ? Math.abs(st.carro.v) > 1 : hz > 1;
    if ((solto || (voo && !desktop && performance.now() - (cam.livre || 0) > 1200)) && mov) cam.yaw = ang(cam.yaw + ang(st.h + Math.PI - cam.yaw) * Math.min(1, dt * (st.estado === 'dirigindo' ? 3 : voo ? 1.6 : 1.2)));
    let dist = st.estado === 'dirigindo' ? Math.max(cam.dist, 8.5) : voo ? cam.dist + 1.5 + Math.min(10, sp * 0.16) : cam.dist;
    let pitch = cam.pitch; if (st.dentro && !cam.fpLigada) { pitch = Math.max(pitch, 0.95); dist = Math.max(dist, 7.5); }
    /* tela em pé (celular): a lente pega menos para os lados, então a câmera recua para a pessoa não encher a tela */
    if (camera.aspect < 1) dist *= 1 + 0.35 * Math.min(1, (1 - camera.aspect) * 2);
    const dir = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(cam.yaw) * Math.cos(pitch));
    const p = dir.clone().multiplyScalar(dist * (1 - e)).add(cam.alvo);
    if (e < 0.02) p.y = Math.max(p.y, fis.terreno(p.x, p.z) + 0.6);
    if (e > 0) { const lado = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); p.y += Math.sin(cam.bob * 2) * 0.032 * cam.bobAmp * e; p.addScaledVector(lado, Math.cos(cam.bob) * 0.018 * cam.bobAmp * e); }
    if (tremor > 0.001) p.add(new THREE.Vector3((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor));
    const olha = p.clone().sub(dir); // o olhar é sempre o oposto do braço da câmera: igual nas duas visões
    camera.position.copy(p); controls.target.copy(e > 0.5 ? olha : cam.alvo);
    /* lente: abre com a velocidade no voo; pelos olhos, mais aberta (e um pouco mais correndo) */
    const fov = voo ? 38 + Math.min(36, sp * 0.55) : 38 + e * (26 + Math.min(6, Math.max(0, hz - 4) * 2)); cam.fov += (fov - cam.fov) * Math.min(1, dt * (e > 0 ? 8 : 3));
    /* pelos olhos o plano próximo vem para perto e o distante encurta: com 0,12 m a 4 km a profundidade perdia precisão e
       superfícies vizinhas piscavam */
    const perto = e > 0.25 ? 0.15 : 2, longe = e > 0.25 ? 900 : 4000; if (Math.abs(camera.fov - cam.fov) > 0.01 || camera.near !== perto) { camera.fov = cam.fov; camera.near = perto; camera.far = longe; camera.updateProjectionMatrix(); }
    /* dentro do bloco: a luz fica acima da pessoa (mais forte à noite) */
    luzDentro.position.set(st.pos.x, st.pos.y + 2.5, st.pos.z); luzDentro.intensity += ((st.dentro ? (st.noite ? 11 : 7) : 0) - luzDentro.intensity) * Math.min(1, dt * 4);
    /* o corpo some quando a câmera chega nele */
    if (boneco) boneco.visible = e < 0.72;
    const f = dir.clone().negate(); const r = voo ? -cam.rolo * 0.35 : 0;
    camera.up.set(0, 1, 0).applyAxisAngle(f, r); camera.lookAt(olha);
  }
  function tick(now) {
    if (!ativo || !boneco) return false;
    const dt = Math.min(0.05, Math.max(0.001, (now - (ultimo || now)) / 1000)); ultimo = now;
    tickTransito(dt); tickBoneco(dt); tickVento(dt); efeitos(dt); tickCamera(dt);
    renderer.shadowMap.needsUpdate = true; return true;
  }

  /* ---------- liga e desliga ---------- */
  async function ligar(opcoes = {}) {
    if (ativo) return; ativo = true; controls.enabled = false; ultimo = 0; aviso = opcoes.aviso || null;
    document.body.classList.toggle('pc', desktop);
    addEventListener('keydown', onDown); addEventListener('keyup', onUp);
    if (!pronto) { pronto = carregar().then(() => { fis = criarColisao({ chao, partes, principal }); moveis = criarMoveis({ portas: principal.portas, cones, fis }); montarHud(); }); }
    try { await pronto; } catch (e) { console.error(e); ativo = false; controls.enabled = true; throw e; }
    if (!ativo) return;
    /* começa logo depois do portão de pedestres, de frente para a passarela */
    if (!st.iniciou) { st.iniciou = true; st.pos.set(13.3, 0, 37.5); st.pos.y = fis.alturaEm(st, st.pos.x, st.pos.z); st.h = Math.PI; cam.yaw = 0; cam.alvo.copy(st.pos); anim('idle'); }
    grupo.visible = true; marcarVoo(); pedir();
  }
  function desligar() {
    if (!ativo) return; ativo = false; teclas.clear(); grupo.visible = false; controls.enabled = true; principal.destampar(-1, null, 9); setCorte(99); corte = 99;
    if (document.pointerLockElement) document.exitPointerLock?.(); { const b = $('#p-veloz'); if (b) b.style.opacity = '0'; } if (rastro) rastro.visible = false; st.turbo = 0; document.body.classList.remove('voando', 'pc', 'mouse-preso');
    camera.up.set(0, 1, 0); camera.fov = 38; camera.near = 2; camera.far = 4000; luzDentro.intensity = 0; camera.updateProjectionMatrix(); cam.fov = 38; cam.fp = 0; if (boneco) boneco.visible = true;
    removeEventListener('keydown', onDown); removeEventListener('keyup', onUp); controls.update(); pedir();
  }
  return { ligar, desligar, tick, setFoto, ativo: () => ativo, estado: () => st, carros, cam, fis: () => fis, AJ };
}
