/* app/25-acoes-busca.js · ações de busca.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['finder'] = (el, e, a) => {
  S.finderMode = null;
  openOverlay(Overlays.finder(), 'finder');
  kbTrack(true);
  setTimeout(() => $('#fq')?.focus({ preventScroll: true }), 480);
};

ACOES['finderq'] = (el, e, a) => {
  const i = $('#fq');
  if (i) {
    i.value = el.dataset.q;
    S.finderMode = null;
    finderRender();
  }
};

ACOES['finderacts'] = (el, e, a) => {
  const i = $('#fq');
  S.finderMode = S.finderMode === 'acts' ? null : 'acts';
  if (i && S.finderMode) i.value = '';
  finderRender();
  if (S.finderMode) i?.blur();
};

ACOES['findergo'] = (el, e, a) => {
  if (e.target.closest('.fd-route') && el !== e.target.closest('.fd-route')) return;
  const d = { ...el.dataset };
  if (d.k === 'act' && d.route) {
    const x = byId(d.id);
    if (x && x.floor !== undefined && x.floor !== null) Object.assign(d, { k: 'room', floor: x.floor, zone: x.zone });
  }
  closeOverlay(() => {
    if (d.k === 'act') {
      openActivity(d.id);
      return;
    }
    if (d.k === 'place' && d.route) {
      S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
      window.Campus3D.setMode(S.mapView);
      S.campusPlace = d.id;
      window.Campus3D.select(d.id);
      switchTab('map', true);
      setTimeout(
        () => {
          if (window.Campus3D.hasRoute(d.id)) window.Campus3D.route(d.id);
          else window.Campus3D.focus(d.id);
          rerender();
        },
        reduce ? 0 : 700,
      );
      return;
    }
    if (d.k === 'poi') {
      S.mapView = 'campus';
      S.campusPlace = null;
      window.Campus3D.setMode('campus');
      window.Campus3D.select(null);
      switchTab('map', true);
      setTimeout(
        () =>
          d.route && window.Campus3D.hasRoute(d.id) ? window.Campus3D.route(d.id) : window.Campus3D.focusPoi(d.id),
        reduce ? 0 : 700,
      );
      return;
    }
    if (d.k === 'place') {
      S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
      window.Campus3D.setMode(S.mapView);
      S.campusPlace = d.id;
      window.Campus3D.select(d.id);
      switchTab('map', true);
      setTimeout(() => window.Campus3D.focus(d.id), reduce ? 0 : 950);
      return;
    }
    S.mapView = 'bloco';
    S.mapFloor = +d.floor;
    S.mapZone = d.zone;
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
    switchTab('map', true);
  });
};
