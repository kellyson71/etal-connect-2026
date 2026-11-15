/* app/23-busca.js · busca.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- busca ---------------- */
const fold = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/* Comodidades: a busca mostra as mais perto da entrada do campus primeiro. */
const AMENITIES = [
  {
    k: 'banheiro',
    t: 'Banheiro',
    icon: 'wc',
    tone: 'b',
    syn: ['banheiro', 'banheiros', 'wc', 'sanitario', 'toalete'],
  },
  { k: 'bebedouro', t: 'Bebedouro', icon: 'drop', tone: 'w', syn: ['bebedouro', 'bebedouros', 'agua', 'beber'] },
  {
    k: 'descanso',
    t: 'Descanso',
    icon: 'sofa',
    tone: 'g',
    syn: ['descanso', 'descansar', 'sofa', 'puff', 'sentar', 'relaxar'],
  },
  { k: 'recepcao', t: 'Recepção', icon: 'check', tone: 'y', syn: ['recepcao', 'credenciamento', 'credencial'] },
  { k: 'escada', t: 'Escada', icon: 'stairs', tone: 'n', syn: ['escada', 'escadas', 'subir'] },
  { k: 'rampa', t: 'Rampa', icon: 'nav', tone: 'n', syn: ['rampa', 'acessivel', 'acessibilidade', 'cadeira'] },
];
const minTo = (lvl, zone) => {
  try {
    return Math.max(1, Math.round(window.Campus3D.routeInfo(lvl, zone).cost / 75));
  } catch (_) {
    return null;
  }
};
function amenityItems(a) {
  const out = [];
  const room = (f, z, t, d) =>
    out.push({
      t,
      d,
      i: a.icon,
      tone: a.tone,
      min: minTo(f.level, z.id),
      a: `data-k="room" data-floor="${f.level}" data-zone="${z.id}"`,
    });
  P.floors.forEach((f) =>
    f.zones.forEach((z) => {
      if (a.k === 'banheiro' && z.kind === 'restroom' && !z.closed)
        room(f, z, z.name || 'Banheiros', `Bloco principal · ${f.label}`);
      if (a.k === 'descanso' && z.kind === 'lounge') room(f, z, z.name, `Bloco principal · ${f.label}`);
      if (a.k === 'recepcao' && z.kind === 'reception')
        room(f, z, 'Recepção', `Entrada principal do bloco · ${f.label}`);
      if (a.k === 'escada' && z.kind === 'stairs' && f.level === 0) room(f, z, 'Escada', 'Bloco principal · ala oeste');
      if (a.k === 'rampa' && z.kind === 'ramp' && f.level === 0)
        room(f, z, 'Rampa', 'Bloco principal · lado da entrada');
    }),
  );
  if (a.k === 'bebedouro')
    (window.Campus3D.pois?.() || [])
      .filter((q) => q.kind === 'agua')
      .forEach((q) =>
        out.push({
          t: 'Bebedouro',
          d: q.where,
          i: a.icon,
          tone: a.tone,
          min: q.min,
          a: `data-k="poi" data-id="${q.id}"`,
        }),
      );
  return out.sort((x, y) => (x.min ?? 99) - (y.min ?? 99));
}
/* Temas: a busca por "IA", "web", "dados"… traz as atividades do tema (palavras inteiras, não pedaços). */
const SEARCH_TOPICS = {
  ia: [
    'inteligencia artificial',
    'ia',
    'machine learning',
    'aprendizado de maquina',
    'llm',
    'chatgpt',
    'redes neurais',
  ],
  dados: ['dados', 'python', 'analise', 'estatistica', 'pandas'],
  web: ['web', 'react', 'next', 'frontend', 'front-end', 'html', 'css', 'javascript', 'site'],
  mobile: ['mobile', 'react native', 'expo', 'aplicativo', 'app', 'android'],
  design: ['design', 'interface', 'interfaces', 'ux', 'ui', 'figma', 'experiencia'],
  seguranca: ['seguranca', 'senha', 'hacker', 'privacidade', 'golpe'],
  carreira: ['carreira', 'mercado', 'emprego', 'estagio', 'interior'],
  jogos: ['jogos', 'games', 'campeonato', 'mortal kombat', 'fifa'],
};
const words = (t) => ` ${fold(t).replace(/[^a-z0-9]+/g, ' ')} `;
const hasWord = (text, w) => words(text).includes(` ${w} `) || (w.length > 3 && words(text).includes(` ${w}`));
const actText = (x) =>
  `${x.title} ${x.short} ${x.type} ${x.description || ''} ${(x.learn || []).join(' ')} ${x.speaker || ''} ${x.role || ''}`;
