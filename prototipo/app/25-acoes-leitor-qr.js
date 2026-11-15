/* app/25-acoes-leitor-qr.js · ações de leitor qr.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['scan'] = (el, e, a) => {
  openOverlay(Overlays.scan(el.dataset.mode || 'ler'), 'scan');
  if ((el.dataset.mode || 'ler') === 'ler') setTimeout(camStart, 350);
};

ACOES['camstart'] = (el, e, a) => {
  camStart();
};

ACOES['scanmode'] = (el, e, a) => {
  const r = $('.scanner', ov);
  if (r.dataset.busy) return;
  r.dataset.mode = el.dataset.v;
  $('.scan-seg', ov).style.setProperty('--k', el.dataset.v === 'meu' ? 1 : 0);
};

ACOES['torch'] = (el, e, a) => {
  const r = $('.scanner', ov);
  const on = r.classList.toggle('torch');
  el.setAttribute('aria-pressed', on);
};

ACOES['flip'] = (el, e, a) => {
  el.classList.toggle('flipped');
  el.classList.remove('hint');
  S.flipSeen = true;
  buzz(8);
};

ACOES['demo'] = (el, e, a) => {
  Object.assign(D.person, DEMO_PERSON);
  lgFilled({ ...DEMO_PERSON });
};

ACOES['scanask'] = (el, e, a) => {
  const q = el.dataset.q;
  scanOpen(q);
  setTimeout(() => {
    openOverlay(Overlays.ask(q), 'ask');
    setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
  }, 650);
};

ACOES['colega-teste'] = (el, e, a) => {
  if (!canDebugQr()) return;
  peerForce = D.peers.find((x) => x.card) || null;
  scanResult('colega');
};

ACOES['simulate'] = (el, e, a) => {
  if (!canDebugQr()) return;
  if (API) demoQr(el.dataset.q);
  else demoHit('etal:' + el.dataset.q);
};

ACOES['scanopen'] = (el, e, a) => {
  scanOpen(el.dataset.q);
};

ACOES['scanagain'] = (el, e, a) => {
  scanAgain();
};
