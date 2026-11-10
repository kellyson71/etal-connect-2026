/* Service worker do ETAL Connect.
   Guarda o app no aparelho para abrir sem internet: a internet do campus costuma cair com o evento cheio.
   - Arquivos do app: responde com a cópia guardada e atualiza em segundo plano.
   - Páginas: tenta a rede por 3 segundos e, sem resposta, usa a cópia.
   - Login (api/): sempre pela rede, nunca guardado.
   A lista e a versão abaixo são geradas por scripts/build-pwa.py. */
/* <gerado> */
const VERSION = '9d216a0070';
const CORE = ["./", "index.html", "manifest.webmanifest", "config.js", "api.js", "vendor/jsQR.js", "app.js", "app.css", "data.js", "plan-data.js", "campus-data.js", "campus-fundo.js", "campus-limpo.js", "campus-entorno.js", "sprites.js", "campus3d.js", "assets/banner-fifa.jpg", "assets/etal-logo.png", "assets/icon.svg", "assets/logo-mk.png", "assets/nadic-logo.svg", "assets/pwa/apple-touch-icon.png", "assets/pwa/icon-192.png", "assets/pwa/icon-512.png", "assets/pwa/maskable-512.png", "assets/sprites/cobble-color-dark.webp", "assets/sprites/cobble-color-light.webp", "assets/sprites/cobble-mono-dark.webp", "assets/sprites/cobble-mono-light.webp", "assets/sprites/houses-color-dark.webp", "assets/sprites/houses-color-light.webp", "assets/sprites/houses-mono-dark.webp", "assets/sprites/houses-mono-light.webp", "assets/sprites/ribs-color-dark.webp", "assets/sprites/ribs-color-light.webp", "assets/sprites/ribs-event-dark.webp", "assets/sprites/ribs-event-light.webp", "assets/sprites/ribs-mono-dark.webp", "assets/sprites/ribs-mono-light.webp", "assets/sprites/roof-color-dark.webp", "assets/sprites/roof-color-light.webp", "assets/sprites/roof-event-blue-dark.webp", "assets/sprites/roof-event-blue-light.webp", "assets/sprites/roof-event-dark.webp", "assets/sprites/roof-event-honey-dark.webp", "assets/sprites/roof-event-honey-light.webp", "assets/sprites/roof-event-light.webp", "assets/sprites/roof-mono-dark.webp", "assets/sprites/roof-mono-light.webp", "assets/sprites/telha-color-dark.webp", "assets/sprites/telha-color-light.webp", "assets/sprites/telha-mono-dark.webp", "assets/sprites/telha-mono-light.webp", "assets/sprites/trees-color-dark.webp", "assets/sprites/trees-color-light.webp", "assets/sprites/trees-mono-dark.webp", "assets/sprites/trees-mono-light.webp", "assets/sprites/wall-color-dark.webp", "assets/sprites/wall-color-light.webp", "assets/sprites/wall-event-blue-dark.webp", "assets/sprites/wall-event-blue-light.webp", "assets/sprites/wall-event-dark.webp", "assets/sprites/wall-event-honey-dark.webp", "assets/sprites/wall-event-honey-light.webp", "assets/sprites/wall-event-light.webp", "assets/sprites/wall-mono-dark.webp", "assets/sprites/wall-mono-light.webp", "assets/suap-logo.svg"];
/* </gerado> */
const SHELL = `etal-app-${VERSION}`;
const RUNTIME = 'etal-extra';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('etal-app-') && k !== SHELL).map((k) => caches.delete(k)));
    await self.clients.claim();
    const all = await self.clients.matchAll({ type: 'window' });
    all.forEach((c) => c.postMessage({ type: 'ready', version: VERSION }));
  })());
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'skip') self.skipWaiting();
  if (e.data?.type === 'notify') self.registration.showNotification(e.data.title, e.data.options || {});
});

const fresh = (req, cacheName) => fetch(req).then((res) => {
  if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(cacheName).then((c) => c.put(req, copy)); }
  return res;
});

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.includes('/api/') || url.pathname.includes('/q/')) return; // API e QR: sempre pela rede
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const net = fresh(req, SHELL).catch(() => null);
      const timeout = new Promise((r) => setTimeout(() => r(null), 3000));
      const res = await Promise.race([net, timeout]);
      return res || (await caches.match('./', { ignoreSearch: true })) || (await caches.match('index.html', { ignoreSearch: true })) || (await net) || Response.error();
    })());
    return;
  }
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: !fonts });
    const net = fresh(req, fonts ? RUNTIME : SHELL).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});

/* Toque na notificação de um lembrete: abre o app na atividade. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const id = e.notification.data?.id;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length) { const c = all[0]; await c.focus(); if (id) c.postMessage({ type: 'open', id }); return; }
    await self.clients.openWindow(id ? `./?abrir=${encodeURIComponent(id)}` : './');
  })());
});
