/* app/22-campus.js · campus: lugares, salas e rotas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- campus ---------------- */
let mapCanvas = null;
/* O mesmo canvas é reaproveitado entre as telas, para não recriar memória de vídeo. */
function useMapCanvas(page) {
  const ph = $('canvas.campus3d', page);
  if (!ph) return null;
  if (!mapCanvas) mapCanvas = ph;
  else {
    mapCanvas.setAttribute('aria-label', ph.getAttribute('aria-label'));
    ph.replaceWith(mapCanvas);
  }
  return mapCanvas;
}
/* Modelo novo em uma superfície isolada: o app conserva atividade, scroll e câmera. */
function abrirMapaNovo(floor, zone, fallback) {
  /* Só com o mapa novo escolhido (padrão); com o clássico, "Como chegar" usa o mapa Canvas. */
  if (UI.view === '2d' || !mapaNovoOn()) return false;
  /* tela grande: a rota vai para o mapa ao lado, sem abrir outra janela por cima do app */
  if (palcoOn()) {
    palcoEnviar({ floor, zone, via: S.mapVia || null });
    toast('Caminho traçado no mapa ao lado');
    return true;
  }
  /* usa o mesmo mapa da aba Mapa (já carregado), com a rota pedida; antes abria outro mapa por cima, montado do zero */
  S.mapFloor = floor;
  S.mapZone = zone;
  S.mapRoute = true;
  switchTab('map', true);
  return true;
}
function runJourney() {
  const C = window.Campus3D;
  const [lvl, zone] = [S.mapFloor, S.mapZone];
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
    onQuality: (t) => {
      rerender();
      if (t === 'simples') toast('Mapa em 2D para ficar mais fluido');
    },
    top: 8,
    bottom: ($('.map-dock', page)?.offsetHeight || 0) + ($('.sheet-card', page)?.offsetHeight || 0),
    skipGrow: S.pending,
    onPick: (id) => {
      if (id === S.campusPlace) return;
      if (id) navMark('place');
      S.campusPlace = id;
      C.select(id);
      rerender();
      if (id) C.focus(id);
    },
    onFloor: (l) => {
      navMark('floor');
      S.mapFloor = l;
      S.mapZone = null;
      S.mapRoute = false;
      rerender();
      C.goFloor(l);
    },
    onRoom: (l, id) => {
      if (id) navMark('room');
      S.mapZone = id;
      S.mapRoute = false;
      rerender();
      C.room(l, id);
    },
  });
  if (S.mapView !== 'bloco' && mapIntro) {
    const kind = mapIntro;
    mapIntro = null;
    C.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
    if (kind === 'short' && mapSaved.cam) C.setView(mapSaved.cam);
    if (kind === 'full') {
      /* A entrada é sempre em 3D: o botão 3D/2D acompanha na hora. */
      const dim = $('.dim', page);
      if (dim) {
        dim.style.setProperty('--k', 0);
        dim.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v !== '2d'));
      }
    }
    C.intro(kind).then(async () => {
      if (kind === 'full' && S.tab === 'map' && S.mapView === 'campus' && !S.campusPlace) {
        /* As abas acompanham a revelação na hora; a folha do evento entra no fim. */
        S.mapView = 'evento';
        const seg = $('.map-dock .seg[style*="--k"]:not(.four)', page) || $('.map-dock .seg', page);
        if (seg) {
          seg.style.setProperty(
            '--k',
            MAP_TABS.findIndex(([v]) => v === 'evento'),
          );
          seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === 'evento'));
        }
        await C.eventReveal();
        if (S.tab === 'map') rerender();
      }
      saveMap();
    });
    return;
  }
  if (S.mapView !== 'bloco') {
    const changed = C.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
    const sync = S.mapSync;
    S.mapSync = false;
    if (C.inStack()) C.toCampus();
    else if (changed || (sync && !S.campusPlace)) C.fitAll();
    C.select(S.campusPlace);
    if (sync && S.campusPlace) C.focus(S.campusPlace);
    return;
  }
  if (S.mapSync) {
    S.mapSync = false;
    if (S.mapFloor === null) C.openStack();
    else if (S.mapZone) C.room(S.mapFloor, S.mapZone);
    else C.goFloor(S.mapFloor);
  } else if (S.pending) {
    S.pending = false;
    runJourney();
  } else if (!C.inStack()) {
    if (S.mapFloor === null && (C.isFlat() || !C.canUse3D())) {
      S.mapFloor = 0;
      rerender();
      return;
    }
    if (S.mapFloor === null) C.openStack();
    else C.goFloor(S.mapFloor);
  }
}
