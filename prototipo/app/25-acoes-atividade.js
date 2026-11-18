/* app/25-acoes-atividade.js · ações de atividade.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['mat-abrir'] = (el, e, a) => {
  matAbrir({ url: el.dataset.url, kind: el.dataset.kind, name: el.dataset.name, meta: el.dataset.meta });
};

ACOES['mv-clone'] = (el, e, a) => {
  navigator.clipboard?.writeText(`git clone ${el.dataset.url}`).then(
    () => toast('Comando copiado'),
    () => toast(`git clone ${el.dataset.url}`),
  );
};

ACOES['lermais'] = (el, e, a) => {
  el.classList.toggle('clamp');
};

ACOES['vote'] = (el, e, a) => {
  const k = el.dataset.q;
  if (S.votes.has(k)) S.votes.delete(k);
  else S.votes.add(k);
  rerender();
};

ACOES['ask'] = (el, e, a) => {
  openOverlay(Overlays.ask(el.dataset.id), 'ask');
  setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
};

ACOES['rate'] = (el, e, a) => {
  S.ratings[el.dataset.id] = +el.dataset.n;
  rerender();
  toast('Avaliação enviada');
};

ACOES['save'] = (el, e, a) => {
  const id = el.dataset.id;
  if (inscrito(byId(id))) {
    toast('Você está inscrito nesta atividade no SUAP');
    return;
  }
  if (comInscricao(byId(id))) {
    toast('A inscrição em minicurso é feita no SUAP');
    return;
  }
  if (API && S.auth)
    API[S.saved.has(id) ? 'del' : 'post'](`/api/eu/agenda/${encodeURIComponent(id)}`).catch((x) => {
      toast(x.message);
      if (S.saved.has(id)) S.saved.delete(id);
      else S.saved.add(id);
      rerender();
    });
  if (S.saved.has(id)) {
    S.saved.delete(id);
    toast('Removida dos salvos');
  } else {
    S.saved.add(id);
    const x = byId(id);
    const clash = D.sessions.some((o) => o.id !== id && S.saved.has(o.id) && o.day === x.day && o.time === x.time);
    toast(clash ? 'Salva. Há outra atividade neste horário' : 'Salva na sua agenda');
  }
  rerender();
};
