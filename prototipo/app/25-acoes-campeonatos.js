/* app/25-acoes-campeonatos.js · ações de campeonatos.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['tourtab'] = (el, e, a) => {
  S.tourTab = el.dataset.k;
  rerender();
};

ACOES['tourround'] = (el, e, a) => {
  S.tourRound = el.dataset.k;
  rerender();
};

ACOES['tourform'] = (el, e, a) => {
  S.tourForm = el.dataset.v === '1' ? S.tourForm || {} : null;
  rerender();
};

ACOES['tourpick'] = (el, e, a) => {
  const nick = el.closest('form')?.querySelector('[name=nick]')?.value;
  S.tourForm = {
    ...(S.tourForm || {}),
    nick,
    [el.dataset.k]: el.dataset.k === 'level' ? +el.dataset.v : el.dataset.v,
  };
  rerender();
};

ACOES['tourleave'] = (el, e, a) => {
  const t = D.tournaments.find((x) => x.id === el.dataset.id);
  orgWrite((o) => {
    const stt = window.TOUR.state(t, o);
    const i = stt.players.findIndex((p) => p && p[4] === D.person.id);
    if (i < 0) return;
    stt.players[i] = null;
    o.torneios = { ...(o.torneios || {}), [t.id]: { ...((o.torneios || {})[t.id] || {}), players: stt.players } };
  });
  toast('Você saiu da chave');
  rerender();
};

ACOES['tourwatch'] = (el, e, a) => {
  const id = el.dataset.id;
  if (S.saved.has(id)) S.saved.delete(id);
  else S.saved.add(id);
  toast(S.saved.has(id) ? 'Adicionado à sua agenda' : 'Removido da sua agenda');
  rerender();
};
