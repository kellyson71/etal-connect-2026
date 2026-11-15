/* app/01-personalizacao.js · temas, cores e preferências da interface (etal-ui).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- personalização ---------------- */
const THEMES = {
  etal: { name: 'ETAL', desc: 'Azul do NADIC', accent: '#22386f', hue: null },
  mel: { name: 'Mel', desc: 'Da apicultura', accent: '#8a5300', hue: 38 },
  mandacaru: { name: 'Mandacaru', desc: 'Verde da caatinga', accent: '#22633a', hue: 140 },
  sertao: { name: 'Sertão', desc: 'Terra e telha', accent: '#9c3f1f', hue: 18 },
  entardecer: { name: 'Entardecer', desc: 'Céu do fim de tarde', accent: '#55368f', hue: 265 },
};
const ACCENTS = ['#22386f', '#1f6fb2', '#0f766e', '#2f7d32', '#8a5300', '#b4372f', '#b0307a', '#55368f'];
const UI_DEFAULT = {
  mapa: 'novo',
  theme: 'etal',
  accent: null,
  mode: 'claro',
  badge: 'solido',
  corners: 'suaves',
  font: 'padrao',
  text: 'normal',
  motion: 'completas',
  sky: true,
  mapHour: true,
  layers: { labels: true, shadows: true, trees: true, cars: true },
  view: '3d',
  home: {
    atalhos: true,
    live: true,
    colmeia: true,
    agenda: true,
    palestrantes: true,
    campeonatos: true,
    avisos: true,
  },
};
const HOME_PARTS = [
  ['atalhos', 'Atalhos'],
  ['live', 'Campus ao vivo'],
  ['colmeia', 'Sua colmeia'],
  ['agenda', 'Sua agenda'],
  ['palestrantes', 'Palestrantes'],
];
const uiLoad = () => {
  try {
    const v = JSON.parse(localStorage.getItem('etal-ui'));
    return v
      ? {
          ...UI_DEFAULT,
          ...v,
          home: { ...UI_DEFAULT.home, ...(v.home || {}) },
          layers: { ...UI_DEFAULT.layers, ...(v.layers || {}) },
        }
      : null;
  } catch (_) {
    return null;
  }
};
let UI = uiLoad() || JSON.parse(JSON.stringify(UI_DEFAULT));
const uiSave = () => {
  try {
    localStorage.setItem('etal-ui', JSON.stringify(UI));
  } catch (_) {
    /* opcional */
  }
};
/* Cores: tudo é derivado do destaque, garantindo contraste. */
const toRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) =>
  `#${c
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
const toHSL = ([r, g, b]) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn,
    l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const sat = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, sat, l];
};
const hsl = (h, sat, l) => {
  const a = sat * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return toHex([f(0), f(8), f(4)]);
};
const lumOf = (hex) => {
  const c = toRGB(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lumOf(a), lumOf(b)].sort((u, v) => v - u);
  return (x + 0.05) / (y + 0.05);
};
/* Escurece ou clareia até atingir o contraste pedido. */
const fit = (h, sat, l, against, min, step) => {
  let v = Math.max(0.03, Math.min(0.97, l));
  let out = hsl(h, sat, v);
  while (contrast(out, against) < min && v > 0.02 && v < 0.98) {
    v += step;
    out = hsl(h, sat, v);
  }
  return out;
};
function tokensOf(dark) {
  const t = THEMES[UI.theme] || THEMES.etal;
  const accent = UI.accent || t.accent;
  const [h, sat0] = toHSL(toRGB(accent));
  const sat = Math.max(sat0, 0.28);
  const out = {};
  if (t.hue !== null) {
    const n = t.hue;
    Object.assign(
      out,
      dark
        ? {
            '--bg': hsl(n, 0.34, 0.1),
            '--card': hsl(n, 0.3, 0.16),
            '--ink': hsl(n, 0.4, 0.94),
            '--ink-2': hsl(n, 0.26, 0.82),
            '--muted': hsl(n, 0.2, 0.68),
            '--line': hsl(n, 0.24, 0.24),
            '--line-2': hsl(n, 0.22, 0.34),
            '--tab': hsl(n, 0.3, 0.13),
            '--seg': hsl(n, 0.3, 0.16),
          }
        : {
            '--bg': hsl(n, 0.3, 0.955),
            '--card': '#ffffff',
            '--ink': hsl(n, 0.42, 0.18),
            '--ink-2': hsl(n, 0.24, 0.28),
            '--muted': hsl(n, 0.14, 0.4),
            '--line': hsl(n, 0.24, 0.9),
            '--line-2': hsl(n, 0.22, 0.8),
            '--tab': '#ffffff',
            '--seg': hsl(n, 0.22, 0.9),
          },
    );
  }
  if (UI.accent || t.hue !== null) {
    const bg = out['--bg'] || (dark ? '#0e1932' : '#f4f6fa');
    if (dark) {
      const strong = fit(h, sat, 0.42, '#ffffff', 4.6, -0.01);
      Object.assign(out, {
        '--navy': strong,
        '--navy-2': strong,
        '--brand': strong,
        '--blue': fit(h, sat, 0.72, bg, 4.5, 0.01),
        '--blue-50': hsl(h, Math.min(sat, 0.5), 0.2),
        '--accent-ink': hsl(h, Math.min(sat + 0.2, 0.9), 0.84),
      });
    } else {
      const strong = fit(h, sat, toHSL(toRGB(accent))[2], '#ffffff', 5, -0.01);
      Object.assign(out, {
        '--navy': strong,
        '--navy-2': strong,
        '--brand': strong,
        '--accent-ink': strong,
        '--blue': fit(h, sat, 0.42, bg, 4.5, -0.01),
        '--blue-50': fit(h, Math.min(sat, 0.62), 0.925, strong, 4.6, 0.004),
      });
    }
  }
  return out;
}
let tokenNames = [];
const LOADED_FONTS = new Set();
const FONTS = {
  arredondada: ['Nunito:wght@400;600;700;800', "'Nunito',system-ui,sans-serif"],
  leitura: ['Atkinson+Hyperlegible:wght@400;700', "'Atkinson Hyperlegible',system-ui,sans-serif"],
};
function applyUI(opts = {}) {
  const root = document.documentElement;
  const dark = opts.forceTheme
    ? opts.forceTheme === 'dark'
    : UI.mode === 'escuro' || (UI.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  document.dispatchEvent(new Event('etal:tema')); // o mapa (iframe) acompanha
  root.dataset.badge = UI.badge;
  root.dataset.motion = UI.motion;
  root.style.setProperty('--rk', { retos: 0.3, suaves: 1, redondos: 1.4 }[UI.corners] || 1);
  tokenNames.forEach((k) => root.style.removeProperty(k));
  const tk = tokensOf(dark);
  tokenNames = Object.keys(tk);
  tokenNames.forEach((k) => root.style.setProperty(k, tk[k]));
  const fontInfo = FONTS[UI.font];
  if (fontInfo && !LOADED_FONTS.has(UI.font)) {
    LOADED_FONTS.add(UI.font);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${fontInfo[0]}&display=swap`;
    document.head.appendChild(l);
  }
  if (fontInfo) {
    root.style.setProperty('--ui', fontInfo[1]);
    root.style.setProperty('--display', fontInfo[1]);
  } else {
    root.style.removeProperty('--ui');
    root.style.removeProperty('--display');
  }
  const dv = document.getElementById('device');
  if (dv) {
    dv.classList.toggle('text-lg', UI.text === 'grande');
    dv.classList.toggle('text-xl', UI.text === 'maior');
  }
  reduce = osReduce || UI.motion === 'reduzidas';
  const C = window.Campus3D;
  if (C) {
    C.setReduced?.(reduce);
    C.setAccent?.(tk['--navy'] || '#22386f');
    C.redraw?.();
  }
}
const uiSeg = (key, list) =>
  `<div class="mini-seg wide" role="radiogroup">${list.map(([v, t]) => `<button class="${UI[key] === v ? 'on' : ''}" role="radio" aria-checked="${UI[key] === v}" data-act="ui" data-k="${key}" data-v="${v}">${t}</button>`).join('')}</div>`;
