import { iniciarInterface } from './interface.js';
/* Modelo 3D novo do campus (WebGL, three.js). Bancada de trabalho: fica separada do protótipo até ser aprovada. */
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { criarTexturas, criarMateriais, setAniso, desaturavel, ISO, FUNDO } from './texturas.js';
import { criarEstilo } from './estilo.js';
import { CART, ESC } from './cartum.js';
import { criarContornos } from './contornos.js';
import { criarGestos } from './gestos.js';
import { criarInterior } from './interior.js';
import { criarPalco } from './palco.js';
import { daCamera } from './camera.js';
import { criarViagem } from './viagem.js';
import { criarAbertura } from './abertura.js';
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
controls.enableDamping = true; controls.dampingFactor = movel ? 0.09 : 0.12; controls.maxPolarAngle = 1.45; controls.minDistance = 6; controls.maxDistance = 900; controls.zoomToCursor = true;

/* luz */
const ceu = new THREE.HemisphereLight(0xdfeeff, 0x9a8f78, 1.05); scene.add(ceu);
const sol = new THREE.DirectionalLight(0xfff2dc, 2.1); sol.castShadow = true;
sol.shadow.mapSize.set(movel ? 2048 : 4096, movel ? 2048 : 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
const sc = sol.shadow.camera; sc.left = -200; sc.right = 130; sc.top = 170; sc.bottom = -330; sc.near = 10; sc.far = 1200;
scene.add(sol); scene.add(sol.target);

let principal = null; let interfaceMapa = null; let abertura = null;
let pronta = false; // a cena é montada em etapas; antes do fim não há o que desenhar
/* o céu também clareia quando o bloco se isola */
const ceuBase = new THREE.Color(0xbcd9f2);
function fundoCeu() { scene.background = ceuBase.clone().lerp(FUNDO.value, ISO.value * 0.9); if (scene.fog) scene.fog.color.copy(scene.background); }
/* Luz pelo horário (modo Campus) misturada com a luz do mapa ilustrado (modo Evento: sempre de dia, clara e suave,
   sem noite), pelo mesmo CART que troca as cores. */
let horaAtual = 12;
const CARTUM_LUZ = { ceu: 2.1, sol: 1.35, fundo: new THREE.Color(0xeef2f6), chao: new THREE.Color(0xd6d2c6) };
/* fundo do mapa ilustrado escuro: ardósia de dia, quase preto à noite */
const ESC_FUNDO = { dia: new THREE.Color(0x1c2738), noite: new THREE.Color(0x090e18) };
/* No mapa ilustrado escuro, um selo diz se é dia ou noite (e a hora), além da luz */
const selo = document.createElement('div'); selo.id = 'ceu-selo'; selo.hidden = true; selo.setAttribute('aria-live', 'polite'); document.body.append(selo);
const SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
const LUA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
function seloCeu(h, noite, baixo, ke) {
  selo.hidden = ke < 0.5; if (selo.hidden) return;
  const hh = String(Math.floor(h)).padStart(2, '0') + 'h' + (h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '');
  const nome = noite > 0.6 ? 'Noite' : baixo > 0.6 ? (h < 12 ? 'Amanhecer' : 'Entardecer') : 'Dia';
  selo.className = noite > 0.6 ? 'noite' : 'dia'; selo.innerHTML = `${noite > 0.6 ? LUA : SOL}<span>${nome} · ${hh}</span>`;
}
function posSol(h, alvo) {
  const { el, az } = sunAt(h); const e = Math.max(4, el) * Math.PI / 180, a = az * Math.PI / 180;
  /* azimute a partir do norte do levantamento, no sentido horário */
  const dx = NORTH[0] * Math.cos(a) + EAST[0] * Math.sin(a), dy = NORTH[1] * Math.cos(a) + EAST[1] * Math.sin(a);
  return alvo.set(-40 + dx * Math.cos(e) * 600, Math.sin(e) * 600, -80 + dy * Math.cos(e) * 600);
}
const _p = new THREE.Vector3();
function hora(h = horaAtual) {
  horaAtual = h; const k = CART.value, es = ESC.value;
  /* kc: luz fixa de dia (ilustrado claro); ke: ilustrado escuro, em que a luz segue o horário para se ver dia e noite */
  const kc = k * (1 - es), ke = k * es;
  const { el } = sunAt(h); posSol(h, sol.position); sol.target.position.set(-40, 0, -80);
  const noite0 = THREE.MathUtils.clamp((6 - el) / 12, 0, 1), baixo0 = THREE.MathUtils.clamp(1 - el / 25, 0, 1);
  const noite = noite0 * (1 - kc), baixo = baixo0 * (1 - k);
  sol.intensity = 2.1 * (1 - noite0); sol.color.setHSL(0.09 + 0.02 * (1 - baixo0), 0.9 * baixo0 + 0.25, 0.9 - 0.2 * baixo0);
  /* noite: luar azulado e fraco, vindo do alto, para o campus continuar legível; janelas acesas e poças dos postes */
  if (noite0 > 0.98) { sol.position.set(-140, 420, 60); sol.color.set(0x8ea6d8); sol.intensity = 0.42; }
  ceu.intensity = 1.05 - 0.55 * noite0; ceu.color.set(0xdfeeff).lerp(new THREE.Color(0x6f86b8), noite0); ceu.groundColor.set(0x9a8f78).lerp(new THREE.Color(0x2a2f3c), noite0);
  if (ke > 0) {
    /* ilustrado escuro: de dia, sol forte e sombras marcadas; à noite, luar e o céu mais fraco (janelas e postes acesos) */
    sol.intensity += (THREE.MathUtils.lerp(2.3, 0.75, noite0) - sol.intensity) * ke;
    ceu.intensity += (THREE.MathUtils.lerp(1.15, 1.35, noite0) - ceu.intensity) * ke; ceu.groundColor.lerp(new THREE.Color(0x3a3f4c), ke);
  }
  if (kc > 0) {
    /* ilustrado: sol da manhã, que deixa as fachadas da frente claras e as laterais um tom abaixo */
    sol.position.lerp(posSol(10, _p), kc); sol.intensity += (CARTUM_LUZ.sol - sol.intensity) * kc; sol.color.lerp(new THREE.Color(0xffffff), kc);
    ceu.intensity += (CARTUM_LUZ.ceu - ceu.intensity) * kc; ceu.color.lerp(new THREE.Color(0xffffff), kc); ceu.groundColor.lerp(CARTUM_LUZ.chao, kc);
  }
  seloCeu(h, noite0, baixo0, ke);
  /* cor para onde o campus esmaece quando o bloco se isola: clara no tema claro, ardósia no escuro */
  FUNDO.value.set(0xeef2f7).lerp(new THREE.Color(0x182131), es);
  M.vidroAceso.emissiveIntensity = noite * 1.15; M.poca.opacity = noite * 0.85; if (principal) principal.acesos.forEach((m) => { m.emissiveIntensity = noite * 1.15; }); if (principal) principal.luzes.forEach((m) => m.color.set(0xd6e9fb).lerp(new THREE.Color(0xf2c896), baixo * (1 - noite) * 0.7).lerp(new THREE.Color(0x101829), noite));
  M.globo.color.set(0xfbfbf6).lerp(new THREE.Color(0xffe2a8), noite);
  const dia = new THREE.Color(0xbcd9f2), tarde = new THREE.Color(0xf0c9a0), esc = new THREE.Color(0x0e1626);
  ceuBase.copy(dia).lerp(tarde, baixo0 * (1 - noite0)).lerp(esc, noite0).lerp(CARTUM_LUZ.fundo.clone().lerp(ESC_FUNDO.dia.clone().lerp(ESC_FUNDO.noite, noite0), es), k); fundoCeu();
  renderer.shadowMap.needsUpdate = true; pedir();
}

/* Carregamento: a cena é montada em etapas, com uma pausa entre elas para a barra andar na tela. */
const CARGA = (window.MAPA3D_CARGA = []);
const etapa = (texto, parte) => { CARGA.push([texto, Math.round(performance.now())]); const t = $('#carga-tx'), b = $('#carga-barra'); if (t) t.textContent = texto; if (b) b.style.width = Math.round(parte * 100) + '%'; return new Promise((ok) => setTimeout(ok, 40)); };
await etapa('Preparando as texturas…', 0.12);
const T = criarTexturas(); const M = criarMateriais(T); materiaisPrincipal(M, T);
/* cada material sabe o nome dele: o modo ilustrado do Evento (cartum.js) escolhe a cor pela categoria */
Object.entries(M).forEach(([k, m]) => { m.userData.chave = k; });
let pedido = false, quadros = 0, soma = 0, anterior = 0;
const estilo = criarEstilo({ aoMudar: () => hora() });
/* o tema vem do app (?tema= ou mensagem): o mapa ilustrado acompanha */
estilo.tema(document.documentElement.dataset.tema === 'escuro', 0);
new MutationObserver(() => estilo.tema(document.documentElement.dataset.tema === 'escuro')).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });

