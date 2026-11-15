/* app/25-acoes.js · despachante das ações (data-act).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act],[data-go]');
  if (!el || !device.contains(el)) return;
  if (el.closest('form') && el.type === 'submit') return;
  const a = el.dataset.act;
  if (el.dataset.go && !a) {
    e.stopPropagation();
    push(el.dataset.go, el.dataset.id ? { id: el.dataset.id } : undefined);
    return;
  }
  e.stopPropagation();
  switch (a) {
    case 'back':
      /* A seta da tela sobe um nível; o botão do celular segue a ordem em que as telas foram abertas. */
      if (navTag() === 'screen' || S.stacks[S.tab].length < 2) navBack();
      else if (!busy) {
        navMark('tab');
        S.stacks[S.tab].pop();
        show(build(top()), 'pop');
      }
      break;
    case 'tab':
      if (el.dataset.tab === 'map' && S.tab !== 'map' && soonRoute()) break;
      switchTab(el.dataset.tab);
      break;
    case 'gallery-step': {
      const gallery = el.closest('.community-gallery');
      const track = $('.gallery-track', gallery);
      const index = Math.max(0, Math.min(track.children.length - 1, +el.dataset.index));
      track.scrollTo({
        left: track.children[index].offsetLeft - track.children[0].offsetLeft,
        behavior: reduce ? 'instant' : 'smooth',
      });
      break;
    }
    case 'profile-edit':
      profileEditOpen();
      break;
    case 'mat-abrir':
      matAbrir({ url: el.dataset.url, kind: el.dataset.kind, name: el.dataset.name, meta: el.dataset.meta });
      break;
    case 'mv-clone':
      navigator.clipboard?.writeText(`git clone ${el.dataset.url}`).then(
        () => toast('Comando copiado'),
        () => toast(`git clone ${el.dataset.url}`),
      );
      break;
    case 'oq-abrir':
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
      break;
    case 'oq-ant':
      oqTela(oqI - 1);
      break;
    case 'oq-prox':
      oqTela(oqI + 1);
      break;
    case 'cartao-pular':
      cardSkip();
      cardDemoDone = true;
      if (el.closest('.ct-invite')) {
        el.closest('.ct-invite').remove();
        toast('Dá para personalizar depois em Perfil');
      } else {
        navBack();
        toast('Dá para personalizar depois em Perfil');
      }
      break;
    case 'profile-preset':
      profileEditDraft.photo = PROFILE_AVATARS[+el.dataset.index];
      profileEditRefresh();
      break;
    case 'profile-remove-photo':
      profileEditDraft.photo = null;
      profileEditRefresh();
      break;
    case 'community-mode': {
      const mode = ['feed', 'wall', 'saved', 'mentions', 'chat'].includes(el.dataset.v) ? el.dataset.v : 'feed';
      if (
        mode === 'mentions' &&
        !communityWrite((v) => {
          v.mentionSeen[String(D.person.id)] = communityMentionRows(v).map((row) => row.target);
        })
      )
        break;
      communityMode = mode;
      rerender();
      break;
    }
    case 'community-save': {
      if (!S.auth) break;
      const id = el.dataset.id;
      const me = String(D.person.id);
      let adding = false;
      if (
        communityWrite((v) => {
          if (!communityPosts(v).some((p) => p.id === id)) throw new Error('Esta publicação não está mais disponível.');
          const ids = v.bookmarks[me] || [];
          adding = !ids.includes(id);
          v.bookmarks[me] = adding ? [...ids, id] : ids.filter((x) => x !== id);
        })
      ) {
        rerender();
        toast(adding ? 'Publicação salva' : 'Removida dos salvos');
      }
      break;
    }
    case 'community-photo-open':
      galleryPositions[el.dataset.id] = +el.dataset.index;
      push('communityPost', { id: el.dataset.id });
      break;
    case 'community-report':
      communityReportOpen(el.dataset.target);
      break;
    case 'community-insert-mention':
      communityAddMention(document.getElementById(el.dataset.input), el.dataset.handle);
      el.closest('details')?.removeAttribute('open');
      break;
    case 'community-mention-person': {
      if (!S.credAt) break;
      const person = communityPeople().find((p) => p.id === el.dataset.id);
      if (!person) break;
      communityDraft.post += `${communityDraft.post && !communityDraft.post.endsWith(' ') ? ' ' : ''}@${person.handle} `;
      push('communityCompose');
      break;
    }
    case 'community-mention-open': {
      const item = SOCIAL.find(communityRead(), el.dataset.target);
      if (!item) break;
      if (item.type === 'Mensagem') {
        communityMode = 'chat';
        rerender();
      } else push('communityPost', { id: item.postId });
      break;
    }
    case 'social-mod-filter':
      if (canModerateCommunity()) {
        communityModFilter = el.dataset.filter;
        rerender();
      }
      break;
    case 'social-mod': {
      if (!canModerateCommunity()) {
        toast('Esta ação é da organização.');
        break;
      }
      const note = el.closest('[data-mod-target]')?.querySelector('[data-mod-note]')?.value || '';
      if (communityWrite((v) => SOCIAL.moderate(v, el.dataset.target, el.dataset.action, D.person.name, note))) {
        rerender();
        toast('Revisão salva neste navegador');
      }
      break;
    }

    case 'community-compose':
      if (!S.credAt) {
        toast('Leia o QR da recepção para participar.');
        break;
      }
      if (!communityDraft.post.trim() && !communityDraft.images.length && !communityDraft.activityManual)
        communityDraft.contextReady = false;
      push('communityCompose');
      if (el.dataset.photo) $('#community-image', vp.querySelector('.page:not(.leaving)'))?.click();
      break;
    case 'community-remove-image':
      communityDraft.images.splice(+el.dataset.index, 1);
      rerender();
      break;
    case 'community-like': {
      if (!S.credAt) {
        toast('Leia o QR da recepção para participar.');
        break;
      }
      const id = el.dataset.id;
      const me = String(D.person.id);
      if (
        communityWrite((v) => {
          if (!communityPosts(v).some((p) => p.id === id)) throw new Error('Esta publicação não está mais disponível.');
          const list = v.likes[id] || [];
          v.likes[id] = list.includes(me) ? list.filter((x) => x !== me) : [...list, me];
        })
      )
        rerender();
      break;
    }
    case 'community-delete': {
      if (!S.auth) break;
      if (communityWrite((v) => SOCIAL.removePost(v, el.dataset.id, communityAuthor(), canModerateCommunity()))) {
        if (top().s === 'communityPost') navBack();
        else rerender();
        toast('Publicação excluída');
      }
      break;
    }
    case 'retro':
      retroOpen(false);
      break;
    case 'retrodemo':
      closeOverlay(() => retroOpen(true));
      break;
    case 'retroprev':
      retroShow(retro.i - 1);
      break;
    case 'retronext':
      retroShow(retro.i + 1);
      break;
    case 'retroclose':
      closeOverlay();
      break;
    case 'retroshare': {
      const text = retro.text;
      const done = () => toast('Texto copiado para compartilhar');
      if (navigator.share) {
        navigator.share({ title: 'Meu ETAL', text }).catch(() => {});
        break;
      }
      try {
        navigator.clipboard.writeText(text).then(done, done);
      } catch (_) {
        done();
      }
      break;
    }
    case 'link':
      window.open(el.dataset.url, '_blank', 'noopener');
      break;
    case 'nadicmap':
      S.mapView = 'campus';
      S.campusPlace = 'predio-nadic';
      window.Campus3D.setMode('campus');
      window.Campus3D.select('predio-nadic');
      switchTab('map', true);
      setTimeout(() => window.Campus3D.focus('predio-nadic'), reduce ? 0 : 500);
      break;
    case 'ui':
      UI[el.dataset.k] = el.dataset.v;
      uiSave();
      applyUI();
      if (el.dataset.k === 'view') window.Campus3D.setFlat(el.dataset.v === '2d');
      rerender();
      break;
    case 'theme':
      UI.theme = el.dataset.v;
      UI.accent = null;
      uiSave();
      applyUI();
      rerender();
      break;
    case 'accent':
      UI.accent = el.dataset.v;
      uiSave();
      applyUI();
      rerender();
      break;
    case 'uifps':
      UI.fps = !UI.fps;
      uiSave();
      rerender();
      break;
    case 'uimaphour':
      UI.mapHour = !UI.mapHour;
      uiSave();
      syncMapHour();
      if (el.closest('.map-cfg')) {
        el.classList.toggle('on', UI.mapHour);
        el.setAttribute('aria-pressed', UI.mapHour);
      } else rerender();
      break;
    case 'mapcfg': {
      const p = el.closest('.map-screen, .page, body').querySelector('.map-cfg');
      const open = !p.classList.contains('open');
      p.classList.toggle('open', open);
      el.setAttribute('aria-expanded', open);
      break;
    }
    case 'maplayer': {
      const k = el.dataset.k;
      UI.layers[k] = !UI.layers[k];
      uiSave();
      window.Campus3D.setLayers(UI.layers);
      el.classList.toggle('on', UI.layers[k]);
      el.setAttribute('aria-pressed', UI.layers[k]);
      break;
    }
    case 'perfrun':
      perfRun();
      break;
    case 'perfuse':
      window.Campus3D.setQuality(el.dataset.v);
      rerender();
      toast(`Em uso: ${TIER_LABEL[el.dataset.v]}`);
      break;
    case 'hudcycle': {
      const list = window.Campus3D.tiers();
      const cur = window.Campus3D.quality().tier;
      const next = list[(list.indexOf(cur) + 1) % list.length];
      window.Campus3D.setQuality(next);
      rerender();
      toast(TIER_LABEL[next]);
      break;
    }
    case 'uisky':
      UI.sky = !UI.sky;
      uiSave();
      rerender();
      break;
    case 'uihome':
      UI.home[el.dataset.k] = !UI.home[el.dataset.k];
      uiSave();
      rerender();
      break;
    case 'quality':
      window.Campus3D.setQuality(el.dataset.v);
      rerender();
      break;
    case 'uireset':
      UI = JSON.parse(JSON.stringify(UI_DEFAULT));
      uiSave();
      applyUI();
      window.Campus3D.setQuality('auto');
      window.Campus3D.setFlat(false);
      rerender();
      toast('Padrão restaurado');
      break;
    case 'skycycle': {
      const seq = [6.5, 14 + 2 / 60, 18, 20.5];
      const n = seq.find((v) => v > skyHour + 0.1);
      skyTo(n === undefined ? seq[0] : n);
      break;
    }
    /* atalho do tema na home (o resto das opções continua em Perfil → Personalizar) */
    case 'tema':
      UI.mode = isDark() ? 'claro' : 'escuro';
      uiSave();
      applyUI();
      rerender();
      break;
    case 'lermais':
      el.classList.toggle('clamp');
      break;
    case 'scan':
      openOverlay(Overlays.scan(el.dataset.mode || 'ler'), 'scan');
      if ((el.dataset.mode || 'ler') === 'ler') setTimeout(camStart, 350);
      break;
    case 'camstart':
      camStart();
      break;
    case 'suapoauth':
      el.classList.add('loading');
      location.href = API.url('/api/auth/suap');
      break;
    case 'scanmode': {
      const r = $('.scanner', ov);
      if (r.dataset.busy) break;
      r.dataset.mode = el.dataset.v;
      $('.scan-seg', ov).style.setProperty('--k', el.dataset.v === 'meu' ? 1 : 0);
      break;
    }
    case 'torch': {
      const r = $('.scanner', ov);
      const on = r.classList.toggle('torch');
      el.setAttribute('aria-pressed', on);
      break;
    }
    case 'flip':
      el.classList.toggle('flipped');
      el.classList.remove('hint');
      S.flipSeen = true;
      buzz(8);
      break;
    case 'demo':
      Object.assign(D.person, DEMO_PERSON);
      lgFilled({ ...DEMO_PERSON });
      break;
    case 'remind': {
      const id = el.dataset.id;
      const on = !S.reminders.has(id);
      const x = byId(id);
      if (on) S.reminders.add(id);
      else {
        S.reminders.delete(id);
        remFired.delete(id);
      }
      prefs.set(REM_KEY, JSON.stringify([...S.reminders]));
      if (on)
        askNotify().then(() => {
          rerender();
          toast(`Lembrete às ${hhmm(toMin(x.time) - LEAD)} de ${dayOf(x.day).week.toLowerCase()}, ${x.day}`);
          checkReminders();
        });
      else {
        rerender();
        toast('Lembrete desligado');
      }
      break;
    }
    case 'remindtest':
      deliver(byId(el.dataset.id), true);
      break;
    case 'install':
      installApp();
      break;
    case 'instalar-fechar':
      prefs.set('etal-instalar-oculto', '1');
      el.closest('.instalar')?.remove();
      toast('Dá para instalar depois em Perfil');
      break;
    case 'update':
      if (PWA.waiting) {
        PWA.updating = true;
        PWA.waiting.postMessage({ type: 'skip' });
      } else location.reload();
      break;
    case 'vote': {
      const k = el.dataset.q;
      if (S.votes.has(k)) S.votes.delete(k);
      else S.votes.add(k);
      rerender();
      break;
    }
    case 'ask':
      openOverlay(Overlays.ask(el.dataset.id), 'ask');
      setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
      break;
    case 'rate':
      S.ratings[el.dataset.id] = +el.dataset.n;
      rerender();
      toast('Avaliação enviada');
      break;
    case 'closeov':
      closeOverlay(
        el.dataset.then ? () => push(el.dataset.then, el.dataset.thenId ? { id: el.dataset.thenId } : undefined) : null,
      );
      break;
    case 'scanask': {
      const q = el.dataset.q;
      scanOpen(q);
      setTimeout(() => {
        openOverlay(Overlays.ask(q), 'ask');
        setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
      }, 650);
      break;
    }
    case 'colega-teste':
      if (!canDebugQr()) break;
      peerForce = D.peers.find((x) => x.card) || null;
      scanResult('colega');
      break;
    case 'simulate':
      if (!canDebugQr()) break;
      if (API) demoQr(el.dataset.q);
      else demoHit('etal:' + el.dataset.q);
      break;
    case 'scanopen':
      scanOpen(el.dataset.q);
      break;
    case 'scanagain':
      scanAgain();
      break;
    case 'agendaLugar':
      S.agendaLugar = null;
      rerender();
      break;
    case 'day':
      S.agendaDay = +el.dataset.day;
      rerender();
      vp.querySelector('.page .agenda-list')?.classList.add('swap');
      break;
    case 'filter':
      S.agendaFilter = el.dataset.f;
      rerender();
      vp.querySelector('.page .agenda-list')?.classList.add('swap');
      break;
    case 'save': {
      const id = el.dataset.id;
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
      break;
    }
    case 'mapview':
      if (S.mapView !== el.dataset.v) {
        navMark('view');
        S.journeying = false;
        S.mapView = el.dataset.v;
        if (S.mapView === 'bloco') {
          S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
          S.mapZone = null;
          S.mapRoute = false;
        } else {
          S.campusPlace = null;
          window.Campus3D.clearRoute();
        }
        rerender();
      }
      break;
    case 'dim': {
      const C = window.Campus3D;
      const f = el.dataset.v === '2d';
      if (f === C.isFlat()) break;
      C.setFlat(f);
      if (f && S.mapView === 'bloco' && S.mapFloor === null) {
        S.mapFloor = 0;
        rerender();
        C.goFloor(0);
      } else rerender();
      break;
    }
    case 'place': {
      navMark('place');
      S.campusPlace = el.dataset.id;
      window.Campus3D.select(S.campusPlace);
      rerender();
      window.Campus3D.focus(S.campusPlace);
      break;
    }
    case 'placeclose':
      if (navTag() === 'place') {
        navBack();
        break;
      }
      S.campusPlace = null;
      window.Campus3D.select(null);
      window.Campus3D.clearRoute();
      rerender();
      window.Campus3D.fitAll();
      break;
    case 'placeroute':
      window.Campus3D.route(el.dataset.id);
      rerender();
      break;
    case 'enterbloco':
      navMark('bloco');
      S.mapView = 'bloco';
      S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
      S.mapZone = null;
      S.mapRoute = false;
      S.campusPlace = null;
      window.Campus3D.select(null);
      window.Campus3D.clearRoute();
      rerender();
      break;
    case 'cam': {
      const v = el.dataset.v;
      const C = window.Campus3D;
      if (v === 'in') C.zoom(1.4);
      else if (v === 'out') C.zoom(0.72);
      else if (v === 'rot') C.rotate(45);
      else C.fit();
      break;
    }
    case 'mapanovo':
      abrirMapaNovo(null, null, () => toast('Você está no mapa leve.'));
      break;
    case 'openmap': {
      const fl = +el.dataset.floor,
        z = el.dataset.zone;
      const legacy = () => {
        S.mapView = 'bloco';
        S.mapFloor = fl;
        S.mapZone = z;
        S.mapRoute = true;
        S.pending = true;
        S.journeying = true;
        switchTab('map', true);
      };
      if (!abrirMapaNovo(fl, z, legacy)) legacy();
      break;
    }
    case 'palco':
      palcoEnviar({ mode: el.dataset.mode });
      break;
    case 'openplace':
      S.mapView = 'evento';
      S.campusPlace = el.dataset.id;
      window.Campus3D.setMode('evento');
      window.Campus3D.select(el.dataset.id);
      switchTab('map', true);
      setTimeout(
        () => {
          window.Campus3D.select(el.dataset.id);
          window.Campus3D.focus(el.dataset.id);
          window.Campus3D.route(el.dataset.id);
        },
        reduce ? 0 : 450,
      );
      break;
    case 'today':
      S.todayOpen = !S.todayOpen;
      el.setAttribute('aria-expanded', S.todayOpen);
      el.closest('.today').classList.toggle('open', S.todayOpen);
      break;
    case 'floorsel': {
      const v = el.dataset.v;
      const C = window.Campus3D;
      navMark('floor');
      S.mapZone = null;
      S.mapRoute = false;
      S.journeying = false;
      S.mapFloor = v === 'all' ? null : +v;
      rerender();
      if (v === 'all' && C.isFlat()) C.setFlat(false);
      rerender();
      if (v === 'all') C.openStack();
      else C.goFloor(+v);
      break;
    }
    case 'zoneclose':
      if (navTag() === 'room') {
        navBack();
        break;
      }
      S.mapZone = null;
      S.mapRoute = false;
      rerender();
      window.Campus3D.room(S.mapFloor, null);
      break;
    case 'roomroute':
      if (
        abrirMapaNovo(S.mapFloor, S.mapZone, () => {
          S.mapRoute = true;
          S.journeying = true;
          rerender();
          runJourney();
        })
      )
        break;
      navMark('route');
      S.mapRoute = true;
      S.journeying = true;
      rerender();
      runJourney();
      break;
    case 'via':
      S.mapVia = el.dataset.v;
      S.mapRoute = true;
      S.journeying = true;
      rerender();
      runJourney();
      break;
    case 'finder':
      S.finderMode = null;
      openOverlay(Overlays.finder(), 'finder');
      kbTrack(true);
      setTimeout(() => $('#fq')?.focus({ preventScroll: true }), 480);
      break;
    case 'finderq': {
      const i = $('#fq');
      if (i) {
        i.value = el.dataset.q;
        S.finderMode = null;
        finderRender();
      }
      break;
    }
    case 'finderacts': {
      const i = $('#fq');
      S.finderMode = S.finderMode === 'acts' ? null : 'acts';
      if (i && S.finderMode) i.value = '';
      finderRender();
      if (S.finderMode) i?.blur();
      break;
    }
    case 'findergo': {
      if (e.target.closest('.fd-route') && el !== e.target.closest('.fd-route')) break;
      const d = { ...el.dataset };
      if (d.k === 'act' && d.route) {
        const x = byId(d.id);
        if (x && x.floor !== undefined && x.floor !== null)
          Object.assign(d, { k: 'room', floor: x.floor, zone: x.zone });
      }
      closeOverlay(() => {
        if (d.k === 'act') {
          openActivity(d.id);
          return;
        }
        if (d.k === 'place' && d.route) {
          S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
          window.Campus3D.setMode(S.mapView);
          S.campusPlace = d.id;
          window.Campus3D.select(d.id);
          switchTab('map', true);
          setTimeout(
            () => {
              if (window.Campus3D.hasRoute(d.id)) window.Campus3D.route(d.id);
              else window.Campus3D.focus(d.id);
              rerender();
            },
            reduce ? 0 : 700,
          );
          return;
        }
        if (d.k === 'poi') {
          S.mapView = 'campus';
          S.campusPlace = null;
          window.Campus3D.setMode('campus');
          window.Campus3D.select(null);
          switchTab('map', true);
          setTimeout(
            () =>
              d.route && window.Campus3D.hasRoute(d.id) ? window.Campus3D.route(d.id) : window.Campus3D.focusPoi(d.id),
            reduce ? 0 : 700,
          );
          return;
        }
        if (d.k === 'place') {
          S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
          window.Campus3D.setMode(S.mapView);
          S.campusPlace = d.id;
          window.Campus3D.select(d.id);
          switchTab('map', true);
          setTimeout(() => window.Campus3D.focus(d.id), reduce ? 0 : 950);
          return;
        }
        S.mapView = 'bloco';
        S.mapFloor = +d.floor;
        S.mapZone = d.zone;
        S.mapRoute = true;
        S.pending = true;
        S.journeying = true;
        switchTab('map', true);
      });
      break;
    }
    case 'tourtab':
      S.tourTab = el.dataset.k;
      rerender();
      break;
    case 'tourround':
      S.tourRound = el.dataset.k;
      rerender();
      break;
    case 'orgres':
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
      break;
    case 'orgopen':
      torneioSalvar(el.dataset.t, (T) => {
        T.open = !T.open;
      });
      rerender();
      break;
    case 'orgrmjog':
      torneioSalvar(el.dataset.t, (T) => {
        T.players[+el.dataset.i] = null;
      });
      rerender();
      toast('Jogador fora da chave');
      break;
    case 'tourform':
      S.tourForm = el.dataset.v === '1' ? S.tourForm || {} : null;
      rerender();
      break;
    case 'tourpick': {
      const nick = el.closest('form')?.querySelector('[name=nick]')?.value;
      S.tourForm = {
        ...(S.tourForm || {}),
        nick,
        [el.dataset.k]: el.dataset.k === 'level' ? +el.dataset.v : el.dataset.v,
      };
      rerender();
      break;
    }
    case 'tourleave': {
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
      break;
    }
    case 'tourwatch': {
      const id = el.dataset.id;
      if (S.saved.has(id)) S.saved.delete(id);
      else S.saved.add(id);
      toast(S.saved.has(id) ? 'Adicionado à sua agenda' : 'Removido da sua agenda');
      rerender();
      break;
    }
    case 'mine':
      S.agendaFilter = 'saved';
      switchTab('agenda', true);
      break;
    case 'share':
      openOverlay(Overlays.share(el.dataset.id), 'share');
      break;
    case 'copy': {
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
      break;
    }
    case 'toast':
      toast(el.dataset.msg);
      break;
    case 'lgmode':
      if ((el.dataset.v === 'guest') !== (S.lgMode === 'guest')) lgSwap(el.dataset.v === 'guest' ? 'guest' : null);
      break;
    case 'lgenter':
      lgOpenApp();
      break;
    case 'lgredo': {
      lgPhys?.disarm?.();
      lgPending = null;
      Object.keys(D.person).forEach((k) => delete D.person[k]);
      Object.assign(D.person, DEMO_PERSON);
      store.del(SAVE_KEY);
      $('.lx-card', $('.login'))?.setAttribute('aria-hidden', 'true');
      $('.login')?.classList.remove('filled');
      lgSwap(S.lgMode);
      lgPhys?.kick(0, 0, -1.1, 1200);
      break;
    }
    case 'guestresume': {
      const g = guestSaved();
      if (g) {
        Object.keys(D.person).forEach((k) => delete D.person[k]);
        applyProfile(g);
        store.set(SAVE_KEY, g);
        lgFilled(g);
      }
      break;
    }
    case 'togglepwd': {
      const i = $('#pwd');
      i.type = i.type === 'password' ? 'text' : 'password';
      break;
    }
    case 'logout':
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
      break;
    default:
      break;
  }
});
