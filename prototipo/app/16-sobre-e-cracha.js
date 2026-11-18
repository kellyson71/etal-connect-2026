/* app/16-sobre-e-cracha.js · sobre o protótipo, SUAP, certificados, cartão, contatos, avisos e materiais.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- o que é real e o que é exemplo neste protótipo ---- */
Screens.sobre = () => ({
  html: `${header('Sobre o aplicativo')}<div class="pad stack sobre">
    <section class="sb-card"><h2>ETAL Connect</h2><p>Programação, caminhos pelo campus e encontros em um só lugar.</p><p>VII ETAL · IFRN Campus Pau dos Ferros<br>26 a 28 de novembro de 2025</p></section>
    <ul class="menu"><li data-go="etal">${ic('cal')}<span>Conheça o ETAL</span>${ic('chev')}</li><li data-go="nadic">${ic('building')}<span>NADIC</span>${ic('chev')}</li></ul>
    <p class="note">Seu nome e sua foto podem ser personalizados no Perfil. As alterações não modificam sua conta do SUAP.</p>
    <a class="btn soft" href="https://portal.ifrn.edu.br/eventos/8528/" target="_blank" rel="noopener">Página do evento ${ic('open')}</a>
  </div>`,
});

let suapSummary = null,
  suapLoading = false;
async function loadSuapSummary() {
  if (!API || suapLoading) return;
  suapLoading = true;
  try {
    suapSummary = await API.get('/api/eu/suap');
  } catch (error) {
    suapSummary = { connected: false, message: error.message, events: [], certificates: [] };
  } finally {
    suapLoading = false;
    if (top().s === 'suapEvents') rerender();
  }
}
Screens.suapEvents = () => ({
  html: `${header('Meus eventos no SUAP')}<div class="pad stack">
      <p class="note">Eventos e certificados da sua conta. A inscrição é concluída no portal oficial do SUAP.</p>
      ${API && !suapSummary ? '<p role="status">Consultando sua sessão…</p>' : suapSummary?.connected ? `<ul class="ab-list">${suapSummary.events.map((e) => `<li><b>${esc(e.name)}</b><a href="${esc(e.url)}" target="_blank" rel="noopener">Abrir no SUAP ${ic('open')}</a></li>`).join('') || '<li>Nenhum evento encontrado nesta sessão.</li>'}</ul><h2 class="h">Certificados disponíveis</h2><ul class="ab-list">${suapSummary.certificates.map((c) => `<li><b>${esc(c.name)}</b><a class="btn soft" href="${esc(API.url('/api/eu/suap/certificados/' + encodeURIComponent(c.id)))}" target="_blank" rel="noopener">${ic('download')}Baixar PDF</a></li>`).join('') || '<li>O SUAP não disponibilizou certificados nesta sessão.</li>'}</ul>` : `<p class="note">${esc(suapSummary?.message || 'Entre com sua matrícula e senha para consultar seus eventos e certificados.')}</p>`}
      <a class="btn primary" href="https://suap.ifrn.edu.br/admin/eventos/evento/?tab=tab_participante" target="_blank" rel="noopener">Abrir meus eventos no SUAP ${ic('open')}</a>
      <a class="btn soft" href="https://suap.ifrn.edu.br/eventos/inscricao/1/8528/" target="_blank" rel="noopener">Programação original do VII ETAL ${ic('open')}</a>
    </div>`,
  mount: () => {
    if (API && !suapSummary) loadSuapSummary();
  },
});

Screens.certificates = () => {
  const rows = D.enrolled.map(byId);
  const done = rows.filter((s) => S.present[s.id]);
  const hours = done.reduce((n, s) => n + hoursOf(s), 0);
  const total = rows.reduce((n, s) => n + hoursOf(s), 0);
  return {
    html: `${header('Certificados')}<div class="pad stack"><button class="btn soft" data-go="suapEvents">Consultar certificados no SUAP ${ic('open')}</button>
        <section class="cert-top st" ${st(0)}><span class="ring big" style="--p:${total ? Math.round((hours / total) * 100) : 0}"><b>${horasTxt(hours)}h</b></span><div><strong>${horasTxt(hours)} de ${horasTxt(total)} horas</strong><span>Acompanhe suas horas de participação e consulte os certificados no SUAP.</span></div></section>
        <ul class="certs st" ${st(1)}>${rows.map((s) => `<li class="${S.present[s.id] ? 'done' : ''}" data-go="activity" data-id="${s.id}"><i>${ic(S.present[s.id] ? 'check' : 'clock')}</i><span><b>${s.short}</b><small>${S.present[s.id] ? `Presença às ${S.present[s.id]} · ${horasTxt(hoursOf(s))}h` : `${dayOf(s.day).week} ${s.day}, ${s.time} · ${horasTxt(hoursOf(s))}h`}</small></span></li>`).join('')}</ul>
      </div>`,
  };
};