function finderGroups(q) {
  const n = fold(q.trim());
  const groups = [];
  const theme =
    n &&
    Object.entries(SEARCH_TOPICS).find(([k, syn]) => k === n || syn.includes(n) || (n.length > 3 && k.startsWith(n)));
  const hits = n ? AMENITIES.filter((a) => a.syn.some((w) => w.startsWith(n) || n.startsWith(w))) : [];
  if (hits.length) groups.push(['Mais perto da entrada', hits.flatMap(amenityItems).slice(0, 6)]);
  const actItem = (x) => ({
    t: x.short,
    d: `${dayOf(x.day).week} ${x.day} · ${x.time} · ${x.room}`,
    i: 'cal',
    tone: 'n',
    live: isNow(x),
    a: `data-k="act" data-id="${x.id}"`,
  });
  if (theme) {
    const list = D.sessions.filter((x) => theme[1].some((w) => hasWord(actText(x), w)));
    if (list.length)
      groups.push([
        `Tema: ${theme[0] === 'ia' ? 'IA' : theme[0][0].toUpperCase() + theme[0].slice(1)}`,
        list.slice(0, 6).map(actItem),
      ]);
  }
  const shown = new Set(groups.flatMap(([, l]) => l.map((i) => i.a)));
  const acts = D.sessions
    .filter(
      (x) =>
        (!n || (n.length <= 3 ? hasWord(actText(x), n) : fold(actText(x)).includes(n))) &&
        (n || D.enrolled.includes(x.id)),
    )
    .map(actItem)
    .filter((i) => !shown.has(i.a));
  if (acts.length) groups.push([n ? 'Atividades' : 'Suas atividades', acts.slice(0, 5)]);
  if (n && n.length > 2) {
    const seen = new Set();
    const people = [];
    D.sessions
      .filter((x) => x.speaker && fold(x.speaker).includes(n))
      .forEach((x) => {
        if (!seen.has(x.speaker)) {
          seen.add(x.speaker);
          people.push({
            t: x.speaker,
            d: `${x.role || 'Palestrante'} · ${x.short}`,
            i: 'mic',
            tone: 'y',
            a: `data-k="act" data-id="${x.id}"`,
          });
        }
      });
    if (people.length) groups.unshift(['Palestrantes', people.slice(0, 4)]);
  }
  if (n) {
    const rooms = [];
    P.floors.forEach((f) =>
      f.zones
        .filter(
          (z) =>
            ![
              'courtyard',
              'water',
              'wall',
              'ramp',
              'stairs',
              ...(hits.length ? ['restroom', 'lounge', 'reception'] : []),
            ].includes(z.kind),
        )
        .forEach((z) => {
          const rt = `${zoneName(z)} ${z.useLabel} ${z.roomNumber} ${z.name || ''}`;
          if (n.length <= 3 && !/^\d+$/.test(n) ? hasWord(rt, n) : fold(rt).includes(n))
            rooms.push({
              t: zoneName(z),
              d: `${z.name && z.roomNumber ? `Sala ${z.roomNumber} · ` : ''}${f.label}`,
              i: 'pin',
              tone: 'n',
              a: `data-k="room" data-floor="${f.level}" data-zone="${z.id}"`,
            });
        }),
    );
    if (rooms.length) groups.push(['Salas', rooms.slice(0, 6)]);
  }
  const places = D.placeOrder
    .filter((id) => !n || fold(D.places[id].name).includes(n))
    .map((id) => ({
      t: D.places[id].name,
      d: D.places[id].kind,
      i: 'building',
      tone: 'n',
      a: `data-k="place" data-id="${id}"`,
    }));
  if (places.length) groups.push([n ? 'Lugares' : 'Lugares do campus', places.slice(0, n ? 5 : 8)]);
  return groups;
}
/* Busca no celular: a barra fica colada no teclado e os resultados crescem para cima,
     com o melhor logo acima da barra (perto do polegar). Enter abre o melhor já com a rota. */
