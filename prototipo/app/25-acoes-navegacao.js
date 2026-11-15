/* app/25-acoes-navegacao.js · ações de navegacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['back'] = (el, e, a) => {
  if (navTag() === 'screen' || S.stacks[S.tab].length < 2) navBack();
  else if (!busy) {
    navMark('tab');
    S.stacks[S.tab].pop();
    show(build(top()), 'pop');
  }
};

ACOES['tab'] = (el, e, a) => {
  if (el.dataset.tab === 'map' && S.tab !== 'map' && soonRoute()) return;
  switchTab(el.dataset.tab);
};

ACOES['link'] = (el, e, a) => {
  window.open(el.dataset.url, '_blank', 'noopener');
};

ACOES['closeov'] = (el, e, a) => {
  closeOverlay(
    el.dataset.then ? () => push(el.dataset.then, el.dataset.thenId ? { id: el.dataset.thenId } : undefined) : null,
  );
};

ACOES['share'] = (el, e, a) => {
  openOverlay(Overlays.share(el.dataset.id), 'share');
};

ACOES['copy'] = (el, e, a) => {
  const txt = el.dataset.text;
  const ok = () => {
    el.querySelector('span').textContent = 'Copiado';
    el.classList.add('done');
  };
  try {
    navigator.clipboard.writeText(txt).then(ok, ok);
  } catch (_) {
    ok();
  }
};

ACOES['toast'] = (el, e, a) => {
  toast(el.dataset.msg);
};
