/* app/19-navegacao.js · navegação: histórico, telas, abas, toasts e notificações.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- motor de navegação ---------------- */
const vp = $('#viewport');
const tabbar = $('#tabbar');
const ov = $('#overlay');
const device = $('#device');
let busy = false;

/* Botão de voltar do celular: cada navegação entra no histórico do navegador. */
const navUndo = [];
let navSkip = 0;
const navQueue = [];
const navState = (n) => {
  try {
    history.pushState({ etal: n }, '');
  } catch (_) {
    /* opcional */
  }
};
function navPush(undo, tag) {
  if (navSkip) {
    navQueue.push([undo, tag]);
    return;
  }
  navUndo.push({ undo, tag });
  navState(navUndo.length);
}
const navTag = () => navUndo[navUndo.length - 1]?.tag;
/* Fechou pela tela: tira a entrada sem desfazer de novo. */
function navDrop() {
  if (!navUndo.length) return;
  navUndo.pop();
  navSkip += 1;
  try {
    history.back();
  } catch (_) {
    navSkip -= 1;
  }
}
function navBack() {
  if (navUndo.length) history.back();
}
window.addEventListener('popstate', (e) => {
  if (navSkip) {
    navSkip -= 1;
    if (!navSkip) {
      const q = navQueue.splice(0);
      q.forEach(([u, t]) => navPush(u, t));
    }
    return;
  }
  const target = (e.state && e.state.etal) || 0;
  while (navUndo.length > target) navUndo.pop().undo();
});
const snapStacks = () => Object.fromEntries(Object.entries(S.stacks).map(([k, v]) => [k, v.slice()]));
function snapshot() {
  const cur = vp.querySelector('.page:not(.leaving)');
  return {
    tab: S.tab,
    stacks: snapStacks(),
    scroll: cur ? cur.scrollTop : 0,
    mapView: S.mapView,
    mapFloor: S.mapFloor,
    mapZone: S.mapZone,
    mapRoute: S.mapRoute,
    campusPlace: S.campusPlace,
  };
}
function restore(sn) {
  const sameTab = sn.tab === S.tab;
  const before = top();
  Object.assign(S, {
    tab: sn.tab,
    stacks: sn.stacks,
    mapView: sn.mapView,
    mapFloor: sn.mapFloor,
    mapZone: sn.mapZone,
    mapRoute: sn.mapRoute,
    campusPlace: sn.campusPlace,
    pending: false,
    journeying: false,
    mapSync: true,
  });
  window.Campus3D.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
  window.Campus3D.clearRoute();
  busy = false;
  const after = top();
  if (sameTab && before === after) {
    rerender();
  } else {
    show(build(after), sameTab ? 'pop' : 'fade');
  }
  const cur = vp.querySelector('.page:not(.leaving)');
  if (cur) cur.scrollTop = sn.scroll;
}
/* Marca o ponto atual: voltar retorna exatamente para cá. */
function navMark(tag) {
  const sn = snapshot();
  navPush(() => restore(sn), tag);
}

function build(entry) {
  checkCombs();
  const out = Screens[entry.s](entry.p || {});
  const el = document.createElement('section');
  el.className = 'page';
  el.innerHTML = out.html;
  el._mount = (page) => {
    mountGalleries(page);
    out.mount?.(page);
  };
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
  mapaFixoVer(el);
}
function show(el, mode) {
  const old = vp.querySelector('.page:not(.leaving)');
  vp.appendChild(el);
  setChrome(el);
  if (el._mount) el._mount(el);
  if (!old) {
    el.classList.add('in-fade');
    return;
  }
  if (reduce || mode === 'none') {
    old.remove();
    return;
  }
  busy = true;
  old.classList.add('leaving', `out-${mode}`);
  el.classList.add(`in-${mode}`);
  const done = () => {
    old.remove();
    el.classList.remove(`in-${mode}`);
    busy = false;
  };
  setTimeout(done, mode === 'fade' ? 260 : 420);
}
const top = () => S.stacks[S.tab][S.stacks[S.tab].length - 1];
function push(s, p) {
  if (busy) return;
  navMark('screen');
  S.stacks[S.tab].push({ s, p });
  show(build(top()), 'push');
}
function rerender() {
  const cur = vp.querySelector('.page:not(.leaving)');
  const sc = cur ? cur.scrollTop : 0;
  const el = build(top());
  el.classList.add('still');
  if (cur) cur.replaceWith(el);
  else vp.appendChild(el);
  el.scrollTop = sc;
  setChrome(el);
  if (el._mount) el._mount(el);
}
/* Entre atividades: se uma atividade sua começa em até 10 minutos, o mapa já abre com a rota até a sala.
     Uma vez por atividade; a primeira visita ao mapa (a entrada completa) tem prioridade. */
