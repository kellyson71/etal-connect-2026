/* app/29-inicio-do-app.js · início do app.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- início ---------------- */
setInterval(checkReminders, 30000);
netState();
const openParam = new URLSearchParams(location.search).get('abrir');
if (openParam) setTimeout(() => openActivity(openParam), 900);
const clock = $('#clock');
if (clock) clock.textContent = D.now.time;
/* Atalhos de demonstração: ?tela=home, agenda, atividade, aula, mapa, credencial, campeonato... */
const q = new URLSearchParams(location.search).get('tela');
if (history.state && history.state.etal) {
  navSkip += 1;
  history.go(-history.state.etal);
}
const qs = new URLSearchParams(location.search);
if (qs.get('fps')) UI.fps = true;
if (qs.get('ceu')) {
  skyHour = +qs.get('ceu');
  horaManual = true;
}
if (qs.get('tema')) UI.mode = qs.get('tema') === 'dark' ? 'escuro' : 'claro';
if (qs.get('paleta')) UI.theme = qs.get('paleta');
applyUI();
syncMapHour();
window.Campus3D.setLayers?.(UI.layers);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (UI.mode === 'auto') {
    applyUI();
    rerender();
  }
});
if (mapSaved && mapSaved.seen ? mapSaved.flat : UI.view === '2d') window.Campus3D.setFlat(true);
if (!q && API) {
  apiStart();
  return;
}
if (!API && qs.get('qr')) {
  if (qrActivity(qs.get('qr')) !== undefined)
    try {
      sessionStorage.setItem('etal-qr-demo', qs.get('qr'));
    } catch (_) {
      /* opcional */
    }
  history.replaceState(history.state, '', location.pathname);
}
if (!q) {
  const saved = store.get(SAVE_KEY);
  if (saved) {
    applyProfile(saved);
    S.auth = true;
    telaGrande();
    show(build(top()), 'fade');
    qrPendente();
    if (DEMO) cardIntro(900);
    return;
  }
  show(build({ s: 'login' }), 'fade');
  return;
}
if (q === 'login') {
  show(build({ s: 'login' }), 'fade');
  return;
}
if (q === 'visitante') {
  S.lgMode = 'guest';
  show(build({ s: 'login' }), 'fade');
  return;
}
S.auth = true;
applyProfile(D.person);
const ok = () => {
  S.credAt = D.now.time;
};
const setups = {
  home: () => {},
  'home-ok': ok,
  comunidade: () => {
    S.tab = 'community';
  },
  'comunidade-ok': () => {
    ok();
    S.tab = 'community';
  },
  mural: () => {
    S.tab = 'community';
    communityMode = 'wall';
  },
  moderacao: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'orgCommunity' });
  },
  chat: () => {
    ok();
    S.tab = 'community';
    communityMode = 'chat';
  },
  agenda: () => {
    S.tab = 'agenda';
  },
  atividade: () => {
    S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } });
  },
  aula: () => {
    ok();
    S.present['react-native'] = '14:03';
    S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } });
  },
  compartilhar: () => {
    setups.aula();
    setTimeout(() => openOverlay(Overlays.share('react-native'), 'share'), 300);
  },
  mapa: () => {
    S.tab = 'map';
  },
  campus: () => {
    S.tab = 'map';
    S.mapView = 'campus';
  },
  bloco: () => {
    S.tab = 'map';
    S.mapView = 'bloco';
  },
  nadic: () => {
    S.stacks.home.push({ s: 'nadic' });
  },
  etal: () => {
    S.stacks.home.push({ s: 'etal' });
  },
  agendaVazia: () => {
    S.tab = 'agenda';
    S.agendaDay = 28;
    S.agendaFilter = 'saved';
    S.saved.delete('saude-mental');
  },
  perf: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'perf' });
  },
  palestrante: () => {
    S.stacks.home.push({ s: 'speaker', p: { id: 'react-native' } });
  },
  personalizar: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'personalizar' });
  },
  retro: () => {
    S.tab = 'profile';
    setTimeout(() => retroOpen(true), 400);
  },
  colmeia: () => {
    ok();
    S.present['react-native'] = D.now.time;
    S.ratings['react-native'] = 5;
    S.stacks.home.push({ s: 'colmeia' });
  },
  'home-favos': () => {
    ok();
    S.present['react-native'] = D.now.time;
    S.ratings['react-native'] = 5;
  },
  rota: () => {
    S.tab = 'map';
    S.mapView = 'bloco';
    S.mapFloor = 2;
    S.mapZone = 'labs-norte-2';
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
  },
  qr: () => {
    setTimeout(() => {
      openOverlay(Overlays.scan(), 'scan');
      setTimeout(camStart, 350);
    }, 300);
  },
  meuqr: () => {
    ok();
    setTimeout(() => openOverlay(Overlays.scan('meu'), 'scan'), 300);
  },
  palestrantes: () => {
    S.stacks.home.push({ s: 'speakers' });
  },
  certificados: () => {
    ok();
    S.present['react-native'] = '14:03';
    S.stacks.home.push({ s: 'certificates' });
  },
  contatos: () => {
    S.stacks.home.push({ s: 'network' });
  },
  org: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'org' });
  },
  sobre: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'sobre' });
  },
  materiais: () => {
    S.stacks.home.push({ s: 'materials' });
  },
  boasvindas: () => {
    ok();
    S.newComb = 'cred';
    setTimeout(() => openOverlay(Overlays.welcome(D.combs[0]), 'welcome'), 300);
  },
  favo: () => {
    ok();
    S.present['react-native'] = D.now.time;
    setTimeout(() => {
      S.newComb = 'react-native';
      combToast(D.combs[1]);
    }, 900);
  },
  credencial: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'credential' });
  },
  avisos: () => {
    S.stacks.home.push({ s: 'notices' });
  },
  perfil: () => {
    S.tab = 'profile';
  },
  campeonatos: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'games' });
  },
  campeonato: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'mk' } });
  },
  fifa: () => {
    S.tab = 'profile';
    S.tourTab = 'jogadores';
    S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'fifa' } });
  },
};
(setups[q] || (() => {}))();
telaGrande();
wideMq.addEventListener('change', () => location.reload());
show(build(top()), 'fade');
