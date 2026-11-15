/* app/25-acoes-mapa.js · ações de mapa.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['nadicmap'] = (el, e, a) => {
  S.mapView = 'campus';
  S.campusPlace = 'predio-nadic';
  window.Campus3D.setMode('campus');
  window.Campus3D.select('predio-nadic');
  switchTab('map', true);
  setTimeout(() => window.Campus3D.focus('predio-nadic'), reduce ? 0 : 500);
};

ACOES['mapview'] = (el, e, a) => {
  if (S.mapView !== el.dataset.v) {
    navMark('view');
    S.journeying = false;
    S.mapView = el.dataset.v;
    if (S.mapView === 'bloco') {
      S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
      S.mapZone = null;
      S.mapRoute = false;
    } else {
      S.campusPlace = null;
      window.Campus3D.clearRoute();
    }
    rerender();
  }
};

ACOES['place'] = (el, e, a) => {
  navMark('place');
  S.campusPlace = el.dataset.id;
  window.Campus3D.select(S.campusPlace);
  rerender();
  window.Campus3D.focus(S.campusPlace);
};

ACOES['placeclose'] = (el, e, a) => {
  if (navTag() === 'place') {
    navBack();
    return;
  }
  S.campusPlace = null;
  window.Campus3D.select(null);
  window.Campus3D.clearRoute();
  rerender();
  window.Campus3D.fitAll();
};

ACOES['placeroute'] = (el, e, a) => {
  window.Campus3D.route(el.dataset.id);
  rerender();
};

ACOES['enterbloco'] = (el, e, a) => {
  navMark('bloco');
  S.mapView = 'bloco';
  S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
  S.mapZone = null;
  S.mapRoute = false;
  S.campusPlace = null;
  window.Campus3D.select(null);
  window.Campus3D.clearRoute();
  rerender();
};

ACOES['cam'] = (el, e, a) => {
  const v = el.dataset.v;
  const C = window.Campus3D;
  if (v === 'in') C.zoom(1.4);
  else if (v === 'out') C.zoom(0.72);
  else if (v === 'rot') C.rotate(45);
  else C.fit();
};

ACOES['mapanovo'] = (el, e, a) => {
  abrirMapaNovo(null, null, () => toast('Você está no mapa leve.'));
};

ACOES['openmap'] = (el, e, a) => {
  const fl = +el.dataset.floor,
    z = el.dataset.zone;
  const legacy = () => {
    S.mapView = 'bloco';
    S.mapFloor = fl;
    S.mapZone = z;
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
    switchTab('map', true);
  };
  if (!abrirMapaNovo(fl, z, legacy)) legacy();
};

ACOES['palco'] = (el, e, a) => {
  palcoEnviar({ mode: el.dataset.mode });
};

ACOES['openplace'] = (el, e, a) => {
  S.mapView = 'evento';
  S.campusPlace = el.dataset.id;
  window.Campus3D.setMode('evento');
  window.Campus3D.select(el.dataset.id);
  switchTab('map', true);
  setTimeout(
    () => {
      window.Campus3D.select(el.dataset.id);
      window.Campus3D.focus(el.dataset.id);
      window.Campus3D.route(el.dataset.id);
    },
    reduce ? 0 : 450,
  );
};

ACOES['floorsel'] = (el, e, a) => {
  const v = el.dataset.v;
  const C = window.Campus3D;
  navMark('floor');
  S.mapZone = null;
  S.mapRoute = false;
  S.journeying = false;
  S.mapFloor = v === 'all' ? null : +v;
  rerender();
  if (v === 'all' && C.isFlat()) C.setFlat(false);
  rerender();
  if (v === 'all') C.openStack();
  else C.goFloor(+v);
};

ACOES['zoneclose'] = (el, e, a) => {
  if (navTag() === 'room') {
    navBack();
    return;
  }
  S.mapZone = null;
  S.mapRoute = false;
  rerender();
  window.Campus3D.room(S.mapFloor, null);
};

ACOES['roomroute'] = (el, e, a) => {
  if (
    abrirMapaNovo(S.mapFloor, S.mapZone, () => {
      S.mapRoute = true;
      S.journeying = true;
      rerender();
      runJourney();
    })
  )
    return;
  navMark('route');
  S.mapRoute = true;
  S.journeying = true;
  rerender();
  runJourney();
};

ACOES['via'] = (el, e, a) => {
  S.mapVia = el.dataset.v;
  S.mapRoute = true;
  S.journeying = true;
  rerender();
  runJourney();
};