const actItemF = (x) => ({
  t: x.short,
  d: `${dayOf(x.day).week} ${x.day} · ${x.time} · ${x.room}`,
  i: 'cal',
  tone: 'n',
  live: isNow(x),
  a: `data-k="act" data-id="${x.id}"`,
});
function finderActs() {
  const upcoming = D.sessions.filter(
    (x) => !x.simple && (x.day > D.now.day || (x.day === D.now.day && toMin(x.end) > toMin(D.now.time))),
  );
  const days = [...new Set(upcoming.map((x) => x.day))].sort((p, q) => p - q);
  return days.map((d) => [
    d === D.now.day ? 'Hoje' : `${dayOf(d).week} ${d}`,
    upcoming
      .filter((x) => x.day === d)
      .sort((p, q) => toMin(p.time) - toMin(q.time))
      .map(actItemF),
  ]);
}
const routable = (x) =>
  /data-k="(room|place)"/.test(x.a) ||
  (/data-k="poi"/.test(x.a) && window.Campus3D.hasRoute((/data-id="([^"]+)"/.exec(x.a) || [])[1])) ||
  (/data-k="act"/.test(x.a) &&
    (() => {
      const s = byId((/data-id="([^"]+)"/.exec(x.a) || [])[1]);
      return s && s.floor !== undefined && s.floor !== null;
    })());
const finderList = (q, mode) => {
  const g = mode === 'acts' ? finderActs() : q.trim() ? finderGroups(q) : [];
  if (!g.length)
    return q.trim()
      ? '<li class="none">Nada encontrado. Tente o número da sala, uma atividade ou “banheiro”.</li>'
      : '';
  const best = g[0][1][0];
  const row = (x) =>
    `<li data-act="findergo" ${x.a} class="${x === best ? 'best' : ''}"><span class="fd-ic ${x.tone}">${ic(x.i)}</span><div><b>${x.t}</b><small>${x.d}</small></div>${x.live ? '<em class="live">Agora</em>' : x.min ? `<em>${x.min} min</em>` : ''}${x === best && routable(x) ? `<button class="fd-route" data-act="findergo" data-route="1" ${x.a} aria-label="Rota até ${esc(x.t)}">${ic('route')}Rota</button>` : ''}</li>`;
  /* De baixo para cima: o primeiro grupo fica junto da barra, e o melhor item, logo acima dela. */
  return g
    .slice()
    .reverse()
    .map(([h, list]) => `<li class="fd-h">${h}</li>${list.slice().reverse().map(row).join('')}`)
    .join('');
};
function finderRender() {
  const i = $('#fq');
  const res = $('#fres');
  if (!i || !res) return;
  res.innerHTML = finderList(i.value, S.finderMode);
  res.closest('.finder').classList.toggle('has-res', !!res.innerHTML);
  $('[data-act="finderacts"]')?.classList.toggle('on', S.finderMode === 'acts');
  res.scrollTop = res.scrollHeight;
}
Overlays.finder = () => `<div class="sheet finder" role="dialog" aria-label="Buscar">
      <ul class="finder-res" id="fres" aria-live="polite"></ul>
      <div class="fd-chips">${AMENITIES.slice(0, 3)
        .map(
          (a) =>
            `<button data-act="finderq" data-q="${a.k}"><span class="fd-ic ${a.tone}">${ic(a.icon)}</span>${a.t}</button>`,
        )
        .join('')}</div>
      <div class="finder-bar"><label class="finder-in" for="fq">${ic('search')}<input id="fq" type="search" enterkeyhint="go" placeholder="Sala, atividade, banheiro…" autocomplete="off"></label><button class="fd-acts" data-act="finderacts" aria-label="Ver as atividades">${ic('cal')}<span>Atividades</span></button></div></div>`;
/* Teclado na tela: a busca sobe junto com ele (visualViewport funciona no Chrome e no Safari). */
function kbTrack(on) {
  const vv = window.visualViewport;
  if (!vv) return;
  const f = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    ov.style.setProperty('--kb', `${Math.round(kb)}px`);
    ov.classList.toggle('kb', kb > 60);
  };
  if (on) {
    vv.addEventListener('resize', f);
    vv.addEventListener('scroll', f);
    kbTrack.f = f;
    f();
  } else if (kbTrack.f) {
    vv.removeEventListener('resize', kbTrack.f);
    vv.removeEventListener('scroll', kbTrack.f);
    kbTrack.f = null;
    ov.style.removeProperty('--kb');
    ov.classList.remove('kb');
  }
}
document.addEventListener('keydown', (e) => {
  if (e.target.id !== 'fq' || e.key !== 'Enter') return;
  e.preventDefault();
  const best = $('#fres li.best');
  if (!best) return;
  e.target.blur();
  ($('.fd-route', best) || best).click();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'mapsky') {
    cancelAnimationFrame(skyAnim);
    horaManual = true;
    skyHour = +e.target.value;
    applySky();
    const o = $('#mapskyo');
    if (o) o.textContent = skyClock();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'accentpick') {
    UI.accent = e.target.value;
    uiSave();
    applyUI();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'accentpick') rerender();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'fq') {
    if (e.target.value.trim()) S.finderMode = null;
    finderRender();
  }
});
