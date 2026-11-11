import { criarInterior } from './interior.js';
import { criarEstilo } from './estilo.js';
import { iniciarInterface } from './interface.js';
/* Modelo 3D novo do campus (WebGL, three.js). Bancada de trabalho: fica separada do protótipo até ser aprovada. */
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { criarTexturas, criarMateriais, setAniso, DESAT, desaturavel } from './texturas.js';
import { criarViagem } from './viagem.js';
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
const campus = new THREE.Group();campus.name="campus-exterior";scene.add(campus);
const interior=criarInterior();scene.add(interior.grupo);
const estilo=criarEstilo(campus,scene);
const camera = new THREE.PerspectiveCamera(38, 1, 2, 4000);
const controls = new MapControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.12; controls.maxPolarAngle = 1.45; controls.minDistance = 6; controls.maxDistance = 1100; controls.zoomToCursor = true;

/* luz */
const ceu = new THREE.HemisphereLight(0xdfeeff, 0x9a8f78, 1.05); scene.add(ceu);
const sol = new THREE.DirectionalLight(0xfff2dc, 2.1); sol.castShadow = false;
sol.shadow.mapSize.set(movel ? 2048 : 4096, movel ? 2048 : 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
const sc = sol.shadow.camera; sc.left = -200; sc.right = 130; sc.top = 170; sc.bottom = -330; sc.near = 10; sc.far = 1200;
scene.add(sol); scene.add(sol.target);

let principal = null; let interfaceMapa = null;
function hora(h) {
  sol.position.set(-90,220,150);sol.target.position.set(-10,0,-30);sol.color.set(0xffffff);sol.intensity=.9;
  ceu.intensity=1.65;ceu.color.set(0xffffff);ceu.groundColor.set(0xc4cee5);
  estilo.setMode(estilo.mode());
  renderer.shadowMap.needsUpdate=true;pedir();
}

const T = criarTexturas(); const M = criarMateriais(T); materiaisPrincipal(M, T);
let pedido = false, quadros = 0, soma = 0, anterior = 0;
/* cena */

const t0 = performance.now();
campus.add(construirTerreno(M));
const gPredios = new THREE.Group();gPredios.name='predios';
BUILDINGS.filter(b=>b.id!=='principal').forEach(b=>{const g=new THREE.Group();g.name=b.id;g.userData.event=b.id==='cantina'?'mel':null;const L=new Lote();construirPredios(L,q=>q.id===b.id,false);L.build(g,M,{name:b.id});gPredios.add(g);});
campus.add(gPredios);
principal = construirPrincipal(M); principal.grupo.userData.event='verde';['casca','tetos-baixos'].forEach(n=>{const g=principal.grupo.getObjectByName(n);if(g)g.userData.event='azul';});campus.add(principal.grupo);
/* o bloco já tem os materiais dele; os que sobraram, de todo o resto, podem perder a cor */
// A paleta do experimento é controlada por edifício em estilo.js.
const det = construirDetalhes(M); campus.add(det.grupo);
const veg = construirVegetacao(M, { vasos: principal.vasos, flores: det.flores, pronto: () => { estilo.prepare(); renderer.shadowMap.needsUpdate = true; pedir(); } }); campus.add(veg);
const entorno = construirEntorno(M, () => {estilo.prepare();pedir();}); campus.add(entorno);
scene.fog = new THREE.Fog(0xbcd9f2, 500, 3600);
scene.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) o.updateMatrix(); });
estilo.prepare();
const tMontagem = Math.round(performance.now() - t0);

/* câmera: guarda a vista entre recargas, para acompanhar a construção sem perder o lugar */
const VISTAS = {
  campus: { p: [100, 155, 195], t: [-25, 0, -37] },
  bloco: { p: [42, 52, 46], t: [-8, 3, -30] },
  patio: { p: [-52, 26, -4], t: [-8, 5, -30] },
  entrada: { p: [13.5, 3.2, 62], t: [12, 4, 0] },
};
function irPara(v) { camera.position.set(...v.p); controls.target.set(...v.t); controls.update(); pedir(); }
try { const s = JSON.parse(sessionStorage.getItem('mapa-cartoon-cam')); if (s) irPara(s); else irPara(VISTAS.campus); } catch { irPara(VISTAS.campus); }
controls.addEventListener('change', () => { pedir(); clearTimeout(irPara.t); irPara.t = setTimeout(() => sessionStorage.setItem('mapa-cartoon-cam', JSON.stringify({ p: camera.position.toArray(), t: controls.target.toArray() })), 300); });