const soonSeen = new Set();
function soonRoute() {
  if (mapIntro === 'full') return false;
  const now = Math.round(skyHour * 60);
  const x = D.sessions
    .filter((q) => D.enrolled.includes(q.id) && q.day === D.now.day && q.floor !== undefined && !soonSeen.has(q.id))
    .map((q) => ({ q, left: toMin(q.time) - now }))
    .filter((o) => o.left >= 0 && o.left <= 10)
    .sort((a, b) => a.left - b.left)[0];
  if (!x) return false;
  soonSeen.add(x.q.id);
  const w = walkMin(x.q);
  S.mapView = 'bloco';
  S.mapFloor = x.q.floor;
  S.mapZone = x.q.zone;
  S.mapRoute = true;
  S.pending = true;
  S.journeying = true;
  switchTab('map', true);
  toast(`${x.q.short}: começa ${x.left ? `em ${x.left} min` : 'agora'}${w ? ` · ${w} min a pé` : ''}`);
  return true;
}
function switchTab(t, reset = false) {
  if (busy) return;
  if (t !== S.tab || reset || S.stacks[t].length > 1) navMark('tab');
  if (reset) S.stacks[t] = [S.stacks[t][0]];
  if (t === S.tab && !reset) {
    if (S.stacks[t].length > 1) {
      S.stacks[t] = [S.stacks[t][0]];
      show(build(top()), 'pop');
    }
    return;
  }
  S.tab = t;
  show(build(top()), 'fade');
}
function renderTabbar() {
  const tabs = [
    ['home', 'home', 'Início'],
    ['agenda', 'cal', 'Agenda'],
    null,
    ['map', 'map', 'Mapa'],
    ['community', 'image', 'Publicações'],
  ];
  tabbar.innerHTML = tabs
    .map((t) =>
      t
        ? `<button class="${S.tab === t[0] ? 'on' : ''}" data-act="tab" data-tab="${t[0]}">${ic(t[1])}<span>${t[2]}</span></button>`
        : `<button class="qrbtn" data-act="scan" aria-label="Ler QR">${ic('qr')}</button>`,
    )
    .join('');
}

let ovNav = false;
function openOverlay(html, kind) {
  if (!ovNav) {
    ovNav = true;
    navPush(() => closeOverlay(null, true), 'overlay');
  }
  ov.innerHTML = `<div class="ov-backdrop" data-act="closeov"></div><div class="ov-panel ${kind}">${html}</div>`;
  ov.className = 'overlay ' + kind;
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
  device.classList.toggle('ov-dark', kind === 'scan');
  device.classList.toggle('ov-retro', kind === 'retro');
  device.classList.toggle('ov-navy', kind === 'welcome');
  device.classList.toggle('ov-dim', kind === 'share' || kind === 'ask' || kind === 'finder');
}
function closeOverlay(then, fromHistory = false) {
  camStop();
  kbTrack(false);
  if (ovNav) {
    ovNav = false;
    if (!fromHistory) navDrop();
  }
  ov.classList.remove('open');
  device.classList.remove('ov-dark', 'ov-light', 'ov-navy', 'ov-dim', 'ov-retro');
  if (retro) {
    clearTimeout(retro.t);
    retro = null;
  }
  setTimeout(
    () => {
      ov.innerHTML = '';
      ov.className = 'overlay';
      if (then) then();
    },
    reduce ? 0 : 380,
  );
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
  if (id && S.auth) {
    n.dataset.go = 'activity';
    n.dataset.id = id;
  } else {
    delete n.dataset.go;
    delete n.dataset.id;
  }
  n.classList.add('show');
  buzz(30);
  clearTimeout(pushT);
  pushT = setTimeout(() => n.classList.remove('show'), 4200);
}
