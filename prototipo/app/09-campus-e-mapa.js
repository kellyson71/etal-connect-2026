/* app/09-campus-e-mapa.js · ficha do campus, tela grande do computador e mapa embutido.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
function campusSheet() {
  const id = S.campusPlace;
  if (!id) return '';
  const p = D.places[id];
  /* Sol nas fachadas (cartas solares da dissertação de 2012) e, com a luz do horário ligada, o sol de agora. */
  const sunLine = () => {
    const FAC = { norte: 'do auditório', oeste: 'da frente', leste: 'dos fundos', sul: 'da rampa' };
    const s = window.Campus3D.sunInfo?.(skyHour);
    if (!s || !s.up) return '';
    const lados = Object.keys(s.facades)
      .filter((k) => s.facades[k])
      .map((k) => FAC[k]);
    return lados.length ? `<p class="sh-src">☀ Sol agora no lado ${lados.join(' e no lado ')}.</p>` : '';
  };
  const on = window.Campus3D.routeOn(id);
  return `<div class="sheet-card campus-sheet detail"><i class="grab"></i>
      <div class="sh-top"><div><strong>${p.name}</strong></div><button class="iconbtn sm" data-act="placeclose" aria-label="Fechar">${ic('x')}</button></div>
      <p class="sh-text">${p.text}</p>
      ${p.sun ? sunLine() : ''}
      ${p.projeto ? `<p class="sh-src">${p.projeto}</p>` : ''}
      <div class="sh-btns">
        ${!window.Campus3D.hasRoute(id) ? '' : `<button class="btn ${p.floors || p.link || p.plan ? 'soft' : 'primary'}" data-act="placeroute" data-id="${id}">${ic('route')}${on ? 'Rota no mapa' : 'Como chegar'}</button>`}
        ${p.floors ? `<button class="btn primary" data-act="enterbloco">${ic('building')}Ver os andares</button>` : ''}
        ${p.link ? `<button class="btn primary" data-go="${p.link}">Sobre o NADIC</button>` : ''}
        ${p.plan ? `<button class="btn primary" data-act="openmap" data-floor="${p.plan[0]}" data-zone="${p.plan[1]}">${ic('building')}Ver na planta</button>` : ''}
      </div>
    </div>`;
}

/* Mapa padrão: o novo (mapa3d/, WebGL), embutido na aba Mapa. O mapa anterior do app (campus3d.js, Canvas) continua
     guardado como "Mapa clássico": Perfil → Personalizar → Mapa, ou ?mapa=classico. A exportação em arquivo único
     (index.html da raiz) e a qualidade "2D" usam sempre o clássico. */
const mapaEscolhido = () => {
  const q = new URLSearchParams(location.search).get('mapa');
  return q === 'novo' || q === 'classico' ? q : UI.mapa || 'novo';
};
const mapaNovoOn = () =>
  !window.ASSET_DATA && mapaEscolhido() === 'novo' && window.Campus3D?.quality?.().setting !== 'simples';
/* ---- computador: sem moldura de celular. O app fica numa coluna à esquerda e o mapa ocupa o resto da tela, no modo
     Evento (o passeio virou segredo do mapa). "Ver como celular" volta para a moldura; a escolha fica em etal-moldura. ---- */
const wideMq = matchMedia('(min-width: 1000px) and (pointer: fine)');
let palcoFrame = null,
  palcoPronto = false,
  palcoFila = null;