/* cena */
const t0 = performance.now();
await etapa('Abrindo o terreno…', 0.26);
const terreno = construirTerreno(M); scene.add(terreno);
await etapa('Levantando os prédios…', 0.4);
/* um grupo por prédio: a cantina precisa de materiais só dela para receber a cor do evento */
const gPredios = new THREE.Group(); gPredios.name = 'predios';
BUILDINGS.filter((b) => b.id !== 'principal').forEach((b, i) => { const g = new THREE.Group(); g.name = b.id; const L = new Lote(); construirPredios(L, (q) => q.id === b.id, i === 0); L.build(g, M, { name: b.id }); gPredios.add(g); });
scene.add(gPredios);
await etapa('Montando o bloco principal…', 0.55);
principal = construirPrincipal(M); scene.add(principal.grupo);
await etapa('Portaria, pátio e detalhes…', 0.7);
const det = construirDetalhes(M); scene.add(det.grupo);
/* partes do evento: véu de cor por cima do material real (o bloco já tem materiais próprios) */
['casca', 'tetos-baixos'].forEach((n) => estilo.destacar(principal.grupo.getObjectByName(n), 'azul', { clonar: false, isolado: true }));
principal.grupo.children.filter((g) => !['casca', 'tetos-baixos'].includes(g.name)).forEach((g) => estilo.destacar(g, 'verde', { clonar: false, isolado: true }));
estilo.destacar(gPredios.getObjectByName('cantina'), 'laranja');
estilo.destacar(det.grupo.getObjectByName('patio'), 'patio');
/* o resto do campus pode perder a cor e desbotar */
Object.values(M).forEach((m) => { if (m !== M.poca) desaturavel(m); });
/* contornos do mapa ilustrado (depois do shader, que diz a cor de cada parte) */
const contornos = criarContornos([gPredios, principal.grupo, det.grupo.getObjectByName('patio')]);
await etapa('Plantando as árvores…', 0.8);
const veg = construirVegetacao(M, { vasos: principal.vasos, vasosDentro: principal.vasosDentro, flores: det.flores, pronto: () => { renderer.shadowMap.needsUpdate = true; pedir(); } }); scene.add(veg);
/* O entorno (bairro, caatinga, serras) e o recheio do bloco (móveis, portas, cartazes) não entram no modo Evento,
   que é só o campus: são montados quando alguém abre o modo Campus ou o passeio (ou com o mapa já parado, sem pressa). */
