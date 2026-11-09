/* Mapa do campus em vista semi-3D (Canvas 2D).
   Contornos: marcações do campus em metros, usadas como base e endireitadas em campus-limpo.js.
   Alturas: adotadas, não medidas. Árvores, canteiro e escadinha do Coliseu: posições lidas nas fotos de satélite, aproximadas.
   Faixas da rua e trilhas são ilustrativas.
   Árvores e casas são imagens renderizadas de modelos CC0 (impostores), e paredes e telhados usam texturas:
   ver scripts/assets. Sem as imagens, o mapa cai para o desenho simples. */
(() => {
  'use strict';
  /* Navegadores antigos não têm roundRect. */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
  }
  const E = window.CAMPUS.elementos;
  let reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HV = 0.92; // quanto a altura sobe na tela
  /* Direção (no chão) de onde vem a luz e comprimento das sombras por metro de altura.
     Com a luz do horário ligada, segue o sol de Pau dos Ferros nos dias do evento (ver setHour). */
  const LIGHT = [0.52, 0.85];
  let SHADOW_K = 0.72;
  /* Pontos de interesse ao ar livre (informados pelo usuário). */
  const POIS = [
    { id: 'bebedouro-anexo', kind: 'agua', label: 'Bebedouro', where: 'Entrada do Anexo', at: [-32.5, -81.5] },
    { id: 'bebedouro-cantina', kind: 'agua', label: 'Bebedouro', where: 'Cantina', at: [-61.5, -57.8] },
  ];
  let poiSel = null;
  /* Camadas do mapa (ajustes no canto do mapa). */
  const LAYERS = { labels: true, shadows: true, trees: true, cars: true };
  /* Norte e leste no mapa (levantamento: a frente do campus, +y, olha para o oeste). */
  const NORTH = [-0.9984, 0.0573], EAST = [-0.0573, -0.9984];
  const SITE = { lat: -6.146, lon: -38.205, tz: -3, doy: 330 }; // 26 de novembro
  function sunAt(h) {
    const r = Math.PI / 180, dec = 23.44 * Math.sin((360 / 365) * (284 + SITE.doy) * r);
    const B = (360 / 365) * (SITE.doy - 81) * r, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutos
    const solar = h + (SITE.lon - SITE.tz * 15) / 15 + eot / 60;
    const H = 15 * (solar - 12) * r, la = SITE.lat * r, d = dec * r;
    const el = Math.asin(Math.sin(la) * Math.sin(d) + Math.cos(la) * Math.cos(d) * Math.cos(H));
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(la) - Math.tan(d) * Math.cos(la)) + Math.PI; // a partir do norte, sentido horário
    return { el: el / r, az: (az / r + 360) % 360 };
  }
  const ENT = window.CAMPUS_ENTORNO || { roads: [], streets: [], green: [], trees: [], lots: [], fences: [], small: [], big: [] };
  const LIMPO = window.CAMPUS_LIMPO || { survey: {}, fundo: {}, extras: {} };
  const pts = (i) => LIMPO.survey[i] || E[i].pontos;
  const XT = LIMPO.extras;
  /* ---------- qualidade dinâmica ----------
     Três níveis. O automático parte do aparelho e de um teste rápido de velocidade,
     e desce sozinho se a animação real ficar lenta. */
  const TIERS = {
    alta: { dpr: 2, wallTex: true, roofTex: true, sprites: true, soften: true, ground: 2, bushes: true, cars: true, carMs: 33, shadows: true, view3d: true, quickMs: 26, lean: false },
    media: { dpr: 1.5, wallTex: false, roofTex: false, sprites: true, soften: false, ground: 1, bushes: false, cars: true, carMs: 66, shadows: true, view3d: true, quickMs: 10, lean: false },
    /* 3D para celular comum: menos pixels, desenho em lote e nada que não apareça. */
    leve: { dpr: 1.35, wallTex: false, roofTex: false, sprites: true, soften: false, ground: 0, bushes: false, cars: false, carMs: 0, shadows: true, view3d: true, quickMs: 0, lean: true },
    simples: { dpr: 1, wallTex: false, roofTex: false, sprites: false, soften: false, ground: 0, bushes: false, cars: false, carMs: 0, shadows: false, view3d: false, quickMs: 0, lean: true },
  };
  const ORDER = ['alta', 'media', 'leve', 'simples'];
  const MEASURED = 'etal-q-medida2';
  const readLS = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* opcional */ } };
  function speedTest() {
    /* Trabalho parecido com o do mapa: contas de ponto flutuante, objetos e ordenação. */
    const t0 = performance.now(); const arr = [];
    for (let i = 0; i < 6000; i++) { const a = i * 0.37; arr.push({ d: Math.sin(a) * Math.cos(a * 0.7), x: Math.hypot(a, i) }); }
    arr.sort((u, v) => u.d - v.d);
    let s = 0; for (let n = 0; n < 3; n++) for (let i = 0; i < arr.length; i++) s += Math.sqrt(arr[i].x + n);
    window.__speedSink = s;
    return performance.now() - t0;
  }
  function detectTier() {
    const nav = navigator; const conn = nav.connection || {};
    const mem = nav.deviceMemory, cores = nav.hardwareConcurrency;
    const ms = Math.min(speedTest(), speedTest(), speedTest());
    const info = { mem, cores, ms: +ms.toFixed(1), saveData: !!conn.saveData };
    const coarse = matchMedia('(pointer: coarse)').matches;
    let tier = 'leve', why = 'celular comum';
    if (conn.saveData) { tier = 'simples'; why = 'economia de dados ligada'; }
    else if ((mem && mem <= 1) || ms > SPEED_VERY) { tier = 'simples'; why = 'aparelho muito limitado'; }
    else if (ms <= (coarse ? 3.5 : 6) && (!mem || mem >= 6) && (!cores || cores >= 6)) { tier = 'alta'; why = 'aparelho rápido'; }
    else if (ms <= 11 && (!mem || mem >= 4) && (!cores || cores >= 4)) { tier = 'media'; why = 'aparelho intermediário'; }
    /* O teste completo feito neste aparelho vale mais que as estimativas acima. */
    const tested = readLS(TESTED);
    if (tested && TIERS[tested]) { tier = tested; why = 'teste feito neste aparelho'; }
    const seen = readLS(MEASURED);
    if (seen && ORDER.indexOf(seen) > ORDER.indexOf(tier)) { tier = seen; why = 'animação lenta medida neste aparelho'; }
    return { tier, why, info };
  }
  const SPEED_VERY = 28;
  const TESTED = 'etal-q-teste';
  let qSetting = (() => { const q = new URLSearchParams(location.search).get('qualidade'); return q || readLS('etal-qualidade') || 'auto'; })();
  let qAuto = detectTier();
  let tierName = qSetting === 'auto' ? qAuto.tier : qSetting;
  let Q = TIERS[tierName] || TIERS.alta;
  document.documentElement.dataset.perf = tierName;
  let frameCost = 0, moveUntil = 0, dirty = true, baseCam = null;
  const samples = [];
  let pendingDemote = false, benchLock = false, noBlit = false;

  /* Imagens e texturas */
  const SPR = window.SPRITES || null;
  const IMG = {};
  if (SPR) {
    const load = (n) => { const i = new Image(); i.onload = () => { IMG[n] = i; schedule(); }; const src = `assets/sprites/${n}.webp`; i.src = (window.ASSET_DATA || {})[src] || src; };
    ['color-light', 'color-dark', 'mono-light', 'mono-dark'].forEach((m) => ['trees', 'houses', 'roof', 'telha', 'ribs', 'wall', 'cobble'].forEach((k) => load(`${k}-${m}`)));
    ['light', 'dark'].forEach((m) => {
      ['roof', 'ribs', 'wall'].forEach((k) => load(`${k}-event-${m}`));
      ['roof', 'wall'].forEach((k) => ['blue', 'honey'].forEach((v) => load(`${k}-event-${v}-${m}`)));
    });
  }
  /* Luz do horário (ver setHour): à noite, árvores, casas e texturas usam as versões escuras. */
  let NIGHT = 0, DUSK = 0, hourOn = null;
  const themeKey = () => (document.documentElement.dataset.theme === 'dark' || NIGHT >= 0.5 ? 'dark' : 'light');
  const tintKey = () => `${isEv() ? 'mono' : 'color'}-${themeKey()}`;
  const PATS = {};
  function patternOf(name, ev) {
    const key = `${name}-${ev ? (ev === true ? 'event' : `event-${ev}`) : isEv() ? 'mono' : 'color'}-${themeKey()}`;
    if (PATS[key]) return PATS[key];
    if (!IMG[key]) return null;
    PATS[key] = baseCanvas.getContext('2d').createPattern(IMG[key], 'repeat');
    return PATS[key];
  }
  const FUNDO = window.CAMPUS_FUNDO || [];
  const F = (n) => LIMPO.fundo[n] || FUNDO.find((e) => e.nome === n)?.pontos || null;
  const FP = (n) => FUNDO.filter((e) => e.nome === n && e.tipo === 'Point').map((e) => e.pontos[0]);
  const geom = (list) => list.map((b) => ({ ...b, p: b.pontos || pts(b.el) })).filter((b) => b.p);

  const PAL = {
    light: {
      sky: '#e9edf3', outside: '#d5c9a2', road: '#6c6f76', lane: '#f2f1ea', walk: '#b9b3a4',
      grass: '#a8c678', grass2: '#9dbd6f', paved: '#d7d2c4', park: '#bdb8aa', parkLine: '#a9a496', path: '#ebe6d9', pathEdge: '#bfb9a7',
      shadow: 'rgba(38,52,92,.20)', roof: '#ffffff', roofEdge: '#c9c6bb', wall: [216, 170, 86], band: [38, 56, 136], stream: '#3f8fd6', streamEdge: '#7fb35a', window: 'rgba(52,76,128,.34)',
      accent: '#22386f', accentWall: [34, 56, 111], wood: '#c79a6b', woodWall: [150, 110, 72], cover: 'rgba(235,240,248,.82)', coverEdge: 'rgba(120,136,170,.7)',
      muro: [246, 245, 240], stripe: '#c43a32', leaf: ['#7fb65a', '#6aa749', '#8fc168', '#9aba5a'], leafTop: 'rgba(255,255,255,.2)', trunk: '#8a6f55', bush: [112, 168, 82],
      label: '#ffffff', labelInk: '#1f2f57', labelSel: '#4f9e22', labelSelInk: '#ffffff', route: '#3f8f1a', routeEdge: '#ffffff', court: '#e8c866', courtTree: '#6aa749', courtWall: '#c9a65a', gate: '#c43a32', fog: 'rgba(233,237,243,.08)',
      land: '#d5c9a2', land2: '#cabe94', scrub: '#b4bf86', scrub2: '#a1b277', scrubDot: 'rgba(120,140,85,.5)', dirt: '#e9ddc0', dirtEdge: '#c8ba96', lot: '#d9cda9', lotWall: [176, 170, 152], earth: '#d8cfb6',
      houseWall: [226, 222, 212], houseRoofs: ['#e3b596', '#d9a98c', '#d8d8d4', '#e8c3a8'], bigRoof: '#f2f3f4', bigWall: [204, 208, 214], parkLot: '#dcdde0', parkStall: 'rgba(255,255,255,.8)',
      fenceFill: 'rgba(120,140,170,.14)', fenceBar: 'rgba(85,102,134,.75)', glassLit: 'rgba(196,232,246,.95)', glassDark: 'rgba(120,184,214,.95)', glassEnd: 'rgba(158,212,234,.95)', skyFrame: 'rgba(255,255,255,.85)',
      soil: '#d3c49c', soil2: '#c9ba90', trail: '#efebda', grove: '#b1c28a', roofRgb: [255, 255, 255], water: '#5cc0e6', waterDeep: '#3aa6d6', rim: '#f6fafc', deck: '#f1f0ea', fence: 'rgba(110,125,150,.55)',
      sand: '#ecd9a6', courtLine: '#ffffff', field: '#cfd3a0', fieldLine: 'rgba(255,255,255,.9)', tank: [120, 134, 176], tankTop: '#a3b0d2', panel: '#2f4a86', panelLine: 'rgba(255,255,255,.28)',
      tile: '#e09a5e', tileWall: [236, 214, 190], hexBase: [214, 208, 196], hexDeck: '#f0ece2', hexRoof: [252, 247, 234], rail: 'rgba(95,105,130,.75)', neighbor: '#dfe2e8', neighborWall: [200, 205, 216], glass: 'rgba(205,232,216,.78)', glassWall: [186, 216, 200], glassRib: 'rgba(255,255,255,.75)',
      aptoWall: [240, 238, 232], aptoSlab: '#eeeeea', aptoBand: 'rgb(233,170,58)', aptoGap: 'rgba(70,74,84,.42)', aptoShop: 'rgb(150,154,160)', aptoDoor: 'rgb(222,224,226)', aptoSign: 'rgb(44,92,164)',
      obra: [196, 194, 188], obraTop: '#d9d7d1', crane: '#e0a92a',
      zebra: 'rgba(255,255,255,.92)', laneMid: '#e7b93a', curbYellow: '#e2b33a', pole: '#d4d1c9', poleLamp: '#f4f4ef', wire: 'rgba(40,44,52,.5)', cone: '#e8742c', shade: [248, 248, 246], shadeEdge: 'rgba(150,156,168,.6)',
      gateRgb: [200, 58, 50], gateRoof: '#f4f3ef', gateGrade: 'rgba(200,58,50,.16)', lojaWall: [226, 228, 230], lojaBand: [232, 92, 44], lojaGlass: 'rgba(62,92,126,.85)',
      metal: '#d6dadf', metalEdge: 'rgba(140,148,160,.7)', barWall: [236, 234, 228], barOpen: 'rgba(48,50,48,.78)', barCounter: 'rgb(64,150,88)', truss2: 'rgb(246,246,244)', barInk: '#2b2f36', barSign: 'rgba(214,226,206,.95)',
      plate: '#e6ebf4', plateEdge: '#cbd3e2', slab: [176, 188, 212], roomEdge: '#d2d9e8', rampF: '#f3f6fb', door: '#9aa8c4',
      kinds: { classroom: ['#ffffff', [205, 214, 232]], laboratory: ['#dce7fb', [176, 196, 232]], staff: ['#eef1f7', [204, 210, 224]], office: ['#fbf1df', [226, 206, 168]], lounge: ['#e6f2dc', [190, 214, 176]], wall: ['#dfe4ee', [196, 204, 222]], auditorium: ['#2c4785', [34, 56, 111], true], stairs: ['#f6f8fc', [205, 214, 232]], restroom: ['#dce7fb', [176, 196, 232]], accessible: ['#dce7fb', [176, 196, 232]], reception: ['#4f9e22', [58, 122, 24], true] },
    },
    dark: {
      sky: '#0c1529', outside: '#101a31', road: '#1c2740', lane: '#3b4a6c', walk: '#1a2540',
      grass: '#172f28', grass2: '#143028', paved: '#1c2a4a', park: '#18233e', parkLine: '#2b3a5e', path: '#2b3c64', pathEdge: '#223154',
      shadow: 'rgba(0,0,0,.42)', roof: '#32467a', roofEdge: '#4a5f96', wall: [104, 84, 52], band: [34, 48, 120], stream: '#2f6fb0', streamEdge: '#2f5a34', window: 'rgba(170,200,255,.34)',
      accent: '#5b84dd', accentWall: [58, 92, 170], wood: '#8a6a48', woodWall: [90, 66, 44], cover: 'rgba(70,92,140,.78)', coverEdge: 'rgba(140,165,215,.6)',
      muro: [50, 66, 108], stripe: '#c8504a', leaf: ['#3f8a4c', '#357a44', '#4b9756', '#5a9a4a'], leafTop: 'rgba(255,255,255,.1)', trunk: '#4f4436', bush: [52, 112, 62],
      label: '#1b2a4e', labelInk: '#e8eefb', labelSel: '#ffffff', labelSelInk: '#14224a', route: '#7dd14a', routeEdge: '#0e1932', court: '#6b5a2e', courtTree: '#4b9756', courtWall: '#1f2f58', gate: '#ff7a70', fog: 'rgba(12,21,41,.08)',
      land: '#10192e', land2: '#131d34', scrub: '#14291f', scrub2: '#183226', scrubDot: 'rgba(70,120,90,.3)', dirt: '#26324e', dirtEdge: '#1b2640', lot: '#172238', lotWall: [52, 62, 88], earth: '#1d2a45',
      houseWall: [36, 46, 72], houseRoofs: ['#5d4640', '#54423f', '#3c4660', '#634c44'], bigRoof: '#34425f', bigWall: [32, 42, 66], parkLot: '#1a2540', parkStall: 'rgba(200,215,240,.3)',
      fenceFill: 'rgba(170,190,230,.1)', fenceBar: 'rgba(170,190,230,.6)', glassLit: 'rgba(120,190,225,.9)', glassDark: 'rgba(60,120,165,.9)', glassEnd: 'rgba(90,155,195,.9)', skyFrame: 'rgba(205,230,255,.55)',
      soil: '#152238', soil2: '#18263e', trail: '#22314e', grove: '#173427', roofRgb: [50, 70, 122], water: '#2f8fc4', waterDeep: '#1f74a8', rim: '#46608f', deck: '#22304f', fence: 'rgba(150,170,210,.45)',
      sand: '#6b5c38', courtLine: 'rgba(255,255,255,.8)', field: '#26422f', fieldLine: 'rgba(255,255,255,.55)', tank: [70, 86, 130], tankTop: '#7b8fc0', panel: '#16264e', panelLine: 'rgba(160,190,255,.3)',
      tile: '#a4663a', tileWall: [84, 66, 62], hexBase: [60, 72, 104], hexDeck: '#3a4b78', hexRoof: [120, 135, 175], rail: 'rgba(190,205,235,.65)', neighbor: '#27324e', neighborWall: [34, 44, 70], glass: 'rgba(90,150,130,.55)', glassWall: [50, 96, 86], glassRib: 'rgba(200,235,220,.45)',
      aptoWall: [70, 80, 110], aptoSlab: '#3a4a74', aptoBand: 'rgb(176,120,42)', aptoGap: 'rgba(8,12,24,.55)', aptoShop: 'rgb(54,62,84)', aptoDoor: 'rgb(96,108,140)', aptoSign: 'rgb(48,86,160)',
      obra: [74, 80, 96], obraTop: '#56607a', crane: '#c49a2e',
      zebra: 'rgba(200,210,230,.55)', laneMid: '#b08a2c', curbYellow: '#a8862e', pole: '#56658c', poleLamp: '#ffe6a8', wire: 'rgba(160,175,210,.4)', cone: '#c8642a', shade: [120, 134, 170], shadeEdge: 'rgba(170,185,220,.5)',
      gateRgb: [200, 80, 72], gateRoof: '#3a4a74', gateGrade: 'rgba(255,122,112,.16)', lojaWall: [60, 70, 98], lojaBand: [196, 84, 44], lojaGlass: 'rgba(250,210,140,.55)',
      metal: '#46557c', metalEdge: 'rgba(120,138,180,.55)', barWall: [62, 72, 100], barOpen: 'rgba(250,200,120,.55)', barCounter: 'rgb(46,112,70)', truss2: 'rgb(200,210,232)', barInk: '#14224a', barSign: 'rgba(250,220,150,.9)',
      plate: '#16244a', plateEdge: '#2a3c6c', slab: [18, 28, 58], roomEdge: '#3a4f85', rampF: '#1c2c56', door: '#6d82b5',
      kinds: { classroom: ['#2a3f73', [26, 40, 78], true], laboratory: ['#37548f', [32, 50, 92], true], staff: ['#2a3f73', [26, 40, 78], true], office: ['#4a456f', [44, 40, 74], true], lounge: ['#2c5244', [34, 64, 52], true], wall: ['#3a4a74', [40, 52, 86]], auditorium: ['#e8eefb', [150, 165, 200]], stairs: ['#2a3f73', [26, 40, 78], true], restroom: ['#37548f', [32, 50, 92], true], accessible: ['#37548f', [32, 50, 92], true], reception: ['#7dd14a', [70, 128, 40]] },
    },
  };
  const roomName = (z) => z.name || (z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : z.kind === 'staff' ? 'Professores' : z.roomNumber ? `Sala ${z.roomNumber}` : z.useLabel);
  PAL.light.roomName = roomName; PAL.dark.roomName = roomName;
  /* Modo evento: o mapa inteiro vira um único tom neutro, gerado da paleta normal. Só o evento tem cor. */
  const EV = {
    light: { parts: {
        principal: { roof: '#62b22f', wall: [76, 150, 34], pill: '#3f8a18', ink: '#ffffff', tex: true },
        auditorio: { roof: '#3a62b8', wall: [44, 78, 152], pill: '#2c4c96', ink: '#ffffff', tex: 'blue' },
        cantina: { roof: '#e8a825', wall: [196, 138, 26], pill: '#a86f08', ink: '#ffffff', tex: 'honey' },
        patio: { pill: '#5c9f33', ink: '#ffffff' },
        obelisco: { pill: '#b8322a', ink: '#ffffff' },
      }, evRoof: '#62b22f', evWall: [76, 150, 34], evWindow: 'rgba(255,255,255,.34)', evCover: 'rgba(98,178,47,.6)', evCoverEdge: 'rgba(62,130,24,.85)', evGround: 'rgba(98,178,47,.2)', accent: '#3f8a18', accentWall: [52, 112, 20], labelSel: '#3f8a18', labelSelInk: '#ffffff' },
    dark: { parts: {
        principal: { roof: '#7dd14a', wall: [66, 132, 42], pill: '#7dd14a', ink: '#0e1932', tex: true },
        auditorio: { roof: '#5b84dd', wall: [46, 78, 150], pill: '#8fb0ee', ink: '#0e1932', tex: 'blue' },
        cantina: { roof: '#f0b83a', wall: [160, 112, 28], pill: '#f0b83a', ink: '#0e1932', tex: 'honey' },
        patio: { pill: '#a6e56f', ink: '#0e1932' },
        obelisco: { pill: '#f07a6c', ink: '#0e1932' },
      }, evRoof: '#7dd14a', evWall: [66, 132, 42], evWindow: 'rgba(14,25,50,.3)', evCover: 'rgba(125,209,74,.5)', evCoverEdge: 'rgba(165,230,120,.8)', evGround: 'rgba(125,209,74,.16)', accent: '#a6e56f', accentWall: [84, 160, 52], labelSel: '#7dd14a', labelSelInk: '#0e1932' },
  };
  const KEEP = new Set(['route', 'routeEdge', 'label', 'labelInk', 'roomName', 'kinds', 'plate', 'plateEdge', 'slab', 'roomEdge', 'rampF', 'door', 'mono']);
  function monoize(pl, dark) {
    const grey = (r, g, b) => {
      const L = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      return dark ? [Math.round(15 + L * 62), Math.round(23 + L * 64), Math.round(42 + L * 72)] : [Math.round(176 + L * 76), Math.round(179 + L * 74), Math.round(186 + L * 69)];
    };
    const conv = (v) => {
      if (Array.isArray(v)) return typeof v[0] === 'number' ? grey(...v) : v.map(conv);
      if (typeof v !== 'string') return v;
      let m = v.match(/^#([0-9a-f]{6})$/i);
      if (m) return `rgb(${grey(parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)).join(',')})`;
      m = v.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
      if (m) return `rgba(${grey(+m[1], +m[2], +m[3]).join(',')},${m[4]})`;
      return v;
    };
    const out = {};
    Object.entries(pl).forEach(([k, v]) => { out[k] = KEEP.has(k) ? v : conv(v); });
    return Object.assign(out, dark ? EV.dark : EV.light);
  }
  PAL.light.mono = monoize(PAL.light, false);
  PAL.dark.mono = monoize(PAL.dark, true);
  let mode = 'evento';
  const EVENT_IDS = new Set(['principal', 'patio', 'cantina', 'auditorio']);
  /* O obelisco não é parte do evento, mas aparece no modo Evento como ponto de referência. */
  const EVENT_LABELS = new Set([...EVENT_IDS, 'obelisco']);
  const isEv = () => mode === 'evento';
  /* Luz do horário: NIGHT vai de 0 (dia) a 1 (noite); DUSK é o tom quente do nascer e do pôr do sol.
     A paleta da noite é a escura com as janelas acesas; as intermediárias são misturas guardadas em cache. */
  /* À noite o campus fica vazio: janelas apagadas, com poucas acesas (ver LIT); o Anexo, com aula à noite, fica aceso. */
  const NIGHT_PAL = () => ({ ...PAL.dark, window: 'rgba(90,110,150,.3)', aptoGap: 'rgba(255,190,110,.38)', zebra: 'rgba(200,210,230,.55)' });
  const WARM = 'rgba(255,208,130,.85)';
  /* Quantas janelas ficam acesas por prédio à noite (o resto apagado). */
  const LIT = { principal: 3, laboratorios: 2, diretoria: 1 };
  const parseCol = (v) => {
    if (typeof v !== 'string') return null;
    let m = v.match(/^#([0-9a-f]{6})$/i); if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
    m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/); if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    return null;
  };
  function mixAny(a, b, t) {
    if (typeof a === 'number' && typeof b === 'number') return Math.round(a + (b - a) * t);
    const ca = parseCol(a), cb = parseCol(b);
    if (ca && cb) { const q = ca.map((v, i) => v + (cb[i] - v) * t); return `rgba(${Math.round(q[0])},${Math.round(q[1])},${Math.round(q[2])},${q[3].toFixed(3)})`; }
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((v, i) => mixAny(v, b[i], t));
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) { const o = {}; Object.keys(a).forEach((k) => { o[k] = k in b ? mixAny(a[k], b[k], t) : a[k]; }); return o; }
    return t < 0.5 ? a : b;
  }
  const nightCache = new Map();
  function nightPal(dark, step) {
    const key = `${dark ? 'd' : 'l'}${step}`; if (nightCache.has(key)) return nightCache.get(key);
    const base = { ...(dark ? PAL.dark : PAL.light) }; delete base.mono;
    const night = NIGHT_PAL(); delete night.mono;
    const out = mixAny(base, night, step / 10); out.roomName = roomName;
    out.mono = monoize(out, dark || step >= 5);
    nightCache.set(key, out); return out;
  }
  const palBase = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    const step = Math.round(NIGHT * 10);
    return step ? nightPal(dark, step) : dark ? PAL.dark : PAL.light;
  };
  const pal = () => (isEv() ? palBase().mono : palBase());

  /* A pista segue a marcação sem nome do levantamento (y 68,4–75, o traçado da BR-405), com acostamento;
     antes dela fica a ilha do meio-fio com as árvores (marcação "meio fio"). */
  const ROAD_Y0 = 66.2, ROAD_Y1 = 76.6, ROAD_MID = 71.4;
  /* Faixa de pedestres na BR, em frente à portaria (satélite). */
  const CROSS_X = 14, CROSS_W = 4;
  /* Planta do prédio de apartamentos: frente para a rodovia (lado -y), lateral para a rua de terra (lado -x). */
  const APTO = [[14.2, 95.6], [34.6, 95.6], [34.6, 120.6], [14.2, 120.6]];
  /* Alturas adotadas: 4,5 m por pavimento + 0,3 m de cobertura. */
  const BUILDINGS = geom([
    /* Pé-direito de 3,00 m (dissertação de 2012): 3 pavimentos de cerca de 3,45 m + platibanda que esconde o telhado.
       O pátio interno aberto é o da planta de 2012. */
    { id: 'principal', el: 0, h: 11.7, floors: 3, label: 'Bloco principal', at: [4, -34], court: [[-16.53, -36.61], [4.88, -36.61], [7.4, -30.8], [-16.53, -30.8]], ridges: true },
    { id: 'anexo', el: 1, h: 4.8, floors: 1, label: 'Anexo', at: [-44, -96], skylight: XT.skylight },
    { id: 'laboratorios', el: 3, h: 9.3, floors: 2, label: 'Bloco dos Laboratórios', at: [-47, 9], solar: 0.86 },
    { id: 'cantina', el: 4, h: 4.8, floors: 1, label: 'Cantina', at: [-61, -36], solar: 0.88 },
    { id: 'diretoria', el: 6, h: 4.8, floors: 1, label: 'Direção Geral', at: [26, 3] },
    { id: 'biblioteca', el: 7, h: 4.8, floors: 1, label: 'Biblioteca', at: [-78, -69] },
    /* Duas entradas na frente, como na foto da rua: pedestres pela portaria (pórtico vermelho com cobertura)
       e, à esquerda de quem chega pela rodovia, o portão de veículos para o estacionamento. */
    { id: 'portaria', el: 8, h: 3.35, floors: 0, kind: 'gate', label: 'Portaria', at: [15, 48] },
    { id: 'portao-veiculos', pontos: [[1.5, 47.9], [8.5, 47.9], [8.5, 48.8], [1.5, 48.8]], h: 2.6, kind: 'gate', vehicles: true, noLabel: true },
    /* Resto do campus: fora da programação do evento. */
    { id: 'auxiliar', pontos: F('predio auxiliar'), h: 4.8, floors: 1, label: 'Prédio auxiliar', at: [-12.7, -62.8], rear: true, viewT: 3.64 },
    { id: 'coliseu', pontos: F('colisel'), h: 3.2, kind: 'hex', label: 'Coreto', at: [-31.7, -69], rear: true, viewT: 3.64 },
    { id: 'centro-medico', pontos: F('centro medico'), h: 4.8, floors: 1, label: 'Centro médico', at: [-76, -38], rear: true },
    { id: 'vestiario', pontos: F('vestiario'), h: 4.8, floors: 1, label: 'Vestiário', at: [-79, -49], rear: true },
    { id: 'obelisco', pontos: [[8, 14.7], [9.3, 14.7], [9.3, 15.2], [8, 15.2]], panel: [[7.85, 15.2], [9.05, 15.2], [9.05, 15.42], [7.85, 15.42]], h: 5.6, kind: 'stele', label: 'Obelisco', at: [8.6, 15] },
    { id: 'manutencao', pontos: F('quartinho de manutencao'), h: 3, floors: 0, noLabel: true },
    { id: 'ginasio', pontos: F('quadra'), h: 8, rise: 3.6, kind: 'gym', label: 'Ginásio', at: [-100, -108], rear: true },
    /* Em construção (informado pelo usuário): estrutura de concreto de dois andares, sem fechamento, com uma grua. */
    { id: 'predio-nadic', pontos: F('predio nadic 2 andares'), h: 9.4, floors: 2, kind: 'obra', label: 'Novo prédio (em obras)', at: [-70, -140], rear: true },
    { id: 'academia', pontos: F('Polígono sem título'), h: 4.8, floors: 1, label: 'Academia', at: [-113, -151], rear: true },
    { id: 'estufa', pontos: F('jardim (estufa simples)'), h: 2.8, kind: 'greenhouse', label: 'Estufa', at: [-112, -212], rear: true },
    { id: 'casa-mel', pontos: F('casa do mel'), h: 4.8, floors: 1, tile: true, label: 'Casa do Mel', at: [-148, -269], rear: true },
    { id: 'seu-assis', pontos: F('seu assis (restaurante famioliar ao lado)'), h: 4.8, floors: 1, tile: true, solarHalf: true, label: 'Seu Assis', at: [-124, -22], rear: true },
    /* Vizinhos do outro lado da rodovia, pelo satélite e pelas fotos da rua.
       O prédio de apartamentos (térreo de lojas e três andares) vai além da marcação do levantamento, que cobre só o telhado de telha;
       a Elétrica é o bar coberto de telha metálica colado nos fundos dele, aberto para a rua lateral. */
    { id: 'apartamentos', pontos: APTO, tileRoof: [[21.4, 95.6], [34.6, 95.6], [34.6, 120.6], [21.4, 120.6]], h: 13.4, floors: 4, kind: 'apto', label: 'Apartamentos', at: [24, 108], rear: true },
    { id: 'brisanet', pontos: [[-128, 120], [-66, 120], [-66, 152], [-128, 152]], h: 8, kind: 'loja', label: 'Brisanet', at: [-97, 136], rear: true },
    { id: 'eletrica', pontos: [[15.5, 121.2], [30.5, 121.2], [30.5, 141], [15.5, 141]], h: 4, kind: 'bar', label: 'Elétrica', at: [23, 131], rear: true },
  ]);
  const COVERS = geom([
    { id: 'patio', el: 5, h: 7.2, label: 'Pátio', at: [0, -2], wood: false },
    { id: 'coberta', el: 18, h: 4.8, label: 'Coberta', at: [-48, -39], wood: true, noLabel: true },
  ]);
  /* Áreas sem volume, desenhadas no chão. */
  const FLATS = geom([
    { id: 'piscina', pontos: F('area da piscina'), h: 0, label: 'Piscina', at: [-141, -171], rear: true },
    { id: 'volei', pontos: F('quadra de volei'), h: 0, label: 'Vôlei', at: [-91, -157], rear: true },
    { id: 'campo', pontos: F('campo de futeboll'), h: 0, label: 'Campo', at: [-160, -199], rear: true },
  ]);
  /* Auditório: não tem marcação própria. Fica na ala oeste do bloco principal, como na planta interna e no rótulo do mapa. */
  const clipX = (p, x, keepWest) => {
    const inside = (q) => (keepWest ? q[0] <= x : q[0] >= x); const out = [];
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length];
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) { const t = (x - a[0]) / (b[0] - a[0]); out.push([x, a[1] + (b[1] - a[1]) * t]); }
    });
    return out;
  };
  /* Divisa leste do auditório: a parede dele na planta de 2012 (x 216 da figura), levada para o mapa. */
  const AUD_X = window.PLAN && window.PLAN.world ? +(window.PLAN.world.x0 + 216 * window.PLAN.world.sx).toFixed(2) : -26;
  /* O auditório é um pavimento só, bem alto, mas mais baixo que o bloco: dos andares de cima se vê o telhado dele.
     O canto chanfrado do levantamento vira a fachada curva da foto. */
  const AUD_H = 9;
  const curveCorner = (p) => {
    const i = p.findIndex((q) => Math.abs(q[0] + 38.427) < 0.01 && Math.abs(q[1] + 29.499) < 0.01);
    const j = p.findIndex((q) => Math.abs(q[0] + 32.192) < 0.01 && Math.abs(q[1] + 19.452) < 0.01);
    if (i < 0 || j < 0 || j < i) return p;
    const a = p[i], e = p[j], k = [a[0], e[1]]; const arc = [];
    for (let n = 0; n <= 10; n++) { const t = n / 10; arc.push([(1 - t) ** 2 * a[0] + 2 * t * (1 - t) * k[0] + t * t * e[0], (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * k[1] + t * t * e[1]]); }
    return [...p.slice(0, i), ...arc, ...p.slice(j + 1)];
  };
  const BP = BUILDINGS.find((b) => b.id === 'principal');
  const PIECES = { auditorio: curveCorner(clipX(BP.p, AUD_X, true)), principal: clipX(BP.p, AUD_X, false) };
  const ZONES = [{ id: 'auditorio', p: PIECES.auditorio, h: AUD_H, label: 'Auditório', at: [-34, -40], evOnly: true, sub: true }];
  const ALL = [...BUILDINGS, ...COVERS, ...FLATS, ...ZONES];
  const byId = (id) => ALL.find((b) => b.id === id);
  /* Caminhos sugeridos a partir da portaria, por áreas abertas. */
  const START = [15, 47];
  const ROUTES = {
    principal: [START, [13, 11], [15, -4], [16.5, -15.5]],
    patio: [START, [13, 11], [6, 3]],
    diretoria: [START, [13, 11], [19, 3]],
    laboratorios: [START, [13, 11], [-24, 11], [-30, 9]],
    auditorio: [START, [13, 11], [-23, 8], [-27, -8], [-31, -17]],
    cantina: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-52.5, -24]],
    biblioteca: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50.5, -58.5], [-59, -58.5]],
    anexo: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-41, -74], [-37.5, -80]],
    /* Bebedouros: o mesmo caminho do lugar onde ficam, até o ponto. */
    'bebedouro-anexo': [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-41, -74], [-37.5, -80], [-32.5, -81.5]],
    'bebedouro-cantina': [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50.5, -58.5], [-61.5, -57.8]],
    coliseu: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-44.6, -66], [-38.5, -62], [-37.8, -65]],
    auxiliar: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-44.6, -66], [-39, -61.5], [-28, -61.5], [-22.5, -66]],
    'centro-medico': [START, [-20, 41], [-46, 40], [-84, -38], [-82.5, -36.5]],
    vestiario: [START, [-20, 41], [-46, 40], [-90, -50], [-87.5, -46]],
    ginasio: [START, [-20, 41], [-46, 40], [-98.5, -65], [-122, -103], [-117, -101]],
    academia: [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-130, -148], [-124, -152]],
    piscina: [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-138, -152], [-135, -160]],
    'predio-nadic': [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-122, -129], [-96, -142.500], [-90, -141]],
    volei: [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-122, -129], [-96, -142.500], [-93, -146.500]],
    campo: [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-122, -129], [-96, -142.500], [-74, -160], [-100, -196], [-130, -195]],
    estufa: [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-122, -129], [-96, -142.500], [-74, -160], [-100, -198], [-106, -204]],
    'casa-mel': [START, [-20, 41], [-46, 40], [-98.5, -65], [-132, -122], [-122, -129], [-96, -142.500], [-74, -160], [-100, -198], [-98, -216], [-125, -245], [-143, -262]],
    'seu-assis': [START, [-20, 52], [-56, 53], [-78.5, 8.4], [-110, -53], [-118.4, -42.4], [-122, -37.5]],
    obelisco: [START, [13, 30], [12.6, 16]],
    apartamentos: [START, [CROSS_X, 60], [CROSS_X, 78], [15.5, 95]],
    eletrica: [START, [CROSS_X, 60], [CROSS_X, 78], [11, 84], [11, 128], [15.3, 128]],
    brisanet: [START, [CROSS_X, 60], [CROSS_X, 78], [-20, 78.5], [-74, 78.5], [-112, 79], [-118, 119]],
    portaria: [START],
  };

  /* ---------- geometria ---------- */
  const centroid = (p) => p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
  const inPoly = (x, y, p) => {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  };
  const area = (p) => Math.abs(p.reduce((s, q, i) => { const n = p[(i + 1) % p.length]; return s + q[0] * n[1] - n[0] * q[1]; }, 0) / 2);
  const mix = (rgb, f) => `rgb(${rgb.map((c) => Math.round(Math.min(255, c * f))).join(',')})`;
  function rng(seed) { let x = seed; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); }

  /* ---------- objetos fixos ---------- */
  const trees = [];
  const addTree = (x, y, r, tone = 0) => trees.push({ x, y, r, tone, kind: Math.abs(Math.round(x * 3 + y * 7)) % 3 });
  /* Jardim à direita da entrada: contorno, ponto de encontro dos caminhos, pontas dos caminhos, copas e o poste. */
  const GARDEN = {
    edge: [[18.4, 13.2], [33.6, 11.6], [51.2, 44.4], [17.7, 42.9]],
    hub: [29.5, 27.3],
    spokes: [[22.1, 13.2], [19.3, 26.7], [36.6, 19.0], [20.8, 43.1], [46.1, 44.2]],
    trees: [[21.1, 19.0], [29.6, 17.0], [33.9, 22.5], [42.5, 37.5], [22.6, 29.7], [27.0, 37.7], [36.5, 31.4], [24.2, 23.2], [39.0, 27.5]],
    lamp: [25.9, 24.8],
  };
  [14, 26, 28, 29, 31, 32, 33, 34].forEach((i) => addTree(pts(i)[0][0], pts(i)[0][1], 2.6, i % 3));
  [16, 17, 30].forEach((i) => addTree(pts(i)[0][0], pts(i)[0][1], 4.2, 1));
  GARDEN.trees.forEach((q, i) => addTree(q[0], q[1], 3 + (i % 3) * 0.5, i % 4));
  function fillTrees(i, n, seed) {
    const p = pts(i); const r = rng(seed);
    const xs = p.map((q) => q[0]); const ys = p.map((q) => q[1]);
    let k = 0, guard = 0;
    while (k < n && guard++ < 500) {
      const x = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs));
      const y = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys));
      if (inPoly(x, y, p)) { addTree(x, y, 2.1 + r() * 0.8, k % 3); k++; }
    }
  }
  fillTrees(10, 8, 7); fillTrees(11, 9, 19);
  /* Árvores vistas nas fotos de satélite (posição aproximada): concentradas na Casa do Mel,
     só num lado da área da piscina e quase nenhuma entre a casa do Mel e a quadra de vôlei. */
  const SOLIDS = [...BUILDINGS, ...COVERS].filter((b) => b.id !== 'coberta').map((b) => b.p);
  const photoTree = ([x, y], r, tone) => { if (!SOLIDS.some((p) => inPoly(x, y, p))) addTree(x, y, r, tone); };
  [[-163.6, -259.3], [-145.9, -284], [-138.2, -274.3], [-147.4, -244.3], [-145.7, -230.3], [-134.4, -235.3], [-118.8, -242.7], [-132.2, -261.2]].forEach((q, i) => photoTree(q, 2.4 + (i % 3) * 0.6, i % 4));
  photoTree([-112.1, -233], 1.5, 3);
  (XT.poolTrees || []).forEach((q, i) => photoTree(q, 3.5, i % 2));
  [[-71.2, -59.5], [-64, -62], [-56.5, -63.8], [-56.9, -69.3], [-60.1, -76.3], [-64, -82.1], [-70.6, -90.1], [-45.1, -58.4], [-43.2, -52.8], [-33, -54.9], [-44.1, -73.8], [-76.8, -25.4], [-74.7, -21]].forEach((q, i) => photoTree(q, 2.6 + (i % 2) * 0.7, i % 3));
  [[-41.7, -66.8], [-27, -75]].forEach((q) => photoTree(q, 1.5, 1));
  /* Fora do muro, a leste. */
  [[-15.5, -111.6], [-14.2, -125.2], [-4.6, -112], [3.5, -131.2], [-16.3, -148.8], [-93.1, -263.8], [-48.3, -219.7], [-70.5, -192.5], [-63.1, -183.3]].forEach((q, i) => addTree(q[0], q[1], 3.2 + (i % 2), i % 3));
  const tanks = LIMPO.tanks || FP('caixa dagua');
  const PLAZA = F('caminho entre bloco e anexo');
  const BED = XT.bed;
  const STAIR_AT = [-37.1, -66.9];
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const shrink = (p, k) => { const m = centroid(p); return p.map((q) => lerp2(m, q, k)); };
  const bushes = [];
  [19, 21].forEach((i) => {
    const p = pts(i);
    p.forEach((a, j) => {
      const b = p[(j + 1) % p.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(L / 2.4));
      for (let t = 0; t < n; t++) bushes.push({ x: a[0] + ((b[0] - a[0]) * t) / n, y: a[1] + ((b[1] - a[1]) * t) / n, r: 0.95 });
    });
  });
  /* Arbustos da entrada: só duas fileiras retas, uma de cada lado do caminho, do portão até o pátio. */
  const HEDGES = [[[10.1, 11.4], [11.3, 11.4], [11.3, 44.6], [10.1, 44.6]], [[15.2, 11.4], [16.4, 11.4], [16.4, 44.6], [15.2, 44.6]]];
  HEDGES.forEach((q) => { const x = (q[0][0] + q[1][0]) / 2; for (let y = q[0][1] + 0.7; y < q[2][1]; y += 1.45) bushes.push({ x, y, r: 0.78, bloom: true }); });

  /* ---------- câmera e estado ---------- */
  const cam = { x: -60, y: -105, z: 1, t: 0.5, k: 0.64, hv: 1 }; // k: achatamento do chão; hv: 0 é a vista de cima
  let flat = !Q.view3d;
  const sv = { mix: 0, focus: 0, floor: 1, dim: 0, rise: 0 }; // mix 1 = prédio aberto em andares; focus 1 = um andar só
  const baseCanvas = document.createElement('canvas');
  let out = null;
  let canvas = null, ctx = null, W = 0, H = 0, dpr = 1, insetT = 0, insetB = 0, insetAnim = null;
  let selected = null, routeId = null, routeP = 0, onPick = null;
  let raf = 0, tween = null, growStart = null, grown = false, routeStart = 0;
  let cosT = 1, sinT = 0;

  const syncAngle = () => { cosT = Math.cos(cam.t); sinT = Math.sin(cam.t); };
  const P = (x, y, h = 0) => {
    const dx = x - cam.x, dy = y - cam.y;
    return [W / 2 + (dx * cosT - dy * sinT) * cam.z, (insetT + H - insetB) / 2 + (dx * sinT + dy * cosT) * cam.k * cam.z - h * HV * cam.hv * cam.z];
  };
  const depth = (x, y) => (x - cam.x) * sinT + (y - cam.y) * cosT;
  function poly(p, h = 0) {
    ctx.beginPath();
    p.forEach((q, i) => { const s = P(q[0], q[1], h); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); });
    ctx.closePath();
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const signedScreen = (p) => {
    let s = 0;
    p.forEach((q, i) => { const a = P(q[0], q[1]); const n = p[(i + 1) % p.length]; const b = P(n[0], n[1]); s += a[0] * b[1] - b[0] * a[1]; });
    return s;
  };
  /* Revelação do evento na entrada: as partes do evento vão sendo pintadas com a cor delas, numa varredura,
     uma depois da outra, com o resto do campus ainda nas cores normais. */
  let paintStart = 0;
  const PAINT_ORDER = { patio: 0, principal: 260, cantina: 560 };
  const paintOf = (id) => (paintStart && id in PAINT_ORDER ? Math.max(0, Math.min(1, (performance.now() - paintStart - PAINT_ORDER[id]) / 760)) : 0);
  function paintOver(b, c, draw) {
    const p = paintOf(b.id); if (p <= 0) return;
    const e = 1 - (1 - p) ** 3;
    const hh = b.id === 'principal' ? Math.max(b.h, AUD_H) : b.h;
    const sp = []; b.p.forEach((q) => { sp.push(P(q[0], q[1], 0), P(q[0], q[1], hh)); });
    const xs = sp.map((q) => q[0]), ys = sp.map((q) => q[1]);
    const x0 = Math.min(...xs) - 2, x1 = Math.max(...xs) + 2, y0 = Math.min(...ys) - 2, y1 = Math.max(...ys) + 2;
    const xe = x0 + (x1 - x0) * e;
    const keep = mode; mode = 'evento';
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, xe - x0, y1 - y0); ctx.clip();
    draw(palBase().mono);
    ctx.restore(); mode = keep;
    if (p < 1) {
      /* Borda da tinta: um brilho fino que anda junto. */
      const g = ctx.createLinearGradient(xe - 10, 0, xe + 2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.55)');
      ctx.fillStyle = g; ctx.fillRect(xe - 10, y0, 12, y1 - y0);
    }
  }
  let introRunning = false;
  const growOf = (x, y) => {
    if (grown || growStart === null) return 1;
    const delay = Math.min(520, Math.hypot(x - 15, y - 47) * 2.1);
    const t = Math.max(0, Math.min(1, (performance.now() - growStart - delay) / 620));
    return 1 - (1 - t) ** 3;
  };

  /* ---------- entorno ---------- */
  const onScreen = (x, y, m = 60) => { const s = P(x, y); return s[0] > -m && s[0] < W + m && s[1] > -m && s[1] < H + m; };
  function smooth(L) {
    ctx.beginPath();
    let a = P(L[0][0], L[0][1]); ctx.moveTo(a[0], a[1]);
    for (let i = 1; i < L.length - 1; i++) { const s = P(L[i][0], L[i][1]); const n = P(L[i + 1][0], L[i + 1][1]); ctx.quadraticCurveTo(s[0], s[1], (s[0] + n[0]) / 2, (s[1] + n[1]) / 2); }
    a = P(L[L.length - 1][0], L[L.length - 1][1]); ctx.lineTo(a[0], a[1]);
  }
  function blob(L) {
    ctx.beginPath();
    const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    const m0 = P(...mid(L[L.length - 1], L[0])); ctx.moveTo(m0[0], m0[1]);
    L.forEach((q, i) => { const s = P(q[0], q[1]); const e = P(...mid(q, L[(i + 1) % L.length])); ctx.quadraticCurveTo(s[0], s[1], e[0], e[1]); });
    ctx.closePath();
  }
  const LAND_PATCHES = (() => { const r = rng(91); return Array.from({ length: 46 }, () => { const x = -480 + r() * 860, y = -520 + r() * 880, s = 40 + r() * 90; return [[x, y], [x + s, y + s * 0.15], [x + s * 0.95, y + s * 0.8], [x + s * 0.1, y + s]]; }); })();
  const SCRUB = (() => { const r = rng(37); const out = []; for (let g = 0; out.length < 150 && g < 900; g++) { const x = -470 + r() * 850, y = -500 + r() * 590; if (!inPoly(x, y, pts(22))) out.push([x, y, 1.6 + r() * 2.6]); } return out; })();
  function drawSurroundings(c) {
    ctx.fillStyle = c.land; poly(rect(-1200, -1200, 1200, 1200)); ctx.fill();
    if (Q.ground > 1) { ctx.fillStyle = c.land2; LAND_PATCHES.forEach((q) => { blob(q); ctx.fill(); }); }
    ENT.green.forEach((g) => { blob(g.pts); ctx.fillStyle = c.scrub; ctx.fill(); if (Q.ground > 0) { blob(shrink(g.pts, 0.62)); ctx.fillStyle = c.scrub2; ctx.fill(); } });
    ctx.fillStyle = c.scrubDot; ctx.beginPath();
    if (Q.ground > 1) SCRUB.forEach(([x, y, r]) => { const s = P(x, y); if (s[0] < -9 || s[0] > W + 9 || s[1] < -9 || s[1] > H + 9) return; const R = Math.max(0.7, r * cam.z); ctx.moveTo(s[0] + R, s[1]); ctx.ellipse(s[0], s[1], R, R * cam.k, 0, 0, 7); });
    ctx.fill();
    ENT.lots.forEach((l) => { poly(l.pts); ctx.fillStyle = c.lot; ctx.fill(); });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lane = (L, w) => { smooth(L); ctx.strokeStyle = c.dirtEdge; ctx.lineWidth = Math.max(1.4, (w + 0.9) * cam.z); ctx.stroke(); smooth(L); ctx.strokeStyle = c.dirt; ctx.lineWidth = Math.max(0.8, w * cam.z); ctx.stroke(); };
    if (Q.ground > 0 || cam.z < 2.5) ENT.streets.forEach((L) => lane(L, 4.5));
    /* Rua de terra ao lado do prédio dos apartamentos, para onde a Elétrica abre (satélite). */
    if (Q.ground > 0 || cam.z < 2.5) lane([[7.5, 77], [9.5, 100], [12.5, 174], [13, 205]], 6);
    ENT.roads.forEach((r) => lane(r.pts, r.w));
    if (ENT.parking) {
      poly(ENT.parking); ctx.fillStyle = c.parkLot; ctx.fill();
      /* Vagas de carro na metade norte; a metade sul fica com as coberturas das motos. */
      if (cam.z > 0.9) { ctx.strokeStyle = c.parkStall; ctx.lineWidth = 0.7; ctx.beginPath(); for (let x = -128; x <= -95; x += 3) { const s = P(x, 101); const e = P(x, 106); const s2 = P(x, 113); const e2 = P(x, 118); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.moveTo(s2[0], s2[1]); ctx.lineTo(e2[0], e2[1]); } ctx.stroke(); }
    }
  }
  const rotRect = (cx, cy, w, d, deg) => { const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * co - v * si, cy + u * si + v * co]); };
  /* Bairro do outro lado da rodovia: casas ao longo das ruas, em posição ilustrativa. */
  const HOUSES = (() => {
    const out = ENT.small.map((h, i) => ({ p: rotRect(h.c[0], h.c[1], h.w, h.d, h.a), h: h.h, m: h.c, tone: i }));
    const r = rng(61);
    const blocked = (x, y) => y < 104 || ENT.big.some((b) => inPoly(x, y, shrink(b.pts, 1.3))) || (ENT.parking && inPoly(x, y, shrink(ENT.parking, 1.2))) || inPoly(x, y, pts(23)) || (x > 8 && x < 40 && y > 76 && y < 148) || (x > -136 && x < -58 && y > 70 && y < 160);
    ENT.streets.forEach((L) => {
      for (let i = 0; i < L.length - 1; i++) {
        const a = L[i], b = L[i + 1]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
        for (let s = 12; s < len - 8; s += 21) [1, -1].forEach((side) => {
          if (r() < 0.32) return;
          const x = a[0] + ((b[0] - a[0]) * s) / len + nx * side * 9.5, y = a[1] + ((b[1] - a[1]) * s) / len + ny * side * 9.5;
          if (blocked(x, y)) return;
          out.push({ p: rotRect(x, y, 10, 7.5, ang), h: 3.2, m: [x, y], tone: out.length });
        });
      }
    });
    return out;
  })();
  function drawHouse(t, c) {
    const atlasH = SPR && IMG[`houses-${tintKey()}`];
    if (atlasH) {
      const a = P(t.m[0], t.m[1]); const S = SPR.houses[t.tone % SPR.houses.length]; const v = cam.hv < 0.5 ? S.top : S.tilt;
      const k = (5.2 / S.radius) * v.mpp * cam.z;
      ctx.drawImage(atlasH, v.x, v.y, v.w, v.h, a[0] - v.ox * k, a[1] - v.oy * k, v.w * k, v.h * k);
      return;
    }
    if (cam.z < 0.75) { poly(t.p, t.h); ctx.fillStyle = c.houseRoofs[t.tone % c.houseRoofs.length]; ctx.fill(); return; }
    const roof = c.houseRoofs[t.tone % c.houseRoofs.length];
    drawExtruded(t.p, t.h, c, { wall: c.houseWall, roof, edge: roof, floors: 0 });
  }
  /* Vegetação densa das áreas verdes. */
  ENT.green.forEach((g, gi) => {
    const r = rng(17 + gi * 11); const xs = g.pts.map((q) => q[0]), ys = g.pts.map((q) => q[1]);
    for (let n = 0, guard = 0; n < g.trees && guard < 600; guard++) {
      const x = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys));
      if (inPoly(x, y, g.pts)) { addTree(x, y, 3.4 + r() * 2.6, n % 4); n++; }
    }
  });
  ENT.trees.forEach((q, i) => addTree(q[0], q[1], 2.8 + (i % 2) * 0.8, i % 3));
  trees.forEach((t) => { t.far = !inPoly(t.x, t.y, pts(22)) && !(t.y > 46 && t.y < 58); });

  /* ---------- chão ---------- */
  /* Via de serviço: faixa de 6,5 m paralela aos dois trechos do muro oeste. */
  const ROAD_W = 6.5;
  const offsetIn = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L; const s = nx > 0 ? 1 : -1; return [nx * s * ROAD_W, ny * s * ROAD_W]; };
  const M6 = pts(22)[6], M7 = pts(22)[7], M8 = pts(22)[8];
  const oA = offsetIn(M8, M7), oB = offsetIn(M7, M6);
  const ROAD = [[M8, M7, [M7[0] + oA[0], M7[1] + oA[1]], [M8[0] + oA[0], M8[1] + oA[1]]], [M7, M6, [M6[0] + oB[0], M6[1] + oB[1]], [M7[0] + oB[0], M7[1] + oB[1]]]];
  const ROAD_EDGE = [[M8[0] + oA[0], M8[1] + oA[1]], [M7[0] + (oA[0] + oB[0]) / 2, M7[1] + (oA[1] + oB[1]) / 2], [M6[0] + oB[0], M6[1] + oB[1]]];
  function drawGround(c) {
    ctx.fillStyle = c.sky; ctx.fillRect(0, 0, W, H);
    drawSurroundings(c);
    /* BR-405: duas faixas com eixo em y≈70, como no satélite. Do outro lado, o acostamento é de terra. */
    ctx.fillStyle = c.road; poly(rect(-900, ROAD_Y0, 900, ROAD_Y1)); ctx.fill();
    ctx.fillStyle = c.walk; poly(rect(-900, 49, 900, ROAD_Y0)); ctx.fill();
    if (!isEv() && Q.roofTex) fillWorldTex('cobble', 0, false);
    const hline = (y) => { const a = P(-900, y), e = P(900, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); };
    ctx.strokeStyle = c.lane; ctx.lineWidth = Math.max(0.6, 0.14 * cam.z); hline(ROAD_Y0 + 0.4); hline(ROAD_Y1 - 0.4);
    ctx.strokeStyle = c.laneMid; ctx.lineWidth = Math.max(0.8, 0.16 * cam.z); hline(ROAD_MID - 0.18); hline(ROAD_MID + 0.18);
    /* Faixa de pedestres: listras brancas no sentido da pista. */
    ctx.fillStyle = c.zebra;
    for (let y = ROAD_Y0 + 0.5; y < ROAD_Y1 - 0.6; y += 1) { poly(rect(CROSS_X - CROSS_W / 2, y, CROSS_X + CROSS_W / 2, y + 0.5)); ctx.fill(); }
    /* Poças de luz dos postes à noite. */
    if (NIGHT > 0.05 && !Q.lean) {
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
      const pool = (x, y, r, a) => {
        const m = P(x, y); if (m[0] < -200 || m[0] > W + 200 || m[1] < -200 || m[1] > H + 200) return;
        const g = ctx.createRadialGradient(m[0], m[1], 0, m[0], m[1], r * cam.z);
        g.addColorStop(0, `rgba(255,196,110,${(a * NIGHT).toFixed(3)})`); g.addColorStop(1, 'rgba(255,196,110,0)');
        ctx.fillStyle = g; poly(Array.from({ length: 18 }, (_, i) => [x + Math.cos((i / 18) * 6.283) * r, y + Math.sin((i / 18) * 6.283) * r])); ctx.fill();
      };
      POLES.forEach((x) => pool(x, POLE_Y + 2, 9, 0.34));
      pool(15, 47, 8, 0.42); pool(15.3, 131, 7, 0.28); pool(-98, 98, 16, 0.22); pool(24, 92, 6, 0.2);
      /* Pátio coberto bem iluminado, a portaria acesa e o poste do jardim. */
      [[-12, -9], [0, -9], [12, -9], [-12, 4], [0, 4], [12, 4]].forEach(([x, y]) => pool(x, y, 10, 0.3));
      pool(GARDEN.lamp[0], GARDEN.lamp[1], 6, 0.3);
      ctx.globalCompositeOperation = prev;
    }
    /* Calçada de concreto na frente do prédio dos apartamentos. */
    ctx.fillStyle = c.paved; poly([[13.5, ROAD_Y1], [34.6, ROAD_Y1], [34.6, 95.6], [13.5, 95.6]]); ctx.fill();
    ctx.fillStyle = c.grass; poly(pts(25)); ctx.fill();
    /* A ilha do meio-fio abre na entrada de veículos. */
    ctx.fillStyle = c.walk; poly(rect(1.5, 61, 8.5, ROAD_Y0)); ctx.fill();

    ctx.save(); poly(pts(22)); ctx.clip();
    ctx.fillStyle = c.soil; poly(rect(-900, -900, 900, 900)); ctx.fill();
    ctx.fillStyle = c.soil2;
    const r = rng(5);
    for (let i = 0; i < 22; i++) { const x = -190 + r() * 200, y = -290 + r() * 170; const s = 14 + r() * 26; poly([[x, y], [x + s, y + s * 0.2], [x + s * 0.9, y + s], [x - s * 0.1, y + s * 0.8]]); ctx.fill(); }
    /* Mata em volta da Casa do Mel. */
    ctx.fillStyle = c.grove; poly([[-190, -290], [-130, -295], [-112, -240], [-128, -226], [-152, -226]]); ctx.fill();
    /* Gramados da frente, da lateral e entre os blocos. */
    ctx.fillStyle = c.grass;
    poly(rect(11, 11, 60, 50)); ctx.fill();
    /* Chão comum entre os blocos e em volta do Coliseu. */
    ctx.fillStyle = c.earth;
    poly([[-112, -62], [-72, -58], [-72, 11], [-40, 60], [-70, 60]]); ctx.fill();
    poly([[-59, -52], [-2, -53], [-2, -70], [-23, -91], [-38, -117], [-66, -100], [-58, -70]]); ctx.fill();
    ctx.fillStyle = c.park; poly(rect(-200, 11, 11, 60)); ctx.fill();
    if (!isEv() && Q.roofTex) fillWorldTex('cobble', 0, false);
    ctx.fillStyle = c.paved;
    poly([[-72, -58], [-58, -52], [24, -52], [37, -12], [37, 11], [-72, 11]]); ctx.fill();
    /* Via de serviço junto ao muro oeste, pátio em frente à academia e pátio das caixas d'água. */
    ROAD.forEach((q) => { poly(q); ctx.fill(); });
    [XT.forecourt, XT.yard, XT.pad].forEach((q) => { poly(q); ctx.fill(); });
    ctx.strokeStyle = c.pathEdge; ctx.lineWidth = Math.max(0.6, 0.16 * cam.z); ctx.lineJoin = 'round';
    ctx.beginPath(); ROAD_EDGE.forEach((q, i) => { const s = P(q[0], q[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
    /* Trilhas de terra no fundo. */
    ctx.strokeStyle = c.trail; ctx.lineWidth = Math.max(1, 1.3 * cam.z); ctx.lineCap = 'round';
    [[[-74, -160], [-100, -198], [-131, -195]], [[-100, -198], [-98, -216], [-125, -245], [-143, -262]], [[-100, -198], [-106, -204]]].forEach((L) => { ctx.beginPath(); L.forEach((q, i) => { const s = P(q[0], q[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); });
    /* Jardim à direita da passarela: canteiro com caminhos de terra que se encontram num ponto, como na imagem
       do usuário (encaixada no mapa pelas árvores do levantamento). */
    ctx.strokeStyle = c.trail; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, 1.3 * cam.z); poly(GARDEN.edge); ctx.stroke();
    ctx.lineWidth = Math.max(0.8, 1.1 * cam.z);
    GARDEN.spokes.forEach((q) => { const s = P(GARDEN.hub[0], GARDEN.hub[1]); const e = P(q[0], q[1]); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); });
    ctx.restore();
    FLATS.forEach((b) => drawFlat(b, c));

    [19, 21].forEach((i) => { ctx.fillStyle = c.grass; poly(pts(i)); ctx.fill(); });
    ctx.fillStyle = c.path; ctx.strokeStyle = c.pathEdge; ctx.lineWidth = 1;
    poly(pts(9)); ctx.fill(); ctx.stroke();
    /* Caminho entre o bloco e o anexo: faixa pavimentada com meio-fio, em volta do canteiro do Coliseu. */
    if (PLAZA) {
      ctx.lineJoin = 'round';
      poly(PLAZA); ctx.fillStyle = c.path; ctx.fill(); ctx.strokeStyle = c.pathEdge; ctx.lineWidth = Math.max(1, 0.34 * cam.z); ctx.stroke();
      poly(BED); ctx.fillStyle = c.earth; ctx.fill(); ctx.strokeStyle = c.rim; ctx.lineWidth = Math.max(1, 0.42 * cam.z); ctx.stroke();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = c.path; ctx.lineWidth = Math.max(1.4, 0.9 * cam.z);
    ctx.beginPath(); pts(20).forEach((q, k) => { const s = P(q[0], q[1]); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
    /* Piso dos prédios e do pátio. */
    ctx.fillStyle = c.path; poly(pts(5)); ctx.fill();
    /* Entrada de veículos: meio-fio amarelo no meio, do portão até o fim dos cones. */
    ctx.strokeStyle = c.curbYellow; ctx.lineWidth = Math.max(0.8, 0.3 * cam.z); ctx.lineCap = 'butt';
    ctx.beginPath(); let ya = P(5, 49.4); ctx.moveTo(ya[0], ya[1]); ya = P(5, 59.4); ctx.lineTo(ya[0], ya[1]); ctx.stroke();
    if (isEv()) { ctx.fillStyle = c.evGround; poly(pts(5)); ctx.fill(); poly(pts(9)); ctx.fill(); }
  }

  /* ---------- áreas no chão ---------- */
  const quadAt = (q, u, v) => lerp2(lerp2(q[0], q[1], u), lerp2(q[3], q[2], u), v);
  const line = (a, b) => { const s = P(a[0], a[1]); const e = P(b[0], b[1]); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); };
  /* De gol a gol na direção transversal ao muro. */
  const fieldQuad = (b) => [b.p[0], b.p[3], b.p[2], b.p[1]];
  function drawGoal(q, u, c) {
    const a = quadAt(q, u, 0.42), e = quadAt(q, u, 0.58);
    const a0 = P(a[0], a[1]), a1 = P(a[0], a[1], 2.4), e0 = P(e[0], e[1]), e1 = P(e[0], e[1], 2.4);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.8, 0.2 * cam.z); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]); ctx.stroke();
  }
  /* Grade da piscina: trechos curtos, para a ordem de pintura funcionar. */
  function drawFenceSeg(a, e, c) {
    const H = 1.8;
    const a0 = P(a[0], a[1]), a1 = P(a[0], a[1], H), e0 = P(e[0], e[1]), e1 = P(e[0], e[1], H);
    ctx.fillStyle = c.fenceFill; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(e0[0], e0[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(a1[0], a1[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.fenceBar; ctx.lineWidth = Math.max(0.5, 0.09 * cam.z); ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(e1[0], e1[1]);
    if (cam.z > 1.4) { const n = cam.z > 3 ? 8 : 3; for (let i = 0; i <= n; i++) { const q = lerp2(a, e, i / n); const s = P(q[0], q[1]); const t = P(q[0], q[1], H); ctx.moveTo(s[0], s[1]); ctx.lineTo(t[0], t[1]); } } else { ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); }
    ctx.stroke();
  }
  function drawFlat(b, c) {
    const sel = selected === b.id;
    if (b.id === 'piscina') {
      poly(b.p); ctx.fillStyle = c.deck; ctx.fill();
      const q = F('piscina');
      poly(q); ctx.fillStyle = c.rim; ctx.fill();
      const w = shrink(q, 0.92); poly(w); ctx.fillStyle = c.water; ctx.fill();
      if (cam.z > 1.1) {
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = Math.max(0.6, 0.14 * cam.z); ctx.beginPath();
        for (let i = 1; i < 4; i++) line(quadAt(w, 0.14 + i * 0.03, i / 4), quadAt(w, 0.4 + i * 0.1, i / 4));
        ctx.stroke();
      }
    } else if (b.id === 'volei') {
      poly(b.p); ctx.fillStyle = c.sand; ctx.fill();
      /* lado maior primeiro, para a rede ficar atravessada */
      const long = Math.hypot(b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]) > Math.hypot(b.p[2][0] - b.p[1][0], b.p[2][1] - b.p[1][1]);
      const q = long ? b.p : [b.p[1], b.p[2], b.p[3], b.p[0]];
      poly([quadAt(q, 0.12, 0.14), quadAt(q, 0.88, 0.14), quadAt(q, 0.88, 0.86), quadAt(q, 0.12, 0.86)]);
      ctx.strokeStyle = c.courtLine; ctx.lineWidth = Math.max(0.7, 0.16 * cam.z); ctx.stroke();
    } else if (b.id === 'campo') {
      const q = fieldQuad(b);
      poly(q); ctx.fillStyle = c.field; ctx.fill();
      ctx.strokeStyle = c.fieldLine; ctx.lineWidth = Math.max(0.7, 0.18 * cam.z); ctx.beginPath();
      const box = (u0, u1, v0, v1) => { [[u0, v0, u1, v0], [u1, v0, u1, v1], [u1, v1, u0, v1], [u0, v1, u0, v0]].forEach(([a, d, e, f]) => line(quadAt(q, a, d), quadAt(q, e, f))); };
      box(0.05, 0.95, 0.05, 0.95); line(quadAt(q, 0.5, 0.05), quadAt(q, 0.5, 0.95)); box(0.05, 0.2, 0.28, 0.72); box(0.8, 0.95, 0.28, 0.72);
      for (let i = 0; i < 24; i++) { const a0 = (i / 24) * 6.283, a1 = ((i + 1) / 24) * 6.283; line(quadAt(q, 0.5 + 0.12 * Math.cos(a0), 0.5 + 0.12 * Math.sin(a0)), quadAt(q, 0.5 + 0.12 * Math.cos(a1), 0.5 + 0.12 * Math.sin(a1))); }
      ctx.stroke();
    }
    if (sel) { poly(b.p); ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.stroke(); }
  }

  function drawShadows(c) {
    ctx.fillStyle = c.shadow;
    ctx.beginPath();
    const list = [...BUILDINGS, ...COVERS].filter((b) => b.kind !== 'hex' && b.kind !== 'gate' && b.kind !== 'obra');
    list.forEach((b) => {
      const p = b.p; const g = growOf(...centroid(p));
      const off = [-LIGHT[0] * b.h * SHADOW_K * g, -LIGHT[1] * b.h * SHADOW_K * g];
      const add = (quad) => {
        const s = signedScreen(quad);
        const q = s < 0 ? quad.slice().reverse() : quad;
        q.forEach((v, i) => { const m = P(v[0], v[1]); if (i) ctx.lineTo(m[0], m[1]); else ctx.moveTo(m[0], m[1]); });
        ctx.closePath();
      };
      add(p.map((v) => [v[0] + off[0], v[1] + off[1]]));
      p.forEach((v, i) => { const n = p[(i + 1) % p.length]; add([v, n, [n[0] + off[0], n[1] + off[1]], [v[0] + off[0], v[1] + off[1]]]); });
    });
    ctx.fill('nonzero');
  }

  /* ---------- volumes ---------- */
  function wallQuad(a, b, h0, h1) {
    const A = P(a[0], a[1], h0), B = P(b[0], b[1], h0), C = P(b[0], b[1], h1), D = P(a[0], a[1], h1);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath();
  }
  function shadeOf(a, b, sign) {
    /* normal do chão apontando para fora, em coordenadas do mundo */
    const nx = (b[1] - a[1]) * sign, ny = -(b[0] - a[0]) * sign;
    const L = Math.hypot(nx, ny) || 1;
    return 0.74 + 0.26 * (((nx / L) * LIGHT[0] + (ny / L) * LIGHT[1] + 1) / 2);
  }
  function worldSign(p) { return p.reduce((s, q, i) => { const n = p[(i + 1) % p.length]; return s + q[0] * n[1] - n[0] * q[1]; }, 0) > 0 ? 1 : -1; }

  function fillWorldTex(name, h, ev) {
    if (!Q.roofTex) return false;
    const pat = patternOf(name, ev); if (!pat) return false;
    const O = P(0, 0, h), X = P(1, 0, h), Y = P(0, 1, h); const T = SPR.tex[name]; const s = T.m / T.px;
    ctx.save(); ctx.transform(X[0] - O[0], X[1] - O[1], Y[0] - O[0], Y[1] - O[1], O[0], O[1]); ctx.scale(s, s);
    ctx.fillStyle = pat; ctx.fill(); ctx.restore();
    return true;
  }
  function drawExtruded(p, h, c, opts) {
    const base0 = opts.base || 0;
    const scr = signedScreen(p) > 0 ? 1 : -1;
    const ws = worldSign(p);
    const edges = p.map((a, i) => ({ a, b: p[(i + 1) % p.length] })).filter(({ a, b }) => {
      const A = P(a[0], a[1]), B = P(b[0], b[1]);
      return (B[0] - A[0]) * scr < 0 || false;
    });
    edges.sort((u, v) => depth((u.a[0] + u.b[0]) / 2, (u.a[1] + u.b[1]) / 2) - depth((v.a[0] + v.b[0]) / 2, (v.a[1] + v.b[1]) / 2));
    if (cam.hv > 0.02) edges.forEach(({ a, b }) => {
      const f = shadeOf(a, b, ws);
      wallQuad(a, b, base0, h); ctx.fillStyle = mix(opts.wall, f); ctx.fill();
      const wt = Q.wallTex && opts.tex && opts.floors && cam.z > 0.8 && cam.hv > 0.3 && h - base0 > 1 ? patternOf('wall', opts.ev) : null;
      if (wt) {
        /* Fachada real: módulos inteiros por parede e um por andar. */
        const D = P(a[0], a[1], h), Q = P(b[0], b[1], h), A0 = P(a[0], a[1], base0);
        const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3.2));
        const T = SPR.tex.wall;
        ctx.save(); ctx.transform((Q[0] - D[0]) / (n * T.w), (Q[1] - D[1]) / (n * T.w), (A0[0] - D[0]) / (opts.floors * T.h), (A0[1] - D[1]) / (opts.floors * T.h), D[0], D[1]);
        ctx.fillStyle = wt; ctx.fill(); ctx.restore();
        ctx.fillStyle = `rgba(18,28,58,${((1 - f) * 0.7).toFixed(3)})`; ctx.fill();
        return;
      }
      /* Faixas de janelas por pavimento. */
      if (opts.floors && h > 1 && cam.z > 0.9 && Q.view3d) {
        const per = h / opts.floors;
        ctx.fillStyle = opts.window;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = cam.z > 2.1 && !Q.lean ? Math.floor(L / 3.2) : 1;
        for (let k = 0; k < opts.floors; k++) {
          for (let w = 0; w < n; w++) {
            const t0 = n === 1 ? 0.04 : (w + 0.18) / n; const t1 = n === 1 ? 0.96 : (w + 0.82) / n;
            const u = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]; const v = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            wallQuad(u, v, per * k + per * 0.34, per * k + per * 0.72); ctx.fill();
          }
        }
      }
    });
    if (opts.band && cam.hv > 0.02) edges.forEach(({ a, b }) => { wallQuad(a, b, h - (opts.bandH || 1.25), h); ctx.fillStyle = mix(opts.band, shadeOf(a, b, ws)); ctx.fill(); });
    poly(p, h); ctx.fillStyle = opts.roof; ctx.fill();
    if (opts.roofTex) fillWorldTex(opts.roofTex, h, opts.ev);
    ctx.strokeStyle = opts.edge; ctx.lineWidth = Math.max(0.7, 0.16 * cam.z); ctx.lineJoin = 'round'; ctx.stroke();
  }

  function drawBuilding(b, c) {
    if (b.id === 'principal' && sv.mix >= 0.999) return;
    ctx.globalAlpha = b.id === 'principal' ? 1 - sv.mix : 1;
    drawBuildingBody(b, c);
    if (paintStart && !isEv()) paintOver(b, c, (ec) => drawBuildingBody(b, ec));
    ctx.globalAlpha = 1;
  }
  /* Obelisco da entrada: placa alta cinza, com a marca em grade no topo. */
  /* Totem da entrada, como na foto: coluna alta cinza-clara com a marca do IF no alto
     e, na frente, uma placa branca mais baixa, deslocada para a esquerda, com o nome do campus na vertical. */
  const IF_MARK = [[0, 0, 1], [0, 1, 0], [0, 2, 0], [1, 0, 0], [1, 1, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0], [3, 0, 0], [3, 1, 0]];
  function drawStele(b, c, h) {
    const p = b.p, q = b.panel, ph = h * 0.62;
    /* A frente olha para a passarela (lado +y). Quem olha de frente tem a esquerda no lado -x. */
    const frontSeen = depth(...lerp2(p[2], p[3], 0.5)) > depth(...lerp2(p[0], p[1], 0.5));
    const slab = () => drawExtruded(p, h, c, { wall: [214, 217, 220], roof: '#eceeef', edge: '#a3a7ab', floors: 0 });
    const plate = () => drawExtruded(q, ph, c, { wall: [238, 238, 234], roof: '#fafaf8', edge: '#b4b6b8', floors: 0 });
    if (frontSeen) { slab(); plate(); } else { plate(); slab(); }
    if (!frontSeen || cam.hv < 0.3 || cam.z < 2) return;
    /* Marca do IF: círculo vermelho e quadrados verdes, quatro linhas de até três. */
    const L = p[3], R = p[2]; const W = Math.hypot(R[0] - L[0], R[1] - L[1]);
    const cs = 0.24, gap = 0.05, u0 = (W - (3 * cs + 2 * gap)) / 2 / W, du = (cs + gap) / W, top = h - 0.3;
    IF_MARK.forEach(([row, col, red]) => {
      const a = lerp2(L, R, u0 + col * du), e = lerp2(L, R, u0 + col * du + cs / W);
      const h1 = top - row * (cs + gap), h0 = h1 - cs;
      if (red) {
        const m = lerp2(a, e, 0.5), cc = P(m[0], m[1], (h0 + h1) / 2), s0 = P(a[0], a[1], h0), s1 = P(e[0], e[1], h0);
        ctx.fillStyle = '#d0231f'; ctx.beginPath(); ctx.arc(cc[0], cc[1], Math.max(0.8, Math.hypot(s1[0] - s0[0], s1[1] - s0[1]) / 2), 0, 7); ctx.fill();
      } else { wallQuad(a, e, h0, h1); ctx.fillStyle = '#2f9e44'; ctx.fill(); }
    });
    /* Nome do campus em linhas verticais na placa da frente. */
    if (cam.z < 4) return;
    const PL = q[3], PR = q[2]; ctx.strokeStyle = '#4b4f57'; ctx.lineCap = 'round';
    [[0.36, 0.11], [0.5, 0.07], [0.62, 0.05]].forEach(([u, w]) => {
      const m = lerp2(PL, PR, u), a = P(m[0], m[1], 0.6), e = P(m[0], m[1], ph - 0.45);
      ctx.lineWidth = Math.max(0.6, cam.z * w); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    });
  }
  function drawPanels(q, h, c) {
    poly(q, h); ctx.fillStyle = c.panel; ctx.fill();
    if (cam.z < 1.2) return;
    ctx.strokeStyle = c.panelLine; ctx.lineWidth = 0.7; ctx.beginPath();
    const seg = (a, e) => { const s = P(a[0], a[1], h); const f = P(e[0], e[1], h); ctx.moveTo(s[0], s[1]); ctx.lineTo(f[0], f[1]); };
    const nu = cam.z > 3 ? 12 : 6, nv = cam.z > 3 ? 6 : 3;
    for (let i = 1; i < nu; i++) seg(quadAt(q, i / nu, 0), quadAt(q, i / nu, 1));
    for (let i = 1; i < nv; i++) seg(quadAt(q, 0, i / nv), quadAt(q, 1, i / nv));
    ctx.stroke();
  }
  /* Claraboia do Anexo: prisma de vidro em triângulo, que deixa a luz entrar. */
  function drawSkylight(q, h, c) {
    const R = 1.5;
    const ridge = [lerp2(q[0], q[3], 0.5), lerp2(q[1], q[2], 0.5)];
    const faces = [[q[0], q[1], ridge[1], ridge[0], 0], [q[3], q[2], ridge[1], ridge[0], 1]];
    faces.sort((a, b) => depth(...lerp2(a[0], a[1], 0.5)) - depth(...lerp2(b[0], b[1], 0.5)));
    const tri = (a, e, m) => { const s = P(a[0], a[1], h), t = P(e[0], e[1], h), r = P(m[0], m[1], h + R); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(t[0], t[1]); ctx.lineTo(r[0], r[1]); ctx.closePath(); ctx.fillStyle = c.glassEnd; ctx.fill(); ctx.strokeStyle = c.skyFrame; ctx.lineWidth = Math.max(0.5, 0.1 * cam.z); ctx.stroke(); };
    const nearStart = depth(...ridge[0]) > depth(...ridge[1]);
    tri(...(nearStart ? [q[1], q[2], ridge[1]] : [q[0], q[3], ridge[0]]));
    faces.forEach(([a, e, r1, r0, side], i) => {
      const s = P(a[0], a[1], h), t = P(e[0], e[1], h), u = P(r1[0], r1[1], h + R), v = P(r0[0], r0[1], h + R);
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(t[0], t[1]); ctx.lineTo(u[0], u[1]); ctx.lineTo(v[0], v[1]); ctx.closePath();
      ctx.fillStyle = i ? c.glassLit : c.glassDark; ctx.fill();
      ctx.strokeStyle = c.skyFrame; ctx.lineWidth = Math.max(0.5, 0.1 * cam.z); ctx.stroke();
      if (cam.z > 1.2) { const n = 8; ctx.beginPath(); for (let k = 1; k < n; k++) { const p0 = P(...lerp2(a, e, k / n), h), p1 = P(...lerp2(r0, r1, k / n), h + R); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); } ctx.stroke(); }
    });
    tri(...(nearStart ? [q[0], q[3], ridge[0]] : [q[1], q[2], ridge[1]]));
  }
  /* Ginásio comum: paredes retas e cobertura em arco, em faixas. */
  function drawGym(b, c, g, sel) {
    const p = b.p; const wall = Math.max(0.2, b.h * g); const rise = b.rise * g;
    const len = (i) => Math.hypot(p[(i + 1) % 4][0] - p[i][0], p[(i + 1) % 4][1] - p[i][1]);
    const s0 = len(0) < len(1) ? 0 : 1;
    const [A, B, C, D] = [0, 1, 2, 3].map((i) => p[(s0 + i) % 4]);
    const wallRgb = c.wall;
    const roofRgb = c.roofRgb;
    drawExtruded(p, wall, c, { wall: wallRgb, roof: mix(roofRgb, 0.95), edge: c.roofEdge, floors: 0 });
    const N = 8; const H = (t) => wall + rise * Math.sin(Math.PI * t);
    const gable = (a, e) => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const q = lerp2(a, e, i / N); const s = P(q[0], q[1], H(i / N)); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }
      ctx.closePath(); ctx.fillStyle = mix(wallRgb, 0.84); ctx.fill();
    };
    const mA = lerp2(A, B, 0.5), mD = lerp2(D, C, 0.5);
    const nearA = depth(mA[0], mA[1]) > depth(mD[0], mD[1]);
    gable(...(nearA ? [D, C] : [A, B]));
    const ux = B[0] - A[0], uy = B[1] - A[1], uL = Math.hypot(ux, uy);
    const dot = ((ux / uL) * LIGHT[0] + (uy / uL) * LIGHT[1]);
    const strips = [];
    for (let i = 0; i < N; i++) { const q = lerp2(lerp2(A, B, (i + 0.5) / N), lerp2(D, C, (i + 0.5) / N), 0.5); strips.push({ i, d: depth(q[0], q[1]) }); }
    strips.sort((u, v) => u.d - v.d).forEach(({ i }) => {
      const t0 = i / N, t1 = (i + 1) / N;
      const a = P(...lerp2(A, B, t0), H(t0)), e = P(...lerp2(A, B, t1), H(t1)), f = P(...lerp2(D, C, t1), H(t1)), m = P(...lerp2(D, C, t0), H(t0));
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(f[0], f[1]); ctx.lineTo(m[0], m[1]); ctx.closePath();
      const col = mix(roofRgb, 0.9 + 0.08 * Math.cos(Math.PI * (t0 + t1) / 2) * -dot + 0.03);
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.fill(); ctx.stroke();
    });
    gable(...(nearA ? [A, B] : [D, C]));
    if (sel) { poly(p, wall); ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.stroke(); }
  }
  /* Coliseu: deck hexagonal coberto, com colunas, guarda-corpo e escadinha. Vazio por dentro. */
  function drawHex(b, c, g, sel) {
    const p = b.p; const m = centroid(p); const n = p.length;
    const deck = 0.75 * g; const top = Math.max(1, b.h * g); const apex = top + 1.1 * g;
    const plinth = shrink(p, 0.97); const posts = shrink(p, 0.88);
    let open = 0, best = Infinity;
    plinth.forEach((a, i) => { const q = lerp2(a, plinth[(i + 1) % n], 0.5); const d = Math.hypot(q[0] - STAIR_AT[0], q[1] - STAIR_AT[1]); if (d < best) { best = d; open = i; } });
    const sa = plinth[open], sb = plinth[(open + 1) % n]; const sm = lerp2(sa, sb, 0.5);
    const oL = Math.hypot(sm[0] - m[0], sm[1] - m[1]); const ox = (sm[0] - m[0]) / oL, oy = (sm[1] - m[1]) / oL;
    const steps = [0, 1, 2].map((i) => {
      const w0 = 0.86, d0 = 0.5 * i, d1 = 0.5 * (i + 1);
      const u = lerp2(sm, sa, w0), v = lerp2(sm, sb, w0);
      return { q: [[u[0] + ox * d0, u[1] + oy * d0], [v[0] + ox * d0, v[1] + oy * d0], [v[0] + ox * d1, v[1] + oy * d1], [u[0] + ox * d1, u[1] + oy * d1]], h: deck * (1 - (i + 1) / 4) };
    });
    const stairOpts = { wall: c.hexBase, roof: c.hexDeck, edge: c.roofEdge, floors: 0 };
    const drawStairs = () => steps.slice().sort((u, v) => depth(...centroid(u.q)) - depth(...centroid(v.q))).forEach((t) => drawExtruded(t.q, t.h, c, stairOpts));
    const stairFront = depth(sm[0], sm[1]) > depth(m[0], m[1]);
    if (!stairFront) drawStairs();
    drawExtruded(plinth, deck, c, { wall: c.hexBase, roof: c.hexDeck, edge: c.roofEdge, floors: 0 });
    if (stairFront) drawStairs();
    const order = p.map((_, i) => i).sort((u, v) => depth(...posts[u]) - depth(...posts[v]));
    ctx.lineCap = 'round';
    order.forEach((i) => {
      const a = posts[i], e = posts[(i + 1) % n];
      if (i !== open) {
        ctx.strokeStyle = c.rail; ctx.lineWidth = Math.max(0.6, 0.11 * cam.z);
        const s = P(a[0], a[1], deck + 0.85), f = P(e[0], e[1], deck + 0.85), s2 = P(a[0], a[1], deck + 0.4), f2 = P(e[0], e[1], deck + 0.4);
        ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(f[0], f[1]); ctx.moveTo(s2[0], s2[1]); ctx.lineTo(f2[0], f2[1]); ctx.stroke();
      }
      const u = P(a[0], a[1], deck), v = P(a[0], a[1], top);
      ctx.strokeStyle = mix(c.hexRoof, 0.82); ctx.lineWidth = Math.max(1, 0.26 * cam.z);
      ctx.beginPath(); ctx.moveTo(u[0], u[1]); ctx.lineTo(v[0], v[1]); ctx.stroke();
    });
    const roofRgb = c.hexRoof;
    const ap = P(m[0], m[1], apex);
    p.map((a, i) => ({ a, e: p[(i + 1) % n] })).sort((u, v) => depth(...lerp2(u.a, u.e, 0.5)) - depth(...lerp2(v.a, v.e, 0.5))).forEach(({ a, e }) => {
      const q = lerp2(a, e, 0.5); const L = Math.hypot(q[0] - m[0], q[1] - m[1]);
      const f = 0.9 + 0.1 * (((q[0] - m[0]) / L) * LIGHT[0] + ((q[1] - m[1]) / L) * LIGHT[1]);
      const s = P(a[0], a[1], top), t = P(e[0], e[1], top);
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(t[0], t[1]); ctx.lineTo(ap[0], ap[1]); ctx.closePath();
      const col = mix(roofRgb, f); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.5; ctx.fill(); ctx.stroke();
    });
    if (sel) { poly(p, top); ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.stroke(); }
  }
  /* Estufa simples: paredes e teto translúcidos, com nervuras. */
  function drawGreenhouse(b, c, g, sel) {
    const p = b.p; const h = Math.max(0.2, b.h * g);
    drawExtruded(p, h, c, { wall: c.glassWall, roof: c.glass, edge: sel ? c.accent : c.glassRib, floors: 0 });
    if (cam.z < 1.1) return;
    const [u0, u1, v0, v1] = [p[0], p[3], p[1], p[2]];
    ctx.strokeStyle = c.glassRib; ctx.lineWidth = Math.max(0.5, 0.1 * cam.z); ctx.beginPath();
    for (let i = 1; i < 6; i++) { const s = P(...lerp2(u0, v0, i / 6), h); const e = P(...lerp2(u1, v1, i / 6), h); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); }
    ctx.stroke();
  }
  function drawTank(t, c) {
    const R = 1.1 * cam.z; const a = P(t[0], t[1]); const e = P(t[0], t[1], 2.3);
    ctx.fillStyle = c.shadow; ctx.beginPath(); ctx.ellipse(a[0] - R * 0.5, a[1] - R * 0.3, R, R * cam.k, 0, 0, 7); ctx.fill();
    ctx.fillStyle = mix(c.tank, 0.9); ctx.beginPath(); ctx.ellipse(a[0], a[1], R, R * cam.k, 0, 0, 3.15); ctx.lineTo(e[0] - R, e[1]); ctx.lineTo(e[0] + R, e[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.tankTop; ctx.beginPath(); ctx.ellipse(e[0], e[1], R, R * cam.k, 0, 0, 7); ctx.fill();
  }
  function drawNet(b, c) {
    const long = Math.hypot(b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]) > Math.hypot(b.p[2][0] - b.p[1][0], b.p[2][1] - b.p[1][1]);
    const q = long ? b.p : [b.p[1], b.p[2], b.p[3], b.p[0]];
    const a = quadAt(q, 0.5, 0.08), e = quadAt(q, 0.5, 0.92);
    const a0 = P(a[0], a[1]), a1 = P(a[0], a[1], 2.4), e0 = P(e[0], e[1]), e1 = P(e[0], e[1], 2.4), a2 = P(a[0], a[1], 1.5), e2 = P(e[0], e[1], 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.lineTo(a2[0], a2[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.rail; ctx.lineWidth = Math.max(0.7, 0.14 * cam.z); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]); ctx.stroke();
  }

  /* Bloco principal em três volumes: o auditório baixo, a torre da escada sobre ele e o resto do bloco, de trás para a frente. */
  const STAIR_TOWER = [[-30.84, -40.23], [AUD_X, -40.23], [AUD_X, -35.77], [-30.84, -35.77]];
  function principalParts(g, h, draw) {
    const ha = Math.max(0.2, AUD_H * g);
    const aud = () => { draw('auditorio', PIECES.auditorio, ha, 0, true); if (g > 0.6) draw('escada', STAIR_TOWER, h, ha, false); };
    const main = () => draw('principal', PIECES.principal, h, 0, false);
    const ent = () => draw('entrada', entryPoly(), Math.max(0.2, ENTRY_H * g), 0, false);
    /* Do mais distante para o mais próximo: o bloco de entrada fica na frente da fachada. */
    [[PIECES.auditorio, aud], [PIECES.principal, main], [entryPoly(), ent]]
      .sort((u, v) => depth(...centroid(u[0])) - depth(...centroid(v[0]))).forEach(([, f]) => f());
  }
  /* Entrada do bloco principal: o volume que sai do térreo (planta de 2012, x 860–922, y 542–614), revestido de
     pastilha azul até a cobertura do pátio, com o painel branco do "Bem-vindo", o letreiro e a porta de vidro. */
  const ENTRY_H = 6.2;
  let entryQ = null;
  const entryPoly = () => entryQ || (entryQ = [[860, 542], [922, 542], [922, 614], [860, 614]].map(wp));
  const ENTRY_BLUE = [40, 62, 158];
  function drawEntry(q, h, c, ev) {
    const part = ev && c.parts && c.parts.principal;
    drawExtruded(q, h, c, { wall: part ? part.wall : ENTRY_BLUE, roof: part ? part.roof : '#2a44a4', edge: part ? mix(part.wall, 0.8) : '#1a2b6e', floors: 0 });
    if (ev || h < ENTRY_H * 0.85 || cam.z < 1.2 || !Q.view3d || cam.hv < 0.2) return;
    const m = centroid(q);
    const quad = (a, e, u0, u1, h0, h1) => { const A = lerp2(a, e, u0), B = lerp2(a, e, u1); const pts = [P(A[0], A[1], h0), P(B[0], B[1], h0), P(B[0], B[1], h1), P(A[0], A[1], h1)]; ctx.beginPath(); pts.forEach((z, i) => (i ? ctx.lineTo(z[0], z[1]) : ctx.moveTo(z[0], z[1]))); ctx.closePath(); };
    q.forEach((a, i) => {
      const e = q[(i + 1) % q.length];
      if (!faceSeen(a, e, m)) return;
      /* Pastilhas: grade clara bem fina, só de perto. */
      if (cam.z > 2.2) {
        const L = Math.hypot(e[0] - a[0], e[1] - a[1]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.6; ctx.beginPath();
        for (let k = 1; k < L / 0.45; k++) { const u = lerp2(a, e, k * 0.45 / L), s0 = P(u[0], u[1], 0), s1 = P(u[0], u[1], h); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); }
        for (let y = 0.45; y < h; y += 0.45) { const s0 = P(a[0], a[1], y), s1 = P(e[0], e[1], y); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); }
        ctx.stroke();
      }
      /* Frente (a face que olha para a portaria, y = 614 na planta): painel, letreiro e porta. */
      if (i !== 2) return;
      quad(a, e, 0.12, 0.88, 4.0, 5.8); ctx.fillStyle = '#f4f6f8'; ctx.fill();
      faceText(lerp2(a, e, 0.12), lerp2(a, e, 0.88), 4.4, 5.4, 'Bem-vindo(a)!', '#3f8f1a', 0.02);
      faceText(lerp2(a, e, 0.08), lerp2(a, e, 0.92), 2.9, 3.6, 'BLOCO PRINCIPAL', '#ffffff', 0.02);
      quad(a, e, 0.3, 0.7, 0, 2.5); ctx.fillStyle = '#1b222c'; ctx.fill();
      quad(a, e, 0.49, 0.51, 0, 2.5); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    });
  }
  /* Janelas altas e estreitas do auditório, abaixo da faixa de pastilha. */
  function drawAudWindows(p, h, col) {
    if (cam.z < 1.1 || cam.hv < 0.3 || !Q.view3d || h < 4) return;
    const scr = signedScreen(p) > 0 ? 1 : -1;
    ctx.fillStyle = col; ctx.beginPath();
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length]; const A = P(a[0], a[1]), B = P(b[0], b[1]);
      if ((B[0] - A[0]) * scr >= 0) return;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1.4) return;
      const n = Math.max(1, Math.floor(L / 2.8)); const w = 0.7 / L;
      for (let k = 0; k < n; k++) {
        const m = (k + 0.5) / n; const u = lerp2(a, b, m - w / 2), v = lerp2(a, b, m + w / 2);
        const q = [P(u[0], u[1], 1.3), P(v[0], v[1], 1.3), P(v[0], v[1], h - 2.4), P(u[0], u[1], h - 2.4)];
        ctx.moveTo(q[0][0], q[0][1]); q.slice(1).forEach((z) => ctx.lineTo(z[0], z[1])); ctx.closePath();
      }
    });
    ctx.fill();
  }

  /* Trechos de uma linha reta sem os vãos [x0, x1] (muro da frente, que corre em x). */
  function gapsOut(a, b, holes) {
    const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]), y = a[1]; const out = []; let x = lo;
    holes.slice().sort((p, q) => p[0] - q[0]).forEach(([h0, h1]) => { if (h0 > x) out.push([[x, y], [h0, y]]); x = Math.max(x, h1); });
    if (x < hi) out.push([[x, y], [hi, y]]);
    return out;
  }
  /* Postes de concreto com luminária na calçada do campus, a cada 32 m, com a fiação entre eles. */
  const POLE_Y = ROAD_Y0 - 0.5;
  const POLES = []; for (let x = -326; x <= 230; x += 32) if (Math.abs(x - 10) > 12) POLES.push(x);
  function drawPole(x, next, c) {
    const H = 9 * growOf(x, POLE_Y); if (H < 0.3) return;
    const b = P(x, POLE_Y), t = P(x, POLE_Y, H), arm = P(x, POLE_Y + 2, H - 0.6);
    ctx.lineCap = 'round'; ctx.strokeStyle = c.pole; ctx.lineWidth = Math.max(0.8, 0.26 * cam.z);
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
    ctx.lineWidth = Math.max(0.6, 0.12 * cam.z); const k = P(x, POLE_Y, H - 1.2);
    ctx.beginPath(); ctx.moveTo(k[0], k[1]); ctx.quadraticCurveTo(arm[0], k[1], arm[0], arm[1]); ctx.stroke();
    ctx.fillStyle = NIGHT > 0.2 ? '#ffe2a8' : c.poleLamp; ctx.beginPath(); ctx.ellipse(arm[0], arm[1], Math.max(1, 0.4 * cam.z), Math.max(0.6, 0.18 * cam.z), 0, 0, 7); ctx.fill();
    if (NIGHT > 0.05) {
      const g = ctx.createRadialGradient(arm[0], arm[1], 0, arm[0], arm[1], Math.max(4, 2.2 * cam.z));
      g.addColorStop(0, `rgba(255,214,140,${(0.7 * NIGHT).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(arm[0], arm[1], Math.max(4, 2.2 * cam.z), 0, 7); ctx.fill(); ctx.globalCompositeOperation = prev;
    }
    if (next == null || cam.z < 0.6) return;
    /* Fiação até o próximo poste, com barriga. */
    ctx.strokeStyle = c.wire; ctx.lineWidth = Math.max(0.5, 0.05 * cam.z);
    [0, -0.5].forEach((dh) => { const a = P(x, POLE_Y, H + dh), e = P(next, POLE_Y, H + dh), mm = P((x + next) / 2, POLE_Y, H + dh - 1.1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(2 * mm[0] - (a[0] + e[0]) / 2, 2 * mm[1] - (a[1] + e[1]) / 2, e[0], e[1]); ctx.stroke(); });
  }
  /* Poste de jardim: haste fina com luminária; à noite acende. */
  function drawLamp([x, y], c) {
    const b = P(x, y), t = P(x, y, 4.2);
    ctx.strokeStyle = c.pole; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(0.8, 0.18 * cam.z);
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
    ctx.fillStyle = NIGHT > 0.2 ? '#ffe2a8' : c.poleLamp; ctx.beginPath(); ctx.arc(t[0], t[1], Math.max(1.2, 0.35 * cam.z), 0, 7); ctx.fill();
    if (NIGHT > 0.05) {
      const r = Math.max(4, 1.8 * cam.z); const g = ctx.createRadialGradient(t[0], t[1], 0, t[0], t[1], r);
      g.addColorStop(0, `rgba(255,214,140,${(0.7 * NIGHT).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t[0], t[1], r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = prev;
    }
  }
  /* Cones no meio da entrada de veículos. */
  const CONES = [[5, 58.5], [5, 56], [5, 53.5], [5, 51]];
  function drawCone([x, y], c) {
    const s = 0.28, a = P(x - s, y), e = P(x + s, y), t = P(x, y, 0.75), m0 = P(x - s * 0.55, y, 0.33), m1 = P(x + s * 0.55, y, 0.33), n0 = P(x - s * 0.35, y, 0.5), n1 = P(x + s * 0.35, y, 0.5);
    ctx.fillStyle = c.cone; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(t[0], t[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.lineTo(n1[0], n1[1]); ctx.lineTo(n0[0], n0[1]); ctx.closePath(); ctx.fill();
  }
  /* Coberturas de lona branca das motos, na metade sul do estacionamento da Brisanet, e carros nas vagas. */
  const SHADES = []; [-88.5, -81.5, -74.5].forEach((x) => [103.5, 110, 116.5].forEach((y) => SHADES.push([x, y])));
  function drawShade([x, y], c) {
    const g = growOf(x, y); if (g < 0.2) return;
    const r = 3, H = 3.4 * g, Hc = 2.6 * g; const q = [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]];
    const s = P(x, y), top = P(x, y, H);
    ctx.strokeStyle = c.pole; ctx.lineWidth = Math.max(0.6, 0.12 * cam.z); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
    const faces = q.map((a, i) => [a, q[(i + 1) % 4]]).sort((u, v) => depth(...lerp2(...u, 0.5)) - depth(...lerp2(...v, 0.5)));
    faces.forEach(([a, e]) => {
      const A = P(a[0], a[1], Hc), E = P(e[0], e[1], Hc);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(E[0], E[1]); ctx.lineTo(top[0], top[1]); ctx.closePath();
      ctx.fillStyle = mix(c.shade, shadeOf(a, e, 1)); ctx.fill(); ctx.strokeStyle = c.shadeEdge; ctx.lineWidth = 0.6; ctx.stroke();
    });
  }
  const PARKED = [[-126.5, 115.5, 0], [-120.5, 115.5, 2], [-114.5, 115.5, 3], [-105.5, 115.5, 1], [-99.5, 115.5, 0], [-123.5, 103.5, 4], [-111.5, 103.5, 0], [-102.5, 103.5, 3]].map(([x, y, k]) => ({ x, y, axis: 'y', k })); // cor resolvida no desenho: CAR_COLORS vem depois
  /* Portões da frente: pilares e grades vermelhas abertas para dentro; a portaria tem cobertura branca no alto. */
  function drawGate(b, c, h, sel) {
    const p = b.p, red = sel ? c.accentWall : c.gateRgb; const WY = 48.335;
    const x0 = Math.min(...p.map((q) => q[0])), x1 = Math.max(...p.map((q) => q[0]));
    const post = (x, y, hh) => [() => depth(x, y), () => drawExtruded([[x - 0.22, y - 0.22], [x + 0.22, y - 0.22], [x + 0.22, y + 0.22], [x - 0.22, y + 0.22]], hh, c, { wall: red, roof: mix(red, 1.1), edge: mix(red, 0.8), floors: 0 })];
    const leaf = (x, dir, len) => [() => depth(x, WY - len / 2), () => {
      const L = cam.z > 1.6 ? Math.round(len / 0.25) : 0; const a = [x, WY], e = [x + dir * len * 0.2, WY - len * 0.98];
      wallQuad(a, e, 0.15, 2); ctx.fillStyle = c.gateGrade; ctx.fill();
      ctx.strokeStyle = mix(red, 0.9); ctx.lineWidth = Math.max(0.5, 0.06 * cam.z); ctx.stroke();
      ctx.beginPath(); for (let k = 1; k < L; k++) { const q = lerp2(a, e, k / L), s0 = P(q[0], q[1], 0.15), s1 = P(q[0], q[1], 2); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); } ctx.stroke();
    }];
    const parts = [];
    const half = (x1 - x0) / 2 - 0.4;
    parts.push(leaf(x0 + 0.4, 1, half), leaf(x1 - 0.4, -1, half));
    if (b.vehicles) parts.push(post(x0, WY, h), post(x1, WY, h));
    else {
      const y0 = Math.min(...p.map((q) => q[1])), y1 = Math.max(...p.map((q) => q[1]));
      [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => parts.push(post(x + (x === x0 ? 0.25 : -0.25), y + (y === y0 ? 0.25 : -0.25), h - 0.35)));
    }
    parts.sort((u, v) => u[0]() - v[0]()).forEach((q) => q[1]());
    if (!b.vehicles) drawExtruded(p, h, c, { base: h - 0.35, wall: red, roof: sel ? c.accent : c.gateRoof, edge: mix(red, 0.85), floors: 0 });
  }
  /* Loja da Brisanet: galpão branco com a platibanda laranja e a vitrine de vidro de frente para o estacionamento. */
  function drawLoja(b, c, h, sel) {
    const p = b.p, k = h / b.h, m = centroid(p);
    drawExtruded(p, h, c, { wall: sel ? c.accentWall : c.lojaWall, roof: sel ? c.accent : c.bigRoof, edge: sel ? c.accent : c.roofEdge, floors: 0, band: sel ? null : c.lojaBand, bandH: 3.2 * k });
    const F = [p[0], p[1]];
    if (sel || k < 0.85 || !faceSeen(F[0], F[1], m) || cam.z < 0.8) return;
    const u = (x) => (x - p[0][0]) / (p[1][0] - p[0][0]);
    facePanel(F[0], F[1], u(-125.5), u(-110.5), 0, 3.6 * k, 0.05); ctx.fillStyle = c.lojaGlass; ctx.fill();
    if (cam.z > 1.3) faceText(lerp2(F[0], F[1], u(-118)), lerp2(F[0], F[1], u(-90)), h - 3, h - 0.3, 'brisanet', '#ffffff', 0.06);
  }
  /* Algumas janelas acesas à noite, sempre as mesmas (escolhidas por sorteio fixo), nas faces à vista. */
  function litWindows(p, h, floors, count, seed) {
    if (cam.z < 0.9 || cam.hv < 0.3) return;
    const scr = signedScreen(p) > 0 ? 1 : -1; const per = h / Math.max(1, floors);
    let hsh = 0; for (const ch of seed) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const slots = [];
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length]; const A = P(a[0], a[1]), B = P(b[0], b[1]);
      if ((B[0] - A[0]) * scr >= 0) return;
      const n = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3.2));
      for (let f = 0; f < floors; f++) for (let w = 0; w < n; w++) slots.push({ a, b, f, w, n, k: ((i * 97 + f * 13 + w * 7 + hsh) * 2654435761 >>> 0) % 1000 });
    });
    slots.sort((u, v) => u.k - v.k).slice(0, count).forEach(({ a, b, f, w, n }) => {
      const u = lerp2(a, b, (w + 0.18) / n), v = lerp2(a, b, (w + 0.82) / n);
      wallQuad(u, v, per * f + per * 0.34, per * f + per * 0.72); ctx.fillStyle = WARM; ctx.fill();
      const m = P(...lerp2(u, v, 0.5), per * f + per * 0.53); const r = Math.max(3, 1.6 * cam.z);
      const g = ctx.createRadialGradient(m[0], m[1], 0, m[0], m[1], r); g.addColorStop(0, `rgba(255,214,140,${(0.45 * NIGHT).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m[0], m[1], r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = prev;
    });
  }
  /* Prédio em obras: lajes de concreto e pilares. */
  function drawObra(b, c, h, sel) {
    const p = b.p, k = h / b.h, m = centroid(p);
    const conc = sel ? c.accentWall : c.obra, slab = sel ? c.accent : c.obraTop;
    const inner = shrink(p, 0.96);
    const cols = []; p.forEach((a, i) => { const e = p[(i + 1) % p.length]; const n = Math.max(1, Math.round(Math.hypot(e[0] - a[0], e[1] - a[1]) / 6)); for (let j = 0; j < n; j++) cols.push(lerp2(lerp2(a, e, j / n), m, 0.04)); });
    cols.sort((u, v) => depth(...u) - depth(...v));
    const lev = [0, 4.6 * k, 9.2 * k];
    drawExtruded(p, 0.35 * k, c, { wall: conc, roof: slab, edge: c.roofEdge, floors: 0 });
    for (let i = 0; i < lev.length - 1; i++) {
      cols.forEach((q) => drawExtruded([[q[0] - 0.25, q[1] - 0.25], [q[0] + 0.25, q[1] - 0.25], [q[0] + 0.25, q[1] + 0.25], [q[0] - 0.25, q[1] + 0.25]], lev[i + 1], c, { base: lev[i], wall: conc, roof: slab, edge: c.roofEdge, floors: 0 }));
      drawExtruded(inner, lev[i + 1] + 0.3 * k, c, { base: lev[i + 1], wall: conc, roof: slab, edge: c.roofEdge, floors: 0 });
    }
  }
  /* Face vertical vista de frente? Maior profundidade = mais perto de quem olha. */
  const faceSeen = (a, e, inner) => cam.hv > 0.02 && depth(...lerp2(a, e, 0.5)) > depth(...inner);
  /* Painel na fachada, entre u0 e u1 ao longo de a→e, um pouco para fora dela. */
  const facePanel = (a, e, u0, u1, h0, h1, out) => { const L = Math.hypot(e[0] - a[0], e[1] - a[1]); const n = [(e[1] - a[1]) / L * out, -(e[0] - a[0]) / L * out]; const s = lerp2(a, e, u0), t = lerp2(a, e, u1); wallQuad([s[0] + n[0], s[1] + n[1]], [t[0] + n[0], t[1] + n[1]], h0, h1); };
  /* Texto pintado na fachada, sempre da esquerda para a direita de quem olha. */
  function faceText(a, e, h0, h1, text, color, out) {
    const L = Math.hypot(e[0] - a[0], e[1] - a[1]); const n = [(e[1] - a[1]) / L * out, -(e[0] - a[0]) / L * out];
    let A = [a[0] + n[0], a[1] + n[1]], B = [e[0] + n[0], e[1] + n[1]];
    if (P(B[0], B[1], h1)[0] < P(A[0], A[1], h1)[0]) [A, B] = [B, A];
    const tl = P(A[0], A[1], h1), tr = P(B[0], B[1], h1), bl = P(A[0], A[1], h0);
    ctx.save(); ctx.transform((tr[0] - tl[0]) / 100, (tr[1] - tl[1]) / 100, (bl[0] - tl[0]) / 20, (bl[1] - tl[1]) / 20, tl[0], tl[1]);
    ctx.fillStyle = color; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 50, 10.5, 96); ctx.restore();
  }
  /* Prédio de apartamentos em frente ao campus, como na foto da rua: térreo com duas portas de enrolar,
     três andares com varandas de faixa laranja na metade sul da frente e painel azul de propaganda na quina. */
  function drawApto(b, c, h, sel) {
    const p = b.p, k = h / b.h, m = centroid(p);
    drawExtruded(p, h, c, { wall: sel ? c.accentWall : c.aptoWall, roof: sel ? c.accent : c.aptoSlab, edge: sel ? c.accent : c.roofEdge, floors: 4, window: NIGHT > 0.3 ? WARM : c.window });
    if (k < 0.85) return;
    /* Telhado de telha sobre a parte marcada no levantamento; o resto é laje com caixas d'água. */
    if (!sel) {
      drawExtruded(b.tileRoof, h + 0.9, c, { base: h, wall: c.tileWall, roof: c.tile, edge: c.tile, floors: 0, roofTex: 'telha' });
      [[16.2, 99], [16.2, 102.5]].forEach(([x, y]) => drawExtruded([[x, y], [x + 1.6, y], [x + 1.6, y + 1.6], [x, y + 1.6]], h + 1.4, c, { base: h, wall: c.tank, roof: c.tankTop, edge: c.tankTop, floors: 0 }));
    }
    if (!sel) drawAptoSide(b, c, h);
    const F = [p[0], p[1]]; // frente, para a rodovia
    if (!faceSeen(F[0], F[1], m) || cam.z < 0.9 || sel) return;
    const lv = [0, 4.2, 7.3, 10.4, 13.4].map((v) => v * k); const u = (x) => (x - p[0][0]) / (p[1][0] - p[0][0]);
    /* Varandas: vão escuro e guarda-corpo laranja por andar, da quina da rua de terra até a faixa branca do lado sul. */
    for (let f = 1; f <= 3; f++) {
      facePanel(F[0], F[1], u(14.6), u(28.2), lv[f] + 1.1 * k, lv[f + 1] - 0.25 * k, 0.05); ctx.fillStyle = c.aptoGap; ctx.fill();
      facePanel(F[0], F[1], u(14.2), u(28.6), lv[f], lv[f] + 1.1 * k, 0.35); ctx.fillStyle = c.aptoBand; ctx.fill();
    }
    facePanel(F[0], F[1], u(14.2), u(28.6), lv[4] - 1.5 * k, lv[4], 0.35); ctx.fillStyle = c.aptoBand; ctx.fill();
    /* Térreo: duas portas de enrolar e, na quina, o portão de grade da entrada dos apartamentos. */
    [[25.1, 33.5], [16.7, 24.1]].forEach(([x0, x1]) => { facePanel(F[0], F[1], u(x0), u(x1), 0, 3.3 * k, 0.05); ctx.fillStyle = c.aptoShop; ctx.fill(); });
    facePanel(F[0], F[1], u(14.6), u(16.4), 0, 2.4 * k, 0.05); ctx.fillStyle = c.aptoDoor; ctx.fill();
  }
  /* Painel azul de propaganda na lateral da rua de terra, junto da frente. */
  function drawAptoSide(b, c, h) {
    const p = b.p, k = h / b.h; const S = [p[3], p[0]];
    if (k < 0.85 || cam.z < 0.9 || !faceSeen(S[0], S[1], centroid(p))) return;
    const u = (y) => (y - S[0][1]) / (S[1][1] - S[0][1]);
    facePanel(S[0], S[1], u(101.5), u(96.2), 4.6 * k, 12.6 * k, 0.2); ctx.fillStyle = c.aptoSign; ctx.fill();
  }
  /* Elétrica: bar térreo de telha metálica, frente aberta para a rua lateral, balcão verde e arco de treliça com o letreiro. */
  function drawBar(b, c, h, sel) {
    const p = b.p, k = h / b.h, m = centroid(p);
    const R = [p[3], p[0]]; // frente, para a rua de terra (lado -x)
    const open = faceSeen(R[0], R[1], m) && cam.z >= 0.9 && !sel && k > 0.85;
    drawExtruded(p, h, c, { wall: sel ? c.accentWall : c.barWall, roof: sel ? c.accent : c.metal, edge: sel ? c.accent : c.metalEdge, floors: 0 });
    if (!sel && k > 0.85 && cam.z > 1.4) {
      /* Ondas da telha metálica. */
      ctx.strokeStyle = c.metalEdge; ctx.lineWidth = Math.max(0.5, 0.08 * cam.z); ctx.beginPath();
      for (let y = p[0][1] + 1; y < p[2][1]; y += 1.1) { const s = P(p[0][0], y, h), t = P(p[1][0], y, h); ctx.moveTo(s[0], s[1]); ctx.lineTo(t[0], t[1]); }
      ctx.stroke();
    }
    if (!open) return;
    const u = (y) => (y - R[0][1]) / (R[1][1] - R[0][1]);
    facePanel(R[0], R[1], u(139.4), u(123.4), 0.3 * k, 3.3 * k, 0.04); ctx.fillStyle = c.barOpen; ctx.fill();
    facePanel(R[0], R[1], u(134), u(127), 0, 1.15 * k, 0.6); ctx.fillStyle = c.barCounter; ctx.fill();
    /* Arco de treliça branco com o letreiro. */
    const ux = u; const mast = (y) => { facePanel(R[0], R[1], ux(y + 0.2), ux(y - 0.2), 0, 3.6 * k, 1.6); ctx.fillStyle = c.truss2; ctx.fill(); };
    mast(132.4); mast(128.6);
    facePanel(R[0], R[1], ux(133.4), ux(127.6), 3.6 * k, 4.6 * k, 1.6); ctx.fillStyle = c.truss2; ctx.fill();
    if (cam.z > 2.4) {
      const a = lerp2(R[0], R[1], ux(133.4)), e = lerp2(R[0], R[1], ux(127.6));
      faceText(a, e, 3.6 * k, 4.6 * k, 'ELÉTRICA', c.barInk, 1.65);
    }
  }
  function drawBuildingBody(b, c) {
    const p = b.p; const g = growOf(...centroid(p)); const h = Math.max(0.2, b.h * g);
    const sel = selected === b.id;
    if (isEv() && EVENT_IDS.has(b.id)) {
      const piece = (id, poly0, hh = h, base = 0, aud = false) => {
        const part = c.parts[id]; const on = selected === id;
        drawExtruded(poly0, hh, c, { base, wall: on ? mix(part.wall, 0.72).match(/\d+/g).map(Number) : part.wall, roof: on ? mix(part.wall, 0.8) : part.roof, edge: mix(part.wall, on ? 0.7 : 1), floors: aud ? 0 : b.floors, window: c.evWindow, tex: !on && !aud, ev: part.tex, roofTex: on ? null : 'roof', band: aud && !on ? part.wall.map((v) => Math.round(v * 0.62)) : null });
        if (aud) drawAudWindows(poly0, hh, c.evWindow);
      };
      if (b.id === 'principal') {
        principalParts(g, h, (id, q, hh, base, aud) => (id === 'entrada' ? drawEntry(q, hh, c, true) : piece(id === 'escada' ? 'principal' : id, q, hh, base, aud)));
        if (b.court && g > 0.85) drawWell(b, h, c, mix(c.parts.principal.wall, 0.72));
        return;
      }
      piece(b.id, p);
      if (b.solar && g > 0.85) drawPanels(Array.isArray(b.solar) ? b.solar : shrink(p, b.solar), h + 0.02, c);
      return;
    }
    if (b.kind === 'stele') { drawStele(b, c, h); return; }
    if (b.kind === 'gym') { drawGym(b, c, g, sel); return; }
    if (b.kind === 'hex') { drawHex(b, c, g, sel); return; }
    if (b.kind === 'greenhouse') { drawGreenhouse(b, c, g, sel); return; }
    if (b.kind === 'apto') { drawApto(b, c, h, sel); return; }
    if (b.kind === 'obra') { drawObra(b, c, h, sel); return; }
    if (b.kind === 'gate') { drawGate(b, c, h, sel); return; }
    if (b.kind === 'loja') { drawLoja(b, c, h, sel); return; }
    if (b.kind === 'bar') { drawBar(b, c, h, sel); return; }
    if (b.neighbor) { drawExtruded(p, h, c, { wall: sel ? c.accentWall : c.neighborWall, roof: sel ? c.accent : c.neighbor, edge: c.roofEdge, floors: 0 }); return; }
    if (b.tile) {
      drawExtruded(p, h, c, { wall: c.tileWall, roof: c.tile, edge: sel ? c.accent : c.tile, floors: b.floors, window: c.window, roofTex: 'telha' });
      if (b.solarHalf && g > 0.85) drawPanels([quadAt(p, 0.14, 0.52), quadAt(p, 0.86, 0.52), quadAt(p, 0.86, 0.9), quadAt(p, 0.14, 0.9)], h + 0.02, c);
      return;
    }
    const opts = { wall: sel ? c.accentWall : c.wall, roof: sel ? c.accent : c.roof, edge: sel ? c.accent : mix(c.band || [120, 130, 160], 1), floors: b.floors, window: sel ? 'rgba(255,255,255,.28)' : NIGHT > 0.3 && b.id === 'anexo' ? WARM : c.window, tex: !sel && !(NIGHT > 0.3 && b.id === 'anexo'), roofTex: sel ? null : 'roof', band: sel ? null : c.band };
    if (b.id === 'principal') principalParts(g, h, (id, q, hh, base, aud) => {
      if (id === 'entrada') { drawEntry(q, hh, c, false); return; }
      drawExtruded(q, hh, c, aud ? { ...opts, floors: 0, tex: false, band: sel ? null : c.band && c.band.map((v) => Math.round(v * 1.05)) } : { ...opts, base });
      if (aud) drawAudWindows(q, hh, opts.window);
      else if (id === 'principal' && b.ridges && !sel && g > 0.85 && cam.z > 1.1) drawRidges(q, hh, c);
    });
    else drawExtruded(p, h, c, opts);
    /* Parapeito: dá leitura de cobertura sem aumentar a complexidade. */
    const m = centroid(p); const inset = p.map((q) => [m[0] + (q[0] - m[0]) * 0.94, m[1] + (q[1] - m[1]) * 0.94]);
    poly(inset, h); ctx.strokeStyle = sel ? 'rgba(255,255,255,.24)' : c.roofEdge; ctx.lineWidth = Math.max(0.5, 0.1 * cam.z); ctx.stroke();
    if (b.solar && !sel && g > 0.85) drawPanels(Array.isArray(b.solar) ? b.solar : shrink(p, b.solar), h + 0.02, c);
    if (b.skylight && g > 0.85) drawSkylight(b.skylight, h, c);
    if (NIGHT > 0.3 && LIT[b.id] && !sel && g > 0.85) litWindows(b.id === 'principal' ? PIECES.principal : p, h, b.floors, LIT[b.id], b.id);
    if (b.court && g > 0.85) drawWell(b, h, c, c.courtWall);
  }
  /* Pátio interno visto de fora: um poço aberto até o térreo. Pela abertura do telhado se veem as paredes
     do fundo, com as varandinhas do 1º e do 2º andar, e só um pedaço do jardim lá embaixo. */
  function drawWell(b, h, c, wallCol) {
    const q = b.court; const m = centroid(q); const lv = h / (b.floors || 3);
    ctx.save(); poly(q, h); ctx.clip();
    drawCourtyard(orderYard(q), 0.05, c, false);
    const far = q.map((a, i) => [a, q[(i + 1) % q.length]]).filter(([a, e]) => depth(...lerp2(a, e, 0.5)) < depth(...m))
      .sort((u, v) => depth(...lerp2(u[0], u[1], 0.5)) - depth(...lerp2(v[0], v[1], 0.5)));
    far.forEach(([a, e]) => {
      wallQuad(a, e, 0, lv); ctx.fillStyle = wallCol; ctx.fill();
      for (let f = 1; f < (b.floors || 3); f++) {
        const y0 = lv * f;
        wallQuad(a, e, y0, Math.min(h, y0 + lv)); ctx.fillStyle = 'rgba(20,32,64,0.38)'; ctx.fill(); // fundo da varanda, na sombra
        wallQuad(a, e, y0 - 0.25, y0 + 1.1); ctx.fillStyle = wallCol; ctx.fill(); // laje e mureta
        const s0 = P(a[0], a[1], y0 + 1.1), s1 = P(e[0], e[1], y0 + 1.1);
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(0.6, cam.z * 0.1); ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
      }
    });
    ctx.restore();
    poly(q, h); ctx.strokeStyle = c.roofEdge; ctx.lineWidth = Math.max(0.6, cam.z * 0.12); ctx.stroke();
  }

  /* Telhado do bloco principal: fibrocimento em duas águas com cumeeira no meio de cada ala (norte e sul),
     escondido pela platibanda; calhas de concreto nas bordas do pátio interno. */
  function drawRidges(q, h, c) {
    const xs = q.map((v) => v[0]); const x0 = Math.min(...xs) + 0.9;
    const east = (y) => 8.568 + (y + 51.8) * 0.3938 - 0.9;
    ctx.save(); poly(q, h); ctx.clip();
    ctx.lineCap = 'round';
    [[-43.6, -50.5, -36.9], [-23.8, -30.5, -17.2]].forEach(([yr, ya, yb]) => {
      const seg = (y, w, col) => { const a = P(x0, y, h - 0.25), e = P(east(y), y, h - 0.25); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); };
      seg(yr, Math.max(1, 0.35 * cam.z), c.roofEdge);
      if (cam.z > 2) [ya, yb].forEach((y) => seg(y, Math.max(0.6, 0.12 * cam.z), c.roofEdge));
    });
    ctx.restore();
  }
  /* Treliça branca da cobertura do pátio, como na foto da entrada. */
  function drawTruss(b, h, c) {
    const p = b.p; let best = 0, bd = -Infinity;
    p.forEach((a, i) => { const m = lerp2(a, p[(i + 1) % p.length], 0.5); const d = depth(m[0], m[1]); if (d > bd) { bd = d; best = i; } });
    const A = p[best], B = p[(best + 1) % p.length]; const n = Math.max(4, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 3.4));
    const deep = 1.15;
    ctx.strokeStyle = c.truss || '#f6f6f2'; ctx.lineWidth = Math.max(0.7, cam.z * 0.1); ctx.lineJoin = 'round'; ctx.beginPath();
    const at = (t, hh) => { const q = lerp2(A, B, t); return P(q[0], q[1], hh); };
    let s = at(0, h), e = at(1, h); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]);
    s = at(0, h - deep); e = at(1, h - deep); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]);
    for (let i = 0; i < n; i++) { const a0 = at(i / n, h - deep), m = at((i + 0.5) / n, h), a1 = at((i + 1) / n, h - deep); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(m[0], m[1]); ctx.lineTo(a1[0], a1[1]); }
    ctx.stroke();
  }
  /* A cobertura do pátio fica por cima do bloco de entrada azul: ali ela some, como se fosse transparente,
     para a entrada aparecer no mapa. */
  function drawCover(b, c) {
    if (b.id !== 'patio') { drawCoverBody(b, c); return; }
    const q = entryPoly();
    const sil = hull([...q.map((v) => P(v[0], v[1], 0)), ...q.map((v) => P(v[0], v[1], ENTRY_H))]);
    ctx.save(); ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 2e5);
    sil.forEach((u, i) => (i ? ctx.lineTo(u[0], u[1]) : ctx.moveTo(u[0], u[1]))); ctx.closePath(); ctx.clip('evenodd');
    drawCoverBody(b, c);
    ctx.restore();
  }
  function drawCoverBody(b, c) {
    const p = b.p; const g = growOf(...centroid(p)); const h = Math.max(0.2, b.h * g);
    const sel = selected === b.id;
    /* pilares nos cantos e no meio dos lados maiores */
    const evc = isEv() && EVENT_IDS.has(b.id);
    ctx.strokeStyle = evc ? c.evCoverEdge : b.wood ? mix(c.woodWall, 1) : c.coverEdge; ctx.lineWidth = Math.max(0.8, 0.28 * cam.z);
    const cols = [];
    p.forEach((a, i) => { const n = p[(i + 1) % p.length]; cols.push(a, [(a[0] + n[0]) / 2, (a[1] + n[1]) / 2]); });
    cols.forEach((q) => { const s = P(q[0], q[1]); const e = P(q[0], q[1], h); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); });
    poly(p, h); ctx.fillStyle = sel ? c.accent : evc ? c.evCover : b.wood ? c.wood : c.cover; ctx.fill();
    if (!b.wood && !sel && cam.z > 2.4) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.72; fillWorldTex('ribs', h, evc); ctx.globalAlpha = ga; }
    if (b.id === 'patio' && !evc && !Q.lean && cam.z > 1.4) drawTruss(b, h, c);
    ctx.strokeStyle = sel ? c.accent : evc ? c.evCoverEdge : c.coverEdge; ctx.lineWidth = Math.max(0.7, 0.14 * cam.z); ctx.stroke();
  }

  function drawWallSeg(s, c) {
    const f = shadeOf(s.a, s.b, s.sign);
    wallQuad(s.a, s.b, 0, 2.3); ctx.fillStyle = mix(c.muro, f); ctx.fill();
    if (s.front) { wallQuad(s.a, s.b, 1, 1.45); ctx.fillStyle = c.stripe; ctx.fill(); }
    const A = P(s.a[0], s.a[1], 2.3), B = P(s.b[0], s.b[1], 2.3);
    ctx.strokeStyle = 'rgba(120,132,160,.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  }

  function drawTree(t, c) {
    const g = growOf(t.x, t.y); if (g <= 0.01) return;
    const r = t.r * g;
    const base = P(t.x, t.y);
    const sc = cam.z;
    if (!Q.sprites) { ctx.fillStyle = c.leaf[t.tone % c.leaf.length]; ctx.beginPath(); ctx.arc(base[0], base[1], Math.max(1, r * sc * 0.9), 0, 7); ctx.fill(); return; }
    if (Q.shadows && !Q.lean && LAYERS.shadows && SHADOW_K > 0) {
      /* Sombra da copa no chão, deslocada para longe do sol e esticada quando o sol está baixo. */
      const L = r * 1.7 * SHADOW_K, cx = t.x - LIGHT[0] * L, cy = t.y - LIGHT[1] * L, ax = r * 0.95 + L * 0.35, ay = r * 0.9;
      const ang = Math.atan2(LIGHT[1], LIGHT[0]); const co = Math.cos(ang), si = Math.sin(ang);
      ctx.fillStyle = c.shadow; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283; const u = Math.cos(a) * ax, v = Math.sin(a) * ay; const q = P(cx + u * co - v * si, cy + u * si + v * co); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.closePath(); ctx.fill();
    }
    const atlasT = SPR && IMG[`trees-${tintKey()}`];
    if (atlasT) {
      const S = SPR.trees[t.kind]; const v = cam.hv < 0.5 ? S.top : S.tilt; const k = (r / S.radius) * v.mpp * sc;
      ctx.drawImage(atlasT, v.x, v.y, v.w, v.h, base[0] - v.ox * k, base[1] - v.oy * k, v.w * k, v.h * k);
      return;
    }
    const top = P(t.x, t.y, r * 1.7);
    if (sc > 1.4) { ctx.strokeStyle = c.trunk; ctx.lineWidth = Math.max(0.8, 0.3 * sc * r * 0.5); ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke(); }
    ctx.fillStyle = c.leaf[t.tone % c.leaf.length]; ctx.beginPath(); ctx.arc(top[0], top[1], Math.max(1, r * sc), 0, 7); ctx.fill();
    ctx.fillStyle = c.leafTop; ctx.beginPath(); ctx.arc(top[0] - r * sc * 0.28, top[1] - r * sc * 0.3, Math.max(0.5, r * sc * 0.55), 0, 7); ctx.fill();
  }
  function drawBush(t, c) {
    const atlasB = SPR && IMG[`trees-${tintKey()}`];
    if (atlasB) {
      const a = P(t.x, t.y); const S = SPR.trees[2]; const v = cam.hv < 0.5 ? S.top : S.tilt; const k = ((t.r * 1.25) / S.radius) * v.mpp * cam.z; const sq = cam.hv < 0.5 ? 1 : 0.5;
      ctx.drawImage(atlasB, v.x, v.y, v.w, v.h, a[0] - v.ox * k, a[1] - v.oy * k * sq, v.w * k, v.h * k * sq);
      if (t.bloom && cam.z > 2.5) drawBlooms(t);
      return;
    }
    const s = P(t.x, t.y, 0.7);
    ctx.fillStyle = mix(c.bush, 0.92 + (((t.x * 7) % 3) / 3) * 0.16); ctx.beginPath(); ctx.arc(s[0], s[1], Math.max(0.7, t.r * cam.z), 0, 7); ctx.fill();
    if (t.bloom && cam.z > 2.5) drawBlooms(t);
  }
  /* Flores vermelhas por cima dos arbustos da entrada, como na foto do obelisco. */
  function drawBlooms(t) {
    ctx.fillStyle = '#d8402f'; ctx.beginPath(); const R = Math.max(0.6, cam.z * 0.12);
    [[-0.35, -0.2, 1.1], [0.3, 0.15, 1.25], [0.05, 0.4, 0.95], [-0.1, -0.45, 1.3]].forEach(([dx, dy, h]) => { const s = P(t.x + dx * t.r, t.y + dy * t.r, h * t.r * 1.15); ctx.moveTo(s[0] + R, s[1]); ctx.arc(s[0], s[1], R, 0, 7); });
    ctx.fill();
  }

  /* ---------- carros: duas caixas cada, sem malha nem imagem ---------- */
  const CAR_COLORS = [[232, 236, 244], [196, 58, 50], [60, 92, 170], [96, 106, 124], [226, 184, 70]];
  const movers = [];
  [[ROAD_MID - 2.6, 1, 8.5], [ROAD_MID + 2.6, -1, 7.5]].forEach(([y, dir, v], lane) => {
    [0, 118, 236, 344].forEach((o, i) => movers.push({ x: -240 + o + lane * 47, y, dir, v: v + i * 0.6, axis: 'x', color: CAR_COLORS[(i + lane * 2) % CAR_COLORS.length] }));
  });
  function drawCar(t, c) {
    const a = P(t.x, t.y);
    if (a[0] < -30 || a[0] > W + 30 || a[1] < -30 || a[1] > H + 30) return;
    const L = t.axis === 'x' ? 2.7 : 1.15, D = t.axis === 'x' ? 1.15 : 2.7;
    const box = (l, d) => [[t.x - l, t.y - d], [t.x + l, t.y - d], [t.x + l, t.y + d], [t.x - l, t.y + d]];
    poly(box(L, D).map((q) => [q[0] - 0.7, q[1] - 0.7])); ctx.fillStyle = c.shadow; ctx.fill();
    const col = isEv() ? c.bigWall : NIGHT ? t.color.map((v) => Math.round(v * (1 - 0.45 * NIGHT))) : t.color;
    if (NIGHT > 0.3 && t.v && !isEv()) {
      /* Faróis: facho no chão à frente do carro. */
      const fx = t.x + t.dir * (L + 3.2), f0 = P(fx, t.y); const r = 3.4 * cam.z;
      const g = ctx.createRadialGradient(f0[0], f0[1], 0, f0[0], f0[1], r);
      g.addColorStop(0, `rgba(255,236,190,${(0.42 * NIGHT).toFixed(3)})`); g.addColorStop(1, 'rgba(255,236,190,0)');
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(f0[0], f0[1], r, r * 0.6, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = prev;
    }
    drawExtruded(box(L, D), 1, c, { wall: col, roof: mix(col, 1.04), edge: mix(col, 0.82), floors: 0 });
    drawExtruded(box(L * 0.56, D * 0.86), 1.85, c, { base: 1, wall: isEv() ? mix(col, 0.8).match(/\d+/g).map(Number) : [58, 72, 98], roof: mix(col, 1.08), edge: mix(col, 0.82), floors: 0 });
  }
  const roadInFront = () => cosT > 0.25;
  function roadVisible() {
    for (let x = -260; x <= 200; x += 40) { const a = P(x, ROAD_MID); if (a[0] > -40 && a[0] < W + 40 && a[1] > -40 && a[1] < H + 40) return true; }
    return false;
  }
  function moveCars(dt) {
    movers.forEach((t) => { t.x += t.v * t.dir * dt; if (t.x > 210) t.x = -260; else if (t.x < -260) t.x = 210; });
  }
  const ACROSS = BUILDINGS.filter((b) => b.kind === 'apto' || b.kind === 'bar' || b.kind === 'loja');
  /* Envoltória convexa (cadeia monótona), para a silhueta de um prisma na tela. */
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach((q) => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  /* A cena fica pronta numa camada; a cada passo só os carros são redesenhados sobre ela. */
  const fadeCanvas = document.createElement('canvas');
  let FADE = 380;
  let fadeT = 0;
  function present(c) {
    const scene = ctx;
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.drawImage(baseCanvas, 0, 0);
    if (Q.cars && LAYERS.cars && sv.mix < 0.01 && roadInFront()) {
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx = out;
      /* Com a rodovia na frente, os carros vão numa camada por cima da cena; só os vizinhos do outro lado ficam à frente deles. */
      out.save(); out.beginPath(); out.rect(-1e4, -1e4, 2e4, 2e4);
      ACROSS.forEach((b) => {
        const s = []; b.p.forEach((q) => { s.push(P(q[0], q[1], 0), P(q[0], q[1], b.h + 1.5)); });
        hull(s).forEach((v, i) => (i ? out.lineTo(v[0], v[1]) : out.moveTo(v[0], v[1]))); out.closePath();
      });
      out.clip('evenodd');
      movers.slice().sort((u, v) => u.y - v.y).forEach((t) => drawCar(t, c));
      out.restore();
      ctx = scene;
    }
    if (floorRoute && sv.mix > 0.5) {
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx = out; drawFloorRoute(palBase()); ctx = scene;
    }
    if (fadeT) {
      const a = 1 - (performance.now() - fadeT) / FADE;
      if (a > 0) { out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = a; out.drawImage(fadeCanvas, 0, 0); out.globalAlpha = 1; }
    }
  }
  let carRaf = 0, carLast = 0;
  function carLoop(n) {
    carRaf = 0;
    if (!canvas || !canvas.isConnected) return;
    carRaf = requestAnimationFrame(carLoop);
    if (!Q.cars || n < moveUntil || tween) return;
    const full = !roadInFront();
    if (n - carLast < (full ? 66 : Q.carMs)) return;
    const dt = Math.min(0.12, (n - carLast) / 1000);
    carLast = n;
    if (sv.dim >= 0.9 || sv.mix > 0.01) return;
    moveCars(dt);
    if (raf || !roadVisible()) return;
    tickStat(n);
    if (full) schedule(); else present(pal());
  }

  /* ---------- rota ---------- */
  function drawRoute(c) {
    if (!routeId) return;
    const R = customRoute || ROUTES[routeId]; if (!R || R.length < 2) return;
    const seg = R.slice(1).map((q, i) => Math.hypot(q[0] - R[i][0], q[1] - R[i][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    let left = total * routeP;
    const out = [R[0]];
    for (let i = 0; i < seg.length && left > 0; i++) {
      const k = Math.min(1, left / seg[i]);
      out.push([R[i][0] + (R[i + 1][0] - R[i][0]) * k, R[i][1] + (R[i + 1][1] - R[i][1]) * k]);
      left -= seg[i];
    }
    const stroke = (w, col, dash) => {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash || []);
      ctx.beginPath(); out.forEach((q, i) => { const s = P(q[0], q[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); ctx.setLineDash([]);
    };
    const w = Math.max(3, Math.min(7, 1.1 * cam.z));
    stroke(w + 3, c.routeEdge);
    stroke(w, c.route);
  }

  /* ---------- rótulos ---------- */
  function pill(x, y, text, sel, c, boxes, small, part) {
    /* No modo Campus as plaquinhas são pequenas; no Evento e na sala escolhida, maiores. */
    const tiny = !isEv() && !sel && !part && sv.mix < 0.5;
    ctx.font = `${small || tiny ? 500 : 600} ${sel ? 13 : tiny ? (small ? 8.5 : 9.5) : small ? 10.5 : 11.5}px Onest, system-ui, sans-serif`;
    const w = ctx.measureText(text).width + (tiny ? 8 : small ? 11 : 14); const h = sel ? 24 : tiny ? (small ? 14 : 15) : small ? 18 : 21;
    const bx = x - w / 2, by = y - h - 7;
    if (boxes.some((o) => bx < o[0] + o[2] + 2 && bx + w + 2 > o[0] && by < o[1] + o[3] + 2 && by + h + 2 > o[1])) return false;
    if (bx + w < 0 || bx > W || by + h < 0 || by > H) return false;
    boxes.push([bx, by, w, h]);
    ctx.fillStyle = 'rgba(20,32,64,.16)'; ctx.beginPath(); ctx.roundRect(bx, by + 1.5, w, h, h / 2); ctx.fill();
    ctx.fillStyle = part ? part.pill : sel ? c.labelSel : c.label; ctx.beginPath(); ctx.roundRect(bx, by, w, h, h / 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, by + h - 0.5); ctx.lineTo(x + 5, by + h - 0.5); ctx.lineTo(x, by + h + 5.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = part ? part.ink : sel ? c.labelSelInk : c.labelInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + h / 2 + 0.5);
    return true;
  }
  let labelHits = [];
  function drawLabels(c) {
    const boxes = [];
    labelHits = [];
    if (introRunning) return;
    const rank = (b) => (b.id === selected ? 0 : b.rear ? 2 : 1);
    const all = ALL.filter((b) => !b.noLabel && (!isEv() ? !b.evOnly : EVENT_LABELS.has(b.id)) && (LAYERS.labels || b.id === selected)).sort((a, b) => rank(a) - rank(b));
    all.forEach((b) => {
      if (!grown && growStart !== null && performance.now() - growStart < 900) return;
      const s = P(b.at[0], b.at[1], b.h);
      /* No modo evento, nenhuma parte fica sem nome: se bater em outra, a etiqueta sobe ou desce. */
      const tries = isEv() ? [0, -26, 26, -52] : [0];
      for (const dy of tries) {
        if (pill(s[0], s[1] + dy, isEv() && b.id !== selected ? `${b.label} ›` : b.label, b.id === selected || isEv(), c, boxes, b.rear && b.id !== selected, isEv() ? c.parts[b.id] : null)) { labelHits.push({ id: b.id, box: boxes[boxes.length - 1] }); break; }
      }
    });
    /* Bebedouros: gotinha azul no chão; o escolhido na busca fica maior e com o nome. */
    if (!isEv() && sv.mix < 0.25 && (LAYERS.labels || poiSel)) POIS.forEach((q) => {
      const on = q.id === poiSel; if (!on && cam.z < 0.9) return;
      const s = P(q.at[0], q.at[1], 0.4); const r = on ? 11 : 7.5;
      ctx.fillStyle = 'rgba(20,32,64,.18)'; ctx.beginPath(); ctx.arc(s[0], s[1] + 1.5, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f8fd0'; ctx.save(); ctx.translate(s[0], s[1] + 0.5); ctx.scale(r / 13, r / 13); ctx.fill(ICON.water); ctx.restore();
      if (on) pill(s[0], s[1] - r - 2, `${q.label} · ${q.where}`, true, c, boxes);
    });
    const here = P(START[0], START[1] + 2.5);
    ctx.fillStyle = 'rgba(47,125,225,.22)'; ctx.beginPath(); ctx.arc(here[0], here[1], 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f7de1'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(here[0], here[1], 5.5, 0, 7); ctx.fill(); ctx.stroke();
  }

  /* ---------- fundo do campus: desfoque leve e barato (redução e ampliação, sem filtro) ---------- */
  const AXIS = [-0.49, -0.87], PIVOT = [-70, -120];
  const rearOf = (x, y) => x * AXIS[0] + y * AXIS[1];
  const REAR_A = 119, REAR_B = 150;
  const off = document.createElement('canvas');
  function softenRear(c) {
    const SC = 0.8;
    const w = Math.max(2, Math.round(W * SC)), h = Math.max(2, Math.round(H * SC));
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
    const o = off.getContext('2d');
    const r0 = rearOf(PIVOT[0], PIVOT[1]);
    const at = (v) => P(PIVOT[0] + AXIS[0] * (v - r0), PIVOT[1] + AXIS[1] * (v - r0));
    const a = at(REAR_A), b = at(REAR_B);
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = 'copy'; o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'medium';
    o.drawImage(baseCanvas, 0, 0, w, h);
    o.globalCompositeOperation = 'source-atop'; o.fillStyle = c.fog; o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = 'destination-in';
    const G = o.createLinearGradient(a[0] * SC, a[1] * SC, b[0] * SC, b[1] * SC);
    G.addColorStop(0, 'rgba(0,0,0,0)'); G.addColorStop(1, 'rgba(0,0,0,.85)');
    o.fillStyle = G; o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(off, 0, 0, baseCanvas.width, baseCanvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- andares em volume ---------- */
  /* A planta segue as figuras de 2012 (px da figura do térreo); WORLD leva ao mapa, ajustada ao contorno do levantamento. */
  const WORLD = window.PLAN.world || { sx: 0.0744, sy: 0.0744, x0: -43.488, y0: -49.238 };
  const SX = WORLD.sx, SY = WORLD.sy, X0 = WORLD.x0, Y0 = WORLD.y0, SCALE = (SX + SY) / 2;
  const [VB_W, VB_H] = (window.PLAN.viewBox || '0 0 900 430').split(' ').slice(2).map(Number);
  const wp = ([x, y]) => [X0 + x * SX, Y0 + y * SY];
  const parseOutline = (d) => {
    const out = []; let x = 0, y = 0;
    d.replace(/([MHVZ])\s*(-?[\d.]*)\s*(-?[\d.]*)/g, (_, o, a, b) => {
      if (o === 'M') { x = +a; y = +b; out.push([x, y]); } else if (o === 'H') { x = +a; out.push([x, y]); } else if (o === 'V') { y = +a; out.push([x, y]); }
      return '';
    });
    return out;
  };
  /* Recuo de cada sala para dentro (unidades da planta): entre duas salas sobra um vão, e as paredes não brigam na tela. */
  const ROOM_GAP = 2.2;
  function insetPoly(p, d) {
    const n = p.length; let area = 0;
    for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const s = area > 0 ? 1 : -1;
    const lines = p.map((a, i) => { const b = p[(i + 1) % n]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; const nx = (-(b[1] - a[1]) / L) * s, ny = ((b[0] - a[0]) / L) * s; return [[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d]]; });
    return lines.map((l, i) => {
      const m = lines[(i - 1 + n) % n]; const [p1, p2] = m, [p3, p4] = l;
      const den = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
      if (Math.abs(den) < 1e-9) return p3;
      const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / den;
      return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
    });
  }
  const FLOORS = window.PLAN.floors.map((f) => ({
    level: f.level, label: f.label, raw: f, outline: (f.outlinePts || parseOutline(f.outline)).map(wp),
    zones: f.zones.map((z) => ({ ...z, poly: insetPoly(z.points ? z.points.split(' ').map((q) => q.split(',').map(Number)) : [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.h], [z.x, z.y + z.h]], z.kind === 'wall' ? 0 : ROOM_GAP).map(wp) })),
  }));
  const zoneOf = (lvl, id) => FLOORS[lvl].zones.find((z) => z.id === id);
  const ICON = {
    stairs: new Path2D('M-12 8H-6V3H0V-2H6V-7H12'),
    accessible: new Path2D('M-2-6V1H6L9 8M-6-1A7 7 0 1 0 5 7M1.100-10A2.100 2.100 0 1 1-3.100-10A2.100 2.100 0 1 1 1.100-10'),
    restroom: new Path2D('M-3.500-9A2.500 2.500 0 1 1-8.500-9A2.500 2.500 0 1 1-3.500-9M-9-5H-3V9H-9ZM8.500-9A2.500 2.500 0 1 1 3.500-9A2.500 2.500 0 1 1 8.500-9M6-5 11 6H1Z'),
    water: new Path2D('M0-9C4-3 6 0 6 3A6 6 0 0 1-6 3C-6 0-4-3 0-9Z'),
    reception: new Path2D('M-8 4H8M-6 4A6 6 0 0 1 6 4M0-4V-2'),
  };
  const FILLED = { restroom: 1, water: 1 };
  /* Ícones de uso das salas (traço), no topo de cada sala com número. */
  const USE_D = {
    aula: 'M-9-7H9V4H-9ZM-5 8L-2 4M5 8L2 4',
    lab: 'M-3-9H3M-2-9V-3L-8 7H8L2-3V-9M-5 2H5',
    pc: 'M-9-7H9V4H-9ZM-4 8H4M0 4V8',
    livro: 'M0-6C-3-8-6-8-9-7V7C-6 6-3 6 0 8C3 6 6 6 9 7V-7C6-8 3-8 0-6ZM0-6V8',
    setor: 'M-9-4H9V7H-9ZM-3-4V-7H3V-4M-9 1H9',
    copa: 'M-7-4H5V2A6 6 0 0 1-7 2ZM5-2H8A2 2 0 0 1 8 2H5M-3-9V-6M1-9V-6',
    atos: 'M-3-9H3V1H-3ZM-6-2A6 6 0 0 0 6-2M0 4V8M-4 8H4',
    video: 'M-9-5H4V5H-9ZM4-1L9-4V4L4 1',
    loja: 'M-7-3H7L6 8H-6ZM-3-3V-5A3 3 0 0 1 3-5V-3',
    caixa: 'M-8-4L0-8 8-4V5L0 9-8 5ZM-8-4L0 0 8-4M0 0V9',
    doc: 'M-6-9H3L7-5V9H-6ZM3-9V-5H7M-3-1H4M-3 3H4',
    pessoas: 'M-1-5A3 3 0 1 1-7-5A3 3 0 1 1-1-5M-9 7A5 5 0 0 1 1 7M7-5A3 3 0 1 1 1-5M3 2A5 5 0 0 1 9 7',
    sofa: 'M-9 0V6H9V0M-9 0A2 2 0 0 1-5 0V3H5V0A2 2 0 0 1 9 0M-6 3V-4H6V3M-8 6V8M8 6V8',
  };
  const USE_ICON = Object.fromEntries(Object.entries(USE_D).map(([k, d]) => [k, new Path2D(d)]));
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const GAP_OPEN = 17, GAP_FOCUS = 44;
  const gapNow = () => (GAP_OPEN + (GAP_FOCUS - GAP_OPEN) * sv.focus) * sv.mix;
  const baseOf = (l) => (l - sv.floor) * gapNow();
  const alphaOf = (l) => sv.mix * (1 + (clamp01(1 - Math.abs(l - sv.floor) * 1.5) - 1) * sv.focus);
  let room = null, floorRoute = null, floorRouteP = 0, floorRouteStart = 0, floorRouteFrom = 0, floorRouteTo = 0, floorRouteMs = 0, customRoute = null;
  let levelHits = [], roomLabels = [];
  const WALL = 2.6;

  /* Uma passada só por cor: dezenas de salas viram poucos comandos de desenho. */
  /* Pátio interno: piso amarelo, riacho azul pintado no chão com margem verde e plantas em vaso. */
  const STREAM = (() => {
    const n = 26, top = [], low = [];
    for (let i = 0; i <= n; i++) { const u = i / n, cy = 0.5 + 0.2 * Math.sin(u * Math.PI * 3.2), hw = 0.13 + 0.05 * Math.sin(u * Math.PI * 7); top.push([u, cy - hw]); low.push([u, cy + hw]); }
    return [...top, ...low.reverse()];
  })();
  const POTS = [[0.08, 0.26], [0.3, 0.76], [0.62, 0.24], [0.92, 0.72]];
  function drawCourtyard(q, h, c, plants) {
    poly(q, h); ctx.fillStyle = c.court; ctx.fill();
    poly(STREAM.map(([u, v]) => quadAt(q, u, v)), h);
    ctx.fillStyle = c.stream || '#3f8fd6'; ctx.fill();
    ctx.strokeStyle = c.streamEdge || '#7fb35a'; ctx.lineWidth = Math.max(0.8, cam.z * 0.14); ctx.lineJoin = 'round'; ctx.stroke();
    if (!plants) return;
    POTS.forEach(([u, v]) => {
      const w = quadAt(q, u, v), b0 = P(w[0], w[1], h), t = P(w[0], w[1], h + 0.9);
      ctx.fillStyle = '#a8703f'; ctx.beginPath(); ctx.arc(b0[0], b0[1], Math.max(1, cam.z * 0.22), 0, 7); ctx.fill();
      ctx.fillStyle = '#5f9a45'; ctx.beginPath(); ctx.arc(t[0], t[1], Math.max(1.2, cam.z * 0.5), 0, 7); ctx.fill();
    });
  }
  /* Pátio interno: jardim só no térreo. No 1º e no 2º andar é um vão aberto, com varanda e mureta baixa
     ligando as salas das pontas; a laje tem o furo, e dá para ver o pátio lá embaixo. */
  const yardOf = (f) => (f.level > 0 ? f.zones.find((z) => z.kind === 'courtyard') : null);
  function voidCut(f, b0) {
    const z = yardOf(f); if (!z) return false;
    const h = hull([...z.poly.map((q) => P(q[0], q[1], b0 + 0.02)), ...z.poly.map((q) => P(q[0], q[1], b0 - 0.72))]);
    ctx.save(); ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 2e5);
    h.forEach((u, i) => (i ? ctx.lineTo(u[0], u[1]) : ctx.moveTo(u[0], u[1]))); ctx.closePath(); ctx.clip('evenodd');
    return true;
  }
  const PARAPET = 1.6; // mureta um pouco exagerada para aparecer na escala do mapa
  function drawParapets(f, b0, c) {
    const z = yardOf(f); if (!z) return;
    const [a, b, d, e] = orderYard(z.poly);
    /* Um véu escuro no furo: lê como vão (vê-se o andar de baixo através dele), não como piso. */
    poly(z.poly, b0 - 0.7); ctx.fillStyle = 'rgba(20,32,64,0.09)'; ctx.fill();
    /* Mureta em volta de todo o vão: nas bordas compridas e nas pontas, ligando as salas dos dois lados
       (no 2º andar, 206 com 209 e 208 com 211). Primeiro a mais distante. */
    const sides = [[a, b], [b, d], [d, e], [e, a]].sort((p, q) => P(...lerp2(p[0], p[1], 0.5), b0)[1] - P(...lerp2(q[0], q[1], 0.5), b0)[1]);
    sides.forEach(([u, v]) => {
      wallQuad(u, v, b0 - 0.7, b0 + PARAPET); ctx.fillStyle = c.slab; ctx.fill(); ctx.fillStyle = 'rgba(20,32,64,0.16)'; ctx.fill();
      ctx.strokeStyle = c.plateEdge; ctx.lineWidth = 1; ctx.stroke();
      const s0 = P(u[0], u[1], b0 + PARAPET), s1 = P(v[0], v[1], b0 + PARAPET);
      ctx.strokeStyle = c.plate; ctx.lineWidth = Math.max(1.2, cam.z * 0.22); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    });
  }
  const orderYard = (p) => { const [a, b, d] = [p[0], p[1], p[3]]; return Math.hypot(b[0] - a[0], b[1] - a[1]) >= Math.hypot(d[0] - a[0], d[1] - a[1]) ? p : [p[1], p[2], p[3], p[0]]; };
  /* Corredor da esquerda (no térreo, a passagem do Anexo até a saída do auditório) e o canto aberto que pega sol. */
  function drawFloorMarks(f, b0, c) {
    const raw = f.raw; const lane = raw.corridors.find((k) => k.id === 'passagem-anexo');
    const rect = (k, m) => [[k.x + m, k.y + m], [k.x + k.w - m, k.y + m], [k.x + k.w - m, k.y + k.h - m], [k.x + m, k.y + k.h - m]].map(wp);
    const a = ctx.globalAlpha;
    if (lane) { poly(rect(lane, 3), b0 + 0.03); ctx.globalAlpha = a * 0.3; ctx.fillStyle = c.plateEdge; ctx.fill(); ctx.globalAlpha = a; }
    const sun = raw.corridors.find((k) => k.id === 'area-sol');
    if (sun) { poly(rect(sun, 2), b0 + 0.03); ctx.fillStyle = '#f0d27a'; ctx.fill(); }
  }
  /* Áreas de descanso: só o piso marcado (sem móveis inventados). */
  function drawLounges(f, b0, c) {
    const K = c.kinds.lounge || ['#e6f2dc', [190, 214, 176]];
    f.zones.filter((z) => z.kind === 'lounge').forEach((z) => {
      const sel = room && room.level === f.level && room.id === z.id;
      poly(z.poly, b0 + 0.04); ctx.fillStyle = sel ? c.accent : K[0]; ctx.fill();
    });
  }
  /* No térreo, com os andares abertos, o auditório sobe mais que as salas: é um pavimento só, bem alto. */
  const zoneTop = (z) => (z.kind === 'auditorium' ? WALL + 7 * sv.mix * (1 - sv.focus) : WALL);
  function drawLevelLean(f, c) {
    const b0 = baseOf(f.level), a = alphaOf(f.level);
    if (a < 0.01) return;
    ctx.globalAlpha = a;
    const cut = voidCut(f, b0);
    drawExtruded(f.outline, b0, c, { base: b0 - 0.7, wall: c.slab, roof: c.plate, edge: c.plateEdge, floors: 0 });
    if (cut) ctx.restore();
    drawParapets(f, b0, c);
    f.zones.forEach((z) => {
      if (z.kind !== 'courtyard' && z.kind !== 'ramp') return;
      if (z.kind === 'courtyard') { if (f.level === 0) drawCourtyard(orderYard(z.poly), b0 + 0.05, c, false); return; }
      poly(z.poly, b0 + 0.05); ctx.fillStyle = c.rampF; ctx.fill();
    });
    drawFloorMarks(f, b0, c);
    const h = b0 + WALL; const walls = new Map(), tops = new Map(); let selZ = null;
    const showWalls = cam.hv > 0.02;
    f.zones.forEach((z) => {
      if (z.kind === 'courtyard' || z.kind === 'ramp' || z.kind === 'water') return;
      if (room && room.level === f.level && room.id === z.id) { selZ = z; return; }
      const k = c.kinds[z.kind] || c.kinds.classroom;
      if (!tops.has(k[0])) { tops.set(k[0], []); walls.set(mix(k[1], 0.92), []); }
      const T = z.poly.map((q) => P(q[0], q[1], h));
      tops.get(k[0]).push(T);
      if (showWalls) {
        const B = z.poly.map((q) => P(q[0], q[1], b0));
        const sc = signedScreen(z.poly) > 0 ? 1 : -1; const bucket = walls.get(mix(k[1], 0.92));
        B.forEach((u, i) => { const j = (i + 1) % B.length; if ((B[j][0] - u[0]) * sc < 0) bucket.push([u, B[j], T[j], T[i]]); });
      }
    });
    const fillAll = (list) => { ctx.beginPath(); list.forEach((q) => { q.forEach((s, i) => { if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); }); };
    walls.forEach((list, col) => { if (list.length) { fillAll(list); ctx.fillStyle = col; ctx.fill(); } });
    tops.forEach((list, col) => { fillAll(list); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = c.roomEdge; ctx.lineWidth = 1; ctx.stroke(); });
    if (selZ) drawExtruded(selZ.poly, h + sv.rise, c, { base: b0, wall: c.accentWall, roof: c.accent, edge: c.accent, floors: 0 });
    ctx.globalAlpha = 1;
  }

  function drawLevel(f, c) {
    const b0 = baseOf(f.level), a = alphaOf(f.level);
    if (a < 0.01) return;
    const K = c.kinds;
    const detail = sv.focus > 0.5;
    ctx.globalAlpha = a;
    const cut = voidCut(f, b0);
    drawExtruded(f.outline, b0, c, { base: b0 - 0.7, wall: c.slab, roof: c.plate, edge: c.plateEdge, floors: 0 });
    if (cut) ctx.restore();
    drawParapets(f, b0, c);
    /* itens no plano do piso */
    f.zones.filter((z) => z.kind === 'courtyard' || z.kind === 'ramp').forEach((z) => {
      if (z.kind === 'courtyard') {
        if (f.level === 0) drawCourtyard(orderYard(z.poly), b0 + 0.05, c, true);
      } else {
        poly(z.poly, b0 + 0.05); ctx.fillStyle = c.rampF; ctx.fill(); ctx.strokeStyle = c.plateEdge; ctx.lineWidth = 1; ctx.stroke();
        /* Mureta entre as duas pistas: a pessoa sobe por uma, dá a volta no alto e segue pela outra. */
        const [r0, r1, r2, r3] = z.poly; const m0 = lerp2(r0, r3, 0.2), m1 = lerp2(r1, r2, 0.2), e0 = lerp2(r3, r0, 0), e1 = lerp2(r2, r1, 0);
        const a0 = P(...lerp2(m0, m1, 0.5), b0 + 0.05), a1 = P(...lerp2(e0, e1, 0.5), b0 + 0.05);
        ctx.strokeStyle = c.plateEdge; ctx.lineWidth = Math.max(1, cam.z * 0.16); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
      }
    });
    drawFloorMarks(f, b0, c);
    drawLounges(f, b0, c);
    if (detail && cam.z > 5) {
      ctx.strokeStyle = c.door; ctx.lineWidth = Math.max(1.4, cam.z * 0.18); ctx.lineCap = 'round';
      f.raw.doors.forEach((d) => {
        const u = wp(d.axis === 'h' ? [d.x - 9, d.y] : [d.x, d.y - 9]), v = wp(d.axis === 'h' ? [d.x + 9, d.y] : [d.x, d.y + 9]);
        const s = P(u[0], u[1], b0 + 0.04), e = P(v[0], v[1], b0 + 0.04);
        ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      });
    }
    /* Salas: todas da mesma altura, então primeiro todas as paredes (de trás para a frente) e depois todos os tetos.
       Assim nenhuma sala grande cobre a vizinha, e a ordem não troca ao girar. A sala escolhida e o auditório,
       mais altos, entram depois, e as salas à frente deles são redesenhadas por cima. */
    const solids = f.zones.filter((z) => !['courtyard', 'ramp', 'water', 'lounge'].includes(z.kind))
      .map((z) => { const m = centroid(z.poly); return { z, d: depth(m[0], m[1]), sel: room && room.level === f.level && room.id === z.id }; });
    const tall = solids.filter((o) => o.sel || zoneTop(o.z) > WALL + 0.01).sort((p, q) => p.d - q.d);
    const low = solids.filter((o) => !tall.includes(o));
    const boxes = (list) => {
      const walls = [];
      list.forEach(({ z }) => {
        const p = z.poly; const scr = signedScreen(p) > 0 ? 1 : -1; const ws = worldSign(p);
        p.forEach((a, i) => { const b = p[(i + 1) % p.length]; const A = P(a[0], a[1]), B = P(b[0], b[1]); if ((B[0] - A[0]) * scr < 0) walls.push({ a, b, z, ws, d: depth((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }); });
      });
      if (cam.hv > 0.02) walls.sort((u, v) => u.d - v.d).forEach(({ a, b, z, ws }) => { const k = K[z.kind] || K.classroom; wallQuad(a, b, b0, b0 + WALL); ctx.fillStyle = mix(k[1], shadeOf(a, b, ws)); ctx.fill(); });
      ctx.lineWidth = Math.max(0.7, 0.16 * cam.z); ctx.lineJoin = 'round';
      list.forEach(({ z }) => { const k = K[z.kind] || K.classroom; poly(z.poly, b0 + WALL); ctx.fillStyle = k[0]; ctx.fill(); ctx.strokeStyle = c.roomEdge; ctx.stroke(); });
    };
    boxes(low);
    tall.forEach((t) => {
      const h = b0 + zoneTop(t.z) + (t.sel ? sv.rise : 0); const k = K[t.z.kind] || K.classroom;
      drawExtruded(t.z.poly, h, c, { base: b0, wall: t.sel ? c.accentWall : k[1], roof: t.sel ? c.accent : k[0], edge: t.sel ? c.accent : c.roomEdge, floors: 0 });
      const front = low.filter((o) => o.d > t.d);
      if (front.length) boxes(front);
    });
    ctx.globalAlpha = 1;
  }

  /* Linha única: da entrada do prédio, pelo térreo, subindo escada ou rampa até a porta da sala. */
  function drawFloorRoute(c) {
    if (!floorRoute) return;
    const R = floorRoute.path; const fade = 1 - sv.focus;
    const hOf = (q) => (q[2] - sv.floor) * gapNow() + 0.3;
    const alphaAt = (a, b) => (a[2] === b[2] && Number.isInteger(a[2]) ? alphaOf(a[2]) : sv.mix * fade);
    let left = floorRoute.total * floorRouteP;
    const runs = [];
    let head = null;
    for (let i = 0; i < R.length - 1 && left > 0; i++) {
      const a = R[i], b = R[i + 1]; const L = floorRoute.seg[i]; const k = Math.min(1, left / (L || 1)); left -= L;
      const e = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      const al = alphaAt(a, b);
      const s0 = P(a[0], a[1], hOf(a)), s1 = P(e[0], e[1], hOf(e));
      head = { p: s1, al };
      if (al < 0.02) continue;
      const last = runs[runs.length - 1];
      if (last && Math.abs(last.al - al) < 0.01) last.pts.push(s1); else runs.push({ al, pts: [s0, s1] });
    }
    /* Poço da escada entre os andares, para o caminho quadrado ter onde se apoiar. */
    if (floorRoute.box && floorRoute.level > 0 && sv.focus < 0.5 && sv.mix > 0.5) {
      ctx.globalAlpha = sv.mix * (1 - sv.focus * 2) * 0.55; ctx.strokeStyle = c.route; ctx.lineWidth = 1; ctx.beginPath();
      floorRoute.box.forEach((q) => { const a = P(q[0], q[1], (0 - sv.floor) * gapNow()), b = P(q[0], q[1], (floorRoute.level - sv.floor) * gapNow() + WALL); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    const w = Math.max(2.4, Math.min(6, cam.z * 0.42));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (col, lw) => runs.forEach((r) => {
      ctx.globalAlpha = r.al; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      r.pts.forEach((q, i) => { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    });
    stroke(c.routeEdge, w + 3); stroke(c.route, w);
    ctx.globalAlpha = 1;
    /* Ponto de partida: a entrada, ou a chegada ao andar depois do zoom. */
    const startQ = sv.focus > 0.5 && floorRoute.level > 0 ? R[floorRoute.arriveI] : R[0];
    const st = P(startQ[0], startQ[1], hOf(startQ));
    ctx.fillStyle = '#2f7de1'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(st[0], st[1], 6, 0, 7); ctx.fill(); ctx.stroke();
    if (floorRouteP < 1 && head && head.al > 0.05) {
      ctx.fillStyle = c.route; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(head.p[0], head.p[1], Math.max(5, w), 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  function drawStackLabels(c) {
    const boxes = [];
    levelHits = [];
    if (sv.mix < 0.8) return;
    if (sv.focus < 0.5) {
      /* etiqueta de cada andar, na ponta do volume */
      FLOORS.slice().reverse().forEach((f) => {
        const a = alphaOf(f.level); if (a < 0.4) return;
        const m = centroid(f.outline);
        const s = P(m[0], m[1], baseOf(f.level) + WALL);
        if (pill(s[0], s[1] + 8, `${f.label} ›`, false, c, boxes)) levelHits.push({ level: f.level, box: boxes[boxes.length - 1] });
      });
      return;
    }
    const f = FLOORS[Math.round(sv.floor)];
    if (Math.abs(sv.floor - f.level) > 0.12) return;
    const b0 = baseOf(f.level);
    const list = f.zones.slice().sort((a, b) => (room && a.id === room.id ? -1 : room && b.id === room.id ? 1 : 0));
    list.forEach((z) => {
      if (['courtyard', 'ramp', 'wall'].includes(z.kind)) return;
      const m = z.points ? wp([z.labelX, z.labelY]) : centroid(z.poly);
      const sel = room && room.level === f.level && room.id === z.id;
      const s = P(m[0], m[1], b0 + (z.kind === 'water' ? 0.8 : zoneTop(z) + (sel ? sv.rise : 0)));
      if (sel) { pill(s[0], s[1] - 2, c.roomName(z), true, c, boxes); return; }
      const onDark = c.kinds[z.kind] && c.kinds[z.kind][2];
      const ink = onDark ? '#ffffff' : c.labelInk;
      if (ICON[z.kind] && cam.z > 3) {
        const icon = ICON[z.kind];
        const sc = Math.min(0.85, Math.max(0.45, cam.z * 0.085));
        ctx.save(); ctx.translate(s[0], s[1]); ctx.scale(sc, sc);
        if (FILLED[z.kind]) { ctx.fillStyle = z.kind === 'water' ? '#2f8fd0' : ink; ctx.fill(icon); } else { ctx.strokeStyle = ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(icon); }
        ctx.restore();
        return;
      }
      const text = z.roomNumber || (z.kind === 'auditorium' ? 'Auditório' : z.kind === 'reception' ? 'Recepção' : z.kind === 'lounge' ? 'Descanso' : '');
      if (!text) return;
      const size = z.roomNumber ? Math.min(14, Math.max(9.500, cam.z * 1.15)) : Math.min(14, Math.max(9.500, cam.z * 1.05));
      ctx.font = `${z.roomNumber ? 700 : 600} ${size}px Geologica, Onest, system-ui, sans-serif`;
      const w = ctx.measureText(text).width;
      const useIcon = z.icon && USE_ICON[z.icon] && cam.z > 1.6;
      const ih = useIcon ? size + 2 : 0;
      const bx = s[0] - w / 2, by = s[1] - size / 2 - ih;
      if (boxes.some((o) => bx < o[0] + o[2] + 1 && bx + w + 1 > o[0] && by < o[1] + o[3] && by + size + ih > o[1])) return;
      boxes.push([bx, by, w, size + ih]);
      if (useIcon) {
        const sc = Math.min(0.75, Math.max(0.5, size / 18));
        ctx.save(); ctx.translate(s[0], s[1] - size * 0.95); ctx.scale(sc, sc);
        ctx.strokeStyle = ink; ctx.globalAlpha *= 0.8; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(USE_ICON[z.icon]);
        ctx.restore();
      }
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s[0], s[1] + (useIcon ? 2 : 0));
      const ev = (window.DATA?.sessions || []).some((x) => x.floor === f.level && x.zone === z.id);
      if (ev) { ctx.fillStyle = c.gate; ctx.beginPath(); ctx.arc(s[0] + w / 2 + 6, s[1] - 2, 3, 0, 7); ctx.fill(); }
    });
  }

  function stackTap(x, y) {
    if (sv.focus < 0.5) {
      const hit = levelHits.find(({ box: [bx, by, w, h] }) => x >= bx - 4 && x <= bx + w + 4 && y >= by - 4 && y <= by + h + 8);
      if (hit) { hooks.onFloor?.(hit.level); return; }
      for (let l = 2; l >= 0; l--) {
        if (inPoly(x, y, FLOORS[l].outline.map((q) => P(q[0], q[1], baseOf(l) + WALL / 2)))) { hooks.onFloor?.(l); return; }
      }
      return;
    }
    const f = FLOORS[Math.round(sv.floor)];
    const b0 = baseOf(f.level);
    const cands = f.zones.filter((z) => !['courtyard', 'ramp', 'water', 'wall'].includes(z.kind))
      .map((z) => { const m = centroid(z.poly); return { z, d: depth(m[0], m[1]) }; }).sort((p, q) => q.d - p.d);
    const hit = cands.find(({ z }) => inPoly(x, y, z.poly.map((q) => P(q[0], q[1], b0 + WALL))) || inPoly(x, y, z.poly.map((q) => P(q[0], q[1], b0))));
    hooks.onRoom?.(f.level, hit ? hit.z.id : null);
  }

  /* Caminho pelos corredores: Dijkstra numa grade, preferindo o meio do corredor. */
  const PATHS = new Map();
  function gridPath(level, start, goal) {
    const cacheKey = `${level}|${start}|${goal}`;
    if (PATHS.has(cacheKey)) return PATHS.get(cacheKey);
    const f = FLOORS[level].raw; const STEP = 5;
    const inC = (x, y) => f.corridors.some((c) => (c.poly ? inPoly(x, y, c.poly) : x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h));
    f.corridors.forEach((c) => { if (c.points && !c.poly) c.poly = c.points.split(' ').map((q) => q.split(',').map(Number)); });
    const key = (x, y) => `${x},${y}`;
    const snap = (p) => [Math.round(p[0] / STEP) * STEP, Math.round(p[1] / STEP) * STEP];
    const nearest = (p) => {
      let best = null, bd = Infinity;
      for (let x = 0; x <= VB_W; x += STEP) for (let y = 0; y <= VB_H; y += STEP) if (inC(x, y)) { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = [x, y]; } }
      return best;
    };
    const s = inC(...snap(start)) ? snap(start) : nearest(start); const g = inC(...snap(goal)) ? snap(goal) : nearest(goal);
    const cost = new Map([[key(...s), 0]]); const prev = new Map(); const open = [s]; const seen = new Set();
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (cost.get(key(...open[i])) < cost.get(key(...open[bi]))) bi = i;
      const u = open.splice(bi, 1)[0]; const ku = key(...u);
      if (seen.has(ku)) continue; seen.add(ku);
      if (u[0] === g[0] && u[1] === g[1]) break;
      [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]].forEach(([dx, dy]) => {
        const v = [u[0] + dx, u[1] + dy]; if (!inC(v[0], v[1])) return;
        const edge = inC(v[0] - 10, v[1]) && inC(v[0] + 10, v[1]) && inC(v[0], v[1] - 10) && inC(v[0], v[1] + 10) ? 1 : 1.8;
        const turn = prev.has(ku) ? (key(u[0] - dx, u[1] - dy) === prev.get(ku) ? 0 : 3) : 0;
        const nc = cost.get(ku) + edge * STEP + turn; const kv = key(...v);
        if (nc < (cost.get(kv) ?? Infinity)) { cost.set(kv, nc); prev.set(kv, ku); open.push(v); }
      });
    }
    const path = []; let cur = key(...g);
    while (cur) { path.unshift(cur.split(',').map(Number)); cur = prev.get(cur); }
    const full = [start, ...path, goal];
    const simple = full.filter((q, i) => i === 0 || i === full.length - 1 || !((full[i - 1][0] === q[0] && q[0] === full[i + 1][0]) || (full[i - 1][1] === q[1] && q[1] === full[i + 1][1])));
    PATHS.set(cacheKey, simple);
    return simple;
  }
  function doorOf(level, id) {
    const f = FLOORS[level].raw; const z = zoneOf(level, id);
    const xs = z.poly.map((q) => (q[0] - X0) / SX), ys = z.poly.map((q) => (q[1] - Y0) / SY);
    const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const dist = (d) => Math.hypot(Math.max(bb[0] - d.x, 0, d.x - bb[2]), Math.max(bb[1] - d.y, 0, d.y - bb[3]));
    const door = f.doors.slice().sort((a, b) => dist(a) - dist(b))[0];
    return door && dist(door) < 6 ? [door.x, door.y] : [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
  }
  /* As três entradas do bloco principal, com o caminho externo desde a portaria. */
  const ENTRANCES = {
    principal: { name: 'entrada principal', plan: (window.PLAN.entrances || {}).principal || [820, 385], campus: [START, [13, 11], [15, -4], [17, -17]] },
    auditorio: { name: 'entrada do auditório', plan: (window.PLAN.entrances || {}).auditorio || [172, 335], campus: [START, [13, 11], [-23, 8], [-27, -8], [-31, -17]] },
    anexo: { name: 'entrada do Anexo', plan: (window.PLAN.entrances || {}).anexo || [245, 25], campus: [START, [13, 11], [-23, 8], [-27, -8], [-48, -13], [-49.5, -50], [-50, -68], [-44.6, -66], [-39, -61.5], [-27, -60], [-25.3, -53]] },
  };
  const uTurn = (xA, xB, yLow, yTop) => {
    const cx = (xA + xB) / 2, R = (xB - xA) / 2; const out = [[xA, yLow], [xA, yTop + R]];
    for (let i = 1; i < 10; i++) { const a = Math.PI - (i / 10) * Math.PI; out.push([cx + R * Math.cos(a), yTop + R - R * Math.sin(a)]); }
    out.push([xB, yTop + R], [xB, yLow]);
    return out;
  };
  const VERTS = (() => {
    const f = FLOORS[1].raw; const st = f.zones.find((q) => q.kind === 'stairs'); const rp = f.zones.find((q) => q.kind === 'ramp');
    const footS = [st.x + st.w, st.y + st.h / 2], footR = window.PLAN.rampFoot || [rp.x + rp.w * 0.48, rp.y + rp.h + 24];
    /* Escada: uma volta quadrada por andar, sempre subindo. */
    const i = 6, x0 = st.x + i, x1 = st.x + st.w - i, y0 = st.y + i, y1 = st.y + st.h - i, ym = st.y + st.h / 2;
    return {
      escada: { where: 'da ala oeste', foot: footS, enter: [footS, [x1, ym]], loop: [[x1, ym], [x1, y1], [x0, y1], [x0, y0], [x1, y0], [x1, ym]], exit: [footS], weight: 1.6, turns: 3, box: [[st.x, st.y], [st.x + st.w, st.y], [st.x + st.w, st.y + st.h], [st.x, st.y + st.h]] },
      rampa: { where: 'do lado leste', foot: footR, enter: [footR], loop: window.PLAN.rampLoop || [footR, ...uTurn(rp.x + rp.w * 0.26, rp.x + rp.w * 0.74, rp.y + rp.h, rp.y + 7), footR], exit: [], weight: 1 },
    };
  })();
  const polyLen = (L) => L.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - L[i][0], q[1] - L[i][1]), 0);
  const PLANS = new Map();
  /* Escolhe a combinação mais rápida de entrada e de escada ou rampa. */
  function planFor(level, zone, forced) {
    const cacheKey = `${level}|${zone}|${forced || ''}`;
    if (PLANS.has(cacheKey)) return PLANS.get(cacheKey);
    const goal = doorOf(level, zone); let best = null;
    Object.entries(ENTRANCES).forEach(([eid, e]) => {
      (level ? (forced ? [forced] : ['escada', 'rampa']) : [null]).forEach((vid) => {
        const v = vid && VERTS[vid];
        const a = gridPath(0, e.plan, v ? v.foot : goal); const b = v ? gridPath(level, v.foot, goal) : [];
        const cost = polyLen(e.campus) + (polyLen(a) + polyLen(b)) * SCALE + (v ? polyLen(v.loop) * SCALE * v.weight * level : 0);
        if (!best || cost < best.cost) best = { cost, eid, vid, a, b };
      });
    });
    const toW = (L, l) => L.map((q) => { const w = wp(q); return [w[0], w[1], l]; });
    let path = toW(best.a, 0); let climbI = path.length - 1, arriveI = path.length - 1;
    if (best.vid) {
      const V = VERTS[best.vid]; const total = polyLen(V.loop);
      V.enter.forEach((q) => { const w = wp(q); path.push([w[0], w[1], 0]); });
      /* Voltas curtas: quanto mais voltas por andar, mais o movimento se lê como um quadrado subindo. */
      const turns = V.turns || 1;
      for (let l = 0; l < level; l++) {
        for (let t = 0; t < turns; t++) {
          let run = 0;
          V.loop.forEach((q, i) => {
            if (i) run += Math.hypot(q[0] - V.loop[i - 1][0], q[1] - V.loop[i - 1][1]);
            if (!i) return;
            const w = wp(q); path.push([w[0], w[1], l + (t + run / total) / turns]);
          });
        }
        path[path.length - 1][2] = l + 1;
      }
      V.exit.forEach((q) => { const w = wp(q); path.push([w[0], w[1], level]); });
      arriveI = path.length - 1;
      path = path.concat(toW(best.b, level).slice(1));
    }
    const seg = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1]));
    const total = seg.reduce((n, x) => n + x, 0) || 1;
    const until = (idx) => seg.slice(0, idx).reduce((n, x) => n + x, 0) / total;
    const plan = { box: best.vid && VERTS[best.vid].box ? VERTS[best.vid].box.map(wp) : null, level, zone, entrance: ENTRANCES[best.eid].name, eid: best.eid, via: best.vid, viaWhere: best.vid && VERTS[best.vid].where, cost: best.cost, campus: ENTRANCES[best.eid].campus, path, seg, total, arriveI, climbAt: until(climbI), arriveAt: until(arriveI), pts: path.slice(arriveI).map((q) => [q[0], q[1]]) };
    PLANS.set(cacheKey, plan);
    return plan;
  }

  /* ---------- quadro ---------- */
  const stat = { d: [], last: 0 };
  function tickStat(n) { if (stat.last && n - stat.last < 800) { stat.d.push(n - stat.last); if (stat.d.length > 60) stat.d.shift(); } stat.last = n; }
  const summarize = (d) => { if (!d.length) return { fps: 0, p95: 0 }; const a = d.slice().sort((x, y) => x - y); return { fps: Math.round(1000 / (a[a.length >> 1] || 1)), p95: Math.round(a[Math.floor(a.length * 0.95)]) }; };
  function camMoved() {
    return baseCam && (cam.x !== baseCam.x || cam.y !== baseCam.y || cam.z !== baseCam.z);
  }
  /* Enquanto a câmera só anda ou aproxima, reposiciona a última imagem pronta: custa quase nada. */
  function canBlit(now) {
    if (!baseCam || baseCam.w !== baseCanvas.width) return false;
    if (cam.t !== baseCam.t || cam.k !== baseCam.k || cam.hv !== baseCam.hv) return false;
    if (baseCam.mix !== sv.mix || baseCam.focus !== sv.focus || baseCam.floor !== sv.floor || baseCam.dim !== sv.dim || baseCam.rise !== sv.rise) return false;
    const ratio = cam.z / baseCam.z;
    if (ratio < 0.45 || ratio > 2.2) return false;
    return !noBlit && camMoved() && (tween || now < moveUntil) && frameCost >= Q.quickMs;
  }
  function blit(c) {
    const r = cam.z / baseCam.z; const cy = (insetT + H - insetB) / 2;
    const rx = (o) => o.x * cosT - o.y * sinT, ry = (o) => o.x * sinT + o.y * cosT;
    const tx = (W / 2) * (1 - r) + (rx(baseCam) - rx(cam)) * cam.z;
    const ty = cy * (1 - r) + (ry(baseCam) - ry(cam)) * cam.k * cam.z;
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.fillStyle = c.land || c.sky; out.fillRect(0, 0, out.canvas.width, out.canvas.height);
    out.setTransform(dpr * r, 0, 0, dpr * r, dpr * tx, dpr * ty);
    out.imageSmoothingEnabled = true;
    out.drawImage(baseCanvas, 0, 0, W, H);
    out.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (floorRoute) { const scene = ctx; ctx = out; drawFloorRoute(palBase()); ctx = scene; }
  }
  /* Se a animação real ficar lenta, desce um nível, sem interromper a viagem. */
  let lastTick = 0, badWindows = 0;
  function watchSpeed(now, animating) {
    if (!animating) { lastTick = 0; return; }
    if (lastTick) samples.push(now - lastTick);
    lastTick = now;
    if (samples.length < 16 || benchLock) return;
    const sorted = samples.slice().sort((a, b) => a - b); const med = sorted[sorted.length >> 1];
    samples.length = 0;
    /* Duas janelas lentas seguidas: um tranco isolado, como o da abertura, não derruba a qualidade. */
    badWindows = med < (tierName === 'leve' ? 95 : 48) ? 0 : badWindows + 1;
    if (qSetting !== 'auto' || badWindows < 2 || document.hidden) return;
    badWindows = 0;
    const next = ORDER[ORDER.indexOf(tierName) + 1];
    if (!next) return;
    writeLS(MEASURED, next);
    pendingDemote = next;
  }
  function applyDemote() {
    if (!pendingDemote || journeyEnd) return;
    if (pendingDemote === 'simples' && (tween || sv.mix > 0.01 && sv.focus < 0.5)) return;
    const n = pendingDemote; pendingDemote = false;
    qAuto.why = 'animação lenta medida neste aparelho';
    setTier(n);
    hooks.onQuality?.(n);
  }
  function setTier(n) {
    tierName = n; Q = TIERS[n]; document.documentElement.dataset.perf = n;
    if (!Q.view3d && !flat) { flat = true; cam.hv = 0; cam.k = 1; cam.t = 0; }
    size(); dirty = true;
  }
  /* Canteiro das duas fileiras de arbustos da entrada, com flores vermelhas. */
  const BEDS = HEDGES;
  const BLOOMS = (() => { const r = rng(77); return BEDS.flatMap((q) => Array.from({ length: 64 }, () => [q[0][0] + r() * (q[1][0] - q[0][0]), q[0][1] + r() * (q[2][1] - q[0][1])])); })();
  function drawFlowerbeds(c) {
    ctx.fillStyle = '#5e9a45'; BEDS.forEach((q) => { poly(q); ctx.fill(); });
    if (Q.lean || cam.z < 1.6) return;
    ctx.fillStyle = '#d8402f'; ctx.beginPath();
    BLOOMS.forEach(([x, y]) => { const s = P(x, y, 0.3); const R = Math.max(0.7, cam.z * 0.17); ctx.moveTo(s[0] + R, s[1]); ctx.arc(s[0], s[1], R, 0, 7); });
    ctx.fill();
  }
  function paintWorld(c) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (sv.dim < 0.995) {
    const near = (p, m) => { const q = centroid(p); return onScreen(q[0], q[1], m); };
    drawGround(c);
    drawFlowerbeds(c);
    drawRoute(c);
    if (Q.shadows && LAYERS.shadows) drawShadows(c);
    const items = [];
    BUILDINGS.forEach((b) => { if (!near(b.p, 70 * cam.z + 60)) return; const m = centroid(b.p); items.push({ d: depth(m[0], m[1]), f: () => drawBuilding(b, c) }); });
    COVERS.forEach((b) => { const m = centroid(b.p); items.push({ d: depth(m[0], m[1]), f: () => { drawCover(b, c); if (paintStart && !isEv()) paintOver(b, c, (ec) => drawCover(b, ec)); } }); });
    if (!Q.lean || cam.z > 2) tanks.forEach((t) => { if (onScreen(t[0], t[1], 20)) items.push({ d: depth(t[0], t[1]), f: () => drawTank(t, c) }); });
    const net = FLATS.find((b) => b.id === 'volei');
    if (net && !Q.lean) items.push({ d: depth(...centroid(net.p)), f: () => drawNet(net, c) });
    const fld = FLATS.find((b) => b.id === 'campo');
    if (fld && !Q.lean) { const q = fieldQuad(fld); [0.05, 0.95].forEach((u) => { const m = quadAt(q, u, 0.5); items.push({ d: depth(m[0], m[1]), f: () => drawGoal(q, u, c) }); }); }
    const pool = FLATS.find((b) => b.id === 'piscina');
    if (pool) pool.p.forEach((a, i) => {
      const e = pool.p[(i + 1) % pool.p.length]; const n = Math.max(1, Math.round(Math.hypot(e[0] - a[0], e[1] - a[1]) / 6));
      for (let k = 0; k < n; k++) { const u = lerp2(a, e, k / n), v = lerp2(a, e, (k + 1) / n), m = lerp2(u, v, 0.5); if (Q.ground > 0 && onScreen(m[0], m[1], 40)) items.push({ d: depth(m[0], m[1]), f: () => drawFenceSeg(u, v, c) }); }
    });
    if (LAYERS.trees) trees.forEach((t) => { if (!(Q.lean && t.far) && onScreen(t.x, t.y, 40)) items.push({ d: depth(t.x, t.y), f: () => drawTree(t, c) }); });
    if (Q.ground > 0) HOUSES.forEach((t) => { if (onScreen(t.m[0], t.m[1], 30)) items.push({ d: depth(t.m[0], t.m[1]), f: () => drawHouse(t, c) }); });
    ENT.big.forEach((b) => { const m = centroid(b.pts); if (onScreen(m[0], m[1], 120)) items.push({ d: depth(m[0], m[1]), f: () => drawExtruded(b.pts, b.h, c, { wall: c.bigWall, roof: c.bigRoof, edge: c.roofEdge, floors: 0 }) }); });
    if (Q.ground > 0) [...ENT.lots.map((l) => [...l.pts, l.pts[0]]), ...ENT.fences].forEach((L) => { for (let i = 0; i < L.length - 1; i++) { const a = L[i], e = L[i + 1], m = lerp2(a, e, 0.5); if (onScreen(m[0], m[1], 100)) items.push({ d: depth(m[0], m[1]), f: () => { wallQuad(a, e, 0, 1.5); ctx.fillStyle = mix(c.lotWall, 1); ctx.fill(); } }); } });
    if (cam.z > 0.7 && Q.bushes) bushes.forEach((t) => { if (onScreen(t.x, t.y, 12)) items.push({ d: depth(t.x, t.y), f: () => drawBush(t, c) }); });
    const muro = pts(22); const ms = worldSign(muro);
    if (Q.lean) { poly(muro); ctx.strokeStyle = mix(c.muro, 0.8); ctx.lineWidth = Math.max(1, 0.5 * cam.z); ctx.stroke(); }
    else muro.forEach((a0, i) => {
      const b0 = muro[(i + 1) % muro.length];
      /* Na frente, o muro abre nas duas entradas. */
      const front = Math.abs(a0[1] - 48.335) < 0.01 && Math.abs(b0[1] - 48.335) < 0.01;
      const pieces = front ? gapsOut(a0, b0, [[1.5, 8.5], [11.8, 18.3]]) : [[a0, b0]];
      pieces.forEach(([a, b]) => {
      /* corta em trechos para a ordem de pintura funcionar em muros longos */
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14));
      for (let k = 0; k < n; k++) {
        const u = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]; const v = [a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n];
        const my = (u[1] + v[1]) / 2;
        if (!onScreen((u[0] + v[0]) / 2, my, 40 + 7 * cam.z)) continue;
        items.push({ d: depth((u[0] + v[0]) / 2, my), f: () => drawWallSeg({ a: u, b: v, sign: ms, front: my > 40 }, c) });
      }
      });
    });
    /* Postes da rodovia, cones da entrada e coberturas do estacionamento da Brisanet. */
    if (!Q.lean) {
      POLES.forEach((x, i) => { if (onScreen(x, POLE_Y, 60)) items.push({ d: depth(x, POLE_Y), f: () => drawPole(x, POLES[i + 1], c) }); });
      if (onScreen(GARDEN.lamp[0], GARDEN.lamp[1], 40)) items.push({ d: depth(...GARDEN.lamp), f: () => drawLamp(GARDEN.lamp, c) });
      if (cam.z > 1.1) CONES.forEach((q) => { if (onScreen(q[0], q[1], 10)) items.push({ d: depth(q[0], q[1]), f: () => drawCone(q, c) }); });
      if (Q.ground > 0) {
        SHADES.forEach((q) => { if (onScreen(q[0], q[1], 20)) items.push({ d: depth(q[0], q[1]), f: () => drawShade(q, c) }); });
        PARKED.forEach((t) => { if (onScreen(t.x, t.y, 10)) items.push({ d: depth(t.x, t.y), f: () => drawCar({ ...t, color: CAR_COLORS[t.k] }, c) }); });
      }
    }
    if (Q.cars && LAYERS.cars && !roadInFront() && sv.mix < 0.01) movers.forEach((t) => items.push({ d: depth(t.x, t.y), f: () => drawCar(t, c) }));
    items.sort((p, q) => p.d - q.d);
    items.forEach((o) => o.f());
    if (Q.soften && !isEv()) softenRear(c);
    if (DUSK > 0.02 && !isEv()) { ctx.fillStyle = `rgba(255,140,60,${(0.13 * DUSK).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (sv.mix < 0.25) drawLabels(c); else labelHits = [];
    }
    if (sv.dim > 0.001) { ctx.globalAlpha = sv.dim; ctx.fillStyle = palBase().sky; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (sv.mix > 0.001) { const fc = palBase(); FLOORS.forEach((f) => (Q.lean ? drawLevelLean : drawLevel)(f, fc)); drawStackLabels(fc); }
  }
  function frame() {
    raf = 0;
    if (!canvas || !canvas.isConnected) { canvas = null; return; }
    const now = performance.now();
    let again = false, soft = false;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.ms); const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      if (tween.fn) tween.fn(k); else tween.keys.forEach(([o, key, a, b]) => { o[key] = a + (b - a) * e; });
      dirty = true;
      if (k >= 1) { const done = tween.done; tween = null; done(true); } else again = true;
    }
    if (!grown && growStart !== null) { dirty = true; if (now - growStart > 1200) grown = true; else again = true; }
    if (paintStart) { dirty = true; again = true; }
    if (insetAnim) {
      const k = Math.min(1, (now - insetAnim.t0) / 520); const e = 1 - (1 - k) ** 3;
      insetB = insetAnim.from + (insetAnim.to - insetAnim.from) * e; dirty = true;
      if (k >= 1) insetAnim = null; else again = true;
    }
    if (floorRouteMs) {
      const k = Math.min(1, (now - floorRouteStart) / floorRouteMs); const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      floorRouteP = floorRouteFrom + (floorRouteTo - floorRouteFrom) * e;
      if (k >= 1) floorRouteMs = 0; else soft = true;
    }
    if (routeId && routeP < 1) { routeP = reduce ? 1 : Math.min(1, (now - routeStart) / 1300); again = true; dirty = true; }
    if (fadeT) { if (now - fadeT < FADE) soft = true; else fadeT = 0; }
    watchSpeed(now, again || soft);
    if (again || soft) tickStat(now);
    if (!again && !soft) applyDemote();
    syncAngle();
    if (!dirty) { present(pal()); if (soft) raf = requestAnimationFrame(frame); return; }
    if (canBlit(now)) {
      blit(pal());
      dirty = false;
      if (again || soft) raf = requestAnimationFrame(frame);
      return;
    }
    dirty = false;
    const t0 = performance.now();
    const c = pal();
    paintWorld(c);
    baseCam = { x: cam.x, y: cam.y, z: cam.z, t: cam.t, k: cam.k, hv: cam.hv, mix: sv.mix, focus: sv.focus, floor: sv.floor, dim: sv.dim, rise: sv.rise, w: baseCanvas.width };
    present(c);
    const cost = performance.now() - t0; frameCost = frameCost ? frameCost * 0.7 + cost * 0.3 : cost;
    if (again) { dirty = true; raf = requestAnimationFrame(frame); } else if (soft) raf = requestAnimationFrame(frame);
  }
  function schedule() { dirty = true; if (!raf) raf = requestAnimationFrame(frame); }
  function scheduleSoft() { if (!raf) raf = requestAnimationFrame(frame); }

  /* ---------- enquadramento ---------- */
  function bounds(list, k) {
    const s = Math.sin(cam.t), co = Math.cos(cam.t);
    let a = Infinity, b = -Infinity, d = Infinity, e = -Infinity;
    list.forEach(([x, y]) => { const u = x * co - y * s, v = (x * s + y * co) * k; a = Math.min(a, u); b = Math.max(b, u); d = Math.min(d, v); e = Math.max(e, v); });
    return { a, b, d, e };
  }
  function view(list, t, pad = 26, extraTop = 18, k = cam.k, extraH = 0, maxZ = 40) {
    if (flat) { k = 1; extraH = 0; if (t !== FLOOR_T) t = 0; } else if (k === 1) k = 0.64;
    const keep = cam.t; cam.t = t;
    const B = bounds(list, k); cam.t = keep;
    const availW = Math.max(40, W - pad * 2), availH = Math.max(40, H - insetT - insetB - pad - extraTop);
    const z = Math.min(maxZ, availW / (B.b - B.a), availH / (B.e - B.d + extraH));
    const u = (B.a + B.b) / 2, v = (B.d + B.e) / 2 / k;
    const co = Math.cos(t), s = Math.sin(t);
    return { x: u * co + v * s, y: -u * s + v * co, z, t, k, hv: flat ? 0 : 1 };
  }
  const allPts = () => [...pts(22), [15, 56]];
  const eventPts = () => [...pts(0), ...pts(4), ...pts(5), ...pts(8), [15, 52]];
  const homeView = (t = 0.5) => {
    if (!isEv()) return view(corePts(), t, 24, 30, 0.64);
    /* Conta a altura do bloco principal, para o telhado não ficar sob as abas. */
    const rise = (BUILDINGS.find((b) => b.id === 'principal').h * HV) / 0.64; const si = Math.sin(t), co = Math.cos(t);
    return view([...eventPts(), ...pts(0).map((q) => [q[0] - si * rise, q[1] - co * rise])], t, 30, 54, 0.64);
  };
  const regionPts = () => [[-340, -300], [300, -300], [300, 320], [-340, 320]];
  const corePts = () => [...pts(0), ...pts(1), ...pts(3), ...pts(4), ...pts(5), ...pts(6), ...pts(7), ...pts(8), [-12, 93], [34, 93]];
  const zmax = () => (sv.mix > 0.5 ? 34 : 8);
  const zmin = () => (sv.mix > 0.5 ? 2.2 : view(regionPts(), cam.t, 10, 10, 0.64).z * 0.9);
  const clamp = () => {
    if (isEv() && sv.mix < 0.5) {
      /* No modo evento, pode aproximar e afastar, mas o evento não sai de vista. */
      cam.z = Math.max(view(allPts(), cam.t, 26, 18, 0.64).z * 0.85, Math.min(zmax(), cam.z));
      cam.x = Math.max(-95, Math.min(75, cam.x)); cam.y = Math.max(-110, Math.min(70, cam.y));
      return;
    }
    cam.z = Math.max(zmin(), Math.min(zmax(), cam.z)); cam.x = Math.max(-420, Math.min(340, cam.x)); cam.y = Math.max(-480, Math.min(360, cam.y)); };
  /* Anima câmera (x, y, z, t, k) e cena (mix, focus, floor, dim, rise). Devolve promessa. */
  function crossfade() {
    if (reduce || !canvas || !canvas.width) return;
    fadeCanvas.width = canvas.width; fadeCanvas.height = canvas.height;
    fadeCanvas.getContext('2d').drawImage(canvas, 0, 0);
    fadeT = performance.now();
  }
  function anim(to, ms = 700) {
    /* No 3D leve, o campus some num esmaecer pronto, sem redesenhar o mundo a cada quadro. */
    if (Q.lean && to.dim === 1 && sv.dim < 1) { crossfade(); sv.dim = 1; to = { ...to }; delete to.dim; dirty = true; }
    if (tween) { tween.done(false); tween = null; }
    return new Promise((done) => {
      const set = (o, key, v) => { o[key] = v; };
      if (reduce || !ms) { Object.entries(to).forEach(([key, v]) => set(key in cam ? cam : sv, key, v)); syncAngle(); schedule(); done(true); return; }
      const keys = Object.entries(to).map(([key, v]) => {
        const o = key in cam ? cam : sv;
        let b = v;
        if (key === 't') { while (b - cam.t > Math.PI) b -= Math.PI * 2; while (b - cam.t < -Math.PI) b += Math.PI * 2; }
        return [o, key, o[key], b];
      });
      tween = { keys, t0: performance.now(), ms, done };
      schedule();
    });
  }
  const fly = (to, ms) => anim(to, ms);

  /* ---------- toque ---------- */
  function pick(x, y) {
    syncAngle();
    const lab = labelHits.find(({ box: [bx, by, w, h] }) => x >= bx - 3 && x <= bx + w + 3 && y >= by - 3 && y <= by + h + 8);
    if (lab) return lab.id;
    const list = ALL.filter((b) => !b.noLabel && (!isEv() ? !b.evOnly : EVENT_LABELS.has(b.id)))
      .map((b) => { const m = centroid(b.p); return { b, d: depth(m[0], m[1]) }; }).sort((p, q) => (q.b.sub ? 1 : 0) - (p.b.sub ? 1 : 0) || q.d - p.d);
    for (const { b } of list) {
      const p = b.p;
      const hit = (h) => {
        const s = p.map((q) => P(q[0], q[1], h));
        return inPoly(x, y, s);
      };
      if (hit(b.h) || hit(0) || hit(b.h / 2)) return b.id;
    }
    return null;
  }
  let settleT = 0;
  function settle() { clearTimeout(settleT); settleT = setTimeout(schedule, 150); }
  function bind(cv) {
    const ptrs = new Map();
    let moved = 0, pinch = null;
    const local = (e) => { const r = cv.getBoundingClientRect(); const k = r.width ? cv.clientWidth / r.width : 1; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, local(e)); moved = journeyEnd ? 99 : 0; pinch = null;
      if (journeyEnd) journeyEnd(); else if (tween) { tween.done(false); tween = null; }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId); const cur = local(e); ptrs.set(e.pointerId, cur);
      if (ptrs.size === 1) {
        const sx = (cur[0] - prev[0]) / cam.z, sy = (cur[1] - prev[1]) / (cam.z * cam.k);
        cam.x -= sx * cosT + sy * sinT; cam.y -= -sx * sinT + sy * cosT;
        moved += Math.abs(cur[0] - prev[0]) + Math.abs(cur[1] - prev[1]);
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
        if (pinch) { cam.z *= d / pinch.d; cam.t += ang - pinch.ang; }
        pinch = { d, ang }; moved = 99;
      }
      moveUntil = performance.now() + 130; clamp(); schedule();
      settle();
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const cur = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); pinch = null;
      if (e.type !== 'pointerup' || moved >= 7 || ptrs.size) return;
      if (sv.mix > 0.5) stackTap(cur[0], cur[1]); else if (onPick) onPick(pick(cur[0], cur[1]));
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); cam.z *= e.deltaY > 0 ? 0.9 : 1.1; if (tween) { tween.done(false); tween = null; } moveUntil = performance.now() + 130; clamp(); schedule(); settle(); }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      const step = 22 / cam.z; const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (k) { e.preventDefault(); cam.x += k[0] * cosT + k[1] * sinT; cam.y += -k[0] * sinT + k[1] * cosT; clamp(); schedule(); }
    });
  }
  function size() {
    if (!canvas) return;
    W = canvas.clientWidth; H = canvas.clientHeight;
    dpr = Math.min(Q.dpr, window.devicePixelRatio || 1);
    const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    if (baseCanvas.width !== cw || baseCanvas.height !== ch) { baseCanvas.width = cw; baseCanvas.height = ch; baseCam = null; dirty = true; }
  }

  /* ---------- enquadramentos do prédio ---------- */
  const STACK_T = 0.62, STACK_K = 0.6, FLOOR_T = 1.42, FLOOR_K = 0.84;
  const plateAll = () => FLOORS[0].outline;
  const viewStack = () => view(plateAll(), STACK_T, 22, 16, STACK_K, (GAP_OPEN * 2 * 0.92) / 1, 9);
  const viewFloor = (l) => view(FLOORS[l].outline, FLOOR_T, 16, 10, FLOOR_K);
  const viewRoom = (l, id, R) => {
    const z = zoneOf(l, id); if (!z) return viewFloor(l);
    const p = R && R.length ? [...R, ...z.poly] : z.poly.flatMap((q) => [[q[0] + 7, q[1] + 7], [q[0] - 7, q[1] - 7]]);
    return view(p, FLOOR_T, 34, 44, FLOOR_K, 0, 15);
  };
  let runId = 0, journeyEnd = null;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  /* Faz a linha crescer até a fração indicada. */
  const trail = (to, ms) => {
    if (reduce || !ms) { floorRouteP = to; floorRouteMs = 0; schedule(); return Promise.resolve(); }
    floorRouteFrom = floorRouteP; floorRouteTo = to; floorRouteMs = ms; floorRouteStart = performance.now(); scheduleSoft();
    return wait(ms);
  };

  let firstView = true;
  const hooks = {};
  window.Campus3D = {
    /* Liga o motor a um canvas novo; câmera e cena sobrevivem às trocas de tela. */
    attach(cv, opts) {
      canvas = cv; out = cv.getContext('2d', { alpha: false }); ctx = baseCanvas.getContext('2d', { alpha: false }); onPick = opts.onPick;
      hooks.onRoom = opts.onRoom; hooks.onFloor = opts.onFloor; hooks.onQuality = opts.onQuality;
      /* Quando a folha de baixo muda de altura, o centro do mapa desliza em vez de pular. */
      insetT = opts.top || 0; const nb = opts.bottom || 0;
      if (firstView || reduce || Math.abs(nb - insetB) < 4) { insetB = nb; insetAnim = null; } else insetAnim = { from: insetB, to: nb, t0: performance.now() };
      size(); if (!cv.__bound) { cv.__bound = true; bind(cv); } syncAngle();
      if (firstView) {
        firstView = false;
        Object.assign(cam, homeView());
        if (!reduce && !opts.skipGrow) growStart = performance.now(); else grown = true;
      }
      if (!cv.__ro) { cv.__ro = new ResizeObserver(() => { if (canvas === cv) { size(); schedule(); } }); cv.__ro.observe(cv); }
      document.fonts?.ready.then(schedule);
      schedule();
      if (!reduce && !carRaf && Q.cars) { carLast = performance.now(); carRaf = requestAnimationFrame(carLoop); }
    },
    select(id) { selected = id; if (id) poiSel = null; if (routeId && routeId !== id) routeId = null; schedule(); },
    focus(id) {
      const b = byId(id); if (!b) return;
      const p = b.p;
      const t = flat ? 0 : b.viewT ?? cam.t;
      const pad = b.viewT ? 7 : 12;
      anim(view([...p, ...p.map((q) => [q[0] + pad, q[1] + pad]), ...p.map((q) => [q[0] - pad, q[1] - pad])], t, 50, 70, cam.k, b.h * 0.9), 750);
    },
    route(id) {
      routeId = id; routeP = 0; routeStart = performance.now();
      const b = byId(id); const poi = POIS.find((p) => p.id === id);
      if (poi) { poiSel = id; selected = null; }
      anim(view([...(ROUTES[id] || []), ...(b ? b.p : poi ? [poi.at] : [])], cam.t, 44, 60), 700);
    },
    clearRoute() { routeId = null; schedule(); },
    routeOn: (id) => routeId === id,
    zoom(f) { anim({ z: Math.max(zmin(), Math.min(zmax(), cam.z * f)) }, 220); },
    rotate(deg) { anim({ t: cam.t + (deg * Math.PI) / 180 }, 620); },
    /* botão de enquadrar: campus do evento, terreno todo, andar ou prédio */
    fit() {
      if (sv.mix > 0.5) { anim(sv.focus > 0.5 ? viewFloor(Math.round(sv.floor)) : viewStack(), 500); return; }
      if (isEv()) { anim(homeView(cam.t), 650); return; }
      const zAll = view(allPts(), cam.t, 26, 18, 0.64).z, zRegion = view(regionPts(), cam.t, 10, 10, 0.64).z;
      if (cam.z <= zRegion * 1.2) anim(view(corePts(), cam.t, 24, 30, 0.64), 800);
      else if (cam.z <= zAll * 1.2) anim(view(regionPts(), cam.t, 10, 10, 0.64), 800);
      else anim(view(allPts(), cam.t, 26, 18, 0.64), 700);
    },
    fitAll() { anim(homeView(cam.t), 700); },
    /* Modo evento (padrão) ou campus completo. */
    setMode(m) {
      if (m === mode) return false;
      if (!reduce && baseCanvas.width) {
        fadeCanvas.width = baseCanvas.width; fadeCanvas.height = baseCanvas.height;
        fadeCanvas.getContext('2d').drawImage(canvas || baseCanvas, 0, 0);
        fadeT = performance.now();
      }
      mode = m; selected = null; routeId = null;
      schedule();
      return true;
    },
    getMode: () => mode,
    /* Alterna entre a vista de cima (2D) e a inclinada (3D). */
    isFlat: () => flat,
    canUse3D: () => Q.view3d,
    stats: () => ({ ...summarize(stat.d), cost: Math.round(frameCost), tier: tierName, setting: qSetting, dpr }),
    tiers: () => ORDER.slice(),
    /* Teste do aparelho: gira a câmera (pior caso) e faz uma viagem até o 2º andar. */
    async benchTier(name) {
      benchLock = true; samples.length = 0; pendingDemote = false;
      const previous = tierName; const flat0 = flat;
      setTier(name); flat = !Q.view3d;
      ++runId; journeyEnd = null; room = null; floorRoute = null; routeId = null; selected = null;
      Object.assign(sv, { mix: 0, focus: 0, floor: 1, dim: 0, rise: 0 });
      Object.assign(cam, homeView()); cam.hv = flat ? 0 : 1; syncAngle(); schedule();
      const rec = (ms) => new Promise((res) => { const d = []; let last = performance.now(); const t0 = last; const f = (n) => { d.push(n - last); last = n; if (n - t0 < ms) requestAnimationFrame(f); else res(summarize(d)); }; requestAnimationFrame(f); });
      await wait(250);
      noBlit = true;
      const p1 = rec(2200);
      if (flat) anim({ z: cam.z * 1.5 }, 2200); else anim({ t: cam.t + 1.1 }, 2200);
      const giro = await p1;
      noBlit = false;
      const p2 = rec(flat ? 1500 : 6500);
      const viagem = this.journey(2, 'labs-norte-2', {});
      await viagem; const rota = await p2;
      ++runId; journeyEnd = null; room = null; floorRoute = null; floorRouteMs = 0; routeId = null; customRoute = null; tween = null;
      Object.assign(sv, { mix: 0, focus: 0, floor: 1, dim: 0, rise: 0 });
      flat = flat0; setTier(previous); if (!Q.view3d) flat = true;
      Object.assign(cam, homeView()); cam.hv = flat ? 0 : 1; syncAngle(); schedule();
      benchLock = false; samples.length = 0;
      return { tier: name, giro, rota };
    },
    /* Imagem parada para a prévia de uma sala ou prédio. */
    preview(cv, opt) {
      const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
      const saved = { W, H, dpr, insetT, insetB, ctx, room, floorRoute, selected, flat, mode, Q, grown, labelHits, levelHits, sv: { ...sv }, cam: { ...cam } };
      W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1); insetT = 0; insetB = 0;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx = cv.getContext('2d', { alpha: false }); Q = TIERS.media; flat = false; grown = true; floorRoute = null;
      if (opt.zone) {
        Object.assign(sv, { mix: 1, focus: 1, floor: opt.floor, dim: 1, rise: 1.2 }); room = { level: opt.floor, id: opt.zone }; selected = null;
        const z = zoneOf(opt.floor, opt.zone); const pad = Math.max(9, Math.sqrt(area(z.poly)) * 0.7);
        Object.assign(cam, view(z.poly.flatMap((q) => [[q[0] + pad, q[1] + pad], [q[0] - pad, q[1] - pad]]), 0.62, 6, 6, 0.66), { hv: 1 });
      } else {
        Object.assign(sv, { mix: 0, focus: 0, floor: 1, dim: 0, rise: 0 }); room = null; mode = 'evento'; selected = opt.place;
        const b = byId(opt.place); const pad = 26;
        Object.assign(cam, view(b.p.flatMap((q) => [[q[0] + pad, q[1] + pad], [q[0] - pad, q[1] - pad]]), 0.5, 6, 6, 0.64), { hv: 1 });
      }
      syncAngle(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintWorld(pal());
      W = saved.W; H = saved.H; dpr = saved.dpr; insetT = saved.insetT; insetB = saved.insetB; ctx = saved.ctx; room = saved.room; floorRoute = saved.floorRoute; selected = saved.selected;
      flat = saved.flat; mode = saved.mode; Q = saved.Q; grown = saved.grown; labelHits = saved.labelHits; levelHits = saved.levelHits;
      Object.assign(sv, saved.sv); Object.assign(cam, saved.cam); syncAngle();
      return Object.keys(IMG).length > 10;
    },
    setReduced(v) { reduce = v; },
    /* Automática, alta, média ou simples. */
    setQuality(v) {
      qSetting = v; writeLS('etal-qualidade', v);
      pendingDemote = false; badWindows = 0;
      if (v === 'auto') { try { localStorage.removeItem(MEASURED); } catch (_) { /* opcional */ } qAuto = detectTier(); }
      const was = Q.view3d;
      setTier(v === 'auto' ? qAuto.tier : v);
      if (Q.view3d && !was && sv.mix < 0.01) { flat = false; anim(homeView(), 0); }
      schedule();
      return tierName;
    },
    /* Guarda a versão que o teste do aparelho recomendou e passa a usá-la no automático. */
    useTested(name) {
      if (!TIERS[name]) return;
      writeLS(TESTED, name); try { localStorage.removeItem(MEASURED); } catch (_) { /* opcional */ }
      qAuto = detectTier();
      if (qSetting === 'auto') this.setQuality('auto');
    },
    quality: () => ({ setting: qSetting, tier: tierName, why: qSetting === 'auto' ? qAuto.why : 'escolha manual', info: qAuto.info }),
    setAccent(hex) {
      const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      [PAL.light, PAL.dark].forEach((pl) => { pl.accent = hex; pl.accentWall = rgb.map((v) => Math.round(v * 0.8)); });
      nightCache.clear();
      schedule();
    },
    /* Hora do dia (0–24) para a luz do mapa, ou null para dia sempre. */
    setHour(h) {
      hourOn = h;
      const ramp = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
      const n = h == null ? 0 : Math.max(1 - ramp(5.2, 6.4, h), ramp(17.6, 18.8, h));
      const d = h == null ? 0 : Math.max(Math.exp(-(((h - 17.6) / 0.7) ** 2)), Math.exp(-(((h - 5.9) / 0.6) ** 2))) * (1 - n * 0.7);
      const n2 = Math.round(n * 20) / 20, d2 = Math.round(d * 20) / 20;
      /* Sol de verdade: direção e comprimento das sombras. Sem horário, a luz fixa de sempre. */
      let lx = 0.52, ly = 0.85, k = 0.72;
      if (h != null) {
        const s = sunAt(h);
        if (s.el > 2) {
          const a = (s.az * Math.PI) / 180; const dx = NORTH[0] * Math.cos(a) + EAST[0] * Math.sin(a), dy = NORTH[1] * Math.cos(a) + EAST[1] * Math.sin(a);
          const L = Math.hypot(dx, dy) || 1; lx = dx / L; ly = dy / L; k = Math.min(2.6, 1 / Math.tan((s.el * Math.PI) / 180));
        } else k = 0;
      }
      lx = Math.round(lx * 50) / 50; ly = Math.round(ly * 50) / 50; k = Math.round(k * 20) / 20;
      if (n2 === NIGHT && d2 === DUSK && lx === LIGHT[0] && ly === LIGHT[1] && k === SHADOW_K) return;
      NIGHT = n2; DUSK = d2; LIGHT[0] = lx; LIGHT[1] = ly; SHADOW_K = k; schedule();
    },
    hour: () => ({ hour: hourOn, night: NIGHT, dusk: DUSK }),
    setLayers(v) { Object.assign(LAYERS, v); schedule(); },
    pois: () => POIS.map((q) => ({ ...q, min: Math.max(1, Math.round((Math.hypot(q.at[0] - START[0], q.at[1] - START[1]) * 1.35) / 75)) })),
    focusPoi(id) {
      const q = POIS.find((p) => p.id === id); if (!q) return;
      poiSel = id; selected = null; const [x, y] = q.at;
      anim(view([[x - 14, y - 14], [x + 14, y - 14], [x + 14, y + 14], [x - 14, y + 14]], cam.t, 50, 70, cam.k, 2), 800);
    },
    clearPoi() { poiSel = null; schedule(); },
    /* Câmera para guardar e restaurar entre visitas. */
    getView: () => ({ x: cam.x, y: cam.y, z: cam.z, t: cam.t, k: cam.k, hv: cam.hv }),
    setView(v) { if (v && Number.isFinite(v.x)) { Object.assign(cam, v); syncAngle(); grown = true; growStart = null; schedule(); } },
    /* Entrada no mapa. 'full': um movimento só, contínuo: começa em 3D, de cima, com o horizonte todo; aproxima
       indo para o IF; no meio do caminho inclina, passa rápido pela Elétrica e pelos apartamentos e termina com o
       campus em perspectiva. 'short': aproximação rápida até a vista guardada. */
    async intro(kind) {
      if (reduce || !kind) return;
      if (kind === 'short') {
        const to = { x: cam.x, y: cam.y, z: cam.z, t: cam.t };
        Object.assign(cam, { z: cam.z * 0.8, t: cam.t - 0.14 }); syncAngle(); schedule();
        await anim(to, 560); return;
      }
      if (flat) flat = false;
      const end = { ...view(corePts(), 0.5, 24, 30, 0.64), hv: 1 };
      const far = { ...view(regionPts(), -0.4, 10, 10, 0.99), hv: 0.06 };
      const mid = { ...view([[-150, -150], [90, -150], [90, 130], [-150, 130]], -0.2, 20, 20, 0.93), hv: 0.22 };
      const pass = { ...view([[-75, -60], [60, -60], [60, 150], [-75, 150]], 0.24, 20, 30, 0.72), hv: 0.8 };
      const K = [far, far, mid, pass, end, end]; const T = [0, 0.43, 0.72, 1];
      const ch = ['x', 'y', 'lz', 't', 'k', 'hv'];
      K.forEach((q) => { q.lz = Math.log(q.z); });
      const cr = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
      introRunning = true; grown = true; growStart = null;
      Object.assign(cam, { x: far.x, y: far.y, z: far.z, t: far.t, k: far.k, hv: far.hv }); syncAngle(); schedule();
      await new Promise((done) => {
        if (tween) { tween.done(false); tween = null; }
        tween = { t0: performance.now(), ms: 4600, keys: [], done, fn: (k) => {
          const e = 0.5 - Math.cos(Math.PI * k) / 2; // um único ritmo: acelera e desacelera uma vez
          let i = 0; while (i < 2 && e > T[i + 1]) i++;
          const u = (e - T[i]) / (T[i + 1] - T[i]);
          const v = {}; ch.forEach((c) => { v[c] = cr(K[i][c], K[i + 1][c], K[i + 2][c], K[i + 3][c], u); });
          Object.assign(cam, { x: v.x, y: v.y, z: Math.exp(v.lz), t: v.t, k: v.k, hv: Math.max(0, Math.min(1, v.hv)) });
        } };
        schedule();
      });
      introRunning = false; schedule();
    },
    /* Do campus para o evento: as cores se dissolvem, as partes do evento sobem do chão uma a uma
       e a câmera se ajusta ao enquadramento do evento. */
    async eventReveal() {
      if (reduce) { this.setMode('evento'); return; }
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      introRunning = true; paintStart = performance.now(); schedule();
      await wait(1450);
      FADE = 700; this.setMode('evento'); paintStart = 0;
      await wait(700);
      FADE = 380; introRunning = false; schedule();
    },
    layers: () => ({ ...LAYERS }),
    /* Sol agora e fachadas do bloco principal que recebem sol (a frente olha para o oeste). */
    sunInfo(h = hourOn) {
      if (h == null) return null;
      const s = sunAt(h); const a = (s.az * Math.PI) / 180;
      const lit = (az0) => s.el > 2 && Math.cos(a - (az0 * Math.PI) / 180) > 0.12;
      return { el: Math.round(s.el), az: Math.round(s.az), up: s.el > 0, facades: { norte: lit(0), leste: lit(90), sul: lit(180), oeste: lit(270) } };
    },
    /* Copia da planta (window.PLAN) os números e nomes das salas, depois de o app aplicar a numeração da organização. */
    syncRooms() {
      FLOORS.forEach((F) => F.zones.forEach((z) => { const r = F.raw.zones.find((q) => q.id === z.id); if (r) Object.assign(z, { roomNumber: r.roomNumber, name: r.name, label: r.label }); }));
      schedule();
    },
    setFlat(v) {
      if (!Q.view3d && !v) return;
      if (v === flat) return;
      flat = v;
      if (sv.mix > 0.5) {
        if (sv.focus > 0.5) { const l = Math.round(sv.floor); anim(room ? viewRoom(l, room.id, floorRoute?.pts) : viewFloor(l), 620); } else anim(viewStack(), 620);
      } else if (selected) this.focus(selected);
      else anim(homeView(), 620);
    },
    /* do modelo para os andares abertos */
    async openStack() {
      if (!Q.view3d) return this.goFloor(0);
      const id = ++runId; journeyEnd = null; room = null; floorRoute = null; selected = null;
      if (sv.mix < 0.5) await anim(view(pts(0), 0.5, 60, 60, 0.64), 550);
      if (id !== runId) return;
      await anim({ mix: 1, focus: 0, floor: 1, rise: 0, dim: 1, ...viewStack() }, 850);
    },
    /* trocar de andar: elevador entre os volumes */
    async goFloor(level) {
      ++runId; journeyEnd = null; room = null; floorRoute = null;
      if (sv.mix < 0.5 && Q.view3d) { await this.openStack(); }
      const id = ++runId;
      if (id !== runId) return;
      await anim({ mix: 1, focus: 1, floor: level, rise: 0, dim: 1, ...viewFloor(level) }, sv.focus > 0.5 ? 720 : 950);
    },
    /* escolhe uma sala já no andar aberto */
    async room(level, zone) {
      ++runId; journeyEnd = null;
      room = zone ? { level, id: zone } : null;
      floorRoute = null; floorRouteMs = 0;
      if (!zone) { await anim({ rise: 0, ...viewFloor(level) }, 420); return; }
      await anim({ rise: 1.2, ...viewRoom(level, zone, null) }, 620);
    },
    /* Como chegar: uma linha só, da portaria até a porta da sala, passando pelos três andares abertos. */
    async journey(level, zone, { via = null } = {}) {
      const id = ++runId; const alive = () => id === runId;
      const plan = planFor(level, zone, via);
      const end = () => {
        journeyEnd = null; ++runId; routeId = null; customRoute = null; selected = null;
        room = { level, id: zone };
        floorRoute = plan; floorRouteP = 1; floorRouteMs = 0;
        anim({ mix: 1, focus: 1, floor: level, dim: 1, rise: 1.2, ...viewRoom(level, zone, plan.pts) }, 260);
      };
      journeyEnd = end;
      room = null; floorRoute = null; floorRouteMs = 0;
      if (tierName === 'simples') {
        /* Sem câmera voando: abre o andar, e a linha percorre o caminho. */
        floorRoute = plan; floorRouteP = plan.arriveAt; room = { level, id: zone }; routeId = null;
        journeyEnd = null;
        await anim({ mix: 1, focus: 1, floor: level, dim: 1, rise: 1.2, ...viewRoom(level, zone, plan.pts) }, 0);
        await trail(1, 700);
        return;
      }
      if (sv.mix < 0.5) {
        selected = 'principal'; customRoute = plan.campus; routeId = 'principal'; routeP = 0; routeStart = performance.now();
        await anim(view([...plan.campus, ...pts(0)], 0.5, 44, 50, 0.64), 800); if (!alive()) return;
        await wait(750); if (!alive()) return;
        selected = null;
      }
      if (flat) {
        /* Em 2D não há pilha: a linha anda no térreo, o andar troca e ela continua. */
        floorRoute = plan; floorRouteP = 0;
        await anim({ mix: 1, focus: 1, floor: 0, dim: 1, rise: 0, ...viewFloor(0) }, 850); if (!alive()) return;
        routeId = null; customRoute = null;
        if (level) {
          await trail(plan.climbAt, 1100); if (!alive()) return;
          await Promise.all([anim({ floor: level, ...viewFloor(level) }, 950), trail(plan.arriveAt, 950)]); if (!alive()) return;
        }
      } else {
        await anim({ mix: 1, focus: 0, floor: 1, dim: 1, rise: 0, ...viewStack() }, sv.mix > 0.5 ? 650 : 950); if (!alive()) return;
        routeId = null; customRoute = null;
        floorRoute = plan; floorRouteP = 0;
        await trail(level ? plan.arriveAt : Math.min(1, plan.arriveAt + 0.6), plan.via === 'escada' ? 3600 : 2600); if (!alive()) return;
        await wait(350); if (!alive()) return;
        await anim({ focus: 1, floor: level, dim: 1, ...viewFloor(level) }, 1000); if (!alive()) return;
      }
      journeyEnd = null;
      room = { level, id: zone };
      await Promise.all([trail(1, 950), anim({ rise: 1.2, ...viewRoom(level, zone, plan.pts) }, 800)]);
    },
    routeInfo: (level, zone, via = null) => { const q = planFor(level, zone, via); return { via: q.via, viaWhere: q.viaWhere, entrance: q.entrance, cost: Math.round(q.cost) }; },
    reframe(level, zone) { return anim({ rise: zone ? 1.2 : 0, ...(zone ? viewRoom(level, zone, floorRoute?.pts) : viewFloor(level)) }, 480); },
    /* volta ao campus: o prédio se fecha e a câmera recua */
    async toCampus() {
      ++runId; journeyEnd = null; room = null; floorRoute = null;
      if (Q.lean) { crossfade(); await anim({ focus: 0, floor: 1, rise: 0, mix: 0, dim: 0, ...homeView() }, 0); scheduleSoft(); return; }
      await anim({ focus: 0, floor: 1, rise: 0, mix: 0, dim: 0, ...homeView() }, 900);
    },
    inStack: () => sv.mix > 0.5,
    state: () => ({ mix: sv.mix, focus: sv.focus, floor: sv.floor, room, hasRoute: !!floorRoute, route: floorRoute && { p: +floorRouteP.toFixed(2), entrance: floorRoute.entrance, via: floorRoute.via } }),
    redraw: schedule,
    useIcons: USE_D,
    areaOf: (id) => area(byId(id).p),
    hasRoute: (id) => (ROUTES[id] || []).length > 1,
    places: () => ALL.filter((b) => !b.noLabel).map((b) => b.id),
    eventColors: () => Object.fromEntries(Object.entries(pal().parts || palBase().mono.parts).map(([k, v]) => [k, v.roof || v.pill])),
    /* para testes: pontos de rota dentro de prédios e tempo de desenho */
    routeHits() {
      const out = [];
      Object.entries(ROUTES).forEach(([id, R]) => {
        const walls = BUILDINGS.filter((b) => b.id !== id && b.kind !== 'gate' && b.kind !== 'hex');
        for (let i = 0; i < R.length - 1; i++) for (let t = 0; t <= 1; t += 0.05) {
          const q = lerp2(R[i], R[i + 1], t);
          const hit = walls.find((b) => inPoly(q[0], q[1], b.p));
          if (hit) { out.push(`${id}: ${q.map((v) => v.toFixed(0))} em ${hit.id}`); return; }
        }
      });
      return out;
    },
    spritesReady: () => Object.keys(IMG).length,
    bench(n = 30) { const t0 = performance.now(); for (let i = 0; i < n; i++) { const r = raf; raf = 0; dirty = true; baseCam = null; frame(); if (raf) { cancelAnimationFrame(raf); } raf = r; } return (performance.now() - t0) / n; },
    /* pontos na tela, para testes */
    screenOf(id) { syncAngle(); const b = byId(id); return P(b.at[0], b.at[1], b.h / 2); },
    screenOfRoom(l, id) { syncAngle(); const z = zoneOf(l, id); const m = centroid(z.poly); return P(m[0], m[1], baseOf(l) + WALL); },
    screenOfFloor(l) { syncAngle(); const m = centroid(FLOORS[l].outline); return P(m[0], m[1], baseOf(l) + WALL); },
    cars: () => movers.map((t) => Math.round(t.x)),
    cam,
  };
})();
