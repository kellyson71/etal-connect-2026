/* app/25-acoes-entrada.js · ações de entrada.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['suapoauth'] = (el, e, a) => {
  el.classList.add('loading');
  location.href = API.url('/api/auth/suap');
};

ACOES['lgmode'] = (el, e, a) => {
  if ((el.dataset.v === 'guest') !== (S.lgMode === 'guest')) lgSwap(el.dataset.v === 'guest' ? 'guest' : null);
};

ACOES['lgenter'] = (el, e, a) => {
  lgOpenApp();
};

ACOES['lgredo'] = (el, e, a) => {
  lgPhys?.disarm?.();
  lgPending = null;
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  Object.assign(D.person, DEMO_PERSON);
  store.del(SAVE_KEY);
  $('.lx-card', $('.login'))?.setAttribute('aria-hidden', 'true');
  $('.login')?.classList.remove('filled');
  lgSwap(S.lgMode);
  lgPhys?.kick(0, 0, -1.1, 1200);
};

ACOES['guestresume'] = (el, e, a) => {
  const g = guestSaved();
  if (g) {
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile(g);
    store.set(SAVE_KEY, g);
    lgFilled(g);
  }
};

ACOES['togglepwd'] = (el, e, a) => {
  const i = $('#pwd');
  i.type = i.type === 'password' ? 'text' : 'password';
};
