/* ETAL Connect · protótipo navegável (proposta Crachá).
   O login consulta o SUAP pelo servidor local (server.py); a programação, as presenças e o resto são mockados. */
(() => {
  'use strict';
  const D = window.DATA;
  const P = window.PLAN;
  const $ = (s, el = document) => el.querySelector(s);
  const osReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reduce = osReduce;
  const byId = (id) => D.sessions.find((s) => s.id === id);
  const dayOf = (n) => D.days.find((d) => d.day === n);

  /* ---------------- ícones ---------------- */
  const ICONS = {
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    nav: '<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
    flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    file: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4"/>',
    pdf: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
    zip: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M11 6h1M11 9h1M11 12h1v3h-1z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5 6 3H3v3l3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10Z"/><path d="M12 3v4M21 10l-5 0M17 20l-2.5-5M7 20l2.5-5M3 10h5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.500-2.900-5.500 2.900 1-6.200L3 9.600l6.200-.900Z"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.500 14-1.500 8 5-3 5 3-1.500-8"/>',
    chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3.500A8 8 0 1 1 21 12Z"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    moon: '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500Z"/>',
    text: '<path d="M4 19 9 6l5 13M5.800 15h6.400M15 19l3-7 3 7M16 17h4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    contact: '<circle cx="9" cy="8" r="3.500"/><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6"/>',
    alarm: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.300 21a1.900 1.900 0 0 0 3.400 0"/>',
    rotate: '<path d="M4 12a8 8 0 0 1 13.700-5.700L20 8.600M20 4v4.600h-4.600"/><path d="M20 12a8 8 0 0 1-13.700 5.700L4 15.400M4 20v-4.600h4.600"/>',
    expand: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M2 21h20M8 8h3M8 12h3M8 16h3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  };
  const ic = (n, c = 'i') => `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
  const st = (i) => `style="--i:${i}"`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Marca: três hexágonos do ETAL. O "E" em pixels fica no vermelho. */
  const hexPath = 'M0-15 13-7.500V7.500L0 15-13 7.500V-7.500Z';
  const mark = (cls = 'mark') => `<svg class="${cls}" viewBox="1 -3 44 78" aria-hidden="true">
    <g class="hx hx1" transform="translate(16 36)"><path d="${hexPath}" fill="#d6332c"/><path d="M-5-7h10v2.800h-6.800v2.800h5.400v2.800h-5.400v2.800h6.800V7H-5Z" fill="#fff"/></g>
    <g class="hx hx2" transform="translate(30 13)"><path d="${hexPath}" fill="#65b32e"/><path d="M0-7a4.600 4.600 0 0 1 2.700 8.300V3h-5.400V1.300A4.600 4.600 0 0 1 0-7ZM-2 5.200h4" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/></g>
    <g class="hx hx3" transform="translate(30 59)"><path d="${hexPath}" fill="#65b32e"/><rect x="-6.500" y="-5" width="13" height="9" rx="1.500" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M-1.600-2.800V1.800L2.400-.500Z" fill="#fff"/><path d="M-3 6.500h6" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/></g></svg>`;
  const meAv = (cls = 'av') => (D.person.photo ? `<span class="${cls} has-photo"><img src="${D.person.photo}" alt=""></span>` : `<span class="${cls}">${D.person.initials}</span>`);
  const TINTS = ['#dfe8fa,#22386f', '#e6f3dc,#2f6f12', '#fde8e6,#a5302a', '#fff1d6,#8a5200', '#e7e4fb,#46389a', '#d9f1f1,#116466'];
  const spAv = (s, big = false) => {
    const [bg, fg] = TINTS[(s.initials.charCodeAt(0) + s.initials.charCodeAt(1)) % TINTS.length].split(',');
    return `<span class="ava${big ? ' lg' : ''}" style="background:${bg};color:${fg}">${s.initials}</span>`;
  };
  const goOf = (x) => (x.tournament ? `data-go="tournament" data-id="${x.tournament}"` : `data-go="activity" data-id="${x.id}"`);
  const mapAct = (x) => (x.place ? `data-act="openplace" data-id="${x.place}"` : `data-act="openmap" data-floor="${x.floor}" data-zone="${x.zone}"`);
  const whereOf = (x) => (x.floor === undefined ? x.room : `${x.room} · ${floorOf(x.floor).label}`);
  const isNow = (x) => x.day === D.now.day && x.time <= D.now.time && D.now.time < x.end;
  const speakersList = () => { const seen = new Set(); return D.sessions.filter((x) => x.speakerShort && !seen.has(x.speakerShort) && seen.add(x.speakerShort)); };
  const hoursOf = (s) => { const [a, b] = [s.time, s.end].map((t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; }); return b - a; };
  const seatLine = (s) => (!s.seats ? '' : s.taken >= s.seats ? 'Vagas esgotadas' : `${s.seats - s.taken} vagas de ${s.seats}`);
  const seatBar = (s) => !s.seats ? '' : `<span class="seats ${s.taken >= s.seats ? 'full' : ''}"><i style="width:${Math.round((s.taken / s.seats) * 100)}%"></i></span>`;
  /* Ilustrações dos estados vazios: colmeia em traço fino, sempre com o motivo da tela. */
  /* Favo sendo preenchido: a célula do meio traz o motivo da tela, e as outras acendem em sequência. */
  function illo(kind) {
    const hexP = 'M0-22 19-11V11L0 22-19 11V-11Z';
    const glyph = { file: '<path d="M-8-11H3l6 6V11H-8ZM3-11v6h6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>', mark: '<path d="M-7-11H7V11L0 6-7 11Z" fill="#fff"/>', people: '<circle cy="-4" r="4.800" fill="none" stroke="#fff" stroke-width="2.200"/><path d="M-9 11a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/>', bell: '<path d="M-8 6c1.500-2 1.500-4 1.500-7a6.500 6.500 0 0 1 13 0c0 3 0 5 1.500 7ZM-2 10h4" fill="none" stroke="#fff" stroke-width="2.200" stroke-linejoin="round" stroke-linecap="round"/>' }[kind];
    const CELLS = [[-19, -33, 'honey'], [19, -33, 'line'], [-38, 0, 'line'], [38, 0, 'honey2'], [-19, 33, 'honey2'], [19, 33, 'line']];
    return `<svg class="illo" viewBox="-66 -62 132 124" aria-hidden="true">${CELLS.map(([x, y, k], i) => `<g transform="translate(${x} ${y})"><path class="il-c ${k}" style="--i:${i}" d="${hexP}"/></g>`).join('')}
      <g class="il-main"><path d="${hexP}" fill="var(--navy)"/>${glyph}</g></svg>`;
  }
  const buzz = (p) => { try { navigator.vibrate?.(p); } catch (_) { /* sem suporte */ } };
  const SAVE_KEY = 'etal-perfil';
  const DEMO_PERSON = { ...D.person };
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* opcional */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (_) { /* opcional */ } },
  };
  const prefs = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* opcional */ } },
  };
  let splashDone = false;
  const REM_KEY = 'etal-lembretes'; const LEAD = 10;
  const remSaved = () => { try { return JSON.parse(localStorage.getItem(REM_KEY)) || []; } catch (_) { return []; } };

  /* ---------------- personalização ---------------- */
  const THEMES = {
    etal: { name: 'ETAL', desc: 'Azul do NADIC', accent: '#22386f', hue: null },
    mel: { name: 'Mel', desc: 'Da apicultura', accent: '#8a5300', hue: 38 },
    mandacaru: { name: 'Mandacaru', desc: 'Verde da caatinga', accent: '#22633a', hue: 140 },
    sertao: { name: 'Sertão', desc: 'Terra e telha', accent: '#9c3f1f', hue: 18 },
    entardecer: { name: 'Entardecer', desc: 'Céu do fim de tarde', accent: '#55368f', hue: 265 },
  };
  const ACCENTS = ['#22386f', '#1f6fb2', '#0f766e', '#2f7d32', '#8a5300', '#b4372f', '#b0307a', '#55368f'];
  const UI_DEFAULT = { theme: 'etal', accent: null, mode: 'claro', badge: 'solido', corners: 'suaves', font: 'padrao', text: 'normal', motion: 'completas', sky: true, view: '3d',
    home: { atalhos: true, live: true, colmeia: true, agenda: true, palestrantes: true, campeonatos: true, avisos: true } };
  const HOME_PARTS = [['atalhos', 'Atalhos'], ['live', 'Campus ao vivo'], ['colmeia', 'Sua colmeia'], ['agenda', 'Sua agenda'], ['palestrantes', 'Palestrantes'], ['campeonatos', 'Campeonatos'], ['avisos', 'Avisos']];
  const uiLoad = () => { try { const v = JSON.parse(localStorage.getItem('etal-ui')); return v ? { ...UI_DEFAULT, ...v, home: { ...UI_DEFAULT.home, ...(v.home || {}) } } : null; } catch (_) { return null; } };
  let UI = uiLoad() || JSON.parse(JSON.stringify(UI_DEFAULT));
  const uiSave = () => { try { localStorage.setItem('etal-ui', JSON.stringify(UI)); } catch (_) { /* opcional */ } };
  /* Cores: tudo é derivado do destaque, garantindo contraste. */
  const toRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
  const toHSL = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    if (!d) return [0, 0, l];
    const sat = d / (1 - Math.abs(2 * l - 1)); const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, sat, l];
  };
  const hsl = (h, sat, l) => {
    const a = sat * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return toHex([f(0), f(8), f(4)]);
  };
  const lumOf = (hex) => { const c = toRGB(hex).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [lumOf(a), lumOf(b)].sort((u, v) => v - u); return (x + 0.05) / (y + 0.05); };
  /* Escurece ou clareia até atingir o contraste pedido. */
  const fit = (h, sat, l, against, min, step) => { let v = Math.max(0.03, Math.min(0.97, l)); let out = hsl(h, sat, v); while (contrast(out, against) < min && v > 0.02 && v < 0.98) { v += step; out = hsl(h, sat, v); } return out; };
  function tokensOf(dark) {
    const t = THEMES[UI.theme] || THEMES.etal; const accent = UI.accent || t.accent;
    const [h, sat0] = toHSL(toRGB(accent)); const sat = Math.max(sat0, 0.28); const out = {};
    if (t.hue !== null) {
      const n = t.hue;
      Object.assign(out, dark
        ? { '--bg': hsl(n, 0.34, 0.1), '--card': hsl(n, 0.3, 0.16), '--ink': hsl(n, 0.4, 0.94), '--ink-2': hsl(n, 0.26, 0.82), '--muted': hsl(n, 0.2, 0.68), '--line': hsl(n, 0.24, 0.24), '--line-2': hsl(n, 0.22, 0.34), '--tab': hsl(n, 0.3, 0.13), '--seg': hsl(n, 0.3, 0.16) }
        : { '--bg': hsl(n, 0.3, 0.955), '--card': '#ffffff', '--ink': hsl(n, 0.42, 0.18), '--ink-2': hsl(n, 0.24, 0.28), '--muted': hsl(n, 0.14, 0.4), '--line': hsl(n, 0.24, 0.9), '--line-2': hsl(n, 0.22, 0.8), '--tab': '#ffffff', '--seg': hsl(n, 0.22, 0.9) });
    }
    if (UI.accent || t.hue !== null) {
      const bg = out['--bg'] || (dark ? '#0e1932' : '#f4f6fa');
      if (dark) {
        const strong = fit(h, sat, 0.42, '#ffffff', 4.6, -0.01);
        Object.assign(out, { '--navy': strong, '--navy-2': strong, '--brand': strong, '--blue': fit(h, sat, 0.72, bg, 4.5, 0.01), '--blue-50': hsl(h, Math.min(sat, 0.5), 0.2), '--accent-ink': hsl(h, Math.min(sat + 0.2, 0.9), 0.84) });
      } else {
        const strong = fit(h, sat, toHSL(toRGB(accent))[2], '#ffffff', 5, -0.01);
        Object.assign(out, { '--navy': strong, '--navy-2': strong, '--brand': strong, '--accent-ink': strong, '--blue': fit(h, sat, 0.42, bg, 4.5, -0.01), '--blue-50': fit(h, Math.min(sat, 0.62), 0.925, strong, 4.6, 0.004) });
      }
    }
    return out;
  }
  let tokenNames = [];
  const LOADED_FONTS = new Set();
  const FONTS = { arredondada: ['Nunito:wght@400;600;700;800', "'Nunito',system-ui,sans-serif"], leitura: ['Atkinson+Hyperlegible:wght@400;700', "'Atkinson Hyperlegible',system-ui,sans-serif"] };
  function applyUI(opts = {}) {
    const root = document.documentElement;
    const dark = opts.forceTheme ? opts.forceTheme === 'dark' : UI.mode === 'escuro' || (UI.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.badge = UI.badge; root.dataset.motion = UI.motion;
    root.style.setProperty('--rk', { retos: 0.3, suaves: 1, redondos: 1.4 }[UI.corners] || 1);
    tokenNames.forEach((k) => root.style.removeProperty(k));
    const tk = tokensOf(dark); tokenNames = Object.keys(tk);
    tokenNames.forEach((k) => root.style.setProperty(k, tk[k]));
    const fontInfo = FONTS[UI.font];
    if (fontInfo && !LOADED_FONTS.has(UI.font)) { LOADED_FONTS.add(UI.font); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${fontInfo[0]}&display=swap`; document.head.appendChild(l); }
    if (fontInfo) { root.style.setProperty('--ui', fontInfo[1]); root.style.setProperty('--display', fontInfo[1]); } else { root.style.removeProperty('--ui'); root.style.removeProperty('--display'); }
    const dv = document.getElementById('device');
    if (dv) { dv.classList.toggle('text-lg', UI.text === 'grande'); dv.classList.toggle('text-xl', UI.text === 'maior'); }
    reduce = osReduce || UI.motion === 'reduzidas';
    const C = window.Campus3D;
    if (C) { C.setReduced?.(reduce); C.setAccent?.(tk['--navy'] || '#22386f'); C.redraw?.(); }
  }
  const uiSeg = (key, list) => `<div class="mini-seg wide" role="radiogroup">${list.map(([v, t]) => `<button class="${UI[key] === v ? 'on' : ''}" role="radio" aria-checked="${UI[key] === v}" data-act="ui" data-k="${key}" data-v="${v}">${t}</button>`).join('')}</div>`;

  /* ---------------- estado ---------------- */
  const fresh = () => ({
    auth: false,
    credAt: null,
    present: {},
    saved: new Set(D.enrolled),
    tab: 'home',
    stacks: { home: [{ s: 'home' }], agenda: [{ s: 'agenda' }], map: [{ s: 'map' }], profile: [{ s: 'profile' }] },
    agendaDay: 26, agendaFilter: 'all',
    mapView: 'evento', campusPlace: null, mapFloor: null, mapZone: null, mapRoute: false, mapVia: null, pending: false, journeying: false,
    tourTab: 'chave',
    reminders: new Set(remSaved()), votes: new Set(), ratings: {}, asked: {}, contacts: [],
  });
  let S = fresh();

  /* ---------------- QR fictício ---------------- */
  function qr(seed = 11, n = 25) {
    let x = seed;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const inF = (c < 8 && r < 8) || (c > n - 9 && r < 8) || (c < 8 && r > n - 9);
      if (!inF && rnd() < 0.47) d += `M${c} ${r}h1v1h-1z`;
    }
    const f = (a, b) => `<rect x="${a}" y="${b}" width="7" height="7" rx="1.4"/><rect x="${a + 1}" y="${b + 1}" width="5" height="5" rx=".9" fill="#fff"/><rect x="${a + 2}" y="${b + 2}" width="3" height="3" rx=".6"/>`;
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" class="qrcode" shape-rendering="crispEdges" fill="#1f2f57"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}"/>${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</svg>`;
  }

  /* ---------------- mapa ---------------- */
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  const floorOf = (lvl) => P.floors.find((f) => f.level === lvl);
  const zoneOf = (lvl, id) => floorOf(lvl).zones.find((z) => z.id === id);
  function bbox(z) {
    if (z.points) {
      const p = z.points.split(' ').map((q) => q.split(',').map(Number));
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    return { x: z.x, y: z.y, w: z.w, h: z.h };
  }
  function hitLayer(f, sel) {
    return '<g class="hits">' + f.zones.map((z) => {
      const c = `class="hit${z.id === sel ? ' sel' : ''}" data-zone="${z.id}"`;
      return z.points ? `<polygon ${c} points="${z.points}"/>` : `<rect ${c} x="${z.x + 2}" y="${z.y + 2}" width="${z.w - 4}" height="${z.h - 4}" rx="8"/>`;
    }).join('') + '</g>';
  }
  function planSvg(lvl, vb, sel, cls = 'plan') {
    const f = floorOf(lvl);
    return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid ${cls === 'thumb' ? 'slice' : 'meet'}" role="img" aria-label="Planta do ${f.label}">${P.defs}<rect x="-400" y="-400" width="1700" height="1300" fill="${isDark() ? '#0e1932' : '#f4f6fa'}"/>${isDark() ? f.svgDark : f.svg}${hitLayer(f, sel)}</svg>`;
  }
  function focusBox(lvl, id, width = 420, ratio = 0.78) {
    const z = zoneOf(lvl, id);
    if (!z) return { x: 0, y: 0, w: 900, h: 430 };
    const b = bbox(z);
    const w = Math.max(width, b.w + 80), h = w * ratio;
    return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
  }
  const zoneName = (z) => z.roomNumber ? `${z.kind === 'laboratory' ? 'Lab' : z.kind === 'staff' ? 'Sala dos professores' : 'Sala'} ${z.kind === 'staff' ? '' : z.roomNumber}`.trim() : z.label;

  /* ---------------- telas ---------------- */
  const Screens = {};
  const Overlays = {};

  const header = (title, { back = true, right = '' } = {}) => `
    <header class="bar">${back ? `<button class="iconbtn" data-act="back" aria-label="Voltar">${ic('back')}</button>` : '<span class="iconbtn ghost"></span>'}
    <h1 class="bar-title">${title}</h1>${right || '<span class="iconbtn ghost"></span>'}</header>`;

  /* ---------------- entrada: o crachá ----------------
     Um crachá em branco pendurado no cordão. Enquanto a pessoa digita, os dados aparecem nele; ao entrar,
     o cartão vira e mostra o crachá preenchido. Para abrir o app, puxa-se o crachá para baixo e a tela desce.
     Padrão dos apps de evento: o ingresso é um QR no app (Web Summit) e a conta serve ao credenciamento (Doity). */
  const guestSaved = () => { try { return JSON.parse(localStorage.getItem('etal-visitante')); } catch (_) { return null; } };
  const GUEST_KINDS = [['estudante', 'Estudante'], ['professor', 'Professor(a)'], ['profissional', 'Profissional'], ['comunidade', 'Comunidade']];
  let lgPending = null; let lgPhys = null;

  function suapFields() {
    return `<form class="login-form" data-form="login" novalidate>
        <label class="field" for="mat"><span>Matrícula</span><input id="mat" inputmode="numeric" autocomplete="username" placeholder="Sua matrícula do SUAP" required></label>
        <label class="field" for="pwd"><span>Senha</span><div class="pwd"><input id="pwd" type="password" autocomplete="current-password" placeholder="A mesma senha do SUAP" required><button type="button" class="iconbtn sm" data-act="togglepwd" aria-label="Mostrar senha">${ic('eye')}</button></div></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Entrar com o SUAP</span><i class="spin"></i></button>
        <button class="btn ghost" type="button" id="lgdemo" data-act="demo" hidden>Entrar com dados de exemplo</button>
      </form>`;
  }
  function guestFields() {
    const saved = guestSaved();
    return `${saved ? `<button class="lx-resume" type="button" data-act="guestresume"><span class="lx-ic">${esc(saved.initials)}</span><span><b>Continuar como ${esc(saved.first)}</b><small>Conta de visitante neste aparelho</small></span>${ic('chev')}</button><p class="lx-or">ou crie outra conta</p>` : ''}
      <form class="login-form guest-form" data-form="guest" novalidate>
        <label class="field" for="gname"><span>Nome completo</span><input id="gname" autocomplete="name" placeholder="Como vai aparecer no crachá" required></label>
        <label class="field" for="gmail"><span>E-mail</span><input id="gmail" type="email" inputmode="email" autocomplete="email" placeholder="Para receber o certificado" required></label>
        <fieldset class="g-kind"><legend>Você é</legend>${GUEST_KINDS.map(([v, t], i) => `<label><input type="radio" name="gkind" value="${v}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}</fieldset>
        <div class="g-two">
          <label class="field" for="ginst"><span>Instituição</span><input id="ginst" autocomplete="organization" placeholder="Opcional"></label>
          <label class="field" for="gcity"><span>Cidade</span><input id="gcity" list="gcities" autocomplete="address-level2" placeholder="Sua cidade" required></label>
        </div>
        <datalist id="gcities">${['Pau dos Ferros', 'Mossoró', 'São Miguel', 'Alexandria', 'Encanto', 'Rafael Fernandes', 'Portalegre', 'Marcelino Vieira', 'Cajazeiras', 'Natal'].map((c) => `<option value="${c}">`).join('')}</datalist>
        <label class="g-ok"><input type="checkbox" id="gok" required><span>Concordo que o ETAL use estes dados só para o credenciamento e os certificados.</span></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Criar conta</span><i class="spin"></i></button>
      </form>`;
  }
  /* Frente do crachá. Sem perfil, é o cartão em branco que vai se preenchendo enquanto a pessoa digita. */
  const bxClip = '<svg class="bx-clip" viewBox="0 0 40 44" aria-hidden="true"><circle cx="20" cy="7" r="5.200" fill="none" stroke="#98a2b3" stroke-width="2.800"/><rect x="13" y="11" width="14" height="15" rx="3.500" fill="#c4cbd7"/><rect x="15.500" y="13" width="3.500" height="11" rx="1.750" fill="#eef1f6"/><rect x="4" y="27" width="32" height="12" rx="3.500" fill="rgba(255,255,255,.6)" stroke="rgba(110,125,150,.55)"/></svg>';
  function badgeFace(p) {
    const blank = !p;
    const av = blank ? `<span class="bx-av ph">${ic('user')}</span>` : p.photo ? `<span class="bx-av"><img src="${p.photo}" alt=""></span>` : `<span class="bx-av ini">${esc(p.initials)}</span>`;
    const role = blank ? ['ph', 'Credencial'] : p.source === 'visitante' ? ['guest', 'Visitante'] : ['', 'Participante'];
    return `<i class="bx-slot"></i>
      <div class="bx-head"><span class="bx-ed">IFRN · Pau dos Ferros</span><span class="bx-brand">${mark('mark')}<b>etal</b></span>${blank ? '' : '<i class="bx-holo"></i>'}</div>
      <span class="bx-photo">${av}</span>
      <div class="bx-body">
        ${blank ? `<b class="bx-name ph" data-live="name">Seu nome</b><span class="bx-sub" data-live="sub">${S.lgMode === 'guest' ? 'Visitante' : 'Matrícula do SUAP'}</span>`
          : `<b class="bx-name">${esc(p.name)}</b><span class="bx-sub">${esc(p.course || '')}</span><small class="bx-sub2">${esc([p.year, p.campus].filter(Boolean).join(' · '))}</small>`}
        <div class="bx-row">${blank ? `<span class="bx-qr ph">${ic('qr')}</span><small data-live="state">Seu QR aparece aqui depois de entrar</small>`
          : `<span class="bx-qr">${qr(7, 25)}</span><small><span>Seu código</span><b>${esc(p.id)}</b></small>`}</div>
      </div>
      <div class="bx-role ${role[0]}"><b>${role[1]}</b><span>26 a 28 nov</span></div>
      <i class="bx-sheen"></i>`;
  }
  const yardText = 'ETAL · CONNECT · '.repeat(16);

  Screens.login = () => {
    splashDone = true;
    const guest = S.lgMode === 'guest';
    return {
      chrome: false,
      mount: (el) => mountBadgeLogin(el),
      html: `<div class="login lx lx-cracha${guest ? ' guest-mode' : ''}">
        <header class="lx-brand dark">${mark('mark xs')}<b>etal</b><span>connect</span></header>
        <div class="lx-hang" id="lxhang">
          <svg class="lx-yard" aria-hidden="true">${['lyA', 'lyB'].map((id) => `<g class="ly"><path class="ly-e"/><path class="ly-m" id="${id}"/><text dy="2.600"><textPath href="#${id}">${yardText}</textPath></text></g>`).join('')}</svg>
          <div class="lx-card" aria-hidden="true"><div class="bx">${bxClip}<div class="bx-flip"><div class="bx-face blank">${badgeFace(null)}</div><div class="bx-face filled"></div></div></div></div>
        </div>
        <p class="lx-pull" aria-hidden="true"><span class="lx-arrow">${ic('chev')}</span><span class="t1">Puxe o crachá para baixo</span><span class="t2">Solte para abrir</span></p>
        <div class="lx-bottom">
          <div class="lx-start">
            <div class="lx-seg" role="tablist" aria-label="Como você vai entrar">
              <button type="button" role="tab" data-act="lgmode" data-v="suap" aria-selected="${!guest}">Sou do IFRN</button>
              <button type="button" role="tab" data-act="lgmode" data-v="guest" aria-selected="${guest}">Vim de fora</button>
            </div>
            <div class="lx-form">${guest ? guestFields() : suapFields()}</div>
          </div>
          <div class="lx-done" role="status">
            <h2 class="lx-q" data-live="hello">Tudo certo!</h2>
            <p>Puxe o crachá para baixo e a tela abre o app.</p>
            <button class="btn primary big" data-act="lgenter" type="button">Abrir o app</button>
            <button class="btn ghost" data-act="lgredo" type="button">Não sou eu</button>
          </div>
        </div>
      </div>`,
    };
  };

  /* Física do crachá. O cartão pende do cordão como um pêndulo de mola: segue o dedo com resistência elástica,
     balança com o movimento e volta quicando. Depois de entrar, o cordão tem uma folga; passou dela, o cordão
     estica e puxa a própria tela, que desce e mostra o app já montado por baixo. */
  function mountBadgeLogin(el) {
    const lg = $('.login', el); const hang = $('#lxhang', el); const piv = $('.lx-card', el); const bx = $('.bx', el);
    const yard = [...el.querySelectorAll('.ly')].map((g) => [...g.querySelectorAll('path')]);
    const P = { x: 0, y: 0, a: reduce ? 0 : 0.32, vx: 0, vy: 0, va: 0, cv: 0, vc: 0, drag: null, app: null, going: false, raf: 0, last: 0, until: 0, touch: 0, filledAt: 0, ready: false };
    lgPhys = P;
    const SLACK = 64; const OPEN = 120;
    const rb = (d, c) => c * (1 - 1 / ((d / c) * 0.55 + 1));
    const rbs = (d, c) => (d < 0 ? -rb(-d, c) : rb(d, c));
    const live = (k, v) => { const n = $(`[data-live="${k}"]`, el); if (n) { n.textContent = v; n.classList.toggle('typed', true); } };

    function draw() {
      const W = hang.clientWidth; const L = parseFloat(getComputedStyle(lg).getPropertyValue('--L')) || 46;
      piv.style.setProperty('--px', `${P.x.toFixed(2)}px`); piv.style.setProperty('--py', `${P.y.toFixed(2)}px`); piv.style.setProperty('--pa', `${P.a.toFixed(4)}rad`);
      bx.style.setProperty('--tilt', P.a.toFixed(3));
      const px = W / 2 + P.x; const py = L + P.y; const tp = -110;
      const ends = [[W / 2 - 46, px - 3.500], [W / 2 + 46, px + 3.500]];
      yard.forEach(([e, m], i) => { const d = `M${ends[i][0].toFixed(1)} ${tp}L${ends[i][1].toFixed(1)} ${py.toFixed(1)}`; e.setAttribute('d', d); m.setAttribute('d', d); });
      if (P.app && !P.going) {
        const k = Math.min(1, P.cv / Math.max(1, el.clientHeight));
        el.style.transform = P.cv > 0.3 ? `translate3d(0,${P.cv.toFixed(1)}px,0)` : '';
        P.app.style.transform = `scale(${(0.92 + 0.08 * k).toFixed(4)})`; P.app.style.filter = `brightness(${(0.7 + 0.3 * k).toFixed(3)})`;
        el.classList.toggle('lx-moving', P.cv > 0.3);
      }
    }
    function step(t) {
      P.raf = 0; if (!el.isConnected) return;
      const dt = Math.min(0.033, Math.max(0.001, (t - (P.last || t - 16)) / 1000)); P.last = t;
      if (!P.drag) {
        P.vx += (-240 * P.x - 13 * P.vx) * dt; P.vy += (-240 * P.y - 13 * P.vy) * dt;
        P.x += P.vx * dt; P.y += P.vy * dt;
        if (P.app && !P.going) { P.vc += (-280 * P.cv - 26 * P.vc) * dt; P.cv += P.vc * dt; if (P.cv < 0) { P.cv = 0; P.vc = 0; } }
      }
      /* O cartão atrasa em relação ao ponto de pendurar: quem anda para a direita faz ele girar para a esquerda. */
      const aT = Math.max(-0.75, Math.min(0.75, -P.vx * 0.00085));
      P.va += (-70 * (P.a - aT) - 3.2 * P.va) * dt; P.a += P.va * dt;
      draw();
      const motion = Math.abs(P.x) + Math.abs(P.y) + Math.abs(P.vx) * 0.05 + Math.abs(P.vy) * 0.05 + Math.abs(P.a) * 200 + Math.abs(P.va) * 60 + P.cv + Math.abs(P.vc) * 0.05;
      if (motion > 0.25 || P.drag || P.going || t < P.until) wake(); else { P.last = 0; P.x = P.y = P.a = 0; draw(); }
    }
    function wake(ms) { if (ms) P.until = Math.max(P.until, performance.now() + ms); if (!P.raf) P.raf = requestAnimationFrame(step); }
    P.kick = (vx = 0, vy = 0, va = 0, ms = 0) => { if (reduce) { wake(ms); return; } P.vx += vx; P.vy += vy; P.va += va; wake(ms); };

    /* O app é montado por baixo assim que a pessoa começa a puxar; se ela desistir, ele fica lá esperando. */
    function arm() {
      if (P.app || !lgPending) return;
      navReset(); S.auth = true; S.tab = 'home';
      el.style.animation = 'none'; el.classList.remove('in-fade', 'in-push', 'in-pop');
      const app = build(top()); app.classList.add('lx-under'); vp.insertBefore(app, el);
      if (app._mount) app._mount(app);
      P.app = app; draw();
    }
    P.disarm = () => {
      if (!P.app) return;
      P.app.remove(); P.app = null; S.auth = false; P.cv = P.vc = 0;
      el.style.transform = ''; el.classList.remove('lx-moving');
    };
    P.commit = (v = 0) => {
      if (P.going) return;
      arm(); if (!P.app) return;
      const prof = lgPending; lgPending = null; P.going = true; S.lgMode = null;
      const app = P.app; const H = el.clientHeight + 60;
      const dur = reduce ? 1 : Math.round(Math.max(260, Math.min(600, (H - P.cv) / Math.max(1.5, v / 1000))));
      setChrome(app);
      el.classList.add('lx-moving');
      el.style.transition = `transform ${dur}ms cubic-bezier(.3,.6,.25,1)`;
      app.style.transition = `transform ${dur}ms cubic-bezier(.2,.7,.2,1), filter ${dur}ms ease-out`;
      void el.offsetWidth;
      el.style.transform = `translate3d(0,${H}px,0)`; app.style.transform = 'none'; app.style.filter = 'none';
      P.kick(0, 420, 0.9);
      buzz([10, 30, 18]);
      setTimeout(() => { el.remove(); app.style.transition = app.style.transform = app.style.filter = ''; app.classList.remove('lx-under'); }, dur + 40);
      if (prof.source === 'visitante') setTimeout(() => notify(`Boas-vindas, ${prof.first}!`, 'Sua conta de visitante está pronta. Mostre o QR do crachá na recepção.'), dur + 350);
    };

    el.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'mat') live('sub', t.value.trim() ? `Matrícula ${t.value.trim()}` : 'Matrícula do SUAP');
      if (t.id === 'gname') live('name', t.value.trim() || 'Seu nome');
      if (t.id === 'gcity' || t.name === 'gkind') {
        const kind = (GUEST_KINDS.find(([v]) => v === ($('[name=gkind]:checked', el) || {}).value) || GUEST_KINDS[0])[1];
        live('sub', ['Visitante', kind, $('#gcity', el)?.value.trim()].filter(Boolean).join(' · '));
      }
      if (/^(mat|gname|gcity)$/.test(t.id) || t.name === 'gkind') P.kick(0, 0, (Math.random() - 0.5) * 0.7);
    });
    el.addEventListener('change', (e) => { if (e.target.name === 'gkind') e.target.dispatchEvent(new Event('input', { bubbles: true })); });

    let samples = [];
    hang.addEventListener('pointerdown', (e) => {
      if (P.going || e.button > 0) return;
      P.drag = { x0: e.clientX, y0: e.clientY, bx: P.x, by: P.y + P.cv, moved: false };
      samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      P.vc = 0; P.touch = performance.now();
      hang.setPointerCapture(e.pointerId); lg.classList.add('pulling'); wake();
    });
    hang.addEventListener('pointermove', (e) => {
      const d = P.drag; if (!d) return;
      const dx = e.clientX - d.x0; const dy = e.clientY - d.y0;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
      samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
      const s0 = samples[0]; const sdt = Math.max(10, e.timeStamp - s0.t);
      P.vx = ((e.clientX - s0.x) / sdt) * 1000; P.vy = ((e.clientY - s0.y) / sdt) * 1000;
      P.x = d.bx + rbs(dx, 70);
      const yy = d.by + dy;
      if (lgPending) {
        if (yy > SLACK * 0.4) arm();
        if (yy <= SLACK) { P.y = yy < 0 ? -rb(-yy, 28) : yy; P.cv = 0; } else { const ex = yy - SLACK; const st = rb(ex, 22); P.y = SLACK + st; P.cv = ex - st; }
        const rdy = P.cv > OPEN;
        if (rdy !== P.ready) { P.ready = rdy; lg.classList.toggle('ready', rdy); buzz(rdy ? 14 : 6); }
      } else P.y = rbs(yy, yy > 0 ? 80 : 28);
      P.touch = performance.now();
    });
    const release = () => {
      const d = P.drag; if (!d) return; P.drag = null; lg.classList.remove('pulling');
      if (!d.moved) { P.kick(0, 0, (Math.random() < 0.5 ? -1 : 1) * 1.8); return; }
      if (lgPending && (P.cv > OPEN || (P.vy > 650 && P.cv > 14))) { P.commit(P.vy); return; }
      if (P.cv > 0) { P.vc = Math.min(0, P.vy) * 0.4; P.vy = 0; }
      P.ready = false; lg.classList.remove('ready'); wake();
    };
    hang.addEventListener('pointerup', release); hang.addEventListener('pointercancel', release);
    hang.addEventListener('keydown', (e) => { if (lgPending && (e.key === 'ArrowDown' || e.key === 'Enter')) P.commit(); });

    /* Até a pessoa mexer, o crachá dá um puxãozinho sozinho para mostrar que dá para puxar. */
    const nudge = setInterval(() => {
      if (!el.isConnected) { clearInterval(nudge); return; }
      const now = performance.now();
      if (lgPending && !P.drag && !P.going && now - P.touch > 2600 && now - P.filledAt > 1500) P.kick(0, 520, 0, 0);
    }, 2800);
    new ResizeObserver(() => wake(50)).observe(hang);
    wake(reduce ? 50 : 400);
  }
  /* Entrou: o cartão vira e mostra o crachá preenchido. */
  function lgFilled(prof) {
    lgPending = prof;
    const lg = $('.login'); if (!lg) return;
    $('.bx-face.filled', lg).innerHTML = badgeFace(prof);
    $('[data-live="hello"]', lg).textContent = `Tudo certo, ${prof.first}!`;
    lg.classList.add('filled'); buzz([14, 40, 14]);
    if (lgPhys) { lgPhys.filledAt = performance.now(); lgPhys.kick(0, 0, 1.3, 1400); }
    setTimeout(() => $('[data-act="lgenter"]', lg)?.focus({ preventScroll: true }), 700);
  }
  /* A tela de entrada desce e o app aparece por trás. */
  function lgOpenApp() { if (lgPending && lgPhys) lgPhys.commit(0); }
  function lgShake(msg) {
    lgPhys?.kick(950, 0, 0.6);
    buzz(40);
    const s = $('[data-live="state"]'); if (s) s.textContent = msg || 'Confira os dados abaixo';
  }
  /* Conta de visitante: só o necessário para o crachá e o certificado. */
  function guestProfile(f) {
    const name = f.name.replace(/\s+/g, ' ').trim(); const parts = name.split(' ');
    const kind = (GUEST_KINDS.find(([v]) => v === f.kind) || GUEST_KINDS[0])[1];
    let h = 0; for (const ch of f.email.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return {
      name, first: parts[0], initials: (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '')).toUpperCase(),
      course: 'Visitante', courseFull: `Visitante · ${kind}${f.inst ? ` · ${f.inst}` : ''}`, year: kind, campus: f.city,
      id: `VIS${String(h % 1000000).padStart(6, '0')}`, email: f.email, institution: f.inst || '', source: 'visitante', photo: null,
    };
  }

  function badge() {
    const ok = !!S.credAt;
    const pinsSvg = '<svg class="pins" viewBox="0 0 60 20" aria-hidden="true"><path d="M8 20V9M30 20V9M52 20V9"/><circle cx="8" cy="5.500" r="3.400"/><circle cx="30" cy="5.500" r="3.400"/><circle cx="52" cy="5.500" r="3.400"/></svg>';
    return `<section class="badge st" ${st(0)}>
      <div class="flip ${S.flipSeen ? '' : 'hint'}" data-act="flip" role="button" tabindex="0" aria-label="Virar crachá e ver o código">
        <div class="flip-in">
          <div class="face front">
            <div class="b-top"><span class="b-mark">${mark('mark xs')}etal</span>${pinsSvg}</div>
            <div class="b-id">${meAv('av')}<span class="b-name"><strong>${esc(D.person.name)}</strong><span>${esc(D.person.course)}</span><small>${esc([D.person.year, D.person.campus].filter(Boolean).join(' · '))}</small></span></div>
            <span class="flip-tip">${ic('rotate')}Virar</span>
          </div>
          <div class="face back">
            <div class="back-qr ${ok ? '' : 'locked-qr'}">${qr()}${ok ? '' : `<i>${ic('lock')}</i>`}</div>
            <div class="back-tx"><b>${ok ? 'Seu código' : 'Código bloqueado'}</b><span>${ok ? 'Mostre quando a organização pedir.' : 'Libera depois da leitura na recepção.'}</span><small>${esc(D.person.id)}</small></div>
          </div>
        </div>
      </div>
      ${ok
        ? `<button class="b-strip ok" data-go="credential">${ic('check', 'i dot')}<span><b>Credenciamento confirmado</b><small>Entrada às ${S.credAt} na recepção</small></span>${ic('chev')}</button>`
        : `<button class="b-strip pend" data-act="scan">${ic('qr', 'i dot')}<span><b>Credenciamento pendente</b><small>Leia o QR da recepção, no térreo</small></span>${ic('chev')}</button>`}
    </section>`;
  }

  Screens.home = () => {
    const s = byId('react-native');
    const here = S.present[s.id];
    const today = D.sessions.filter((x) => x.day === D.now.day);
    const next = D.enrolled.map(byId).filter((x) => x.id !== s.id);
    const speakers = speakersList();
    const pres = D.enrolled.filter((id) => S.present[id]).length;
    const actions = [['cal', 'Programação', 'data-act="tab" data-tab="agenda"'], ['map', 'Mapa', 'data-act="tab" data-tab="map"'], ['mic', 'Palestrantes', 'data-go="speakers"'], ['file', 'Materiais', 'data-go="materials"'],
      ['award', 'Certificados', 'data-go="certificates"'], ['contact', 'Contatos', 'data-go="network"'], ['trophy', 'Campeonatos', 'data-go="games"'], ['bell', 'Avisos', 'data-go="notices"']];
    return {
      sky: UI.sky,
      mount: mountHome,
      html: `<section class="${UI.sky ? 'hm-sky' : 'hm-plain'}">${UI.sky ? skyArt() : ''}
          <header class="apphead"><span class="wm ${UI.sky ? 'on-sky' : ''}">${mark('mark xs')}<b>etal</b><span>connect</span></span>
          <button class="iconbtn ${UI.sky ? 'on-sky' : ''}" data-go="notices" aria-label="Avisos, ${D.notices.filter((n) => n.fresh).length} novos">${ic('bell')}<u class="badge-num">${D.notices.filter((n) => n.fresh).length}</u></button></header>
        </section>
        <div class="pad stack home">
          ${badge()}
          ${UI.home.live ? `<button class="hm-live st" ${st(1)} aria-live="polite"><span class="hm-live-tag">Campus ao vivo</span><span class="hm-live-row"><span class="hm-live-msg"></span></span>${ic('chev')}</button>` : ''}
          ${UI.home.atalhos ? `<nav class="quick st" ${st(1)} aria-label="Atalhos">${actions.map(([i, t, a]) => `<button ${a}><span>${ic(i)}</span><em>${t}</em></button>`).join('')}</nav>` : ''}

          <div class="sec st" ${st(2)}><h2>Agora</h2><span>Qua, 26 nov · <span id="nowclock">${skyClock()}</span></span></div>
          <article class="now st" ${st(3)} data-go="activity" data-id="${s.id}">
            <div class="now-top"><span class="kind">${s.type} · sua inscrição</span>${here ? `<span class="tag ok">${ic('check')}Presente</span>` : ic('chev', 'i now-chev')}</div>
            <h3>${s.title}</h3>
            <div class="now-sp">${spAv(s)}<span>${s.speakerShort}</span></div>
            <p class="m">${ic('clock')}${s.time} às ${s.end}</p>
            <p class="m">${ic('pin')}${s.room} · 2º andar</p>
            <div class="now-actions">
              ${here ? `<button class="btn primary" data-go="activity" data-id="${s.id}">Abrir aula</button>`
                : `<button class="btn primary" data-act="openmap" data-floor="${s.floor}" data-zone="${s.zone}">Como chegar</button><button class="btn soft" data-act="scan">${ic('qr')}Presença</button>`}
            </div>
          </article>
          <section class="today st ${S.todayOpen ? 'open' : ''}" ${st(4)}>
            <button class="today-head" data-act="today" aria-expanded="${!!S.todayOpen}"><span><b>Programação de hoje</b><small>${today.length} atividades</small></span>${ic('chev')}</button>
            <div class="today-body"><div><ul>${today.map((x) => `<li ${goOf(x)} class="${isNow(x) ? 'live' : ''}"><time>${x.time}</time><span><b>${x.short}</b><small>${x.room}${isNow(x) ? ' · agora' : ''}</small></span>${ic('chev')}</li>`).join('')}</ul>
              <button class="btn soft" data-act="tab" data-tab="agenda">Ver a agenda dos três dias</button></div></div>
          </section>

          ${UI.home.colmeia ? combCard() : ''}

          ${UI.home.agenda ? `<div class="sec st" ${st(5)}><h2>Sua agenda</h2><button data-act="mine">Ver tudo</button></div>
          <ul class="next st" ${st(6)}>${next.map((n) => `<li data-go="activity" data-id="${n.id}"><span class="date"><small>${dayOf(n.day).week}</small><b>${n.day}</b></span><span class="next-tx"><b>${n.short}</b><small>${n.time} · ${n.room}</small></span>
            <button class="remind ${S.reminders.has(n.id) ? 'on' : ''}" data-act="remind" data-id="${n.id}" aria-pressed="${S.reminders.has(n.id)}" aria-label="Lembrar 10 minutos antes">${ic('alarm')}</button></li>`).join('')}</ul>` : ''}

          ${UI.home.palestrantes ? `<div class="sec st" ${st(8)}><h2>Palestrantes</h2><button data-go="speakers">Ver todos</button></div>
          <div class="people st" ${st(9)}>${speakers.map((o) => `<button data-go="speaker" data-id="${o.id}">${spAv(o, true)}<b>${o.speakerShort.split(' ')[0]}</b><small>${o.type}</small></button>`).join('')}</div>` : ''}

          ${UI.home.campeonatos ? `<div class="sec st" ${st(10)}><h2>Campeonatos</h2><button data-go="games">Ver todos</button></div>
          <div class="duel st" ${st(10)}>${D.tournaments.map((g) => `<button class="tile-game ${g.theme}" data-go="tournament" data-id="${g.id}" aria-label="${g.name}">${gameArt(g)}${g.logo ? `<img class="p-logo" src="${g.logo}" alt="">` : ''}<small>${dayOf(g.day).week} ${g.day} · ${g.time}</small></button>`).join('')}</div>` : ''}

          ${UI.home.avisos ? `<div class="sec st" ${st(11)}><h2>Avisos</h2><button data-go="notices">Ver todos</button></div>
          <button class="notice st" ${st(12)} data-go="notices"><time>${D.notices[0].time}</time><b>${esc(D.notices[0].title)}</b><small>${esc(D.notices[0].text)}</small>${ic('chev', 'i card-chev')}</button>` : ''}

          <footer class="made st" ${st(13)}>
            <div><small>Desenvolvido por</small><button data-go="nadic" aria-label="Sobre o NADIC"><img src="assets/nadic-logo.svg" alt="NADIC" width="64" height="28"></button></div>
            <i></i>
            <div><small>Em parceria com</small><span><a href="${D.ifrnUrl}" target="_blank" rel="noopener" aria-label="IFRN Campus Pau dos Ferros, abre em nova aba" class="made-ifrn">IFRN</a><button data-go="etal" aria-label="O que é o ETAL">${mark('mark xs')}<b>etal</b></button></span></div>
          </footer>
        </div>`,
    };
  };

  function savedEmpty(day) {
    const d = dayOf(day); const week = d.long.split(',')[0].toLowerCase();
    const others = D.days.filter((x) => x.day !== day).map((x) => [x, D.sessions.filter((q) => q.day === x.day && S.saved.has(q.id)).length]).filter(([, n]) => n);
    const ideas = D.sessions.filter((q) => q.day === day && !q.simple).slice(0, 3);
    return `<div class="empty-saved">
      ${illo('mark')}
      <h3 class="st" ${st(1)}>Nada salvo na ${week}</h3>
      <p class="st" ${st(2)}>Toque no marcador de uma atividade e ela entra na sua agenda.</p>
      ${others.length ? `<div class="es-days st" ${st(3)}>${others.map(([x, n]) => `<button data-act="day" data-day="${x.day}">${x.week} ${x.day}<b>${n} ${n === 1 ? 'salva' : 'salvas'}</b></button>`).join('')}</div>` : ''}
      ${ideas.length ? `<section class="es-ideas st" ${st(4)}><h4>Sugestões para esse dia</h4><ul>${ideas.map((q) => `<li ${goOf(q)}><time>${q.time}</time><span><b>${q.short}</b><small>${q.type} · ${q.room}</small></span><button class="bm" data-act="save" data-id="${q.id}" aria-label="Salvar ${q.short}">${ic('bookmark')}</button></li>`).join('')}</ul></section>` : ''}
      <button class="btn soft st" ${st(5)} data-act="filter" data-f="all">Ver toda a programação</button>
    </div>`;
  }
  Screens.agenda = () => {
    const day = S.agendaDay, f = S.agendaFilter;
    let list = D.sessions.filter((s) => s.day === day);
    if (['Minicurso', 'Palestra', 'Oficina'].includes(f)) list = list.filter((s) => s.type === f);
    if (f === 'saved') list = list.filter((s) => S.saved.has(s.id));
    const slots = [...new Set(list.map((s) => s.time))];
    const idx = D.days.findIndex((d) => d.day === day);
    const filters = [['all', 'Tudo'], ['Minicurso', 'Minicursos'], ['Palestra', 'Palestras'], ['Oficina', 'Oficinas'], ['saved', 'Salvos']];
    const row = (s) => s.simple
      ? `<li class="ag-stop" ${goOf(s)}><div class="ag-tx"><h4>${s.title}</h4><p>${s.type} · ${s.room}</p></div>${ic('chev', 'i card-chev')}</li>`
      : `<li class="${S.saved.has(s.id) ? 'mine' : ''}" ${goOf(s)}><div class="ag-tx"><span class="ag-kind">${s.type}${isNow(s) ? '<em>Agora</em>' : ''}</span><h4>${s.title}</h4><p>${s.speakerShort} · ${s.room}</p><p class="ag-seats">${seatBar(s)}<span>${seatLine(s)}</span></p></div>
          <button class="bm ${S.saved.has(s.id) ? 'on' : ''}" data-act="save" data-id="${s.id}" aria-label="${S.saved.has(s.id) ? 'Remover dos salvos' : 'Salvar'}">${ic('bookmark')}</button></li>`;
    return {
      html: `<header class="apphead"><h1 class="title">Agenda</h1><button class="iconbtn" data-act="finder" aria-label="Buscar">${ic('search')}</button></header>
      <div class="pad stack">
        <div class="days st" style="--i:0;--k:${idx}"><i class="days-ind"></i>${D.days.map((d) => `<button class="${d.day === day ? 'on' : ''}" data-act="day" data-day="${d.day}">${d.week}<b>${d.day}</b></button>`).join('')}</div>
        <div class="chips st" ${st(1)}>${filters.map(([k, t]) => `<button class="${k === f ? 'on' : ''}" data-act="filter" data-f="${k}">${t}</button>`).join('')}</div>
        <div class="agenda-list" data-swap>
        ${slots.length ? slots.map((t, si) => `<div class="slot st" ${st(2 + si)}><time>${t}</time><div>${list.filter((s) => s.time === t && S.saved.has(s.id)).length > 1 ? `<p class="clash">${ic('info')}Você salvou mais de uma atividade neste horário.</p>` : ''}<ul class="ag">${list.filter((s) => s.time === t).map(row).join('')}</ul></div></div>`).join('')
          : f === 'saved' ? savedEmpty(day) : `<div class="empty st" ${st(2)}>${illo('mark')}<h3>Nada neste dia</h3><p>Escolha outro filtro para ver mais atividades.</p><button class="btn soft" data-act="filter" data-f="all">Ver tudo</button></div>`}
        </div>
        <p class="ag-note">Programação de exemplo, para demonstração.</p>
      </div>`,
    };
  };

  function materialRow(m, i) {
    const icon = m.kind === 'link' ? 'link' : m.kind === 'zip' ? 'zip' : 'pdf';
    return `<li class="mat st" ${st(6 + i)}><span class="mat-ic ${m.kind}">${ic(icon)}</span><span class="mat-tx"><b>${m.name}</b><small>${m.fresh ? `<em>${m.fresh}</em>` : m.meta}</small></span>
      <button class="iconbtn sm" data-act="toast" data-msg="${m.kind === 'link' ? 'Abrindo link' : 'Baixando arquivo'}" aria-label="Abrir">${ic(m.kind === 'link' ? 'open' : 'download')}</button></li>`;
  }

  function questionsOf(id) {
    const list = [...(S.asked[id] || []), ...(D.questions[id] || [])].sort((a, b) => (b.votes + S.votes.has(b.id)) - (a.votes + S.votes.has(a.id)));
    if (!list.length) return '<p class="desc">Nenhuma pergunta ainda. Envie a primeira.</p>';
    return `<ul class="qa">${list.map((q) => `<li><button class="vote ${S.votes.has(q.id) ? 'on' : ''}" data-act="vote" data-q="${q.id}" aria-pressed="${S.votes.has(q.id)}" aria-label="Apoiar pergunta">${ic('up')}<b>${q.votes + (S.votes.has(q.id) ? 1 : 0)}</b></button><div><p>${esc(q.text)}</p><small>${esc(q.who)}</small></div></li>`).join('')}</ul>`;
  }

  /* Prévia em 3D: uma imagem parada do andar, com a sala em destaque. */
  const thumb = (x, i) => `<button class="mapthumb st" ${st(i)} ${mapAct(x)} aria-label="Ver ${x.room} no mapa"><canvas class="thumb3d"></canvas><span>Ver no mapa ${ic('arrow')}</span></button>`;
  const mountThumb = (x) => (page) => {
    const cv = $('canvas.thumb3d', page); if (!cv) return;
    const draw = () => { if (!cv.isConnected) return; const ready = window.Campus3D.preview(cv, x.place ? { place: x.place } : { floor: x.floor, zone: x.zone }); if (!ready) setTimeout(draw, 600); };
    setTimeout(draw, reduce ? 30 : 460);
  };

  Screens.speaker = ({ id }) => {
    const base = byId(id); const list = D.sessions.filter((x) => x.speakerShort === base.speakerShort);
    return {
      html: `${header('')}<div class="pad stack speaker">
        <section class="sp-hero st" ${st(0)}>${spAv(base, true)}<h1>${base.speaker}</h1><p>${base.role}</p></section>
        <h2 class="h st" ${st(1)}>${list.length === 1 ? 'Atividade no ETAL' : 'Atividades no ETAL'}</h2>
        <ul class="splist st" ${st(2)}>${list.map((x) => `<li ${goOf(x)}><span class="date"><small>${dayOf(x.day).week}</small><b>${x.day}</b></span><span><b>${x.short}</b><small>${x.type}</small><em>${x.time} às ${x.end} · ${x.room}</em></span>${ic('chev', 'i chev')}</li>`).join('')}</ul>
        ${list.some((x) => x.learn.length) ? `<h2 class="h st" ${st(3)}>Assuntos</h2><ul class="learn st" ${st(4)}>${list.flatMap((x) => x.learn).slice(0, 5).map((l) => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul>` : ''}
        <p class="nadic-src st" ${st(5)}>Perfil de exemplo. A foto e a minibio entram quando a organização enviar.</p>
      </div>`,
    };
  };

  Screens.activity = ({ id }) => {
    const s = byId(id);
    const here = S.present[id];
    const d = dayOf(s.day);
    if (s.simple) {
      return {
        mount: mountThumb(s),
        html: `${header('')}<div class="pad stack detail">
          <span class="kind st" ${st(0)}>${s.type}</span>
          <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
          <ul class="info st" ${st(2)}><li>${ic('cal')}${d.long} · ${s.time} às ${s.end}</li><li>${ic('pin')}${whereOf(s)}</li></ul>
          ${thumb(s, 3)}
          <p class="desc st" ${st(4)}>${s.description}</p>
        </div>
        <div class="cta-bar"><button class="btn primary big" ${mapAct(s)}>${ic('route')}Como chegar</button></div>`,
      };
    }
    if (here) {
      return {
        html: `${header('', { right: `<button class="iconbtn" data-act="share" data-id="${id}" aria-label="Enviar para o computador">${ic('laptop')}</button>` })}
        <div class="pad stack class-open">
          <div class="co-head st" ${st(0)}><span class="tag ok">${ic('check')}Presença às ${here}</span><span class="kind">${s.type} · ${s.room}</span></div>
          <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
          <button class="teacher st" ${st(2)} data-go="speaker" data-id="${id}">${spAv(s, true)}<span><b>${s.speakerShort}</b><small>${s.role}</small></span><span class="time"><b>${s.time}–${s.end}</b><small>${d.week}, ${s.day} nov</small></span></button>
          <button class="sendpc st" ${st(3)} data-act="share" data-id="${id}"><span class="sp-ic">${ic('laptop')}</span><span><b>Abrir no computador</b><small>${s.link}</small></span>${ic('chev')}</button>
          <section class="st" ${st(4)}><h2 class="h">Materiais</h2></section>
          <ul class="mats">${s.materials.map(materialRow).join('')}</ul>
          <section class="block st" ${st(10)}><h2 class="h">Nesta aula</h2><ul class="learn">${s.learn.map((l) => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul></section>
          <section class="block st" ${st(11)}><h2 class="h">Leve para a sala</h2><p class="desc">${s.requirements}</p></section>
          <section class="block st" ${st(12)}><div class="sec"><h2>Perguntas</h2><button data-act="ask" data-id="${id}">Perguntar</button></div>${questionsOf(id)}</section>
          <section class="block rate st" ${st(13)}><h2 class="h">Avalie esta atividade</h2><div class="stars" role="radiogroup" aria-label="Nota">${[1, 2, 3, 4, 5].map((n) => `<button class="${(S.ratings[id] || 0) >= n ? 'on' : ''}" data-act="rate" data-id="${id}" data-n="${n}" aria-label="${n} de 5">${ic('star')}</button>`).join('')}</div></section>
        </div>`,
      };
    }
    return {
      mount: mountThumb(s),
      html: `${header('', { right: `<button class="iconbtn bm ${S.saved.has(id) ? 'on' : ''}" data-act="save" data-id="${id}" aria-label="Salvar">${ic('bookmark')}</button>` })}
      <div class="pad stack detail">
        <span class="kind st" ${st(0)}>${s.type}</span>
        <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
        <button class="teacher st" ${st(2)} data-go="speaker" data-id="${id}">${spAv(s)}<span><b>${s.speakerShort}</b><small>${s.role}</small></span>${ic('chev', 'i card-chev')}</button>
        <ul class="info st" ${st(3)}><li>${ic('cal')}${d.long} · ${s.time} às ${s.end}</li><li>${ic('pin')}${whereOf(s)}</li><li>${ic('users')}<span>${seatLine(s)}</span>${seatBar(s)}</li></ul>
        ${thumb(s, 4)}
        <p class="desc st" ${st(5)}>${s.description}</p>
        <button class="remindrow st ${S.reminders.has(id) ? 'on' : ''}" ${st(6)} data-act="remind" data-id="${id}" aria-pressed="${S.reminders.has(id)}">${ic('alarm')}<span>${S.reminders.has(id) ? `Lembrete às ${hhmm(toMin(s.time) - LEAD)}` : `Lembrar ${LEAD} minutos antes`}<small>${S.reminders.has(id) ? `Com sala e tempo a pé${notifState() === 'granted' ? '' : ', dentro do app'}` : 'Aviso com a sala e o caminho'}</small></span><i class="switch"></i></button>
        ${S.reminders.has(id) ? `<button class="remindtest st" ${st(6)} data-act="remindtest" data-id="${id}">${ic('bell')}Ver como o lembrete chega</button>` : ''}
        <div class="locked st" ${st(7)}>${ic('lock')}<span>${s.materials.length} materiais ficam disponíveis quando você registrar presença na sala.</span></div>
      </div>
      <div class="cta-bar"><button class="btn primary big" data-act="scan">${ic('qr')}Registrar presença</button></div>`,
    };
  };

  const searchBtn = () => `<button class="search" data-act="finder">${ic('search')}<span>Buscar sala ou atividade</span></button>`;
  const MAP_TABS = [['evento', 'Evento'], ['bloco', 'Andares'], ['campus', 'Campus']];
  const viewSeg = () => `<div class="seg" style="--k:${MAP_TABS.findIndex(([v]) => v === S.mapView)}"><i class="seg-ind"></i>${MAP_TABS.map(([v, t]) => `<button class="${S.mapView === v ? 'on' : ''}" data-act="mapview" data-v="${v}">${t}</button>`).join('')}</div>`;
  const dimToggle = () => { if (!window.Campus3D.canUse3D()) return ''; const f = window.Campus3D.isFlat(); return `<div class="dim" role="group" aria-label="Tipo de vista" style="--k:${f ? 1 : 0}"><i></i><button class="${f ? '' : 'on'}" data-act="dim" data-v="3d" aria-pressed="${!f}">3D</button><button class="${f ? 'on' : ''}" data-act="dim" data-v="2d" aria-pressed="${f}">2D</button></div>`; };
  const EVENT_PLACES = ['principal', 'auditorio', 'cantina', 'patio'];
  const EVENT_DOT = { principal: '#62b22f', auditorio: '#3a62b8', cantina: '#e8a825', patio: '#8fce63' };

  function campusSheet() {
    const id = S.campusPlace;
    if (!id && S.mapView === 'evento') {
      return `<div class="sheet-card campus-sheet ev-sheet"><i class="grab"></i>
        <strong>Onde o ETAL acontece</strong>
        <ul class="ev-grid">${EVENT_PLACES.map((k) => `<li><button data-act="place" data-id="${k}"><i class="ev-dot" style="background:${EVENT_DOT[k]}"></i><span><b>${D.places[k].name}</b><small>${D.places[k].kind}</small></span></button></li>`).join('')}</ul>
      </div>`;
    }
    if (!id) {
      return `<div class="sheet-card campus-sheet"><i class="grab"></i>
        <div class="sh-top"><div><strong>IFRN Pau dos Ferros</strong><small>Toque num prédio para ver como chegar</small></div></div>
        <div class="place-chips">${D.placeOrder.map((k) => `<button data-act="place" data-id="${k}">${D.places[k].name}</button>`).join('')}</div>
      </div>`;
    }
    const p = D.places[id];
    const sq = Math.round(window.Campus3D.areaOf(id)).toLocaleString('pt-BR');
    const on = window.Campus3D.routeOn(id);
    return `<div class="sheet-card campus-sheet"><i class="grab"></i>
      <div class="sh-top"><div><strong>${p.name}</strong><small>${p.noArea ? p.kind : `${p.kind} · cerca de ${sq} m²`}</small></div><button class="iconbtn sm" data-act="placeclose" aria-label="Fechar">${ic('x')}</button></div>
      <p class="sh-text">${p.text}</p>
      <div class="sh-btns">
        ${!window.Campus3D.hasRoute(id) ? '' : `<button class="btn ${p.floors || p.link || p.plan ? 'soft' : 'primary'}" data-act="placeroute" data-id="${id}">${ic('route')}${on ? 'Rota no mapa' : 'Como chegar'}</button>`}
        ${p.floors ? `<button class="btn primary" data-act="enterbloco">${ic('building')}Ver os andares</button>` : ''}
        ${p.link ? `<button class="btn primary" data-go="${p.link}">Sobre o NADIC</button>` : ''}
        ${p.plan ? `<button class="btn primary" data-act="openmap" data-floor="${p.plan[0]}" data-zone="${p.plan[1]}">${ic('building')}Ver na planta</button>` : ''}
      </div>
    </div>`;
  }

  Screens.campus = () => ({
    html: `<div class="map-screen campus">
      <div class="map-top">${searchBtn()}${viewSeg()}</div>
      <canvas class="campus3d" tabindex="0" role="application" aria-label="Mapa do campus IFRN Pau dos Ferros, com a área do evento em destaque. Arraste para mover e use os botões para aproximar."></canvas>
      ${camCtrl()}
      ${campusSheet()}
    </div>`,
    mount: mountCampus,
  });

  /* ---- colmeia ---- */
  function combEarned() {
    const got = new Set();
    if (S.credAt) got.add('cred');
    Object.keys(S.present).forEach((k) => got.add(k));
    if (Object.values(S.asked).some((a) => a.length)) got.add('ask');
    if (Object.keys(S.ratings).length) got.add('rate');
    if (S.contacts.length) got.add('contact');
    return D.combs.filter((c) => got.has(c.id)).map((c) => c.id);
  }
  /* Favo de 7 células: a chegada no centro e as outras em volta. */
  const COMB_POS = [[0, 0], [14, -24.2], [28, 0], [14, 24.2], [-14, 24.2], [-28, 0], [-14, -24.2]];
  function comb(cls = '', all = false) {
    const got = all ? D.combs.map((c) => c.id) : combEarned();
    return `<svg class="hm-comb ${cls}" viewBox="-44 -42 88 84" aria-hidden="true">${D.combs.map((c, i) => {
      const on = got.includes(c.id);
      const [x, y] = COMB_POS[i];
      return `<g class="cell ${on ? 'on' : ''} ${S.newComb === c.id ? 'pop' : ''}" transform="translate(${x} ${y})"><g class="cell-in"><path d="M0-15.300 13.250-7.650V7.650L0 15.300-13.250 7.650V-7.650Z"/><g class="glyph" transform="scale(.56) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round">${on ? ICONS[c.icon] : ''}</g></g></g>`;
    }).join('')}</svg>`;
  }
  function combCard() {
    const got = combEarned();
    const next = D.combs.find((c) => !got.includes(c.id));
    return `<button class="hm-combcard st" ${st(4)} data-go="colmeia">${comb()}<span class="hm-combtx"><b>Sua colmeia</b><strong>${got.length} de ${D.combs.length} favos</strong><small>${next ? next.how : 'Colmeia completa!'}</small></span>${ic('chev')}</button>`;
  }
  Screens.colmeia = () => {
    const got = combEarned();
    const done = got.length === D.combs.length;
    return {
      html: `${header('Sua colmeia')}<div class="pad stack hm-colmeia">
        <div class="hm-bigcomb st" ${st(0)}>${comb('big')}</div>
        <p class="hm-count st" ${st(1)}><b>${got.length}</b> de ${D.combs.length} favos${done ? '. Colmeia completa!' : ''}</p>
        <ul class="hm-combs st" ${st(2)}>${D.combs.map((c) => { const on = got.includes(c.id); return `<li class="${on ? 'on' : ''}"><i>${ic(on ? c.icon : 'lock')}</i><span><b>${c.title}</b><small>${on ? 'Conquistado' : c.how}</small></span></li>`; }).join('')}</ul>
        ${got.length ? `<button class="btn soft big st" ${st(3)} data-act="toast" data-msg="Imagem da colmeia pronta para compartilhar">${ic('share')}Compartilhar minha colmeia</button>` : ''}
      </div>`,
    };
  };
  let combSeen = null;
  /* Favo recém-ganho. Quem mostrar primeiro (tela de resultado ou aviso) consome, para não repetir. */
  function takeNewComb() {
    const got = combEarned();
    if (combSeen === null) { combSeen = got; return null; }
    const fresh = got.find((g) => !combSeen.includes(g));
    combSeen = got;
    if (!fresh) return null;
    S.newComb = fresh;
    setTimeout(() => { if (S.newComb === fresh) S.newComb = null; }, 6000);
    return D.combs.find((x) => x.id === fresh);
  }
  function checkCombs() { const c = takeNewComb(); if (c) setTimeout(() => combToast(c), 900); }
  /* Linha "novo favo" dentro das telas de resultado. */
  function combRow(c) {
    const n = combEarned().length;
    return `<div class="res-comb">${comb('rc')}<span><small>Novo favo na colmeia</small><b>${esc(c.title)}</b></span><em><b>${n}</b>/${D.combs.length}</em></div>`;
  }
  /* Aviso de favo novo: cai do topo com a colmeia e o favo acendendo. Tocar abre a colmeia. */
  let combT;
  function combToast(c) {
    let n = $('#combtoast');
    if (!n) {
      n = document.createElement('button'); n.type = 'button'; n.id = 'combtoast'; n.className = 'combtoast'; n.dataset.go = 'colmeia';
      n.addEventListener('click', () => n.classList.remove('show'));
      $('.screen').appendChild(n);
    }
    const got = combEarned();
    n.innerHTML = `<span class="ct-comb">${comb('ct')}</span>
      <span class="ct-tx"><small>${ic('star')}Novo favo na sua colmeia</small><b>${esc(c.title)}</b>
      <span class="ct-bar">${D.combs.map((x) => `<i class="${got.includes(x.id) ? 'on' : ''}${x.id === c.id ? ' new' : ''}"></i>`).join('')}</span></span>
      <span class="ct-n"><b>${got.length}</b>de ${D.combs.length}</span><i class="ct-shine"></i>`;
    n.classList.remove('show'); void n.offsetWidth; n.classList.add('show');
    buzz([12, 30, 12]);
    clearTimeout(combT); combT = setTimeout(() => n.classList.remove('show'), 4800);
  }

  /* ---- céu do Alto Oeste: muda com o horário, sem imagem nenhuma ---- */
  const SKY_KEYS = [
    [5, '#111a3d', '#343b6c', '#a8685e'], [6.25, '#3d5c9f', '#e6a174', '#fbd7a6'], [8.5, '#3f86d8', '#8bc1ee', '#d8eefa'],
    [14, '#2c7bd3', '#68afed', '#cfe9f8'], [16.75, '#4a74bd', '#efae6d', '#fbdb9b'], [18, '#34396f', '#c9644e', '#f4a15b'],
    [19, '#141d40', '#2b2f63', '#6d4a6e'], [22, '#0b1230', '#141d45', '#232c5c'],
  ];
  const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = (c) => `rgb(${c.join(',')})`;
  let skyHour = 14 + 2 / 60;
  const skyClock = () => { const m = Math.round(skyHour * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  function applySky() {
    const h = skyHour;
    let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
    for (let i = 0; i < SKY_KEYS.length - 1; i++) if (h >= SKY_KEYS[i][0] && h <= SKY_KEYS[i + 1][0]) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
    const t = b === a ? 0 : Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    const [c1, c2, c3] = [1, 2, 3].map((i) => mixC(hex2(a[i]), hex2(b[i]), t));
    const night = Math.max(0, Math.min(1, h < 6 ? (6 - h) / 0.8 : (h - 18.2) / 0.8));
    const navy = hex2('#1b2d5c');
    const st_ = device.style;
    st_.setProperty('--sky-1', css(c1)); st_.setProperty('--sky-2', css(c2)); st_.setProperty('--sky-3', css(c3));
    st_.setProperty('--sil-near', css(mixC(navy, c1, 0.1 * (1 - night)))); st_.setProperty('--sil-mid', css(mixC(navy, c2, 0.3 * (1 - night * 0.7)))); st_.setProperty('--sil-far', css(mixC(navy, c3, 0.5 * (1 - night * 0.7))));
    st_.setProperty('--night', night.toFixed(3));
    const p = (h - 5.6) / (18.6 - 5.6);
    st_.setProperty('--sun-o', p > 0 && p < 1 ? '1' : '0');
    st_.setProperty('--sun-x', `${8 + Math.max(0, Math.min(1, p)) * 84}%`);
    st_.setProperty('--sun-y', `${74 - Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) * 62}%`);
    st_.setProperty('--sun-c', p < 0.12 || p > 0.86 ? '#ffb765' : '#ffe9a8');
    const m = (h - 18.6) / 5;
    st_.setProperty('--moon-x', `${14 + Math.max(0, Math.min(1, m)) * 56}%`);
    st_.setProperty('--moon-y', `${56 - Math.sin(Math.max(0, Math.min(1, m)) * 2.2) * 40}%`);
    const clock = skyClock();
    const ck = $('#clock'); if (ck) ck.textContent = clock;
    const nc = $('#nowclock'); if (nc) nc.textContent = clock;
    const r = $('#skyr'); if (r && document.activeElement !== r) r.value = h;
    const o = $('#skyo'); if (o) o.textContent = clock;
    if (typeof checkReminders === 'function') checkReminders();
  }
  let skyAnim = 0;
  function skyTo(target) {
    cancelAnimationFrame(skyAnim);
    if (reduce) { skyHour = target; applySky(); return; }
    const from = skyHour; const t0 = performance.now();
    const step = (n) => { const k = Math.min(1, (n - t0) / 1400); skyHour = from + (target - from) * (1 - (1 - k) ** 3); applySky(); if (k < 1) skyAnim = requestAnimationFrame(step); };
    skyAnim = requestAnimationFrame(step);
  }
  /* Vista da rua: posições e larguras do levantamento, alturas adotadas. */
  function skyline() {
    const E = window.CAMPUS.elementos;
    const span = (i) => { const xs = E[i].pontos.map((q) => q[0]); return [Math.min(...xs), Math.max(...xs)]; };
    const G = 47; const Y = 2;
    const box = (i, h, cls) => { const [a, b] = span(i); return `<rect class="${cls}" x="${a.toFixed(1)}" y="${(G - h * Y).toFixed(1)}" width="${(b - a).toFixed(1)}" height="${(h * Y + 3).toFixed(1)}"/>`; };
    const wins = (i, h, floors) => {
      const [a, b] = span(i); let o = ''; const per = (h * Y) / floors;
      for (let f = 0; f < floors; f++) for (let x = a + 1.4; x < b - 1.4; x += 3.1) o += `<rect x="${x.toFixed(1)}" y="${(G - per * (f + 0.68)).toFixed(1)}" width="1.700" height="${(per * 0.36).toFixed(1)}"/>`;
      return o;
    };
    const tree = (i, r) => { const x = E[i].pontos[0][0]; return `<rect class="sl-near" x="${(x - 0.35).toFixed(1)}" y="${G - r * 2.2}" width=".7" height="${r * 2.2 + 3}"/><circle class="sl-near" cx="${x.toFixed(1)}" cy="${G - r * 2.4}" r="${r}"/>`; };
    const [px0, px1] = span(5);
    const clouds = '<g class="sl-cloud"><path d="M-74 17h15a3 3 0 0 0-3-5 4.500 4.500 0 0 0-8-1 3.500 3.500 0 0 0-4 6Z"/></g><g class="sl-cloud two"><path d="M15 11h20a3.600 3.600 0 0 0-4-6 5.500 5.500 0 0 0-10-1 4.200 4.200 0 0 0-6 7Z"/></g>';
    return `<svg class="hm-skyline" viewBox="-100 0 162 50" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      ${clouds}
      <path class="sl-far" d="M-110 50V37C-92 31-76 34-60 36S-28 28-6 32 34 38 70 30V50Z"/>
      ${box(7, 4.8, 'sl-mid')}${box(4, 4.8, 'sl-mid')}${box(1, 4.8, 'sl-mid')}
      ${box(0, 13.8, 'sl-mid')}<g class="sl-win">${wins(0, 13.8, 3)}</g>
      ${box(3, 9.3, 'sl-near')}<g class="sl-win">${wins(3, 9.3, 2)}</g>
      <rect class="sl-near" x="${px0.toFixed(1)}" y="${G - 7.2 * Y}" width="${(px1 - px0).toFixed(1)}" height="1.300"/>${[0, 0.33, 0.66, 1].map((t) => `<rect class="sl-near" x="${(px0 + (px1 - px0) * t - 0.3).toFixed(1)}" y="${G - 7.2 * Y}" width=".6" height="${7.2 * Y + 3}"/>`).join('')}
      ${box(6, 4.8, 'sl-near')}
      <rect class="sl-near" x="-50" y="${G - 2.3 * Y}" width="107" height="${2.3 * Y + 3}"/>
      ${box(8, 3.6, 'sl-near')}
      ${[[31, 2.2], [32, 2.2], [33, 2.2], [30, 3.2], [29, 2.2], [28, 2.2], [26, 2.2]].map(([i, r]) => tree(i, r)).join('')}
    </svg>`;
  }
  const skyArt = () => `<div class="hm-bg"><i class="hm-stars"></i><button class="hm-sun" data-act="skycycle" aria-label="Mudar a hora do céu"></button><i class="hm-moon"></i>${skyline()}</div>`;

  /* ---- campus ao vivo ---- */
  let liveI = 0, liveTimer = 0, liveCred = D.liveBase.credenciados;
  function liveMessages() {
    const f = byId('fastapi'); const ia = byId('experiencia-ia'); const mk = D.tournaments[0];
    return [
      { i: 'users', t: `${liveCred} pessoas credenciadas`, go: 'notices' },
      { i: 'pin', t: `${f.room} com ${f.seats - f.taken} vagas: ${f.short}`, go: 'activity', id: f.id },
      { i: 'mic', t: `${ia.room}: ${ia.short} em andamento`, go: 'activity', id: ia.id },
      { i: 'trophy', t: `${mk.name} começa ${dayOf(mk.day).week.toLowerCase()}, ${mk.time}`, go: 'games' },
      { i: 'bell', t: D.notices[0].title, go: 'notices' },
    ];
  }
  function mountHome(page) {
    const stateScroll = () => device.classList.toggle('sky-past', page.scrollTop > 104);
    page.addEventListener('scroll', stateScroll, { passive: true });
    stateScroll();
    applySky();
    const box = $('.hm-live', page);
    if (!box) return;
    const row = $('.hm-live-msg', page);
    const paint = () => {
      const list = liveMessages(); const m = list[liveI % list.length];
      row.innerHTML = `${ic(m.i)}<span>${m.t}</span>`;
      box.dataset.go = m.go;
      if (m.id) box.dataset.id = m.id; else delete box.dataset.id;
    };
    paint();
    clearInterval(liveTimer);
    if (reduce) return;
    liveTimer = setInterval(() => {
      if (!box.isConnected) { clearInterval(liveTimer); return; }
      row.classList.add('out');
      setTimeout(() => {
        liveI += 1; liveCred += 1 + (liveI % 3);
        paint();
        row.classList.remove('out');
        row.classList.add('in');
        setTimeout(() => row.classList.remove('in'), 380);
      }, 240);
    }, 3800);
  }

  const FLOOR_DESC = ['Entrada, recepção e auditório', 'Salas de aula e bebedouro', 'Laboratórios e sala dos professores'];
  const camCtrl = (cls = '') => `${dimToggle().replace('class="dim"', `class="dim ${cls}"`)}${fpsHud()}<div class="map-ctrl cam-ctrl ${cls}"><button class="iconbtn" data-act="cam" data-v="in" aria-label="Aproximar">${ic('plus')}</button><button class="iconbtn" data-act="cam" data-v="out" aria-label="Afastar">${ic('minus')}</button>${window.Campus3D.isFlat() ? '' : `<button class="iconbtn" data-act="cam" data-v="rot" aria-label="Girar a vista">${ic('rotate')}</button>`}<button class="iconbtn" data-act="cam" data-v="fit" aria-label="Enquadrar">${ic('expand')}</button></div>`;

  function routeSteps(lvl, z) {
    const r = window.Campus3D.routeInfo(lvl, z.id, S.mapVia);
    const lead = S.mapVia ? '' : 'Caminho mais rápido: ';
    const label = floorOf(lvl).label;
    const enter = `${lead}${lead ? 'entre' : 'Entre'} pela ${r.entrance}`;
    if (!r.via) return `${enter} e siga pelo corredor até a porta.`;
    return `${enter}, suba pela ${r.via} ${r.viaWhere} até o ${label} e siga pelo corredor até a porta.`;
  }

  function blocoSheet() {
    const lvl = S.mapFloor;
    if (lvl === null) {
      return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>Bloco principal</strong><small>Toque num andar para entrar</small></div>`;
    }
    const z = S.mapZone ? zoneOf(lvl, S.mapZone) : null;
    if (S.journeying) return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>${z ? zoneName(z) : floorOf(lvl).label}</strong><small>${floorOf(lvl).label} · toque no mapa para pular</small></div>`;
    if (!z) return `<div class="sheet-card campus-sheet"><i class="grab"></i><div class="sh-top"><div><strong>${floorOf(lvl).label}</strong><small>${FLOOR_DESC[lvl]}</small></div></div><p class="sh-text">Toque numa sala para ver o que acontece nela.</p></div>`;
    const acts = D.sessions.filter((x) => x.floor === lvl && x.zone === z.id);
    const walkable = !['stairs', 'ramp', 'courtyard'].includes(z.kind);
    return `<div class="sheet-card campus-sheet"><i class="grab"></i>
      <div class="sh-top"><div><strong>${zoneName(z)}</strong><small>${z.roomNumber && z.kind !== 'classroom' ? `${z.useLabel} · ` : ''}${floorOf(lvl).label}</small></div><button class="iconbtn sm" data-act="zoneclose" aria-label="Fechar">${ic('x')}</button></div>
      ${acts.length && !S.mapRoute ? `<ul class="sh-acts">${acts.slice(0, 2).map((x) => `<li data-go="activity" data-id="${x.id}"><span><b>${x.short}</b><small>${dayOf(x.day).week} ${x.day} · ${x.time}</small></span>${ic('chev')}</li>`).join('')}</ul>` : ''}
      ${walkable && lvl > 0 && S.mapRoute ? (() => { const v = S.mapVia || window.Campus3D.routeInfo(lvl, z.id, null).via; return `<div class="via" style="--k:${v === 'rampa' ? 1 : 0}"><i></i><button class="${v === 'escada' ? 'on' : ''}" data-act="via" data-v="escada">${ic('stairs')}Escada</button><button class="${v === 'rampa' ? 'on' : ''}" data-act="via" data-v="rampa">${ic('nav')}Rampa</button></div>`; })() : ''}
      ${S.mapRoute && walkable ? `<p class="sh-text steps">${routeSteps(lvl, z)}</p>` : walkable ? `<button class="btn primary" data-act="roomroute">${ic('route')}Como chegar</button>` : ''}
    </div>`;
  }

  Screens.map = () => {
    if (S.mapView !== 'bloco') return Screens.campus();
    const idx = S.mapFloor === null ? 0 : S.mapFloor + 1;
    return {
      html: `<div class="map-screen campus">
        <div class="map-top">${searchBtn()}${viewSeg()}
          <div class="seg ${window.Campus3D.canUse3D() ? 'four' : ''}" style="--k:${window.Campus3D.canUse3D() ? idx : idx - 1}"><i class="seg-ind"></i>${window.Campus3D.canUse3D() ? `<button class="${idx === 0 ? 'on' : ''}" data-act="floorsel" data-v="all">Todos</button>` : ''}${[0, 1, 2].map((l) => `<button class="${S.mapFloor === l ? 'on' : ''}" data-act="floorsel" data-v="${l}">${l === 0 ? 'Térreo' : `${l}º`}</button>`).join('')}</div>
        </div>
        <canvas class="campus3d" tabindex="0" role="application" aria-label="Bloco principal em volume, com os três andares. Toque num andar ou numa sala."></canvas>
        ${camCtrl('low')}
        ${blocoSheet()}
      </div>`,
      mount: mountCampus,
    };
  };

  Screens.nadic = () => {
    const n = D.nadic;
    return {
      html: `${header('NADIC')}<div class="pad stack about">
        <section class="ab-hero st" ${st(0)}>
          <svg class="ab-pins" viewBox="0 0 200 120" aria-hidden="true"><path d="M150 120V70M170 120V50M190 120V70M0 34H96l14 14h40"/><circle cx="150" cy="64" r="5"/><circle cx="170" cy="44" r="5"/><circle cx="190" cy="64" r="5"/><circle cx="156" cy="48" r="5"/></svg>
          <img src="assets/nadic-logo.svg" alt="NADIC" width="170" height="74">
          <h1>${n.full}</h1>
          <p>${n.motto}</p>
        </section>
        <p class="desc st" ${st(1)}>${n.about}</p>
        <ul class="ab-tags st" ${st(2)}>${n.fields.map((f) => `<li>${f}</li>`).join('')}</ul>
        <dl class="nadic-stats st" ${st(3)}>${n.stats.map(([v, t]) => `<div><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>
        <h2 class="h st" ${st(4)}>Projetos</h2>
        <ul class="ab-list st" ${st(5)}>${n.projects.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join('')}</ul>
        <h2 class="h st" ${st(6)}>Contato</h2>
        <ul class="ab-list st" ${st(7)}>
          <li data-act="nadicmap" class="tap"><b>Prédio do NADIC</b><small>Ver no mapa do campus</small>${ic('chev')}</li>
          <li><b>Coordenação</b><small>${n.lead}</small></li>
          <li><b>E-mail</b><small class="sel">${n.email}</small></li>
          <li><b>Endereço</b><small>${n.address}</small></li>
        </ul>
        <a class="btn primary big st" ${st(8)} href="${n.url}" target="_blank" rel="noopener">Abrir o site do NADIC ${ic('open')}</a>
        <p class="nadic-src st" ${st(9)}>${n.source}</p>
      </div>`,
    };
  };

  Screens.etal = () => {
    const e = D.etal;
    return {
      html: `${header('O que é o ETAL')}<div class="pad stack about">
        <div class="ab-logo st" ${st(0)}><img src="assets/etal-logo.png" alt="ETAL"></div>
        <h1 class="title-lg st" ${st(1)}>${e.full}</h1>
        <p class="desc st" ${st(2)}>${e.about}</p>
        <ul class="ab-tags st" ${st(3)}>${e.areas.map((f) => `<li>${f}</li>`).join('')}</ul>
        <ul class="ab-list st" ${st(4)}><li><b>Como acontece</b><small>${e.formats}</small></li><li><b>Onde</b><small>${e.place}</small></li></ul>
        <h2 class="h st" ${st(5)}>Edições</h2>
        <ol class="ab-time st" ${st(6)}>${e.editions.map(([y, n, d]) => `<li><time>${y}</time><span><b>${n}</b><small>${d}</small></span></li>`).join('')}</ol>
        <div class="ab-btns st" ${st(7)}><a class="btn primary" href="${e.site}" target="_blank" rel="noopener">Site do evento ${ic('open')}</a><a class="btn soft" href="${e.portal}" target="_blank" rel="noopener">Página no IFRN ${ic('open')}</a></div>
        <p class="nadic-src st" ${st(8)}>${e.source}</p>
      </div>`,
    };
  };

  const TIER_LABEL = { alta: '3D completo', media: '3D médio', leve: '3D leve', simples: '2D simples' };
  /* Medidor de quadros, em cima do mapa: toque para trocar de versão. */
  let hudTimer = 0;
  const fpsHud = () => (UI.fps ? '<button class="fps-hud" data-act="hudcycle" aria-label="Trocar a versão do mapa"><b>--</b><small></small></button>' : '');
  function startHud(page) {
    clearInterval(hudTimer);
    const el = $('.fps-hud', page); if (!el) return;
    const paint = () => { if (!el.isConnected) { clearInterval(hudTimer); return; } const t = window.Campus3D.stats(); el.querySelector('b').textContent = t.fps ? `${t.fps} fps` : '-- fps'; el.classList.toggle('bad', t.fps > 0 && t.fps < 24); el.querySelector('small').textContent = `${TIER_LABEL[t.tier]} · ${t.cost} ms`; };
    paint(); hudTimer = setInterval(paint, 500);
  }
  Screens.perf = () => {
    const r = S.perfResults || [];
    const best = bestOf(r);
    const q = window.Campus3D.quality();
    return {
      mount: mountPerf,
      html: `${header('Testar desempenho')}<div class="perf">
        <div class="perf-stage"><canvas class="campus3d" tabindex="-1" aria-label="Mapa durante o teste"></canvas>${fpsHudForce()}</div>
        <div class="pad stack">
          <p class="desc">O teste roda as quatro versões do mapa neste aparelho e mostra os quadros por segundo. Leva cerca de 40 segundos.</p>
          <button class="btn primary big" data-act="perfrun" ${S.perfBusy ? 'disabled' : ''}>${S.perfBusy ? `Testando: ${TIER_LABEL[S.perfBusy]}…` : r.length ? 'Testar de novo' : 'Iniciar teste'}</button>
          ${r.length ? `<ul class="perf-table">${r.map((x) => `<li class="${best === x ? 'best' : ''}"><button data-act="perfuse" data-v="${x.tier}"><b>${TIER_LABEL[x.tier]}${best === x ? '<em>Recomendado</em>' : ''}</b><span><i>Girar</i>${x.giro.fps} fps</span><span><i>Como chegar</i>${x.rota.fps} fps</span>${q.tier === x.tier ? ic('check', 'i') : ''}</button></li>`).join('')}</ul>
          <label class="sr" for="perfout">Resultado</label><textarea id="perfout" class="perf-out" rows="6" readonly>${perfText(r)}</textarea>` : ''}
          <p class="nadic-src">Em uso: ${TIER_LABEL[q.tier]}. Toque numa versão para usá-la.</p>
        </div>
      </div>`,
    };
  };
  const fpsHudForce = () => '<div class="fps-hud" aria-hidden="true"><b>--</b><small></small></div>';
  /* A melhor versão que ficou fluida: 50 fps girando, sem tranco maior que 50 ms, e o "como chegar" liso.
     Em aparelho fraco, aceita a primeira que ainda anda; senão, o 2D. */
  const bestOf = (r) => r.find((x) => x.giro.fps >= 50 && x.giro.p95 <= 50 && x.rota.p95 <= 34)
    || r.find((x) => x.tier !== 'simples' && x.rota.fps >= 30 && x.giro.fps >= 20) || r.find((x) => x.tier === 'simples');
  const perfText = (r) => `${navigator.userAgent}\nnúcleos ${navigator.hardwareConcurrency || '?'} · memória ${navigator.deviceMemory || '?'} GB · tela ${screen.width}×${screen.height} @${window.devicePixelRatio}\n${r.map((x) => `${x.tier}: girar ${x.giro.fps} fps (pior ${x.giro.p95} ms), como chegar ${x.rota.fps} fps (pior ${x.rota.p95} ms)`).join('\n')}\nautomático: ${window.Campus3D.quality().tier} · ${window.Campus3D.quality().why} · teste rápido ${window.Campus3D.quality().info?.ms ?? '?'} ms`;
  function mountPerf(page) {
    const cv = useMapCanvas(page); if (!cv) return;
    window.Campus3D.attach(cv, { top: 0, bottom: 0, onPick: () => {}, onQuality: () => {} });
    startHud(page);
  }
  async function perfRun() {
    if (S.perfBusy) return;
    const C = window.Campus3D; const out = [];
    for (const t of C.tiers()) {
      S.perfBusy = t; S.perfResults = out.slice(); rerender();
      out.push(await C.benchTier(t));
    }
    const best = bestOf(out); C.useTested(best.tier);
    S.perfBusy = null; S.perfResults = out; rerender(); toast(`Teste concluído: o automático agora usa ${TIER_LABEL[best.tier]}`);
  }

  Screens.personalizar = () => {
    const C = window.Campus3D; const q = C.quality();
    const LABEL = TIER_LABEL;
    return {
      html: `${header('Personalizar')}<div class="pad stack custom">
        <section class="cu-preview st" ${st(0)} aria-hidden="true">
          <div class="cu-badge"><span class="av">${esc(D.person.initials)}</span><span><b>${esc(D.person.first)}</b><small>${esc(D.person.course)}</small></span></div>
          <div class="cu-row"><span class="btn primary">Como chegar</span><span class="btn soft">Presença</span></div>
        </section>
        <h2 class="h">Tema</h2>
        <div class="cu-themes">${Object.entries(THEMES).map(([k, t]) => {
          const dk = isDark(); const n = t.hue; const bg = n === null ? (dk ? '#0e1932' : '#f4f6fa') : dk ? hsl(n, 0.34, 0.1) : hsl(n, 0.3, 0.955);
          return `<button class="${UI.theme === k && !UI.accent ? 'on' : ''}" data-act="theme" data-v="${k}" aria-pressed="${UI.theme === k}"><i style="background:${bg}"><u style="background:${t.accent}"></u></i><b>${t.name}</b><small>${t.desc}</small></button>`;
        }).join('')}</div>
        <h2 class="h">Cor de destaque</h2>
        <div class="cu-accents">${ACCENTS.map((a) => `<button class="${UI.accent === a ? 'on' : ''}" style="background:${a}" data-act="accent" data-v="${a}" aria-label="Usar a cor ${a}">${UI.accent === a ? ic('check') : ''}</button>`).join('')}<label class="cu-custom" aria-label="Escolher outra cor"><input type="color" id="accentpick" value="${UI.accent || (THEMES[UI.theme] || THEMES.etal).accent}">${ic('plus')}</label></div>
        <ul class="cu-opts">
          <li><span>Aparência</span>${uiSeg('mode', [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']])}</li>
          <li><span>Crachá</span>${uiSeg('badge', [['solido', 'Sólido'], ['degrade', 'Degradê'], ['colmeia', 'Colmeia']])}</li>
          <li><span>Cantos</span>${uiSeg('corners', [['retos', 'Retos'], ['suaves', 'Suaves'], ['redondos', 'Redondos']])}</li>
          <li><span>Fonte</span>${uiSeg('font', [['padrao', 'Padrão'], ['arredondada', 'Arredondada'], ['leitura', 'Leitura fácil']])}</li>
          <li><span>Texto</span>${uiSeg('text', [['normal', 'Normal'], ['grande', 'Grande'], ['maior', 'Maior']])}</li>
          <li><span>Animações</span>${uiSeg('motion', [['completas', 'Completas'], ['reduzidas', 'Reduzidas']])}</li>
        </ul>
        <h2 class="h">No início</h2>
        <ul class="cu-toggles">
          <li><button data-act="uisky" aria-pressed="${UI.sky}" class="${UI.sky ? 'on' : ''}"><span>Céu do Alto Oeste</span><i class="switch"></i></button></li>
          ${HOME_PARTS.map(([k, t]) => `<li><button data-act="uihome" data-k="${k}" aria-pressed="${UI.home[k]}" class="${UI.home[k] ? 'on' : ''}"><span>${t}</span><i class="switch"></i></button></li>`).join('')}
        </ul>
        <h2 class="h">Mapa</h2>
        <ul class="cu-opts">
          ${C.canUse3D() ? `<li><span>Vista inicial</span>${uiSeg('view', [['3d', '3D'], ['2d', '2D']])}</li>` : ''}
          <li><span>Qualidade</span><div class="mini-seg wide" role="radiogroup">${[['auto', 'Auto'], ['alta', 'Completo'], ['media', 'Médio'], ['leve', 'Leve'], ['simples', '2D']].map(([v, t]) => `<button class="${q.setting === v ? 'on' : ''}" role="radio" aria-checked="${q.setting === v}" data-act="quality" data-v="${v}">${t}</button>`).join('')}</div><small class="cu-note">Em uso: ${LABEL[q.tier]}${q.setting === 'auto' ? ` · ${q.why}` : ''}. </small></li>
          <li class="cu-row2"><button data-act="uifps" aria-pressed="${!!UI.fps}" class="${UI.fps ? 'on' : ''}"><span>Mostrar FPS no mapa</span><i class="switch"></i></button></li>
          <li class="cu-row2"><button data-go="perf"><span>Testar desempenho neste aparelho</span>${ic('chev', 'i card-chev')}</button></li>
        </ul>
        <button class="btn ghost" data-act="uireset">Restaurar o padrão</button>
      </div>`,
    };
  };

  /* ---- retrospectiva ---- */
  function retroData(demo) {
    const ids = demo ? D.enrolled : Object.keys(S.present);
    const list = ids.map(byId);
    const q = Object.values(S.asked).reduce((n, a) => n + a.length, 0);
    return { demo, list, hours: list.reduce((n, x) => n + hoursOf(x), 0), learn: list.flatMap((x) => x.learn).slice(0, 5), people: list, questions: demo ? 2 : q, contacts: demo ? 3 : S.contacts.length, ratings: demo ? 3 : Object.keys(S.ratings).length };
  }
  function retroSlides(r) {
    const tag = r.demo ? '<span class="re-tag">Dados de exemplo</span>' : '';
    const got = r.demo ? D.combs.length : combEarned().length;
    const n = r.list.length;
    return [
      `<div class="re-c">${mark('mark re-mark')}${tag}<h1>Seu ETAL</h1><p>VII edição, 26 a 28 de novembro, em Pau dos Ferros.</p><strong>${esc(D.person.name)}</strong></div>`,
      `<div class="re-c">${tag}<small>Tempo de aprendizado</small><b class="re-num" data-to="${r.hours}">0</b><p>em ${n} ${n === 1 ? 'atividade' : 'atividades'}.</p><ul class="re-list">${r.list.map((x) => `<li>${x.short}<small>${x.type}, ${x.room}</small></li>`).join('')}</ul></div>`,
      `<div class="re-c">${tag}<small>O que você aprendeu</small><ul class="re-learn">${r.learn.map((l) => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul></div>`,
      `<div class="re-c">${tag}<small>Quem fez parte</small><div class="re-people">${r.people.map((x) => `<span><i>${x.initials}</i>${x.speakerShort}</span>`).join('')}</div><dl class="re-stats"><div><dd>${r.questions}</dd><dt>${r.questions === 1 ? 'pergunta' : 'perguntas'}</dt></div><div><dd>${r.contacts}</dd><dt>${r.contacts === 1 ? 'contato' : 'contatos'}</dt></div><div><dd>${r.ratings}</dd><dt>${r.ratings === 1 ? 'avaliação' : 'avaliações'}</dt></div></dl></div>`,
      `<div class="re-c">${tag}<small>Sua colmeia</small><div class="re-comb">${comb('big', r.demo)}</div><p>${got} de ${D.combs.length} favos.</p></div>`,
      `<div class="re-c">${tag}<small>O que é o ETAL</small><p class="re-long">${D.etal.about}</p><ol class="re-time">${D.etal.editions.map(([y, nm]) => `<li class="${y === '2025' ? 'on' : ''}"><time>${y}</time>${nm}</li>`).join('')}</ol></div>`,
      `<div class="re-c re-end">${mark('mark re-mark')}${tag}<h1>Até o próximo ETAL</h1><p>${r.hours} ${r.hours === 1 ? 'hora' : 'horas'}, ${n} ${n === 1 ? 'atividade' : 'atividades'} e ${got} ${got === 1 ? 'favo' : 'favos'}.</p><div class="re-actions"><button class="btn big re-primary" data-act="retroshare">${ic('share')}Compartilhar</button><button class="btn big re-ghost" data-act="retroclose">Fechar</button></div></div>`,
    ];
  }
  let retro = null;
  const RETRO_MS = 6500;
  function retroShow(i) {
    if (!retro) return;
    retro.i = Math.max(0, Math.min(retro.slides.length - 1, i));
    const root = $('.re-root', ov); if (!root) return;
    root.querySelector('.re-stage').innerHTML = `<article class="re-slide">${retro.slides[retro.i]}</article>`;
    root.querySelectorAll('.re-bars i').forEach((b, k) => { b.className = k < retro.i ? 'done' : k === retro.i ? 'run' : ''; });
    const num = root.querySelector('.re-num');
    if (num) {
      const to = +num.dataset.to; const t0 = performance.now();
      const tick = (n) => { const k = reduce ? 1 : Math.min(1, (n - t0) / 900); num.textContent = `${Math.round(to * (1 - (1 - k) ** 3))}h`; if (k < 1 && num.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    clearTimeout(retro.t);
    if (!reduce && retro.i < retro.slides.length - 1) retro.t = setTimeout(() => retroShow(retro.i + 1), RETRO_MS);
  }
  Overlays.retro = (n) => `<div class="re-root" role="dialog" aria-label="Minha retrospectiva">
      <div class="re-bars">${Array.from({ length: n }, () => '<i></i>').join('')}</div>
      <button class="round re-close" data-act="retroclose" aria-label="Fechar">${ic('x')}</button>
      <div class="re-stage"></div>
      <button class="re-tap prev" data-act="retroprev" aria-label="Anterior"></button><button class="re-tap next" data-act="retronext" aria-label="Próximo"></button>
    </div>`;
  Overlays.retroEmpty = () => `<div class="sheet" role="dialog" aria-label="Retrospectiva"><i class="grab"></i>${illo('mark')}
      <h2>Sua retrospectiva começa na primeira presença</h2><p class="sh-p">Registre presença numa atividade para ela ganhar conteúdo.</p>
      <button class="btn primary big" data-act="retrodemo">Ver com dados de exemplo</button></div>`;
  function retroOpen(demo) {
    const data = retroData(demo);
    if (!data.list.length) { openOverlay(Overlays.retroEmpty(), 'share'); return; }
    retro = { i: 0, slides: retroSlides(data), t: 0, text: `Meu ETAL: ${data.hours} horas em ${data.list.length} atividades e ${demo ? D.combs.length : combEarned().length} favos na colmeia.` };
    openOverlay(Overlays.retro(retro.slides.length), 'retro');
    retroShow(0);
  }

  Screens.profile = () => ({
    html: `<header class="apphead"><h1 class="title">Perfil</h1></header>
      <div class="pad stack">
        <div class="me st" ${st(0)}>${meAv('av lg')}<div><strong>${esc(D.person.name)}</strong><span>${esc(D.person.courseFull)}</span><span>${esc(D.person.year)} · ${esc(D.person.id)}</span>${D.person.source === 'suap' ? `<span class="fromsuap">${ic('check')}Dados do SUAP</span>` : D.person.source === 'visitante' ? `<span class="fromsuap guest">${ic('users')}Conta de visitante</span>` : ''}</div></div>
        <button class="retro-cta st" ${st(1)} data-act="retro">${comb('tiny')}<span><b>Minha retrospectiva</b><small>O que você fez e aprendeu no ETAL</small></span>${ic('chev')}</button>
        <ul class="menu st" ${st(1)}>
          <li data-go="credential">${ic('id')}<span>Minha credencial</span><em>${S.credAt ? 'Ativa' : 'Pendente'}</em>${ic('chev', 'i chev')}</li>
          <li data-act="mine">${ic('list')}<span>Minhas atividades</span><em>${S.saved.size}</em>${ic('chev', 'i chev')}</li>
          <li data-go="materials">${ic('file')}<span>Materiais</span><em>${Object.keys(S.present).reduce((n, k) => n + byId(k).materials.length, 0)}</em>${ic('chev', 'i chev')}</li>
          <li data-go="certificates">${ic('award')}<span>Certificados</span>${ic('chev', 'i chev')}</li>
          <li data-go="network">${ic('contact')}<span>Contatos</span><em>${S.contacts.length}</em>${ic('chev', 'i chev')}</li>
        </ul>
        <ul class="menu st" ${st(2)}>
          <li data-go="org">${ic('building')}<span>Painel da organização</span><em>Equipe</em>${ic('chev', 'i chev')}</li>
          <li data-go="games" class="games-row">${ic('trophy')}<span>Campeonatos</span><em>Qui 27</em>${ic('chev', 'i chev')}</li>
        </ul>
        ${standalone() ? '' : `<button class="install-cta st" ${st(2)} data-act="install">${ic('download')}<span><b>Instalar o ETAL Connect</b><small>Abre como app e funciona sem internet</small></span>${ic('chev')}</button>`}
        <ul class="menu st" ${st(3)}>
          <li data-go="personalizar">${ic('moon')}<span>Personalizar</span><em>${(THEMES[UI.theme] || THEMES.etal).name}</em>${ic('chev', 'i chev')}</li>
        </ul>
        <ul class="menu st" ${st(4)}>
          <li data-go="etal">${ic('info')}<span>O que é o ETAL</span>${ic('chev', 'i chev')}</li>
          <li data-go="sobre">${ic('list')}<span>Sobre este protótipo</span><em>Real e exemplo</em>${ic('chev', 'i chev')}</li>
          <li data-go="nadic">${ic('info')}<span>Sobre o NADIC</span>${ic('chev', 'i chev')}</li>
          <li data-act="link" data-url="${D.ifrnUrl}">${ic('open')}<span>IFRN Pau dos Ferros</span></li>
        </ul>
        <ul class="menu danger st" ${st(5)}><li data-act="logout">${ic('logout')}<span>Sair</span></li></ul>
      </div>`,
  });

  /* ---- painel da organização: números simulados para a demonstração ---- */
  const roomsAll = () => P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => ({ floor: f.level, zone: z.id, name: z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : `Sala ${z.roomNumber}` })));
  function hourBars(rows) {
    const W = 320, H = 132, top = 18, base = 104, max = Math.max(...rows.map((r) => r[1])); const bw = (W - 20) / rows.length; const peak = rows.find((r) => r[1] === max);
    const bars = rows.map(([h, v], i) => {
      const x = 10 + i * bw + 3, w = bw - 6, y = base - ((base - top) * v) / max;
      return `<g class="ob-bar" tabindex="0" aria-label="${h} h: ${v} credenciamentos"><title>${h} h · ${v} credenciamentos</title><rect class="hit" x="${x - 3}" y="${top}" width="${bw}" height="${base - top + 22}"/>
        <path d="M${x} ${base}V${y + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4V${base}Z"/>${peak && h === peak[0] ? `<text class="ob-val" x="${x + w / 2}" y="${y - 6}">${v}</text>` : ''}<text class="ob-x" x="${x + w / 2}" y="${base + 16}">${h}h</text></g>`;
    }).join('');
    return `<svg class="ob-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Credenciamentos por hora hoje: ${rows.map(([h, v]) => `${h} h, ${v}`).join('; ')}"><path class="ob-base" d="M8 ${base + .5}H${W - 8}"/>${bars}</svg>`;
  }
  Screens.org = () => {
    const now = D.sessions.filter((x) => isNow(x) && x.seats);
    const present = (x) => Math.min(x.seats, Math.round(x.taken * 0.86 + 1));
    const inRooms = now.reduce((n, x) => n + present(x), 0);
    const today = D.sessions.filter((x) => x.day === D.now.day && x.floor !== undefined && x.zone && !x.simple);
    const sent = D.notices.filter((n) => n.org).length;
    return {
      html: `${header('Painel da organização')}<div class="pad stack org">
        <p class="org-demo st" ${st(0)}>${ic('info')}<span>Visão da equipe do ETAL. Números simulados para a demonstração; os avisos e trocas de sala valem só neste aparelho.</span></p>
        <a class="org-desk st" ${st(0)} href="admin.html" target="_blank" rel="noopener">${ic('laptop')}<span><b>Painel completo no computador</b><small>Planta ao vivo, participantes e exportação em CSV</small></span>${ic('open')}</a>
        <div class="org-kpis st" ${st(1)}>
          <div><b>${liveCred}</b><small>credenciados</small><em>de ${D.org.inscritos} inscritos</em></div>
          <div><b>${inRooms}</b><small>pessoas em sala</small><em>${now.length} atividades agora</em></div>
          <div><b>${Math.round((liveCred / D.org.inscritos) * 100)}%</b><small>de comparecimento</small><em>até ${skyClock()}</em></div>
          <div><b>${sent}</b><small>avisos enviados</small><em>pela organização hoje</em></div>
        </div>
        <section class="org-card st" ${st(2)}><h2>Credenciamento por hora</h2>${hourBars(D.org.porHora)}</section>
        <section class="org-card st" ${st(3)}><h2>Lotação agora</h2>
          ${now.length ? `<ul class="org-rooms">${now.map((x) => { const n = present(x); const pc = Math.round((n / x.seats) * 100); return `<li data-go="activity" data-id="${x.id}"><span><b>${esc(x.short)}</b><small>${esc(whereOf(x))}</small></span><span class="org-meter ${pc >= 90 ? 'full' : ''}"><i style="width:${pc}%"></i></span><em>${n}/${x.seats}</em></li>`; }).join('')}</ul>` : '<p class="org-none">Nenhuma atividade com vagas acontecendo agora.</p>'}
        </section>
        <form class="org-card st" ${st(4)} data-form="orgnotice"><h2>Enviar aviso</h2>
          <label class="sr" for="ontitle">Título do aviso</label><input id="ontitle" maxlength="70" placeholder="Ex.: Palestra de encerramento às 17:00" required>
          <label class="sr" for="ontext">Texto do aviso</label><textarea id="ontext" rows="2" maxlength="180" placeholder="Detalhes para quem está no evento"></textarea>
          <button class="btn primary" type="submit">${ic('bell')}Enviar para todos</button>
        </form>
        <form class="org-card st" ${st(5)} data-form="orgroom"><h2>Trocar sala</h2>
          <label class="field" for="orx"><span>Atividade</span><select id="orx">${today.map((x) => `<option value="${x.id}">${esc(x.short)} · ${esc(x.room)}</option>`).join('')}</select></label>
          <label class="field" for="ory"><span>Nova sala</span><select id="ory">${roomsAll().map((r) => `<option value="${r.floor}|${r.zone}">${r.name} · ${floorOf(r.floor).label}</option>`).join('')}</select></label>
          <button class="btn soft" type="submit">${ic('route')}Mudar e avisar os inscritos</button>
        </form>
      </div>`,
    };
  };

  /* ---- o que é real e o que é exemplo neste protótipo ---- */
  Screens.sobre = () => {
    const orig = D.sessions.filter((x) => !x.demo).length; const demo = D.sessions.length - orig;
    const C = window.Campus3D; const q = C.quality();
    const row = ([t, d]) => `<li><b>${t}</b><small>${d}</small></li>`;
    return {
      html: `${header('Sobre este protótipo')}<div class="pad stack sobre">
        <p class="desc st" ${st(0)}>O ETAL Connect é uma proposta de app para o ETAL. Parte dele já funciona de verdade; o resto é exemplo, para mostrar como o app seria no evento.</p>
        <section class="sb-card real st" ${st(1)}><h2>${ic('check')}Real</h2><ul>${[
          ['Login pelo SUAP', 'Nome, foto, curso e matrícula vêm da sua conta, pela biblioteca suapy. A senha não é guardada.'],
          ['Mapa do campus', 'Contornos do levantamento no Google Earth; cores, alturas e detalhes conferidos nas fotos do campus.'],
          ['Planta do bloco principal', 'Desenhada a partir das referências da equipe: corredores, escada, rampa, entradas e o auditório.'],
          ['ETAL, NADIC e IFRN', 'Textos e links dos sites oficiais. O do NADIC vem de uma cópia de abril de 2025, porque o site estava fora do ar.'],
          ['Conta de visitante, lembretes e uso sem internet', 'Funcionam de verdade, mas ficam só neste aparelho: não há servidor do evento.'],
          ['Desempenho do mapa', 'Medido no próprio aparelho, que escolhe a versão do 3D.'],
        ].map(row).join('')}</ul></section>
        <section class="sb-card demo st" ${st(2)}><h2>${ic('flash')}Exemplo</h2><ul>${[
          ['Programação', `${orig} atividades seguem o VII ETAL (novembro de 2025). As outras ${demo}, com palestrantes de nomes inventados, são de exemplo.`],
          ['Salas e vagas', 'A distribuição das atividades pelas salas é demonstrativa.'],
          ['Credenciamento, presença, certificados e materiais', 'Simulados. Não há integração com o SUAP nem registro oficial de presença.'],
          ['Campeonatos', 'Chaves, jogadores e horários de exemplo.'],
          ['Avisos, Campus ao vivo e painel da organização', 'Números e mensagens simulados.'],
        ].map(row).join('')}</ul></section>
        <section class="sb-card approx st" ${st(3)}><h2>${ic('pin')}Aproximações</h2><ul>${[
          ['Alturas', 'Bloco principal com 13,8 m, auditório com 9 m e prédio do NADIC com 13,2 m, estimados pelas fotos.'],
          ['Obelisco e riacho do pátio', 'Posição e desenho lidos das fotos.'],
          ['Entorno do campus', 'Ruas e casas ao redor são uma representação simples.'],
        ].map(row).join('')}</ul></section>
        <section class="sb-card dev st" ${st(4)}><h2>${ic('laptop')}Este aparelho</h2><ul>
          ${row(['Uso sem internet', PWA.ready ? 'Pronto: o app abre mesmo sem conexão.' : swAllowed ? 'Preparando a cópia do app.' : 'Indisponível neste endereço: precisa de HTTPS.'])}
          ${row(['Instalado como app', standalone() ? 'Sim' : 'Não'])}
          ${row(['Notificações', { granted: 'Permitidas', denied: 'Bloqueadas', default: 'Ainda não pedidas', unsupported: 'Sem suporte neste navegador' }[notifState()]])}
          ${row(['Mapa', `${TIER_LABEL[q.tier]} · ${q.why}`])}
          ${row(['Versão', PWA.version || 'desenvolvimento'])}
        </ul></section>
      </div>`,
    };
  };

  /* ---- telas novas ---- */
  Screens.speakers = () => ({
    html: `${header('Palestrantes')}<div class="pad stack"><ul class="splist">${speakersList().map((s, i) => `<li class="st" ${st(i)} data-go="speaker" data-id="${s.id}">${spAv(s, true)}<span><b>${s.speakerShort}</b><small>${s.role}</small><em>${s.short} · ${dayOf(s.day).week} ${s.day}, ${s.time}</em></span>${ic('chev', 'i chev')}</li>`).join('')}</ul></div>`,
  });

  Screens.certificates = () => {
    const rows = D.enrolled.map(byId);
    const done = rows.filter((s) => S.present[s.id]);
    const hours = done.reduce((n, s) => n + hoursOf(s), 0);
    const total = rows.reduce((n, s) => n + hoursOf(s), 0);
    return {
      html: `${header('Certificados')}<div class="pad stack">
        <section class="cert-top st" ${st(0)}><span class="ring big" style="--p:${Math.round((hours / total) * 100)}"><b>${hours}h</b></span><div><strong>${hours} de ${total} horas</strong><span>O certificado sai depois do evento, com as presenças registradas.</span></div></section>
        <ul class="certs st" ${st(1)}>${rows.map((s) => `<li class="${S.present[s.id] ? 'done' : ''}" data-go="activity" data-id="${s.id}"><i>${ic(S.present[s.id] ? 'check' : 'clock')}</i><span><b>${s.short}</b><small>${S.present[s.id] ? `Presença às ${S.present[s.id]} · ${hoursOf(s)}h` : `${dayOf(s.day).week} ${s.day}, ${s.time} · ${hoursOf(s)}h`}</small></span></li>`).join('')}</ul>
      </div>`,
    };
  };

  Screens.network = () => ({
    html: `${header('Contatos')}<div class="pad stack">
      ${S.contacts.length ? `<ul class="splist">${S.contacts.map((c, i) => `<li class="st" ${st(i)}><span class="ava lg">${c.initials}</span><span><b>${c.name}</b><small>${c.course}</small><em>${c.interest}</em></span></li>`).join('')}</ul>`
        : `<div class="empty st" ${st(0)}>${illo('people')}<h3>Nenhum contato ainda</h3><p>Leia o QR do crachá de um colega para trocar contatos.</p></div>`}
      <div class="net-actions st" ${st(1)}><button class="btn primary" data-act="scan" data-mode="ler">${ic('qr')}Ler QR de um colega</button><button class="btn soft" data-act="scan" data-mode="meu">Mostrar meu QR</button></div>
    </div>`,
  });

  Screens.credential = () => {
    const ok = !!S.credAt;
    return {
      html: `${header('Credencial')}
      <div class="pad stack cred">
        <section class="passcard st ${ok ? '' : 'pending'}" ${st(0)}>
          <div class="b-top"><span class="b-mark">etal<i></i></span><svg class="pins" viewBox="0 0 60 20" aria-hidden="true"><path d="M8 20V9M30 20V9M52 20V9"/><circle cx="8" cy="5.5" r="3.4"/><circle cx="30" cy="5.5" r="3.4"/><circle cx="52" cy="5.5" r="3.4"/></svg></div>
          <div class="pass-id">${meAv('av xl')}<strong>${esc(D.person.name)}</strong><span>${esc(D.person.courseFull)}</span></div>
          <div class="qrbox">${qr()}${ok ? '' : `<div class="qr-lock">${ic('lock')}</div>`}</div>
          <div class="pass-foot"><span class="state ${ok ? 'ok' : 'pend'}">${ok ? `${ic('check')}Confirmado` : 'Pendente'}</span><span class="mono">${esc(D.person.id)}</span></div>
        </section>
        ${ok ? `<p class="note st" ${st(1)}>Mostre este código quando a organização pedir.</p>`
          : `<button class="btn primary big st" ${st(1)} data-act="scan">${ic('qr')}Ler QR da recepção</button>`}
      </div>`,
    };
  };

  Screens.notices = () => ({
    html: `${header('Avisos')}
      <div class="pad stack"><ul class="notes">${D.notices.map((n, i) => `<li class="st ${n.fresh ? 'fresh' : ''}" ${st(i)}><time>${n.time}</time><h4>${esc(n.title)}${n.org ? '<em class="org-tag">Organização</em>' : ''}</h4><p>${esc(n.text)}</p></li>`).join('')}</ul></div>`,
  });

  Screens.materials = () => {
    const ids = Object.keys(S.present);
    return {
      html: `${header('Materiais')}
      <div class="pad stack">${ids.length ? ids.map((id, k) => {
        const s = byId(id);
        return `<section class="st" ${st(k)}><h2 class="h">${s.short}</h2></section><ul class="mats">${s.materials.map(materialRow).join('')}</ul>`;
      }).join('') : `<div class="empty st" ${st(0)}>${illo('file')}<h3>Nenhum material ainda</h3><p>Os arquivos de cada aula aparecem aqui depois que você registrar presença na sala.</p><button class="btn soft" data-act="scan">${ic('qr')}Ler QR da sala</button></div>`}</div>`,
    };
  };

  /* ---- campeonatos ---- */
  /* Na exportação em arquivo único, as imagens vêm embutidas em ASSET_DATA. */
  const assetUrl = (p) => (window.ASSET_DATA || {})[p] || p;
  /* Banner: se existir assets/banner-mk.jpg ou banner-fifa.jpg, a imagem cobre a arte original. */
  function gameArt(t) { return `${gameBase(t)}<img class="art art-photo" src="${assetUrl(`assets/banner-${t.theme}.jpg`)}" alt="" onerror="this.remove()"><span class="art art-scrim"></span>`; }
  function gameBase(t) { return t.theme === 'mk'
    ? `<svg class="art" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="mkg" cx=".75" cy=".2" r=".9"><stop offset="0" stop-color="#8f2412"/><stop offset=".42" stop-color="#3f0b0c"/><stop offset="1" stop-color="#0c0406"/></radialGradient></defs><rect width="300" height="160" fill="url(#mkg)"/><g fill="none" stroke="#ffb199" stroke-opacity=".28"><path d="M-10 150 210 -10M30 170 250 10M70 190 290 30"/></g></svg>`
    : `<svg class="art" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ffg" x1="0" x2="1"><stop offset="0" stop-color="#1f7a35"/><stop offset="1" stop-color="#2f9b45"/></linearGradient></defs><rect width="300" height="160" fill="url(#ffg)"/><g fill="#ffffff" opacity=".06">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 50}" width="25" height="160"/>`).join('')}</g><g fill="none" stroke="#e9ffe9" stroke-opacity=".55" stroke-width="2"><rect x="12" y="12" width="276" height="136" rx="2"/><path d="M150 12v136"/><circle cx="150" cy="80" r="26"/><rect x="12" y="46" width="34" height="68"/><rect x="254" y="46" width="34" height="68"/></g><circle cx="150" cy="80" r="3" fill="#e9ffe9"/></svg>`; }

  const titleOf = (t, cls = '') => (t.logo ? `<img class="p-logo ${cls}" src="${t.logo}" alt="${t.name}">` : t.hideName ? `<span class="sr">${t.name}</span>` : `<span class="p-name">${t.name}</span>`);

  Screens.games = () => ({
    html: `${header('Campeonatos')}
      <div class="pad stack">${D.tournaments.map((t, i) => `
        <button class="poster ${t.theme} st" ${st(i)} data-go="tournament" data-id="${t.id}">
          ${gameArt(t)}
          <span class="poster-tx">${titleOf(t)}<span class="p-tag">${t.tagline}</span></span>
          <span class="poster-foot"><span>${dayOf(t.day).week} ${t.day} · ${t.time}</span><span class="faces">${t.players.slice(0, 4).map((p) => `<i>${p[2]}</i>`).join('')}<i>+4</i></span></span>
        </button>`).join('')}
      </div>`,
  });

  function bracket(t) {
    const P8 = t.players;
    const pair = (a, b, time, k) => `<div class="match st" ${st(3 + k)}><time>${time}</time>
      <div class="pl"><i>${a[2]}</i><b>${a[0]}</b></div><div class="pl"><i>${b[2]}</i><b>${b[0]}</b></div></div>`;
    const tbd = (label, k) => `<div class="match tbd st" ${st(7 + k)}><time>${label}</time><div class="pl"><i></i><b>A definir</b></div><div class="pl"><i></i><b>A definir</b></div></div>`;
    return `<div class="bracket"><div class="bk-round"><h3>Quartas</h3>${[0, 2, 4, 6].map((n, k) => pair(P8[n], P8[n + 1], t.times[k], k)).join('')}</div>
      <div class="bk-round r2"><h3>Semifinal</h3>${tbd('Semi 1', 0)}${tbd('Semi 2', 1)}</div>
      <div class="bk-round r3"><h3>Final</h3><div class="match final tbd st" ${st(9)}><time>${ic('trophy')}Final</time><div class="pl"><i></i><b>A definir</b></div><div class="pl"><i></i><b>A definir</b></div></div></div></div>`;
  }

  Screens.tournament = ({ id }) => {
    const t = D.tournaments.find((x) => x.id === id);
    const tab = S.tourTab;
    const tabs = [['chave', 'Chave'], ['jogadores', 'Jogadores'], ['regras', 'Regras']];
    const body = tab === 'chave' ? bracket(t)
      : tab === 'jogadores' ? `<ul class="players">${t.players.map((p, i) => `<li class="st" ${st(3 + i)}><i>${p[2]}</i><b>${p[0]}</b><small>${p[1]}</small></li>`).join('')}</ul>`
        : `<dl class="rules st" ${st(3)}><div><dt>Formato</dt><dd>${t.format}</dd></div><div><dt>Local</dt><dd>${t.place}</dd></div><div><dt>Prêmio</dt><dd>${t.prize}</dd></div></dl><p class="desc st" ${st(4)}>${t.rules}</p>`;
    return {
      dark: true,
      html: `<div class="tour ${t.theme}">
        <div class="tour-hero">${gameArt(t)}
          <header class="bar on-dark"><button class="iconbtn" data-act="back" aria-label="Voltar">${ic('back')}</button><span></span><span class="iconbtn ghost"></span></header>
          <div class="tour-title st" ${st(0)}>${titleOf(t)}<span class="tour-meta">${dayOf(t.day).long.split(',')[0]}, ${t.day} nov · ${t.time} · ${t.place}</span></div>
        </div>
        <div class="tour-tabs st" style="--i:1;--k:${tabs.findIndex((x) => x[0] === tab)}"><i class="seg-ind"></i>${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-act="tourtab" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="tour-body">${body}</div>
      </div>`,
    };
  };

  /* ---------------- overlays ---------------- */
  /* Selo de confirmação: hexágono que estoura com favos coloridos. */
  const HX_COLORS = ['#65b32e', '#d6332c', '#f2b230', '#8fdc5c', '#5d86dc'];
  const hxBurst = (n = 14) => `<span class="hx-burst" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="--a:${Math.round((i / n) * 360 + (i % 3) * 9)}deg;--d:${62 + ((i * 37) % 46)}px;--c:${HX_COLORS[i % 5]};--s:${(0.55 + ((i * 13) % 7) / 10).toFixed(2)};--t:${(i % 4) * 40}ms"></i>`).join('')}</span>`;
  const hxBadge = (cls = '', inner = '<path class="hx-ck" d="M-17 1l11 11 23-24"/>') => `<div class="hx-badge ${cls}"><i class="hx-ring"></i><i class="hx-ring r2"></i>${hxBurst()}<svg viewBox="-50 -50 100 100" aria-hidden="true"><path class="hx-bg" d="M0-44 38.100-22V22L0 44-38.100 22V-22Z"/>${inner}</svg></div>`;
  const floorName = (f) => (f ? `${f}º andar` : 'Térreo');
  const SPOTS = {
    recepcao: { name: 'Recepção', sign: 'Credenciamento', where: 'Térreo', icon: 'id', seed: 21 },
    'react-native': { name: 'Lab 204', sign: 'React Native com Expo', where: '2º andar', icon: 'qr', seed: 34 },
    'saude-mental': { name: 'Auditório', sign: 'Saúde mental na era da IA', where: 'Térreo', icon: 'mic', seed: 47 },
    colega: { name: 'Colega', sign: 'Crachá de participante', where: 'Trocar contato', icon: 'contact', seed: 58 },
  };
  const placard = (k) => { const p = SPOTS[k]; return `<div class="placard" data-k="${k}"><header>${mark('mark xs')}<b>${p.name}</b></header><div class="pl-qr">${qr(p.seed, 21)}</div><footer>${p.sign}</footer></div>`; };
  const scanHint = (k) => (k === 'recepcao' && !S.credAt ? 'Comece pelo QR da recepção' : 'Aponte para o QR');
  Overlays.scan = (mode = 'ler') => {
    const spot = S.credAt ? 'react-native' : 'recepcao';
    return `<div class="scanner" data-mode="${mode}">
      <div class="scan-view">
        <div class="scene"><svg class="scene-bg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dfe6"/><stop offset=".62" stop-color="#b9c1ca"/><stop offset=".62" stop-color="#7b8590"/><stop offset="1" stop-color="#59626d"/></linearGradient></defs><rect width="400" height="700" fill="url(#wl)"/><path d="M0 0 150 190V470L0 700Z" fill="#a6afb9"/><path d="M400 0 250 190V470L400 700Z" fill="#98a2ad"/><rect x="150" y="190" width="100" height="280" fill="#eef1f4"/><path d="M12 70 22 80V530L12 590Z M60 130 70 140V490L60 530Z" fill="#3a5a9b"/><path d="M388 70 378 80V530L388 590Z M340 130 330 140V490L340 530Z" fill="#4f6270"/><path d="M165 60h70l-8 40h-54Z M120 0h160l-20 30H140Z" fill="#fff"/></svg></div>
        <div class="placard-wrap">${placard(spot)}</div>
        <div class="scan-mask"></div>
        <div class="frame"><i></i><i></i><i></i><i></i><span class="scanline"></span></div>
        <div class="torch-glow"></div>
        <div class="scan-top">
          <button class="round" data-act="closeov" aria-label="Fechar">${ic('x')}</button>
          <div class="scan-seg" style="--k:${mode === 'meu' ? 1 : 0}"><i></i><button data-act="scanmode" data-v="ler">Ler QR</button><button data-act="scanmode" data-v="meu">Meu QR</button></div>
          <button class="round" data-act="torch" aria-label="Lanterna" aria-pressed="false">${ic('flash')}</button>
        </div>
        <p class="scan-hint" aria-live="polite"><span>${scanHint(spot)}</span></p>
      </div>
      <div class="scan-dock">
        <p>Simular leitura <em>demonstração</em></p>
        <div class="spots">${Object.entries(SPOTS).map(([k, p]) => `<button class="spot ${k === 'recepcao' && !S.credAt ? 'first' : ''}" data-act="simulate" data-q="${k}"><span>${ic(p.icon)}</span><b>${p.name}</b><small>${p.where}</small></button>`).join('')}</div>
      </div>
      <div class="myqr" aria-hidden="${mode !== 'meu'}">
        <div class="myqr-card">${meAv('av xl')}<strong>${esc(D.person.name)}</strong><span>${esc(D.person.course)}</span><div class="qrbox">${qr()}</div><small>Mostre para um colega trocar contato com você.</small></div>
      </div>
    </div>`;
  };

  Overlays.welcome = (c = null) => `<div class="wl">
      <div class="w-top">${hxBadge('big')}
        <p class="w-kick">Credenciamento</p>
        <h1>Participação confirmada</h1>
        <p class="w-sub">Boas-vindas ao ETAL, ${esc(D.person.first)}!</p>
      </div>
      <div class="w-ticket">
        <div class="wt-head">${meAv('av')}<span><b>${esc(D.person.name)}</b><small>${esc(D.person.course || '')}</small></span><span class="wt-ok">${ic('check')}Confirmado</span></div>
        <i class="wt-cut"></i>
        <dl class="wt-facts"><div><dt>Entrada</dt><dd>${S.credAt}</dd><small>Qua, 26 nov</small></div><div><dt>Local</dt><dd>Recepção</dd><small>Térreo</small></div><div><dt>Na agenda</dt><dd>${S.saved.size}</dd><small>atividades</small></div></dl>
        ${c ? combRow(c) : ''}
      </div>
      <div class="w-actions"><button class="btn big w-main" data-act="closeov" data-then="credential">${ic('id')}Ver credencial</button><button class="btn ghost" data-act="closeov">Continuar</button></div>
    </div>`;

  /* Resultado da leitura: um cartão sobe por cima da câmera. */
  function scanSheet(html) {
    const root = $('.scanner', ov); if (!root) return;
    $('.scan-res', root)?.remove();
    const d = document.createElement('div'); d.className = 'scan-res'; d.setAttribute('role', 'status');
    d.innerHTML = `<div class="sr-card"><i class="grab"></i>${html}</div>`;
    root.appendChild(d); root.classList.add('has-res');
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('in')));
  }
  function scanAgain() {
    const root = $('.scanner', ov); if (!root) return;
    const d = $('.scan-res', root); d?.classList.remove('in');
    root.classList.remove('has-res', 'is-locked'); delete root.dataset.busy;
    $('.scan-hint span', ov).textContent = 'Aponte para o QR';
    setTimeout(() => d?.remove(), 400);
  }
  function roomResult(q, { again, first, c }) {
    const s = byId(q);
    return `<div class="sr-hero">${hxBadge(again ? 'muted' : '')}<div><small class="sr-kick">${again ? 'Presença já registrada' : first ? 'Participação e presença confirmadas' : 'Presença registrada'}</small><h2>${esc(s.short)}</h2><p>${esc(s.room)} · ${floorName(s.floor)} · ${again ? `desde ${S.present[q]}` : `às ${S.present[q]}`}</p></div></div>
      <ul class="sr-facts"><li>${ic('file')}<span><b>${s.materials.length} materiais</b><small>liberados agora</small></span></li><li>${ic('clock')}<span><b>${s.time} às ${s.end}</b><small>${esc(s.type)}</small></span></li></ul>
      ${c ? combRow(c) : ''}
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="${q}">Abrir a aula</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
  }
  function peerResult(p, { again, c }) {
    return `<div class="sr-hero"><span class="sr-peer"><b>${esc(p.initials)}</b><i>${ic('check')}</i></span><div><small class="sr-kick">${again ? 'Vocês já são contatos' : 'Contato adicionado'}</small><h2>${esc(p.name)}</h2><p>${esc(p.course)}</p></div></div>
      <div class="sr-tags"><span>${ic('star')}Interesse em ${esc(p.interest)}</span><span>${ic('contact')}Contato trocado agora</span></div>
      ${c ? combRow(c) : ''}
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="colega">Ver meus contatos</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
  }
  function credResult() {
    return `<div class="sr-hero">${hxBadge('muted')}<div><small class="sr-kick">Tudo certo</small><h2>Você já está credenciado</h2><p>Entrada às ${S.credAt} na recepção</p></div></div>
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="credential">Ver credencial</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
  }

  Overlays.share = (id) => {
    const s = byId(id);
    return `<div class="sheet" role="dialog" aria-label="Abrir no computador"><i class="grab"></i>
      <h2>Abrir no computador</h2>
      <p class="sh-p">Digite este endereço no navegador do computador para ver todos os materiais da aula.</p>
      <div class="shortlink"><b>${s.link}</b><button class="btn soft sm" data-act="copy" data-text="https://${s.link}">${ic('copy')}<span>Copiar</span></button></div>
      <div class="share-row"><button data-act="toast" data-msg="Link enviado para o seu e-mail">${ic('laptop')}<span>Por e-mail</span></button><button data-act="toast" data-msg="Compartilhando">${ic('share')}<span>Compartilhar</span></button></div>
    </div>`;
  };

  Overlays.ask = (id) => `<form class="sheet" data-form="ask" data-id="${id}"><i class="grab"></i><h2>Sua pergunta</h2>
      <label class="sr" for="qtext">Escreva a pergunta</label><textarea id="qtext" rows="3" maxlength="180" placeholder="O que você quer perguntar para ${byId(id).speakerShort}?" required></textarea>
      <button class="btn primary big" type="submit">Enviar pergunta</button></form>`;

  /* ---------------- motor de navegação ---------------- */
  const vp = $('#viewport');
  const tabbar = $('#tabbar');
  const ov = $('#overlay');
  const device = $('#device');
  let busy = false;

  /* Botão de voltar do celular: cada navegação entra no histórico do navegador. */
  const navUndo = []; let navSkip = 0; const navQueue = [];
  const navState = (n) => { try { history.pushState({ etal: n }, ''); } catch (_) { /* opcional */ } };
  function navPush(undo, tag) {
    if (navSkip) { navQueue.push([undo, tag]); return; }
    navUndo.push({ undo, tag }); navState(navUndo.length);
  }
  const navTag = () => navUndo[navUndo.length - 1]?.tag;
  /* Fechou pela tela: tira a entrada sem desfazer de novo. */
  function navDrop() {
    if (!navUndo.length) return;
    navUndo.pop(); navSkip += 1;
    try { history.back(); } catch (_) { navSkip -= 1; }
  }
  function navBack() { if (navUndo.length) history.back(); }
  window.addEventListener('popstate', (e) => {
    if (navSkip) {
      navSkip -= 1;
      if (!navSkip) { const q = navQueue.splice(0); q.forEach(([u, t]) => navPush(u, t)); }
      return;
    }
    const target = (e.state && e.state.etal) || 0;
    while (navUndo.length > target) navUndo.pop().undo();
  });
  const snapStacks = () => Object.fromEntries(Object.entries(S.stacks).map(([k, v]) => [k, v.slice()]));
  function snapshot() {
    const cur = vp.querySelector('.page:not(.leaving)');
    return { tab: S.tab, stacks: snapStacks(), scroll: cur ? cur.scrollTop : 0, mapView: S.mapView, mapFloor: S.mapFloor, mapZone: S.mapZone, mapRoute: S.mapRoute, campusPlace: S.campusPlace };
  }
  function restore(sn) {
    const sameTab = sn.tab === S.tab; const before = top();
    Object.assign(S, { tab: sn.tab, stacks: sn.stacks, mapView: sn.mapView, mapFloor: sn.mapFloor, mapZone: sn.mapZone, mapRoute: sn.mapRoute, campusPlace: sn.campusPlace, pending: false, journeying: false, mapSync: true });
    window.Campus3D.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
    window.Campus3D.clearRoute();
    busy = false;
    const after = top();
    if (sameTab && before === after) { rerender(); } else { show(build(after), sameTab ? 'pop' : 'fade'); }
    const cur = vp.querySelector('.page:not(.leaving)'); if (cur) cur.scrollTop = sn.scroll;
  }
  /* Marca o ponto atual: voltar retorna exatamente para cá. */
  function navMark(tag) { const sn = snapshot(); navPush(() => restore(sn), tag); }

  function build(entry) {
    checkCombs();
    const out = Screens[entry.s](entry.p || {});
    const el = document.createElement('section');
    el.className = 'page';
    el.innerHTML = out.html;
    el._mount = out.mount;
    el._dark = !!out.dark;
    el._chrome = out.chrome !== false;
    el._navy = !!out.navy;
    el._sky = !!out.sky;
    return el;
  }
  function setChrome(el) {
    device.classList.toggle('dark-status', el._dark);
    device.classList.toggle('no-chrome', !el._chrome);
    device.classList.toggle('navy-status', el._navy);
    device.classList.toggle('sky-status', el._sky);
    if (!el._sky) device.classList.remove('sky-past');
    renderTabbar();
  }
  function show(el, mode) {
    const old = vp.querySelector('.page:not(.leaving)');
    vp.appendChild(el);
    setChrome(el);
    if (el._mount) el._mount(el);
    if (!old) { el.classList.add('in-fade'); return; }
    if (reduce || mode === 'none') { old.remove(); return; }
    busy = true;
    old.classList.add('leaving', `out-${mode}`);
    el.classList.add(`in-${mode}`);
    const done = () => { old.remove(); el.classList.remove(`in-${mode}`); busy = false; };
    setTimeout(done, mode === 'fade' ? 260 : 420);
  }
  const top = () => S.stacks[S.tab][S.stacks[S.tab].length - 1];
  function push(s, p) { if (busy) return; navMark('screen'); S.stacks[S.tab].push({ s, p }); show(build(top()), 'push'); }
  function rerender() {
    const cur = vp.querySelector('.page:not(.leaving)');
    const sc = cur ? cur.scrollTop : 0;
    const el = build(top());
    el.classList.add('still');
    if (cur) cur.replaceWith(el); else vp.appendChild(el);
    el.scrollTop = sc;
    setChrome(el);
    if (el._mount) el._mount(el);
  }
  function switchTab(t, reset = false) {
    if (busy) return;
    if (t !== S.tab || reset || S.stacks[t].length > 1) navMark('tab');
    if (reset) S.stacks[t] = [S.stacks[t][0]];
    if (t === S.tab && !reset) { if (S.stacks[t].length > 1) { S.stacks[t] = [S.stacks[t][0]]; show(build(top()), 'pop'); } return; }
    S.tab = t;
    show(build(top()), 'fade');
  }
  function renderTabbar() {
    const tabs = [['home', 'home', 'Início'], ['agenda', 'cal', 'Agenda'], null, ['map', 'map', 'Mapa'], ['profile', 'user', 'Perfil']];
    tabbar.innerHTML = tabs.map((t) => t ? `<button class="${S.tab === t[0] ? 'on' : ''}" data-act="tab" data-tab="${t[0]}">${ic(t[1])}<span>${t[2]}</span></button>`
      : `<button class="qrbtn" data-act="scan" aria-label="Ler QR">${ic('qr')}</button>`).join('');
  }

  let ovNav = false;
  function openOverlay(html, kind) {
    if (!ovNav) { ovNav = true; navPush(() => closeOverlay(null, true), 'overlay'); }
    ov.innerHTML = `<div class="ov-backdrop" data-act="closeov"></div><div class="ov-panel ${kind}">${html}</div>`;
    ov.className = 'overlay ' + kind;
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
    device.classList.toggle('ov-dark', kind === 'scan');
    device.classList.toggle('ov-retro', kind === 'retro');
    device.classList.toggle('ov-navy', kind === 'welcome');
    device.classList.toggle('ov-dim', kind === 'share' || kind === 'ask' || kind === 'finder');
  }
  function closeOverlay(then, fromHistory = false) {
    if (ovNav) { ovNav = false; if (!fromHistory) navDrop(); }
    ov.classList.remove('open');
    device.classList.remove('ov-dark', 'ov-light', 'ov-navy', 'ov-dim', 'ov-retro');
    if (retro) { clearTimeout(retro.t); retro = null; }
    setTimeout(() => { ov.innerHTML = ''; ov.className = 'overlay'; if (then) then(); }, reduce ? 0 : 380);
  }

  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  let pushT;
  function notify(title, text, id) {
    const n = $('#notif');
    n.innerHTML = `${mark('mark xs')}<span><b>${esc(title)}</b><small>${esc(text)}</small></span><time>agora</time>`;
    if (id && S.auth) { n.dataset.go = 'activity'; n.dataset.id = id; } else { delete n.dataset.go; delete n.dataset.id; }
    n.classList.add('show');
    buzz(30);
    clearTimeout(pushT);
    pushT = setTimeout(() => n.classList.remove('show'), 4200);
  }
  /* ---------------- lembretes ----------------
     O relógio do evento é o mesmo do "Horário do céu". Dez minutos antes de uma atividade com lembrete,
     o app avisa com a sala, o andar e o tempo a pé calculado pela rota do mapa. Com permissão,
     o aviso também sai como notificação do sistema, que abre a atividade. */
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const remFired = new Set();
  const notifState = () => ('Notification' in window ? Notification.permission : 'unsupported');
  async function askNotify() {
    if (notifState() !== 'default') return notifState();
    try { return await Notification.requestPermission(); } catch (_) { return 'denied'; }
  }
  function walkMin(x) {
    if (x.floor === undefined) return null;
    try { return Math.max(1, Math.round(window.Campus3D.routeInfo(x.floor, x.zone).cost / 75)); } catch (_) { return null; }
  }
  function reminderText(x, test) {
    const left = toMin(x.time) - Math.round(skyHour * 60); const w = walkMin(x);
    const title = test || left > LEAD || left < 0 ? `Começa às ${x.time}: ${x.short}` : left ? `Começa em ${left} min: ${x.short}` : `Começando agora: ${x.short}`;
    return { title, body: [whereOf(x), w ? `${w} min a pé da entrada` : ''].filter(Boolean).join(' · ') };
  }
  async function deliver(x, test) {
    if (!x) return;
    const { title, body } = reminderText(x, test);
    notify(title, body, x.id);
    if (notifState() !== 'granted') return;
    const opts = { body, icon: 'assets/pwa/icon-192.png', badge: 'assets/pwa/icon-192.png', tag: `lembrete-${x.id}`, data: { id: x.id }, vibrate: [60, 40, 60] };
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
    } catch (_) { /* o aviso dentro do app já foi mostrado */ }
  }
  function checkReminders() {
    const now = Math.round(skyHour * 60);
    S.reminders.forEach((id) => {
      const x = byId(id);
      if (!x || x.day !== D.now.day || remFired.has(id)) return;
      if (now >= toMin(x.time) - LEAD && now < toMin(x.time)) { remFired.add(id); deliver(x); }
    });
  }
  function openActivity(id) {
    if (!S.auth || !byId(id)) return;
    if (ov.classList.contains('open')) closeOverlay();
    if (S.tab !== 'home') { S.tab = 'home'; S.stacks.home = [{ s: 'home' }]; show(build(top()), 'fade'); }
    push('activity', { id });
  }

  /* ---------------- app instalável e sem internet ----------------
     O service worker (sw.js) guarda o app no aparelho. Só funciona em HTTPS ou no próprio computador. */
  const PWA = { prompt: null, waiting: null, updating: false, ready: false, version: null };
  const swAllowed = 'serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));
  if (swAllowed) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const watch = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { PWA.waiting = w; offerUpdate(); } });
      if (reg.waiting && navigator.serviceWorker.controller) { PWA.waiting = reg.waiting; offerUpdate(); }
      reg.addEventListener('updatefound', () => watch(reg.installing));
      if (reg.active) { PWA.ready = true; netState(); }
    }).catch(() => { /* sem service worker, o app segue online */ });
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'ready') { PWA.ready = true; PWA.version = e.data.version; if (!prefs.get('etal-offline')) { prefs.set('etal-offline', '1'); toast('Pronto para usar sem internet'); } }
      if (e.data?.type === 'open') openActivity(e.data.id);
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (PWA.updating) location.reload(); });
  }
  function offerUpdate() {
    const b = $('#upd'); if (!b) return;
    b.innerHTML = `<span><b>Nova versão do app</b><small>As mudanças entram ao atualizar.</small></span><button data-act="update">Atualizar</button>`;
    b.classList.add('show');
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); PWA.prompt = e; if (S.auth && S.tab === 'profile') rerender(); });
  window.addEventListener('appinstalled', () => { PWA.prompt = null; toast('ETAL Connect instalado'); });
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  async function installApp() {
    if (PWA.prompt) { PWA.prompt.prompt(); const r = await PWA.prompt.userChoice.catch(() => null); PWA.prompt = null; if (r?.outcome !== 'accepted') toast('Instalação cancelada'); rerender(); return; }
    if (isIOS()) { notify('Instalar no iPhone', 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'); return; }
    notify('Instalar o app', swAllowed ? 'Abra o menu do navegador e toque em "Instalar app".' : 'A instalação precisa de HTTPS. Pelo Wi-Fi local, o app abre só no navegador.');
  }
  /* Sem internet: o app avisa e segue com a cópia guardada. */
  function netState() {
    const bar = $('#netbar'); if (!bar) return;
    if (navigator.onLine) { if (bar.classList.contains('show')) { bar.textContent = 'Conexão de volta'; bar.classList.add('ok'); setTimeout(() => bar.classList.remove('show', 'ok'), 1600); } return; }
    bar.classList.remove('ok'); bar.textContent = PWA.ready ? 'Sem internet · usando a cópia salva no aparelho' : 'Sem internet'; bar.classList.add('show');
  }
  window.addEventListener('online', netState); window.addEventListener('offline', netState);

  function setTheme(v) { UI.mode = v === 'dark' ? 'escuro' : 'claro'; applyUI(); }
  function applyProfile(p) { Object.assign(D.person, p); }
  /* Troca entre IFRN e visitante sem refazer o crachá. */
  function lgSwap(mode) {
    S.lgMode = mode;
    const lg = $('.login'); if (!lg) return;
    lg.classList.toggle('guest-mode', mode === 'guest');
    lg.querySelectorAll('[data-act="lgmode"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === (mode || 'suap'))));
    const box = $('.lx-form', lg); box.innerHTML = mode === 'guest' ? guestFields() : suapFields(); box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
    $('[data-live="name"]', lg).textContent = 'Seu nome'; $('[data-live="sub"]', lg).textContent = mode === 'guest' ? 'Visitante' : 'Matrícula do SUAP';
    lg.querySelectorAll('.typed').forEach((n) => n.classList.remove('typed'));
    lgPhys?.kick(0, 0, 0.5, 900);
  }
  function navReset() { const n = navUndo.length; navUndo.length = 0; if (n) { navSkip += 1; history.go(-n); } }
  function enterApp() { S.auth = true; S.tab = 'home'; show(build(top()), 'fade'); }

  /* ---------------- campus ---------------- */
  let mapCanvas = null;
  /* O mesmo canvas é reaproveitado entre as telas, para não recriar memória de vídeo. */
  function useMapCanvas(page) {
    const ph = $('canvas.campus3d', page); if (!ph) return null;
    if (!mapCanvas) mapCanvas = ph; else { mapCanvas.setAttribute('aria-label', ph.getAttribute('aria-label')); ph.replaceWith(mapCanvas); }
    return mapCanvas;
  }
  function runJourney() {
    const C = window.Campus3D; const [lvl, zone] = [S.mapFloor, S.mapZone];
    S.journeying = true;
    C.journey(lvl, zone, { via: S.mapVia }).then(() => {
      if (!S.journeying || S.mapFloor !== lvl || S.mapZone !== zone) return;
      S.journeying = false;
      rerender();
      C.reframe(lvl, zone);
    });
  }
  function mountCampus(page) {
    const cv = useMapCanvas(page);
    if (!cv) return;
    const C = window.Campus3D;
    startHud(page);
    C.attach(cv, {
      onQuality: (t) => { rerender(); if (t === 'simples') toast('Mapa em 2D para ficar mais fluido'); },
      top: $('.map-top', page).offsetHeight + 6,
      bottom: $('.sheet-card', page).offsetHeight - 10,
      skipGrow: S.pending,
      onPick: (id) => {
        if (id === S.campusPlace) return;
        if (id) navMark('place');
        S.campusPlace = id;
        C.select(id);
        rerender();
        if (id) C.focus(id);
      },
      onFloor: (l) => { navMark('floor'); S.mapFloor = l; S.mapZone = null; S.mapRoute = false; rerender(); C.goFloor(l); },
      onRoom: (l, id) => { if (id) navMark('room'); S.mapZone = id; S.mapRoute = false; rerender(); C.room(l, id); },
    });
    if (S.mapView !== 'bloco') {
      const changed = C.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
      const sync = S.mapSync; S.mapSync = false;
      if (C.inStack()) C.toCampus(); else if (changed || (sync && !S.campusPlace)) C.fitAll();
      C.select(S.campusPlace);
      if (sync && S.campusPlace) C.focus(S.campusPlace);
      return;
    }
    if (S.mapSync) {
      S.mapSync = false;
      if (S.mapFloor === null) C.openStack(); else if (S.mapZone) C.room(S.mapFloor, S.mapZone); else C.goFloor(S.mapFloor);
    } else if (S.pending) {
      S.pending = false;
      runJourney();
    } else if (!C.inStack()) {
      if (S.mapFloor === null && (C.isFlat() || !C.canUse3D())) { S.mapFloor = 0; rerender(); return; }
      if (S.mapFloor === null) C.openStack(); else C.goFloor(S.mapFloor);
    }
  }

  /* ---------------- busca ---------------- */
  const fold = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function finderItems(q) {
    const items = [];
    D.sessions.filter((x) => x.floor !== undefined).forEach((x) => items.push({ t: x.short, d: whereOf(x), k: `${x.title} ${x.speaker || ''} ${x.room}`, a: `data-k="room" data-floor="${x.floor}" data-zone="${x.zone}"`, i: 'cal', me: D.enrolled.includes(x.id) }));
    P.floors.forEach((f) => f.zones.filter((z) => !['courtyard', 'water'].includes(z.kind)).forEach((z) => items.push({ t: zoneName(z), d: f.label, k: `${zoneName(z)} ${z.useLabel} ${z.roomNumber}`, a: `data-k="room" data-floor="${f.level}" data-zone="${z.id}"`, i: 'pin' })));
    D.placeOrder.forEach((id) => items.push({ t: D.places[id].name, d: D.places[id].kind, k: D.places[id].name, a: `data-k="place" data-id="${id}"`, i: 'building', place: true }));
    const n = fold(q.trim());
    const list = n ? items.filter((x) => fold(x.k).includes(n)) : items.filter((x) => x.me || x.place);
    return list.slice(0, 7);
  }
  const finderList = (q) => {
    const list = finderItems(q);
    return list.length ? list.map((x) => `<li data-act="findergo" ${x.a}><span>${ic(x.i)}</span><div><b>${x.t}</b><small>${x.d}</small></div></li>`).join('') : '<li class="none">Nada encontrado. Tente o número da sala ou o nome da atividade.</li>';
  };
  Overlays.finder = () => `<div class="sheet finder" role="dialog" aria-label="Buscar"><i class="grab"></i>
      <label class="finder-in" for="fq">${ic('search')}<input id="fq" placeholder="Sala, atividade ou prédio" autocomplete="off"></label>
      <ul class="finder-res" id="fres">${finderList('')}</ul></div>`;
  document.addEventListener('input', (e) => { if (e.target.id === 'accentpick') { UI.accent = e.target.value; uiSave(); applyUI(); } });
  document.addEventListener('change', (e) => { if (e.target.id === 'accentpick') rerender(); });
  document.addEventListener('input', (e) => { if (e.target.id === 'fq') $('#fres').innerHTML = finderList(e.target.value); });

  /* ---------------- ações ---------------- */
  function scanResult(q) {
    const root = $('.scanner', ov);
    if (!root || root.dataset.busy) return;
    root.dataset.busy = '1';
    root.dataset.mode = 'ler';
    $('.scan-seg', ov).style.setProperty('--k', 0);
    const hint = $('.scan-hint span', ov);
    const wrap = $('.placard-wrap', ov);
    /* 1. a câmera move até o QR; 2. a linha lê; 3. os cantos travam e o aparelho vibra. */
    if (wrap.firstElementChild.dataset.k !== q) {
      wrap.classList.add('moving');
      setTimeout(() => { wrap.innerHTML = placard(q); wrap.classList.remove('moving'); }, reduce ? 0 : 240);
    }
    hint.textContent = 'Lendo…';
    root.classList.add('reading');
    setTimeout(() => {
      root.classList.remove('reading');
      root.classList.add('is-locked');
      buzz([18, 40, 18]);
      hint.innerHTML = `${ic('check')}${SPOTS[q].name} reconhecido`;
    }, reduce ? 20 : 950);
    setTimeout(() => {
      if (q === 'colega') {
        const peer = D.peers[S.contacts.length % D.peers.length];
        const again = S.contacts.includes(peer);
        if (!again) S.contacts.unshift(peer);
        const c = takeNewComb();
        scanSheet(peerResult(peer, { again, c }));
        return;
      }
      if (q === 'recepcao') {
        if (S.credAt) { scanSheet(credResult()); return; }
        S.credAt = D.now.time;
        const c = takeNewComb();
        rerender();
        openOverlay(Overlays.welcome(c), 'welcome');
        return;
      }
      const first = !S.credAt;
      if (first) S.credAt = D.now.time;
      const again = !!S.present[q];
      if (!again) S.present[q] = D.now.time;
      const c = takeNewComb();
      rerender();
      scanSheet(roomResult(q, { again, first, c }));
    }, reduce ? 60 : 1500);
  }
  /* Saída do cartão de resultado para a tela certa. */
  function scanOpen(q) {
    closeOverlay(() => {
      if (q === 'colega') { if (top().s === 'network') rerender(); else push('network'); return; }
      if (q === 'credential') { push('credential'); return; }
      if (S.tab !== 'home' && S.tab !== 'agenda') { S.tab = 'home'; S.stacks.home = [{ s: 'home' }]; show(build(top()), 'none'); }
      const t = top();
      if (t.s === 'activity' && t.p && t.p.id === q) rerender(); else push('activity', { id: q });
    });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act],[data-go]');
    if (!el || !device.contains(el)) return;
    if (el.closest('form') && el.type === 'submit') return;
    const a = el.dataset.act;
    if (el.dataset.go && !a) { e.stopPropagation(); push(el.dataset.go, el.dataset.id ? { id: el.dataset.id } : undefined); return; }
    e.stopPropagation();
    switch (a) {
      case 'back':
        /* A seta da tela sobe um nível; o botão do celular segue a ordem em que as telas foram abertas. */
        if (navTag() === 'screen' || S.stacks[S.tab].length < 2) navBack();
        else if (!busy) { navMark('tab'); S.stacks[S.tab].pop(); show(build(top()), 'pop'); }
        break;
      case 'tab': switchTab(el.dataset.tab); break;
      case 'retro': retroOpen(false); break;
      case 'retrodemo': closeOverlay(() => retroOpen(true)); break;
      case 'retroprev': retroShow(retro.i - 1); break;
      case 'retronext': retroShow(retro.i + 1); break;
      case 'retroclose': closeOverlay(); break;
      case 'retroshare': {
        const text = retro.text; const done = () => toast('Texto copiado para compartilhar');
        if (navigator.share) { navigator.share({ title: 'Meu ETAL', text }).catch(() => {}); break; }
        try { navigator.clipboard.writeText(text).then(done, done); } catch (_) { done(); }
        break;
      }
      case 'link': window.open(el.dataset.url, '_blank', 'noopener'); break;
      case 'nadicmap': S.mapView = 'campus'; S.campusPlace = 'predio-nadic'; window.Campus3D.setMode('campus'); window.Campus3D.select('predio-nadic'); switchTab('map', true); setTimeout(() => window.Campus3D.focus('predio-nadic'), reduce ? 0 : 500); break;
      case 'ui': UI[el.dataset.k] = el.dataset.v; uiSave(); applyUI(); if (el.dataset.k === 'view') window.Campus3D.setFlat(el.dataset.v === '2d'); rerender(); break;
      case 'theme': UI.theme = el.dataset.v; UI.accent = null; uiSave(); applyUI(); rerender(); break;
      case 'accent': UI.accent = el.dataset.v; uiSave(); applyUI(); rerender(); break;
      case 'uifps': UI.fps = !UI.fps; uiSave(); rerender(); break;
      case 'perfrun': perfRun(); break;
      case 'perfuse': window.Campus3D.setQuality(el.dataset.v); rerender(); toast(`Em uso: ${TIER_LABEL[el.dataset.v]}`); break;
      case 'hudcycle': {
        const list = window.Campus3D.tiers(); const cur = window.Campus3D.quality().tier; const next = list[(list.indexOf(cur) + 1) % list.length];
        window.Campus3D.setQuality(next); rerender(); toast(TIER_LABEL[next]);
        break;
      }
      case 'uisky': UI.sky = !UI.sky; uiSave(); rerender(); break;
      case 'uihome': UI.home[el.dataset.k] = !UI.home[el.dataset.k]; uiSave(); rerender(); break;
      case 'quality': window.Campus3D.setQuality(el.dataset.v); rerender(); break;
      case 'uireset': UI = JSON.parse(JSON.stringify(UI_DEFAULT)); uiSave(); applyUI(); window.Campus3D.setQuality('auto'); window.Campus3D.setFlat(false); rerender(); toast('Padrão restaurado'); break;
      case 'skycycle': {
        const seq = [6.5, 14 + 2 / 60, 18, 20.5];
        const n = seq.find((v) => v > skyHour + 0.1);
        skyTo(n === undefined ? seq[0] : n);
        break;
      }
      case 'scan': openOverlay(Overlays.scan(el.dataset.mode || 'ler'), 'scan'); break;
      case 'scanmode': { const r = $('.scanner', ov); if (r.dataset.busy) break; r.dataset.mode = el.dataset.v; $('.scan-seg', ov).style.setProperty('--k', el.dataset.v === 'meu' ? 1 : 0); break; }
      case 'torch': { const r = $('.scanner', ov); const on = r.classList.toggle('torch'); el.setAttribute('aria-pressed', on); break; }
      case 'flip': el.classList.toggle('flipped'); el.classList.remove('hint'); S.flipSeen = true; buzz(8); break;
      case 'demo': Object.assign(D.person, DEMO_PERSON); lgFilled({ ...DEMO_PERSON }); break;
      case 'remind': {
        const id = el.dataset.id; const on = !S.reminders.has(id); const x = byId(id);
        if (on) S.reminders.add(id); else { S.reminders.delete(id); remFired.delete(id); }
        prefs.set(REM_KEY, JSON.stringify([...S.reminders]));
        if (on) askNotify().then(() => { rerender(); toast(`Lembrete às ${hhmm(toMin(x.time) - LEAD)} de ${dayOf(x.day).week.toLowerCase()}, ${x.day}`); checkReminders(); });
        else { rerender(); toast('Lembrete desligado'); }
        break;
      }
      case 'remindtest': deliver(byId(el.dataset.id), true); break;
      case 'install': installApp(); break;
      case 'update': if (PWA.waiting) { PWA.updating = true; PWA.waiting.postMessage({ type: 'skip' }); } else location.reload(); break;
      case 'vote': { const k = el.dataset.q; if (S.votes.has(k)) S.votes.delete(k); else S.votes.add(k); rerender(); break; }
      case 'ask': openOverlay(Overlays.ask(el.dataset.id), 'ask'); setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480); break;
      case 'rate': S.ratings[el.dataset.id] = +el.dataset.n; rerender(); toast('Avaliação enviada'); break;
      case 'closeov': closeOverlay(el.dataset.then ? () => push(el.dataset.then) : null); break;
      case 'simulate': scanResult(el.dataset.q); break;
      case 'scanopen': scanOpen(el.dataset.q); break;
      case 'scanagain': scanAgain(); break;
      case 'day': S.agendaDay = +el.dataset.day; rerender(); vp.querySelector('.page .agenda-list')?.classList.add('swap'); break;
      case 'filter': S.agendaFilter = el.dataset.f; rerender(); vp.querySelector('.page .agenda-list')?.classList.add('swap'); break;
      case 'save': {
        const id = el.dataset.id;
        if (S.saved.has(id)) { S.saved.delete(id); toast('Removida dos salvos'); } else {
          S.saved.add(id);
          const x = byId(id);
          const clash = D.sessions.some((o) => o.id !== id && S.saved.has(o.id) && o.day === x.day && o.time === x.time);
          toast(clash ? 'Salva. Há outra atividade neste horário' : 'Salva na sua agenda');
        }
        rerender(); break;
      }
      case 'mapview': if (S.mapView !== el.dataset.v) { navMark('view'); S.journeying = false; S.mapView = el.dataset.v; if (S.mapView === 'bloco') { S.mapFloor = window.Campus3D.isFlat() ? 0 : null; S.mapZone = null; S.mapRoute = false; } else { S.campusPlace = null; window.Campus3D.clearRoute(); } rerender(); } break;
      case 'dim': {
        const C = window.Campus3D; const f = el.dataset.v === '2d';
        if (f === C.isFlat()) break;
        C.setFlat(f);
        if (f && S.mapView === 'bloco' && S.mapFloor === null) { S.mapFloor = 0; rerender(); C.goFloor(0); } else rerender();
        break;
      }
      case 'place': {
        navMark('place');
        S.campusPlace = el.dataset.id;
        window.Campus3D.select(S.campusPlace);
        rerender();
        window.Campus3D.focus(S.campusPlace);
        break;
      }
      case 'placeclose': if (navTag() === 'place') { navBack(); break; } S.campusPlace = null; window.Campus3D.select(null); window.Campus3D.clearRoute(); rerender(); window.Campus3D.fitAll(); break;
      case 'placeroute': window.Campus3D.route(el.dataset.id); rerender(); break;
      case 'enterbloco': navMark('bloco'); S.mapView = 'bloco'; S.mapFloor = window.Campus3D.isFlat() ? 0 : null; S.mapZone = null; S.mapRoute = false; S.campusPlace = null; window.Campus3D.select(null); window.Campus3D.clearRoute(); rerender(); break;
      case 'cam': {
        const v = el.dataset.v; const C = window.Campus3D;
        if (v === 'in') C.zoom(1.4); else if (v === 'out') C.zoom(0.72); else if (v === 'rot') C.rotate(45); else C.fit();
        break;
      }
      case 'openmap': S.mapView = 'bloco'; S.mapFloor = +el.dataset.floor; S.mapZone = el.dataset.zone; S.mapRoute = true; S.pending = true; S.journeying = true; switchTab('map', true); break;
      case 'openplace': S.mapView = 'evento'; S.campusPlace = el.dataset.id; window.Campus3D.setMode('evento'); window.Campus3D.select(el.dataset.id); switchTab('map', true); setTimeout(() => { window.Campus3D.select(el.dataset.id); window.Campus3D.focus(el.dataset.id); window.Campus3D.route(el.dataset.id); }, reduce ? 0 : 450); break;
      case 'today': S.todayOpen = !S.todayOpen; el.setAttribute('aria-expanded', S.todayOpen); el.closest('.today').classList.toggle('open', S.todayOpen); break;
      case 'floorsel': {
        const v = el.dataset.v; const C = window.Campus3D;
        navMark('floor');
        S.mapZone = null; S.mapRoute = false; S.journeying = false;
        S.mapFloor = v === 'all' ? null : +v;
        rerender();
        if (v === 'all' && C.isFlat()) C.setFlat(false);
        rerender();
        if (v === 'all') C.openStack(); else C.goFloor(+v);
        break;
      }
      case 'zoneclose': if (navTag() === 'room') { navBack(); break; } S.mapZone = null; S.mapRoute = false; rerender(); window.Campus3D.room(S.mapFloor, null); break;
      case 'roomroute': navMark('route'); S.mapRoute = true; S.journeying = true; rerender(); runJourney(); break;
      case 'via': S.mapVia = el.dataset.v; S.mapRoute = true; S.journeying = true; rerender(); runJourney(); break;
      case 'finder': openOverlay(Overlays.finder(), 'finder'); setTimeout(() => $('#fq')?.focus({ preventScroll: true }), 480); break;
      case 'findergo': {
        const d = el.dataset;
        closeOverlay(() => {
          if (d.k === 'place') { S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus'; window.Campus3D.setMode(S.mapView); S.campusPlace = d.id; window.Campus3D.select(d.id); switchTab('map', true); setTimeout(() => window.Campus3D.focus(d.id), reduce ? 0 : 950); return; }
          S.mapView = 'bloco'; S.mapFloor = +d.floor; S.mapZone = d.zone; S.mapRoute = true; S.pending = true; S.journeying = true; switchTab('map', true);
        });
        break;
      }
      case 'tourtab': S.tourTab = el.dataset.k; rerender(); break;
      case 'mine': S.agendaFilter = 'saved'; switchTab('agenda', true); break;
      case 'share': openOverlay(Overlays.share(el.dataset.id), 'share'); break;
      case 'copy': {
        const txt = el.dataset.text;
        const ok = () => { el.querySelector('span').textContent = 'Copiado'; el.classList.add('done'); };
        try { navigator.clipboard.writeText(txt).then(ok, ok); } catch (_) { ok(); }
        break;
      }
      case 'toast': toast(el.dataset.msg); break;
      case 'lgmode': if ((el.dataset.v === 'guest') !== (S.lgMode === 'guest')) lgSwap(el.dataset.v === 'guest' ? 'guest' : null); break;
      case 'lgenter': lgOpenApp(); break;
      case 'lgredo': { lgPhys?.disarm?.(); lgPending = null; Object.keys(D.person).forEach((k) => delete D.person[k]); Object.assign(D.person, DEMO_PERSON); store.del(SAVE_KEY); $('.login')?.classList.remove('filled'); lgSwap(S.lgMode); lgPhys?.kick(0, 0, -1.1, 1200); break; }
      case 'guestresume': { const g = guestSaved(); if (g) { Object.keys(D.person).forEach((k) => delete D.person[k]); applyProfile(g); store.set(SAVE_KEY, g); lgFilled(g); } break; }
      case 'togglepwd': { const i = $('#pwd'); i.type = i.type === 'password' ? 'text' : 'password'; break; }
      case 'logout': { const n = navUndo.length; navUndo.length = 0; if (n) { navSkip += 1; history.go(-n); } } S = fresh(); store.del(SAVE_KEY); Object.keys(D.person).forEach((k) => delete D.person[k]); Object.assign(D.person, DEMO_PERSON); vp.innerHTML = ''; show(build({ s: 'login' }), 'fade'); break;
      default: break;
    }
  });

  document.addEventListener('submit', async (e) => {
    const ask = e.target.closest('[data-form="ask"]');
    if (ask) {
      e.preventDefault();
      const text = $('#qtext').value.trim();
      if (!text) return;
      const id = ask.dataset.id;
      (S.asked[id] ||= []).unshift({ id: `m${Date.now()}`, who: 'Você', text, votes: 0 });
      closeOverlay(() => { rerender(); toast('Pergunta enviada'); });
      return;
    }
    const on = e.target.closest('[data-form="orgnotice"]');
    if (on) {
      e.preventDefault();
      const title = $('#ontitle').value.trim(); const text = $('#ontext').value.trim();
      if (!title) { $('#ontitle').focus(); return; }
      D.notices.unshift({ time: skyClock(), title, text: text || 'Aviso da organização do ETAL.', fresh: true, org: true });
      const nid = `n${Date.now()}`; orgSeen.add(nid); orgWrite((o) => o.notices.unshift({ id: nid, time: skyClock(), title, text: text || 'Aviso da organização do ETAL.' }));
      rerender(); notify(title, text || 'Aviso da organização do ETAL.'); toast('Aviso enviado para todos');
      return;
    }
    const orf = e.target.closest('[data-form="orgroom"]');
    if (orf) {
      e.preventDefault();
      const x = byId($('#orx').value); const [fl, zone] = $('#ory').value.split('|'); const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
      if (!x || !r) return;
      if (x.zone === r.zone && x.floor === r.floor) { toast('A atividade já está nessa sala'); return; }
      const from = x.room;
      Object.assign(x, { floor: r.floor, zone: r.zone, room: r.name });
      const msg = `${x.short}: agora em ${r.name}, ${floorOf(r.floor).label}`;
      D.notices.unshift({ time: skyClock(), title: 'Mudança de sala', text: `${msg}. Antes era ${from}.`, fresh: true, org: true });
      const nid = `n${Date.now()}`; orgSeen.add(nid);
      orgWrite((o) => { o.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name }; o.notices.unshift({ id: nid, time: skyClock(), title: 'Mudança de sala', text: `${msg}. Antes era ${from}.`, to: `inscritos em ${x.short}` }); });
      rerender(); notify('Mudança de sala', msg, x.id); toast('Sala trocada e inscritos avisados');
      return;
    }
    const gf = e.target.closest('[data-form="guest"]');
    if (gf) {
      e.preventDefault();
      const err = $('#lgerr'); const say = (m, el) => { err.textContent = m; err.hidden = false; el?.focus(); lgShake(); };
      const v = { name: $('#gname').value.trim(), email: $('#gmail').value.trim(), kind: (gf.querySelector('[name=gkind]:checked') || {}).value, inst: $('#ginst').value.trim(), city: $('#gcity').value.trim() };
      err.hidden = true;
      if (v.name.split(/\s+/).length < 2) return say('Escreva o nome e o sobrenome, como devem sair no crachá.', $('#gname'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return say('Confira o e-mail: é por ele que chega o certificado.', $('#gmail'));
      if (!v.city) return say('Informe a sua cidade.', $('#gcity'));
      if (!$('#gok').checked) return say('Para criar a conta, é preciso concordar com o uso dos dados.', $('#gok'));
      const prof = guestProfile(v);
      Object.keys(D.person).forEach((k) => delete D.person[k]); applyProfile(prof);
      store.set(SAVE_KEY, prof); prefs.set('etal-visitante', JSON.stringify(prof));
      lgFilled(prof);
      return;
    }
    const f = e.target.closest('[data-form="login"]');
    if (!f) return;
    e.preventDefault();
    const btn = $('button[type="submit"]', f);
    const err = $('#lgerr');
    const say = (m) => { err.textContent = m; err.hidden = false; lgShake(); };
    const mat = $('#mat').value.trim();
    const pwd = $('#pwd').value;
    err.hidden = true;
    if (!mat || !pwd) { say('Informe a matrícula e a senha.'); return; }
    btn.classList.add('loading');
    btn.disabled = true;
    const state = $('[data-live="state"]'); if (state) state.textContent = 'Consultando o SUAP…';
    $('.login')?.classList.add('asking');
    try {
      const r = await fetch('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula: mat, senha: pwd }) });
      const j = await r.json().catch(() => { throw new TypeError('sem servidor'); });
      if (!r.ok) { say(j.erro || 'Não foi possível entrar.'); if (r.status >= 500) $('#lgdemo').hidden = false; return; }
      Object.keys(D.person).forEach((k) => delete D.person[k]); applyProfile({ ...DEMO_PERSON, ...j.perfil });
      store.set(SAVE_KEY, j.perfil);
      lgFilled(D.person);
    } catch (_) {
      say(navigator.onLine === false ? 'Sem internet agora. Entre como visitante ou tente de novo quando a conexão voltar.' : 'Não foi possível falar com o servidor local. Abra o protótipo por server.py para usar o SUAP, ou entre como visitante.');
      $('#lgdemo').hidden = false;
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
      $('.login')?.classList.remove('asking');
    }
  });

  $('#skyr')?.addEventListener('input', (e) => { cancelAnimationFrame(skyAnim); skyHour = +e.target.value; applySky(); });
  /* Resposta imediata ao toque em tudo que é clicável. */
  const PRESS = '[data-act],[data-go],a,.btn';
  let pressed = null;
  const unpress = () => { if (pressed) { pressed.classList.remove('is-press'); pressed = null; } };
  device.addEventListener('pointerdown', (e) => { const t = e.target.closest(PRESS); if (t && !t.matches('canvas,.ov-backdrop')) { unpress(); pressed = t; t.classList.add('is-press'); } }, { passive: true });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => device.addEventListener(n, unpress, { passive: true }));
  device.addEventListener('scroll', unpress, { passive: true, capture: true });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flip')) { e.preventDefault(); e.target.click(); }
  });

  /* ---------------- painel no computador (admin.html) ----------------
     Avisos e trocas de sala feitos no painel ficam em etal-org e chegam aqui, mesmo com o app já aberto. */
  const ORG_KEY = 'etal-org'; const orgSeen = new Set();
  const orgRead = () => { try { return { notices: [], moves: {}, creds: {}, ...JSON.parse(localStorage.getItem(ORG_KEY)) }; } catch (_) { return { notices: [], moves: {}, creds: {} }; } };
  function orgWrite(fn) { const o = orgRead(); fn(o); try { localStorage.setItem(ORG_KEY, JSON.stringify(o)); } catch (_) { /* sem armazenamento */ } }
  function orgSync(first) {
    const o = orgRead();
    Object.entries(o.moves).forEach(([id, m]) => { const x = byId(id); if (x) Object.assign(x, m); });
    const fresh = o.notices.filter((n) => !orgSeen.has(n.id));
    fresh.slice().reverse().forEach((n) => { orgSeen.add(n.id); D.notices.unshift({ time: n.time, title: n.title, text: n.text, fresh: true, org: true }); });
    if (!first && fresh.length) { notify(fresh[0].title, fresh[0].text); buzz([20, 40, 20]); if (S.auth && vp.querySelector('.page')) rerender(); }
  }
  orgSync(true);
  window.addEventListener('storage', (e) => { if (e.key === ORG_KEY) orgSync(false); });

  /* ---------------- início ---------------- */
  setInterval(checkReminders, 30000); netState();
  const openParam = new URLSearchParams(location.search).get('abrir');
  if (openParam) setTimeout(() => openActivity(openParam), 900);
  const clock = $('#clock');
  if (clock) clock.textContent = D.now.time;
  /* Atalhos de demonstração: ?tela=home, agenda, atividade, aula, mapa, credencial, campeonato... */
  const q = new URLSearchParams(location.search).get('tela');
  if (history.state && history.state.etal) { navSkip += 1; history.go(-history.state.etal); }
  const qs = new URLSearchParams(location.search);
  if (qs.get('fps')) UI.fps = true;
  if (qs.get('ceu')) skyHour = +qs.get('ceu');
  if (qs.get('tema')) UI.mode = qs.get('tema') === 'dark' ? 'escuro' : 'claro';
  if (qs.get('paleta')) UI.theme = qs.get('paleta');
  applyUI();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (UI.mode === 'auto') { applyUI(); rerender(); } });
  if (UI.view === '2d') window.Campus3D.setFlat(true);
  if (q === 'login') splashDone = true;
  if (!q) {
    const saved = store.get(SAVE_KEY);
    if (saved) { applyProfile(saved); splashDone = true; S.auth = true; show(build(top()), 'fade'); return; }
    show(build({ s: 'login' }), 'fade');
    return;
  }
  if (q === 'login') { show(build({ s: 'login' }), 'fade'); return; }
  if (q === 'visitante') { splashDone = true; S.lgMode = 'guest'; show(build({ s: 'login' }), 'fade'); return; }
  S.auth = true;
  const ok = () => { S.credAt = D.now.time; };
  const setups = {
    home: () => {}, 'home-ok': ok,
    agenda: () => { S.tab = 'agenda'; },
    atividade: () => { S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } }); },
    aula: () => { ok(); S.present['react-native'] = '14:03'; S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } }); },
    compartilhar: () => { setups.aula(); setTimeout(() => openOverlay(Overlays.share('react-native'), 'share'), 300); },
    mapa: () => { S.tab = 'map'; },
    campus: () => { S.tab = 'map'; S.mapView = 'campus'; },
    bloco: () => { S.tab = 'map'; S.mapView = 'bloco'; },
    nadic: () => { S.stacks.home.push({ s: 'nadic' }); },
    etal: () => { S.stacks.home.push({ s: 'etal' }); },
    agendaVazia: () => { S.tab = 'agenda'; S.agendaDay = 28; S.agendaFilter = 'saved'; S.saved.delete('saude-mental'); },
    perf: () => { S.tab = 'profile'; S.stacks.profile.push({ s: 'perf' }); },
    palestrante: () => { S.stacks.home.push({ s: 'speaker', p: { id: 'react-native' } }); },
    personalizar: () => { S.tab = 'profile'; S.stacks.profile.push({ s: 'personalizar' }); },
    retro: () => { S.tab = 'profile'; setTimeout(() => retroOpen(true), 400); },
    colmeia: () => { ok(); S.present['react-native'] = D.now.time; S.ratings['react-native'] = 5; S.stacks.home.push({ s: 'colmeia' }); },
    'home-favos': () => { ok(); S.present['react-native'] = D.now.time; S.ratings['react-native'] = 5; },
    rota: () => { S.tab = 'map'; S.mapView = 'bloco'; S.mapFloor = 2; S.mapZone = 'labs-norte-2'; S.mapRoute = true; S.pending = true; S.journeying = true; },
    qr: () => { setTimeout(() => openOverlay(Overlays.scan(), 'scan'), 300); },
    meuqr: () => { ok(); setTimeout(() => openOverlay(Overlays.scan('meu'), 'scan'), 300); },
    palestrantes: () => { S.stacks.home.push({ s: 'speakers' }); },
    certificados: () => { ok(); S.present['react-native'] = '14:03'; S.stacks.home.push({ s: 'certificates' }); },
    contatos: () => { S.stacks.home.push({ s: 'network' }); },
    org: () => { ok(); S.tab = 'profile'; S.stacks.profile.push({ s: 'org' }); },
    sobre: () => { S.tab = 'profile'; S.stacks.profile.push({ s: 'sobre' }); },
    materiais: () => { S.stacks.home.push({ s: 'materials' }); },
    boasvindas: () => { ok(); S.newComb = 'cred'; setTimeout(() => openOverlay(Overlays.welcome(D.combs[0]), 'welcome'), 300); },
    favo: () => { ok(); S.present['react-native'] = D.now.time; setTimeout(() => { S.newComb = 'react-native'; combToast(D.combs[1]); }, 900); },
    credencial: () => { ok(); S.tab = 'profile'; S.stacks.profile.push({ s: 'credential' }); },
    avisos: () => { S.stacks.home.push({ s: 'notices' }); },
    perfil: () => { S.tab = 'profile'; },
    campeonatos: () => { S.tab = 'profile'; S.stacks.profile.push({ s: 'games' }); },
    campeonato: () => { S.tab = 'profile'; S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'mk' } }); },
    fifa: () => { S.tab = 'profile'; S.tourTab = 'jogadores'; S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'fifa' } }); },
  };
  (setups[q] || (() => {}))();
  show(build(top()), 'fade');
})();
