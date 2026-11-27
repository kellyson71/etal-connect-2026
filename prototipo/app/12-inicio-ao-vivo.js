/* app/12-inicio-ao-vivo.js · campus ao vivo e montagem da tela de início.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- campus ao vivo ---- */
let liveI = 0,
  liveTimer = 0,
  liveCred = D.liveBase.credenciados;
function liveMessages() {
  /* sai da programação carregada: um minicurso com vaga e o que está acontecendo agora (com servidor, a do ano) */
  const vaga = D.sessions.find((x) => comInscricao(x) && contagemReal(x) && x.seats > (x.taken || 0) && !acabou(x));
  const agora = D.sessions.find((x) => isNow(x) && !x.simple);
  const mk = D.tournaments[0];
  return [
    /* a contagem de credenciados é do exemplo; com servidor ela não é pública */
    (!API || window.ETAL_CONFIG?.demo) && { i: 'users', t: `${liveCred} pessoas credenciadas`, go: 'notices' },
    vaga && {
      i: 'pin',
      t: `${vaga.room} com ${vaga.seats - (vaga.taken || 0)} vagas: ${vaga.short}`,
      go: 'activity',
      id: vaga.id,
    },
    agora && { i: 'mic', t: `${agora.room}: ${agora.short} em andamento`, go: 'activity', id: agora.id },
    mk &&
      dayOf(mk.day) && {
        i: 'trophy',
        t: `${mk.name} começa ${dayOf(mk.day).week.toLowerCase()}, ${mk.time}`,
        go: 'games',
      },
    D.notices[0] && { i: 'bell', t: D.notices[0].title, go: 'notices' },
  ].filter(Boolean);
}
function mountHome(page) {
  /* o céu anda mais devagar que a página (profundidade) e as seções de baixo entram quando chegam na tela */
  const stateScroll = () => {
    device.classList.toggle('sky-past', page.scrollTop > 104);
    if (!reduce && page.scrollTop < 240) page.style.setProperty('--hp', Math.max(0, page.scrollTop).toFixed(0));
  };
  page.addEventListener('scroll', stateScroll, { passive: true });
  stateScroll();
  const rvs = [...page.querySelectorAll('.rv')];
  if (reduce || !('IntersectionObserver' in window)) rvs.forEach((e) => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { root: page, rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    rvs.forEach((e) => io.observe(e));
  }
  applySky();
  const box = $('.hm-live', page);
  if (!box) return;
  const row = $('.hm-live-msg', page);
  const paint = () => {
    const list = liveMessages();
    const m = list[liveI % list.length];
    row.innerHTML = `${ic(m.i)}<span>${m.t}</span>`;
    box.dataset.go = m.go;
    if (m.id) box.dataset.id = m.id;
    else delete box.dataset.id;
  };
  paint();
  clearInterval(liveTimer);
  if (reduce) return;
  liveTimer = setInterval(() => {
    if (!box.isConnected) {
      clearInterval(liveTimer);
      return;
    }
    row.classList.add('out');
    setTimeout(() => {
      liveI += 1;
      liveCred += 1 + (liveI % 3);
      paint();
      row.classList.remove('out');
      row.classList.add('in');
      setTimeout(() => row.classList.remove('in'), 380);
    }, 240);
  }, 3800);
}

const FLOOR_DESC = [
  'Auditório, administração e recepção',
  'Salas de aula e laboratórios',
  'Laboratórios, professores e coordenação de ADS',
];
/* Controles do mapa na zona do polegar: coluna à direita, logo acima da busca. */
const camCtrl = () =>
  `<div class="map-side">${dimToggle()}<div class="map-ctrl cam-ctrl"><button class="iconbtn" data-act="cam" data-v="in" aria-label="Aproximar">${ic('plus')}</button><button class="iconbtn" data-act="cam" data-v="out" aria-label="Afastar">${ic('minus')}</button>${window.Campus3D.isFlat() ? '' : `<button class="iconbtn" data-act="cam" data-v="rot" aria-label="Girar a vista">${ic('rotate')}</button>`}<button class="iconbtn" data-act="cam" data-v="fit" aria-label="Enquadrar">${ic('expand')}</button><button class="iconbtn" data-act="mapcfg" aria-label="Ajustes do mapa" aria-expanded="false">${ic('sliders')}</button></div>${mapCfg()}</div>`;
/* Ajustes do mapa, para brincar: hora do dia, nomes, sombras, árvores e carros. */
const LAYER_NAMES = [
  ['labels', 'Nomes dos lugares'],
  ['shadows', 'Sombras'],
  ['trees', 'Árvores'],
  ['cars', 'Carros'],
];
const mapCfg = (cls = '') => `<div class="map-cfg ${cls}" role="dialog" aria-label="Ajustes do mapa">
      <label class="mc-hour"><span>Hora</span><input type="range" id="mapsky" min="5" max="22.5" step="0.25" value="${skyHour}"><b id="mapskyo">${skyClock()}</b></label>
      <button data-act="uimaphour" aria-pressed="${UI.mapHour}" class="${UI.mapHour ? 'on' : ''}"><span>Luz do horário</span><i class="switch"></i></button>
      ${LAYER_NAMES.map(([k, t]) => `<button data-act="maplayer" data-k="${k}" aria-pressed="${UI.layers[k]}" class="${UI.layers[k] ? 'on' : ''}"><span>${t}</span><i class="switch"></i></button>`).join('')}
    </div>`;

function routeSteps(lvl, z) {
  const r = window.Campus3D.routeInfo(lvl, z.id, S.mapVia);
  const lead = S.mapVia ? '' : 'Caminho mais rápido: ';
  const label = floorOf(lvl).label;
  const enter = `${lead}${lead ? 'entre' : 'Entre'} pela ${r.entrance}`;
  if (!r.via) return `${enter} e siga pelo corredor até a porta.`;
  /* Rampa em duas pistas de cerca de 22 m: uma volta sobe um andar (3,45 m), perto de 8% de inclinação. */
  const ramp =
    r.via === 'rampa'
      ? ` São ${lvl === 1 ? 'cerca de 45 m de rampa, numa volta' : `cerca de ${lvl * 45} m de rampa, em ${lvl} voltas`}, com inclinação suave, perto de 8%.`
      : '';
  return `${enter}, suba pela ${r.via} ${r.viaWhere} até o ${label} e siga pelo corredor até a porta.${ramp}`;
}

function blocoSheet() {
  const lvl = S.mapFloor;
  if (lvl === null) {
    return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>Bloco principal</strong><small>Toque num andar para entrar</small></div>`;
  }
  const z = S.mapZone ? zoneOf(lvl, S.mapZone) : null;
  if (S.journeying)
    return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>${z ? zoneName(z) : floorOf(lvl).label}</strong><small>${floorOf(lvl).label} · toque no mapa para pular</small></div>`;
  if (!z)
    return `<div class="sheet-card campus-sheet"><i class="grab"></i><div class="sh-top"><div><strong>${floorOf(lvl).label}</strong><small>${FLOOR_DESC[lvl]}</small></div></div><p class="sh-text">Toque numa sala para ver o que acontece nela.</p></div>`;
  const acts = D.sessions.filter((x) => x.floor === lvl && x.zone === z.id);
  const walkable = !['stairs', 'ramp', 'courtyard'].includes(z.kind);
  return `<div class="sheet-card campus-sheet detail"><i class="grab"></i>
      <div class="sh-top">${z.icon && window.Campus3D?.useIcons?.[z.icon] ? `<span class="sh-ic" aria-hidden="true"><svg viewBox="-12 -12 24 24"><path d="${window.Campus3D.useIcons[z.icon]}"/></svg></span>` : ''}<div><strong>${zoneName(z)}</strong><small>${z.name ? `Sala ${z.roomNumber} · ` : z.roomNumber && z.kind !== 'classroom' ? `${z.useLabel} · ` : ''}${floorOf(lvl).label}</small></div><button class="iconbtn sm" data-act="zoneclose" aria-label="Fechar">${ic('x')}</button></div>
      ${z.info ? `<p class="sh-text">${esc(z.info)}</p>` : ''}

      ${acts.length && !S.mapRoute ? `<ul class="sh-acts">${acts.map((x) => `<li data-go="activity" data-id="${x.id}"><span><b>${x.short}</b><small>${dayOf(x.day).week} ${x.day} · ${x.time}</small></span>${ic('chev')}</li>`).join('')}</ul>` : ''}
      ${
        walkable && lvl > 0 && S.mapRoute
          ? (() => {
              const v = S.mapVia || window.Campus3D.routeInfo(lvl, z.id, null).via;
              return `<div class="via" style="--k:${v === 'rampa' ? 1 : 0}"><i></i><button class="${v === 'escada' ? 'on' : ''}" data-act="via" data-v="escada">${ic('stairs')}Escada</button><button class="${v === 'rampa' ? 'on' : ''}" data-act="via" data-v="rampa">${ic('nav')}Rampa</button></div>`;
            })()
          : ''
      }
      ${S.mapRoute && walkable ? `<p class="sh-text steps">${routeSteps(lvl, z)}</p>` : walkable ? `<button class="btn primary" data-act="roomroute">${ic('route')}Como chegar</button>` : ''}
    </div>`;
}