const entorno = new THREE.Group(); entorno.name = 'entorno'; entorno.visible = false; scene.add(entorno);
let campusPronto = false, campusCarregando = null;
function montarCampus() {
  if (campusPronto) return; campusPronto = true;
  entorno.add(construirEntorno(M, () => pedir()));
  const novos = principal.detalhar(); novos.forEach((g) => estilo.destacar(g, 'verde', { clonar: false, isolado: true }));
  [entorno, ...novos].forEach((g) => g.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.matrixAutoUpdate === false) o.updateMatrix(); }));
  quadro.sobre = undefined; // a próxima passada acerta a camada do recheio
}
/* Compila só o que aparece. O bloco fica de fora: com planos de corte, o compile do three monta o programa errado (ele
   compila no primeiro quadro). */
const visiveis = (raiz) => ({ traverse: (f) => raiz.traverseVisible((o) => { if (!o.material?.clippingPlanes?.length) f(o); }), traverseVisible: () => {} });
/* compila os programas novos fora do quadro (em paralelo, onde a placa deixa) antes de mostrar */
async function prepararCampus() {
  return (campusCarregando ??= (async () => { montarCampus(); const sv = verCampus.on; verCampus(true, true); try { await renderer.compileAsync(visiveis(scene), camera, scene); } catch {} verCampus(sv, true); })());
}
function verCampus(on, quieto = false) { if (!quieto) verCampus.on = on; entorno.visible = on && campusPronto; principal.verDetalhes(on); veg.getObjectByName('vasos-dentro').visible = on && campusPronto; renderer.shadowMap.needsUpdate = true; pedir(); }
await etapa('Arrumando o entorno…', 0.9);
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
/* arrastando o mapa, o alvo da câmera não sai da região do campus e da rodovia (antes dava para se perder no vazio) */
const LIMITE = new THREE.Box3(new THREE.Vector3(-230, -5, -250), new THREE.Vector3(130, 40, 170)); const _alvo = new THREE.Vector3();
controls.addEventListener('change', () => { if (!LIMITE.containsPoint(controls.target)) { _alvo.copy(controls.target).clamp(LIMITE.min, LIMITE.max).sub(controls.target); controls.target.add(_alvo); camera.position.add(_alvo); } pedir(); clearTimeout(irPara.t); irPara.t = setTimeout(() => sessionStorage.setItem('mapa3d-cam', JSON.stringify({ p: camera.position.toArray(), t: controls.target.toArray() })), 300); });

