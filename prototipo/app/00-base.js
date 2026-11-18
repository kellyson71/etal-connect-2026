/* app/00-base.js · dados, utilitários e ícones.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
const D = window.DATA;
const P = window.PLAN;
const $ = (s, el = document) => el.querySelector(s);
const osReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduce = osReduce;
const byId = (id) => D.sessions.find((s) => s.id === id);
const dayOf = (n) => D.days.find((d) => d.day === n);

/* ---------------- ícones ---------------- */
const ICONS = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  nav: '<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  file: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4"/>',
  pdf: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
  zip: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M11 6h1M11 9h1M11 12h1v3h-1z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  trophy:
    '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  route:
    '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  swords:
    '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5 6 3H3v3l3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10Z"/><path d="M12 3v4M21 10l-5 0M17 20l-2.5-5M7 20l2.5-5M3 10h5"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.500-2.900-5.500 2.900 1-6.200L3 9.600l6.200-.900Z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.500 14-1.500 8 5-3 5 3-1.500-8"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  flag: '<path d="M5 21V4c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
  pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-4-4L5 15Z"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3.500A8 8 0 1 1 21 12Z"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  moon: '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2M12 19.500v2M2.500 12h2M19.500 12h2M5.300 5.300l1.400 1.400M17.300 17.300l1.400 1.400M5.300 18.700l1.400-1.400M17.300 6.700l1.400-1.400"/>',
  text: '<path d="M4 19 9 6l5 13M5.800 15h6.400M15 19l3-7 3 7M16 17h4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  phone: '<rect x="6" y="2.500" width="12" height="19" rx="2.500"/><path d="M10.500 18.500h3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m4 7 8 6 8-6"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  github:
    '<path fill="currentColor" stroke="none" d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.57v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3"/>',
  play: '<rect x="2.500" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/>',
  contact: '<circle cx="9" cy="8" r="3.500"/><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6"/>',
  alarm: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.300 21a1.900 1.900 0 0 0 3.400 0"/>',
  drop: '<path d="M12 3c4 5 6.500 8.200 6.500 11.500a6.500 6.500 0 0 1-13 0C5.500 11.200 8 8 12 3Z"/>',
  wc: '<circle cx="7.500" cy="5" r="2"/><path d="M5 22v-7H4l1.500-7h4L11 15h-1v7"/><circle cx="16.500" cy="5" r="2"/><path d="M15 22V9h3v13"/>',
  sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3Z"/><path d="M6 18v2M18 18v2"/>',
  sliders:
    '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  rotate:
    '<path d="M4 12a8 8 0 0 1 13.700-5.700L20 8.600M20 4v4.600h-4.600"/><path d="M20 12a8 8 0 0 1-13.700 5.700L4 15.400M4 20v-4.600h4.600"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M2 21h20M8 8h3M8 12h3M8 16h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
};
const ic = (n, c = 'i') =>
  `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const st = (i) => `style="--i:${i}"`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* Marca: três hexágonos do ETAL. O "E" em pixels fica no vermelho. */
const hexPath = 'M0-15 13-7.500V7.500L0 15-13 7.500V-7.500Z';
const mark = (cls = 'mark') => `<svg class="${cls}" viewBox="1 -3 44 78" aria-hidden="true">
    <g class="hx hx1" transform="translate(16 36)"><path d="${hexPath}" fill="#d6332c"/><path d="M-5-7h10v2.800h-6.800v2.800h5.400v2.800h-5.400v2.800h6.800V7H-5Z" fill="#fff"/></g>
    <g class="hx hx2" transform="translate(30 13)"><path d="${hexPath}" fill="#65b32e"/><path d="M0-7a4.600 4.600 0 0 1 2.700 8.300V3h-5.400V1.300A4.600 4.600 0 0 1 0-7ZM-2 5.200h4" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/></g>
    <g class="hx hx3" transform="translate(30 59)"><path d="${hexPath}" fill="#65b32e"/><rect x="-6.500" y="-5" width="13" height="9" rx="1.500" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M-1.600-2.800V1.800L2.400-.500Z" fill="#fff"/><path d="M-3 6.500h6" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/></g></svg>`;
const meAv = (cls = 'av') =>
  D.person.photo
    ? `<span class="${cls} has-photo"><img src="${esc(D.person.photo)}" alt=""></span>`
    : `<span class="${cls}">${esc(D.person.initials)}</span>`;