/* Editar perfil: foto e nome de exibição, mais o cartão de contato (o que aparece para quem ler o QR do seu crachá).
   Tudo opcional; na primeira entrada vem como convite, com "Pular" sempre à vista na barra de baixo. */
const cartaoEu = () =>
  `<button type="button" class="ct-eu" data-act="profile-edit">${meAv('av')}<span><b>${esc(D.person.name)}</b><small>Foto e nome de exibição</small></span><span class="ct-eu-edit">${ic('pencil')}Alterar</span></button>`;
Screens.cartao = (pp = {}) => {
  const c = cardGet() || { publish: true, email: D.person.email || '', nadic: '', langs: [], areas: [], open: [] };
  const intro = !!pp.intro;
  return {
    html: `${header(intro ? 'Seu perfil' : 'Editar perfil', { right: intro ? '<button class="ct-skip" data-act="cartao-pular">Pular</button>' : '' })}
      <form class="ct-form pad" id="ct-form" data-form="cartao" novalidate>
        ${intro ? `<div class="ct-hello st" ${st(0)}><small>Opcional</small><h2>Personalize seu perfil</h2><p>Interesses e contato ajudam colegas a te encontrar pelo QR do crachá. Dá para pular e preencher depois em Perfil.</p></div>` : ''}
        <div class="st" ${st(0)}>${cartaoEu()}</div>
        <div class="ct-preview st" ${st(1)}>${cardPreview(c)}</div>
        <label class="ct-switch st" ${st(2)}><span><b>Perfil visível</b><small>Para quem tocar no seu nome ou ler seu QR</small></span><input type="checkbox" name="publish" ${c.publish !== false ? 'checked' : ''}><i></i></label>

        <section class="ct-sec st" ${st(3)}><h3>${ic('contact')}Contato</h3>
          <label class="ct-field">${ic('phone')}<input name="phone" type="tel" inputmode="tel" maxlength="20" placeholder="WhatsApp ou telefone" value="${esc(c.phone || '')}" autocomplete="tel"></label>
          <label class="ct-field">${ic('mail')}<input name="email" type="email" maxlength="80" placeholder="E-mail" value="${esc(c.email || '')}" autocomplete="email"></label>
          <label class="ct-field">${ic('link')}<input name="link" maxlength="80" placeholder="GitHub, LinkedIn ou portfólio" value="${esc(c.link || '')}" autocomplete="url"></label>
        </section>

        <section class="ct-sec st" ${st(4)}><h3><img class="ct-nadic-logo" src="assets/nadic-logo.svg" alt="">Bolsista do NADIC?</h3>
          <div class="ct-seg">${CARD_NADIC.map(([v, t]) => `<label><input type="radio" name="nadic" value="${v}" ${c.nadic === v ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
        </section>

        <section class="ct-sec st" ${st(5)}><h3>${ic('code')}Linguagens</h3>${cardChips('langs', CARD_LANGS, c.langs)}</section>
        <section class="ct-sec st" ${st(6)}><h3>${ic('sliders')}Interesses</h3>${cardChips('areas', CARD_AREAS, c.areas)}</section>
        <section class="ct-sec st" ${st(7)}><h3>${ic('flag')}Aberto a</h3>${cardChips('open', CARD_OPEN, c.open)}</section>
        <section class="ct-sec st" ${st(8)}><h3>${ic('text')}Sobre você</h3>
          <label class="ct-field area"><textarea name="bio" maxlength="140" rows="2" placeholder="Ex.: Curto jogos e estou aprendendo Godot.">${esc(c.bio || '')}</textarea><em class="ct-count">${(c.bio || '').length}/140</em></label>
        </section>

      </form>
      <div class="cta-bar ct-barra ${intro ? 'dupla' : ''}">${intro ? '<button class="btn soft big" type="button" data-act="cartao-pular">Pular por agora</button>' : ''}<button class="btn primary big" type="submit" form="ct-form">${ic('check')}Salvar</button></div>`,
    mount: (page) => {
      const f = $('[data-form="cartao"]', page);
      if (!f) return;
      const live = () => {
        const v = cardRead(f);
        $('.ct-preview', page).innerHTML = cardPreview(v);
        $('.ct-count', page).textContent = `${v.bio.length}/140`;
      };
      f.addEventListener('input', live);
      f.addEventListener('change', live);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const v = cardRead(f);
        if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) {
          toast('Confira o e-mail.');
          $('[name="email"]', f).focus();
          return;
        }
        try {
          localStorage.setItem(cardKey(D.person.id), JSON.stringify({ ...v, at: Date.now() }));
        } catch (_) {
          toast('Não foi possível salvar neste aparelho.');
          return;
        }
        cardDemoDone = true;
        buzz(14);
        toast(v.publish ? 'Perfil atualizado' : 'Perfil salvo, mas oculto');
        navBack();
      });
    },
  };
};

Screens.peer = ({ id }) => {
  const p = D.peers.find((x) => x.id === id);
  return {
    html: `${header('Contato')}<div class="pad social-card">${p ? cardPreview(p.card || {}, p, { own: false }) : communityEmpty('Perfil indisponível.')}</div>`,
  };
};
Screens.network = () => ({
  html: `${header('Contatos')}<div class="pad stack">
      ${
        S.contacts.length
          ? `<ul class="splist">${S.contacts.map((c, i) => `<li class="st" ${st(i)} ${c.card ? `data-go="peer" data-id="${esc(c.id)}"` : ''}>${c.photo ? `<span class="ava lg has-photo"><img src="${esc(c.photo)}" alt=""></span>` : `<span class="ava lg">${c.initials}</span>`}<span><b>${c.name}</b><small>${c.course}${c.nadic ? ' · NADIC' : ''}</small><em>${[c.interest, ...(c.langs || [])].join(' · ')}</em></span></li>`).join('')}</ul>`
          : `<div class="empty st" ${st(0)}>${illo('people')}<h3>Nenhum contato ainda</h3><p>Leia o QR do crachá de um colega para trocar contatos.</p></div>`
      }
      <div class="net-actions st" ${st(1)}><button class="btn primary" data-act="scan" data-mode="ler">${ic('qr')}Ler QR de um colega</button><button class="btn soft" data-act="scan" data-mode="meu">Mostrar meu QR</button></div>
    </div>`,
});

Screens.credential = () => {
  const ok = !!S.credAt;
  return {
    html: `${header('Credencial')}
      <div class="pad stack cred">
        <section class="passcard st ${ok ? '' : 'pending'}" ${st(0)}>
          <div class="b-top"><span class="b-mark">etal<i></i></span><svg class="pins" viewBox="0 0 60 20" aria-hidden="true"><path d="M8 20V9M30 20V9M52 20V9"/><circle cx="8" cy="5.5" r="3.4"/><circle cx="30" cy="5.5" r="3.4"/><circle cx="52" cy="5.5" r="3.4"/></svg></div>
          <div class="pass-id">${meAv('av xl')}<strong>${esc(D.person.name)}</strong><span>${esc(D.person.courseFull)}</span></div>
          <div class="qrbox">${qr()}${ok ? '' : `<div class="qr-lock">${ic('lock')}</div>`}</div>
          <div class="pass-foot"><span class="state ${ok ? 'ok' : 'pend'}">${ok ? `${ic('check')}Confirmado` : 'Pendente'}</span><span class="mono">${esc(D.person.id)}</span></div>
        </section>
        ${
          ok
            ? `<p class="note st" ${st(1)}>Mostre este código quando a organização pedir.</p>`
            : `<button class="btn primary big st" ${st(1)} data-act="scan">${ic('qr')}Ler QR da recepção</button>`
        }
      </div>`,
  };
};

Screens.notices = () => ({
  html: `${header('Avisos')}
      <div class="pad stack"><ul class="notes">${D.notices.map((n, i) => `<li class="st ${n.fresh ? 'fresh' : ''}" ${st(i)}><time>${n.time}</time><h4>${esc(n.title)}${n.org ? '<em class="org-tag">Organização</em>' : ''}</h4><p>${esc(n.text)}</p></li>`).join('')}</ul></div>`,
});

Screens.materials = () => {
  const ids = Object.keys(S.present);
  return {
    html: `${header('Materiais')}
      <div class="pad stack">${
        ids.length
          ? ids
              .map((id, k) => {
                const s = byId(id);
                return `<section class="st" ${st(k)}><h2 class="h">${s.short}</h2></section><ul class="mats">${s.materials.map(materialRow).join('')}</ul>`;
              })
              .join('')
          : `<div class="empty st" ${st(0)}>${illo('file')}<h3>Nenhum material ainda</h3><p>Os arquivos de cada aula aparecem aqui depois que você registrar presença na sala.</p><button class="btn soft" data-act="scan">${ic('qr')}Ler QR da sala</button></div>`
      }</div>`,
  };
};
