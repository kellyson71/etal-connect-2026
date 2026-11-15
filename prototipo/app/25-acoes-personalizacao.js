/* app/25-acoes-personalizacao.js · ações de personalizacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['ui'] = (el, e, a) => {
  UI[el.dataset.k] = el.dataset.v;
  uiSave();
  applyUI();
  if (el.dataset.k === 'view') window.Campus3D.setFlat(el.dataset.v === '2d');
  rerender();
};

ACOES['theme'] = (el, e, a) => {
  UI.theme = el.dataset.v;
  UI.accent = null;
  uiSave();
  applyUI();
  rerender();
};

ACOES['accent'] = (el, e, a) => {
  UI.accent = el.dataset.v;
  uiSave();
  applyUI();
  rerender();
};

ACOES['uifps'] = (el, e, a) => {
  UI.fps = !UI.fps;
  uiSave();
  rerender();
};

ACOES['uimaphour'] = (el, e, a) => {
  UI.mapHour = !UI.mapHour;
  uiSave();
  syncMapHour();
  if (el.closest('.map-cfg')) {
    el.classList.toggle('on', UI.mapHour);
    el.setAttribute('aria-pressed', UI.mapHour);
  } else rerender();
};

ACOES['mapcfg'] = (el, e, a) => {
  const p = el.closest('.map-screen, .page, body').querySelector('.map-cfg');
  const open = !p.classList.contains('open');
  p.classList.toggle('open', open);
  el.setAttribute('aria-expanded', open);
};

ACOES['maplayer'] = (el, e, a) => {
  const k = el.dataset.k;
  UI.layers[k] = !UI.layers[k];
  uiSave();
  window.Campus3D.setLayers(UI.layers);
  el.classList.toggle('on', UI.layers[k]);
  el.setAttribute('aria-pressed', UI.layers[k]);
};

ACOES['perfrun'] = (el, e, a) => {
  perfRun();
};

ACOES['perfuse'] = (el, e, a) => {
  window.Campus3D.setQuality(el.dataset.v);
  rerender();
  toast(`Em uso: ${TIER_LABEL[el.dataset.v]}`);
};

ACOES['hudcycle'] = (el, e, a) => {
  const list = window.Campus3D.tiers();
  const cur = window.Campus3D.quality().tier;
  const next = list[(list.indexOf(cur) + 1) % list.length];
  window.Campus3D.setQuality(next);
  rerender();
  toast(TIER_LABEL[next]);
};

ACOES['uisky'] = (el, e, a) => {
  UI.sky = !UI.sky;
  uiSave();
  rerender();
};

ACOES['uihome'] = (el, e, a) => {
  UI.home[el.dataset.k] = !UI.home[el.dataset.k];
  uiSave();
  rerender();
};

ACOES['quality'] = (el, e, a) => {
  window.Campus3D.setQuality(el.dataset.v);
  rerender();
};

ACOES['uireset'] = (el, e, a) => {
  UI = JSON.parse(JSON.stringify(UI_DEFAULT));
  uiSave();
  applyUI();
  window.Campus3D.setQuality('auto');
  window.Campus3D.setFlat(false);
  rerender();
  toast('Padrão restaurado');
};

ACOES['skycycle'] = (el, e, a) => {
  const seq = [6.5, 14 + 2 / 60, 18, 20.5];
  const n = seq.find((v) => v > skyHour + 0.1);
  skyTo(n === undefined ? seq[0] : n);
};

ACOES['tema'] = (el, e, a) => {
  UI.mode = isDark() ? 'claro' : 'escuro';
  uiSave();
  applyUI();
  rerender();
};

ACOES['dim'] = (el, e, a) => {
  const C = window.Campus3D;
  const f = el.dataset.v === '2d';
  if (f === C.isFlat()) return;
  C.setFlat(f);
  if (f && S.mapView === 'bloco' && S.mapFloor === null) {
    S.mapFloor = 0;
    rerender();
    C.goFloor(0);
  } else rerender();
};