const dadosMapa = (extra = {}) => ({
  type: 'etal:mapa:abrir',
  ...extra,
  tema: isDark() ? 'escuro' : 'claro',
  proxima: proximaMinha(),
  origem: origemAgora(),
  foto: D.person.photo || null,
  nome: D.person.name || '',
  hour: skyHour,
  reduced: reduce,
  agora: { day: D.now.day, time: D.now.time },
  sessions: D.sessions.map((x) => ({
    id: x.id,
    title: x.title,
    time: x.time,
    end: x.end,
    day: x.day,
    type: x.type,
    room: x.room,
    place: x.place,
    tournament: x.tournament,
    floor: x.floor,
    zone: x.zone,
  })),
  rooms: Object.fromEntries(
    P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => [`${f.level}:${z.id}`, z.roomNumber])),
  ),
});
/* "Ver na programação" no cartão de um lugar do mapa: a Agenda abre só com as atividades dele */
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'etal:mapa:programacao') return;
  const frames = [palcoFrame, mapaFixo?.querySelector('iframe')].filter(Boolean);
  if (!frames.some((f) => f.contentWindow === e.source)) return;
  const ids = Array.isArray(e.data.ids) ? e.data.ids.filter((id) => D.sessions.some((x) => x.id === id)) : [];
  if (!ids.length) return;
  S.agendaLugar = { nome: String(e.data.nome || 'Este lugar').slice(0, 60), ids };
  S.agendaFilter = 'all';
  if (D.days.some((d) => d.day === e.data.dia)) S.agendaDay = e.data.dia;
  switchTab('agenda', true);
});
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'etal:mapa:atividade') return;
  const frames = [palcoFrame, mapaFixo?.querySelector('iframe')].filter(Boolean);
  if (!frames.some((f) => f.contentWindow === e.source)) return;
  const activity = D.sessions.find((x) => x.id === e.data.id);
  if (activity) push(activity.tournament ? 'tournament' : 'activity', { id: activity.tournament || activity.id });
});
const palcoOn = () => document.documentElement.classList.contains('wide');
function palcoEnviar(extra) {
  if (!palcoFrame) return;
  if (!palcoPronto) {
    palcoFila = extra;
    return;
  }
  palcoFrame.contentWindow.postMessage(dadosMapa(extra), location.origin);
  palcoFrame.focus();
}
function telaGrande() {
  const q = new URLSearchParams(location.search);
  const on = wideMq.matches && !q.has('moldura') && localStorage.getItem('etal-moldura') !== '1' && mapaNovoOn();
  document.documentElement.classList.toggle('wide', on);
  const host = $('#palco'),
    bt = $('#moldura-btn');
  if (bt) {
    bt.hidden = !wideMq.matches;
    bt.textContent = on ? 'Ver como celular' : 'Usar a tela toda';
    bt.onclick = () => {
      localStorage.setItem('etal-moldura', on ? '1' : '0');
      location.reload();
    };
  }
  if (!host) return;
  if (on && !palcoFrame) {
    palcoFrame = document.createElement('iframe');
    palcoFrame.title = 'Mapa do campus em tela grande';
    palcoFrame.allow = 'fullscreen';
    palcoFrame.src = `mapa3d/index.html?aba=1&tema=${isDark() ? 'escuro' : 'claro'}`;
    document.addEventListener('etal:tema', () => palcoEnviar({}));
    host.append(palcoFrame);
    host.hidden = false;
  }
  if (!on && palcoFrame) {
    palcoFrame.remove();
    palcoFrame = null;
    palcoPronto = false;
    host.hidden = true;
  }
}
/* o mapa avisa quando entra e sai do passeio: no celular ele fica com a tela toda */
window.addEventListener('message', (e) => {
  if (e.origin === location.origin && e.data?.type === 'etal:mapa:passeio' && !palcoOn())
    document.documentElement.classList.toggle('passeio-cheio', !!e.data.on);
});
window.addEventListener('message', (e) => {
  if (
    !palcoFrame ||
    e.origin !== location.origin ||
    e.source !== palcoFrame.contentWindow ||
    e.data?.type !== 'etal:mapa:pronto'
  )
    return;
  palcoPronto = true;
  palcoFrame.contentWindow.postMessage(dadosMapa(palcoFila || {}), location.origin);
  palcoFila = null;
});
/* na tela grande, a aba Mapa do app só comanda o mapa ao lado */
const telaMapaAoLado = () => ({
  html: `${header('Mapa')}<div class="pad stack lado-mapa">
      <p class="lado-tx st" ${st(0)}>O mapa está aberto ao lado, em tela grande. Escolha como quer ver:</p>
      <button class="lado-op st" ${st(1)} data-act="palco" data-mode="evento">${ic('map')}<span><b>Ver o evento e buscar salas</b><small>Busca, rotas e as partes do evento em cores</small></span>${ic('chev')}</button>
      <button class="lado-op st" ${st(2)} data-act="palco" data-mode="campus">${ic('pin')}<span><b>Campus inteiro</b><small>Todos os prédios, o bairro e o bloco por dentro</small></span>${ic('chev')}</button>
      <button class="lado-op st" ${st(3)} data-act="palco" data-mode="andares">${ic('building')}<span><b>Andares do bloco principal</b><small>O prédio aberto, andar por andar</small></span>${ic('chev')}</button>
      <div class="sec st" ${st(4)}><h2>Como chegar</h2></div>
      <ul class="next st" ${st(5)}>${D.sessions
        .filter((x) => Number.isInteger(x.floor) && x.zone && D.enrolled.includes(x.id))
        .slice(0, 4)
        .map(
          (n) =>
            `<li data-act="openmap" data-floor="${n.floor}" data-zone="${n.zone}"><span class="date"><small>${dayOf(n.day).week}</small><b>${n.day}</b></span><span class="next-tx"><b>${n.short}</b><small>${n.time} · ${n.room}</small></span>${ic('chev')}</li>`,
        )
        .join('')}</ul>
    </div>`,
});
/* O mapa 3D fica num iframe só, criado na primeira vez e nunca removido: trocar de aba apenas o esconde. Antes ele
     era recriado a cada abertura da aba Mapa e o campus inteiro era montado de novo (vários segundos no celular). */
