/* Texturas feitas em código, com as cores e os desenhos tirados das fotos de referência
   (referencias/imagens/google-maps). Nenhuma foto entra no modelo: são só azulejos, pastilhas e pisos redesenhados.
   Cada textura sabe quantos metros cobre, e as malhas usam UV em metros. */
import * as THREE from 'three';
import { rng } from './dados.js';

let ANISO = 4;
export const setAniso = (n) => { ANISO = n; };

function tex(size, metros, draw, opt = {}) {
  const [w, h] = Array.isArray(size) ? size : [size, size]; const [mx, my] = Array.isArray(metros) ? metros : [metros, metros];
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / mx, 1 / my); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
  if (opt.clamp) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); }
  return t;
}
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const rgb = (c, f = 1) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * f)))).join(',')})`;
function ruido(g, w, h, n, r, cores, seed = 3) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = cores[Math.floor(R() * cores.length)]; const s = r * (0.5 + R()); g.fillRect(R() * w, R() * h, s, s); }
}
/* Grade de peças quadradas com variação de tom e rejunte. */
function grade(g, w, h, n, base, rejunte, var_ = 0.06, seed = 1, junta = 2, brilho = 0) {
  const R = rng(seed); const s = w / n; const b = hex(base);
  g.fillStyle = rejunte; g.fillRect(0, 0, w, h);
  for (let y = 0; y < Math.round(h / s); y++) for (let x = 0; x < n; x++) {
    g.fillStyle = rgb(b, 1 - var_ + R() * var_ * 2);
    g.fillRect(x * s + junta / 2, y * s + junta / 2, s - junta, s - junta);
    if (brilho) { g.fillStyle = `rgba(255,255,255,${brilho * R()})`; g.fillRect(x * s + junta / 2, y * s + junta / 2, s - junta, (s - junta) * 0.35); }
  }
}

/* Tirar a cor: um valor só, compartilhado, que leva qualquer material para tons de cinza claros.
   Serve para destacar o destino de uma rota sem apagar o resto do campus. */
export const DESAT = { value: 0 };
export function desaturavel(m) {
  m.onBeforeCompile = (sh) => { sh.uniforms.uDesat = DESAT; sh.fragmentShader = 'uniform float uDesat;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n float cz = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(cz * 0.78 + 0.2), uDesat);'); };
  m.customProgramCacheKey = () => 'desat'; return m;
}

/* Textura com texto, para placas e letreiros. */
export function placa(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t;
}

export function criarTexturas() {
  const T = {};
  /* Azulejo amarelo das fachadas: peças de 10 cm. */
  T.azulejo = tex(256, 1.6, (g, w, h) => grade(g, w, h, 16, '#dfb857', '#b79443', 0.05, 11, 2));
  /* Pastilha azul da platibanda e da entrada. */
  T.pastilha = tex(256, 1.6, (g, w, h) => grade(g, w, h, 16, '#27338f', '#5560b4', 0.16, 23, 2, 0.1));
  /* Piso intertravado cinza dos caminhos. */
  T.intertravado = tex(256, 1.6, (g, w, h) => {
    g.fillStyle = '#8f8b80'; g.fillRect(0, 0, w, h); const R = rng(5); const b = hex('#b7b2a6');
    for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) { g.fillStyle = rgb(b, 0.92 + R() * 0.16); g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); }
  });
  /* Paralelepípedo do estacionamento. */
  T.paralelo = tex(256, 2.4, (g, w, h) => {
    g.fillStyle = '#77736a'; g.fillRect(0, 0, w, h); const R = rng(9); const cs = ['#aaa49a', '#b9b3a6', '#9c968b', '#c2bcae', '#a59f93'];
    for (let y = 0; y < 16; y++) for (let x = -1; x < 12; x++) { g.fillStyle = cs[Math.floor(R() * cs.length)]; const ww = 18 + R() * 5; g.beginPath(); g.roundRect(x * 22 + (y % 2) * 11 + R() * 2, y * 16 + 1.5 + R(), ww, 12.5, 3); g.fill(); }
  });
  /* Piso de cimento polido do pátio coberto, em placas grandes. */
  T.cimento = tex(256, 3, (g, w, h) => {
    g.fillStyle = '#cbc8c0'; g.fillRect(0, 0, w, h); ruido(g, w, h, 900, 7, ['rgba(255,255,255,.05)', 'rgba(90,90,85,.05)'], 4);
    g.strokeStyle = 'rgba(110,108,100,.5)'; g.lineWidth = 1.5; g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2); g.strokeRect(0, h / 2, w / 2, h / 2); g.strokeRect(w / 2, 0, w / 2, h / 2);
  });
  /* Telha de fibrocimento ondulada (bloco principal) e telha metálica (coberturas). */
  const ondas = (cor, sombra, n) => (g, w, h) => {
    g.fillStyle = cor; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const x = (i / n) * w, s = w / n; const gr = g.createLinearGradient(x, 0, x + s, 0); gr.addColorStop(0, sombra); gr.addColorStop(0.5, 'rgba(255,255,255,.14)'); gr.addColorStop(1, sombra); g.fillStyle = gr; g.fillRect(x, 0, s, h); }
    ruido(g, w, h, 260, 9, ['rgba(60,60,55,.05)', 'rgba(255,255,255,.04)'], 8);
    g.fillStyle = 'rgba(60,60,60,.25)'; g.fillRect(0, h - 2, w, 2);
  };
  T.fibro = tex(128, [1.1, 2.2], ondas('#bdbbb4', 'rgba(70,70,66,.22)', 6));
  T.metal = tex(128, [1.2, 3], ondas('#d9dcde', 'rgba(80,90,100,.2)', 5));
  /* Grama, terra, asfalto. */
  T.grama = tex(256, 6, (g, w, h) => { /* grama do sertão: verde apagado, com falhas secas (o usuário achou a anterior verde demais) */ g.fillStyle = '#909c5c'; g.fillRect(0, 0, w, h); ruido(g, w, h, 2600, 5, ['rgba(120,140,70,.35)', 'rgba(95,125,60,.3)', 'rgba(190,180,110,.3)', 'rgba(170,150,95,.22)'], 2); });
  T.terra = tex(256, 9, (g, w, h) => { g.fillStyle = '#cdbd95'; g.fillRect(0, 0, w, h); ruido(g, w, h, 1800, 6, ['rgba(180,160,120,.3)', 'rgba(225,212,180,.3)', 'rgba(150,135,100,.14)'], 6); });
  T.asfalto = tex(128, 4, (g, w, h) => { g.fillStyle = '#5d5e62'; g.fillRect(0, 0, w, h); ruido(g, w, h, 1500, 3, ['rgba(120,120,125,.25)', 'rgba(40,40,44,.25)'], 7); });
  T.concreto = tex(128, 3, (g, w, h) => { g.fillStyle = '#c9c5ba'; g.fillRect(0, 0, w, h); ruido(g, w, h, 700, 5, ['rgba(255,255,255,.07)', 'rgba(90,90,80,.07)'], 12); });
  /* Piso tátil amarelo das bordas da passarela. */
  T.tatil = tex(64, 0.4, (g, w, h) => { g.fillStyle = '#d8b02c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e7c548'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(8 + x * 16, 8 + y * 16, 4.4, 0, 7); g.fill(); } g.strokeStyle = 'rgba(120,95,20,.5)'; g.strokeRect(0, 0, w, h); });
  /* Placas da passarela da entrada: cimento com relevo, 40 cm. */
  T.passarela = tex(128, 0.8, (g, w, h) => {
    g.fillStyle = '#a9a69c'; g.fillRect(0, 0, w, h); const R = rng(14);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = rgb(hex('#b4b1a7'), 0.94 + R() * 0.12); g.fillRect(x * 64 + 1.5, y * 64 + 1.5, 61, 61); g.strokeStyle = 'rgba(80,80,74,.18)'; g.lineWidth = 1; for (let k = 8; k < 60; k += 7) { g.beginPath(); g.moveTo(x * 64 + 6, y * 64 + k); g.lineTo(x * 64 + 58, y * 64 + k); g.stroke(); } }
  });
  /* Corredores internos: azulejo branco até 1,25 m, faixa vermelha e pintura branca em cima (foto do corredor). v cobre 3,45 m. */
  T.corredor = tex([64, 512], [0.4, 3.45], (g, w, h) => {
    g.fillStyle = '#f1f0ea'; g.fillRect(0, 0, w, h);
    const y0 = h - (1.25 / 3.45) * h, yr = h - (1.42 / 3.45) * h;
    g.fillStyle = '#e9e9e4'; g.fillRect(0, y0, w, h - y0);
    g.strokeStyle = 'rgba(150,152,150,.6)'; g.lineWidth = 1;
    for (let y = h; y > y0; y -= (0.2 / 3.45) * h) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    [0, w / 2].forEach((x) => { g.beginPath(); g.moveTo(x + 0.5, y0); g.lineTo(x + 0.5, h); g.stroke(); });
    g.fillStyle = '#c62a2a'; g.fillRect(0, yr, w, y0 - yr); g.strokeStyle = 'rgba(90,10,10,.5)'; [0, w / 2].forEach((x) => { g.beginPath(); g.moveTo(x + 0.5, yr); g.lineTo(x + 0.5, y0); g.stroke(); });
  });
  /* Piso cerâmico claro dos corredores e salas, 45 cm. */
  T.piso = tex(128, 0.9, (g, w, h) => grade(g, w, h, 2, '#e4e3dd', '#b9b8b0', 0.025, 31, 1.5));
  /* Piso de borracha preta da rampa, com pastilhas redondas. */
  T.borracha = tex(64, 0.5, (g, w, h) => { g.fillStyle = '#1e2023'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c2f33'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(8 + x * 16, 8 + y * 16, 4.5, 0, 7); g.fill(); } });
  /* Madeira do pergolado. */
  T.madeira = tex(128, [0.6, 2], (g, w, h) => { g.fillStyle = '#6b452c'; g.fillRect(0, 0, w, h); const R = rng(21); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${R() > 0.5 ? '40,24,14' : '150,105,70'},${0.12 + R() * 0.2})`; g.lineWidth = 0.5 + R() * 1.5; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + R() * 6 - 3, h * 0.3, x + R() * 6 - 3, h * 0.6, x + R() * 4 - 2, h); g.stroke(); } });
  /* Sebe aparada com flores vermelhas e alaranjadas (ixora), vista de cima. */
  T.sebe = tex(128, 1.6, (g, w, h) => { g.fillStyle = '#4f8a3a'; g.fillRect(0, 0, w, h); ruido(g, w, h, 500, 6, ['rgba(60,110,45,.6)', 'rgba(110,160,70,.5)'], 41); ruido(g, w, h, 150, 4, ['#d9482b', '#e8642e', '#c93a2a', '#ee8a3a'], 42); });
  /* Piso de tijolo (bloquete avermelhado). */
  T.tijolo = tex(256, 1.6, (g, w, h) => { g.fillStyle = '#8a6a58'; g.fillRect(0, 0, w, h); const R = rng(45); const b = hex('#b98a70'); for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) { g.fillStyle = rgb(b, 0.88 + R() * 0.22); g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); } });
  /* Tela de sombreamento da estufa: malha escura de tecido, bem fechada. Alambrado: malha cinza aberta. */
  T.sombrite = tex(64, 0.25, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(28,32,30,1)'; for (let i = 0; i < 8; i++) { g.fillRect(i * 8, 0, 5.5, h); g.fillRect(0, i * 8, w, 5.5); } });
  T.alambrado = tex(64, 0.4, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#9aa0a6'; g.lineWidth = 2.5; for (let i = -4; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 64, 64); g.moveTo(i * 16 + 64, 0); g.lineTo(i * 16, 64); g.stroke(); } });
  /* Tela dos portões: malha vermelha vazada. */
  T.grade = tex(64, 0.5, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#b8402f'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); } });
  /* Telha cerâmica (Casa do Mel, vizinhos). */
  T.telha = tex(128, [1.6, 1.6], (g, w, h) => { g.fillStyle = '#b8694a'; g.fillRect(0, 0, w, h); const R = rng(17); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = rgb(hex('#c2714f'), 0.85 + R() * 0.3); g.fillRect(x * 16 + 1, y * 16, 14, 15); g.fillStyle = 'rgba(60,25,15,.3)'; g.fillRect(x * 16, y * 16 + 14, 16, 2); } });
  /* Pintura do piso do pátio interno (fotos 02, 09 e 14): manchas azul, verde e amarela sobre o cimento. Cobre o pátio todo de uma vez. */
  T.patioInterno = tex([1024, 256], 1, (g, w, h) => {
    g.fillStyle = '#d8d6cf'; g.fillRect(0, 0, w, h);
    const blob = (cor, pts_) => { g.fillStyle = cor; g.beginPath(); pts_.forEach(([x, y], i) => { const [nx, ny] = pts_[(i + 1) % pts_.length]; const mx = (x + nx) / 2 * w, my = (y + ny) / 2 * h; if (!i) g.moveTo(mx, my); g.quadraticCurveTo(nx * w, ny * h, (nx + pts_[(i + 2) % pts_.length][0]) / 2 * w, (ny + pts_[(i + 2) % pts_.length][1]) / 2 * h); }); g.fill(); };
    blob('#3f8f4f', [[0.03, 0.2], [0.3, 0.08], [0.62, 0.14], [0.97, 0.1], [0.98, 0.86], [0.7, 0.92], [0.36, 0.86], [0.04, 0.9]]);
    blob('#3b8fd6', [[0.06, 0.34], [0.26, 0.22], [0.5, 0.3], [0.74, 0.2], [0.94, 0.34], [0.92, 0.7], [0.72, 0.8], [0.5, 0.66], [0.28, 0.8], [0.08, 0.68]]);
    blob('#e8d23e', [[0.12, 0.42], [0.24, 0.36], [0.33, 0.5], [0.24, 0.64], [0.12, 0.58]]);
    blob('#e8d23e', [[0.58, 0.4], [0.72, 0.34], [0.84, 0.48], [0.74, 0.62], [0.6, 0.58]]);
    blob('#4aa35a', [[0.4, 0.42], [0.5, 0.38], [0.55, 0.5], [0.48, 0.6], [0.4, 0.55]]);
    ruido(g, w, h, 1400, 5, ['rgba(255,255,255,.05)', 'rgba(40,40,40,.05)'], 33);
  }, { clamp: true });
  return T;
}

export function criarMateriais(T) {
  const L = (o) => new THREE.MeshLambertMaterial(o);
  const M = {
    falta: L({ color: 0xff00ff }),
    azulejo: L({ map: T.azulejo }),
    azulejoAnexo: L({ map: T.azulejo, color: 0xe6d6b0 }),   // o Anexo é mais ocre (fotos 12, 21 e 22)
    azulejoClaro: L({ map: T.azulejo, color: 0xfff4c8 }),
    pastilha: L({ map: T.pastilha }),
    beiral: L({ color: 0x4a3526 }),                          // forro escuro debaixo da platibanda
    laje: L({ color: 0xb9b6ae }),
    fibro: L({ map: T.fibro }),
    metal: L({ map: T.metal }),
    metalBaixo: L({ color: 0xaeb4b8, side: THREE.BackSide }),
    telha: L({ map: T.telha }),
    vidro: new THREE.MeshPhongMaterial({ color: 0x1d2a38, shininess: 90, specular: 0x8899aa }),
    vidroClaro: new THREE.MeshPhongMaterial({ color: 0x8fb6c8, shininess: 90, specular: 0xffffff, transparent: true, opacity: 0.55 }),
    /* janela com luz acesa: de dia é igual às outras; à noite a luz sobe com emissiveIntensity (main.js) */
    vidroAceso: new THREE.MeshPhongMaterial({ color: 0x1d2a38, shininess: 90, specular: 0x8899aa, emissive: 0xffc670, emissiveIntensity: 0 }),
    poca: new THREE.MeshBasicMaterial({ map: placa(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,205,130,1)'); r.addColorStop(0.45, 'rgba(255,190,110,.45)'); r.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); }), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    caixilho: L({ color: 0xcfd3d6 }),
    moldura: L({ map: T.azulejo, color: 0xfff0c0 }),
    branco: L({ color: 0xf2f1ec }),
    brancoPuro: L({ color: 0xffffff }),
    cinza: L({ color: 0x9a9ea3 }),
    cinzaEscuro: L({ color: 0x4b4f57 }),
    preto: L({ color: 0x1b1d21 }),
    vermelho: L({ color: 0xc43a32 }),
    amarelo: L({ color: 0xe0b63a }),
    ar: L({ color: 0xe9eaea }),
    porta: L({ color: 0x7d8790 }),
    corredor: L({ map: T.corredor }),
    sala: L({ color: 0xf3efe4 }),
    piso: L({ map: T.piso }),
    pisoSala: L({ map: T.piso, color: 0xe9e2d2 }),
    pisoLab: L({ map: T.piso, color: 0xd9e3ea }),
    pisoAdm: L({ map: T.piso, color: 0xe6dcc8 }),
    pisoWc: L({ map: T.piso, color: 0xcfe0e6 }),
    pisoAud: L({ color: 0x7a4a34 }),
    palco: L({ map: T.madeira, color: 0xffd9b0 }),
    patioInterno: L({ map: T.patioInterno }),
    madeira: L({ map: T.madeira }),
    cimento: L({ map: T.cimento }),
    concreto: L({ map: T.concreto }),
    intertravado: L({ map: T.intertravado }),
    paralelo: L({ map: T.paralelo }),
    passarela: L({ map: T.passarela }),
    tatil: L({ map: T.tatil }),
    grama: L({ map: T.grama }),
    terra: L({ map: T.terra }),
    terraFora: L({ map: T.terra, color: 0xe2d6b2 }),
    chao: L({ map: T.terra, color: 0xe9e0cc }),
    asfalto: L({ map: T.asfalto }),
    calcada: L({ map: T.concreto, color: 0xd8d2c4 }),
    faixa: L({ color: 0xf2f1ea }),
    faixaAmarela: L({ color: 0xe3b93c }),
    muro: L({ color: 0xf4f3ee }),
    agua: new THREE.MeshPhongMaterial({ color: 0x3fb2e0, shininess: 120, specular: 0xffffff }),
    areia: L({ color: 0xe6d6a6 }),
    campo: L({ map: T.grama, color: 0xd8f0b0 }),
    aco: L({ color: 0xf4f5f6 }),
    acoVermelho: L({ color: 0xb8402f }),
    sebe: L({ color: 0x4f8a3a }),
    flor: L({ color: 0xd9482b }),
    obra: L({ color: 0xa9a59b }),
    laranja: L({ color: 0xe8822a }),
    rosa: L({ color: 0xd9a39a }),
    brancoSujo: L({ color: 0xdedcd4 }),
    lona: L({ color: 0xf6f6f2 }),
    lonaAzul: L({ color: 0x2f6fc4 }),
    onibus: L({ color: 0xe9b520 }),
    placaAssis: L({ map: placa(256, 64, (g, w, h) => { g.fillStyle = '#d0282a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 30px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SEU ASSIS', w / 2, h / 2 + 1); }) }),
    placaBrisanet: L({ map: placa(512, 96, (g, w, h) => { g.fillStyle = '#e8822a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '800 72px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('brisanet', w / 2 + 20, h / 2 + 2); g.lineWidth = 7; g.strokeStyle = '#fff'; [0, 16, 32].forEach((d) => { g.beginPath(); g.arc(70, h / 2, 34 - d, -0.9, 0.9); g.stroke(); }); }) }),
    casaBranca: L({ color: 0xeeeae0 }), casaCreme: L({ color: 0xe6d3a8 }), casaAzul: L({ color: 0xa9c4d8 }), casaSalmao: L({ color: 0xe0a890 }), casaAmarela: L({ color: 0xe8cf7a }), casaVerde: L({ color: 0xa8cba0 }),
    arame: L({ color: 0x6a6e72 }),
    serra: L({ color: 0x8f9a8e }),
    reboco: L({ map: T.concreto, color: 0xb8b4aa }),
    reboco2: L({ color: 0x9c988e }),
    mato: L({ map: T.terra, color: 0xd6d3a0 }),
    estrada: L({ map: T.terra, color: 0xfff6e2 }),
    sombrite: L({ map: T.sombrite, transparent: true, alphaTest: 0.3 }),
    alambrado: L({ map: T.alambrado, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }),
    rede: L({ map: T.alambrado, color: 0xffffff, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }),
    barParede: L({ color: 0x2a2c30 }),
    verdeMuro: L({ color: 0x3f8a4a }),
    painelAzul: L({ map: placa(256, 256, (g, w, h) => { g.fillStyle = '#2f4f8f'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8b93a'; g.fillRect(0, 0, w, 60); g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 6; i++) g.fillRect(30, 84 + i * 24, w - 60 - (i % 2) * 40, 9); }) }),
    placaEletrica: L({ map: placa(256, 64, (g, w, h) => { g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2ee'; g.font = '800 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ELÉTRICA', w / 2, h / 2 + 2); }) }),
    meioFio: L({ color: 0xe0b43a }),
    xadrez: L({ color: 0xd9d6cc }),
    solar: new THREE.MeshPhongMaterial({ color: 0x1f2c4a, shininess: 80, specular: 0x8899bb }),
    azulCaixa: L({ color: 0x2e62b8 }),
    forroMetal: L({ color: 0xc4c9cc }),
    azulMesa: L({ color: 0x27508f }),
    madeiraClara: L({ map: T.madeira, color: 0xffc890 }),
    totem: L({ color: 0xe6e8ea }),
    grade: L({ map: T.grade, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }),
    faixaTubo: L({ color: 0xe8c832 }),
    globo: new THREE.MeshBasicMaterial({ color: 0xfbfbf6 }),
    sebeFlor: L({ map: T.sebe }),
    tijolo: L({ map: T.tijolo }),
    folha: L({ color: 0x4d8f3c }),
    tronco: L({ color: 0x7a6248 }),
  };
  /* O chão é desenhado em camadas, na ordem, sem disputar profundidade entre si. */
  ['grama', 'terra', 'terraFora', 'chao', 'asfalto', 'calcada', 'faixa', 'faixaAmarela', 'intertravado', 'paralelo', 'passarela', 'tatil', 'cimento', 'areia', 'campo', 'tijolo', 'mato', 'estrada'].forEach((k) => { M[k + 'Chao'] = M[k].clone(); M[k + 'Chao'].depthWrite = false; });
  return M;
}
