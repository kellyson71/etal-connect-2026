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
/* Perfil em passos: cada passo é uma escolha rápida (toques, quase sem digitar), na ordem do que mais ajuda um colega a te
   achar. A barra de progresso e o crachá ao vivo no topo puxam para completar; na primeira vez, "Agora não" fica pequeno
   embaixo do botão principal, e o convite não volta depois. */
const ctPasso = (n, parte, titulo, dica, corpo, c) =>
  `<section class="ct-sec ct-passo ${CARD_PARTES.find(([k]) => k === parte)?.[1](c) ? 'feito' : ''}" data-parte="${parte}"><h3><span class="ct-n">${n}</span><span class="ct-tt"><b>${titulo}</b>${dica ? `<small>${dica}</small>` : ''}</span><i class="ct-ok">${ic('check')}</i></h3>${corpo}</section>`;
const ctProg = (c) => {
  const p = cardProgresso(c);
  const falta = CARD_PARTES.find(([, f]) => !f(c));
  const prox = {
    nadic: 'Comece dizendo se você é do NADIC',
    areas: 'Agora seus interesses: é o que mais ajuda a te achar',
    langs: 'Marque as linguagens que você usa',
    open: 'Conte o que você procura no evento',
    contato: 'Deixe um jeito de falarem com você',
    bio: 'Uma frase sobre você e pronto',
  }[falta?.[0]];
  return `<div class="ct-prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div><p><b>${p === 100 ? 'Perfil completo!' : `${p}% completo`}</b><small>${p === 100 ? 'Seu crachá está com a sua cara.' : prox}</small></p>`;
};
Screens.cartao = (pp = {}) => {
  const c = cardGet() || { publish: true, email: D.person.email || '', nadic: '', langs: [], areas: [], open: [] };
  const intro = !!pp.intro;
  const temas = `<div class="ct-temas">${CRACHA_TEMAS.map(([v, t]) => `<label class="ct-tema"><input type="radio" name="tema" value="${v}" ${(c.tema || '') === v ? 'checked' : ''}><span class="bxt-${v || 'etal'}"><i></i>${t}</span></label>`).join('')}</div>`;
  return {
    html: `${header(intro ? '' : 'Editar perfil')}
      <form class="ct-form pad ct-guiado" id="ct-form" data-form="cartao" novalidate>
        ${intro ? `<div class="ct-hello st" ${st(0)}><small>Leva 1 minuto</small><h2>Monte seu perfil do ETAL</h2><p>Quem ler o QR do seu crachá vê seus interesses e como falar com você. É assim que se acha dupla, estágio e grupo de estudo.</p></div>` : ''}
        <div class="ct-preview st" ${st(1)}>${cardPreview(c)}</div>
        <div class="ct-prog st" ${st(1)}>${ctProg(c)}</div>
        ${intro ? '' : `<div class="st" ${st(2)}>${cartaoEu()}</div>`}
        ${ctPasso(1, 'nadic', 'Você é do NADIC?', '', `<div class="ct-seg ct-seg-big">${CARD_NADIC.map(([v, t]) => `<label><input type="radio" name="nadic" value="${v}" ${c.nadic === v ? 'checked' : ''}><span>${v === 'bolsista' ? '<img src="assets/nadic-logo.svg" alt="">' : ''}${t}</span></label>`).join('')}</div>`, c)}
        ${ctPasso(2, 'areas', 'O que te interessa?', 'Toque em quantos quiser', cardChips('areas', CARD_AREAS, c.areas), c)}
        ${ctPasso(3, 'langs', 'Linguagens que você usa', 'Mesmo que esteja começando', cardChips('langs', CARD_LANGS, c.langs), c)}
        ${ctPasso(4, 'open', 'Está aberto a…', '', cardChips('open', CARD_OPEN, c.open), c)}
        ${ctPasso(
          5,
          'contato',
          'Como falar com você',
          'Só aparece para quem você deixar ver',
          `<label class="ct-field">${ic('phone')}<input name="phone" type="tel" inputmode="tel" maxlength="20" placeholder="WhatsApp ou telefone" value="${esc(c.phone || '')}" autocomplete="tel"></label>
          <label class="ct-field">${ic('mail')}<input name="email" type="email" maxlength="80" placeholder="E-mail" value="${esc(c.email || '')}" autocomplete="email"></label>
          <label class="ct-field">${ic('link')}<input name="link" maxlength="80" placeholder="GitHub, LinkedIn ou portfólio" value="${esc(c.link || '')}" autocomplete="url"></label>`,
          c,
        )}
        ${ctPasso(6, 'bio', 'Uma frase sobre você', '', `<label class="ct-field area"><textarea name="bio" maxlength="140" rows="2" placeholder="Ex.: Curto jogos e estou aprendendo Godot.">${esc(c.bio || '')}</textarea><em class="ct-count">${(c.bio || '').length}/140</em></label>`, c)}
        <section class="ct-sec ct-extra st"><h3><span class="ct-n">${ic('id')}</span><span class="ct-tt"><b>Fundo do crachá</b><small>Aparece quando você mostra o crachá</small></span></h3>${temas}</section>
        <label class="ct-switch st"><span><b>Perfil visível</b><small>Para quem buscar seu nome ou ler seu QR</small></span><input type="checkbox" name="publish" ${c.publish !== false ? 'checked' : ''}><i></i></label>
      </form>
      <div class="cta-bar ct-barra ${intro ? 'intro' : ''}"><button class="btn primary big" type="submit" form="ct-form">${ic('check')}Salvar perfil</button>${intro ? '<button class="ct-depois" type="button" data-act="cartao-pular">Agora não</button>' : ''}</div>`,
    mount: (page) => {
      const f = $('[data-form="cartao"]', page);
      if (!f) return;
      const live = () => {
        const v = cardRead(f);
        $('.ct-preview', page).innerHTML = cardPreview(v);
        $('.ct-count', page).textContent = `${v.bio.length}/140`;
        $('.ct-prog', page).innerHTML = ctProg(v);
        page
          .querySelectorAll('.ct-passo')
          .forEach((el) => el.classList.toggle('feito', !!CARD_PARTES.find(([k]) => k === el.dataset.parte)?.[1](v)));
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
        if (!cardSave(v)) {
          toast('Não foi possível salvar neste aparelho.');
          return;
        }
        buzz(14);
        const p = cardProgresso(v);
        toast(
          !v.publish ? 'Perfil salvo, mas oculto' : p === 100 ? 'Perfil completo!' : `Perfil salvo (${p}% completo)`,
        );
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
      <div class="net-actions st" ${st(1)}><button class="btn primary" data-act="scan" data-mode="ler">${ic('qr')}Ler QR de um colega</button><button class="btn soft" data-act="scan" data-mode="meu">Mostrar meu crachá</button><button class="btn soft" data-go="pessoas">${ic('search')}Encontrar pelo nome</button></div>
    </div>`,
});

Screens.credential = () => {
  const ok = !!S.credAt;
  return {
    html: `${header('Credencial')}
      <div class="pad stack cred">
        <section class="cred-cracha st ${ok ? '' : 'pending'}" ${st(0)}>${crachaGrande(D.person, cardGet() || {}, { qrHtml: `${qr()}${ok ? '' : `<span class="qr-lock">${ic('lock')}</span>`}`, legenda: ok ? `${ic('check')}Credenciado às ${S.credAt} · ${esc(D.person.id)}` : `Credenciamento pendente · ${esc(D.person.id)}` })}</section>
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