const TINTS = [
  '#dfe8fa,#22386f',
  '#e6f3dc,#2f6f12',
  '#fde8e6,#a5302a',
  '#fff1d6,#8a5200',
  '#e7e4fb,#46389a',
  '#d9f1f1,#116466',
];
const spAv = (s, big = false) => {
  const photo = s.speakerPhoto || (s.self && D.person.photo);
  if (photo) return `<span class="ava${big ? ' lg' : ''} has-photo"><img src="${esc(assetUrl(photo))}" alt=""></span>`;
  const [bg, fg] = TINTS[(s.initials.charCodeAt(0) + s.initials.charCodeAt(1)) % TINTS.length].split(',');
  return `<span class="ava${big ? ' lg' : ''}" style="background:${bg};color:${fg}">${s.initials}</span>`;
};
const goOf = (x) =>
  x.tournament ? `data-go="tournament" data-id="${x.tournament}"` : `data-go="activity" data-id="${x.id}"`;
const mapAct = (x) =>
  x.place
    ? `data-act="openplace" data-id="${x.place}"`
    : `data-act="openmap" data-floor="${x.floor}" data-zone="${x.zone}"`;
/* Tipos de atividade: cada um tem cor (classe tp-*), ícone, card próprio na agenda e um bloco próprio no detalhe.
     g é o filtro da agenda (oficina anda junto com minicurso: as duas são mão na massa). Tipos novos entram aqui;
     os demais continuam como cartões completos, com ícone de calendário. */
const TIPOS = {
  Palestra: { k: 'pal', g: 'pal', icon: 'mic', plural: 'Palestras', formato: 'Uma pessoa fala; perguntas no fim' },
  'Mesa-redonda': {
    k: 'mesa',
    g: 'mesa',
    icon: 'chat',
    plural: 'Mesas',
    formato: 'Conversa entre convidados; a plateia pergunta',
  },
  Minicurso: { k: 'mini', g: 'mini', icon: 'laptop', plural: 'Minicursos', formato: 'Aula prática, no computador' },
  Oficina: { k: 'ofi', g: 'mini', icon: 'laptop', plural: 'Oficinas', formato: 'Mão na massa, em grupo' },
  Campeonato: { k: 'camp', g: 'camp', icon: 'trophy', plural: 'Campeonatos', formato: 'Chave eliminatória' },
  Abertura: { k: 'pal', g: 'pal', icon: 'mic', plural: 'Aberturas', formato: 'Abertura do encontro' },
  Apresentação: { k: 'mesa', g: 'out', icon: 'star', formato: 'Apresentação cultural' },
  Encerramento: { k: 'mesa', g: 'out', icon: 'award', formato: 'Encerramento e premiações' },
  Credenciamento: { k: 'mini', g: 'out', icon: 'id', formato: 'Recepção dos participantes' },
};
const TIPOS_G = new Set(['pal', 'mesa', 'mini', 'camp']);
const tipoDe = (x) => TIPOS[x.type] || { k: 'out', g: 'out', icon: 'cal', formato: '' };
/* Minicurso e oficina têm vaga limitada e a inscrição é feita no SUAP: no app não se salvam. No SUAP a inscrição é por
   atividade (minicurso, palestra, mesa...), feita antes do evento; o servidor acha a pessoa nas listas de inscritos e
   manda essas atividades em S.inscricoes. Sem servidor, os minicursos da agenda de exemplo contam como inscritos. */
const comInscricao = (x) => tipoDe(x).g === 'mini';
const inscrito = (x) => !!x && (S.inscricoes.has(x.id) || (comInscricao(x) && S.saved.has(x.id)));
const linkInscricao = (x) => x.inscricao || x.link || '';
const vagasLivres = (x) => (x.seats ? Math.max(0, x.seats - (x.taken || 0)) : null);
/* vagas preenchidas, discreto: barrinha e "26 de 30" (cheio vira "Esgotado") */
const vagasLinha = (x) =>
  !x.seats
    ? ''
    : `<span class="vagas-linha ${vagasLivres(x) === 0 ? 'cheio' : vagasLivres(x) <= 5 ? 'pouca' : ''}">${seatBar(x)}<small>${vagasLivres(x) === 0 ? 'Esgotado' : `${Math.min(x.taken || 0, x.seats)} de ${x.seats} vagas`}</small></span>`;
