/* app/05-comunidade.js · publicações, comentários, menções, chat e moderação.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- comunidade (no aparelho, ou no servidor: 05-publicacoes-servidor.js) ---------------- */
const SOCIAL = window.COMMUNITY;
const COMMUNITY_KEY = SOCIAL.key;
const communityRead = () => (API ? pubEstado() : SOCIAL.read());
/* Com servidor, só o que é do aparelho passa por aqui (menções já vistas); o resto vira chamada à API. */
const communityWrite = (change) => {
  if (API) {
    try {
      change(pubEstado());
      pubGuardarVistas();
      return true;
    } catch (error) {
      toast(error.message);
      return false;
    }
  }
  try {
    SOCIAL.write(change);
    return true;
  } catch (error) {
    toast(error.message || 'Não foi possível salvar. Libere espaço no navegador.');
    return false;
  }
};
const canModerateCommunity = () => S.auth && (API ? !!D.person.org : !!orgDe());
const communitySeeds = window.COMMUNITY.seeds;
let communityMode = 'feed';
const communityDraft = {
  post: '',
  message: '',
  comments: {},
  images: [],
  activity: '',
  day: D.now.day,
  tag: 'No evento',
  contextReady: false,
  activityManual: false,
};
let communityImageBusy = false;
const communityAuthor = () => ({
  author: String(D.person.id),
  name: D.person.name,
  initials: D.person.initials,
  photo: D.person.photo || null,
  role: D.person.course || 'Participante',
});
const communityTime = (p) =>
  p.time || new Date(p.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const communityAvatar = (p) => {
  const own = p.author === String(D.person.id);
  const photo = own ? D.person.photo : p.photo;
  return `<span class="community-avatar">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy">` : esc(own ? D.person.initials : p.initials || '?')}</span>`;
};
const communityPosts = (v) => SOCIAL.posts(v);
const communityGate = () =>
  `<div class="community-gate">${ic('lock')}<span>Para participar, leia o QR Code da recepção.</span><button data-act="scan">Ler QR Code</button></div>`;
let communityDay = 'all';
let communityActivity = 'all';
let communityModFilter = 'pending';
const communityEmpty = (text) => `<p class="social-empty">${esc(text)}</p>`;
function communityPeople(v = communityRead()) {
  const rows = [...communitySeeds, communityAuthor(), ...SOCIAL.contents(v)];
  const people = new Map();
  const handles = new Set();
  for (const row of rows) {
    if (!row.author || people.has(String(row.author))) continue;
    const own = String(row.author) === String(D.person.id);
    const person = own ? communityAuthor() : row;
    let handle =
      row.handle ||
      SOCIAL.contents(v).find((p) => p.author === row.author && p.handle)?.handle ||
      person.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.|\.$/g, '') ||
      'participante';
    const base = handle;
    let n = 2;
    while (handles.has(handle)) handle = `${base}.${n++}`;
    handles.add(handle);
    people.set(String(row.author), { ...person, id: String(row.author), handle });
  }
  return [...people.values()];
}
const mentionPattern = () => /(^|[^\w@])@([a-z0-9]+(?:[._-][a-z0-9]+)*)/gi;
function communityMentions(text, v = communityRead()) {
  const handles = [...String(text).matchAll(mentionPattern())].map((m) => m[2].toLowerCase());
  return communityPeople(v).filter((p) => handles.includes(p.handle));
}
function communityText(text, v) {
  const raw = String(text || '');
  const people = communityPeople(v);
  let html = '';
  let offset = 0;
  for (const match of raw.matchAll(mentionPattern())) {
    html += esc(raw.slice(offset, match.index) + match[1]);
    const person = people.find((p) => p.handle === match[2].toLowerCase());
    html += person
      ? `<button class="social-mention" data-go="communityPerson" data-id="${esc(person.id)}">@${esc(person.handle)}</button>`
      : esc(`@${match[2]}`);
    offset = match.index + match[0].length;
  }
  return html + esc(raw.slice(offset));
}
function communityMentionRows(v) {
  return SOCIAL.contents(v).filter(
    (item) =>
      !SOCIAL.hidden(v, item.target) &&
      (!item.postId || !SOCIAL.hidden(v, SOCIAL.postKey(item.postId))) &&
      (item.mentions || []).some((id) => id === String(D.person.id)) &&
      item.author !== String(D.person.id),
  );
}
function communityMentionHints(input) {
  const existing = input.parentElement.querySelector('.social-mention-hints');
  existing?.remove();
  const before = input.value.slice(0, input.selectionStart);
  const match = /(?:^|\s)@([a-z0-9._-]*)$/i.exec(before);
  if (!match) return;
  const people = communityPeople()
    .filter((p) => p.handle.startsWith(match[1].toLowerCase()))
    .slice(0, 5);
  if (!people.length) return;
  if (!input.id) input.id = 'social-mention-input';
  const list = document.createElement('div');
  list.className = 'social-mention-hints';
  list.setAttribute('aria-label', 'Sugestões de pessoas');
  list.innerHTML = people
    .map(
      (p) =>
        `<button type="button" data-act="community-insert-mention" data-input="${esc(input.id)}" data-handle="${esc(p.handle)}">${communityAvatar(p)}<span><b>${esc(p.name)}</b><small>@${esc(p.handle)}</small></span></button>`,
    )
    .join('');
  input.after(list);
}
function communityAddMention(input, handle) {
  if (!input) return;
  const cursor = input.selectionStart;
  const before = input.value.slice(0, cursor);
  const match = /(?:^|\s)@([a-z0-9._-]*)$/i.exec(before);
  const start = match ? cursor - match[1].length - 1 : cursor;
  const separator = !match && start > 0 && !/\s/.test(input.value[start - 1]) ? ' ' : '';
  input.setRangeText(`${separator}@${handle} `, start, cursor, 'end');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.parentElement.querySelector('.social-mention-hints')?.remove();
  input.focus();
}
function communityActivityCard(p) {
  const activity = byId(p.activity);
  if (!activity) return '';
  return `<button class="social-activity" data-go="activity" data-id="${esc(activity.id)}">${ic('cal')}<span><b>${esc(activity.short)}</b><small>${activity.day} nov · ${esc(activity.time)} · ${esc(activity.room)}</small></span>${ic('chev')}</button>`;
}
function communityToolbar(v) {
  if (communityMode === 'chat') return '';
  const unread = communityMentionRows(v).filter(
    (m) => !(v.mentionSeen[String(D.person.id)] || []).includes(m.target),
  ).length;
  return `<nav class="social-tabs" aria-label="Explorar publicações">${[
    ['feed', 'Feed'],
    ['wall', 'Fotos'],
    ['saved', 'Salvos'],
    ['mentions', `Menções${unread ? ` · ${unread}` : ''}`],
  ]
    .map(
      ([id, label]) =>
        `<button data-act="community-mode" data-v="${id}" aria-pressed="${communityMode === id}">${label}</button>`,
    )
    .join('')}</nav>`;
}
function communityWall(v) {
  const posts = communityPosts(v).filter(
    (p) =>
      (communityDay === 'all' || +p.day === +communityDay) &&
      (communityActivity === 'all' || p.activity === communityActivity),
  );
  const photos = posts.flatMap((p) => communityPhotos(p).map((photo, index) => ({ p, photo, index })));
  return `<div class="social-wall"><div class="social-wall-filters"><label>Dia<select data-community-filter="day"><option value="all">Todos os dias</option>${D.days.map((d) => `<option value="${d.day}" ${String(d.day) === communityDay ? 'selected' : ''}>${esc(d.week)} · ${d.day} nov</option>`).join('')}</select></label><label>Atividade<select data-community-filter="activity"><option value="all">Todas as atividades</option>${D.sessions.map((a) => `<option value="${esc(a.id)}" ${a.id === communityActivity ? 'selected' : ''}>${esc(a.short)}</option>`).join('')}</select></label></div>
      ${photos.length ? `<div class="social-photo-grid">${photos.map(({ p, photo, index }) => `<button data-act="community-photo-open" data-id="${esc(p.id)}" data-index="${index}" aria-label="Ver foto ${index + 1} da publicação de ${esc(p.name)}"><img src="${esc(photo.src)}" alt="${esc(photo.alt || 'Foto no mural')}" loading="lazy"><span>${esc(p.name.split(' ')[0])} · ${p.day || '—'} nov</span></button>`).join('')}</div>` : communityEmpty('Nenhuma foto para estes filtros.')}</div>`;
}
function communityReportOpen(target) {
  if (!S.credAt) {
    toast('Leia o QR Code da recepção para participar.');
    return;
  }
  const v = communityRead();
  if (!SOCIAL.find(v, target) || SOCIAL.hidden(v, target)) {
    toast('Este conteúdo não está mais disponível.');
    return;
  }
  openOverlay(
    `<form class="sheet social-report" data-form="community-report" data-target="${esc(target)}" role="dialog" aria-modal="true" aria-labelledby="social-report-title"><i class="grab"></i><header><h2 id="social-report-title">Denunciar conteúdo</h2><button class="iconbtn" type="button" data-act="closeov" aria-label="Fechar denúncia">${ic('x')}</button></header><label class="field">Motivo<select name="reason" required><option value="">Selecione o motivo</option>${SOCIAL.reasons.map((r) => `<option>${esc(r)}</option>`).join('')}</select></label><label class="field">Detalhes<textarea name="detail" rows="3" maxlength="500" placeholder="Conte o que a equipe precisa saber (opcional)"></textarea></label><p class="community-muted">${API ? 'A denúncia vai para a organização revisar. Quem publicou não fica sabendo quem denunciou.' : 'A denúncia fica neste navegador para revisão da organização.'}</p><button class="btn primary big" type="submit">Enviar denúncia</button></form>`,
    'ask',
  );
}
Screens.communityPerson = ({ id }) => {
  const v = communityRead();
  const person = communityPeople(v).find((p) => p.id === id);
  if (!person) return { html: `${header('Participante')}${communityEmpty('Este perfil não está disponível.')}` };
  const posts = communityPosts(v).filter((p) => p.author === person.id);
  const own = person.id === String(D.person.id);
  const prof = own ? null : otherProfile(person.id);
  const card = own ? cardGet() || {} : prof?.card || {};
  const who = own ? D.person : { ...person, ...(prof || {}), name: person.name, photo: person.photo };
  return {
    html: `${header(own ? 'Seu perfil' : 'Participante')}<div class="pad social-card">${cardPreview(card, who, { own })}<div class="social-card-acts">${own ? `<button class="btn soft" data-go="cartao">${ic('pencil')}Editar perfil</button>` : S.credAt ? `<button class="btn soft" data-act="community-mention-person" data-id="${esc(person.id)}">${ic('contact')}Marcar na publicação</button>` : ''}</div></div><div class="community-feed">${posts.map((p) => communityPost(p, v)).join('') || communityEmpty('Ainda não há publicações.')}</div>`,
  };
};
Screens.orgCommunity = () =>
  canModerateCommunity()
    ? {
        html: `${header('Moderação')}<div class="pad">${orgDe() || D.person.org ? `<button class="oq-atalho" data-go="orgQrs">${ic('qr')}<span><b>QR Codes das salas</b><small>Para quando o impresso rasga ou não lê</small></span>${ic('chev')}</button>` : ''}${SOCIAL.moderationHTML(communityRead(), communityModFilter)}</div>`,
      }
    : semAcesso();

function communityPost(p, v, detail = false) {
  const liked = (v.likes[p.id] || []).includes(String(D.person.id));
  const comments = SOCIAL.comments(v, p.id);
  const bookmarked = (v.bookmarks[String(D.person.id)] || []).includes(p.id);
  return `<article class="community-post">
      <header><button class="social-who" data-go="communityPerson" data-id="${esc(String(p.author))}" aria-label="Ver perfil">${communityAvatar(p)}</button><div><b data-go="communityPerson" data-id="${esc(String(p.author))}">${esc(p.author === String(D.person.id) ? D.person.name : p.name)}</b><small>${esc(p.role)} · ${esc(communityTime(p))}</small></div>${p.author === String(D.person.id) || canModerateCommunity() ? `<button class="iconbtn social-delete-button" data-act="community-delete" data-id="${esc(p.id)}" aria-label="${p.author === String(D.person.id) ? 'Excluir minha publicação' : `Excluir publicação de ${esc(p.name)}`}" title="Excluir publicação">${ic('trash')}</button>` : `<button class="iconbtn social-report-button" data-act="community-report" data-target="${esc(SOCIAL.postKey(p.id))}" aria-label="Denunciar publicação">${ic('flag')}</button>`}</header>
      ${p.text ? `<p class="community-text">${communityText(p.text, v)}</p>` : ''}
      ${communityActivityCard(p)}
      ${communityGallery(p)}
      <footer><button class="${liked ? 'liked' : ''}" data-act="community-like" data-id="${esc(p.id)}" aria-pressed="${liked}" aria-label="Curtir publicação de ${esc(p.name)}">${ic('heart')}<span>${(p.likes || 0) + (v.likes[p.id] || []).length}</span></button><button data-go="communityPost" data-id="${esc(p.id)}">${ic('chat')}<span>${comments.length ? `${comments.length} comentário${comments.length === 1 ? '' : 's'}` : 'Comentar'}</span></button><button class="social-save ${bookmarked ? 'on' : ''}" data-act="community-save" data-id="${esc(p.id)}" aria-pressed="${bookmarked}" aria-label="${bookmarked ? 'Remover dos salvos' : 'Salvar publicação'}">${ic('bookmark')}</button></footer>
      ${
        detail
          ? `<section class="community-comments"><h2>Comentários</h2>${comments.length ? comments.map((c) => `<div class="community-comment"><button class="social-who" data-go="communityPerson" data-id="${esc(String(c.author))}" aria-label="Ver perfil">${communityAvatar(c)}</button><div><b data-go="communityPerson" data-id="${esc(String(c.author))}">${esc(c.author === String(D.person.id) ? D.person.name : c.name)}</b><p class="community-text">${communityText(c.text, v)}</p></div><button class="iconbtn social-report-button" data-act="community-report" data-target="${esc(SOCIAL.commentKey(p.id, c.id))}" aria-label="Denunciar comentário">${ic('flag')}</button></div>`).join('') : '<p class="community-muted">Comece essa conversa.</p>'}
      ${S.credAt ? `<form data-form="community-comment" data-id="${esc(p.id)}" class="community-reply"><label class="sr-only" for="community-reply">Seu comentário</label><textarea id="community-reply" name="text" data-community-draft="comment" data-id="${esc(p.id)}" maxlength="1000" rows="2" placeholder="Escreva um comentário…" required>${esc(communityDraft.comments[p.id] || '')}</textarea><button class="iconbtn" type="submit" aria-label="Enviar comentário">${ic('arrow')}</button></form>` : communityGate()}</section>`
          : ''
      }
    </article>`;
}
Screens.community = () => {
  const v = communityRead();
  const chat = communityMode === 'chat';
  return {
    html: `<header class="community-bar"><div class="community-brand">${mark('mark xs')}<h1>${chat ? 'Chat geral' : 'Publicações'}</h1></div><div class="hd-acts"><button class="iconbtn ${chat ? 'on' : ''}" data-act="community-mode" data-v="${chat ? 'feed' : 'chat'}" aria-label="${chat ? 'Voltar às publicações' : 'Abrir chat geral'}" aria-pressed="${chat}">${ic(chat ? 'list' : 'chat')}</button>${profileShortcut()}</div></header>

      ${communityToolbar(v)}
      ${
        chat
          ? `<div class="community-chat"><div class="community-messages" role="log" aria-label="Mensagens do chat geral">${SOCIAL.messages(
              v,
            )
              .map(
                (m) =>
                  `<div class="community-message ${m.author === String(D.person.id) ? 'mine' : ''}"><div class="community-chat-author"><button class="social-who" data-go="communityPerson" data-id="${esc(String(m.author))}" aria-label="Ver perfil">${communityAvatar(m)}</button><b data-go="communityPerson" data-id="${esc(String(m.author))}">${esc(m.author === String(D.person.id) ? D.person.name : m.name)}</b><button class="iconbtn social-report-button" data-act="community-report" data-target="${esc(SOCIAL.messageKey(m.id))}" aria-label="Denunciar mensagem">${ic('flag')}</button></div><p class="community-text">${communityText(m.text, v)}</p><time>${esc(communityTime(m))}</time></div>`,
              )
              .join('')}</div>
      ${S.credAt ? `<form data-form="community-message" class="community-reply community-chat-form"><label class="sr-only" for="community-message">Sua mensagem</label><textarea id="community-message" data-community-draft="message" name="text" rows="2" maxlength="1000" placeholder="Mande um oi para a galera…" required>${esc(communityDraft.message)}</textarea><button class="iconbtn" type="submit" aria-label="Enviar mensagem">${ic('arrow')}</button></form>` : communityGate()}</div>`
          : communityMode === 'wall'
            ? communityWall(v)
            : communityMode === 'mentions'
              ? `<div class="social-mentions">${
                  communityMentionRows(v)
                    .map(
                      (item) =>
                        `<button class="social-mention-row" data-act="community-mention-open" data-target="${esc(item.target)}">${communityAvatar(item)}<span><b>${esc(item.name)} marcou você</b><small>${esc(item.type)} · ${esc(item.text.slice(0, 110))}</small></span>${ic('chev')}</button>`,
                    )
                    .join('') || communityEmpty('Quando alguém marcar você, a menção aparece aqui.')
                }</div>`
              : `<div class="community-feed">${communityMode === 'feed' && S.credAt ? `<div class="community-start"><button class="community-start-text" data-act="community-compose">${meAv()}<span>Compartilhe algo do evento…</span></button><div class="community-start-actions"><button data-act="community-compose" data-photo="1">${ic('image')}Foto / imagem</button><button data-act="community-compose">${ic('plus')}Publicar</button></div></div>` : communityMode === 'feed' ? communityGate() : ''}${(() => {
                  const posts = communityPosts(v).filter(
                    (p) => communityMode !== 'saved' || (v.bookmarks[String(D.person.id)] || []).includes(p.id),
                  );
                  return (
                    posts.map((p) => communityPost(p, v)).join('') ||
                    communityEmpty(
                      communityMode === 'saved'
                        ? 'Salve publicações pelo marcador para encontrá-las aqui.'
                        : 'Ainda não há publicações.',
                    )
                  );
                })()}</div>`
      }`,
    mount(el) {
      if (chat) $('.community-chat-form', el)?.scrollIntoView({ block: 'end' });
    },
  };
};
Screens.communityPost = ({ id }) => {
  const v = communityRead();
  const p = communityPosts(v).find((x) => x.id === id);
  return {
    html: `${header('Publicação')}<div class="community-feed">${p ? communityPost(p, v, true) : '<p class="community-muted">Esta publicação foi excluída.</p>'}</div>`,
  };
};
/* depois de publicar, comentar ou mandar mensagem: limpa o rascunho e volta */
function communityLimparRascunho(kind, postId, aviso) {
  if (kind === 'community-post') {
    communityDraft.post = '';
    communityDraft.cursor = 0;
    communityDraft.images = [];
    communityDraft.activity = '';
    communityDraft.day = D.now.day;
    communityDraft.tag = 'No evento';
    communityDraft.contextReady = false;
    communityDraft.activityManual = false;
    communityMode = 'feed';
    navBack();
    toast(aviso);
  } else {
    if (kind === 'community-message') communityDraft.message = '';
    else delete communityDraft.comments[postId];
    rerender();
  }
}
const communityCheckinKey = () => `etal-atividade-atual:${D.person.id}`;
function communityCheckin(id) {
  if (byId(id)?.type !== 'Credenciamento') store.set(communityCheckinKey(), { id, at: Date.now() });
}
function prepareCommunityContext() {
  if (communityDraft.contextReady) return;
  const context = SOCIAL.currentActivity({
    sessions: D.sessions,
    day: D.now.day,
    time: D.now.time,
    saved: [...S.saved],
    present: S.present,
    lastCheckin: store.get(communityCheckinKey()),
  });
  communityDraft.activity = context?.activity.id || '';
  communityDraft.day = context?.activity.day || D.now.day;
  communityDraft.contextReason = context?.reason || '';
  communityDraft.contextReady = true;
}
function updateComposerState() {
  const button = $('.page:not(.leaving) .compose-submit');
  if (button) button.disabled = communityImageBusy || (!communityDraft.post.trim() && !communityDraft.images.length);
  const counter = $('#compose-count');
  if (counter) counter.textContent = `${communityDraft.post.length}/2000`;
}
Screens.communityCompose = () => {
  prepareCommunityContext();
  const activity = byId(communityDraft.activity);
  const canPost = !communityImageBusy && (communityDraft.post.trim() || communityDraft.images.length);
  return {
    html: `${header('Nova publicação', { right: S.credAt ? `<button class="compose-submit" type="submit" form="community-post-form" ${canPost ? '' : 'disabled'}>Publicar</button>` : '' })}
      <div class="community-compose">${
        S.credAt
          ? `<form id="community-post-form" class="post-editor" data-form="community-post">
        <div class="community-identity">${meAv()}<div><b>${esc(D.person.name)}</b><small>${esc(D.event?.name || 'ETAL')}</small></div></div>
        <details class="compose-context"><summary>${ic(activity ? 'pin' : 'cal')}<span><b>${esc(activity?.short || 'Adicionar atividade')}</b><small>${activity ? `${activity.day} nov · ${esc(activity.room)}` : 'Opcional'}${activity && communityDraft.contextReason === 'qr' ? ' · Check-in realizado' : activity && communityDraft.contextReason === 'agenda' ? ' · Na sua agenda agora' : ''}</small></span>${ic('chev')}</summary>
          <div class="compose-context-fields"><label>Atividade<select name="activity" data-community-draft="activity"><option value="">Sem atividade vinculada</option>${D.sessions
            .filter((a) => a.type !== 'Credenciamento')
            .map(
              (a) =>
                `<option value="${esc(a.id)}" ${communityDraft.activity === a.id ? 'selected' : ''}>${esc(a.short)} · ${a.day} nov</option>`,
            )
            .join('')}</select></label>
          <div class="compose-secondary"><label>Dia<select name="day" data-community-draft="day" ${activity ? 'disabled' : ''}>${D.days.map((d) => `<option value="${d.day}" ${+communityDraft.day === d.day ? 'selected' : ''}>${d.day} de novembro</option>`).join('')}</select></label><label>Assunto<select name="tag" data-community-draft="tag">${['No evento', 'Conexões', 'Projetos', 'Dicas'].map((t) => `<option ${communityDraft.tag === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div></div>
        </details>
        <div class="compose-writing"><label class="sr-only" for="community-post">Texto da publicação</label><textarea id="community-post" name="text" data-community-draft="post" rows="6" maxlength="2000" placeholder="Como está sendo o seu ETAL?">${esc(communityDraft.post)}</textarea><small id="compose-count">${communityDraft.post.length}/2000</small></div>
        ${communityDraft.images.length ? `<div class="community-upload-grid">${communityDraft.images.map((img, i) => `<div class="community-upload"><img src="${esc(img.src)}" alt="Prévia da foto ${i + 1}"><button type="button" data-act="community-remove-image" data-index="${i}" aria-label="Remover foto ${i + 1}">${ic('x')}</button><details class="compose-photo-alt"><summary>Descrição da foto</summary><label class="sr-only" for="image-alt-${i}">Descrição da foto ${i + 1}</label><input id="image-alt-${i}" name="${i ? `alt-${i}` : 'alt'}" data-image-alt="${i}" maxlength="240" value="${esc(img.alt || '')}" placeholder="O que aparece nesta foto?"></details></div>`).join('')}</div>` : ''}
        <div class="compose-tools">${communityDraft.images.length < 6 ? `<label class="compose-tool compose-file">${ic('image')}<span>Fotos</span><input type="file" id="community-image" aria-label="Adicionar fotos" accept="image/jpeg,image/png,image/webp" multiple></label>` : ''}
          <details class="social-people-picker compose-mentions"><summary>${ic('contact')}Marcar pessoas</summary><div class="compose-people-panel"><label class="sr-only" for="community-people-search">Buscar participante</label><input id="community-people-search" placeholder="Buscar participante"><div class="social-people-results">${communityPeople()
            .map(
              (person) =>
                `<button type="button" data-act="community-insert-mention" data-input="community-post" data-handle="${esc(person.handle)}">${communityAvatar(person)}<span><b>${esc(person.name)}</b><small>@${esc(person.handle)}</small></span></button>`,
            )
            .join(
              '',
            )}</div></div></details><small class="compose-photo-count">${communityDraft.images.length}/6 fotos</small>
        </div>
      </form>`
          : communityGate()
      }</div>`,
    mount: (page) => {
      updateComposerState();
      const input = $('#community-post', page);
      if (input) {
        const cursor = Math.min(communityDraft.cursor ?? input.value.length, input.value.length);
        input.setSelectionRange(cursor, cursor);
      }
    },
  };
};
document.addEventListener('input', (e) => {
  if (e.target.hasAttribute('data-image-alt')) {
    const img = communityDraft.images[+e.target.dataset.imageAlt];
    if (img) img.alt = e.target.value;
    return;
  }
  if (e.target.id === 'community-people-search') {
    const q = e.target.value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    e.target
      .closest('.social-people-picker')
      .querySelectorAll('[data-handle]')
      .forEach((button) => {
        button.hidden = !button.textContent
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(q);
      });
    return;
  }
  if (e.target.matches('textarea[data-community-draft]')) communityMentionHints(e.target);
  const k = e.target.dataset.communityDraft;
  if (!k) return;
  if (k === 'comment') communityDraft.comments[e.target.dataset.id] = e.target.value;
  else communityDraft[k] = e.target.value;
  if (k === 'post') {
    communityDraft.cursor = e.target.selectionStart;
    updateComposerState();
  }
});
document.addEventListener('change', (e) => {
  const f = e.target.dataset.communityFilter;
  if (f === 'day') {
    communityDay = e.target.value;
    rerender();
  }
  if (f === 'activity') {
    communityActivity = e.target.value;
    rerender();
  }
  if (e.target.dataset.communityDraft === 'activity') {
    communityDraft.activity = e.target.value;
    communityDraft.activityManual = true;
    communityDraft.contextReason = '';
    const activity = byId(e.target.value);
    if (activity) communityDraft.day = activity.day;
    rerender();
  }
  if (e.target.dataset.communityDraft === 'day') communityDraft.day = +e.target.value;
});
async function readLocalPhoto(file, size = 1200, square = false) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
    throw new Error('Escolha uma foto JPG, PNG ou WebP de até 10 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = square ? size : Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = square ? size : Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (square) {
    const side = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  } else ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.78);
}
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'community-image') return;
  const files = [...(e.target.files || [])];
  if (!files.length || communityImageBusy) return;
  const available = 6 - communityDraft.images.length;
  if (files.length > available) {
    toast(`Você pode adicionar mais ${available} foto${available === 1 ? '' : 's'}.`);
    e.target.value = '';
    return;
  }
  communityImageBusy = true;
  updateComposerState();
  const owner = String(D.person.id);
  e.target.disabled = true;
  try {
    const photos = [];
    for (const file of files) photos.push({ src: await readLocalPhoto(file), alt: '' });
    if (!S.auth || String(D.person.id) !== owner) return;
    communityDraft.images.push(...photos);
    if (top().s === 'communityCompose') rerender();
  } catch (error) {
    toast(error.message || 'Não foi possível abrir essa foto. Tente outra.');
  } finally {
    communityImageBusy = false;
    e.target.disabled = false;
    e.target.value = '';
    updateComposerState();
  }
});
window.addEventListener('storage', (e) => {
  if (e.key === COMMUNITY_KEY && S.auth && (S.tab === 'community' || top().s === 'orgCommunity')) rerender();
});
