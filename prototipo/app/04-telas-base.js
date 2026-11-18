/* app/04-telas-base.js · registro de telas e sobreposições, crachá, perfil e galerias.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- telas ---------------- */
const Screens = {};
const Overlays = {};

const header = (title, { back = true, right = '' } = {}) => `
    <header class="bar">${back ? `<button class="iconbtn" data-act="back" aria-label="Voltar">${ic('back')}</button>` : '<span class="iconbtn ghost"></span>'}
    <h1 class="bar-title">${title}</h1>${right || '<span class="iconbtn ghost"></span>'}</header>`;

/* Perfil visual local: nunca altera os dados de identificação no SUAP/API. */
const profileLocalKey = (id) => `etal-perfil-visual:${id}`;
const profileLocal = (id) => {
  try {
    return JSON.parse(localStorage.getItem(profileLocalKey(id))) || {};
  } catch (_) {
    return {};
  }
};
const PROFILE_AVATARS = [
  'assets/community/avatar-ana.svg',
  'assets/community/avatar-lucas.svg',
  'assets/community/avatar-julia.svg',
];
let profileEditDraft = null;
let profilePhotoBusy = false;
/* O nome de exibição e a foto mudam; o nome do SUAP (ou do cadastro de visitante) e a matrícula continuam ligados à conta. */
const officialName = (p = D.person) => p.officialName || p.name;
const isGuest = (p = D.person) => p.source === 'visitante';
const linkLine = (p = D.person) =>
  `${ic('lock')}<span><b>${esc(officialName(p))}</b><small>${isGuest(p) ? 'Cadastro de visitante' : 'Nome no SUAP'} · ${isGuest(p) ? esc(p.email || p.id) : `Matrícula ${esc(p.id)}`}</small></span>`;

/* Cartão de contato: opcional, fica neste aparelho e só aparece para quem trocar contato pelo QR do crachá. */
const CARD_LANGS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C',
  'C++',
  'C#',
  'PHP',
  'Kotlin',
  'Dart',
  'Go',
  'Rust',
  'SQL',
  'GDScript',
];
const CARD_AREAS = [
  'Web',
  'Mobile',
  'Jogos',
  'IA',
  'Dados',
  'Redes',
  'Segurança',
  'Design e UX',
  'Robótica',
  'Hardware',
];
const CARD_OPEN = ['Estágio', 'Projetos de pesquisa', 'Grupo de estudo', 'Hackathons', 'Monitoria'];
const CARD_NADIC = [
  ['bolsista', 'Sou bolsista'],
  ['ex', 'Já fui'],
  ['nao', 'Não sou'],
];
const cardKey = (id) => `etal-cartao:${id}`;
const cardGet = (id = D.person.id) => {
  try {
    return JSON.parse(localStorage.getItem(cardKey(id))) || null;
  } catch (_) {
    return null;
  }
};
const cardSkipped = (id = D.person.id) => prefs.get(`etal-cartao-pulado:${id}`) === '1';
const cardSkip = (id = D.person.id) => prefs.set(`etal-cartao-pulado:${id}`, '1');
/* Homologação/demo: o convite volta a cada entrada e a cada recarga, mesmo já preenchido ou pulado. */
let cardDemoDone = false;
const cardAsk = () => S.auth && D.person.id && (DEMO ? !cardDemoDone : !cardGet() && !cardSkipped());
const cardIntro = (ms) =>
  setTimeout(() => {
    if (cardAsk() && !ov.classList.contains('open') && S.tab === 'home' && top().s !== 'cartao')
      push('cartao', { intro: 1 });
  }, ms);
const personAv = (p) =>
  p.photo
    ? `<span class="av has-photo"><img src="${esc(p.photo)}" alt=""></span>`
    : `<span class="av">${esc(p.initials || '?')}</span>`;
