/* app/25-acoes-perfil.js · ações de perfil.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['profile-edit'] = (el, e, a) => {
  profileEditOpen();
};

ACOES['cartao-pular'] = (el, e, a) => {
  cardSkip();
  navBack();
  toast('Tudo bem! Dá para completar depois em Perfil.');
};

ACOES['profile-preset'] = (el, e, a) => {
  profileEditDraft.photo = PROFILE_AVATARS[+el.dataset.index];
  profileEditRefresh();
};

ACOES['profile-remove-photo'] = (el, e, a) => {
  profileEditDraft.photo = null;
  profileEditRefresh();
};

ACOES['retro'] = (el, e, a) => {
  retroOpen(false);
};

ACOES['retrodemo'] = (el, e, a) => {
  closeOverlay(() => retroOpen(true));
};

ACOES['retroprev'] = (el, e, a) => {
  retroShow(retro.i - 1);
};

ACOES['retronext'] = (el, e, a) => {
  retroShow(retro.i + 1);
};

ACOES['retroclose'] = (el, e, a) => {
  closeOverlay();
};

ACOES['retroshare'] = (el, e, a) => {
  const text = retro.text;
  const done = () => toast('Texto copiado para compartilhar');
  if (navigator.share) {
    navigator.share({ title: 'Meu ETAL', text }).catch(() => {});
    return;
  }
  try {
    navigator.clipboard.writeText(text).then(done, done);
  } catch (_) {
    done();
  }
};

ACOES['mine'] = (el, e, a) => {
  S.agendaFilter = 'saved';
  switchTab('agenda', true);
};

ACOES['logout'] = (el, e, a) => {
  suapSummary = null;
  {
    if (API) API.post('/api/auth/sair').catch(() => {});
    const n = navUndo.length;
    navUndo.length = 0;
    if (n) {
      navSkip += 1;
      history.go(-n);
    }
  }
  S = fresh();
  Object.assign(communityDraft, {
    post: '',
    message: '',
    comments: {},
    images: [],
    activity: '',
    day: D.now.day,
    tag: 'No evento',
    contextReady: false,
    activityManual: false,
  });
  communityMode = 'feed';
  store.del(SAVE_KEY);
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  Object.assign(D.person, DEMO_PERSON);
  vp.innerHTML = '';
  show(build({ s: 'login' }), 'fade');
};
