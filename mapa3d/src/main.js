import { iniciarInterface } from './interface.js';
/* Modelo 3D novo do campus (WebGL, three.js). Bancada de trabalho: fica separada do protótipo até ser aprovada. */
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { criarTexturas, criarMateriais, setAniso, desaturavel, ISO, FUNDO } from './texturas.js';
import { criarEstilo } from './estilo.js';
import { criarInterior } from './interior.js';
import { criarPalco } from './palco.js';
import { daCamera } from './camera.js';
import { criarViagem } from './viagem.js';
import { criarAbertura } from './abertura.js';
import { criarPasseio } from './passeio.js';
import { construirTerreno } from './terreno.js';
import { construirPredios } from './predios.js';
import { construirPrincipal, materiaisPrincipal } from './principal.js';
import { construirDetalhes } from './detalhes.js';
import { construirVegetacao } from './vegetacao.js';
import { construirEntorno } from './entorno.js';
import { Lote, tris } from './geo.js';
import { sunAt, NORTH, EAST, BUILDINGS } from './dados.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#tela');
const movel = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, movel ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.NoToneMapping; renderer.localClippingEnabled = true;
setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 2, 4000);
const controls = new MapControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.12; controls.maxPolarAngle = 1.45; controls.minDistance = 6; controls.maxDistance = 1100; controls.zoomToCursor = true;

