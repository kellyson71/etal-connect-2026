/* app/02-estado.js · estado do app, armazenamento local e QR de exemplo.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- estado ---------------- */
const fresh = () => ({
  auth: false,
  credAt: null,
  present: {},
  saved: new Set(D.enrolled),
  /* atividades em que a pessoa está inscrita no SUAP (vem do servidor; ficam na agenda e não saem pelo app) */
  inscricoes: new Set(),
  tab: 'home',
  stacks: {
    community: [{ s: 'community' }],
    home: [{ s: 'home' }],
    agenda: [{ s: 'agenda' }],
    map: [{ s: 'map' }],
    profile: [{ s: 'profile' }],
  },
  agendaDay: 26,
  agendaFilter: 'all',
  mapView: 'evento',
  campusPlace: null,
  mapFloor: null,
  mapZone: null,
  mapRoute: false,
  mapVia: null,
  pending: false,
  journeying: false,
  tourTab: 'chave',
  reminders: new Set(remSaved()),
  votes: new Set(),
  ratings: {},
  asked: {},
  contacts: [],
});
let S = fresh();
/* Mapa: na primeira visita, uma entrada de longe que termina no evento; nas próximas, uma aproximação curta
     até a vista, o modo (Evento ou Campus) e o 3D/2D em que a pessoa estava. Guardado em etal-mapa. */
const MAP_KEY = 'etal-mapa';
const mapSaved = (() => {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY)) || null;
  } catch (_) {
    return null;
  }
})();
let mapIntro = mapSaved && mapSaved.seen && !new URLSearchParams(location.search).get('intro') ? 'short' : 'full';
if (mapIntro === 'full') S.mapView = 'campus';
else if (['evento', 'campus'].includes(mapSaved.mode)) S.mapView = mapSaved.mode;
function saveMap() {
  const C = window.Campus3D;
  if (!C || S.mapView === 'bloco' || S.journeying || C.inStack?.()) return;
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify({ seen: true, mode: S.mapView, flat: C.isFlat(), cam: C.getView() }));
  } catch (_) {
    /* opcional */
  }
}
setInterval(() => {
  if (S.tab === 'map' && !mapIntro) saveMap();
}, 2500);
window.addEventListener('pagehide', () => {
  if (S.tab === 'map' && !mapIntro) saveMap();
});

/* ---------------- QR fictício ---------------- */
function qr(seed = 11, n = 25) {
  let x = seed;
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  let d = '';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const inF = (c < 8 && r < 8) || (c > n - 9 && r < 8) || (c < 8 && r > n - 9);
      if (!inF && rnd() < 0.47) d += `M${c} ${r}h1v1h-1z`;
    }
  const f = (a, b) =>
    `<rect x="${a}" y="${b}" width="7" height="7" rx="1.4"/><rect x="${a + 1}" y="${b + 1}" width="5" height="5" rx=".9" fill="#fff"/><rect x="${a + 2}" y="${b + 2}" width="3" height="3" rx=".6"/>`;
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" class="qrcode" shape-rendering="crispEdges" fill="#1f2f57"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}"/>${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</svg>`;
}
