/* app/07-inicio-e-agenda.js · início e agenda.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
Screens.home = () => {
  const s = byId('react-native');
  const here = S.present[s.id];
  const next = D.enrolled.map(byId).filter((x) => x.id !== s.id);
  const speakers = speakersList();
  /* atalhos numa fileira só; Mapa e Avisos já estão na barra de baixo e no sino */
  const actions = [
    ['cal', 'Programação', 'data-act="tab" data-tab="agenda"'],
    ['mic', 'Palestrantes', 'data-go="speakers"'],
    ['file', 'Materiais', 'data-go="materials"'],
    ['award', 'Certificados', 'data-go="certificates"'],
    ['contact', 'Contatos', 'data-go="network"'],
    ['trophy', 'Campeonatos', 'data-go="games"'],
  ];
  return {
    sky: UI.sky,
    mount: mountHome,
    html: `<section class="${UI.sky ? 'hm-sky' : 'hm-plain'}">${UI.sky ? skyArt() : ''}
          <header class="apphead"><span class="wm ${UI.sky ? 'on-sky' : ''}">${mark('mark xs')}<b>etal</b><span>connect</span></span>
          <span class="hd-acts"><button class="iconbtn ${UI.sky ? 'on-sky' : ''}" data-act="tema" aria-label="${isDark() ? 'Usar o tema claro' : 'Usar o tema escuro'}">${ic(isDark() ? 'sun' : 'moon')}</button>
          <button class="iconbtn ${UI.sky ? 'on-sky' : ''}" data-go="notices" aria-label="Avisos, ${D.notices.filter((n) => n.fresh).length} novos">${ic('bell')}<u class="badge-num">${D.notices.filter((n) => n.fresh).length}</u></button>${profileShortcut()}</span></header>
        </section>
        <div class="pad stack home">
          ${badge()}
          ${UI.home.live ? `<button class="hm-live st" ${st(1)} aria-live="polite"><span class="hm-live-tag"><i></i>Ao vivo</span><span class="hm-live-row"><span class="hm-live-msg"></span></span>${ic('chev')}</button>` : ''}

          <div class="sec st" ${st(2)}><h2>Agora</h2><span>Qua, 26 nov · <span id="nowclock">${skyClock()}</span></span></div>
          <article class="now st" ${st(3)} data-go="activity" data-id="${s.id}">
            <div class="now-top"><span class="kind">${s.type}${S.saved.has(s.id) ? ' · sua inscrição' : ''}</span>${here ? `<span class="tag ok">${ic('check')}Presente</span>` : ic('chev', 'i now-chev')}</div>
            <h3>${s.title}</h3>
            <div class="now-sp">${spAv(s)}<span>${s.speakerShort}</span></div>
            <p class="m">${ic('clock')}${s.time} às ${s.end}</p>
            <p class="m">${ic('pin')}${whereOf(s)}</p>
            <div class="now-actions">
              ${
                here
                  ? `<button class="btn primary" data-go="activity" data-id="${s.id}">Abrir aula</button>`
                  : `<button class="btn primary" data-act="openmap" data-floor="${s.floor}" data-zone="${s.zone}">Como chegar</button><button class="btn soft" data-act="scan">${ic('qr')}Presença</button>`
              }
            </div>
          </article>
          ${UI.home.atalhos ? `<nav class="quick rv" aria-label="Atalhos">${actions.map(([i, t, a], n) => `<button ${a} style="--n:${n}"><span>${ic(i)}</span><em>${t}</em></button>`).join('')}</nav>` : ''}

          ${!standalone() && !prefs.get('etal-instalar-oculto') ? `<div class="instalar rv"><button class="inst-main" data-act="install">${ic('download')}<span><b>Instale o ETAL Connect</b><small>Lembretes no celular e mapa sem internet</small></span></button><button class="inst-x" data-act="instalar-fechar" aria-label="Agora não">${ic('x')}</button></div>` : ''}
          ${cardAsk() ? `<div class="ct-invite rv"><button class="ct-inv-main" data-go="cartao">${ic('contact')}<span><b>Personalize seu perfil</b><small>Interesses, NADIC e contato</small></span></button><button class="ct-inv-skip" data-act="cartao-pular">Pular</button></div>` : ''}
          ${UI.home.colmeia ? combCard() : ''}

          ${
            UI.home.agenda
              ? `<div class="sec rv"><h2>Sua agenda</h2><button data-act="mine">Ver tudo</button></div>
          <ul class="next rv">${next
            .map(
              (
                n,
              ) => `<li data-go="activity" data-id="${n.id}"><span class="date"><small>${dayOf(n.day).week}</small><b>${n.day}</b></span><span class="next-tx"><b>${n.short}</b><small>${n.time} · ${n.room}</small></span>
            <button class="remind ${S.reminders.has(n.id) ? 'on' : ''}" data-act="remind" data-id="${n.id}" aria-pressed="${S.reminders.has(n.id)}" aria-label="Lembrar 10 minutos antes">${ic('alarm')}</button></li>`,
            )
            .join('')}</ul>`
              : ''
          }

          ${
            UI.home.palestrantes
              ? `<div class="sec rv"><h2>Palestrantes</h2><button data-go="speakers">Ver todos</button></div>
          <div class="people rv">${speakers.map((o) => `<button data-go="speaker" data-id="${o.id}">${spAv(o, true)}<b>${o.speakerShort.split(' ')[0]}</b><small>${o.type}</small></button>`).join('')}</div>`
              : ''
          }

          <footer class="made rv">
            <div><small>Desenvolvido por</small><button data-go="nadic" aria-label="Sobre o NADIC"><img src="assets/nadic-logo.svg" alt="NADIC" width="64" height="28"></button></div>
            <i></i>
            <div><small>Em parceria com</small><span><a href="${D.ifrnUrl}" target="_blank" rel="noopener" aria-label="IFRN Campus Pau dos Ferros, abre em nova aba" class="made-ifrn">IFRN</a><button data-go="etal" aria-label="O que é o ETAL">${mark('mark xs')}<b>etal</b></button></span></div>
          </footer>
        </div>`,
  };
};