/* luz */
const ceu = new THREE.HemisphereLight(0xdfeeff, 0x9a8f78, 1.05); scene.add(ceu);
const sol = new THREE.DirectionalLight(0xfff2dc, 2.1); sol.castShadow = true;
sol.shadow.mapSize.set(movel ? 2048 : 4096, movel ? 2048 : 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
const sc = sol.shadow.camera; sc.left = -200; sc.right = 130; sc.top = 170; sc.bottom = -330; sc.near = 10; sc.far = 1200;
scene.add(sol); scene.add(sol.target);

let principal = null; let interfaceMapa = null; let abertura = null;
/* o céu também clareia quando o bloco se isola */
const ceuBase = new THREE.Color(0xbcd9f2);
function fundoCeu() { scene.background = ceuBase.clone().lerp(FUNDO.value, ISO.value * 0.9); if (scene.fog) scene.fog.color.copy(scene.background); }
function hora(h) {
  const { el, az } = sunAt(h); const e = Math.max(4, el) * Math.PI / 180, a = az * Math.PI / 180;
  /* azimute a partir do norte do levantamento, no sentido horário */
  const dx = NORTH[0] * Math.cos(a) + EAST[0] * Math.sin(a), dy = NORTH[1] * Math.cos(a) + EAST[1] * Math.sin(a);
  sol.position.set(-40 + dx * Math.cos(e) * 600, Math.sin(e) * 600, -80 + dy * Math.cos(e) * 600); sol.target.position.set(-40, 0, -80);
  const noite = THREE.MathUtils.clamp((6 - el) / 12, 0, 1), baixo = THREE.MathUtils.clamp(1 - el / 25, 0, 1);
  sol.intensity = 2.1 * (1 - noite); sol.color.setHSL(0.09 + 0.02 * (1 - baixo), 0.9 * baixo + 0.25, 0.9 - 0.2 * baixo);
  /* noite: luar azulado e fraco, vindo do alto, para o campus continuar legível; janelas acesas e poças dos postes */
  if (noite > 0.98) { sol.position.set(-140, 420, 60); sol.color.set(0x8ea6d8); sol.intensity = 0.42; }
  ceu.intensity = 1.05 - 0.55 * noite; ceu.color.set(0xdfeeff).lerp(new THREE.Color(0x6f86b8), noite); ceu.groundColor.set(0x9a8f78).lerp(new THREE.Color(0x2a2f3c), noite);
  M.vidroAceso.emissiveIntensity = noite * 1.15; M.poca.opacity = noite * 0.85; if (principal) principal.acesos.forEach((m) => { m.emissiveIntensity = noite * 1.15; });
  M.globo.color.set(0xfbfbf6).lerp(new THREE.Color(0xffe2a8), noite);
  const dia = new THREE.Color(0xbcd9f2), tarde = new THREE.Color(0xf0c9a0), esc = new THREE.Color(0x0e1626);
  ceuBase.copy(dia).lerp(tarde, baixo * (1 - noite)).lerp(esc, noite); fundoCeu();
  renderer.shadowMap.needsUpdate = true; pedir();
}

const T = criarTexturas(); const M = criarMateriais(T); materiaisPrincipal(M, T);
let pedido = false, quadros = 0, soma = 0, anterior = 0;
const estilo = criarEstilo();

/* cena */
const t0 = performance.now();
const terreno = construirTerreno(M); scene.add(terreno);
/* um grupo por prédio: a cantina precisa de materiais só dela para receber a cor do evento */
const gPredios = new THREE.Group(); gPredios.name = 'predios';
BUILDINGS.filter((b) => b.id !== 'principal').forEach((b, i) => { const g = new THREE.Group(); g.name = b.id; const L = new Lote(); construirPredios(L, (q) => q.id === b.id, i === 0); L.build(g, M, { name: b.id }); gPredios.add(g); });
scene.add(gPredios);
principal = construirPrincipal(M); scene.add(principal.grupo);
const det = construirDetalhes(M); scene.add(det.grupo);
/* partes do evento: véu de cor por cima do material real (o bloco já tem materiais próprios) */
['casca', 'tetos-baixos'].forEach((n) => estilo.destacar(principal.grupo.getObjectByName(n), 'azul', { clonar: false, isolado: true }));
principal.grupo.children.filter((g) => !['casca', 'tetos-baixos'].includes(g.name)).forEach((g) => estilo.destacar(g, 'verde', { clonar: false, isolado: true }));
estilo.destacar(gPredios.getObjectByName('cantina'), 'laranja');
estilo.destacar(det.grupo.getObjectByName('patio'), 'patio');
/* o resto do campus pode perder a cor e desbotar */
Object.values(M).forEach((m) => { if (m !== M.poca) desaturavel(m); });
const veg = construirVegetacao(M, { vasos: principal.vasos, flores: det.flores, pronto: () => { renderer.shadowMap.needsUpdate = true; pedir(); } }); scene.add(veg);
const entorno = construirEntorno(M, () => pedir()); scene.add(entorno);
const interior = criarInterior(); scene.add(interior.grupo); interior.grupo.traverse((o) => o.layers.set(1));
ceu.layers.enable(1); sol.layers.enable(1);
scene.fog = new THREE.Fog(0xbcd9f2, 500, 3600);
scene.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.matrixAutoUpdate === false && o.parent !== interior.grupo) o.updateMatrix(); });
const tMontagem = Math.round(performance.now() - t0);

const VISTAS = {
  campus: { p: [150, 190, 210], t: [-40, 0, -60] },
  evento: { p: [62, 105, 120], t: [-12, 0, -22] },
  bloco: { p: [42, 52, 46], t: [-8, 3, -30] },
};
function irPara(v) { camera.position.set(...v.p); controls.target.set(...v.t); controls.update(); pedir(); }
try { const s = JSON.parse(sessionStorage.getItem('mapa3d-cam')); if (s && !new URLSearchParams(location.search).has('aba')) irPara(s); else irPara(VISTAS.evento); } catch { irPara(VISTAS.evento); }
controls.addEventListener('change', () => { pedir(); clearTimeout(irPara.t); irPara.t = setTimeout(() => sessionStorage.setItem('mapa3d-cam', JSON.stringify({ p: camera.position.toArray(), t: controls.target.toArray() })), 300); });

const palco = criarPalco({ principal, interior, estilo, camera, controls, pedir });
const passeio = criarPasseio({ scene, camera, controls, renderer, chao: terreno, pedir });
const viagem = criarViagem({ scene, camera, controls, interior, palco, pedir, ficha: $('#ficha'), passos: $('#passos') });

