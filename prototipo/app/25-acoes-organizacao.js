/* app/25-acoes-organizacao.js · ações de organizacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['oq-abrir'] = (el, e, a) => {
  openOverlay(
    `<div class="oq-full" role="dialog" aria-label="QR Code em tela cheia"><span class="oq-n"></span><button class="oq-x" data-act="closeov" aria-label="Fechar">${ic('x')}</button><div class="oq-qr"></div><b class="oq-t"></b><small class="oq-w"></small><div class="oq-nav"><button data-act="oq-ant">${ic('back')}Anterior</button><button data-act="oq-prox">Próximo${ic('chev')}</button></div></div>`,
    'qrfull',
  );
  oqTela(+el.dataset.i);
  {
    const f = $('.oq-full', ov);
    let x0 = null;
    f.addEventListener(
      'touchstart',
      (e) => {
        x0 = e.touches[0].clientX;
      },
      { passive: true },
    );
    f.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 50) oqTela(oqI + (d < 0 ? 1 : -1));
      x0 = null;
    });
  }
};

ACOES['oq-ant'] = (el, e, a) => {
  oqTela(oqI - 1);
};

ACOES['oq-prox'] = (el, e, a) => {
  oqTela(oqI + 1);
};

ACOES['orgres'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    const k = el.dataset.k;
    const w = el.dataset.w === '' ? null : +el.dataset.w;
    /* mudar uma partida desfaz as que dependem dela */
    const depois = k[0] === 'q' ? [`s${Math.floor(+k[1] / 2)}`, 'f'] : k[0] === 's' ? ['f'] : [];
    depois.forEach((d) => delete T.res[d]);
    if (w === null) delete T.res[k];
    else T.res[k] = w;
  });
  rerender();
  toast(el.dataset.w === '' ? 'Resultado desfeito' : 'Resultado salvo');
};

ACOES['orgopen'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    T.open = !T.open;
  });
  rerender();
};

ACOES['orgrmjog'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    T.players[+el.dataset.i] = null;
  });
  rerender();
  toast('Jogador fora da chave');
};