function savedEmpty(day) {
  const d = dayOf(day);
  const week = d.long.split(',')[0].toLowerCase();
  const others = D.days
    .filter((x) => x.day !== day)
    .map((x) => [x, D.sessions.filter((q) => q.day === x.day && S.saved.has(q.id)).length])
    .filter(([, n]) => n);
  const ideas = D.sessions.filter((q) => q.day === day && !q.simple).slice(0, 3);
  return `<div class="empty-saved">
      ${illo('mark')}
      <h3 class="st" ${st(1)}>Nada salvo na ${week}</h3>
      <p class="st" ${st(2)}>Toque no marcador de uma atividade e ela entra na sua agenda.</p>
      ${others.length ? `<div class="es-days st" ${st(3)}>${others.map(([x, n]) => `<button data-act="day" data-day="${x.day}">${x.week} ${x.day}<b>${n} ${n === 1 ? 'salva' : 'salvas'}</b></button>`).join('')}</div>` : ''}
      ${ideas.length ? `<section class="es-ideas st" ${st(4)}><h4>Sugestões para esse dia</h4><ul>${ideas.map((q) => `<li ${goOf(q)}><time>${q.time}</time><span><b>${q.short}</b><small>${q.type} · ${q.room}</small></span><button class="bm" data-act="save" data-id="${q.id}" aria-label="Salvar ${q.short}">${ic('bookmark')}</button></li>`).join('')}</ul></section>` : ''}
      <button class="btn soft st" ${st(5)} data-act="filter" data-f="all">Ver toda a programação</button>
    </div>`;
}
Screens.agenda = () => {
  const day = S.agendaDay,
    f = S.agendaFilter;
  let list = D.sessions.filter((s) => s.day === day);
  if (['pal', 'mesa', 'mini', 'camp'].includes(f)) list = list.filter((s) => tipoDe(s).g === f);
  if (f === 'saved') list = list.filter((s) => S.saved.has(s.id) || s.speakerId === String(D.person.id));
  /* vindo do mapa: só as atividades de um lugar (prédio, auditório, pátio) */
  const lugar = S.agendaLugar;
  if (lugar) list = list.filter((s) => lugar.ids.includes(s.id));
  const slots = [...new Set(list.map((s) => s.time))];
  const idx = D.days.findIndex((d) => d.day === day);
  const filters = [
    ['all', 'Tudo'],
    ['saved', 'Minhas'],
    ['pal', 'Palestras'],
    ['mesa', 'Mesas'],
    ['mini', 'Minicursos'],
    ['camp', 'Campeonatos'],
  ].filter(([k]) => !TIPOS_G.has(k) || D.sessions.some((x) => tipoDe(x).g === k));
  /* Cada tipo tem a sua cor (a mesma do filtro) e a fileira é curta: tipo e até que horas, título, quem e onde, vagas. */
  const tp = (k) => (TIPOS_G.has(k) ? k : 'out');
  /* Card no padrão dos apps de evento (Whova, Sched, Google I/O): título forte, uma linha só com quem e onde, o
       marcador à direita. O tipo aparece no hexágono colorido (as cores são as dos hexágonos do logo do ETAL), não em
       texto; a legenda das cores são os filtros logo acima. Vagas só aparecem quando acabando ou esgotadas. */
  const bm = (s) =>
    `<button class="bm ${S.saved.has(s.id) ? 'on' : ''}" data-act="save" data-id="${s.id}" aria-label="${S.saved.has(s.id) ? 'Remover dos salvos' : 'Salvar'}">${ic('bookmark')}</button>`;
  const hexa = (s) =>
    `<span class="ses-hex" role="img" aria-label="${s.type}"><svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0-18.5 16-9.25v18.5L0 18.5-16 9.25v-18.5Z"/></svg>${ic(tipoDe(s).icon)}</span>`;
  const selo = (s) => {
    /* "agora" já aparece na linha do tempo */ if (!s.seats) return '';
    const n = s.seats - s.taken;
    return n <= 0
      ? '<span class="ses-selo cheio">Esgotado</span>'
      : n <= 5
        ? `<span class="ses-selo pouca">${n === 1 ? 'Última vaga' : `Últimas ${n}`}</span>`
        : '';
  };
  const rosto = (s) => {
    if (!s.initials && !s.speakerShort) return '';
    const ps = pessoasDe(s);
    return ps.length > 1
      ? `<span class="ses-rostos">${ps
          .slice(0, 3)
          .map((p) => spAv(p))
          .join('')}</span>`
      : spAv(s);
  };
  const card = (s, quem) =>
    `<li class="ses tp-${tipoDe(s).k} ${S.saved.has(s.id) || s.speakerId === String(D.person.id) ? 'mine' : ''}" ${goOf(s)}>${hexa(s)}<div class="ses-tx"><h4>${s.title}</h4><p class="ses-meta">${rosto(s)}${quem ? `<span class="ses-quem">${quem}</span>` : ''}<span class="ses-onde">${s.room}</span></p>${selo(s)}</div>${bm(s)}</li>`;
  /* selo curto do campeonato: só o que importa para decidir (vagas, ao vivo, fim) */
  const chipCurto = (stt) => {
    const [k, l] = window.TOUR.status(stt);
    const curto = (l.match(/\d+ vagas?/) || [l.split(' · ')[0]])[0];
    return `<span class="t-chip ${k}">${k === 'live' ? '<i></i>' : ''}${curto}</span>`;
  };
  const CARDS = {
    pal: (s) => card(s, s.speakerShort),
    mesa: (s) => card(s, ''), // os rostos já dizem quem conversa
    mini: (s) => card(s, s.speakerShort),
    /* campeonato: a arte do jogo (o banner do FIFA, a do Mortal Kombat) é o card */
    camp: (s) => {
      const t = D.tournaments.find((x) => x.id === s.tournament);
      if (!t) return CARDS.out(s);
      const stt = tourSt(t);
      const me = tourMine(stt) >= 0;
      return `<li class="ses-camp ${t.theme}" ${goOf(s)}>${gameArt(t)}<span class="ses-camp-tx">${titleOf(t)}<small>${s.room} · ${t.format}</small></span><span class="ses-camp-chip">${me ? `<span class="t-chip me">${ic('check')}Na chave</span>` : chipCurto(stt)}</span></li>`;
    },
    out: (s) => card(s, s.speakerShort || s.type),
  };
  const row = (s) => (CARDS[tipoDe(s).g] || CARDS.out)(s);
  const agora = list.filter(isNow).length;
  const meus = D.sessions.filter((x) => x.day === day && S.saved.has(x.id)).length;
  const dia = dayOf(day);
  return {
    html: `<header class="apphead"><h1 class="title">Agenda</h1><button class="iconbtn" data-act="finder" aria-label="Buscar">${ic('search')}</button></header>
      <div class="pad stack agenda">
        <div class="days st" style="--i:0;--k:${idx}"><i class="days-ind"></i>${D.days.map((d) => `<button class="${d.day === day ? 'on' : ''}" data-act="day" data-day="${d.day}">${d.week}<b>${d.day}</b></button>`).join('')}</div>
        <p class="ag-resumo st" ${st(1)}><b>${dia.long ? dia.long.split(',')[0] : dia.week}</b><span>${list.length} ${list.length === 1 ? 'atividade' : 'atividades'}${agora ? ` · <em>${agora} agora</em>` : ''}${meus ? ` · ${meus} ${meus === 1 ? 'sua' : 'suas'}` : ''}</span></p>
        ${lugar ? `<p class="ag-lugar st" ${st(1)}>${ic('map')}<span>Só no <b>${lugar.nome}</b></span><button data-act="agendaLugar" aria-label="Mostrar todos os lugares">${ic('x')}</button></p>` : ''}
        <div class="chips ag-chips st" ${st(1)}>${filters.map(([k, t]) => `<button class="${k === f ? 'on' : ''} f-${tp(k)}" data-act="filter" data-f="${k}">${TIPOS_G.has(k) ? '<i></i>' : ''}${k === 'saved' ? ic('bookmark') : ''}${t}</button>`).join('')}</div>
        <div class="agenda-list ag-trilho" data-swap>
        ${
          slots.length
            ? slots
                .map((t, si) => {
                  const noSlot = list.filter((s) => s.time === t);
                  const vivo = noSlot.some(isNow);
                  return `<div class="slot st ${vivo ? 'now' : ''}" ${st(2 + si)}><time>${t}${vivo ? '<em>agora</em>' : ''}</time><div>${noSlot.filter((s) => S.saved.has(s.id)).length > 1 ? `<p class="clash">${ic('info')}Você salvou mais de uma atividade neste horário.</p>` : ''}<ul class="ag">${noSlot.map(row).join('')}</ul></div></div>`;
                })
                .join('')
            : f === 'saved'
              ? savedEmpty(day)
              : `<div class="empty st" ${st(2)}>${illo('mark')}<h3>Nada neste dia</h3><p>Escolha outro filtro para ver mais atividades.</p><button class="btn soft" data-act="filter" data-f="all">Ver tudo</button></div>`
        }
        </div>

      </div>`,
  };
};

/* Materiais: arquivos enviados (PDF, imagem, ZIP, slides) e links (GitHub, YouTube, Drive, sites). Tocar abre o
     visualizador dentro do app; o GitHub vira um cartão com os dados públicos do repositório. */
const GH = /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i;
const YT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/i;
const matUrl = (u) => (u && u.startsWith('/api/') && API ? API.url(u) : u || '');