let mapaFixo = null,
  mapaPronto = false,
  mapaFila = null;
const dadosAba = (type, pedida = {}) => ({
  type,
  ...pedida,
  tema: isDark() ? 'escuro' : 'claro',
  proxima: proximaMinha(),
  origem: origemAgora(),
  foto: D.person.photo || null,
  nome: D.person.name || '',
  hour: skyHour,
  reduced: reduce,
  agora: { day: D.now.day, time: D.now.time },
  sessions: D.sessions.map((x) => ({
    id: x.id,
    title: x.title,
    time: x.time,
    end: x.end,
    day: x.day,
    type: x.type,
    room: x.room,
    place: x.place,
    tournament: x.tournament,
    floor: x.floor,
    zone: x.zone,
  })),
  rooms: Object.fromEntries(
    P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => [`${f.level}:${z.id}`, z.roomNumber])),
  ),
});
function mapaFixoEnviar(type, pedida) {
  if (!mapaPronto) {
    mapaFila = pedida;
    return;
  }
  mapaFixo.querySelector('iframe').contentWindow.postMessage(dadosAba(type, pedida), location.origin);
}
function mapaFixoCriar() {
  if (mapaFixo) return mapaFixo;
  mapaFixo = document.createElement('div');
  mapaFixo.className = 'mapa-fixo';
  mapaFixo.hidden = true;
  mapaFixo.innerHTML = `<iframe title="Mapa do campus" allow="fullscreen" src="mapa3d/index.html?aba=1&tema=${isDark() ? 'escuro' : 'claro'}"></iframe>`;
  /* trocou o tema no app: o mapa acompanha */
  document.addEventListener('etal:tema', () => {
    if (mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
  });
  vp.appendChild(mapaFixo);
  const frame = mapaFixo.querySelector('iframe');
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow || e.data?.type !== 'etal:mapa:pronto') return;
    mapaPronto = true;
    frame.contentWindow.postMessage(dadosAba('etal:mapa:abrir', mapaFila || {}), location.origin);
    mapaFila = null;
  });
  return mapaFixo;
}
/* mostra o mapa só quando a tela visível é a do mapa (chamado por setChrome a cada troca de tela) */
const mapaFixoVer = (el) => {
  if (mapaFixo) mapaFixo.hidden = !el?.querySelector('[data-mapa-fixo]');
};
const telaMapaNovo = () =>
  palcoOn()
    ? telaMapaAoLado()
    : {
        html: '<div class="map-screen mapa-aba" data-mapa-fixo></div>',
        mount: () => {
          const novo = !mapaFixo;
          mapaFixoCriar();
          mapaFixo.hidden = false;
          /* rota pedida por "Como chegar" (atividade ou sala) vai junto, uma vez; sem pedido, só sincroniza (salas, foto, hora) */
          const pedida =
            S.mapRoute && Number.isInteger(S.mapFloor) && S.mapZone
              ? { floor: S.mapFloor, zone: S.mapZone, via: S.mapVia || null }
              : null;
          S.mapRoute = false;
          if (pedida) mapaFixoEnviar('etal:mapa:abrir', pedida);
          else if (!novo && mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
        },
      };
Screens.campus = () =>
  mapaNovoOn()
    ? telaMapaNovo()
    : {
        html: `<div class="map-screen campus">
      <canvas class="campus3d" tabindex="0" role="application" aria-label="Mapa do campus IFRN Pau dos Ferros, com a área do evento em destaque. Arraste para mover e use os botões para aproximar."></canvas>
      ${fpsHud()}
      ${mapBottom(campusSheet())}
    </div>`,
        mount: mountCampus,
      };
