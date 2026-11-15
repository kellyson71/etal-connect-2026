/* Publicações compartilhadas pelo app e pelo painel. Sem servidor, ficam neste navegador (demonstração); com servidor
   (app/05-publicacoes-servidor.js), o estado vem da API neste mesmo formato e os exemplos saem. */
(() => {
  'use strict';
  const key = 'etal-comunidade-v1';
  const blank = () => ({
    posts: [],
    messages: [],
    likes: {},
    comments: {},
    bookmarks: {},
    reports: [],
    moderation: {},
    audit: [],
    mentionSeen: {},
  });
  function read() {
    let value;
    try {
      value = JSON.parse(localStorage.getItem(key));
    } catch (_) {
      /* estado local indisponível */
    }
    const result = blank();
    if (value && typeof value === 'object')
      for (const name of Object.keys(result)) {
        if (
          Array.isArray(result[name])
            ? Array.isArray(value[name])
            : value[name] && typeof value[name] === 'object' && !Array.isArray(value[name])
        )
          result[name] = value[name];
      }
    return result;
  }
  function write(change) {
    const value = read();
    change(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new Error('Não foi possível salvar. Libere espaço no navegador e tente de novo.', { cause: e });
    }
    return value;
  }
  const seeds = [
    {
      photo: 'assets/community/avatar-ana.svg',
      images: [
        {
          src: 'assets/community/encontro.jpg',
          alt: 'Pessoas reunidas em uma mesa para trocar ideias',
          caption: 'Entre uma ideia e outra',
        },
        {
          src: 'assets/community/equipe.jpg',
          alt: 'Equipe trabalhando com notebooks',
          caption: 'É melhor quando a gente cria junto',
        },
        {
          src: 'assets/community/ideias.jpg',
          alt: 'Conversa em equipe em frente a computadores',
          caption: 'Conexões que ficam',
        },
      ],
      author: 'demo-ana',
      handle: 'ana.beatriz',
      day: 27,
      activity: 'react-next',
      id: 'demo-encontro',
      name: 'Ana Beatriz',
      initials: 'AB',
      role: 'Informática · participante de exemplo',
      text: 'O melhor do ETAL também acontece entre uma atividade e outra. Quem mais veio para trocar ideias e conhecer gente nova? 🐝',
      tag: 'Conexões',
      time: 'Há pouco',
      likes: 12,
    },
    {
      photo: 'assets/community/avatar-lucas.svg',
      images: [
        {
          src: 'assets/community/projeto.jpg',
          alt: 'Notebook aberto com um projeto de programação',
          caption: 'Do primeiro código…',
        },
        {
          src: 'assets/community/equipe.jpg',
          alt: 'Grupo colaborando em uma mesa',
          caption: '…à próxima ideia em equipe',
        },
      ],
      author: 'demo-lucas',
      handle: 'lucas.gabriel',
      day: 26,
      activity: 'react-native',
      id: 'demo-projeto',
      name: 'Lucas Gabriel',
      initials: 'LG',
      role: 'ADS · participante de exemplo',
      text: 'Bora compartilhar o que estamos criando? Estou montando meu primeiro app. Quero conhecer os projetos de vocês! 💻',
      tag: 'Projetos',
      time: 'Há pouco',
      likes: 8,
    },
    {
      photo: 'assets/community/avatar-julia.svg',
      author: 'demo-julia',
      handle: 'julia.costa',
      day: 28,
      activity: 'imagens-ia',
      id: 'demo-dica',
      name: 'Júlia Costa',
      initials: 'JC',
      role: 'Informática · participante de exemplo',
      text: 'Minha dica para aproveitar o evento: salva as atividades na agenda e deixa espaço para uma boa conversa no intervalo. Qual tema vocês mais querem explorar?',
      tag: 'Dicas',
      time: 'Há pouco',
      likes: 5,
    },
  ];
  if (Array.isArray(window.DATA?.demoPosts)) seeds.splice(0, seeds.length, ...window.DATA.demoPosts);
  const seedMessages = [
    {
      id: 'demo-chat-oi',
      author: 'demo-ana',
      name: 'Ana Beatriz',
      initials: 'AB',
      photo: 'assets/community/avatar-ana.svg',
      text: 'Oi, pessoal! Quem também está por aqui para conhecer novos projetos? 👋',
      time: 'Há pouco',
    },
  ];
  const seedComments = { ...(window.DATA?.demoComments || {}) };
  let servidor = false;
  /* Com servidor: sem publicações de exemplo, e a moderação vale para todo mundo */
  function usarServidor() {
    servidor = true;
    seeds.splice(0);
    seedMessages.splice(0);
    for (const k of Object.keys(seedComments)) delete seedComments[k];
  }
  const allComments = (v, id) => [...(seedComments[id] || []), ...(v.comments[id] || [])];
  const reasons = [
    'Spam ou propaganda',
    'Ofensa ou assédio',
    'Conteúdo inadequado',
    'Informação enganosa',
    'Outro motivo',
  ];
  const uid = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const postKey = (id) => `post:${id}`;
  const commentKey = (parent, id) => `comment:${parent}:${id}`;
  const messageKey = (id) => `message:${id}`;
  const allPosts = (v) => [...v.posts, ...seeds];
  const hidden = (v, target) => !!v.moderation[target]?.hidden;
  const posts = (v) => allPosts(v).filter((p) => !hidden(v, postKey(p.id)));
  const comments = (v, id) =>
    hidden(v, postKey(id)) ? [] : allComments(v, id).filter((c) => !hidden(v, commentKey(id, c.id)));
  const messages = (v) => [...seedMessages, ...v.messages].filter((m) => !hidden(v, messageKey(m.id)));
  function contents(v) {
    const items = allPosts(v).map((p) => ({ ...p, target: postKey(p.id), type: 'Publicação', postId: p.id }));
    for (const parent of new Set([...Object.keys(seedComments), ...Object.keys(v.comments)]))
      for (const row of allComments(v, parent))
        items.push({ ...row, target: commentKey(parent, row.id), type: 'Comentário', postId: parent });
    for (const row of [...seedMessages, ...v.messages])
      items.push({ ...row, target: messageKey(row.id), type: 'Mensagem' });
    return items;
  }
  const find = (v, target) => contents(v).find((x) => x.target === target);
  function report(v, target, actor, reason, detail) {
    const content = find(v, target);
    if (!content || hidden(v, target)) throw new Error('Este conteúdo não está mais disponível.');
    if (!reasons.includes(reason)) throw new Error('Escolha o motivo da denúncia.');
    if (v.reports.some((r) => r.target === target && r.author === actor.author && r.status === 'pending'))
      throw new Error('Você já denunciou este conteúdo.');
    v.reports.unshift({
      id: uid(),
      target,
      author: actor.author,
      name: actor.name,
      reason,
      detail: String(detail || '').slice(0, 500),
      created: Date.now(),
      status: 'pending',
      snapshot: { name: content.name, text: content.text, type: content.type },
    });
  }
  function moderate(v, target, action, actor, note = '') {
    if (!['hide', 'restore', 'dismiss'].includes(action)) throw new Error('Ação desconhecida.');
    if (action !== 'dismiss' && !find(v, target)) throw new Error('O conteúdo foi excluído pelo autor.');
    const at = Date.now();
    const trimmed = String(note).trim().slice(0, 240);
    if (action !== 'dismiss') v.moderation[target] = { hidden: action === 'hide', by: actor, at, note: trimmed };
    for (const report of v.reports)
      if (report.target === target && report.status === 'pending')
        Object.assign(report, {
          status: action === 'hide' ? 'hidden' : 'dismissed',
          reviewedBy: actor,
          reviewedAt: at,
          note: trimmed,
        });
    v.audit.unshift({ id: uid(), target, action, by: actor, at, note: trimmed });
    v.audit = v.audit.slice(0, 100);
  }
  function removePost(v, id, actor, moderator = false) {
    const post = allPosts(v).find((p) => p.id === id);
    if (!post || hidden(v, postKey(id))) throw new Error('Esta publicação não está mais disponível.');
    if (post.author !== actor.author) {
      if (!moderator) throw new Error('Você só pode excluir sua própria publicação.');
      moderate(v, postKey(id), 'hide', actor.name, 'Excluída diretamente nas publicações.');
      return;
    }
    // O autor remove seu próprio conteúdo; a moderação mantém histórico e restauração.
    v.posts = v.posts.filter((p) => p.id !== id);
    for (const user of Object.keys(v.bookmarks)) v.bookmarks[user] = v.bookmarks[user].filter((pid) => pid !== id);
    delete v.comments[id];
    delete v.likes[id];
  }
  const esc = (text) =>
    String(text ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  function moderationHTML(v, filter = 'pending') {
    const pending = v.reports.filter((r) => r.status === 'pending');
    const rows =
      filter === 'pending'
        ? [...new Set(pending.map((r) => r.target))]
        : filter === 'history'
          ? []
          : contents(v)
              .filter((item) => filter !== 'hidden' || hidden(v, item.target))
              .map((item) => item.target);
    return `<section class="social-moderation"><p class="social-note">${servidor ? 'Revisão da organização · vale para todos no app.' : 'Revisão local · as ações valem para este navegador.'}</p><nav class="social-mod-tabs" aria-label="Filtrar moderação">${[
      ['pending', `Denúncias (${pending.length})`],
      ['hidden', 'Ocultos'],
      ['all', 'Conteúdos'],
      ['history', 'Histórico'],
    ]
      .map(
        ([id, label]) =>
          `<button data-act="social-mod-filter" data-filter="${id}" aria-pressed="${id === filter}">${label}</button>`,
      )
      .join('')}</nav>
      ${
        filter === 'history'
          ? v.audit.length
            ? v.audit
                .map(
                  (entry) =>
                    `<article class="social-mod-card"><b>${{ hide: 'Conteúdo ocultado', restore: 'Conteúdo restaurado', dismiss: 'Denúncia arquivada' }[entry.action]}</b><p>${esc(entry.by)} · ${new Date(entry.at).toLocaleString('pt-BR')}</p><small>${esc(find(v, entry.target)?.text || 'Conteúdo excluído pelo autor')}</small>${entry.note ? `<p>${esc(entry.note)}</p>` : ''}</article>`,
                )
                .join('')
            : '<p class="social-empty">Nenhuma ação registrada.</p>'
          : rows.length
            ? rows
                .map((target) => {
                  const item = find(v, target);
                  const reports = v.reports.filter((r) => r.target === target && r.status === 'pending');
                  const removed = hidden(v, target);
                  return `<article class="social-mod-card" data-mod-target="${esc(target)}"><header><b>${esc(item?.type || reports[0]?.snapshot?.type || 'Conteúdo excluído')} · ${esc(item?.name || reports[0]?.snapshot?.name || '')}</b><small>${removed ? 'Oculto' : item ? 'Visível' : 'Excluído pelo autor'}</small></header><p class="social-mod-text">${esc(item?.text || reports[0]?.snapshot?.text || 'Publicação com fotos')}</p>${(
                    item?.images || []
                  )
                    .slice(0, 2)
                    .map(
                      (img) =>
                        `<img class="social-mod-thumb" src="${esc(img.src)}" alt="${esc(img.alt || 'Foto anexada')}">`,
                    )
                    .join('')}
          ${reports.map((r) => `<div class="social-mod-report"><b>${esc(r.reason)}</b><p>${esc(r.detail)}</p><small>${esc(r.name)} · ${new Date(r.created).toLocaleString('pt-BR')}</small></div>`).join('')}
          <label>Nota da revisão<input data-mod-note maxlength="240" placeholder="Opcional, para a equipe"></label><footer>${item ? `<button data-act="social-mod" data-target="${esc(target)}" data-action="${removed ? 'restore' : 'hide'}">${removed ? 'Restaurar conteúdo' : 'Ocultar conteúdo'}</button>` : ''}${reports.length ? `<button data-act="social-mod" data-target="${esc(target)}" data-action="dismiss">Arquivar denúncia${reports.length > 1 ? 's' : ''}</button>` : ''}</footer></article>`;
                })
                .join('')
            : '<p class="social-empty">Nada para revisar aqui.</p>'
      }</section>`;
  }
  function currentActivity({ sessions, day, time, present = {}, saved = [], lastCheckin = null, now = Date.now() }) {
    const minutes = (t) => {
      const [h, m] = String(t || '')
        .split(':')
        .map(Number);
      return h * 60 + m;
    };
    const eligible = (a) => a && a.type !== 'Credenciamento';
    const recent = (a, at) => {
      const age = now - Number(at);
      const duration = Math.max(30, minutes(a.end) - minutes(a.time));
      return Number.isFinite(age) && age >= 0 && age <= (duration + 30) * 60000;
    };
    const checked = sessions.find((a) => a.id === lastCheckin?.id && eligible(a) && present[a.id]);
    if (checked && recent(checked, lastCheckin.at)) return { activity: checked, reason: 'qr' };
    const active = sessions.filter((a) => eligible(a) && a.day === day && a.time <= time && time < a.end);
    const attended = active
      .filter((a) => present[a.id] && (a.id !== lastCheckin?.id || recent(a, lastCheckin.at)))
      .sort((a, b) => minutes(present[b.id]) - minutes(present[a.id]));
    if (attended.length && (attended.length === 1 || present[attended[0].id] !== present[attended[1].id]))
      return { activity: attended[0], reason: 'qr' };
    const agenda = active.filter((a) => saved.includes(a.id));
    return agenda.length === 1 ? { activity: agenda[0], reason: 'agenda' } : null;
  }
  window.COMMUNITY = Object.freeze({
    usarServidor,
    removePost,
    currentActivity,
    key,
    seeds,
    seedMessages,
    reasons,
    read,
    write,
    uid,
    posts,
    allPosts,
    comments,
    messages,
    contents,
    find,
    hidden,
    postKey,
    commentKey,
    messageKey,
    report,
    moderate,
    moderationHTML,
  });
})();
