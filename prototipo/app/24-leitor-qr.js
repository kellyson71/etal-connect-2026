/* app/24-leitor-qr.js · leitura dos QR Codes e câmera.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- ações ---------------- */
let peerForce = null;
function scanResult(q) {
  const root = $('.scanner', ov);
  if (!root || root.dataset.busy) return;
  root.dataset.busy = '1';
  root.dataset.mode = 'ler';
  $('.scan-seg', ov).style.setProperty('--k', 0);
  const hint = $('.scan-hint span', ov);
  const wrap = $('.placard-wrap', ov);
  /* 1. a câmera move até o QR; 2. a linha lê; 3. os cantos travam e o aparelho vibra. */
  if (wrap.firstElementChild.dataset.k !== q) {
    wrap.classList.add('moving');
    setTimeout(
      () => {
        wrap.innerHTML = placard(q);
        wrap.classList.remove('moving');
      },
      reduce ? 0 : 240,
    );
  }
  hint.textContent = 'Lendo…';
  root.classList.add('reading');
  setTimeout(
    () => {
      root.classList.remove('reading');
      root.classList.add('is-locked');
      buzz([18, 40, 18]);
      hint.innerHTML = `${ic('check')}${SPOTS[q].name} reconhecido`;
    },
    reduce ? 20 : 950,
  );
  setTimeout(
    () => {
      if (q === 'colega') {
        const peer = peerForce || D.peers[S.contacts.length % D.peers.length];
        peerForce = null;
        const again = S.contacts.includes(peer);
        if (!again) S.contacts.unshift(peer);
        const c = takeNewComb();
        scanSheet(peerResult(peer, { again, c }));
        return;
      }
      if (q === 'recepcao') {
        if (S.credAt) {
          scanSheet(credResult());
          return;
        }
        S.credAt = D.now.time;
        const c = takeNewComb();
        rerender();
        openOverlay(Overlays.welcome(c), 'welcome');
        return;
      }
      const first = !S.credAt;
      if (first) S.credAt = D.now.time;
      const again = !!S.present[q];
      /* sem servidor, a segunda leitura já vale como saída (como no servidor sem a janela de horário) */
      if (again && tipoDe(byId(q) || {}).g !== 'camp') {
        if (!S.left[q]) S.left[q] = D.now.time;
        rerender();
        scanSheet(exitResult(q, { rated: !!S.ratings[q] }));
        return;
      }
      if (!again) S.present[q] = D.now.time;
      communityCheckin(q);
      const c = takeNewComb();
      rerender();
      if (!again && tipoDe(byId(q) || {}).g === 'camp' && byId(q)?.tournament) {
        openOverlay(Overlays.jogo(byId(q), c), 'welcome');
        return;
      }
      scanSheet(roomResult(q, { again, first, c }));
    },
    reduce ? 60 : 1500,
  );
}
/* Saída do cartão de resultado para a tela certa. */
function scanOpen(q) {
  closeOverlay(() => {
    if (q === 'colega') {
      if (top().s === 'network') rerender();
      else push('network');
      return;
    }
    if (q === 'credential') {
      push('credential');
      return;
    }
    if (S.tab !== 'home' && S.tab !== 'agenda') {
      S.tab = 'home';
      S.stacks.home = [{ s: 'home' }];
      show(build(top()), 'none');
    }
    const t = top();
    if (t.s === 'activity' && t.p && t.p.id === q) rerender();
    else push('activity', { id: q });
  });
}