const palco = criarPalco({ principal, interior, estilo, camera, controls, pedir });
const gestos = criarGestos({ camera, controls, canvas, pedir, soltar: () => palco.soltarCamera() });
/* computador (mouse, sem toque) abrindo o mapa direto: entra já no passeio, com o mouse na câmera */
const noPC = matchMedia('(pointer: fine)').matches && !matchMedia('(any-pointer: coarse)').matches;
/* Passeio: é um segredo (easter egg). O módulo dele (personagem, carros, física) só é baixado quando alguém o acha. */
let passeioReal = null, fotoPasseio = null;
const passeio = {
  tick: (now) => passeioReal?.tick(now) ?? false, ativo: () => passeioReal?.ativo() ?? false, desligar: () => passeioReal?.desligar(), estado: () => passeioReal?.estado(),
  setFoto: (uri, nome) => { fotoPasseio = [uri, nome]; passeioReal?.setFoto(uri, nome); },
  async ligar(op) {
    if (!passeioReal) {
      await prepararCampus(); verCampus(true);
      const { criarPasseio } = await import('./passeio.js');
      passeioReal ??= criarPasseio({ scene, camera, controls, renderer, chao: terreno, pedir, partes: [gPredios, det.grupo, veg, entorno], principal, setCorte: (h) => palco.set({ corte: h }), desktop: noPC, cones: det.cones, hora });
      if (fotoPasseio) passeioReal.setFoto(...fotoPasseio); window.MAPA3D.passeioReal = passeioReal;
    }
    return passeioReal.ligar(op);
  },
};
const viagem = criarViagem({ scene, camera, controls, interior, palco, pedir, ficha: $('#ficha'), passos: $('#passos') });