/* desenha só quando algo muda */
function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
function quadro(now) {
  pedido = false; const viajando = viagem.tick(now); const mexeu = viajando ? false : controls.update();
  renderer.render(scene, camera);
  /* Só mede enquanto a câmera se move: parado, o mapa não gasta bateria desenhando. */
  if (now - anterior < 100) { soma += now - anterior; quadros++; if (quadros >= 20) { $('#fps').textContent = Math.round((quadros * 1000) / soma) + ' fps'; quadros = 0; soma = 0; } }
  anterior = now;
  viagem.posicionarFicha(canvas.clientWidth, canvas.clientHeight);
  interfaceMapa?.quadro(now);
  if (mexeu || viajando) pedir();
}
function tamanho() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); pedir(); }
addEventListener('resize', tamanho); tamanho();

/* painel */
const estado = { nivel: sessionStorage.getItem('mapa-cartoon-nivel') || 'tudo', hora: +(sessionStorage.getItem('mapa-cartoon-hora') || 15) };
function nivel(n, soMarca) {
  estado.nivel = n; sessionStorage.setItem('mapa-cartoon-nivel', n); if (!soMarca) principal.mostrar(n === 'tudo' ? 'tudo' : +n);
  document.querySelectorAll('[data-nivel]').forEach((b) => b.classList.toggle('on', b.dataset.nivel === String(n)));
  renderer.shadowMap.needsUpdate = true; pedir();
}
const viagem = criarViagem({ scene, camera, controls, principal, interior, estilo, desat: DESAT, pedir, sombras: () => { renderer.shadowMap.needsUpdate = true; }, ficha: $('#ficha'), passos: $('#passos'), aoNivel: (n, soMarca) => nivel(n, soMarca) });
// Gestos de exploração não pulam a apresentação; há um botão explícito para isso.
document.querySelectorAll('[data-rota]').forEach((b) => b.addEventListener('click', () => { const [l, z] = b.dataset.rota.split(':'); if (z) viagem.ir(+l, z, { forcar: b.dataset.via || null }); else viagem.limpar(); }));
document.querySelectorAll('[data-nivel]').forEach((b) => b.addEventListener('click', () => { if (viagem.ativa()) viagem.limpar(); nivel(b.dataset.nivel); }));
document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => irPara(VISTAS[b.dataset.vista])));
document.querySelectorAll('[data-camada]').forEach((b) => b.addEventListener('change', () => {
  const alvo = { arvores: veg, detalhes: det.grupo, predios: gPredios }[b.dataset.camada]; if (alvo) alvo.visible = b.checked;
  if (b.dataset.camada === 'sombras') { sol.castShadow = b.checked; }
  renderer.shadowMap.needsUpdate = true; pedir();
}));
const hr = $('#hora'); hr.value = estado.hora; hr.addEventListener('input', () => { estado.hora = +hr.value; sessionStorage.setItem('mapa-cartoon-hora', hr.value); $('#horaTxt').textContent = String(Math.floor(estado.hora)).padStart(2, '0') + 'h' + (estado.hora % 1 ? '30' : '00'); hora(estado.hora); });
hr.dispatchEvent(new Event('input')); nivel(estado.nivel);
$('#info').textContent = `${tris(scene).toLocaleString('pt-BR')} triângulos · ${renderer.info.memory.geometries || ''} · montado em ${tMontagem} ms`;
requestAnimationFrame(() => { const i = renderer.info; $('#info').textContent = `${tris(scene).toLocaleString('pt-BR')} triângulos · ${i.render.calls} chamadas · montado em ${tMontagem} ms`; });
window.MAPA3D = { interior, estilo, viagem, scene, camera, controls, renderer, irPara, VISTAS, nivel, hora, M, T };

interfaceMapa = iniciarInterface({scene,camera,controls,renderer,principal,interior,estilo,viagem,veg,entorno,sol,DESAT,pedir,nivel,hora,irPara,VISTAS});
window.MAPA3D.interface = interfaceMapa;
window.MAPA3D.ready = true;
