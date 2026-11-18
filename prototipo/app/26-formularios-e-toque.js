/* app/26-formularios-e-toque.js · formulários, entrada, toque e teclado.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */

document.addEventListener('submit', async (e) => {
  if (e.target.dataset.form === 'community-report') {
    e.preventDefault();
    if (!communityPode()) {
      toast('Leia o QR Code da recepção para participar.');
      return;
    }
    const data = new FormData(e.target);
    const target = e.target.dataset.target;
    if (API) {
      pubDenunciar(target, String(data.get('reason') || ''), String(data.get('detail') || ''));
      return;
    }
    if (
      communityWrite((v) =>
        SOCIAL.report(v, target, communityAuthor(), String(data.get('reason') || ''), String(data.get('detail') || '')),
      )
    )
      closeOverlay(() => toast('Denúncia registrada para revisão'));
    return;
  }

  if (e.target.dataset.form === 'profile-edit') {
    e.preventDefault();
    if (profilePhotoBusy || !profileEditDraft) return;
    const name = String(new FormData(e.target).get('name') || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!name) {
      toast('Informe o nome que quer exibir.');
      return;
    }
    const words = name.split(' ');
    const edited = {
      name,
      first: words[0],
      initials: (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase(),
      photo: profileEditDraft.photo,
    };
    try {
      localStorage.setItem(profileLocalKey(D.person.id), JSON.stringify(edited));
    } catch (_) {
      toast('Não foi possível salvar. Libere espaço no navegador.');
      return;
    }
    const onBadge = !!$('.login.filled');
    Object.assign(D.person, edited);
    store.set(SAVE_KEY, { ...D.person });
    const guest = guestSaved();
    if (guest && String(guest.id) === String(D.person.id))
      prefs.set('etal-visitante', JSON.stringify({ ...guest, ...edited }));
    if (lgPending) {
      Object.assign(lgPending, edited);
      lgPhys?.disarm?.();
    }
    closeOverlay(() => {
      if (onBadge) {
        $('.bx-face.filled', $('.login')).innerHTML = badgeFace(lgPending);
        $('[data-live="hello"]').textContent = `Tudo certo, ${D.person.first}!`;
      } else if (top().s === 'cartao') {
        /* na edição do perfil: troca só a foto e o nome, sem perder o que foi digitado no resto do formulário */
        const pg = vp.querySelector('.page:not(.leaving)');
        const eu = $('.ct-eu', pg);
        if (eu) eu.outerHTML = cartaoEu();
        $('[data-form="cartao"]', pg)?.dispatchEvent(new Event('input'));
        mapaFixoEnviar('etal:mapa:sincronizar', {});
      } else {
        rerender();
        mapaFixoEnviar('etal:mapa:sincronizar', {});
      }
      toast('Perfil atualizado neste aparelho');
    });
    return;
  }

  if (['community-post', 'community-message', 'community-comment'].includes(e.target.dataset.form)) {
    e.preventDefault();
    if (!S.auth || (e.target.dataset.form !== 'community-message' && !communityPode())) {
      toast('Leia o QR da recepção para participar.');
      return;
    }
    if (communityImageBusy && e.target.dataset.form === 'community-post') {
      toast('Aguarde a foto terminar de carregar.');
      return;
    }
    const f = e.target;
    const kind = f.dataset.form;
    const data = new FormData(f);
    const text = String(data.get('text') || '')
      .trim()
      .slice(0, kind === 'community-post' ? 2000 : 1000);
    if (!text && !(kind === 'community-post' && communityDraft.images.length)) {
      toast('Escreva algo para compartilhar.');
      return;
    }
    if (API) {
      pubEnviar(kind, text, f.dataset.id).then((ok) => {
        if (ok) communityLimparRascunho(kind, f.dataset.id, 'Publicado');
      });
      return;
    }
    const item = {
      ...communityAuthor(),
      handle: communityPeople().find((p) => p.id === String(D.person.id))?.handle,
      id: SOCIAL.uid(),
      created: Date.now(),
      text,
      mentions: communityMentions(text).map((p) => p.id),
    };
    const saved = communityWrite((v) => {
      if (kind === 'community-post')
        v.posts.unshift({
          ...item,
          activity: byId(communityDraft.activity)?.id || null,
          day:
            byId(communityDraft.activity)?.day ||
            (D.days.some((d) => d.day === +communityDraft.day) ? +communityDraft.day : D.now.day),
          tag: communityDraft.tag,
          images: communityDraft.images.map((img) => ({ ...img })),
        });
      else if (kind === 'community-message') v.messages.push(item);
      else {
        if (!communityPosts(v).some((p) => p.id === f.dataset.id))
          throw new Error('Esta publicação não está mais disponível.');
        (v.comments[f.dataset.id] ||= []).push(item);
      }
    });
    if (saved) communityLimparRascunho(kind, f.dataset.id, 'Publicação salva neste aparelho');
    return;
  }
  if (e.target.dataset.form === 'tourjoin') {
    e.preventDefault();
    const t = D.tournaments.find((x) => x.id === e.target.dataset.id);
    const f = S.tourForm || {};
    const nick = String(new FormData(e.target).get('nick') || '')
      .trim()
      .slice(0, 14);
    if (!nick) return;
    let ok = false;
    orgWrite((o) => {
      const stt = window.TOUR.state(t, o);
      const i = stt.players.indexOf(null);
      if (i < 0 || !stt.open || stt.players.some((p) => p && p[4] === D.person.id)) return;
      const pick = f.pick && f.pick !== t.picks[t.picks.length - 1] ? f.pick : '';
      stt.players[i] = [nick, D.person.name, D.person.initials, pick, D.person.id, f.level ?? 1];
      ok = true;
      o.torneios = { ...(o.torneios || {}), [t.id]: { ...((o.torneios || {})[t.id] || {}), players: stt.players } };
    });
    S.tourForm = null;
    if (ok) {
      S.tourTab = 'chave';
      buzz([20, 40, 20]);
      notify(`Você está na chave de ${t.name}`, `${dayOf(t.day).week} ${t.day}, ${t.time} · ${t.place}`);
    } else toast('As vagas acabaram');
    rerender();
    return;
  }
  const ask = e.target.closest('[data-form="ask"]');
  if (ask) {
    e.preventDefault();
    const text = $('#qtext').value.trim();
    if (!text) return;
    const id = ask.dataset.id;
    (S.asked[id] ||= []).unshift({ id: `m${Date.now()}`, who: 'Você', text, votes: 0 });
    closeOverlay(() => {
      rerender();
      toast('Pergunta enviada');
    });
    return;
  }
  const on = e.target.closest('[data-form="orgnotice"]');
  if (on) {
    e.preventDefault();
    const title = $('#ontitle').value.trim();
    const text = $('#ontext').value.trim();
    if (!title) {
      $('#ontitle').focus();
      return;
    }
    D.notices.unshift({
      time: skyClock(),
      title,
      text: text || 'Aviso da organização do ETAL.',
      fresh: true,
      org: true,
    });
    const nid = `n${Date.now()}`;
    orgSeen.add(nid);
    orgWrite((o) =>
      o.notices.unshift({ id: nid, time: skyClock(), title, text: text || 'Aviso da organização do ETAL.' }),
    );
    rerender();
    notify(title, text || 'Aviso da organização do ETAL.');
    toast('Aviso enviado para todos');
    return;
  }
  const ofm = e.target.closest('[data-form^="org"]');
  if (ofm && ['orgjog', 'orgregra', 'orgcred', 'orgequipe'].includes(ofm.dataset.form)) {
    e.preventDefault();
    const f = new FormData(ofm);
    const v = (k) => String(f.get(k) || '').trim();
    const tipo = ofm.dataset.form;
    if (tipo === 'orgjog') {
      const nome = v('nome');
      const ini = nome
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      let ok = false;
      torneioSalvar(ofm.dataset.t, (T) => {
        const i = T.players.findIndex((p) => !p);
        if (i >= 0) {
          T.players[i] = [v('nick'), nome, ini, v('pick'), `manual-${Date.now()}`];
          ok = true;
        }
      });
      rerender();
      toast(ok ? `${v('nick')} entrou na chave` : 'A chave está completa');
    }
    if (tipo === 'orgregra') {
      torneioSalvar(ofm.dataset.t, (T) => {
        T.rules = v('regras');
      });
      toast('Regras salvas');
      rerender();
    }
    if (tipo === 'orgcred') {
      const mat = v('mat');
      orgWrite((o) => {
        o.manuais = { ...(o.manuais || {}), [mat]: { nome: v('nome'), hora: skyClock() } };
        o.creds[mat] = skyClock();
      });
      rerender();
      toast(`${v('nome').split(' ')[0]} credenciado às ${skyClock()}`);
    }
    if (tipo === 'orgequipe') {
      orgWrite((o) => {
        o.organizadores = [
          ...(o.organizadores || []).filter((x) => x.matricula !== v('mat')),
          { matricula: v('mat'), papel: v('papel') },
        ];
      });
      rerender();
      toast('Acesso ao painel liberado');
    }
    return;
  }
  const orf = e.target.closest('[data-form="orgroom"]');
  if (orf) {
    e.preventDefault();
    const x = byId($('#orx').value);
    const [fl, zone] = $('#ory').value.split('|');
    const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
    if (!x || !r) return;
    if (x.zone === r.zone && x.floor === r.floor) {
      toast('A atividade já está nessa sala');
      return;
    }
    const from = x.room;
    Object.assign(x, { floor: r.floor, zone: r.zone, room: r.name });
    const msg = `${x.short}: agora em ${r.name}, ${floorOf(r.floor).label}`;
    D.notices.unshift({
      time: skyClock(),
      title: 'Mudança de sala',
      text: `${msg}. Antes era ${from}.`,
      fresh: true,
      org: true,
    });
    const nid = `n${Date.now()}`;
    orgSeen.add(nid);
    orgWrite((o) => {
      o.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name };
      o.notices.unshift({
        id: nid,
        time: skyClock(),
        title: 'Mudança de sala',
        text: `${msg}. Antes era ${from}.`,
        to: `inscritos em ${x.short}`,
      });
    });
    rerender();
    notify('Mudança de sala', msg, x.id);
    toast('Sala trocada e inscritos avisados');
    return;
  }
  const gf = e.target.closest('[data-form="guest"]');
  if (gf) {
    e.preventDefault();
    const err = $('#lgerr');
    const say = (m, el) => {
      err.textContent = m;
      err.hidden = false;
      el?.focus();
      lgShake();
    };
    const v = {
      name: $('#gname').value.trim(),
      email: $('#gmail').value.trim(),
      kind: (gf.querySelector('[name=gkind]:checked') || {}).value,
      inst: $('#ginst').value.trim(),
      city: $('#gcity').value.trim(),
    };
    err.hidden = true;
    err.classList.remove('ok');
    if (v.name.split(/\s+/).length < 2)
      return say('Escreva o nome e o sobrenome, como devem sair no crachá.', $('#gname'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      return say('Confira o e-mail: é por ele que chega o certificado.', $('#gmail'));
    if (!v.city) return say('Informe a sua cidade.', $('#gcity'));
    if (!$('#gok').checked) return say('Para criar a conta, é preciso concordar com o uso dos dados.', $('#gok'));
    if (API) {
      /* Visitante de verdade: o servidor manda um link de entrada para o e-mail. */
      const btn = $('button[type="submit"]', gf);
      btn?.classList.add('loading');
      try {
        const j = await API.post('/api/auth/visitante', {
          nome: v.name,
          email: v.email,
          instituicao: v.inst || null,
          cidade: v.city,
        });
        err.classList.add('ok');
        err.hidden = false;
        err.innerHTML = j.link
          ? `Link de teste (sem e-mail configurado): <a href="${esc(j.link)}">entrar</a>`
          : `Pronto! Enviamos um link de entrada para <b>${esc(v.email)}</b>. Abra o e-mail neste aparelho.`;
      } catch (x) {
        say(x.message);
      } finally {
        btn?.classList.remove('loading');
      }
      return;
    }
    const prof = guestProfile(v);
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile(prof);
    store.set(SAVE_KEY, prof);
    prefs.set('etal-visitante', JSON.stringify(prof));
    lgFilled(prof);
    return;
  }
  const f = e.target.closest('[data-form="login"]');
  if (!f) return;
  e.preventDefault();
  const btn = $('button[type="submit"]', f);
  const err = $('#lgerr');
  const say = (m) => {
    err.textContent = m;
    err.hidden = false;
    lgShake();
  };
  const mat = $('#mat').value.trim();
  const pwd = $('#pwd').value;
  err.hidden = true;
  if (!mat || !pwd) {
    say('Informe a matrícula e a senha.');
    return;
  }
  btn.classList.add('loading');
  btn.disabled = true;
  const state = $('[data-live="state"]');
  if (state) state.textContent = 'Consultando o SUAP…';
  $('.login')?.classList.add('asking');
  try {
    if (API) {
      /* Servidor do ETAL: pede o token JWT ao SUAP, lê o perfil e abre a sessão. A senha não fica guardada. */
      /* Na abertura do evento muita gente entra junto: se a fila do SUAP estiver cheia, o servidor responde 503 com
         Retry-After e o app espera esses segundos (contando na tela) e tenta de novo, sem a pessoa fazer nada, por até
         4 minutos (no teste de carga com 700 pessoas e o SUAP lento, a última entrou em pouco mais de 2). */
      const desde = Date.now();
      for (;;) {
        try {
          await API.post('/api/auth/suap/senha', { matricula: mat, senha: pwd });
          break;
        } catch (x) {
          if (x.status === 503 && x.retryAfter && Date.now() - desde < 240000) {
            for (let s = x.retryAfter; s > 0; s--) {
              if (state) state.textContent = `Muita gente entrando agora. Tentando de novo em ${s} s…`;
              await new Promise((ok) => setTimeout(ok, 1000));
            }
            if (state) state.textContent = 'Consultando o SUAP…';
            continue;
          }
          say(x.message);
          return;
        }
      }
      const me = await API.get('/api/eu');
      apiState(me);
      lgFilled(D.person);
      return;
    }
    const r = await fetch('api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula: mat, senha: pwd }),
    });
    const j = await r.json().catch(() => {
      throw new TypeError('sem servidor');
    });
    if (!r.ok) {
      say(j.erro || 'Não foi possível entrar.');
      if (r.status >= 500) $('#lgdemo')?.removeAttribute('hidden');
      return;
    }
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile({ ...DEMO_PERSON, ...j.perfil });
    store.set(SAVE_KEY, j.perfil);
    lgFilled(D.person);
  } catch (_) {
    say(
      navigator.onLine === false
        ? 'Sem internet agora. Entre como visitante ou tente de novo quando a conexão voltar.'
        : 'Não foi possível falar com o servidor local. Abra o protótipo por server.py para usar o SUAP, ou entre como visitante.',
    );
    $('#lgdemo')?.removeAttribute('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    $('.login')?.classList.remove('asking');
  }
});

$('#skyr')?.addEventListener('input', (e) => {
  cancelAnimationFrame(skyAnim);
  horaManual = true;
  skyHour = +e.target.value;
  applySky();
});
/* Resposta imediata ao toque em tudo que é clicável. */
const PRESS = '[data-act],[data-go],a,.btn';
let pressed = null;
const unpress = () => {
  if (pressed) {
    pressed.classList.remove('is-press');
    pressed = null;
  }
};
device.addEventListener(
  'pointerdown',
  (e) => {
    const t = e.target.closest(PRESS);
    if (t && !t.matches('canvas,.ov-backdrop')) {
      unpress();
      pressed = t;
      t.classList.add('is-press');
    }
  },
  { passive: true },
);
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => device.addEventListener(n, unpress, { passive: true }));
device.addEventListener('scroll', unpress, { passive: true, capture: true });
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flip')) {
    e.preventDefault();
    e.target.click();
  }
});