const duracao = (x) => {
  if (!x.end) return '';
  const [a, b] = [x.time, x.end].map((t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  });
  const d = b - a;
  return d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? String(d % 60).padStart(2, '0') : ''}` : `${d} min`;
};
const pessoasDe = (x) =>
  [{ name: x.speakerShort, initials: x.initials, role: x.role }, ...(x.guests || [])].filter((p) => p.name);
const whereOf = (x) => (x.floor === undefined ? x.room : `${x.room} · ${floorOf(x.floor).label}`);
const isNow = (x) => x.day === D.now.day && x.time <= D.now.time && D.now.time < x.end;
/* Mapa novo: a rota sai da sala da atividade em que a pessoa está inscrita acontecendo agora; sem ela, da portaria. */
const origemAgora = () => {
  const x = D.sessions.find((q) => S.saved.has(q.id) && isNow(q) && Number.isInteger(q.floor) && q.zone);
  return x ? { floor: x.floor, zone: x.zone, titulo: x.room || x.short || x.title } : null;
};
/* a próxima atividade em que a pessoa está inscrita (a de agora conta até acabar); o mapa mostra só ela, numa pílula */
const proximaMinha = () => {
  const nowMin = (() => {
    const [h, m] = D.now.time.split(':').map(Number);
    return h * 60 + m;
  })();
  const fim = (x) => {
    const [h, m] = x.end.split(':').map(Number);
    return h * 60 + m;
  };
  const x = D.sessions
    .filter(
      (q) =>
        S.saved.has(q.id) &&
        Number.isInteger(q.floor) &&
        q.zone &&
        q.end &&
        (q.day > D.now.day || (q.day === D.now.day && fim(q) > nowMin)),
    )
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))[0];
  if (!x) return null;
  const dia = x.day === D.now.day ? (isNow(x) ? 'agora' : x.time) : `${dayOf(x.day).week} ${x.time}`;
  return { id: x.id, title: x.short || x.title, time: x.time, floor: x.floor, zone: x.zone, quando: dia };
};
const speakersList = () => {
  const seen = new Set();
  return D.sessions.filter((x) => x.speakerShort && !seen.has(x.speakerShort) && seen.add(x.speakerShort));
};
const hoursOf = (s) => {
  const [a, b] = [s.time, s.end].map((t) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  });
  return b - a;
};
const seatBar = (s) =>
  !s.seats
    ? ''
    : `<span class="seats ${s.taken >= s.seats ? 'full' : ''}"><i style="width:${Math.round((s.taken / s.seats) * 100)}%"></i></span>`;
/* Ilustrações dos estados vazios: colmeia em traço fino, sempre com o motivo da tela. */
/* Favo sendo preenchido: a célula do meio traz o motivo da tela, e as outras acendem em sequência. */
function illo(kind) {
  const hexP = 'M0-22 19-11V11L0 22-19 11V-11Z';
  const glyph = {
    file: '<path d="M-8-11H3l6 6V11H-8ZM3-11v6h6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>',
    mark: '<path d="M-7-11H7V11L0 6-7 11Z" fill="#fff"/>',
    people:
      '<circle cy="-4" r="4.800" fill="none" stroke="#fff" stroke-width="2.200"/><path d="M-9 11a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/>',
    bell: '<path d="M-8 6c1.500-2 1.500-4 1.500-7a6.500 6.500 0 0 1 13 0c0 3 0 5 1.500 7ZM-2 10h4" fill="none" stroke="#fff" stroke-width="2.200" stroke-linejoin="round" stroke-linecap="round"/>',
  }[kind];
  const CELLS = [
    [-19, -33, 'honey'],
    [19, -33, 'line'],
    [-38, 0, 'line'],
    [38, 0, 'honey2'],
    [-19, 33, 'honey2'],
    [19, 33, 'line'],
  ];
  return `<svg class="illo" viewBox="-66 -62 132 124" aria-hidden="true">${CELLS.map(([x, y, k], i) => `<g transform="translate(${x} ${y})"><path class="il-c ${k}" style="--i:${i}" d="${hexP}"/></g>`).join('')}
      <g class="il-main"><path d="${hexP}" fill="var(--navy)"/>${glyph}</g></svg>`;
}
const buzz = (p) => {
  try {
    navigator.vibrate?.(p);
  } catch (_) {
    /* sem suporte */
  }
};
const SAVE_KEY = 'etal-perfil';
const API = window.ETAL_API; // null: só dados de exemplo
/* /demo (ou ?demo=1): ferramentas de teste, como os botões que simulam a leitura dos QRs. */
const DEMO = /^\/(demo|homologacao)(\/|$)/.test(location.pathname) || new URLSearchParams(location.search).has('demo');
const DEMO_PERSON = { ...D.person };
const store = {
  get(k) {
    try {
      return JSON.parse(sessionStorage.getItem(k));
    } catch (_) {
      return null;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, JSON.stringify(v));
    } catch (_) {
      /* opcional */
    }
  },
  del(k) {
    try {
      sessionStorage.removeItem(k);
    } catch (_) {
      /* opcional */
    }
  },
};
const prefs = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (_) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (_) {
      /* opcional */
    }
  },
};
const REM_KEY = 'etal-lembretes';
const LEAD = 10;
const remSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(REM_KEY)) || [];
  } catch (_) {
    return [];
  }
};

/* Ações dos elementos com data-act: cada assunto registra as suas aqui (arquivos 25-acoes-*.js). */
const ACOES = Object.create(null);
