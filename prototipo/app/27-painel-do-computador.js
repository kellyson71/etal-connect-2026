/* app/27-painel-do-computador.js · mudanças vindas do painel do computador (etal-org).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- painel no computador (admin.html) ----------------
     Avisos e trocas de sala feitos no painel ficam em etal-org e chegam aqui, mesmo com o app já aberto. */
const ORG_KEY = 'etal-org';
const orgSeen = new Set();
const orgRead = () => {
  try {
    return { notices: [], moves: {}, creds: {}, ...JSON.parse(localStorage.getItem(ORG_KEY)) };
  } catch (_) {
    return { notices: [], moves: {}, creds: {} };
  }
};
/* grava o estado de um campeonato no etal-org (o mesmo que o painel do computador usa) */
function torneioSalvar(id, fn) {
  const t = D.tournaments.find((x) => x.id === id);
  const st0 = tourSt(t);
  orgWrite((o) => {
    const T = { open: st0.open, players: st0.players.slice(), res: { ...st0.res }, rules: st0.rules };
    fn(T);
    o.torneios = { ...(o.torneios || {}), [id]: T };
  });
}
function orgWrite(fn) {
  const o = orgRead();
  fn(o);
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(o));
  } catch (_) {
    /* sem armazenamento */
  }
}
/* Números de sala definidos no painel (etal-org.rooms, chave "andar:zona"). Troca na planta, nas atividades e no 3D. */
function applyRoomNumbers(rooms) {
  P.floors.forEach((f) =>
    f.zones.forEach((z) => {
      if (!z.roomNumber) return;
      if (z.num0 === undefined) z.num0 = z.roomNumber;
      const v = (rooms[`${f.level}:${z.id}`] || '').trim();
      const n = v || z.num0;
      z.orgNumber = !!v && v !== z.num0;
      if (n === z.roomNumber) return;
      z.roomNumber = n;
      if (!z.name) z.label = zoneName(z);
      const re = new RegExp(`(data-num="${f.level}:${z.id}"[^>]*>)[^<]*<`, 'g');
      f.svg = f.svg.replace(re, `$1${esc(n)}<`);
      f.svgDark = f.svgDark.replace(re, `$1${esc(n)}<`);
    }),
  );
  D.sessions.forEach((x) => {
    if (x.floor === undefined) return;
    const z = zoneOf(x.floor, x.zone);
    if (z && z.roomNumber) x.room = zoneName(z);
  });
  window.Campus3D?.syncRooms?.();
}
function orgSync(first) {
  const o = orgRead();
  const sig = JSON.stringify(o.atividades || {});
  const mudou = sig !== orgSync.sig;
  orgSync.sig = sig;
  Object.values(o.atividades || {}).forEach((a) => {
    const x = byId(a.id);
    if (x) {
      delete x.floor;
      delete x.zone;
      delete x.prerequisites;
      Object.assign(x, a);
    } else D.sessions.push({ learn: [], materials: [], taken: 0, ...a });
  });
  Object.entries(o.moves).forEach(([id, m]) => {
    const x = byId(id);
    if (x) Object.assign(x, m);
  });
  applyRoomNumbers(o.rooms || {});
  const fresh = o.notices.filter((n) => !orgSeen.has(n.id));
  fresh
    .slice()
    .reverse()
    .forEach((n) => {
      orgSeen.add(n.id);
      D.notices.unshift({ time: n.time, title: n.title, text: n.text, fresh: true, org: true });
    });
  if (!first && fresh.length) {
    notify(fresh[0].title, fresh[0].text);
    buzz([20, 40, 20]);
    if (S.auth && vp.querySelector('.page')) rerender();
  } else if (!first && mudou && S.auth && vp.querySelector('.page')) rerender();
}
orgSync(true);
window.addEventListener('storage', (e) => {
  if (e.key !== ORG_KEY) return;
  orgSync(false);
  if (S.auth && vp.querySelector('.tour, .poster, .duel')) rerender();
});
