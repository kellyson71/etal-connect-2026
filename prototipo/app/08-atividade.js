/* app/08-atividade.js · atividade, palestrante, materiais e perguntas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
function matInfo(m) {
  const u = m.url || '';
  if (m.kind === 'link' || /^https?:/.test(u)) {
    if (GH.test(u)) {
      const [, o, r] = GH.exec(u);
      return { tipo: 'github', icon: 'github', cls: 'gh', rot: `GitHub · ${o}/${r}` };
    }
    if (YT.test(u)) return { tipo: 'youtube', icon: 'play', cls: 'yt', rot: 'Vídeo no YouTube' };
    if (/(drive|docs)\.google\./.test(u)) return { tipo: 'link', icon: 'file', cls: 'gd', rot: 'Google Drive' };
    let host = '';
    try {
      host = new URL(u).hostname.replace(/^www\./, '');
    } catch (_) {
      /* link inválido */
    }
    return { tipo: 'link', icon: 'link', cls: 'link', rot: host || 'Link' };
  }
  const k = m.kind === 'link' ? 'pdf' : m.kind;
  return {
    tipo: k === 'pdf' ? 'pdf' : k === 'imagem' ? 'imagem' : 'arquivo',
    icon: k === 'zip' ? 'zip' : k === 'imagem' ? 'image' : 'pdf',
    cls: k,
    rot: m.meta || { pdf: 'PDF', zip: 'ZIP', slides: 'Slides', texto: 'Texto' }[k] || 'Arquivo',
  };
}
function materialRow(m, i) {
  const inf = matInfo(m);
  return `<li class="mat st" ${st(6 + i)} data-act="mat-abrir" data-url="${esc(m.url || '')}" data-kind="${esc(m.kind || '')}" data-name="${esc(m.name)}" data-meta="${esc(m.meta || '')}" role="button" tabindex="0"><span class="mat-ic ${inf.cls}">${ic(inf.icon)}</span><span class="mat-tx"><b>${esc(m.name)}</b><small>${m.fresh ? `<em>${m.fresh}</em>` : esc(inf.tipo === 'link' || inf.tipo === 'github' || inf.tipo === 'youtube' ? inf.rot : m.meta || inf.rot)}</small></span>${ic('chev', 'i mat-go')}</li>`;
}
const ghCache = {};
async function ghRepo(o, r) {
  const k = `${o}/${r}`;
  if (ghCache[k]) return ghCache[k];
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error('GitHub indisponível');
  return (ghCache[k] = await res.json());
}
const numK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')} mil` : String(n));
async function matAbrir(m) {
  const inf = matInfo(m);
  let url = matUrl(m.url);
  if (!url) {
    toast('Este material ainda não tem arquivo nem link.');
    return;
  }
  if (url.startsWith('data:')) {
    try {
      url = URL.createObjectURL(await (await fetch(url)).blob());
    } catch (_) {
      /* fica o data: */
    }
  }
  const baixar = m.url && m.url.startsWith('/api/') ? `${url}${url.includes('?') ? '&' : '?'}baixar=true` : url;
  let corpo;
  if (inf.tipo === 'pdf') corpo = `<iframe class="mv-doc" src="${esc(url)}#view=FitH" title="${esc(m.name)}"></iframe>`;
  else if (inf.tipo === 'imagem') corpo = `<div class="mv-img"><img src="${esc(url)}" alt="${esc(m.name)}"></div>`;
  else if (inf.tipo === 'youtube')
    corpo = `<div class="mv-vid"><iframe src="https://www.youtube-nocookie.com/embed/${esc(YT.exec(m.url)[1])}" title="${esc(m.name)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  else if (inf.tipo === 'github')
    corpo = `<div class="mv-gh" data-gh="${esc(m.url)}"><div class="gh-card carregando">${ic('github')}<b>${esc(GH.exec(m.url)[1])}/${esc(GH.exec(m.url)[2])}</b><small>Carregando o repositório…</small></div></div>`;
  else
    corpo = `<div class="mv-card"><span class="mat-ic ${inf.cls} big">${ic(inf.icon)}</span><b>${esc(m.name)}</b><small>${esc(inf.rot)}</small></div>`;
  const acoes =
    inf.tipo === 'github'
      ? `<a class="btn primary" href="${esc(m.url)}" target="_blank" rel="noopener">${ic('github')}Abrir no GitHub</a><button class="btn soft" data-act="mv-clone" data-url="${esc(m.url.replace(/\/$/, ''))}.git">${ic('copy')}Copiar git clone</button>`
      : inf.tipo === 'link' || inf.tipo === 'youtube'
        ? `<a class="btn primary" href="${esc(m.url)}" target="_blank" rel="noopener">${ic('open')}Abrir ${inf.tipo === 'youtube' ? 'no YouTube' : 'o link'}</a>`
        : `<a class="btn soft" href="${esc(url)}" target="_blank" rel="noopener">${ic('open')}Nova aba</a><a class="btn primary" href="${esc(baixar)}" download="${esc(m.name)}">${ic('download')}Baixar</a>`;
  openOverlay(
    `<div class="mv" role="dialog" aria-label="${esc(m.name)}"><header><span class="mat-ic ${inf.cls}">${ic(inf.icon)}</span><span><b>${esc(m.name)}</b><small>${esc(inf.rot)}</small></span><button class="iconbtn" data-act="closeov" aria-label="Fechar">${ic('x')}</button></header><div class="mv-corpo">${corpo}</div><footer>${acoes}</footer></div>`,
    'matview',
  );
  if (inf.tipo === 'github') {
    const [, o, r] = GH.exec(m.url);
    const alvo = $('.mv-gh', ov);
    try {
      const g = await ghRepo(o, r);
      if (!alvo?.isConnected) return;
      alvo.innerHTML = `<div class="gh-card"><header><img src="${esc(g.owner?.avatar_url || '')}" alt=""><span><small>${esc(g.owner?.login || o)}</small><b>${esc(g.name || r)}</b></span>${ic('github')}</header>
          ${g.description ? `<p>${esc(g.description)}</p>` : ''}
          <ul><li>${ic('star')}<b>${numK(g.stargazers_count || 0)}</b><small>estrelas</small></li><li>${ic('route')}<b>${numK(g.forks_count || 0)}</b><small>forks</small></li>${g.language ? `<li>${ic('code')}<b>${esc(g.language)}</b><small>linguagem</small></li>` : ''}</ul>
          <small class="gh-at">Atualizado em ${new Date(g.pushed_at || g.updated_at).toLocaleDateString('pt-BR')}${g.license?.spdx_id && g.license.spdx_id !== 'NOASSERTION' ? ` · ${esc(g.license.spdx_id)}` : ''}</small></div>`;
    } catch (_) {
      if (alvo?.isConnected)
        alvo.innerHTML = `<div class="gh-card">${ic('github')}<b>${esc(o)}/${esc(r)}</b><small>Sem conexão com o GitHub agora. O link abre normalmente.</small></div>`;
    }
  }
}

function questionsOf(id) {
  const list = [...(S.asked[id] || []), ...(D.questions[id] || [])].sort(
    (a, b) => b.votes + S.votes.has(b.id) - (a.votes + S.votes.has(a.id)),
  );
  if (!list.length) return '<p class="desc">Nenhuma pergunta ainda. Envie a primeira.</p>';
  return `<ul class="qa">${list.map((q) => `<li><button class="vote ${S.votes.has(q.id) ? 'on' : ''}" data-act="vote" data-q="${q.id}" aria-pressed="${S.votes.has(q.id)}" aria-label="Apoiar pergunta">${ic('up')}<b>${q.votes + (S.votes.has(q.id) ? 1 : 0)}</b></button><div><p>${esc(q.text)}</p><small>${esc(q.who)}</small></div></li>`).join('')}</ul>`;
}

/* Prévia em 3D: uma imagem parada do andar, com a sala em destaque. */
const thumb = (x, i) =>
  `<button class="mapthumb st" ${st(i)} ${mapAct(x)} aria-label="Ver ${x.room} no mapa"><canvas class="thumb3d"></canvas><span>Ver no mapa ${ic('arrow')}</span></button>`;
const mountThumb = (x) => (page) => {
  const cv = $('canvas.thumb3d', page);
  if (!cv) return;
  const draw = () => {
    if (!cv.isConnected) return;
    const ready = window.Campus3D.preview(cv, x.place ? { place: x.place } : { floor: x.floor, zone: x.zone });
    if (!ready) setTimeout(draw, 600);
  };
  setTimeout(draw, reduce ? 30 : 460);
};

/* O que a pessoa ministra (cada um ministra uma atividade): a foto escolhida para ela e os dados completos. */
function taughtShow(x) {
  const d = dayOf(x.day);
  const req = x.prerequisites || (x.requirements ? [x.requirements] : []);
  const vagas = x.seats ? Math.max(0, x.seats - (x.taken || 0)) : null;
  return `<h2 class="h st" ${st(1)}>Ministrando no ETAL</h2>
      <article class="mc-show st" ${st(2)}>
        <div class="mc-photo">${x.speakerPhoto ? `<img src="${esc(x.speakerPhoto)}" alt="${esc(x.speaker)}">` : spAv(x, true)}<span class="mc-kind">${ic(tipoDe(x).icon)}${esc(x.type)}</span></div>
        <div class="mc-body"><h3>${esc(x.title)}</h3>
          <ul class="mc-meta"><li>${ic('cal')}${d.long} · ${x.time} às ${x.end}</li><li>${ic('pin')}${esc(whereOf(x))}</li>${vagas !== null ? `<li>${ic('users')}${vagas} de ${x.seats} vagas</li>` : ''}</ul>
          <p class="mc-desc">${esc(x.description)}</p>
          ${req.length ? `<h4>Pré-requisitos</h4><ul class="mc-req">${req.map((r) => `<li>${ic('check')}<span>${esc(r)}</span></li>`).join('')}</ul>` : ''}
          ${x.learn?.length ? `<h4>O que você vai fazer</h4><ol class="mc-learn">${x.learn.map((l, i) => `<li><b>${i + 1}</b><span>${esc(l)}</span></li>`).join('')}</ol>` : ''}
          <div class="mc-acts"><button class="btn primary" ${goOf(x)}>Ver ${esc(x.type.toLowerCase())}</button><button class="btn soft" ${mapAct(x)}>${ic('route')}Como chegar</button></div>
        </div></article>`;
}
Screens.speaker = ({ id }) => {
  const base = byId(id);
  if (base.speakerId) {
    const own = base.speakerId === String(D.person.id);
    const profile = own
      ? D.person
      : otherProfile(base.speakerId) || communityPeople().find((p) => p.id === base.speakerId) || {};
    const extra = own ? cardGet() || {} : profile.card || {};
    const person = {
      ...profile,
      id: base.speakerId,
      name: base.speaker,
      officialName: base.speaker,
      initials: profile.initials || base.initials,
      photo: (own ? D.person.photo : profile.photo) || null,
      role: base.role,
      source: 'speaker',
    };
    return {
      html: `${header('Ministrante')}<div class="pad stack speaker"><div class="sp-card st" ${st(0)}>${cardPreview(extra, person, { own, taught: false })}<span class="sp-badge">${ic('mic')}Palestrante</span></div>${taughtShow(base)}</div>`,
    };
  }
  const list = D.sessions.filter((x) => x.speakerShort === base.speakerShort);
  return {
    html: `${header('')}<div class="pad stack speaker">
        ${base.self ? `<div class="sp-card st" ${st(0)}>${cardPreview(cardGet() || { publish: true }, D.person)}<span class="sp-badge">${ic('mic')}Palestrante</span></div>` : `<section class="sp-hero st" ${st(0)}>${spAv(base, true)}<h1>${base.speaker}</h1><p>${base.role}</p></section>`}
        <h2 class="h st" ${st(1)}>${list.length === 1 ? 'Atividade no ETAL' : 'Atividades no ETAL'}</h2>
        <ul class="splist st" ${st(2)}>${list.map((x) => `<li ${goOf(x)}><span class="date"><small>${dayOf(x.day).week}</small><b>${x.day}</b></span><span><b>${x.short}</b><small>${x.type}</small><em>${x.time} às ${x.end} · ${x.room}</em></span>${ic('chev', 'i chev')}</li>`).join('')}</ul>
        ${
          list.some((x) => x.learn.length)
            ? `<h2 class="h st" ${st(3)}>Assuntos</h2><ul class="learn st" ${st(4)}>${list
                .flatMap((x) => x.learn)
                .slice(0, 5)
                .map((l) => `<li>${ic('check')}<span>${l}</span></li>`)
                .join('')}</ul>`
            : ''
        }

      </div>`,
  };
};

Screens.activity = ({ id }) => {
  const s = byId(id);
  const here = S.present[id];
  const d = dayOf(s.day);
  if (s.simple) {
    return {
      mount: mountThumb(s),
      html: `${header('')}<div class="pad stack detail">
          <span class="kind st" ${st(0)}>${s.type}</span>
          <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
          <ul class="info st" ${st(2)}><li>${ic('cal')}${d.long} · ${s.time} às ${s.end}</li><li>${ic('pin')}${whereOf(s)}</li></ul>
          ${thumb(s, 3)}
          <p class="desc st" ${st(4)}>${s.description}</p>
        </div>
        <div class="cta-bar"><button class="btn primary big" ${mapAct(s)}>${ic('route')}Como chegar</button></div>`,
    };
  }
  if (here) {
    return {
      html: `${header('', { right: `<button class="iconbtn" data-act="share" data-id="${id}" aria-label="Enviar para o computador">${ic('laptop')}</button>` })}
        <div class="pad stack class-open">
          <div class="co-head st" ${st(0)}><span class="tag ok">${ic('check')}Presença às ${here}</span><span class="kind">${s.type} · ${s.room}</span></div>
          <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
          <button class="teacher st" ${st(2)} data-go="speaker" data-id="${id}">${spAv(s, true)}<span><b>${s.speakerShort}</b><small>${s.role}</small></span><span class="time"><b>${s.time}–${s.end}</b><small>${d.week}, ${s.day} nov</small></span></button>
          <button class="sendpc st" ${st(3)} data-act="share" data-id="${id}"><span class="sp-ic">${ic('laptop')}</span><span><b>Abrir no computador</b><small>${s.link}</small></span>${ic('chev')}</button>
          <section class="st" ${st(4)}><h2 class="h">Materiais</h2></section>
          <ul class="mats">${s.materials.map(materialRow).join('')}</ul>
          <section class="block st" ${st(10)}><h2 class="h">Nesta aula</h2><ul class="learn">${s.learn.map((l) => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul></section>
          <section class="block st" ${st(11)}><h2 class="h">Leve para a sala</h2><p class="desc">${s.requirements}</p></section>
          <section class="block st" ${st(12)}><div class="sec"><h2>Perguntas</h2><button data-act="ask" data-id="${id}">Perguntar</button></div>${questionsOf(id)}</section>
          <section class="block rate st" ${st(13)}><h2 class="h">Avalie esta atividade</h2><div class="stars" role="radiogroup" aria-label="Nota">${[1, 2, 3, 4, 5].map((n) => `<button class="${(S.ratings[id] || 0) >= n ? 'on' : ''}" data-act="rate" data-id="${id}" data-n="${n}" aria-label="${n} de 5">${ic('star')}</button>`).join('')}</div></section>
        </div>`,
    };
  }
  /* bloco de cada tipo: palestra destaca quem fala; mesa mostra a roda de conversa; minicurso e oficina, o que se faz e o que levar */
  /* Detalhe no padrão "bater o olho": tipo e título; quem; dois blocos grandes (quando e vagas); o mapa com a sala como
       cartão (tocar leva até lá); o lembrete numa linha só. Os textos (sobre, o que se faz, o que levar, perguntas) vêm
       depois, curtos, e a descrição abre com "Ler mais". */
  const t = tipoDe(s);
  const lembrete = S.reminders.has(id);
  const quem =
    t.g === 'mesa'
      ? `<section class="roda st" ${st(2)}><ul>${pessoasDe(s)
          .map(
            (p, i) => `<li>${spAv(p)}<span><b>${p.name}</b><small>${i === 0 ? 'Mediação' : p.role}</small></span></li>`,
          )
          .join('')}</ul></section>`
      : `<button class="teacher ${t.g === 'pal' ? 'quem-fala' : ''} st" ${st(2)} data-go="speaker" data-id="${id}">${spAv(s, t.g === 'pal')}<span><b>${s.speakerShort}</b><small>${s.role}</small></span>${ic('chev', 'i card-chev')}</button>`;
  const vagasRestam = s.seats ? Math.max(0, s.seats - s.taken) : null;
  const blocos = `<div class="glance st" ${st(3)}>
        <div class="gl-quando"><small>${d.week} · ${s.day} nov</small><b>${s.time}</b><span>até ${s.end}${duracao(s) ? ` · ${duracao(s)}` : ''}</span></div>
        ${vagasRestam == null ? '' : `<div class="gl-vagas ${vagasRestam === 0 ? 'cheio' : vagasRestam <= 5 ? 'pouca' : ''}"><small>Vagas</small><b>${vagasRestam === 0 ? 'Esgotado' : vagasRestam}</b>${vagasRestam ? `<span>de ${s.seats}</span>` : ''}${seatBar(s)}</div>`}
      </div>`;
  const lugar = `<button class="lugar st" ${st(4)} ${mapAct(s)} aria-label="Ver ${s.room} no mapa"><canvas class="thumb3d"></canvas><span class="lg-tx"><b>${s.room}</b><small>${Number.isInteger(s.floor) ? floorOf(s.floor).label : ''}</small></span><span class="lg-ir">${ic('route')}Como chegar</span></button>`;
  const lembrar = `<button class="remindrow st ${lembrete ? 'on' : ''}" ${st(5)} data-act="remind" data-id="${id}" aria-pressed="${lembrete}">${ic('alarm')}<span>${lembrete ? `Lembrete às ${hhmm(toMin(s.time) - LEAD)}` : `Lembrar ${LEAD} min antes`}</span><i class="switch"></i></button>`;
  const fonte = '';
  const sobre = s.description
    ? `<section class="sobre st" ${st(6)}><h2 class="h">Sobre</h2><p class="desc clamp" data-act="lermais">${s.description}</p></section>`
    : '';
  /* "Notebook com Node.js instalado e conhecimentos básicos de JavaScript." vira dois itens */
  const leva =
    s.prerequisites ||
    (s.requirements || '')
      .replace(/\.$/, '')
      .split(/,\s*|\s+e\s+(?=[a-zà-ú]+\s)/i)
      .filter(Boolean);
  const extra =
    t.g === 'mini'
      ? `${s.learn?.length ? `<section class="st" ${st(7)}><h2 class="h">O que você vai fazer</h2><ol class="passos-aula">${s.learn.map((l) => `<li>${l}</li>`).join('')}</ol></section>` : ''}${leva.length ? `<section class="levar st" ${st(8)}><h2 class="h">${ic('laptop')}${esc(s.requirementsTitle || 'Leve para a sala')}</h2><ul>${leva.map((l) => `<li>${l.charAt(0).toUpperCase() + l.slice(1)}</li>`).join('')}</ul></section>` : ''}`
      : t.g === 'pal' || t.g === 'mesa'
        ? `<section class="block st" ${st(7)}><div class="sec"><h2>Perguntas</h2><button data-act="ask" data-id="${id}">Perguntar</button></div>${questionsOf(id)}</section>`
        : '';
  return {
    mount: mountThumb(s),
    html: `${header('', { right: `<button class="iconbtn bm ${S.saved.has(id) ? 'on' : ''}" data-act="save" data-id="${id}" aria-label="Salvar">${ic('bookmark')}</button>` })}
      <div class="pad stack detail detalhe-v2">
        <span class="kind kind-tp tp-${t.k} st" ${st(0)}>${ic(t.icon)}${s.type}</span>
        <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
        ${t.g === 'mesa' ? '' : quem}
        ${blocos}
        ${lugar}
        ${t.g === 'mesa' ? quem.replace('<ul>', '<h2 class="h">Quem conversa</h2><ul>') : ''}
        ${lembrar}
        ${DEMO && lembrete ? `<button class="remindtest st" ${st(5)} data-act="remindtest" data-id="${id}">${ic('bell')}Ver como o lembrete chega</button>` : ''}
        ${fonte}${sobre}
        ${extra}
        ${s.materials.length ? `<p class="locked st" ${st(9)}>${ic('lock')}${s.materials.length} ${s.materials.length === 1 ? 'material' : 'materiais'} depois da presença</p>` : ''}
      </div>
      <div class="cta-bar"><button class="btn primary big" data-act="scan">${ic('qr')}Registrar presença</button></div>`,
  };
};

const searchBtn = () =>
  `<button class="search" data-act="finder">${ic('search')}<span>Buscar sala, atividade, banheiro…</span></button>`;
/* Parte de baixo do mapa: controles à direita, abas e busca perto do polegar e, por último, a folha do lugar. */
const mapBottom = (sheet, extra = '') =>
  `<div class="map-bottom ${/class="sheet-card[^"]*detail/.test(sheet) ? 'has-detail' : ''}">${camCtrl()}<div class="map-dock">${extra}${viewSeg()}${!window.ASSET_DATA && new URLSearchParams(location.search).get('mapa') === 'novo' ? `<button class="btn soft" data-act="mapanovo">Explorar novo mapa 3D</button>` : ''}${searchBtn()}</div>${sheet}</div>`;
const MAP_TABS = [
  ['evento', 'Evento'],
  ['bloco', 'Andares'],
  ['campus', 'Campus'],
];
const viewSeg = () =>
  `<div class="seg" style="--k:${MAP_TABS.findIndex(([v]) => v === S.mapView)}"><i class="seg-ind"></i>${MAP_TABS.map(([v, t]) => `<button class="${S.mapView === v ? 'on' : ''}" data-act="mapview" data-v="${v}">${t}</button>`).join('')}</div>`;
const dimToggle = () => {
  if (!window.Campus3D.canUse3D()) return '';
  const f = window.Campus3D.isFlat();
  return `<div class="dim" role="group" aria-label="Tipo de vista" style="--k:${f ? 1 : 0}"><i></i><button class="${f ? '' : 'on'}" data-act="dim" data-v="3d" aria-pressed="${!f}">3D</button><button class="${f ? 'on' : ''}" data-act="dim" data-v="2d" aria-pressed="${f}">2D</button></div>`;
};
const EVENT_PLACES = ['principal', 'auditorio', 'cantina', 'patio'];