function taughtActivity(person) {
  return D.sessions.find((a) =>
    a.speakerId
      ? a.speakerId === String(person.id)
      : a.speaker && fold(a.speaker) === fold(person.officialName || person.name || ''),
  );
}
function taughtActivityCard(person) {
  const activity = taughtActivity(person);
  if (!activity) return '';
  return `<button class="speaker-offer" ${goOf(activity)}>${spAv(activity, true)}<span><small>${ic(tipoDe(activity).icon)}${esc(activity.type)} no ETAL</small><b>${esc(activity.title)}</b><em>${activity.day} nov · ${activity.time}–${activity.end} · ${esc(activity.room)}</em></span>${ic('chev')}</button>`;
}
function cardPreview(c = {}, p = D.person, { own = p === D.person, taught = true } = {}) {
  const priv = !own && c.publish === false;
  if (priv) c = {};
  const nadic = c.nadic === 'bolsista' ? 'Bolsista' : c.nadic === 'ex' ? 'Ex-bolsista' : '';
  const tags = [...(c.langs || []), ...(c.areas || [])];
  const rows = [
    ['phone', c.phone],
    ['mail', c.email],
    ['link', c.link],
  ].filter(([, v]) => v);
  const nada = !c.bio && !tags.length && !c.open?.length && !rows.length && !nadic;
  const vazio = (i, t, sub) =>
    `<div class="ct-empty">${ic(i)}<span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span></div>`;
  return `<div class="ct-card${!own && c.publish === false ? ' off' : ''}"><i class="ct-glow"></i>
      <div class="ct-top">${personAv(p)}<div><b>${esc(p.name)}</b><small>${esc(p.course || p.role || '')}</small></div>${nadic ? `<span class="ct-nadic"><img src="assets/nadic-logo.svg" alt="NADIC">${nadic}</span>` : ''}</div>
      <p class="ct-real">${ic('lock')}${p.source === 'speaker' ? 'Ministrante do ETAL' : officialName(p) !== p.name ? esc(officialName(p)) : isGuest(p) ? 'Cadastro de visitante confirmado' : 'Nome confirmado pelo SUAP'}</p>
      ${
        priv
          ? vazio('eye', 'Perfil privado', 'Esta pessoa preferiu não mostrar os detalhes')
          : nada
            ? p.source === 'speaker'
              ? ''
              : own
                ? '<div class="ct-tags empty"><span>Seus interesses aparecem aqui</span></div>'
                : vazio('user', 'Perfil ainda não personalizado', 'Nenhuma informação extra cadastrada')
            : `
      ${c.bio ? `<p class="ct-bio">${esc(c.bio)}</p>` : ''}
      ${
        tags.length
          ? `<div class="ct-tags">${tags
              .slice(0, 8)
              .map((t) => `<span>${esc(t)}</span>`)
              .join('')}${tags.length > 8 ? `<span>+${tags.length - 8}</span>` : ''}</div>`
          : own
            ? '<div class="ct-tags empty"><span>Seus interesses aparecem aqui</span></div>'
            : ''
      }
      ${c.open?.length ? `<p class="ct-open">${ic('flag')}Aberto a ${esc(c.open.join(', ').replace(/, ([^,]*)$/, ' e $1'))}</p>` : ''}
      ${rows.length ? `<ul class="ct-rows">${rows.map(([i, v]) => `<li>${ic(i)}<span>${esc(v)}</span></li>`).join('')}</ul>` : `<p class="ct-none">${ic('contact')}${own ? 'Nenhum contato adicionado' : 'Sem contato público'}</p>`}`
      }
      ${taught ? taughtActivityCard(p) : ''}
      ${own && c.publish === false ? `<span class="ct-hidden">${ic('eye')}Oculto</span>` : ''}</div>`;
}
/* Perfil público de outra pessoa: dados de exemplo da comunidade ou colegas de teste. */
const otherProfile = (id) => (window.DATA.demoProfiles || {})[id] || D.peers.find((x) => x.id === id) || null;
const cardChips = (name, list, on) =>
  `<div class="ct-chips">${list.map((v) => `<label class="ct-chip"><input type="checkbox" name="${name}" value="${esc(v)}" ${on?.includes(v) ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div>`;
function cardRead(f) {
  const d = new FormData(f);
  const t = (k, n) =>
    String(d.get(k) || '')
      .trim()
      .slice(0, n);
  return {
    publish: d.get('publish') === 'on',
    phone: t('phone', 20),
    email: t('email', 80),
    link: t('link', 80),
    nadic: t('nadic', 10),
    langs: d.getAll('langs'),
    areas: d.getAll('areas'),
    open: d.getAll('open'),
    bio: t('bio', 140),
  };
}

function profileEditOpen() {
  if (!S.auth && !lgPending) return;
  profileEditDraft = { name: D.person.name, photo: D.person.photo || null };
  openOverlay(
    `<form class="sheet profile-editor" data-form="profile-edit" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title"><i class="grab"></i><header><h2 id="profile-edit-title">Foto e nome</h2><button type="button" class="iconbtn" data-act="closeov" aria-label="Fechar edição">${ic('x')}</button></header>
      <div class="profile-edit-photo"></div><label class="btn soft community-file">${ic('image')}Escolher foto<input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <div class="profile-presets" aria-label="Avatares ilustrados">${PROFILE_AVATARS.map((src, i) => `<button type="button" data-act="profile-preset" data-index="${i}" aria-label="Usar avatar ilustrado ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>
      <button class="profile-remove" type="button" data-act="profile-remove-photo">Remover foto</button>
      <label class="field" for="profile-name"><span>Nome de exibição</span><input id="profile-name" name="name" maxlength="80" value="${esc(D.person.name)}" autocomplete="nickname" required></label>
      <div class="profile-link">${linkLine()}</div><button class="btn primary big" type="submit">Salvar alterações</button></form>`,
    'ask',
  );
  profileEditRefresh();
}
function profileEditRefresh() {
  const target = $('.profile-edit-photo', ov);
  if (!target || !profileEditDraft) return;
  target.innerHTML = `<span class="av">${profileEditDraft.photo ? `<img src="${esc(profileEditDraft.photo)}" alt="Prévia da foto de perfil">` : esc(D.person.initials)}</span>`;
  const save = $('[data-form="profile-edit"] button[type="submit"]', ov);
  if (save) save.disabled = profilePhotoBusy;
  const remove = $('[data-act="profile-remove-photo"]', ov);
  if (remove) remove.hidden = !profileEditDraft.photo;
}
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'profile-photo' || !e.target.files?.[0] || profilePhotoBusy) return;
  const draft = profileEditDraft;
  profilePhotoBusy = true;
  profileEditRefresh();
  try {
    const photo = await readLocalPhoto(e.target.files[0], 512, true);
    if (profileEditDraft === draft && e.target.isConnected) draft.photo = photo;
  } catch (error) {
    toast(error.message || 'Não foi possível abrir essa foto.');
  } finally {
    profilePhotoBusy = false;
    profileEditRefresh();
  }
});

