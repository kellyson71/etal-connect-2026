/* app/25-acoes-comunidade.js · ações de comunidade.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['gallery-step'] = (el, e, a) => {
  const gallery = el.closest('.community-gallery');
  const track = $('.gallery-track', gallery);
  const index = Math.max(0, Math.min(track.children.length - 1, +el.dataset.index));
  track.scrollTo({
    left: track.children[index].offsetLeft - track.children[0].offsetLeft,
    behavior: reduce ? 'instant' : 'smooth',
  });
};

ACOES['community-mode'] = (el, e, a) => {
  const mode = ['feed', 'wall', 'saved', 'mentions', 'chat'].includes(el.dataset.v) ? el.dataset.v : 'feed';
  if (
    mode === 'mentions' &&
    !communityWrite((v) => {
      v.mentionSeen[String(D.person.id)] = communityMentionRows(v).map((row) => row.target);
    })
  )
    return;
  communityMode = mode;
  rerender();
};

ACOES['community-save'] = (el, e, a) => {
  if (!S.auth) return;
  const id = el.dataset.id;
  if (API) {
    pubSalvar(id);
    return;
  }
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
};

ACOES['community-photo-open'] = (el, e, a) => {
  galleryPositions[el.dataset.id] = +el.dataset.index;
  push('communityPost', { id: el.dataset.id });
};

ACOES['community-report'] = (el, e, a) => {
  communityReportOpen(el.dataset.target);
};

ACOES['community-insert-mention'] = (el, e, a) => {
  communityAddMention(document.getElementById(el.dataset.input), el.dataset.handle);
  el.closest('details')?.removeAttribute('open');
};

ACOES['community-mention-person'] = (el, e, a) => {
  if (!communityPode()) return;
  const person = communityPeople().find((p) => p.id === el.dataset.id);
  if (!person) return;
  communityDraft.post += `${communityDraft.post && !communityDraft.post.endsWith(' ') ? ' ' : ''}@${person.handle} `;
  push('communityCompose');
};

ACOES['community-mention-open'] = (el, e, a) => {
  const item = SOCIAL.find(communityRead(), el.dataset.target);
  if (!item) return;
  if (item.type === 'Mensagem') {
    communityMode = 'chat';
    rerender();
  } else push('communityPost', { id: item.postId });
};

ACOES['social-mod-filter'] = (el, e, a) => {
  if (canModerateCommunity()) {
    communityModFilter = el.dataset.filter;
    rerender();
  }
};

ACOES['social-mod'] = (el, e, a) => {
  if (!canModerateCommunity()) {
    toast('Esta ação é da organização.');
    return;
  }
  const note = el.closest('[data-mod-target]')?.querySelector('[data-mod-note]')?.value || '';
  if (API) {
    pubModerar(el.dataset.target, el.dataset.action, note);
    return;
  }
  if (communityWrite((v) => SOCIAL.moderate(v, el.dataset.target, el.dataset.action, D.person.name, note))) {
    rerender();
    toast('Revisão salva neste navegador');
  }
};

ACOES['community-compose'] = (el, e, a) => {
  if (!communityPode()) {
    toast('Leia o QR da recepção para participar.');
    return;
  }
  if (!communityDraft.post.trim() && !communityDraft.images.length && !communityDraft.activityManual)
    communityDraft.contextReady = false;
  push('communityCompose');
  if (el.dataset.photo) $('#community-image', vp.querySelector('.page:not(.leaving)'))?.click();
};

ACOES['community-remove-image'] = (el, e, a) => {
  communityDraft.images.splice(+el.dataset.index, 1);
  rerender();
};

ACOES['community-like'] = (el, e, a) => {
  if (!communityPode()) {
    toast('Leia o QR da recepção para participar.');
    return;
  }
  const id = el.dataset.id;
  if (API) {
    pubCurtir(id);
    return;
  }
  const me = String(D.person.id);
  if (
    communityWrite((v) => {
      if (!communityPosts(v).some((p) => p.id === id)) throw new Error('Esta publicação não está mais disponível.');
      const list = v.likes[id] || [];
      v.likes[id] = list.includes(me) ? list.filter((x) => x !== me) : [...list, me];
    })
  )
    rerender();
};

ACOES['community-delete'] = (el, e, a) => {
  if (!S.auth) return;
  if (API) {
    pubApagar(el.dataset.id);
    return;
  }
  if (communityWrite((v) => SOCIAL.removePost(v, el.dataset.id, communityAuthor(), canModerateCommunity()))) {
    if (top().s === 'communityPost') navBack();
    else rerender();
    toast('Publicação excluída');
  }
};