/* desenha só quando algo muda */
let isoAntes = -1;
function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
function quadro(now) {
  pedido = false; const passeando = passeio.tick(now); const viajando = !passeando && viagem.tick(now); const abrindo = !viajando && !!abertura?.tick(now); const animando = !viajando && !abrindo && palco.tick(now); const mexeu = passeando || viajando || animando || abrindo ? false : controls.update();
  if (ISO.value !== isoAntes) { isoAntes = ISO.value; fundoCeu(); }
  interior.virar(daCamera(camera, controls).a);
  /* Com o bloco aberto, a maquete e a rota são desenhadas numa segunda passada, por cima do campus desbotado:
     árvores e prédios de trás não atravessam os andares (que ficam afastados em escada, por cima do terreno). */
  const sobre = palco.estado().abre > 0.05;
  viagem.camada(sobre ? 1 : 0);
  /* o bloco aberto vai junto para a segunda passada: árvores e prédios não atravessam os andares afastados */
  if (sobre !== quadro.sobre) { quadro.sobre = sobre; principal.grupo.traverse((o) => o.layers.set(sobre ? 1 : 0)); }
  camera.layers.set(0); renderer.autoClear = true; renderer.render(scene, camera);
  if (sobre) { const bg = scene.background; scene.background = null; renderer.autoClear = false; renderer.clearDepth(); camera.layers.set(1); renderer.render(scene, camera); camera.layers.set(0); renderer.autoClear = true; scene.background = bg; }
  if (now - anterior < 100) { soma += now - anterior; quadros++; if (quadros >= 20) { $('#fps').textContent = Math.round((quadros * 1000) / soma) + ' fps'; quadros = 0; soma = 0; } }
  anterior = now;
  viagem.posicionarFicha(canvas.clientWidth, canvas.clientHeight);
  interfaceMapa?.quadro(now);
  if (mexeu || viajando || animando || abrindo || passeando) pedir();
}
function tamanho() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); pedir(); }
addEventListener('resize', tamanho); tamanho();

const hr = $('#hora'); hr.addEventListener('input', () => { const h = +hr.value; sessionStorage.setItem('mapa3d-hora', hr.value); $('#horaTxt').textContent = String(Math.floor(h)).padStart(2, '0') + 'h' + (h % 1 ? '30' : '00'); hora(h); });
hr.value = sessionStorage.getItem('mapa3d-hora') || 15; hr.dispatchEvent(new Event('input'));
requestAnimationFrame(() => { const i = renderer.info; $('#info').textContent = `${tris(scene).toLocaleString('pt-BR')} triângulos · ${i.render.calls} chamadas · montado em ${tMontagem} ms`; });
window.MAPA3D = { passeio, viagem, palco, interior, estilo, principal, scene, camera, controls, renderer, irPara, VISTAS, hora, M, T };
interfaceMapa = iniciarInterface({ scene, camera, controls, renderer, principal, interior, palco, estilo, viagem, passeio, veg, entorno, sol, pedir, hora, irPara, VISTAS });
window.MAPA3D.interface = interfaceMapa;
/* abertura: o bloco principal (verde e azul), a cantina, o pátio e o obelisco sobem do chão com a cor do evento */
abertura = criarAbertura({ camera, controls, renderer, pedir, fim: () => interfaceMapa.poseEvento(), ocupado: () => viagem.ativa(), aoTerminar: () => estilo.setMode(estilo.mode()),
  partes: [{ grupo: principal.grupo, cores: ['verde', 'azul'] }, { grupo: gPredios.getObjectByName('cantina'), cores: ['laranja'] }, { grupo: det.grupo.getObjectByName('patio'), cores: ['patio'] }, { grupo: det.grupo.getObjectByName('obelisco'), cores: [] }] });
window.MAPA3D.abertura = abertura;
palco.parar(); abertura.rodar();
window.MAPA3D.ready = true;