/* Carrosséis: navegação nativa por toque, sem avanço automático. */
const galleryPositions = {};
const communityPhotos = (p) => (p.images?.length ? p.images : p.image ? [{ src: p.image, alt: p.alt }] : []);
function communityGallery(p) {
  const photos = communityPhotos(p);
  if (!photos.length) return '';
  return `<section class="community-gallery ${photos.length > 1 ? 'multi' : 'single'}" data-gallery="${esc(p.id)}" aria-label="Fotos da publicação de ${esc(p.name)}" aria-roledescription="carrossel">
      <span class="gallery-count" aria-live="polite">1 / ${photos.length}</span>
      <div class="gallery-track" tabindex="0" aria-label="Fotos; deslize ou use as setas para navegar">${photos.map((img, i) => `<figure class="gallery-slide" role="group" aria-label="Foto ${i + 1} de ${photos.length}"><img src="${esc(img.src)}" alt="${esc(img.alt || `Foto ${i + 1} compartilhada no evento`)}" loading="lazy">${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ''}</figure>`).join('')}</div>
      ${photos.length > 1 ? `<div class="gallery-controls"><button type="button" class="gallery-prev" data-act="gallery-step" data-index="0" aria-label="Foto anterior">${ic('back')}</button><div class="gallery-dots">${photos.map((_, i) => `<button type="button" data-act="gallery-step" data-index="${i}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}"></button>`).join('')}</div><button type="button" class="gallery-next" data-act="gallery-step" data-index="1" aria-label="Próxima foto">${ic('arrow')}</button></div>` : ''}</section>`;
}
function mountGalleries(page) {
  page.querySelectorAll('.community-gallery').forEach((gallery) => {
    const track = $('.gallery-track', gallery);
    const slides = [...track.children];
    const key = gallery.dataset.gallery;
    const showIndex = () => {
      const stride = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 1;
      const i = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / stride)));
      galleryPositions[key] = i;
      $('.gallery-count', gallery).textContent = `${i + 1} / ${slides.length}`;
      gallery
        .querySelectorAll('.gallery-dots button')
        .forEach((dot, n) => dot.setAttribute('aria-current', String(n === i)));
      const prev = $('.gallery-prev', gallery);
      const next = $('.gallery-next', gallery);
      if (prev) {
        prev.dataset.index = Math.max(0, i - 1);
        prev.disabled = i === 0;
      }
      if (next) {
        next.dataset.index = Math.min(slides.length - 1, i + 1);
        next.disabled = i === slides.length - 1;
      }
    };
    let frame;
    track.addEventListener(
      'scroll',
      () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(showIndex);
      },
      { passive: true },
    );
    track.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key) || e.target !== track) return;
      e.preventDefault();
      const i = Math.max(
        0,
        Math.min(slides.length - 1, (galleryPositions[key] || 0) + (e.key === 'ArrowRight' ? 1 : -1)),
      );
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduce ? 'instant' : 'smooth' });
    });
    requestAnimationFrame(() => {
      const i = Math.min(slides.length - 1, galleryPositions[key] || 0);
      track.scrollLeft = slides[i].offsetLeft - slides[0].offsetLeft;
      showIndex();
    });
  });
}

const profileShortcut = () =>
  `<button class="iconbtn profile-shortcut" data-act="tab" data-tab="profile" aria-label="Abrir perfil">${meAv()}</button>`;