/* desenha só quando algo muda */
let isoAntes = -1;
function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
function quadro(now) {
  pedido = false; if (!pronta) return; const passeando = passeio.tick(now); const viajando = !passeando && viagem.tick(now); const abrindo = !viajando && !!abertura?.tick(now); const animando = !viajando && !abrindo && palco.tick(now); const mexeu = passeando || viajando || animando || abrindo ? false : controls.update();
  if (ISO.value !== isoAntes) { isoAntes = ISO.value; fundoCeu(); }
  interior.virar(daCamera(camera, controls).a);
  /* Com o bloco aberto, a maquete e a rota são desenhadas numa segunda passada, por cima do campus desbotado:
     árvores e prédios de trás não atravessam os andares (que ficam afastados em escada, por cima do terreno). */
  const sobre = palco.estado().abre > 0.05;
  viagem.camada(sobre ? 1 : 0);
  /* o bloco aberto vai junto para a segunda passada: árvores e prédios não atravessam os andares afastados */
  if (sobre !== quadro.sobre) { quadro.sobre = sobre; principal.grupo.traverse((o) => o.layers.set(sobre ? 1 : 0)); }
  contornos.atualizar();
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

const hr = $('#hora'); hr.addEventListener('input', (e) => { const h = +hr.value; if (e.isTrusted) sessionStorage.setItem('mapa3d-hora', hr.value); $('#horaTxt').textContent = String(Math.floor(h)).padStart(2, '0') + 'h' + (h % 1 ? '30' : '00'); hora(h); });
/* hora do aparelho (de meia em meia hora, como o controle); quem mexe no controle fixa a hora até fechar a aba */
{ const d = new Date(); hr.value = sessionStorage.getItem('mapa3d-hora') || Math.min(22, Math.max(5, Math.round((d.getHours() + d.getMinutes() / 60) * 2) / 2)); } hr.dispatchEvent(new Event('input'));
requestAnimationFrame(() => { const i = renderer.info; $('#info').textContent = `${tris(scene).toLocaleString('pt-BR')} triângulos · ${i.render.calls} chamadas · montado em ${tMontagem} ms`; });
window.MAPA3D = { contornos, passeio, prepararCampus, verCampus, viagem, palco, interior, estilo, principal, scene, camera, controls, renderer, irPara, VISTAS, hora, M, T };
interfaceMapa = iniciarInterface({ gestos, scene, camera, controls, renderer, principal, interior, palco, estilo, viagem, passeio, veg, entorno, sol, pedir, hora, irPara, VISTAS, prepararCampus, verCampus, predios: gPredios, detalhes: det.grupo });
window.MAPA3D.interface = interfaceMapa;
/* abertura: o bloco principal (verde e azul), a cantina, o pátio e o obelisco sobem do chão com a cor do evento */
abertura = criarAbertura({ camera, controls, renderer, pedir, fim: () => interfaceMapa.poseEvento(), ocupado: () => viagem.ativa(), aoTerminar: () => estilo.setMode(estilo.mode()),
  partes: [{ grupo: principal.grupo, cores: ['verde', 'azul'] }, { grupo: gPredios.getObjectByName('cantina'), cores: ['laranja'] }, { grupo: det.grupo.getObjectByName('patio'), cores: ['patio'] }, { grupo: det.grupo.getObjectByName('obelisco'), cores: [] }] });
window.MAPA3D.abertura = abertura;
const q0 = new URLSearchParams(location.search);
/* o passeio é segredo: ?passeio=1 ainda abre direto nele (para testar) */
if (q0.get('passeio') === '1') { palco.parar(); interfaceMapa.api.setMode('passear'); }
else { palco.parar(); abertura.rodar(); }
/* O primeiro quadro era o mais demorado: a placa compilava todos os programas de uma vez, travando a página. Agora eles
   são compilados antes, em paralelo onde o navegador deixa (KHR_parallel_shader_compile), e as texturas sobem para a
   placa uma a uma, com a barra andando. */
await etapa('Preparando a imagem…', 0.93);
/* só o que aparece: o recheio, a maquete escondida e o entorno do modo Campus ficam para quando forem pedidos */
const soVisivel = visiveis(scene);
try { await renderer.compileAsync(soVisivel, camera, scene); } catch { /* o primeiro quadro compila o que faltar */ }
CARGA.push(['compilado', Math.round(performance.now())]);
{ const tex = new Set(); scene.traverseVisible((o) => { const ms = !o.material ? [] : Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => ['map', 'normalMap', 'alphaMap', 'emissiveMap'].forEach((k) => m[k] && tex.add(m[k]))); });
  let i = 0, t1 = performance.now(); for (const t of tex) { renderer.initTexture(t); if (performance.now() - t1 > 40) { await etapa('Preparando a imagem…', 0.93 + 0.05 * (++i / tex.size)); t1 = performance.now(); } } }
CARGA.push(['texturas', Math.round(performance.now())]);
pronta = true; quadro(performance.now());
window.MAPA3D.ready = true;
await etapa('Pronto', 1); pedir(); setTimeout(() => { const c = $('#carga'); if (c) { c.classList.add('fim'); setTimeout(() => c.remove(), 700); } }, 180);
