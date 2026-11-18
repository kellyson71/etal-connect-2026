/* ETAL Connect · app do participante.
   GERADO por scripts/app/montar-app.mjs a partir de prototipo/app/ (um arquivo por assunto): não editar aqui. */
(() => {
  'use strict';

/* ===== app/00-base.js ===== */
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
/* Minicurso e oficina têm vaga limitada e a inscrição é feita no SUAP: no app não se salvam. Quem está inscrito vem da
   lista da organização (com servidor, a agenda importada; sem servidor, D.enrolled), e o app só mostra e leva ao SUAP. */
const comInscricao = (x) => tipoDe(x).g === 'mini';
const inscrito = (x) => comInscricao(x) && S.saved.has(x.id);
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

/* ===== app/01-personalizacao.js ===== */
/* app/01-personalizacao.js · temas, cores e preferências da interface (etal-ui).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- personalização ---------------- */
const THEMES = {
  etal: { name: 'ETAL', desc: 'Azul do NADIC', accent: '#22386f', hue: null },
  mel: { name: 'Mel', desc: 'Da apicultura', accent: '#8a5300', hue: 38 },
  mandacaru: { name: 'Mandacaru', desc: 'Verde da caatinga', accent: '#22633a', hue: 140 },
  sertao: { name: 'Sertão', desc: 'Terra e telha', accent: '#9c3f1f', hue: 18 },
  entardecer: { name: 'Entardecer', desc: 'Céu do fim de tarde', accent: '#55368f', hue: 265 },
};
const ACCENTS = ['#22386f', '#1f6fb2', '#0f766e', '#2f7d32', '#8a5300', '#b4372f', '#b0307a', '#55368f'];
const UI_DEFAULT = {
  mapa: 'novo',
  theme: 'etal',
  accent: null,
  mode: 'claro',
  badge: 'solido',
  corners: 'suaves',
  font: 'padrao',
  text: 'normal',
  motion: 'completas',
  sky: true,
  mapHour: true,
  layers: { labels: true, shadows: true, trees: true, cars: true },
  view: '3d',
  home: {
    atalhos: true,
    live: true,
    colmeia: true,
    agenda: true,
    palestrantes: true,
    campeonatos: true,
    avisos: true,
  },
};
const HOME_PARTS = [
  ['atalhos', 'Atalhos'],
  ['live', 'Campus ao vivo'],
  ['colmeia', 'Sua colmeia'],
  ['agenda', 'Sua agenda'],
  ['palestrantes', 'Palestrantes'],
];
const uiLoad = () => {
  try {
    const v = JSON.parse(localStorage.getItem('etal-ui'));
    return v
      ? {
          ...UI_DEFAULT,
          ...v,
          home: { ...UI_DEFAULT.home, ...(v.home || {}) },
          layers: { ...UI_DEFAULT.layers, ...(v.layers || {}) },
        }
      : null;
  } catch (_) {
    return null;
  }
};
let UI = uiLoad() || JSON.parse(JSON.stringify(UI_DEFAULT));
const uiSave = () => {
  try {
    localStorage.setItem('etal-ui', JSON.stringify(UI));
  } catch (_) {
    /* opcional */
  }
};
/* Cores: tudo é derivado do destaque, garantindo contraste. */
const toRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) =>
  `#${c
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
const toHSL = ([r, g, b]) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn,
    l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const sat = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, sat, l];
};
const hsl = (h, sat, l) => {
  const a = sat * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return toHex([f(0), f(8), f(4)]);
};
const lumOf = (hex) => {
  const c = toRGB(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lumOf(a), lumOf(b)].sort((u, v) => v - u);
  return (x + 0.05) / (y + 0.05);
};
/* Escurece ou clareia até atingir o contraste pedido. */
const fit = (h, sat, l, against, min, step) => {
  let v = Math.max(0.03, Math.min(0.97, l));
  let out = hsl(h, sat, v);
  while (contrast(out, against) < min && v > 0.02 && v < 0.98) {
    v += step;
    out = hsl(h, sat, v);
  }
  return out;
};
function tokensOf(dark) {
  const t = THEMES[UI.theme] || THEMES.etal;
  const accent = UI.accent || t.accent;
  const [h, sat0] = toHSL(toRGB(accent));
  const sat = Math.max(sat0, 0.28);
  const out = {};
  if (t.hue !== null) {
    const n = t.hue;
    Object.assign(
      out,
      dark
        ? {
            '--bg': hsl(n, 0.34, 0.1),
            '--card': hsl(n, 0.3, 0.16),
            '--ink': hsl(n, 0.4, 0.94),
            '--ink-2': hsl(n, 0.26, 0.82),
            '--muted': hsl(n, 0.2, 0.68),
            '--line': hsl(n, 0.24, 0.24),
            '--line-2': hsl(n, 0.22, 0.34),
            '--tab': hsl(n, 0.3, 0.13),
            '--seg': hsl(n, 0.3, 0.16),
          }
        : {
            '--bg': hsl(n, 0.3, 0.955),
            '--card': '#ffffff',
            '--ink': hsl(n, 0.42, 0.18),
            '--ink-2': hsl(n, 0.24, 0.28),
            '--muted': hsl(n, 0.14, 0.4),
            '--line': hsl(n, 0.24, 0.9),
            '--line-2': hsl(n, 0.22, 0.8),
            '--tab': '#ffffff',
            '--seg': hsl(n, 0.22, 0.9),
          },
    );
  }
  if (UI.accent || t.hue !== null) {
    const bg = out['--bg'] || (dark ? '#0e1932' : '#f4f6fa');
    if (dark) {
      const strong = fit(h, sat, 0.42, '#ffffff', 4.6, -0.01);
      Object.assign(out, {
        '--navy': strong,
        '--navy-2': strong,
        '--brand': strong,
        '--blue': fit(h, sat, 0.72, bg, 4.5, 0.01),
        '--blue-50': hsl(h, Math.min(sat, 0.5), 0.2),
        '--accent-ink': hsl(h, Math.min(sat + 0.2, 0.9), 0.84),
      });
    } else {
      const strong = fit(h, sat, toHSL(toRGB(accent))[2], '#ffffff', 5, -0.01);
      Object.assign(out, {
        '--navy': strong,
        '--navy-2': strong,
        '--brand': strong,
        '--accent-ink': strong,
        '--blue': fit(h, sat, 0.42, bg, 4.5, -0.01),
        '--blue-50': fit(h, Math.min(sat, 0.62), 0.925, strong, 4.6, 0.004),
      });
    }
  }
  return out;
}
let tokenNames = [];
const LOADED_FONTS = new Set();
const FONTS = {
  arredondada: ['Nunito:wght@400;600;700;800', "'Nunito',system-ui,sans-serif"],
  leitura: ['Atkinson+Hyperlegible:wght@400;700', "'Atkinson Hyperlegible',system-ui,sans-serif"],
};
function applyUI(opts = {}) {
  const root = document.documentElement;
  const dark = opts.forceTheme
    ? opts.forceTheme === 'dark'
    : UI.mode === 'escuro' || (UI.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  document.dispatchEvent(new Event('etal:tema')); // o mapa (iframe) acompanha
  root.dataset.badge = UI.badge;
  root.dataset.motion = UI.motion;
  root.style.setProperty('--rk', { retos: 0.3, suaves: 1, redondos: 1.4 }[UI.corners] || 1);
  tokenNames.forEach((k) => root.style.removeProperty(k));
  const tk = tokensOf(dark);
  tokenNames = Object.keys(tk);
  tokenNames.forEach((k) => root.style.setProperty(k, tk[k]));
  const fontInfo = FONTS[UI.font];
  if (fontInfo && !LOADED_FONTS.has(UI.font)) {
    LOADED_FONTS.add(UI.font);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${fontInfo[0]}&display=swap`;
    document.head.appendChild(l);
  }
  if (fontInfo) {
    root.style.setProperty('--ui', fontInfo[1]);
    root.style.setProperty('--display', fontInfo[1]);
  } else {
    root.style.removeProperty('--ui');
    root.style.removeProperty('--display');
  }
  const dv = document.getElementById('device');
  if (dv) {
    dv.classList.toggle('text-lg', UI.text === 'grande');
    dv.classList.toggle('text-xl', UI.text === 'maior');
  }
  reduce = osReduce || UI.motion === 'reduzidas';
  const C = window.Campus3D;
  if (C) {
    C.setReduced?.(reduce);
    C.setAccent?.(tk['--navy'] || '#22386f');
    C.redraw?.();
  }
}
const uiSeg = (key, list) =>
  `<div class="mini-seg wide" role="radiogroup">${list.map(([v, t]) => `<button class="${UI[key] === v ? 'on' : ''}" role="radio" aria-checked="${UI[key] === v}" data-act="ui" data-k="${key}" data-v="${v}">${t}</button>`).join('')}</div>`;

/* ===== app/02-estado.js ===== */
/* app/02-estado.js · estado do app, armazenamento local e QR de exemplo.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- estado ---------------- */
const fresh = () => ({
  auth: false,
  credAt: null,
  present: {},
  saved: new Set(D.enrolled),
  tab: 'home',
  stacks: {
    community: [{ s: 'community' }],
    home: [{ s: 'home' }],
    agenda: [{ s: 'agenda' }],
    map: [{ s: 'map' }],
    profile: [{ s: 'profile' }],
  },
  agendaDay: 26,
  agendaFilter: 'all',
  mapView: 'evento',
  campusPlace: null,
  mapFloor: null,
  mapZone: null,
  mapRoute: false,
  mapVia: null,
  pending: false,
  journeying: false,
  tourTab: 'chave',
  reminders: new Set(remSaved()),
  votes: new Set(),
  ratings: {},
  asked: {},
  contacts: [],
});
let S = fresh();
/* Mapa: na primeira visita, uma entrada de longe que termina no evento; nas próximas, uma aproximação curta
     até a vista, o modo (Evento ou Campus) e o 3D/2D em que a pessoa estava. Guardado em etal-mapa. */
const MAP_KEY = 'etal-mapa';
const mapSaved = (() => {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY)) || null;
  } catch (_) {
    return null;
  }
})();
let mapIntro = mapSaved && mapSaved.seen && !new URLSearchParams(location.search).get('intro') ? 'short' : 'full';
if (mapIntro === 'full') S.mapView = 'campus';
else if (['evento', 'campus'].includes(mapSaved.mode)) S.mapView = mapSaved.mode;
function saveMap() {
  const C = window.Campus3D;
  if (!C || S.mapView === 'bloco' || S.journeying || C.inStack?.()) return;
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify({ seen: true, mode: S.mapView, flat: C.isFlat(), cam: C.getView() }));
  } catch (_) {
    /* opcional */
  }
}
setInterval(() => {
  if (S.tab === 'map' && !mapIntro) saveMap();
}, 2500);
window.addEventListener('pagehide', () => {
  if (S.tab === 'map' && !mapIntro) saveMap();
});

/* ---------------- QR fictício ---------------- */
function qr(seed = 11, n = 25) {
  let x = seed;
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  let d = '';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const inF = (c < 8 && r < 8) || (c > n - 9 && r < 8) || (c < 8 && r > n - 9);
      if (!inF && rnd() < 0.47) d += `M${c} ${r}h1v1h-1z`;
    }
  const f = (a, b) =>
    `<rect x="${a}" y="${b}" width="7" height="7" rx="1.4"/><rect x="${a + 1}" y="${b + 1}" width="5" height="5" rx=".9" fill="#fff"/><rect x="${a + 2}" y="${b + 2}" width="3" height="3" rx=".6"/>`;
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" class="qrcode" shape-rendering="crispEdges" fill="#1f2f57"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}"/>${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</svg>`;
}

/* ===== app/03-planta.js ===== */
/* app/03-planta.js · desenho da planta do bloco (SVG) usado nas fichas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- mapa ---------------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
const floorOf = (lvl) => P.floors.find((f) => f.level === lvl);
const zoneOf = (lvl, id) => floorOf(lvl).zones.find((z) => z.id === id);
const zoneName = (z) =>
  z.name
    ? z.name
    : z.roomNumber
      ? `${z.kind === 'laboratory' ? 'Lab' : z.kind === 'staff' ? 'Sala dos professores' : 'Sala'} ${z.kind === 'staff' ? '' : z.roomNumber}`.trim()
      : z.label;

/* ===== app/04-telas-base.js ===== */
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

/* ===== app/05-comunidade.js ===== */
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
/* Publicar, comentar, curtir e denunciar: com o QR da recepção ou, com servidor, fora do horário do evento (antes do
   primeiro dia a conversa já pode começar). O chat geral é aberto a quem entrou. */
const communityPode = () => S.auth && (!!S.credAt || (API && !!PUB.v?.semCredencial));
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
  if (!communityPode()) {
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
    html: `${header(own ? 'Seu perfil' : 'Participante')}<div class="pad social-card">${cardPreview(card, who, { own })}<div class="social-card-acts">${own ? `<button class="btn soft" data-go="cartao">${ic('pencil')}Editar perfil</button>` : communityPode() ? `<button class="btn soft" data-act="community-mention-person" data-id="${esc(person.id)}">${ic('contact')}Marcar na publicação</button>` : ''}</div></div><div class="community-feed">${posts.map((p) => communityPost(p, v)).join('') || communityEmpty('Ainda não há publicações.')}</div>`,
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
      ${communityPode() ? `<form data-form="community-comment" data-id="${esc(p.id)}" class="community-reply"><label class="sr-only" for="community-reply">Seu comentário</label><textarea id="community-reply" name="text" data-community-draft="comment" data-id="${esc(p.id)}" maxlength="1000" rows="2" placeholder="Escreva um comentário…" required>${esc(communityDraft.comments[p.id] || '')}</textarea><button class="iconbtn" type="submit" aria-label="Enviar comentário">${ic('arrow')}</button></form>` : communityGate()}</section>`
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
      ${S.auth ? `<form data-form="community-message" class="community-reply community-chat-form"><label class="sr-only" for="community-message">Sua mensagem</label><textarea id="community-message" data-community-draft="message" name="text" rows="2" maxlength="1000" placeholder="Mande um oi para a galera…" required>${esc(communityDraft.message)}</textarea><button class="iconbtn" type="submit" aria-label="Enviar mensagem">${ic('arrow')}</button></form>` : communityGate()}</div>`
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
              : `<div class="community-feed">${communityMode === 'feed' && communityPode() ? `<div class="community-start"><button class="community-start-text" data-act="community-compose">${meAv()}<span>Compartilhe algo do evento…</span></button><div class="community-start-actions"><button data-act="community-compose" data-photo="1">${ic('image')}Foto / imagem</button><button data-act="community-compose">${ic('plus')}Publicar</button></div></div>` : communityMode === 'feed' ? communityGate() : ''}${(() => {
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
    html: `${header('Nova publicação', { right: communityPode() ? `<button class="compose-submit" type="submit" form="community-post-form" ${canPost ? '' : 'disabled'}>Publicar</button>` : '' })}
      <div class="community-compose">${
        communityPode()
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

/* ===== app/05-publicacoes-servidor.js ===== */
/* app/05-publicacoes-servidor.js · publicações com servidor.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* Com API, as publicações vêm de /api/publicacoes no mesmo formato do community.js (as telas não mudam) e cada ação
   vira uma chamada ao servidor. Sem API, nada daqui roda: tudo fica no aparelho, como na demonstração.
   Ao vivo: o servidor avisa só o número da versão; o app busca de novo apenas se a versão mudou e se a tela de
   publicações estiver aberta (senão, quando ela abrir), com um atraso aleatório para os celulares não pedirem juntos. */
const PUB = { v: null, dono: null, buscando: null, deNovo: false, velho: false, timer: 0, em: 0 };
if (API) SOCIAL.usarServidor({ exemplos: DEMO });
/* /demo com servidor: as publicações e a mensagem de exemplo aparecem junto com as de verdade. Elas não existem no
   servidor, então curtir, salvar, comentar, denunciar e moderar nelas fica neste aparelho. */
const PUB_EXEMPLOS = 'etal-exemplos-demo';
const pubExemplo = (id) => DEMO && SOCIAL.seeds.some((p) => p.id === id);
function pubAlvoExemplo(alvo) {
  const [tipo, id] = String(alvo).split(':');
  return tipo === 'message' ? DEMO && SOCIAL.seedMessages.some((m) => m.id === id) : pubExemplo(id);
}
function pubExemplos() {
  try {
    return {
      likes: {},
      bookmarks: {},
      comments: {},
      moderation: {},
      ...JSON.parse(localStorage.getItem(PUB_EXEMPLOS)),
    };
  } catch (_) {
    return { likes: {}, bookmarks: {}, comments: {}, moderation: {} };
  }
}
function pubExemplosAplicar(v) {
  if (!DEMO || !v) return;
  const ex = pubExemplos();
  const me = String(D.person.id);
  for (const p of SOCIAL.seeds) {
    v.likes[p.id] = ex.likes[p.id] || [];
    v.comments[p.id] = ex.comments[p.id] || [];
  }
  v.bookmarks[me] = [...(v.bookmarks[me] || []).filter((id) => !pubExemplo(id)), ...(ex.bookmarks[me] || [])];
  for (const [alvo, m] of Object.entries(ex.moderation)) if (pubAlvoExemplo(alvo)) v.moderation[alvo] = m;
}
function pubExemplosMudar(change) {
  const ex = pubExemplos();
  change(ex, String(D.person.id));
  try {
    localStorage.setItem(PUB_EXEMPLOS, JSON.stringify(ex));
  } catch (_) {
    /* sem armazenamento: vale até recarregar */
  }
  pubExemplosAplicar(PUB.v);
  rerender();
}
const PUB_TELAS = ['communityPost', 'communityPerson', 'orgCommunity', 'communityCompose'];
const pubNaTela = () => S.auth && (S.tab === 'community' || PUB_TELAS.includes(top().s));
const pubVistasKey = () => `etal-mencoes-vistas:${D.person.id}`;
const pubVazio = () => ({
  versao: 0,
  posts: [],
  messages: [],
  comments: {},
  likes: {},
  bookmarks: {},
  reports: [],
  moderation: {},
  audit: [],
  mentionSeen: {},
});
/* o que a tela lê (communityRead): o último estado do servidor, e busca se ainda não tem ou se ficou velho */
function pubEstado() {
  if (PUB.dono !== D.person.id) {
    PUB.v = null;
    PUB.dono = D.person.id;
  }
  /* também confere com a tela aberta, caso um aviso ao vivo se perca: a cada 20 s, ou a cada 60 s sem conexão
     contínua (Vercel). Com a mesma versão, o servidor responde só "igual" */
  if (!PUB.v || PUB.velho || Date.now() - PUB.em > (window.ETAL_CONFIG?.vivo === 'consulta' ? 60000 : 20000)) {
    PUB.velho = false;
    pubCarregar();
  }
  return PUB.v || pubVazio();
}
/* menções já vistas ficam no aparelho (não precisam ir ao servidor) */
function pubGuardarVistas() {
  try {
    localStorage.setItem(pubVistasKey(), JSON.stringify(PUB.v?.mentionSeen[String(D.person.id)] || []));
  } catch (_) {
    /* opcional */
  }
}
const pubDigitando = () => document.activeElement?.matches?.('textarea, input, select');
function pubCarregar() {
  if (!API || !S.auth) return Promise.resolve();
  if (PUB.buscando) {
    PUB.deNovo = true;
    return PUB.buscando;
  }
  PUB.em = Date.now();
  const versao = PUB.v ? `?versao=${PUB.v.versao}` : '';
  PUB.buscando = API.get('/api/publicacoes' + versao)
    .then((v) => {
      if (v.igual) {
        if (PUB.v && PUB.v.semCredencial !== v.semCredencial) {
          PUB.v.semCredencial = v.semCredencial;
          if (pubNaTela() && !pubDigitando() && !ov.classList.contains('open')) rerender();
        }
        return;
      }
      for (const p of v.posts) for (const img of p.images || []) img.src = API.url(img.src);
      let vistas = [];
      try {
        vistas = JSON.parse(localStorage.getItem(pubVistasKey())) || [];
      } catch (_) {
        /* sem armazenamento */
      }
      v.mentionSeen = { [String(D.person.id)]: vistas };
      pubExemplosAplicar(v);
      PUB.v = v;
      if (pubNaTela() && !pubDigitando() && !ov.classList.contains('open')) rerender();
    })
    .catch((e) => {
      if (pubNaTela()) toast(e.status ? e.message : 'Sem internet: as publicações aparecem quando a conexão voltar.');
    })
    .finally(() => {
      PUB.buscando = null;
      if (PUB.deNovo) {
        PUB.deNovo = false;
        pubCarregar();
      }
    });
  return PUB.buscando;
}
/* aviso ao vivo do servidor: { versao } */
function pubAviso(d) {
  if (!PUB.v || d.versao === PUB.v.versao) return;
  if (!pubNaTela()) {
    PUB.velho = true;
    return;
  }
  clearTimeout(PUB.timer);
  PUB.timer = setTimeout(pubCarregar, 500 + Math.random() * 2500);
}
/* uma ação no servidor: avisa o erro; depois busca o estado novo (a resposta do servidor é quem manda) */
async function pubFazer(promessa) {
  try {
    const r = await promessa;
    await pubCarregar();
    return r || true;
  } catch (e) {
    toast(e.message);
    await pubCarregar();
    return null;
  }
}
const pubIdDoAlvo = (alvo) => String(alvo).split(':').pop();
/* curtir e salvar mudam na hora na tela; se o servidor recusar, o estado volta na próxima busca */
function pubAlternar(lista, id) {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}
function pubCurtir(id) {
  const me = String(D.person.id);
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => (ex.likes[id] = pubAlternar(ex.likes[id] || [], me)));
    return;
  }
  if (PUB.v) PUB.v.likes[id] = pubAlternar(PUB.v.likes[id] || [], me);
  rerender();
  pubFazer(API.post(`/api/publicacoes/${encodeURIComponent(id)}/curtir`));
}
function pubSalvar(id) {
  const me = String(D.person.id);
  let salvou = false;
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => {
      salvou = !(ex.bookmarks[me] || []).includes(id);
      ex.bookmarks[me] = pubAlternar(ex.bookmarks[me] || [], id);
    });
    toast(salvou ? 'Publicação salva' : 'Removida dos salvos');
    return;
  }
  if (PUB.v) {
    const antes = PUB.v.bookmarks[me] || [];
    salvou = !antes.includes(id);
    PUB.v.bookmarks[me] = pubAlternar(antes, id);
  }
  rerender();
  toast(salvou ? 'Publicação salva' : 'Removida dos salvos');
  pubFazer(API.post(`/api/publicacoes/${encodeURIComponent(id)}/salvar`));
}
async function pubApagar(id) {
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => (ex.moderation[SOCIAL.postKey(id)] = { hidden: true }));
    if (top().s === 'communityPost') navBack();
    toast('Publicação tirada do ar (fica no histórico da moderação)');
    return;
  }
  const r = await pubFazer(API.del(`/api/publicacoes/${encodeURIComponent(id)}`));
  if (!r) return;
  if (top().s === 'communityPost') navBack();
  else rerender();
  toast(r.resultado === 'oculta' ? 'Publicação tirada do ar (fica no histórico da moderação)' : 'Publicação excluída');
}
async function pubModerar(alvo, acao, nota) {
  if (pubAlvoExemplo(alvo)) {
    if (acao !== 'dismiss') pubExemplosMudar((ex) => (ex.moderation[alvo] = { hidden: acao === 'hide' }));
    toast('Revisão salva');
    return;
  }
  if (await pubFazer(API.post('/api/publicacoes/moderar', { alvo, acao, nota }))) {
    rerender();
    toast('Revisão salva');
  }
}
async function pubDenunciar(alvo, motivo, detalhe) {
  if (pubAlvoExemplo(alvo)) {
    closeOverlay(() => toast('Denúncia registrada para revisão'));
    return;
  }
  const r = await pubFazer(
    API.post(`/api/publicacoes/${encodeURIComponent(pubIdDoAlvo(alvo))}/denunciar`, { motivo, detalhe }),
  );
  if (r)
    closeOverlay(() =>
      toast(
        r.oculta ? 'Denúncia enviada. O conteúdo saiu do ar até a revisão.' : 'Denúncia enviada para a organização',
      ),
    );
}
/* publicação, comentário ou mensagem; devolve true se o servidor aceitou */
let pubEnviando = false;
async function pubEnviar(kind, text, postId) {
  if (pubEnviando) return false;
  const mencoes = communityMentions(text).map((p) => p.id);
  if (kind === 'community-comment' && pubExemplo(postId)) {
    const novo = { ...communityAuthor(), id: SOCIAL.uid(), created: Date.now(), text, mentions: mencoes };
    pubExemplosMudar((ex) => (ex.comments[postId] = [...(ex.comments[postId] || []), novo]));
    return true;
  }
  pubEnviando = true;
  const botao = $('.page:not(.leaving) .compose-submit');
  if (botao) botao.disabled = true;
  try {
    const pedido =
      kind === 'community-post'
        ? API.post('/api/publicacoes', {
            texto: text,
            atividade: byId(communityDraft.activity)?.id || null,
            dia: byId(communityDraft.activity)?.day || +communityDraft.day || D.now.day,
            assunto: communityDraft.tag,
            mencoes,
            fotos: communityDraft.images.map((img) => ({ dados: img.src, alt: img.alt || '' })),
          })
        : kind === 'community-message'
          ? API.post('/api/publicacoes/mensagens', { texto: text, mencoes })
          : API.post(`/api/publicacoes/${encodeURIComponent(postId)}/comentarios`, { texto: text, mencoes });
    return !!(await pubFazer(pedido));
  } finally {
    pubEnviando = false;
    if (botao) botao.disabled = false;
  }
}

/* ===== app/06-entrada.js ===== */
/* app/06-entrada.js · entrada pelo crachá: SUAP, visitante e abertura do app.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- entrada: o crachá ----------------
     Um crachá em branco pendurado no cordão. Enquanto a pessoa digita, os dados aparecem nele; ao entrar,
     o cartão vira e mostra o crachá preenchido. Para abrir o app, puxa-se o crachá para baixo e a tela desce.
     Padrão dos apps de evento: o ingresso é um QR no app (Web Summit) e a conta serve ao credenciamento (Doity). */
const guestSaved = () => {
  try {
    return JSON.parse(localStorage.getItem('etal-visitante'));
  } catch (_) {
    return null;
  }
};
const GUEST_KINDS = [
  ['estudante', 'Estudante'],
  ['professor', 'Professor(a)'],
  ['profissional', 'Profissional'],
  ['comunidade', 'Comunidade'],
];
let lgPending = null;
let lgPhys = null;

function suapFields() {
  return `<form class="login-form" data-form="login" novalidate>
        <label class="field" for="mat"><span>Matrícula</span><input id="mat" inputmode="numeric" autocomplete="username" placeholder="Sua matrícula do SUAP" required></label>
        <label class="field" for="pwd"><span>Senha</span><div class="pwd"><input id="pwd" type="password" autocomplete="current-password" placeholder="A mesma senha do SUAP" required><button type="button" class="iconbtn sm" data-act="togglepwd" aria-label="Mostrar senha">${ic('eye')}</button></div></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Entrar com o SUAP</span><i class="spin"></i></button>
        ${API ? `<button class="btn ghost" type="button" data-act="suapoauth">Entrar pela página do SUAP</button>` : '<button class="btn ghost" type="button" id="lgdemo" data-act="demo" hidden>Entrar com dados de exemplo</button>'}
      </form>`;
}
function guestFields() {
  const saved = guestSaved();
  return `${saved ? `<button class="lx-resume" type="button" data-act="guestresume"><span class="lx-ic">${esc(saved.initials)}</span><span><b>Continuar como ${esc(saved.first)}</b><small>Conta de visitante neste aparelho</small></span>${ic('chev')}</button><p class="lx-or">ou crie outra conta</p>` : ''}
      <form class="login-form guest-form" data-form="guest" novalidate>
        <label class="field" for="gname"><span>Nome completo</span><input id="gname" autocomplete="name" placeholder="Como vai aparecer no crachá" required></label>
        <label class="field" for="gmail"><span>E-mail</span><input id="gmail" type="email" inputmode="email" autocomplete="email" placeholder="Para receber o certificado" required></label>
        <fieldset class="g-kind"><legend>Você é</legend>${GUEST_KINDS.map(([v, t], i) => `<label><input type="radio" name="gkind" value="${v}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}</fieldset>
        <div class="g-two">
          <label class="field" for="ginst"><span>Instituição</span><input id="ginst" autocomplete="organization" placeholder="Opcional"></label>
          <label class="field" for="gcity"><span>Cidade</span><input id="gcity" list="gcities" autocomplete="address-level2" placeholder="Sua cidade" required></label>
        </div>
        <datalist id="gcities">${['Pau dos Ferros', 'Mossoró', 'São Miguel', 'Alexandria', 'Encanto', 'Rafael Fernandes', 'Portalegre', 'Marcelino Vieira', 'Cajazeiras', 'Natal'].map((c) => `<option value="${c}">`).join('')}</datalist>
        <label class="g-ok"><input type="checkbox" id="gok" required><span>Concordo que o ETAL use estes dados só para o credenciamento e os certificados.</span></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Criar conta</span><i class="spin"></i></button>
      </form>`;
}
/* Frente do crachá. Sem perfil, é o cartão em branco que vai se preenchendo enquanto a pessoa digita. */
const bxClip =
  '<svg class="bx-clip" viewBox="0 0 40 44" aria-hidden="true"><circle cx="20" cy="7" r="5.200" fill="none" stroke="#98a2b3" stroke-width="2.800"/><rect x="13" y="11" width="14" height="15" rx="3.500" fill="#c4cbd7"/><rect x="15.500" y="13" width="3.500" height="11" rx="1.750" fill="#eef1f6"/><rect x="4" y="27" width="32" height="12" rx="3.500" fill="rgba(255,255,255,.6)" stroke="rgba(110,125,150,.55)"/></svg>';
function badgeFace(p) {
  const blank = !p;
  const av = blank
    ? `<span class="bx-av ph">${ic('user')}</span>`
    : p.photo
      ? `<span class="bx-av"><img src="${p.photo}" alt=""></span>`
      : `<span class="bx-av ini">${esc(p.initials)}</span>`;
  const role = blank ? ['ph', 'Credencial'] : p.source === 'visitante' ? ['guest', 'Visitante'] : ['', 'Participante'];
  return `<i class="bx-slot"></i>
      <div class="bx-head"><span class="bx-ed">IFRN · Pau dos Ferros</span><span class="bx-brand">${mark('mark')}<b>etal</b></span>${blank ? '' : '<i class="bx-holo"></i>'}</div>
      <span class="bx-photo">${av}${blank ? '' : `<button class="badge-photo-edit" data-act="profile-edit" aria-label="Editar nome e foto do crachá">${ic('pencil')}</button>`}</span>
      <div class="bx-body">
        ${
          blank
            ? `<b class="bx-name ph" data-live="name">Seu nome</b><span class="bx-sub" data-live="sub">${S.lgMode === 'guest' ? 'Visitante' : 'Matrícula do SUAP'}</span>`
            : `<b class="bx-name">${esc(p.name)}</b>${officialName(p) !== p.name ? `<small class="bx-real">${ic('lock')}${esc(officialName(p))}</small>` : ''}<span class="bx-sub">${esc(p.course || '')}</span><small class="bx-sub2">${esc([p.year, p.campus].filter(Boolean).join(' · '))}</small>`
        }
        <div class="bx-row">${
          blank
            ? `<span class="bx-qr ph">${ic('qr')}</span><small data-live="state">Seu QR aparece aqui depois de entrar</small>`
            : `<span class="bx-qr">${qr(7, 25)}</span><small><span>Seu código</span><b>${esc(p.id)}</b></small>`
        }</div>
      </div>
      <div class="bx-role ${role[0]}"><b>${role[1]}</b><span>26 a 28 nov</span></div>
      <i class="bx-sheen"></i>`;
}
const yardText = 'ETAL · CONNECT · '.repeat(16);

Screens.login = () => {
  const guest = S.lgMode === 'guest';
  return {
    chrome: false,
    mount: (el) => mountBadgeLogin(el),
    html: `<div class="login lx lx-cracha${guest ? ' guest-mode' : ''}">
        <header class="lx-brand dark">${mark('mark xs')}<b>etal</b><span>connect</span></header>
        <div class="lx-hang" id="lxhang">
          <svg class="lx-yard" aria-hidden="true">${['lyA', 'lyB'].map((id) => `<g class="ly"><path class="ly-e"/><path class="ly-m" id="${id}"/><text dy="2.600"><textPath href="#${id}">${yardText}</textPath></text></g>`).join('')}</svg>
          <div class="lx-card" aria-hidden="true"><div class="bx">${bxClip}<div class="bx-flip"><div class="bx-face blank">${badgeFace(null)}</div><div class="bx-face filled"></div></div></div></div>
        </div>
        <p class="lx-pull" aria-hidden="true"><span class="lx-arrow">${ic('chev')}</span><span class="t1">Puxe o crachá para baixo</span><span class="t2">Solte para abrir</span></p>
        <div class="lx-bottom">
          <div class="lx-start">
            <div class="lx-seg" role="tablist" aria-label="Como você vai entrar">
              <button type="button" role="tab" data-act="lgmode" data-v="suap" aria-selected="${!guest}">Sou do IFRN</button>
              <button type="button" role="tab" data-act="lgmode" data-v="guest" aria-selected="${guest}">Vim de fora</button>
            </div>
            <div class="lx-form">${guest ? guestFields() : suapFields()}</div>
          </div>
          <div class="lx-done" role="status">
            <h2 class="lx-q" data-live="hello">Tudo certo!</h2>
            <button class="btn ghost badge-edit" data-act="profile-edit" type="button">${ic('pencil')}Editar nome e foto</button>
            <button class="btn primary big" data-act="lgenter" type="button">Abrir o app</button>
            <button class="btn ghost" data-act="lgredo" type="button">Não sou eu</button>
          </div>
        </div>
      </div>`,
  };
};

/* Física do crachá. O cartão pende do cordão como um pêndulo de mola: segue o dedo com resistência elástica,
     balança com o movimento e volta quicando. Depois de entrar, o cordão tem uma folga; passou dela, o cordão
     estica e puxa a própria tela, que desce e mostra o app já montado por baixo. */
function mountBadgeLogin(el) {
  const lg = $('.login', el);
  const hang = $('#lxhang', el);
  const piv = $('.lx-card', el);
  const bx = $('.bx', el);
  const yard = [...el.querySelectorAll('.ly')].map((g) => [...g.querySelectorAll('path')]);
  const P = {
    x: 0,
    y: 0,
    a: reduce ? 0 : 0.32,
    vx: 0,
    vy: 0,
    va: 0,
    cv: 0,
    vc: 0,
    drag: null,
    app: null,
    going: false,
    raf: 0,
    last: 0,
    until: 0,
    touch: 0,
    filledAt: 0,
    ready: false,
  };
  lgPhys = P;
  const SLACK = 64;
  const OPEN = 120;
  const rb = (d, c) => c * (1 - 1 / ((d / c) * 0.55 + 1));
  const rbs = (d, c) => (d < 0 ? -rb(-d, c) : rb(d, c));
  const live = (k, v) => {
    const n = $(`[data-live="${k}"]`, el);
    if (n) {
      n.textContent = v;
      n.classList.toggle('typed', true);
    }
  };

  function draw() {
    const W = hang.clientWidth;
    const L = parseFloat(getComputedStyle(lg).getPropertyValue('--L')) || 46;
    piv.style.setProperty('--px', `${P.x.toFixed(2)}px`);
    piv.style.setProperty('--py', `${P.y.toFixed(2)}px`);
    piv.style.setProperty('--pa', `${P.a.toFixed(4)}rad`);
    bx.style.setProperty('--tilt', P.a.toFixed(3));
    const px = W / 2 + P.x;
    const py = L + P.y;
    const tp = -110;
    const ends = [
      [W / 2 - 46, px - 3.5],
      [W / 2 + 46, px + 3.5],
    ];
    yard.forEach(([e, m], i) => {
      const d = `M${ends[i][0].toFixed(1)} ${tp}L${ends[i][1].toFixed(1)} ${py.toFixed(1)}`;
      e.setAttribute('d', d);
      m.setAttribute('d', d);
    });
    if (P.app && !P.going) {
      const k = Math.min(1, P.cv / Math.max(1, el.clientHeight));
      el.style.transform = P.cv > 0.3 ? `translate3d(0,${P.cv.toFixed(1)}px,0)` : '';
      P.app.style.transform = `scale(${(0.92 + 0.08 * k).toFixed(4)})`;
      P.app.style.filter = `brightness(${(0.7 + 0.3 * k).toFixed(3)})`;
      el.classList.toggle('lx-moving', P.cv > 0.3);
    }
  }
  function step(t) {
    P.raf = 0;
    if (!el.isConnected) return;
    const dt = Math.min(0.033, Math.max(0.001, (t - (P.last || t - 16)) / 1000));
    P.last = t;
    if (!P.drag) {
      P.vx += (-240 * P.x - 13 * P.vx) * dt;
      P.vy += (-240 * P.y - 13 * P.vy) * dt;
      P.x += P.vx * dt;
      P.y += P.vy * dt;
      if (P.app && !P.going) {
        P.vc += (-280 * P.cv - 26 * P.vc) * dt;
        P.cv += P.vc * dt;
        if (P.cv < 0) {
          P.cv = 0;
          P.vc = 0;
        }
      }
    }
    /* O cartão atrasa em relação ao ponto de pendurar: quem anda para a direita faz ele girar para a esquerda. */
    const aT = Math.max(-0.75, Math.min(0.75, -P.vx * 0.00085));
    P.va += (-70 * (P.a - aT) - 3.2 * P.va) * dt;
    P.a += P.va * dt;
    draw();
    const motion =
      Math.abs(P.x) +
      Math.abs(P.y) +
      Math.abs(P.vx) * 0.05 +
      Math.abs(P.vy) * 0.05 +
      Math.abs(P.a) * 200 +
      Math.abs(P.va) * 60 +
      P.cv +
      Math.abs(P.vc) * 0.05;
    if (motion > 0.25 || P.drag || P.going || t < P.until) wake();
    else {
      P.last = 0;
      P.x = P.y = P.a = 0;
      draw();
    }
  }
  function wake(ms) {
    if (ms) P.until = Math.max(P.until, performance.now() + ms);
    if (!P.raf) P.raf = requestAnimationFrame(step);
  }
  P.kick = (vx = 0, vy = 0, va = 0, ms = 0) => {
    if (reduce) {
      wake(ms);
      return;
    }
    P.vx += vx;
    P.vy += vy;
    P.va += va;
    wake(ms);
  };

  /* O app é montado por baixo assim que a pessoa começa a puxar; se ela desistir, ele fica lá esperando. */
  function arm() {
    if (P.app || !lgPending) return;
    navReset();
    S.auth = true;
    S.tab = 'home';
    el.style.animation = 'none';
    el.classList.remove('in-fade', 'in-push', 'in-pop');
    const app = build(top());
    app.classList.add('lx-under');
    vp.insertBefore(app, el);
    if (app._mount) app._mount(app);
    P.app = app;
    draw();
  }
  P.disarm = () => {
    if (!P.app) return;
    P.app.remove();
    P.app = null;
    S.auth = false;
    P.cv = P.vc = 0;
    el.style.transform = '';
    el.classList.remove('lx-moving');
  };
  P.commit = (v = 0) => {
    if (P.going) return;
    arm();
    if (!P.app) return;
    const prof = lgPending;
    lgPending = null;
    P.going = true;
    S.lgMode = null;
    const app = P.app;
    const H = el.clientHeight + 60;
    const dur = reduce ? 1 : Math.round(Math.max(260, Math.min(600, (H - P.cv) / Math.max(1.5, v / 1000))));
    setChrome(app);
    el.classList.add('lx-moving');
    el.style.transition = `transform ${dur}ms cubic-bezier(.3,.6,.25,1)`;
    app.style.transition = `transform ${dur}ms cubic-bezier(.2,.7,.2,1), filter ${dur}ms ease-out`;
    void el.offsetWidth;
    el.style.transform = `translate3d(0,${H}px,0)`;
    app.style.transform = 'none';
    app.style.filter = 'none';
    P.kick(0, 420, 0.9);
    buzz([10, 30, 18]);
    setTimeout(() => {
      el.remove();
      app.style.transition = app.style.transform = app.style.filter = '';
      app.classList.remove('lx-under');
      qrPendente();
    }, dur + 40);
    cardIntro(dur + 700);
    if (prof.source === 'visitante')
      setTimeout(
        () =>
          notify(
            `Boas-vindas, ${prof.first}!`,
            'Sua conta de visitante está pronta. Mostre o QR do crachá na recepção.',
          ),
        dur + 350,
      );
  };

  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'mat') live('sub', t.value.trim() ? `Matrícula ${t.value.trim()}` : 'Matrícula do SUAP');
    if (t.id === 'gname') live('name', t.value.trim() || 'Seu nome');
    if (t.id === 'gcity' || t.name === 'gkind') {
      const kind = (GUEST_KINDS.find(([v]) => v === ($('[name=gkind]:checked', el) || {}).value) || GUEST_KINDS[0])[1];
      live('sub', ['Visitante', kind, $('#gcity', el)?.value.trim()].filter(Boolean).join(' · '));
    }
    if (/^(mat|gname|gcity)$/.test(t.id) || t.name === 'gkind') P.kick(0, 0, (Math.random() - 0.5) * 0.7);
  });
  el.addEventListener('change', (e) => {
    if (e.target.name === 'gkind') e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });

  let samples = [];
  hang.addEventListener('pointerdown', (e) => {
    if (P.going || e.button > 0 || e.target.closest('button')) return;
    P.drag = { x0: e.clientX, y0: e.clientY, bx: P.x, by: P.y + P.cv, moved: false };
    samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
    P.vc = 0;
    P.touch = performance.now();
    hang.setPointerCapture(e.pointerId);
    lg.classList.add('pulling');
    wake();
  });
  hang.addEventListener('pointermove', (e) => {
    const d = P.drag;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
    const s0 = samples[0];
    const sdt = Math.max(10, e.timeStamp - s0.t);
    P.vx = ((e.clientX - s0.x) / sdt) * 1000;
    P.vy = ((e.clientY - s0.y) / sdt) * 1000;
    P.x = d.bx + rbs(dx, 70);
    const yy = d.by + dy;
    if (lgPending) {
      if (yy > SLACK * 0.4) arm();
      if (yy <= SLACK) {
        P.y = yy < 0 ? -rb(-yy, 28) : yy;
        P.cv = 0;
      } else {
        const ex = yy - SLACK;
        const st = rb(ex, 22);
        P.y = SLACK + st;
        P.cv = ex - st;
      }
      const rdy = P.cv > OPEN;
      if (rdy !== P.ready) {
        P.ready = rdy;
        lg.classList.toggle('ready', rdy);
        buzz(rdy ? 14 : 6);
      }
    } else P.y = rbs(yy, yy > 0 ? 80 : 28);
    P.touch = performance.now();
  });
  const release = () => {
    const d = P.drag;
    if (!d) return;
    P.drag = null;
    lg.classList.remove('pulling');
    if (!d.moved) {
      P.kick(0, 0, (Math.random() < 0.5 ? -1 : 1) * 1.8);
      return;
    }
    if (lgPending && (P.cv > OPEN || (P.vy > 650 && P.cv > 14))) {
      P.commit(P.vy);
      return;
    }
    if (P.cv > 0) {
      P.vc = Math.min(0, P.vy) * 0.4;
      P.vy = 0;
    }
    P.ready = false;
    lg.classList.remove('ready');
    wake();
  };
  hang.addEventListener('pointerup', release);
  hang.addEventListener('pointercancel', release);
  hang.addEventListener('keydown', (e) => {
    if (e.target.closest('button')) return;
    if (lgPending && (e.key === 'ArrowDown' || e.key === 'Enter')) P.commit();
  });

  /* Até a pessoa mexer, o crachá dá um puxãozinho sozinho para mostrar que dá para puxar. */
  const nudge = setInterval(() => {
    if (!el.isConnected) {
      clearInterval(nudge);
      return;
    }
    const now = performance.now();
    if (lgPending && !P.drag && !P.going && now - P.touch > 2600 && now - P.filledAt > 1500) P.kick(0, 520, 0, 0);
  }, 2800);
  new ResizeObserver(() => wake(50)).observe(hang);
  wake(reduce ? 50 : 400);
}
/* Entrou: o cartão vira e mostra o crachá preenchido. */
function lgFilled(prof) {
  prof.officialName = prof.officialName || prof.name;
  Object.assign(prof, profileLocal(prof.id));
  applyProfile(prof);
  lgPending = prof;
  const lg = $('.login');
  if (!lg) return;
  $('.bx-face.filled', lg).innerHTML = badgeFace(prof);
  $('.lx-card', lg).removeAttribute('aria-hidden');
  $('.bx-face.blank', lg).setAttribute('aria-hidden', 'true');
  $('[data-live="hello"]', lg).textContent = `Tudo certo, ${prof.first}!`;
  lg.classList.add('filled');
  buzz([14, 40, 14]);
  if (lgPhys) {
    lgPhys.filledAt = performance.now();
    lgPhys.kick(0, 0, 1.3, 1400);
  }
  setTimeout(() => $('[data-act="lgenter"]', lg)?.focus({ preventScroll: true }), 700);
}
/* A tela de entrada desce e o app aparece por trás. */
function lgOpenApp() {
  if (lgPending && lgPhys) lgPhys.commit(0);
}
function lgShake(msg) {
  lgPhys?.kick(950, 0, 0.6);
  buzz(40);
  const s = $('[data-live="state"]');
  if (s) s.textContent = msg || 'Confira os dados abaixo';
}
/* Conta de visitante: só o necessário para o crachá e o certificado. */
function guestProfile(f) {
  const name = f.name.replace(/\s+/g, ' ').trim();
  const parts = name.split(' ');
  const kind = (GUEST_KINDS.find(([v]) => v === f.kind) || GUEST_KINDS[0])[1];
  let h = 0;
  for (const ch of f.email.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    name,
    first: parts[0],
    initials: (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '')).toUpperCase(),
    course: 'Visitante',
    courseFull: `Visitante · ${kind}${f.inst ? ` · ${f.inst}` : ''}`,
    year: kind,
    campus: f.city,
    id: `VIS${String(h % 1000000).padStart(6, '0')}`,
    email: f.email,
    institution: f.inst || '',
    source: 'visitante',
    photo: null,
  };
}

function badge() {
  const ok = !!S.credAt;
  const pinsSvg =
    '<svg class="pins" viewBox="0 0 60 20" aria-hidden="true"><path d="M8 20V9M30 20V9M52 20V9"/><circle cx="8" cy="5.500" r="3.400"/><circle cx="30" cy="5.500" r="3.400"/><circle cx="52" cy="5.500" r="3.400"/></svg>';
  return `<section class="badge st" ${st(0)}>
      <div class="flip ${S.flipSeen ? '' : 'hint'}" data-act="flip" role="button" tabindex="0" aria-label="Virar crachá e ver o código">
        <div class="flip-in">
          <div class="face front">
            <div class="b-top"><span class="b-mark">${mark('mark xs')}etal</span>${pinsSvg}</div>
            <div class="b-id">${meAv('av')}<span class="b-name"><strong>${esc(D.person.name)}</strong><span>${esc(D.person.course)}</span><small>${esc([D.person.year, D.person.campus].filter(Boolean).join(' · '))}</small></span></div>
            <span class="flip-tip">${ic('rotate')}Virar</span>
          </div>
          <div class="face back">
            <div class="back-qr ${ok ? '' : 'locked-qr'}">${qr()}${ok ? '' : `<i>${ic('lock')}</i>`}</div>
            <div class="back-tx"><b>${ok ? 'Seu código' : 'Código bloqueado'}</b><span>${ok ? 'Mostre quando a organização pedir.' : 'Libera depois da leitura na recepção.'}</span><small>${esc(D.person.id)}</small></div>
          </div>
        </div>
      </div>
      ${
        ok
          ? `<button class="b-strip ok" data-go="credential">${ic('check', 'i dot')}<span><b>Credenciamento confirmado</b><small>Entrada às ${S.credAt} na recepção</small></span>${ic('chev')}</button>`
          : `<button class="b-strip pend" data-act="scan">${ic('qr', 'i dot')}<span><b>Credenciamento pendente</b><small>Leia o QR da recepção, no térreo</small></span>${ic('chev')}</button>`
      }
    </section>`;
}

/* ===== app/07-inicio-e-agenda.js ===== */
/* app/07-inicio-e-agenda.js · início e agenda.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* linha da agenda na home: minicurso inscrito ganha o selo "Inscrito" (a inscrição é no SUAP) */
const nextRow = (n) =>
  `<li data-go="activity" data-id="${n.id}"><span class="date"><small>${dayOf(n.day).week}</small><b>${n.day}</b></span><span class="next-tx"><b>${n.short}</b><small>${n.time} · ${n.room}</small>${inscrito(n) ? `<em class="selo-inscrito">${ic('check')}Inscrito</em>` : ''}</span>
            <button class="remind ${S.reminders.has(n.id) ? 'on' : ''}" data-act="remind" data-id="${n.id}" aria-pressed="${S.reminders.has(n.id)}" aria-label="Lembrar 10 minutos antes">${ic('alarm')}</button></li>`;
Screens.home = () => {
  const s = byId('react-native');
  const here = S.present[s.id];
  /* o que a pessoa salvou e os minicursos em que está inscrita (no SUAP), em ordem de dia e hora */
  const meus = [...S.saved]
    .map(byId)
    .filter((x) => x && x.id !== s.id)
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const minicursos = meus.filter(inscrito);
  const next = meus.filter((x) => !comInscricao(x));
  const speakers = speakersList();
  /* atalhos numa fileira só; Mapa e Avisos já estão na barra de baixo e no sino */
  const actions = [
    ['cal', 'Programação', 'data-act="programacao"'],
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
            <div class="now-top"><span class="kind">${s.type}${inscrito(s) ? ' · inscrição feita' : ''}</span>${here ? `<span class="tag ok">${ic('check')}Presente</span>` : ic('chev', 'i now-chev')}</div>
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
            UI.home.agenda && minicursos.length
              ? `<div class="sec rv"><h2>Meus minicursos</h2><button data-act="mine">Minha agenda</button></div>
          <ul class="next meus-mini rv">${minicursos.map(nextRow).join('')}</ul>`
              : ''
          }
          ${
            UI.home.agenda
              ? `<div class="sec rv"><h2>Sua agenda</h2><button data-act="mine">Ver tudo</button></div>
          ${next.length ? `<ul class="next rv">${next.map(nextRow).join('')}</ul>` : `<button class="next-vazio rv" data-act="programacao">${ic('bookmark')}<span><b>Nada salvo ainda</b><small>Na programação, toque no marcador de uma palestra ou mesa</small></span>${ic('chev')}</button>`}`
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
  const ideas = D.sessions.filter((q) => q.day === day && !q.simple && !comInscricao(q)).slice(0, 3);
  return `<div class="empty-saved">
      ${illo('mark')}
      <h3 class="st" ${st(1)}>Nada salvo na ${week}</h3>
      <p class="st" ${st(2)}>Toque no marcador de uma palestra ou mesa e ela entra na sua agenda. Minicursos aparecem aqui quando você se inscreve no SUAP.</p>
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
    ['saved', 'Minha agenda'],
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
    comInscricao(s)
      ? ''
      : `<button class="bm ${S.saved.has(s.id) ? 'on' : ''}" data-act="save" data-id="${s.id}" aria-label="${S.saved.has(s.id) ? 'Remover dos salvos' : 'Salvar'}">${ic('bookmark')}</button>`;
  const hexa = (s) =>
    `<span class="ses-hex" role="img" aria-label="${s.type}"><svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0-18.5 16-9.25v18.5L0 18.5-16 9.25v-18.5Z"/></svg>${ic(tipoDe(s).icon)}</span>`;
  const selo = (s) => {
    /* minicurso: inscrito no SUAP, ou as vagas preenchidas (discreto) */
    if (comInscricao(s))
      return inscrito(s) ? `<span class="ses-selo inscrito">${ic('check')}Inscrito</span>` : vagasLinha(s);
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
    html: `<header class="apphead"><h1 class="title">${f === 'saved' ? 'Minha agenda' : 'Programação'}</h1><button class="iconbtn" data-act="finder" aria-label="Buscar">${ic('search')}</button></header>
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

/* ===== app/08-atividade.js ===== */
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
  /* minicurso: a inscrição é no SUAP (vaga limitada); o app mostra se a pessoa já está inscrita ou leva até lá */
  const link = linkInscricao(s);
  const inscricao = !comInscricao(s)
    ? ''
    : inscrito(s)
      ? `<div class="inscricao ok st" ${st(3)}>${ic('check')}<span><b>Inscrição feita</b><small>Você se inscreveu pelo SUAP. Chegue no horário para registrar a presença.</small></span></div>`
      : `<div class="inscricao st" ${st(3)}>${ic('id')}<span><b>${vagasRestam === 0 ? 'Vagas esgotadas' : 'Inscrição pelo SUAP'}</b><small>${vagasRestam === 0 ? 'Confira no SUAP se abriu alguma vaga.' : 'Vagas limitadas: a inscrição é feita no SUAP, pelo botão abaixo.'}</small></span></div>`;
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
    html: `${header('', { right: comInscricao(s) ? '' : `<button class="iconbtn bm ${S.saved.has(id) ? 'on' : ''}" data-act="save" data-id="${id}" aria-label="${S.saved.has(id) ? 'Remover da agenda' : 'Salvar na agenda'}">${ic('bookmark')}</button>` })}
      <div class="pad stack detail detalhe-v2">
        <span class="kind kind-tp tp-${t.k} st" ${st(0)}>${ic(t.icon)}${s.type}</span>
        <h1 class="title-lg st" ${st(1)}>${s.title}</h1>
        ${API && pendenteDe(id) ? `<p class="leitura-pendente st" ${st(1)}>${ic('qr')}<span><b>Leitura guardada, ainda sem valer.</b> O app envia a presença quando a internet voltar.</span></p>` : ''}
        ${t.g === 'mesa' ? '' : quem}
        ${blocos}
        ${inscricao}
        ${lugar}
        ${t.g === 'mesa' ? quem.replace('<ul>', '<h2 class="h">Quem conversa</h2><ul>') : ''}
        ${lembrar}
        ${DEMO && lembrete ? `<button class="remindtest st" ${st(5)} data-act="remindtest" data-id="${id}">${ic('bell')}Ver como o lembrete chega</button>` : ''}
        ${fonte}${sobre}
        ${extra}
        ${s.materials.length ? `<p class="locked st" ${st(9)}>${ic('lock')}${s.materials.length} ${s.materials.length === 1 ? 'material' : 'materiais'} depois da presença</p>` : ''}
      </div>
      <div class="cta-bar">${
        comInscricao(s) && !inscrito(s) && link
          ? `<a class="btn ${vagasRestam === 0 ? 'soft' : 'primary'} big" href="${esc(link)}" target="_blank" rel="noopener">${ic('open')}${vagasRestam === 0 ? 'Ver no SUAP' : 'Inscrever-se no SUAP'}</a>`
          : `<button class="btn primary big" data-act="scan">${ic('qr')}Registrar presença</button>`
      }</div>`,
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

/* ===== app/09-campus-e-mapa.js ===== */
/* app/09-campus-e-mapa.js · ficha do campus, tela grande do computador e mapa embutido.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
function campusSheet() {
  const id = S.campusPlace;
  if (!id) return '';
  const p = D.places[id];
  /* Sol nas fachadas (cartas solares da dissertação de 2012) e, com a luz do horário ligada, o sol de agora. */
  const sunLine = () => {
    const FAC = { norte: 'do auditório', oeste: 'da frente', leste: 'dos fundos', sul: 'da rampa' };
    const s = window.Campus3D.sunInfo?.(skyHour);
    if (!s || !s.up) return '';
    const lados = Object.keys(s.facades)
      .filter((k) => s.facades[k])
      .map((k) => FAC[k]);
    return lados.length ? `<p class="sh-src">☀ Sol agora no lado ${lados.join(' e no lado ')}.</p>` : '';
  };
  const on = window.Campus3D.routeOn(id);
  return `<div class="sheet-card campus-sheet detail"><i class="grab"></i>
      <div class="sh-top"><div><strong>${p.name}</strong></div><button class="iconbtn sm" data-act="placeclose" aria-label="Fechar">${ic('x')}</button></div>
      <p class="sh-text">${p.text}</p>
      ${p.sun ? sunLine() : ''}
      ${p.projeto ? `<p class="sh-src">${p.projeto}</p>` : ''}
      <div class="sh-btns">
        ${!window.Campus3D.hasRoute(id) ? '' : `<button class="btn ${p.floors || p.link || p.plan ? 'soft' : 'primary'}" data-act="placeroute" data-id="${id}">${ic('route')}${on ? 'Rota no mapa' : 'Como chegar'}</button>`}
        ${p.floors ? `<button class="btn primary" data-act="enterbloco">${ic('building')}Ver os andares</button>` : ''}
        ${p.link ? `<button class="btn primary" data-go="${p.link}">Sobre o NADIC</button>` : ''}
        ${p.plan ? `<button class="btn primary" data-act="openmap" data-floor="${p.plan[0]}" data-zone="${p.plan[1]}">${ic('building')}Ver na planta</button>` : ''}
      </div>
    </div>`;
}

/* Mapa padrão: o novo (mapa3d/, WebGL), embutido na aba Mapa. O mapa anterior do app (campus3d.js, Canvas) continua
     guardado como "Mapa clássico": Perfil → Personalizar → Mapa, ou ?mapa=classico. A exportação em arquivo único
     (index.html da raiz) e a qualidade "2D" usam sempre o clássico. */
const mapaEscolhido = () => {
  const q = new URLSearchParams(location.search).get('mapa');
  return q === 'novo' || q === 'classico' ? q : UI.mapa || 'novo';
};
const mapaNovoOn = () =>
  !window.ASSET_DATA && mapaEscolhido() === 'novo' && window.Campus3D?.quality?.().setting !== 'simples';
/* ---- computador: sem moldura de celular. O app fica numa coluna à esquerda e o mapa ocupa o resto da tela, no modo
     Evento (o passeio virou segredo do mapa). "Ver como celular" volta para a moldura; a escolha fica em etal-moldura. ---- */
const wideMq = matchMedia('(min-width: 1000px) and (pointer: fine)');
let palcoFrame = null,
  palcoPronto = false,
  palcoFila = null;
const dadosMapa = (extra = {}) => ({
  type: 'etal:mapa:abrir',
  ...extra,
  tema: isDark() ? 'escuro' : 'claro',
  proxima: proximaMinha(),
  origem: origemAgora(),
  foto: D.person.photo || null,
  nome: D.person.name || '',
  hour: skyHour,
  reduced: reduce,
  agora: { day: D.now.day, time: D.now.time },
  sessions: D.sessions.map((x) => ({
    id: x.id,
    title: x.title,
    time: x.time,
    end: x.end,
    day: x.day,
    type: x.type,
    room: x.room,
    place: x.place,
    tournament: x.tournament,
    floor: x.floor,
    zone: x.zone,
  })),
  rooms: Object.fromEntries(
    P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => [`${f.level}:${z.id}`, z.roomNumber])),
  ),
});
/* "Ver na programação" no cartão de um lugar do mapa: a Agenda abre só com as atividades dele */
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'etal:mapa:programacao') return;
  const frames = [palcoFrame, mapaFixo?.querySelector('iframe')].filter(Boolean);
  if (!frames.some((f) => f.contentWindow === e.source)) return;
  const ids = Array.isArray(e.data.ids) ? e.data.ids.filter((id) => D.sessions.some((x) => x.id === id)) : [];
  if (!ids.length) return;
  S.agendaLugar = { nome: String(e.data.nome || 'Este lugar').slice(0, 60), ids };
  S.agendaFilter = 'all';
  if (D.days.some((d) => d.day === e.data.dia)) S.agendaDay = e.data.dia;
  switchTab('agenda', true);
});
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'etal:mapa:atividade') return;
  const frames = [palcoFrame, mapaFixo?.querySelector('iframe')].filter(Boolean);
  if (!frames.some((f) => f.contentWindow === e.source)) return;
  const activity = D.sessions.find((x) => x.id === e.data.id);
  if (activity) push(activity.tournament ? 'tournament' : 'activity', { id: activity.tournament || activity.id });
});
const palcoOn = () => document.documentElement.classList.contains('wide');
function palcoEnviar(extra) {
  if (!palcoFrame) return;
  if (!palcoPronto) {
    palcoFila = extra;
    return;
  }
  palcoFrame.contentWindow.postMessage(dadosMapa(extra), location.origin);
  palcoFrame.focus();
}
function telaGrande() {
  const q = new URLSearchParams(location.search);
  const on = wideMq.matches && !q.has('moldura') && localStorage.getItem('etal-moldura') !== '1' && mapaNovoOn();
  document.documentElement.classList.toggle('wide', on);
  const host = $('#palco'),
    bt = $('#moldura-btn');
  if (bt) {
    bt.hidden = !wideMq.matches;
    bt.textContent = on ? 'Ver como celular' : 'Usar a tela toda';
    bt.onclick = () => {
      localStorage.setItem('etal-moldura', on ? '1' : '0');
      location.reload();
    };
  }
  if (!host) return;
  if (on && !palcoFrame) {
    palcoFrame = document.createElement('iframe');
    palcoFrame.title = 'Mapa do campus em tela grande';
    palcoFrame.allow = 'fullscreen';
    palcoFrame.src = `mapa3d/index.html?aba=1&tema=${isDark() ? 'escuro' : 'claro'}`;
    document.addEventListener('etal:tema', () => palcoEnviar({}));
    host.append(palcoFrame);
    host.hidden = false;
  }
  if (!on && palcoFrame) {
    palcoFrame.remove();
    palcoFrame = null;
    palcoPronto = false;
    host.hidden = true;
  }
}
/* o mapa avisa quando entra e sai do passeio: no celular ele fica com a tela toda */
window.addEventListener('message', (e) => {
  if (e.origin === location.origin && e.data?.type === 'etal:mapa:passeio' && !palcoOn())
    document.documentElement.classList.toggle('passeio-cheio', !!e.data.on);
});
window.addEventListener('message', (e) => {
  if (
    !palcoFrame ||
    e.origin !== location.origin ||
    e.source !== palcoFrame.contentWindow ||
    e.data?.type !== 'etal:mapa:pronto'
  )
    return;
  palcoPronto = true;
  palcoFrame.contentWindow.postMessage(dadosMapa(palcoFila || {}), location.origin);
  palcoFila = null;
});
/* na tela grande, a aba Mapa do app só comanda o mapa ao lado */
const telaMapaAoLado = () => ({
  html: `${header('Mapa')}<div class="pad stack lado-mapa">
      <p class="lado-tx st" ${st(0)}>O mapa está aberto ao lado, em tela grande. Escolha como quer ver:</p>
      <button class="lado-op st" ${st(1)} data-act="palco" data-mode="evento">${ic('map')}<span><b>Ver o evento e buscar salas</b><small>Busca, rotas e as partes do evento em cores</small></span>${ic('chev')}</button>
      <button class="lado-op st" ${st(2)} data-act="palco" data-mode="campus">${ic('pin')}<span><b>Campus inteiro</b><small>Todos os prédios, o bairro e o bloco por dentro</small></span>${ic('chev')}</button>
      <button class="lado-op st" ${st(3)} data-act="palco" data-mode="andares">${ic('building')}<span><b>Andares do bloco principal</b><small>O prédio aberto, andar por andar</small></span>${ic('chev')}</button>
      <div class="sec st" ${st(4)}><h2>Como chegar</h2></div>
      <ul class="next st" ${st(5)}>${D.sessions
        .filter((x) => Number.isInteger(x.floor) && x.zone && D.enrolled.includes(x.id))
        .slice(0, 4)
        .map(
          (n) =>
            `<li data-act="openmap" data-floor="${n.floor}" data-zone="${n.zone}"><span class="date"><small>${dayOf(n.day).week}</small><b>${n.day}</b></span><span class="next-tx"><b>${n.short}</b><small>${n.time} · ${n.room}</small></span>${ic('chev')}</li>`,
        )
        .join('')}</ul>
    </div>`,
});
/* O mapa 3D fica num iframe só, criado na primeira vez e nunca removido: trocar de aba apenas o esconde. Antes ele
     era recriado a cada abertura da aba Mapa e o campus inteiro era montado de novo (vários segundos no celular). */
let mapaFixo = null,
  mapaPronto = false,
  mapaFila = null;
const dadosAba = (type, pedida = {}) => ({
  type,
  ...pedida,
  tema: isDark() ? 'escuro' : 'claro',
  proxima: proximaMinha(),
  origem: origemAgora(),
  foto: D.person.photo || null,
  nome: D.person.name || '',
  hour: skyHour,
  reduced: reduce,
  agora: { day: D.now.day, time: D.now.time },
  sessions: D.sessions.map((x) => ({
    id: x.id,
    title: x.title,
    time: x.time,
    end: x.end,
    day: x.day,
    type: x.type,
    room: x.room,
    place: x.place,
    tournament: x.tournament,
    floor: x.floor,
    zone: x.zone,
  })),
  rooms: Object.fromEntries(
    P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => [`${f.level}:${z.id}`, z.roomNumber])),
  ),
});
function mapaFixoEnviar(type, pedida) {
  if (!mapaPronto) {
    mapaFila = pedida;
    return;
  }
  mapaFixo.querySelector('iframe').contentWindow.postMessage(dadosAba(type, pedida), location.origin);
}
function mapaFixoCriar() {
  if (mapaFixo) return mapaFixo;
  mapaFixo = document.createElement('div');
  mapaFixo.className = 'mapa-fixo';
  mapaFixo.hidden = true;
  mapaFixo.innerHTML = `<iframe title="Mapa do campus" allow="fullscreen" src="mapa3d/index.html?aba=1&tema=${isDark() ? 'escuro' : 'claro'}"></iframe>`;
  /* trocou o tema no app: o mapa acompanha */
  document.addEventListener('etal:tema', () => {
    if (mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
  });
  vp.appendChild(mapaFixo);
  const frame = mapaFixo.querySelector('iframe');
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow || e.data?.type !== 'etal:mapa:pronto') return;
    mapaPronto = true;
    frame.contentWindow.postMessage(dadosAba('etal:mapa:abrir', mapaFila || {}), location.origin);
    mapaFila = null;
  });
  return mapaFixo;
}
/* mostra o mapa só quando a tela visível é a do mapa (chamado por setChrome a cada troca de tela) */
const mapaFixoVer = (el) => {
  if (mapaFixo) mapaFixo.hidden = !el?.querySelector('[data-mapa-fixo]');
};
const telaMapaNovo = () =>
  palcoOn()
    ? telaMapaAoLado()
    : {
        html: '<div class="map-screen mapa-aba" data-mapa-fixo></div>',
        mount: () => {
          const novo = !mapaFixo;
          mapaFixoCriar();
          mapaFixo.hidden = false;
          /* rota pedida por "Como chegar" (atividade ou sala) vai junto, uma vez; sem pedido, só sincroniza (salas, foto, hora) */
          const pedida =
            S.mapRoute && Number.isInteger(S.mapFloor) && S.mapZone
              ? { floor: S.mapFloor, zone: S.mapZone, via: S.mapVia || null }
              : null;
          S.mapRoute = false;
          if (pedida) mapaFixoEnviar('etal:mapa:abrir', pedida);
          else if (!novo && mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
        },
      };
Screens.campus = () =>
  mapaNovoOn()
    ? telaMapaNovo()
    : {
        html: `<div class="map-screen campus">
      <canvas class="campus3d" tabindex="0" role="application" aria-label="Mapa do campus IFRN Pau dos Ferros, com a área do evento em destaque. Arraste para mover e use os botões para aproximar."></canvas>
      ${fpsHud()}
      ${mapBottom(campusSheet())}
    </div>`,
        mount: mountCampus,
      };

/* ===== app/10-colmeia.js ===== */
/* app/10-colmeia.js · conquistas (colmeia).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- colmeia ---- */
function combEarned() {
  const got = new Set();
  if (S.credAt) got.add('cred');
  Object.keys(S.present).forEach((k) => got.add(k));
  if (Object.values(S.asked).some((a) => a.length)) got.add('ask');
  if (Object.keys(S.ratings).length) got.add('rate');
  if (S.contacts.length) got.add('contact');
  return D.combs.filter((c) => got.has(c.id)).map((c) => c.id);
}
/* Favo de 7 células: a chegada no centro e as outras em volta. */
const COMB_POS = [
  [0, 0],
  [14, -24.2],
  [28, 0],
  [14, 24.2],
  [-14, 24.2],
  [-28, 0],
  [-14, -24.2],
];
/* Desenho de cada conquista (traço em 24 × 24), feito para caber no favo. */
const COMB_ICONS = {
  cred: '<path d="M8 3l4 5 4-5"/><rect x="5.5" y="8" width="13" height="12.5" rx="2.5"/><circle cx="12" cy="13" r="2"/><path d="M8.8 18c.7-1.400 1.800-2 3.200-2s2.500.6 3.200 2"/>',
  'react-native':
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><ellipse cx="12" cy="11.5" rx="3.8" ry="1.5" transform="rotate(-30 12 11.5)"/><ellipse cx="12" cy="11.5" rx="3.8" ry="1.5" transform="rotate(30 12 11.5)"/><path d="M11 18.5h2"/>',
  'react-next': '<path d="M8.5 7.500 4 12l4.500 4.500M15.500 7.500 20 12l-4.500 4.500M13.500 5l-3 14"/>',
  'saude-mental':
    '<path d="M12 20s-7.500-4.400-7.500-10A4.300 4.300 0 0 1 12 7.300 4.300 4.300 0 0 1 19.500 10c0 5.600-7.500 10-7.500 10Z"/><path d="M7.500 12.500h2.300l1.200-2.300 2 4.300 1.200-2h2.300"/>',
  ask: '<path d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v8a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 3.500V17A2.500 2.500 0 0 1 4 14.500Z"/><path d="M10 8.800a2.100 2.100 0 1 1 3.100 1.900c-.7.4-1.100.8-1.100 1.600"/><path d="M12 14.300v.1"/>',
  rate: '<path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1.100 5.800L12 16.800l-5.300 2.800 1.100-5.800-4.300-4.100 5.900-.8Z"/>',
  contact:
    '<circle cx="8" cy="8.5" r="2.8"/><circle cx="16" cy="8.5" r="2.8"/><path d="M3 19c.5-3 2.400-4.800 5-4.800 1.600 0 3 .7 4 2 1-1.300 2.400-2 4-2 2.600 0 4.500 1.800 5 4.800"/>',
};
const combGlyph = (c) => COMB_ICONS[c.id] || ICONS[c.icon] || '';
const HEX = 'M0-15.300 13.250-7.650V7.650L0 15.300-13.250 7.650V-7.650Z';
/* Degradês do mel e da cera, uma vez só no documento (os favos de qualquer tela apontam para eles). */
function combDefs() {
  if (document.getElementById('cb-defs')) return;
  const d = document.createElement('div');
  d.id = 'cb-defs';
  d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg width="0" height="0"><defs>
      <linearGradient id="cb-honey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd761"/><stop offset=".55" stop-color="#f4ab1c"/><stop offset="1" stop-color="#d98507"/></linearGradient>
      <radialGradient id="cb-honey-in" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffe58c"/><stop offset=".6" stop-color="#f7b524"/><stop offset="1" stop-color="#e7960d"/></radialGradient>
      <linearGradient id="cb-wax" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b83a" stop-opacity=".16"/><stop offset="1" stop-color="#f0b83a" stop-opacity=".05"/></linearGradient>
      <clipPath id="cb-clip"><path d="${HEX}"/></clipPath>
    </defs></svg>`;
  document.body.appendChild(d);
}
function comb(cls = '', all = false) {
  combDefs();
  const got = all ? D.combs.map((c) => c.id) : combEarned();
  return `<svg class="hm-comb ${cls}" viewBox="-44 -42 88 84" aria-hidden="true">${D.combs
    .map((c, i) => {
      const on = got.includes(c.id);
      const [x, y] = COMB_POS[i];
      /* célula: borda de cera, fundo (mel cheio ou cera vazia), brilho no alto e o desenho da conquista */
      return `<g class="cell ${on ? 'on' : ''} ${S.newComb === c.id ? 'pop' : ''}" style="--n:${i}" transform="translate(${x} ${y})"><g class="cell-in"><path class="hx-rim" d="${HEX}"/><path class="hx-in" d="${HEX}" transform="scale(.8)"/>${on ? `<path class="hx-gloss" d="M-8.6-6.400 0-11.400 8.600-6.400C5-7.600-5-7.600-8.600-6.400Z"/><g clip-path="url(#cb-clip)"><rect class="hx-shine" x="-30" y="-18" width="9" height="36" transform="skewX(-20)"/></g>` : ''}<g class="glyph" transform="scale(.56) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round">${combGlyph(c)}</g></g></g>`;
    })
    .join('')}</svg>`;
}
/* Um favo só, para as linhas da lista. */
const combHex = (c, on) =>
  `<svg class="hm-hex ${on ? 'on' : ''}" viewBox="-16 -17 32 34" aria-hidden="true"><path class="hx-rim" d="${HEX}"/><path class="hx-in" d="${HEX}" transform="scale(.8)"/>${on ? '<path class="hx-gloss" d="M-8.600-6.400 0-11.400 8.600-6.400C5-7.600-5-7.600-8.600-6.400Z"/>' : ''}<g class="glyph" transform="scale(.56) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round">${combGlyph(c)}</g></svg>`;
function combCard() {
  const got = combEarned();
  const next = D.combs.find((c) => !got.includes(c.id));
  return `<button class="hm-combcard rv" data-go="colmeia">${comb()}<span class="hm-combtx"><b>Sua colmeia</b><strong>${got.length} de ${D.combs.length} favos</strong><span class="hm-combbar" aria-hidden="true">${D.combs.map((c) => `<i class="${got.includes(c.id) ? 'on' : ''}"></i>`).join('')}</span><small>${next ? `Próximo: ${next.how.charAt(0).toLowerCase()}${next.how.slice(1)}` : 'Colmeia completa!'}</small></span>${ic('chev')}</button>`;
}
Screens.colmeia = () => {
  const got = combEarned();
  const done = got.length === D.combs.length;
  return {
    html: `${header('Sua colmeia')}<div class="pad stack hm-colmeia">
        <div class="hm-bigcomb st" ${st(0)}><i class="hm-halo"></i>${comb('big')}</div>
        <p class="hm-count st" ${st(1)}><b>${got.length}</b> de ${D.combs.length} favos${done ? '. Colmeia completa!' : ''}</p>
        <ul class="hm-combs st" ${st(2)}>${D.combs
          .map((c, i) => {
            const on = got.includes(c.id);
            return `<li class="${on ? 'on' : ''}" style="--n:${i}">${combHex(c, on)}<span><b>${c.title}</b><small>${on ? 'Conquistado' : c.how}</small></span>${on ? ic('check', 'i hm-ok') : ''}</li>`;
          })
          .join('')}</ul>
        ${got.length ? `<button class="btn soft big st" ${st(3)} data-act="toast" data-msg="Imagem da colmeia pronta para compartilhar">${ic('share')}Compartilhar minha colmeia</button>` : ''}
      </div>`,
  };
};
let combSeen = null;
/* Favo recém-ganho. Quem mostrar primeiro (tela de resultado ou aviso) consome, para não repetir. */
function takeNewComb() {
  const got = combEarned();
  if (combSeen === null) {
    combSeen = got;
    return null;
  }
  const fresh = got.find((g) => !combSeen.includes(g));
  combSeen = got;
  if (!fresh) return null;
  S.newComb = fresh;
  setTimeout(() => {
    if (S.newComb === fresh) S.newComb = null;
  }, 6000);
  return D.combs.find((x) => x.id === fresh);
}
function checkCombs() {
  const c = takeNewComb();
  if (c) setTimeout(() => combToast(c), 900);
}
/* Linha "novo favo" dentro das telas de resultado. */
function combRow(c) {
  const n = combEarned().length;
  return `<div class="res-comb">${comb('rc')}<span><small>Novo favo na colmeia</small><b>${esc(c.title)}</b></span><em><b>${n}</b>/${D.combs.length}</em></div>`;
}
/* Aviso de favo novo: cai do topo com a colmeia e o favo acendendo. Tocar abre a colmeia. */
let combT;
function combToast(c) {
  let n = $('#combtoast');
  if (!n) {
    n = document.createElement('button');
    n.type = 'button';
    n.id = 'combtoast';
    n.className = 'combtoast';
    n.dataset.go = 'colmeia';
    n.addEventListener('click', () => n.classList.remove('show'));
    $('.screen').appendChild(n);
  }
  const got = combEarned();
  n.innerHTML = `<span class="ct-comb">${comb('ct')}</span>
      <span class="ct-tx"><small>${ic('star')}Novo favo na sua colmeia</small><b>${esc(c.title)}</b>
      <span class="ct-bar">${D.combs.map((x) => `<i class="${got.includes(x.id) ? 'on' : ''}${x.id === c.id ? ' new' : ''}"></i>`).join('')}</span></span>
      <span class="ct-n"><b>${got.length}</b>de ${D.combs.length}</span><i class="ct-shine"></i>`;
  n.classList.remove('show');
  void n.offsetWidth;
  n.classList.add('show');
  buzz([12, 30, 12]);
  clearTimeout(combT);
  combT = setTimeout(() => n.classList.remove('show'), 4800);
}

/* ===== app/11-ceu.js ===== */
/* app/11-ceu.js · céu do Alto Oeste pelo horário e silhueta do campus.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- céu do Alto Oeste: muda com o horário, sem imagem nenhuma ---- */
const SKY_KEYS = [
  [5, '#111a3d', '#343b6c', '#a8685e'],
  [6.25, '#3d5c9f', '#e6a174', '#fbd7a6'],
  [8.5, '#3f86d8', '#8bc1ee', '#d8eefa'],
  [14, '#2c7bd3', '#68afed', '#cfe9f8'],
  [16.75, '#4a74bd', '#efae6d', '#fbdb9b'],
  [18, '#34396f', '#c9644e', '#f4a15b'],
  [19, '#141d40', '#2b2f63', '#6d4a6e'],
  [22, '#0b1230', '#141d45', '#232c5c'],
];
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c) => `rgb(${c.join(',')})`;
/* Relógio do app: segue a hora do aparelho, minuto a minuto (céu, luz do mapa, "agora" da agenda e lembretes). O dia
     continua o do evento de exemplo (26 a 28/11), porque a programação é a de 2025. ?ceu=<hora>, mexer no horário do céu
     ou no botão do sol fixa uma hora para demonstrar, até recarregar. */
const horaAparelho = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
let skyHour = horaAparelho(),
  horaManual = false;
setInterval(() => {
  if (!horaManual && Math.abs(horaAparelho() - skyHour) > 0.5 / 60) {
    skyHour = horaAparelho();
    applySky();
    if (mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
  }
}, 30000);
const skyClock = () => {
  const m = Math.round(skyHour * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/* O mapa 3D acompanha o horário do céu (noite, pôr do sol), a menos que a pessoa desligue em Personalizar. */
const syncMapHour = () => window.Campus3D?.setHour?.(UI.mapHour ? skyHour : null);
function applySky() {
  const h = skyHour;
  syncMapHour();
  let a = SKY_KEYS[0],
    b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++)
    if (h >= SKY_KEYS[i][0] && h <= SKY_KEYS[i + 1][0]) {
      a = SKY_KEYS[i];
      b = SKY_KEYS[i + 1];
      break;
    }
  const t = b === a ? 0 : Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
  const [c1, c2, c3] = [1, 2, 3].map((i) => mixC(hex2(a[i]), hex2(b[i]), t));
  const night = Math.max(0, Math.min(1, h < 6 ? (6 - h) / 0.8 : (h - 18.2) / 0.8));
  const navy = hex2('#1b2d5c');
  const st_ = device.style;
  st_.setProperty('--sky-1', css(c1));
  st_.setProperty('--sky-2', css(c2));
  st_.setProperty('--sky-3', css(c3));
  st_.setProperty('--sil-near', css(mixC(navy, c1, 0.1 * (1 - night))));
  st_.setProperty('--sil-mid', css(mixC(navy, c2, 0.3 * (1 - night * 0.7))));
  st_.setProperty('--sil-far', css(mixC(navy, c3, 0.5 * (1 - night * 0.7))));
  st_.setProperty('--night', night.toFixed(3));
  const p = (h - 5.6) / (18.6 - 5.6);
  st_.setProperty('--sun-o', p > 0 && p < 1 ? '1' : '0');
  st_.setProperty('--sun-x', `${8 + Math.max(0, Math.min(1, p)) * 84}%`);
  st_.setProperty('--sun-y', `${74 - Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) * 62}%`);
  st_.setProperty('--sun-c', p < 0.12 || p > 0.86 ? '#ffb765' : '#ffe9a8');
  const m = (h - 18.6) / 5;
  st_.setProperty('--moon-x', `${14 + Math.max(0, Math.min(1, m)) * 56}%`);
  st_.setProperty('--moon-y', `${56 - Math.sin(Math.max(0, Math.min(1, m)) * 2.2) * 40}%`);
  const clock = skyClock();
  D.now.time = clock; // o "agora" da agenda segue o mesmo relógio
  const ck = $('#clock');
  if (ck) ck.textContent = clock;
  const nc = $('#nowclock');
  if (nc) nc.textContent = clock;
  const r = $('#skyr');
  if (r && document.activeElement !== r) r.value = h;
  const o = $('#skyo');
  if (o) o.textContent = clock;
  if (typeof checkReminders === 'function') checkReminders();
}
let skyAnim = 0;
function skyTo(target) {
  cancelAnimationFrame(skyAnim);
  horaManual = true;
  if (reduce) {
    skyHour = target;
    applySky();
    return;
  }
  const from = skyHour;
  const t0 = performance.now();
  const step = (n) => {
    const k = Math.min(1, (n - t0) / 1400);
    skyHour = from + (target - from) * (1 - (1 - k) ** 3);
    applySky();
    if (k < 1) skyAnim = requestAnimationFrame(step);
  };
  skyAnim = requestAnimationFrame(step);
}
/* Vista da rua, desenhada em camadas para ter profundidade: serras do Alto Oeste ao fundo, névoa, a linha de árvores,
     o campus (ginásio, auditório de fachada curva, bloco principal com as três fileiras de janelas, entrada, laboratórios,
     cobertura do pátio, obelisco), o muro e as carnaúbas na frente. As cores vêm do céu da hora. */
function skyline() {
  const R = (() => {
    let v = 7;
    return () => {
      v = (v * 16807) % 2147483647;
      return v / 2147483647;
    };
  })();
  /* copas em sequência, como mata vista de longe */
  const mata = (y, x0, x1, passo, amp) => {
    let d = `M${x0} 150V${y}`;
    for (let x = x0; x < x1; x += passo) {
      const h = amp * (0.45 + R() * 0.75),
        w = passo * (0.8 + R() * 0.5);
      d += `q${(w / 2).toFixed(1)} ${(-h).toFixed(1)} ${w.toFixed(1)} 0`;
      x += w - passo;
    }
    return d + `V150Z`;
  };
  const carnauba = (x, h, inc = 0) => {
    const top = [x + inc, 134 - h];
    let o = `<path class="sl-trunk" d="M${x} 136Q${x + inc * 0.2} ${134 - h * 0.5} ${top[0]} ${top[1]}"/>`;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.08 + i * 0.105),
        L = 8.5 + (i % 2) * 2.2,
        ex = Math.cos(a) * L,
        ey = Math.sin(a) * L * 0.9;
      o += `<path class="sl-frond" d="M${top[0]} ${top[1]}q${(ex * 0.55).toFixed(1)} ${(ey * 0.9 - 2.2).toFixed(1)} ${ex.toFixed(1)} ${(ey + 3.4).toFixed(1)}"/>`;
    }
    return o;
  };
  const copa = (x, y, k = 1) =>
    `<path class="sl-near" d="M${x - 1} ${y + 12 * k}h2V${y}h-2Z"/><path class="sl-near" d="M${x - 9 * k} ${y}c${-4.5 * k} ${-1 * k} ${-5.5 * k} ${-7 * k} ${-1.5 * k} ${-9 * k} ${0.2 * k} ${-6 * k} ${7 * k} ${-8.5 * k} ${10.5 * k} ${-4.5 * k} ${4 * k} ${-3.2 * k} ${10 * k} ${0.3 * k} ${9 * k} ${5 * k} ${4.2 * k} ${1.2 * k} ${4.2 * k} ${7.3 * k} ${0} ${8.5 * k}Z"/>`;
  let jan = '';
  [97, 108, 119].forEach((y) => {
    for (let x = 158; x < 293; x += 11) jan += `<rect x="${x}" y="${y}" width="7" height="4.600" rx=".9"/>`;
  });
  for (let x = 109; x < 144; x += 9) jan += `<rect x="${x}" y="106" width="2.600" height="15" rx="1"/>`;
  for (let x = 326; x < 374; x += 10) jan += `<rect x="${x}" y="112" width="6" height="4" rx=".8"/>`;
  const predios = `<path d="M14 132v-15q30-17 60 0v15Z"/><rect x="318" y="104" width="62" height="28"/><path d="M150 132V96h-32c-10 0-18 7-18 16v20Z"/><rect x="150" y="86" width="150" height="46"/><rect x="300" y="103" width="19" height="29"/>`;
  return `<svg class="hm-skyline" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sk-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
      <linearGradient id="sk-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".17"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>
      <path class="sl-hill" d="M0 150V78c18-8 34-11 52-6 14 4 24 10 40 9 20-2 30-17 52-19 18-2 30 9 46 13 20 5 34-5 54-10 22-6 40-2 58 6 16 7 28 6 44 1s30-6 44-2V150Z"/>
      <path class="sl-far" d="M0 150V98c22-8 44-6 62 0 20 6 38 4 58-3 24-9 44-8 66-1 22 7 40 8 62 2 24-7 46-9 70-2 26 7 48 5 72-2V150Z"/>
      <rect class="sl-haze" x="0" y="80" width="390" height="46" fill="url(#sk-haze)"/>
      <path class="sl-mata" d="${mata(116, 0, 392, 9, 9)}"/>
      <g class="sl-b">${predios}</g><g class="sl-luz" fill="url(#sk-shade)">${predios}</g>
      <rect class="sl-plat" x="150" y="86" width="150" height="5.200"/><path class="sl-plat" d="M150 96h-32c-10 0-18 7-18 16v5.500c0-9 8-16.500 18-16.500h32Z"/><rect class="sl-plat" x="318" y="104" width="62" height="3.600"/><rect class="sl-plat" x="300" y="103" width="19" height="29" opacity=".35"/>
      <path class="sl-rim" d="M100 112c0-9 8-16 18-16h32M150 86h150M300 103h19M318 104h62M22 113.500q22-11 44 0"/>
      <g class="sl-win">${jan}<rect x="306" y="119" width="7" height="13" rx="1"/></g>
      <path class="sl-near" d="M174 120l54-7 54 7v2.200H174Z"/>${[180, 228, 276].map((x) => `<rect class="sl-near" x="${x}" y="121" width="1.500" height="12"/>`).join('')}
      <rect class="sl-near" x="236.300" y="100" width="3" height="33"/><rect class="sl-mark" x="236.800" y="103" width="2" height="4.500" rx=".6"/>
      ${copa(206, 122, 0.8)}${copa(262, 124, 0.7)}
      <path class="sl-near" d="M0 150v-16.500h390V150Z"/><path class="sl-cap" d="M0 133.500h390"/>
      ${copa(28, 126, 1.15)}${copa(324, 127, 1)}${carnauba(64, 42, 2)}${carnauba(88, 31, -3)}${carnauba(352, 38, -2)}${carnauba(372, 27, 3)}
      <path class="sl-near" d="${mata(143, 0, 392, 13, 5)}"/>
    </svg>`;
}
const skyArt = () =>
  `<div class="hm-bg"><i class="hm-stars"></i><i class="hm-glow"></i><i class="hm-cloud c1"></i><i class="hm-cloud c2"></i><i class="hm-cloud c3"></i><button class="hm-sun" data-act="skycycle" aria-label="Mudar a hora do céu"></button><i class="hm-moon"></i><svg class="hm-birds" viewBox="0 0 60 24" aria-hidden="true"><path d="M2 12q5-6 9 0 4-6 9 0"/><path d="M26 5q4-5 7 0 3-5 7 0"/><path d="M40 17q3-4 6 0 3-4 6 0"/></svg>${skyline()}</div>`;

/* ===== app/12-inicio-ao-vivo.js ===== */
/* app/12-inicio-ao-vivo.js · campus ao vivo e montagem da tela de início.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- campus ao vivo ---- */
let liveI = 0,
  liveTimer = 0,
  liveCred = D.liveBase.credenciados;
function liveMessages() {
  const f = byId('fastapi');
  const ia = byId('experiencia-ia');
  const mk = D.tournaments[0];
  return [
    { i: 'users', t: `${liveCred} pessoas credenciadas`, go: 'notices' },
    { i: 'pin', t: `${f.room} com ${f.seats - f.taken} vagas: ${f.short}`, go: 'activity', id: f.id },
    { i: 'mic', t: `${ia.room}: ${ia.short} em andamento`, go: 'activity', id: ia.id },
    { i: 'trophy', t: `${mk.name} começa ${dayOf(mk.day).week.toLowerCase()}, ${mk.time}`, go: 'games' },
    { i: 'bell', t: D.notices[0].title, go: 'notices' },
  ];
}
function mountHome(page) {
  /* o céu anda mais devagar que a página (profundidade) e as seções de baixo entram quando chegam na tela */
  const stateScroll = () => {
    device.classList.toggle('sky-past', page.scrollTop > 104);
    if (!reduce && page.scrollTop < 240) page.style.setProperty('--hp', Math.max(0, page.scrollTop).toFixed(0));
  };
  page.addEventListener('scroll', stateScroll, { passive: true });
  stateScroll();
  const rvs = [...page.querySelectorAll('.rv')];
  if (reduce || !('IntersectionObserver' in window)) rvs.forEach((e) => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { root: page, rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    rvs.forEach((e) => io.observe(e));
  }
  applySky();
  const box = $('.hm-live', page);
  if (!box) return;
  const row = $('.hm-live-msg', page);
  const paint = () => {
    const list = liveMessages();
    const m = list[liveI % list.length];
    row.innerHTML = `${ic(m.i)}<span>${m.t}</span>`;
    box.dataset.go = m.go;
    if (m.id) box.dataset.id = m.id;
    else delete box.dataset.id;
  };
  paint();
  clearInterval(liveTimer);
  if (reduce) return;
  liveTimer = setInterval(() => {
    if (!box.isConnected) {
      clearInterval(liveTimer);
      return;
    }
    row.classList.add('out');
    setTimeout(() => {
      liveI += 1;
      liveCred += 1 + (liveI % 3);
      paint();
      row.classList.remove('out');
      row.classList.add('in');
      setTimeout(() => row.classList.remove('in'), 380);
    }, 240);
  }, 3800);
}

const FLOOR_DESC = [
  'Auditório, administração e recepção',
  'Salas de aula e laboratórios',
  'Laboratórios, professores e coordenação de ADS',
];
/* Controles do mapa na zona do polegar: coluna à direita, logo acima da busca. */
const camCtrl = () =>
  `<div class="map-side">${dimToggle()}<div class="map-ctrl cam-ctrl"><button class="iconbtn" data-act="cam" data-v="in" aria-label="Aproximar">${ic('plus')}</button><button class="iconbtn" data-act="cam" data-v="out" aria-label="Afastar">${ic('minus')}</button>${window.Campus3D.isFlat() ? '' : `<button class="iconbtn" data-act="cam" data-v="rot" aria-label="Girar a vista">${ic('rotate')}</button>`}<button class="iconbtn" data-act="cam" data-v="fit" aria-label="Enquadrar">${ic('expand')}</button><button class="iconbtn" data-act="mapcfg" aria-label="Ajustes do mapa" aria-expanded="false">${ic('sliders')}</button></div>${mapCfg()}</div>`;
/* Ajustes do mapa, para brincar: hora do dia, nomes, sombras, árvores e carros. */
const LAYER_NAMES = [
  ['labels', 'Nomes dos lugares'],
  ['shadows', 'Sombras'],
  ['trees', 'Árvores'],
  ['cars', 'Carros'],
];
const mapCfg = (cls = '') => `<div class="map-cfg ${cls}" role="dialog" aria-label="Ajustes do mapa">
      <label class="mc-hour"><span>Hora</span><input type="range" id="mapsky" min="5" max="22.5" step="0.25" value="${skyHour}"><b id="mapskyo">${skyClock()}</b></label>
      <button data-act="uimaphour" aria-pressed="${UI.mapHour}" class="${UI.mapHour ? 'on' : ''}"><span>Luz do horário</span><i class="switch"></i></button>
      ${LAYER_NAMES.map(([k, t]) => `<button data-act="maplayer" data-k="${k}" aria-pressed="${UI.layers[k]}" class="${UI.layers[k] ? 'on' : ''}"><span>${t}</span><i class="switch"></i></button>`).join('')}
    </div>`;

function routeSteps(lvl, z) {
  const r = window.Campus3D.routeInfo(lvl, z.id, S.mapVia);
  const lead = S.mapVia ? '' : 'Caminho mais rápido: ';
  const label = floorOf(lvl).label;
  const enter = `${lead}${lead ? 'entre' : 'Entre'} pela ${r.entrance}`;
  if (!r.via) return `${enter} e siga pelo corredor até a porta.`;
  /* Rampa em duas pistas de cerca de 22 m: uma volta sobe um andar (3,45 m), perto de 8% de inclinação. */
  const ramp =
    r.via === 'rampa'
      ? ` São ${lvl === 1 ? 'cerca de 45 m de rampa, numa volta' : `cerca de ${lvl * 45} m de rampa, em ${lvl} voltas`}, com inclinação suave, perto de 8%.`
      : '';
  return `${enter}, suba pela ${r.via} ${r.viaWhere} até o ${label} e siga pelo corredor até a porta.${ramp}`;
}

function blocoSheet() {
  const lvl = S.mapFloor;
  if (lvl === null) {
    return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>Bloco principal</strong><small>Toque num andar para entrar</small></div>`;
  }
  const z = S.mapZone ? zoneOf(lvl, S.mapZone) : null;
  if (S.journeying)
    return `<div class="sheet-card campus-sheet going"><i class="grab"></i><strong>${z ? zoneName(z) : floorOf(lvl).label}</strong><small>${floorOf(lvl).label} · toque no mapa para pular</small></div>`;
  if (!z)
    return `<div class="sheet-card campus-sheet"><i class="grab"></i><div class="sh-top"><div><strong>${floorOf(lvl).label}</strong><small>${FLOOR_DESC[lvl]}</small></div></div><p class="sh-text">Toque numa sala para ver o que acontece nela.</p></div>`;
  const acts = D.sessions.filter((x) => x.floor === lvl && x.zone === z.id);
  const walkable = !['stairs', 'ramp', 'courtyard'].includes(z.kind);
  return `<div class="sheet-card campus-sheet detail"><i class="grab"></i>
      <div class="sh-top">${z.icon && window.Campus3D?.useIcons?.[z.icon] ? `<span class="sh-ic" aria-hidden="true"><svg viewBox="-12 -12 24 24"><path d="${window.Campus3D.useIcons[z.icon]}"/></svg></span>` : ''}<div><strong>${zoneName(z)}</strong><small>${z.name ? `Sala ${z.roomNumber} · ` : z.roomNumber && z.kind !== 'classroom' ? `${z.useLabel} · ` : ''}${floorOf(lvl).label}</small></div><button class="iconbtn sm" data-act="zoneclose" aria-label="Fechar">${ic('x')}</button></div>
      ${z.info ? `<p class="sh-text">${esc(z.info)}</p>` : ''}

      ${acts.length && !S.mapRoute ? `<ul class="sh-acts">${acts.map((x) => `<li data-go="activity" data-id="${x.id}"><span><b>${x.short}</b><small>${dayOf(x.day).week} ${x.day} · ${x.time}</small></span>${ic('chev')}</li>`).join('')}</ul>` : ''}
      ${
        walkable && lvl > 0 && S.mapRoute
          ? (() => {
              const v = S.mapVia || window.Campus3D.routeInfo(lvl, z.id, null).via;
              return `<div class="via" style="--k:${v === 'rampa' ? 1 : 0}"><i></i><button class="${v === 'escada' ? 'on' : ''}" data-act="via" data-v="escada">${ic('stairs')}Escada</button><button class="${v === 'rampa' ? 'on' : ''}" data-act="via" data-v="rampa">${ic('nav')}Rampa</button></div>`;
            })()
          : ''
      }
      ${S.mapRoute && walkable ? `<p class="sh-text steps">${routeSteps(lvl, z)}</p>` : walkable ? `<button class="btn primary" data-act="roomroute">${ic('route')}Como chegar</button>` : ''}
    </div>`;
}

/* ===== app/13-mapa-e-preferencias.js ===== */
/* app/13-mapa-e-preferencias.js · telas de mapa, NADIC, ETAL, desempenho e personalização.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
Screens.map = () => {
  if (mapaNovoOn()) return telaMapaNovo();
  if (S.mapView !== 'bloco') return Screens.campus();
  const idx = S.mapFloor === null ? 0 : S.mapFloor + 1;
  return {
    html: `<div class="map-screen campus">
        <canvas class="campus3d" tabindex="0" role="application" aria-label="Bloco principal em volume, com os três andares. Toque num andar ou numa sala."></canvas>
        ${fpsHud()}
        ${mapBottom(blocoSheet(), `<div class="seg ${window.Campus3D.canUse3D() ? 'four' : ''}" style="--k:${window.Campus3D.canUse3D() ? idx : idx - 1}"><i class="seg-ind"></i>${window.Campus3D.canUse3D() ? `<button class="${idx === 0 ? 'on' : ''}" data-act="floorsel" data-v="all">Todos</button>` : ''}${[0, 1, 2].map((l) => `<button class="${S.mapFloor === l ? 'on' : ''}" data-act="floorsel" data-v="${l}">${l === 0 ? 'Térreo' : `${l}º`}</button>`).join('')}</div>`)}
      </div>`,
    mount: mountCampus,
  };
};

Screens.nadic = () => {
  const n = D.nadic;
  return {
    html: `${header('NADIC')}<div class="pad stack about">
        <section class="ab-hero st" ${st(0)}>
          <svg class="ab-pins" viewBox="0 0 200 120" aria-hidden="true"><path d="M150 120V70M170 120V50M190 120V70M0 34H96l14 14h40"/><circle cx="150" cy="64" r="5"/><circle cx="170" cy="44" r="5"/><circle cx="190" cy="64" r="5"/><circle cx="156" cy="48" r="5"/></svg>
          <img src="assets/nadic-logo.svg" alt="NADIC" width="170" height="74">
          <h1>${n.full}</h1>
          <p>${n.motto}</p>
        </section>
        <p class="desc st" ${st(1)}>${n.about}</p>
        <ul class="ab-tags st" ${st(2)}>${n.fields.map((f) => `<li>${f}</li>`).join('')}</ul>
        <dl class="nadic-stats st" ${st(3)}>${n.stats.map(([v, t]) => `<div><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>
        <h2 class="h st" ${st(4)}>Projetos</h2>
        <ul class="ab-list st" ${st(5)}>${n.projects.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join('')}</ul>
        <h2 class="h st" ${st(6)}>Contato</h2>
        <ul class="ab-list st" ${st(7)}>
          <li data-act="openmap" data-floor="1" data-zone="sala-nadic" class="tap"><b>Sala dos bolsistas</b><small>Bloco principal, 1º andar · ver no mapa</small>${ic('chev')}</li>
          <li><b>Coordenação</b><small>${n.lead}</small></li>
          <li><b>E-mail</b><small class="sel">${n.email}</small></li>
          <li><b>Endereço</b><small>${n.address}</small></li>
        </ul>
        <a class="btn primary big st" ${st(8)} href="${n.url}" target="_blank" rel="noopener">Abrir o site do NADIC ${ic('open')}</a>
        <p class="nadic-src st" ${st(9)}>${n.source}</p>
      </div>`,
  };
};

Screens.etal = () => {
  const e = D.etal;
  return {
    html: `${header('O que é o ETAL')}<div class="pad stack about">
        <div class="ab-logo st" ${st(0)}><img src="assets/etal-logo.png" alt="ETAL"></div>
        <h1 class="title-lg st" ${st(1)}>${e.full}</h1>
        <p class="desc st" ${st(2)}>${e.about}</p>
        <ul class="ab-tags st" ${st(3)}>${e.areas.map((f) => `<li>${f}</li>`).join('')}</ul>
        <ul class="ab-list st" ${st(4)}><li><b>Como acontece</b><small>${e.formats}</small></li><li><b>Onde</b><small>${e.place}</small></li></ul>
        <h2 class="h st" ${st(5)}>Edições</h2>
        <ol class="ab-time st" ${st(6)}>${e.editions.map(([y, n, d]) => `<li><time>${y}</time><span><b>${n}</b><small>${d}</small></span></li>`).join('')}</ol>
        <div class="ab-btns st" ${st(7)}><a class="btn primary" href="${e.site}" target="_blank" rel="noopener">Site do evento ${ic('open')}</a><a class="btn soft" href="${e.portal}" target="_blank" rel="noopener">Página no IFRN ${ic('open')}</a></div>
        <p class="nadic-src st" ${st(8)}>${e.source}</p>
      </div>`,
  };
};

const TIER_LABEL = { alta: '3D completo', media: '3D médio', leve: '3D leve', simples: '2D simples' };
/* Medidor de quadros, em cima do mapa: toque para trocar de versão. */
let hudTimer = 0;
const fpsHud = () =>
  UI.fps
    ? '<button class="fps-hud" data-act="hudcycle" aria-label="Trocar a versão do mapa"><b>--</b><small></small></button>'
    : '';
function startHud(page) {
  clearInterval(hudTimer);
  const el = $('.fps-hud', page);
  if (!el) return;
  const paint = () => {
    if (!el.isConnected) {
      clearInterval(hudTimer);
      return;
    }
    const t = window.Campus3D.stats();
    el.querySelector('b').textContent = t.fps ? `${t.fps} fps` : '-- fps';
    el.classList.toggle('bad', t.fps > 0 && t.fps < 24);
    el.querySelector('small').textContent = `${TIER_LABEL[t.tier]} · ${t.cost} ms`;
  };
  paint();
  hudTimer = setInterval(paint, 500);
}
Screens.perf = () => {
  const r = S.perfResults || [];
  const best = bestOf(r);
  const q = window.Campus3D.quality();
  return {
    mount: mountPerf,
    html: `${header('Testar desempenho')}<div class="perf">
        <div class="perf-stage"><canvas class="campus3d" tabindex="-1" aria-label="Mapa durante o teste"></canvas>${fpsHudForce()}</div>
        <div class="pad stack">
          <p class="desc">O teste roda as quatro versões do mapa neste aparelho e mostra os quadros por segundo. Leva cerca de 40 segundos.</p>
          <button class="btn primary big" data-act="perfrun" ${S.perfBusy ? 'disabled' : ''}>${S.perfBusy ? `Testando: ${TIER_LABEL[S.perfBusy]}…` : r.length ? 'Testar de novo' : 'Iniciar teste'}</button>
          ${
            r.length
              ? `<ul class="perf-table">${r.map((x) => `<li class="${best === x ? 'best' : ''}"><button data-act="perfuse" data-v="${x.tier}"><b>${TIER_LABEL[x.tier]}${best === x ? '<em>Recomendado</em>' : ''}</b><span><i>Girar</i>${x.giro.fps} fps</span><span><i>Como chegar</i>${x.rota.fps} fps</span>${q.tier === x.tier ? ic('check', 'i') : ''}</button></li>`).join('')}</ul>
          <label class="sr" for="perfout">Resultado</label><textarea id="perfout" class="perf-out" rows="6" readonly>${perfText(r)}</textarea>`
              : ''
          }
          <p class="nadic-src">Em uso: ${TIER_LABEL[q.tier]}. Toque numa versão para usá-la.</p>
        </div>
      </div>`,
  };
};
const fpsHudForce = () => '<div class="fps-hud" aria-hidden="true"><b>--</b><small></small></div>';
/* A melhor versão que ficou fluida: 50 fps girando, sem tranco maior que 50 ms, e o "como chegar" liso.
     Em aparelho fraco, aceita a primeira que ainda anda; senão, o 2D. */
const bestOf = (r) =>
  r.find((x) => x.giro.fps >= 50 && x.giro.p95 <= 50 && x.rota.p95 <= 34) ||
  r.find((x) => x.tier !== 'simples' && x.rota.fps >= 30 && x.giro.fps >= 20) ||
  r.find((x) => x.tier === 'simples');
const perfText = (r) =>
  `${navigator.userAgent}\nnúcleos ${navigator.hardwareConcurrency || '?'} · memória ${navigator.deviceMemory || '?'} GB · tela ${screen.width}×${screen.height} @${window.devicePixelRatio}\n${r.map((x) => `${x.tier}: girar ${x.giro.fps} fps (pior ${x.giro.p95} ms), como chegar ${x.rota.fps} fps (pior ${x.rota.p95} ms)`).join('\n')}\nautomático: ${window.Campus3D.quality().tier} · ${window.Campus3D.quality().why} · teste rápido ${window.Campus3D.quality().info?.ms ?? '?'} ms`;
function mountPerf(page) {
  const cv = useMapCanvas(page);
  if (!cv) return;
  window.Campus3D.attach(cv, { top: 0, bottom: 0, onPick: () => {}, onQuality: () => {} });
  startHud(page);
}
async function perfRun() {
  if (S.perfBusy) return;
  const C = window.Campus3D;
  const out = [];
  for (const t of C.tiers()) {
    S.perfBusy = t;
    S.perfResults = out.slice();
    rerender();
    out.push(await C.benchTier(t));
  }
  const best = bestOf(out);
  C.useTested(best.tier);
  S.perfBusy = null;
  S.perfResults = out;
  rerender();
  toast(`Teste concluído: o automático agora usa ${TIER_LABEL[best.tier]}`);
}

Screens.personalizar = () => {
  const C = window.Campus3D;
  const q = C.quality();
  const LABEL = TIER_LABEL;
  return {
    html: `${header('Personalizar')}<div class="pad stack custom">
        <section class="cu-preview st" ${st(0)} aria-hidden="true">
          <div class="cu-badge"><span class="av">${esc(D.person.initials)}</span><span><b>${esc(D.person.first)}</b><small>${esc(D.person.course)}</small></span></div>
          <div class="cu-row"><span class="btn primary">Como chegar</span><span class="btn soft">Presença</span></div>
        </section>
        <h2 class="h">Tema</h2>
        <div class="cu-themes">${Object.entries(THEMES)
          .map(([k, t]) => {
            const dk = isDark();
            const n = t.hue;
            const bg = n === null ? (dk ? '#0e1932' : '#f4f6fa') : dk ? hsl(n, 0.34, 0.1) : hsl(n, 0.3, 0.955);
            return `<button class="${UI.theme === k && !UI.accent ? 'on' : ''}" data-act="theme" data-v="${k}" aria-pressed="${UI.theme === k}"><i style="background:${bg}"><u style="background:${t.accent}"></u></i><b>${t.name}</b><small>${t.desc}</small></button>`;
          })
          .join('')}</div>
        <h2 class="h">Cor de destaque</h2>
        <div class="cu-accents">${ACCENTS.map((a) => `<button class="${UI.accent === a ? 'on' : ''}" style="background:${a}" data-act="accent" data-v="${a}" aria-label="Usar a cor ${a}">${UI.accent === a ? ic('check') : ''}</button>`).join('')}<label class="cu-custom" aria-label="Escolher outra cor"><input type="color" id="accentpick" value="${UI.accent || (THEMES[UI.theme] || THEMES.etal).accent}">${ic('plus')}</label></div>
        <ul class="cu-opts">
          <li><span>Aparência</span>${uiSeg('mode', [
            ['claro', 'Claro'],
            ['escuro', 'Escuro'],
            ['auto', 'Automático'],
          ])}</li>
          <li><span>Crachá</span>${uiSeg('badge', [
            ['solido', 'Sólido'],
            ['degrade', 'Degradê'],
            ['colmeia', 'Colmeia'],
          ])}</li>
          <li><span>Cantos</span>${uiSeg('corners', [
            ['retos', 'Retos'],
            ['suaves', 'Suaves'],
            ['redondos', 'Redondos'],
          ])}</li>
          <li><span>Fonte</span>${uiSeg('font', [
            ['padrao', 'Padrão'],
            ['arredondada', 'Arredondada'],
            ['leitura', 'Leitura fácil'],
          ])}</li>
          <li><span>Texto</span>${uiSeg('text', [
            ['normal', 'Normal'],
            ['grande', 'Grande'],
            ['maior', 'Maior'],
          ])}</li>
          <li><span>Animações</span>${uiSeg('motion', [
            ['completas', 'Completas'],
            ['reduzidas', 'Reduzidas'],
          ])}</li>
        </ul>
        <h2 class="h">No início</h2>
        <ul class="cu-toggles">
          <li><button data-act="uisky" aria-pressed="${UI.sky}" class="${UI.sky ? 'on' : ''}"><span>Céu do Alto Oeste</span><i class="switch"></i></button></li>
          ${HOME_PARTS.map(([k, t]) => `<li><button data-act="uihome" data-k="${k}" aria-pressed="${UI.home[k]}" class="${UI.home[k] ? 'on' : ''}"><span>${t}</span><i class="switch"></i></button></li>`).join('')}
        </ul>
        <h2 class="h">Mapa</h2>
        <ul class="cu-opts">
          <li><span>Mapa</span>${uiSeg('mapa', [
            ['novo', 'Novo (3D)'],
            ['classico', 'Clássico'],
          ])}</li>
          ${
            C.canUse3D()
              ? `<li><span>Vista inicial</span>${uiSeg('view', [
                  ['3d', '3D'],
                  ['2d', '2D'],
                ])}</li>`
              : ''
          }
          <li><span>Qualidade</span><div class="mini-seg wide" role="radiogroup">${[
            ['auto', 'Auto'],
            ['alta', 'Completo'],
            ['media', 'Médio'],
            ['leve', 'Leve'],
            ['simples', '2D'],
          ]
            .map(
              ([v, t]) =>
                `<button class="${q.setting === v ? 'on' : ''}" role="radio" aria-checked="${q.setting === v}" data-act="quality" data-v="${v}">${t}</button>`,
            )
            .join(
              '',
            )}</div><small class="cu-note">Em uso: ${LABEL[q.tier]}${q.setting === 'auto' ? ` · ${q.why}` : ''}. </small></li>
          <li class="cu-row2"><button data-act="uimaphour" aria-pressed="${UI.mapHour}" class="${UI.mapHour ? 'on' : ''}"><span>Luz do mapa segue o horário</span><i class="switch"></i></button></li>
          <li class="cu-row2"><button data-act="uifps" aria-pressed="${!!UI.fps}" class="${UI.fps ? 'on' : ''}"><span>Mostrar FPS no mapa</span><i class="switch"></i></button></li>
          <li class="cu-row2"><button data-go="perf"><span>Testar desempenho neste aparelho</span>${ic('chev', 'i card-chev')}</button></li>
        </ul>
        <button class="btn ghost" data-act="uireset">Restaurar o padrão</button>
      </div>`,
  };
};

/* ===== app/14-retrospectiva-e-perfil.js ===== */
/* app/14-retrospectiva-e-perfil.js · retrospectiva, "mais" e perfil.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- retrospectiva ---- */
function retroData(demo) {
  const ids = demo ? D.enrolled : Object.keys(S.present);
  const list = ids.map(byId);
  const q = Object.values(S.asked).reduce((n, a) => n + a.length, 0);
  return {
    demo,
    list,
    hours: list.reduce((n, x) => n + hoursOf(x), 0),
    learn: list.flatMap((x) => x.learn).slice(0, 5),
    people: list,
    questions: demo ? 2 : q,
    contacts: demo ? 3 : S.contacts.length,
    ratings: demo ? 3 : Object.keys(S.ratings).length,
  };
}
function retroSlides(r) {
  const tag = '';
  const got = r.demo ? D.combs.length : combEarned().length;
  const n = r.list.length;
  return [
    `<div class="re-c">${mark('mark re-mark')}${tag}<h1>Seu ETAL</h1><p>VII edição, 26 a 28 de novembro, em Pau dos Ferros.</p><strong>${esc(D.person.name)}</strong></div>`,
    `<div class="re-c">${tag}<small>Tempo de aprendizado</small><b class="re-num" data-to="${r.hours}">0</b><p>em ${n} ${n === 1 ? 'atividade' : 'atividades'}.</p><ul class="re-list">${r.list.map((x) => `<li>${x.short}<small>${x.type}, ${x.room}</small></li>`).join('')}</ul></div>`,
    `<div class="re-c">${tag}<small>O que você aprendeu</small><ul class="re-learn">${r.learn.map((l) => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul></div>`,
    `<div class="re-c">${tag}<small>Quem fez parte</small><div class="re-people">${r.people.map((x) => `<span><i>${x.initials}</i>${x.speakerShort}</span>`).join('')}</div><dl class="re-stats"><div><dd>${r.questions}</dd><dt>${r.questions === 1 ? 'pergunta' : 'perguntas'}</dt></div><div><dd>${r.contacts}</dd><dt>${r.contacts === 1 ? 'contato' : 'contatos'}</dt></div><div><dd>${r.ratings}</dd><dt>${r.ratings === 1 ? 'avaliação' : 'avaliações'}</dt></div></dl></div>`,
    `<div class="re-c">${tag}<small>Sua colmeia</small><div class="re-comb">${comb('big', r.demo)}</div><p>${got} de ${D.combs.length} favos.</p></div>`,
    `<div class="re-c">${tag}<small>O que é o ETAL</small><p class="re-long">${D.etal.about}</p><ol class="re-time">${D.etal.editions.map(([y, nm]) => `<li class="${y === '2025' ? 'on' : ''}"><time>${y}</time>${nm}</li>`).join('')}</ol></div>`,
    `<div class="re-c re-end">${mark('mark re-mark')}${tag}<h1>Até o próximo ETAL</h1><p>${r.hours} ${r.hours === 1 ? 'hora' : 'horas'}, ${n} ${n === 1 ? 'atividade' : 'atividades'} e ${got} ${got === 1 ? 'favo' : 'favos'}.</p><div class="re-actions"><button class="btn big re-primary" data-act="retroshare">${ic('share')}Compartilhar</button><button class="btn big re-ghost" data-act="retroclose">Fechar</button></div></div>`,
  ];
}
let retro = null;
const RETRO_MS = 6500;
function retroShow(i) {
  if (!retro) return;
  retro.i = Math.max(0, Math.min(retro.slides.length - 1, i));
  const root = $('.re-root', ov);
  if (!root) return;
  root.querySelector('.re-stage').innerHTML = `<article class="re-slide">${retro.slides[retro.i]}</article>`;
  root.querySelectorAll('.re-bars i').forEach((b, k) => {
    b.className = k < retro.i ? 'done' : k === retro.i ? 'run' : '';
  });
  const num = root.querySelector('.re-num');
  if (num) {
    const to = +num.dataset.to;
    const t0 = performance.now();
    const tick = (n) => {
      const k = reduce ? 1 : Math.min(1, (n - t0) / 900);
      num.textContent = `${Math.round(to * (1 - (1 - k) ** 3))}h`;
      if (k < 1 && num.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  clearTimeout(retro.t);
  if (!reduce && retro.i < retro.slides.length - 1) retro.t = setTimeout(() => retroShow(retro.i + 1), RETRO_MS);
}
Overlays.retro = (n) => `<div class="re-root" role="dialog" aria-label="Minha retrospectiva">
      <div class="re-bars">${Array.from({ length: n }, () => '<i></i>').join('')}</div>
      <button class="round re-close" data-act="retroclose" aria-label="Fechar">${ic('x')}</button>
      <div class="re-stage"></div>
      <button class="re-tap prev" data-act="retroprev" aria-label="Anterior"></button><button class="re-tap next" data-act="retronext" aria-label="Próximo"></button>
    </div>`;
Overlays.retroEmpty =
  () => `<div class="sheet" role="dialog" aria-label="Retrospectiva"><i class="grab"></i>${illo('mark')}
      <h2>Sua retrospectiva começa na primeira presença</h2><p class="sh-p">Registre presença numa atividade para ela ganhar conteúdo.</p>
      </div>`;
function retroOpen(demo) {
  const data = retroData(demo);
  if (!data.list.length) {
    openOverlay(Overlays.retroEmpty(), 'share');
    return;
  }
  retro = {
    i: 0,
    slides: retroSlides(data),
    t: 0,
    text: `Meu ETAL: ${data.hours} horas em ${data.list.length} atividades e ${demo ? D.combs.length : combEarned().length} favos na colmeia.`,
  };
  openOverlay(Overlays.retro(retro.slides.length), 'retro');
  retroShow(0);
}

/* Tudo o que não é do dia a dia do evento fica aqui, fora da primeira tela do perfil. */
Screens.mais = () => ({
  html: `${header('Mais opções')}<div class="pad stack">
        <div class="sec st" ${st(0)}><h2>Aplicativo</h2></div>
        <ul class="menu st" ${st(1)}>
          <li data-go="personalizar">${ic('moon')}<span>Personalizar</span><em>${(THEMES[UI.theme] || THEMES.etal).name}</em>${ic('chev', 'i chev')}</li>
          ${standalone() ? '' : `<li data-act="install">${ic('download')}<span>Instalar o ETAL Connect</span><em>Sem internet</em>${ic('chev', 'i chev')}</li>`}
        </ul>
        ${
          orgDe()
            ? `<div class="sec st" ${st(2)}><h2>Organização</h2></div>
        <ul class="menu st" ${st(3)}>
          <li data-go="org">${ic('building')}<span>Painel da organização</span><em>${esc(orgDe().papel)}</em>${ic('chev', 'i chev')}</li>
        </ul>`
            : ''
        }
        <div class="sec st" ${st(4)}><h2>Sobre</h2></div>
        <ul class="menu st" ${st(5)}>
          <li data-go="etal">${ic('info')}<span>O que é o ETAL</span>${ic('chev', 'i chev')}</li>
          <li data-go="sobre">${ic('list')}<span>Sobre o aplicativo</span>${ic('chev', 'i chev')}</li>
          <li data-go="nadic">${ic('info')}<span>Sobre o NADIC</span>${ic('chev', 'i chev')}</li>
          <li data-act="link" data-url="${D.ifrnUrl}">${ic('open')}<span>IFRN Pau dos Ferros</span></li>
        </ul>
      </div>`,
});
Screens.profile = () => ({
  html: `${header('Perfil')}
      <div class="pad stack">
        <section class="profile-hero st" ${st(0)}><button class="profile-portrait" data-act="profile-edit" aria-label="Editar foto e nome">${meAv('av')}<span class="profile-pencil">${ic('pencil')}</span></button><h2>${esc(D.person.name)}</h2><div class="profile-link">${linkLine()}</div><p>${esc(D.person.courseFull || D.person.course || '')}</p><small>${esc([D.person.year, D.person.campus].filter(Boolean).join(' · '))}</small><button class="profile-edit-link" data-go="cartao">${ic('pencil')}Editar perfil</button></section>
        ${taughtActivityCard(D.person)}
        ${orgDe() ? `<button class="org-cta st" ${st(1)} data-go="org">${ic('building')}<span><small>Você é da organização · ${esc(orgDe().papel)}</small><b>Painel da organização</b></span>${ic('chev')}</button>` : ''}
        <button class="retro-cta st" ${st(1)} data-act="retro">${comb('tiny')}<span><b>Minha retrospectiva</b><small>O que você fez e aprendeu no ETAL</small></span>${ic('chev')}</button>
        <ul class="menu st" ${st(1)}>
          <li data-go="credential">${ic('id')}<span>Minha credencial</span><em>${S.credAt ? 'Ativa' : 'Pendente'}</em>${ic('chev', 'i chev')}</li>
          <li data-act="mine">${ic('list')}<span>Minha agenda</span><em>${S.saved.size}</em>${ic('chev', 'i chev')}</li>
          <li data-go="materials">${ic('file')}<span>Materiais</span><em>${Object.keys(S.present).reduce((n, k) => n + byId(k).materials.length, 0)}</em>${ic('chev', 'i chev')}</li>
          <li data-go="suapEvents">${ic('cal')}<span>Meus eventos no SUAP</span>${ic('chev', 'i chev')}</li>
          <li data-go="certificates">${ic('award')}<span>Certificados</span>${ic('chev', 'i chev')}</li>
          <li data-go="network">${ic('contact')}<span>Contatos</span><em>${S.contacts.length}</em>${ic('chev', 'i chev')}</li>
          <li data-go="cartao">${ic('id')}<span>Interesses e contato</span><em>${cardGet() ? (cardGet().publish === false ? 'Oculto' : 'Visível') : 'Personalizar'}</em>${ic('chev', 'i chev')}</li>
        </ul>
        <ul class="menu st" ${st(2)}>
          <li data-go="games" class="games-row">${ic('trophy')}<span>Campeonatos</span><em>Qui 27</em>${ic('chev', 'i chev')}</li>
          <li data-go="mais">${ic('list')}<span>Mais opções</span><em>Aparência e sobre</em>${ic('chev', 'i chev')}</li>
        </ul>
        <ul class="menu danger st" ${st(5)}><li data-act="logout">${ic('logout')}<span>Sair</span></li></ul>
      </div>`,
});

/* ===== app/15-organizacao.js ===== */
/* app/15-organizacao.js · painel da organização no celular (por matrícula).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- painel da organização: números simulados para a demonstração ---- */
const roomsAll = () =>
  P.floors.flatMap((f) =>
    f.zones
      .filter((z) => z.roomNumber)
      .map((z) => ({
        floor: f.level,
        zone: z.id,
        name: z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : `Sala ${z.roomNumber}`,
      })),
  );
/* ---- Organização: por matrícula (D.organizadores + os acrescentados no painel, em etal-org.organizadores) ---- */
const organizadores = () => {
  const extra = orgRead().organizadores || [];
  return [...D.organizadores, ...extra.filter((o) => !D.organizadores.some((d) => d.matricula === o.matricula))];
};
const orgDe = () => organizadores().find((o) => o.matricula === String(D.person.id || '')) || null;
const semAcesso = () => ({
  html: `${header('Painel da organização')}<div class="pad stack"><div class="empty st" ${st(0)}>${illo('mark')}<h3>Só para a organização</h3><p>O painel abre para as matrículas cadastradas como organizadoras do ETAL.</p></div></div>`,
});
/* Painel no celular: números do momento e atalhos para o que a equipe faz durante o evento. */
/* Galeria de QR Codes para a equipe: com servidor, os QRs assinados (/api/org/qrs/lista); sem servidor, os de teste
     (etal:<atividade>). Tocar abre em tela cheia, branco, para mostrar ao celular de quem não está conseguindo ler. */
let qrcodeLoad = null;
const loadQRCode = () =>
  qrcodeLoad ||
  (qrcodeLoad = new Promise((ok, no) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/qrcode.js';
    sc.onload = () => ok(window.QRCode);
    sc.onerror = no;
    document.head.appendChild(sc);
  }));
let oqItens = [];
let oqI = 0;
async function oqCarregar() {
  if (API) return (await API.get('/api/org/qrs/lista')).map((q) => ({ ...q, texto: q.token }));
  return [
    { id: null, title: 'Credenciamento', where: 'Recepção', texto: 'etal:recepcao' },
    ...D.sessions
      .filter((x) => x.id !== 'credenciamento')
      .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
      .map((x) => ({ id: x.id, title: x.title, where: x.room, day: x.day, time: x.time, texto: `etal:${x.id}` })),
  ];
}
const oqOnde = (q) => [q.where, q.day ? `${dayOf(q.day).week} ${q.day}` : '', q.time].filter(Boolean).join(' · ');
function oqTela(i) {
  oqI = (i + oqItens.length) % oqItens.length;
  const q = oqItens[oqI];
  const el = $('.oq-full', ov);
  if (!el) return;
  $('.oq-qr', el).innerHTML = window.QRCode.svg(q.texto, { margin: 2 });
  $('.oq-t', el).textContent = q.title;
  $('.oq-w', el).textContent = oqOnde(q);
  $('.oq-n', el).textContent = `${oqI + 1} / ${oqItens.length}`;
}
Screens.orgQrs = () => {
  if (!orgDe() && !D.person.org) return semAcesso();
  return {
    html: `${header('QR Codes das salas')}<div class="pad stack oq">
        <p class="oq-nota st" ${st(0)}>${ic('info')}<span>QR rasgado ou que não lê? Toque nele para abrir em tela cheia e mostre para a câmera do participante.</span></p>
        <label class="oq-busca st" ${st(1)}>${ic('search')}<input type="search" placeholder="Buscar atividade ou sala" aria-label="Buscar QR"></label>
        <div class="oq-lista st" ${st(2)}><p class="oq-vazio">Carregando os QR Codes…</p></div>
        ${API ? `<a class="btn soft st" ${st(3)} href="${esc(API.url('/api/org/qrs'))}" target="_blank" rel="noopener">${ic('file')}Versão para imprimir</a>` : ''}
      </div>`,
    mount: async (page) => {
      const lista = $('.oq-lista', page);
      try {
        const [QR, itens] = await Promise.all([loadQRCode(), oqCarregar()]);
        oqItens = itens;
        const pinta = (f = '') => {
          const t = fold(f);
          lista.innerHTML =
            oqItens
              .map((q, i) => ({ q, i }))
              .filter(({ q }) => !t || fold(`${q.title} ${q.where}`).includes(t))
              .map(
                ({ q, i }) =>
                  `<button class="oq-item" data-act="oq-abrir" data-i="${i}"><span class="oq-mini">${QR.svg(q.texto, { margin: 1 })}</span><b>${esc(q.title)}</b><small>${esc(oqOnde(q))}</small></button>`,
              )
              .join('') || '<p class="oq-vazio">Nada encontrado.</p>';
        };
        pinta();
        $('.oq-busca input', page).addEventListener('input', (e) => pinta(e.target.value));
      } catch (x) {
        lista.innerHTML = `<p class="oq-vazio">${esc(x.message || 'Não foi possível carregar os QR Codes.')}</p>`;
      }
    },
  };
};
Screens.org = () => {
  const eu = orgDe();
  if (!eu) return semAcesso();
  const now = D.sessions.filter((x) => isNow(x) && x.seats);
  const present = (x) => Math.min(x.seats, Math.round(x.taken * 0.86 + 1));
  const inRooms = now.reduce((n, x) => n + present(x), 0);
  const o = orgRead();
  const manuais = Object.keys(o.manuais || {}).length;
  const ferramentas = [
    ['bell', 'Enviar aviso', 'Para todo mundo, na hora', 'orgAviso'],
    ['route', 'Trocar sala', 'E avisar os inscritos', 'orgSala'],
    ['trophy', 'Campeonatos', 'Resultados, regras e chave', 'orgJogos'],
    ['id', 'Credenciar', 'Cadastro manual de quem não consegue', 'orgCred'],
    ['users', 'Equipe', `${organizadores().length} matrículas na organização`, 'orgEquipe'],
    ['flag', 'Moderação', 'Denúncias e conteúdo da comunidade', 'orgCommunity'],
    ['qr', 'QR Codes das salas', 'Para quando o impresso rasga ou não lê', 'orgQrs'],
  ];
  return {
    html: `${header('Painel da organização')}<div class="pad stack org">
        <div class="org-eu st" ${st(0)}>${meAv('av')}<span><b>${esc(D.person.first || D.person.name)}</b><small>${esc(eu.papel)} · matrícula ${esc(eu.matricula)}</small></span></div>
        <div class="org-kpis st" ${st(1)}>
          <div><b>${liveCred + manuais}</b><small>credenciados</small><em>de ${D.org.inscritos} inscritos</em></div>
          <div><b>${inRooms}</b><small>pessoas em sala</small><em>${now.length} atividades agora</em></div>
        </div>
        <div class="org-ferr st" ${st(2)}>${ferramentas.map(([i, t, sub, go]) => `<button data-go="${go}">${ic(i)}<b>${t}</b><small>${sub}</small></button>`).join('')}</div>
        ${
          now.length
            ? `<section class="org-card st" ${st(3)}><h2>Lotação agora</h2><ul class="org-rooms">${now
                .map((x) => {
                  const n = present(x);
                  const pc = Math.round((n / x.seats) * 100);
                  return `<li data-go="activity" data-id="${x.id}"><span><b>${esc(x.short)}</b><small>${esc(whereOf(x))}</small></span><span class="org-meter ${pc >= 90 ? 'full' : ''}"><i style="width:${pc}%"></i></span><em>${n}/${x.seats}</em></li>`;
                })
                .join('')}</ul></section>`
            : ''
        }
        <a class="org-desk st" ${st(4)} href="admin.html" target="_blank" rel="noopener">${ic('laptop')}<span><b>Painel completo no computador</b><small>Planta ao vivo, participantes e CSV</small></span>${ic('open')}</a>

      </div>`,
  };
};
Screens.orgAviso = () =>
  orgDe()
    ? {
        html: `${header('Enviar aviso')}<div class="pad stack org">
      <form class="org-card st" ${st(0)} data-form="orgnotice">
        <label class="field" for="ontitle"><span>Título</span><input id="ontitle" maxlength="70" placeholder="Ex.: Palestra de encerramento às 17:00" required></label>
        <label class="field" for="ontext"><span>Texto</span><textarea id="ontext" rows="3" maxlength="180" placeholder="Detalhes para quem está no evento"></textarea></label>
        <button class="btn primary" type="submit">${ic('bell')}Enviar para todos</button>
      </form>
      ${
        (orgRead().notices || []).length
          ? `<section class="org-card st" ${st(1)}><h2>Enviados</h2><ul class="org-lista">${orgRead()
              .notices.slice(0, 6)
              .map((n) => `<li><b>${esc(n.title)}</b><small>${esc(n.time || '')} · ${esc(n.text || '')}</small></li>`)
              .join('')}</ul></section>`
          : ''
      }
    </div>`,
      }
    : semAcesso();
Screens.orgSala = () => {
  if (!orgDe()) return semAcesso();
  const ativ = D.sessions.filter((x) => x.floor !== undefined && x.zone && !x.simple);
  return {
    html: `${header('Trocar sala')}<div class="pad stack org">
      <form class="org-card st" ${st(0)} data-form="orgroom">
        <label class="field" for="orx"><span>Atividade</span><select id="orx">${ativ.map((x) => `<option value="${x.id}">${esc(dayOf(x.day).week)} ${x.time} · ${esc(x.short)} · ${esc(x.room)}</option>`).join('')}</select></label>
        <label class="field" for="ory"><span>Nova sala</span><select id="ory">${roomsAll()
          .map((r) => `<option value="${r.floor}|${r.zone}">${r.name} · ${floorOf(r.floor).label}</option>`)
          .join('')}</select></label>
        <button class="btn primary" type="submit">${ic('route')}Mudar e avisar os inscritos</button>
      </form></div>`,
  };
};
Screens.orgJogos = () =>
  orgDe()
    ? {
        html: `${header('Campeonatos')}<div class="pad stack org">${D.tournaments
          .map((t, i) => {
            const stt = tourSt(t);
            const [, l] = window.TOUR.status(stt);
            return `<button class="org-jogo st" ${st(i)} data-go="orgJogo" data-id="${t.id}"><span class="org-jogo-arte ${t.theme}">${gameArt(t)}</span><span><b>${esc(t.name)}</b><small>${l} · ${8 - stt.free}/8 na chave</small></span>${ic('chev')}</button>`;
          })
          .join('')}</div>`,
      }
    : semAcesso();
/* Um campeonato: quem ganhou cada partida (toque no vencedor), abrir ou fechar a chave, inscrever ou tirar alguém e editar as regras. */
Screens.orgJogo = ({ id }) => {
  if (!orgDe()) return semAcesso();
  const t = D.tournaments.find((x) => x.id === id);
  const stt = tourSt(t);
  const R = window.TOUR.rounds(stt);
  const partida = (m, nome) =>
    `<li class="org-partida">${nome ? `<small>${nome}</small>` : ''}<div>${[m.a, m.b].map((p, w) => (p ? `<button class="${m.w === w ? 'on' : m.w !== null ? 'fora' : ''}" ${m.a && m.b ? `data-act="orgres" data-t="${t.id}" data-k="${m.k}" data-w="${w}"` : 'disabled'}>${esc(p[0])}${m.w === w ? ic('check') : ''}</button>` : `<button disabled>—</button>`)).join('<i>×</i>')}${m.w !== null ? `<button class="desf" data-act="orgres" data-t="${t.id}" data-k="${m.k}" data-w="" aria-label="Desfazer resultado">${ic('rotate')}</button>` : ''}</div></li>`;
  return {
    html: `${header(t.name)}<div class="pad stack org">
      <button class="org-switch st ${stt.open ? 'on' : ''}" ${st(0)} data-act="orgopen" data-t="${t.id}" aria-pressed="${stt.open}">${ic('trophy')}<span><b>Inscrições ${stt.open ? 'abertas' : 'fechadas'}</b><small>${stt.free} ${stt.free === 1 ? 'vaga livre' : 'vagas livres'}</small></span><i class="switch"></i></button>
      <section class="org-card st" ${st(1)}><h2>Resultados</h2><p class="org-dica">Toque em quem ganhou. A chave e o app atualizam na hora.</p>
        <ul class="org-partidas">${R.q.map((m, i) => partida(m, `Quartas · ${t.times[i]}`)).join('')}${R.s.map((m, i) => partida(m, `Semifinal ${i + 1}`)).join('')}${partida(R.f, 'Final')}</ul></section>
      <section class="org-card st" ${st(2)}><h2>Jogadores</h2><ul class="org-lista">${stt.players.map((p, i) => (p ? `<li><b>${esc(p[0])}</b><small>${esc(p[1])}${p[3] ? ` · ${esc(p[3])}` : ''}</small>${R.played ? '' : `<button class="org-x" data-act="orgrmjog" data-t="${t.id}" data-i="${i}" aria-label="Tirar ${esc(p[0])} da chave">${ic('x')}</button>`}</li>` : '')).join('')}</ul>
        ${stt.free ? `<form class="org-mini" data-form="orgjog" data-t="${t.id}"><h3>Inscrever alguém</h3><input name="nick" maxlength="14" placeholder="Apelido na chave" required><input name="nome" maxlength="40" placeholder="Nome" required><select name="pick">${t.picks.map((x) => `<option>${esc(x)}</option>`).join('')}</select><button class="btn soft" type="submit">${ic('plus')}Pôr na chave</button></form>` : ''}</section>
      <form class="org-card st" ${st(3)} data-form="orgregra" data-t="${t.id}"><h2>Regras</h2><textarea name="regras" rows="5">${esc(stt.rules || t.rules)}</textarea><button class="btn soft" type="submit">Salvar regras</button></form>
    </div>`,
  };
};
Screens.orgCred = () => {
  if (!orgDe()) return semAcesso();
  const man = Object.entries(orgRead().manuais || {});
  return {
    html: `${header('Credenciar')}<div class="pad stack org">
      <form class="org-card st" ${st(0)} data-form="orgcred"><p class="org-dica">Para quem não consegue entrar no app: o credenciamento fica registrado pela organização.</p>
        <label class="field"><span>Nome</span><input name="nome" maxlength="60" required placeholder="Nome e sobrenome"></label>
        <label class="field"><span>Matrícula ou documento</span><input name="mat" maxlength="20" required inputmode="numeric" placeholder="Ex.: 20231094010012"></label>
        <button class="btn primary" type="submit">${ic('check')}Credenciar agora</button>
      </form>
      ${man.length ? `<section class="org-card st" ${st(1)}><h2>Credenciados pela organização</h2><ul class="org-lista">${man.map(([m, x]) => `<li><b>${esc(x.nome)}</b><small>${esc(m)} · ${esc(x.hora)}</small></li>`).join('')}</ul></section>` : ''}
    </div>`,
  };
};
Screens.orgEquipe = () =>
  orgDe()
    ? {
        html: `${header('Equipe')}<div class="pad stack org">
      <section class="org-card st" ${st(0)}><h2>Organizadores</h2><ul class="org-lista">${organizadores()
        .map((o) => `<li><b>${esc(o.papel)}</b><small>matrícula ${esc(o.matricula)}</small></li>`)
        .join('')}</ul></section>
      <form class="org-card st" ${st(1)} data-form="orgequipe"><h2>Acrescentar</h2>
        <label class="field"><span>Matrícula</span><input name="mat" maxlength="20" required inputmode="numeric"></label>
        <label class="field"><span>Papel</span><input name="papel" maxlength="40" required placeholder="Ex.: Campeonatos, Recepção"></label>
        <button class="btn soft" type="submit">${ic('plus')}Dar acesso ao painel</button>
      </form></div>`,
      }
    : semAcesso();

/* ===== app/16-sobre-e-cracha.js ===== */
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
        <section class="cert-top st" ${st(0)}><span class="ring big" style="--p:${Math.round((hours / total) * 100)}"><b>${hours}h</b></span><div><strong>${hours} de ${total} horas</strong><span>Acompanhe suas horas de participação e consulte os certificados no SUAP.</span></div></section>
        <ul class="certs st" ${st(1)}>${rows.map((s) => `<li class="${S.present[s.id] ? 'done' : ''}" data-go="activity" data-id="${s.id}"><i>${ic(S.present[s.id] ? 'check' : 'clock')}</i><span><b>${s.short}</b><small>${S.present[s.id] ? `Presença às ${S.present[s.id]} · ${hoursOf(s)}h` : `${dayOf(s.day).week} ${s.day}, ${s.time} · ${hoursOf(s)}h`}</small></span></li>`).join('')}</ul>
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

/* ===== app/17-campeonatos.js ===== */
/* app/17-campeonatos.js · campeonatos: chave, elenco, regras e inscrição.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- campeonatos ---- */
/* Na exportação em arquivo único, as imagens vêm embutidas em ASSET_DATA. */
const assetUrl = (p) => (window.ASSET_DATA || {})[p] || p;
/* Banner: se existir assets/banner-mk.jpg ou banner-fifa.jpg, a imagem cobre a arte original. */
function gameArt(t) {
  return `${gameBase(t)}<img class="art art-photo" src="${assetUrl(t.banner || `assets/banner-${t.theme}.jpg`)}" alt="" onerror="this.remove()"><span class="art art-scrim"></span>`;
}
function gameBase(t) {
  return t.theme === 'mk'
    ? `<svg class="art" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="mkg" cx=".75" cy=".2" r=".9"><stop offset="0" stop-color="#8f2412"/><stop offset=".42" stop-color="#3f0b0c"/><stop offset="1" stop-color="#0c0406"/></radialGradient></defs><rect width="300" height="160" fill="url(#mkg)"/><g fill="none" stroke="#ffb199" stroke-opacity=".28"><path d="M-10 150 210 -10M30 170 250 10M70 190 290 30"/></g></svg>`
    : `<svg class="art" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ffg" x1="0" x2="1"><stop offset="0" stop-color="#1f7a35"/><stop offset="1" stop-color="#2f9b45"/></linearGradient></defs><rect width="300" height="160" fill="url(#ffg)"/><g fill="#ffffff" opacity=".06">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 50}" width="25" height="160"/>`).join('')}</g><g fill="none" stroke="#e9ffe9" stroke-opacity=".55" stroke-width="2"><rect x="12" y="12" width="276" height="136" rx="2"/><path d="M150 12v136"/><circle cx="150" cy="80" r="26"/><rect x="12" y="46" width="34" height="68"/><rect x="254" y="46" width="34" height="68"/></g><circle cx="150" cy="80" r="3" fill="#e9ffe9"/></svg>`;
}

const titleOf = (t, cls = '') =>
  t.logo
    ? `<img class="p-logo ${cls}" src="${t.logo}" alt="${t.name}">`
    : t.hideName
      ? `<span class="sr">${t.name}</span>`
      : `<span class="p-name">${t.name}</span>`;

/* Estado dos campeonatos: vem do painel (etal-org.torneios). Ver window.TOUR em data.js. */
const tourSt = (t) => window.TOUR.state(t, orgRead());
const tourMine = (st) => st.players.findIndex((p) => p && p[4] === D.person.id);
const tourChip = (st) => {
  const [k, l] = window.TOUR.status(st);
  return `<span class="t-chip ${k}">${k === 'live' ? '<i></i>' : ''}${l}</span>`;
};
const tourSession = (t) => D.sessions.find((x) => x.tournament === t.id);
const facesOf = (st) => {
  const ps = st.players.filter(Boolean);
  return `<span class="faces">${ps
    .slice(0, 4)
    .map((p) => `<i>${esc(p[2])}</i>`)
    .join('')}${ps.length > 4 ? `<i>+${ps.length - 4}</i>` : ''}</span>`;
};

Screens.games = () => ({
  html: `${header('Campeonatos')}
      <div class="pad stack">
        <p class="games-lead st" ${st(0)}>Quinta, 27 de novembro, na Sala 102. Entre na chave ou venha torcer.</p>
        ${D.tournaments
          .map((t, i) => {
            const stt = tourSt(t);
            const me = tourMine(stt) >= 0;
            return `
        <button class="poster ${t.theme} st" ${st(i + 1)} data-go="tournament" data-id="${t.id}">
          ${gameArt(t)}
          <span class="poster-tx">${titleOf(t)}<span class="p-tag">${t.tagline}</span></span>
          <span class="poster-chip">${me ? `<span class="t-chip me">${ic('check')}Você está na chave</span>` : tourChip(stt)}</span>
          <span class="poster-foot"><span>${dayOf(t.day).week} ${t.day} · ${t.time}</span>${facesOf(stt)}</span>
        </button>`;
          })
          .join('')}
      </div>`,
});

/* Cor de cada jogador (as mesmas em toda a tela): o jogador deixa de ser só iniciais laranja iguais às dos outros. */
const COR_JOG = ['#e8542b', '#3b82f6', '#16a34a', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6', '#64748b'];
const corJog = (stt, p) => COR_JOG[Math.max(0, stt.players.indexOf(p)) % COR_JOG.length];
const avJog = (stt, p, cls = '') =>
  p
    ? `<span class="jg-av ${cls}" style="--c:${corJog(stt, p)}">${esc(p[2])}</span>`
    : `<span class="jg-av vazio ${cls}"></span>`;
/* Situação de cada jogador na chave: campeão, eliminado (em que fase), na disputa (e contra quem joga a seguir). */
function situacao(stt, R, p) {
  if (R.champ === p) return { k: 'champ', t: 'Campeão' };
  const fases = [
    ['nas quartas', R.q],
    ['na semifinal', R.s],
    ['na final', [R.f]],
  ];
  for (const [nome, ms] of fases)
    for (const m of ms) {
      if (m.a !== p && m.b !== p) continue;
      if (m.w !== null && m.win !== p) return { k: 'fora', t: `Eliminado ${nome}` };
      if (m.w === null) {
        const adv = m.a === p ? m.b : m.a;
        return { k: 'vivo', t: adv ? `Joga contra ${adv[0]}` : 'Aguardando adversário' };
      }
    }
  return { k: 'vivo', t: 'Na disputa' };
}
/* Chave em rodadas (padrão dos apps de torneio no celular): escolhe a fase e vê cada partida como um duelo. */
function bracket(t, stt) {
  const R = window.TOUR.rounds(stt);
  const mine = D.person.id;
  const fases = [
    ['q', 'Quartas', R.q],
    ['s', 'Semifinal', R.s],
    ['f', 'Final', [R.f]],
  ];
  const atual = fases.find(([, , ms]) => ms.some((m) => m.w === null && m.a && m.b))?.[0] || (R.champ ? 'f' : 'q');
  const fase = S.tourRound && fases.some((f) => f[0] === S.tourRound) ? S.tourRound : atual;
  const lado = (p, m, i) => {
    const res = m.w === null ? '' : m.w === i ? 'ganhou' : 'perdeu';
    return p
      ? `<div class="du-lado ${res} ${p[4] === mine ? 'eu' : ''}">${avJog(stt, p)}<b>${esc(p[0])}</b><small>${esc(p[3] || p[1])}</small>${m.w === i ? `<em>${ic('check')}Venceu</em>` : ''}</div>`
      : `<div class="du-lado vazio">${avJog(stt, null)}<b>${m.k[0] === 'q' ? 'Vaga aberta' : 'A definir'}</b><small>${m.k[0] === 'q' ? 'inscreva-se' : 'vencedor da anterior'}</small></div>`;
  };
  const hora = (m, i) => (m.k[0] === 'q' ? t.times[i] : '');
  const duelo = (m, i) => {
    const minha = [m.a, m.b].some((p) => p && p[4] === mine);
    return `<article class="duelo st ${minha ? 'minha' : ''} ${m.k === 'f' ? 'final' : ''}" ${st(3 + i)}>${minha ? '<span class="du-fita">Sua partida</span>' : ''}${lado(m.a, m, 0)}<div class="du-meio">${m.k === 'f' ? ic('trophy') : ''}<b>VS</b>${hora(m, i) ? `<time>${hora(m, i)}</time>` : ''}</div>${lado(m.b, m, 1)}</article>`;
  };
  const ms = fases.find((f) => f[0] === fase)[2];
  return `${R.champ ? `<div class="campeao st" ${st(2)}>${avJog(stt, R.champ, 'grande')}<span><small>${ic('trophy')}Campeão</small><b>${esc(R.champ[0])}</b><em>${esc(R.champ[1])}</em></span></div>` : ''}
      <div class="fases st" ${st(2)}>${fases
        .map(([k, nome, l]) => {
          const feitas = l.filter((m) => m.w !== null).length;
          return `<button class="${k === fase ? 'on' : ''}" data-act="tourround" data-k="${k}"><b>${nome}</b><small>${feitas}/${l.length}</small></button>`;
        })
        .join('')}</div>
      <div class="duelos">${ms.map(duelo).join('')}</div>`;
}
/* Jogadores: cor própria, escolha, situação na chave e o próximo adversário. */
function jogadores(t, stt, canJoin) {
  const R = window.TOUR.rounds(stt);
  return `<ul class="elenco">${stt.players
    .map((p, i) =>
      p
        ? (() => {
            const sit = situacao(stt, R, p);
            return `<li class="st ${p[4] === D.person.id ? 'eu' : ''} ${sit.k}" ${st(3 + i)} style="--c:${corJog(stt, p)}"><span class="el-num">${String(i + 1).padStart(2, '0')}</span>${avJog(stt, p, 'grande')}<span class="el-tx"><b>${esc(p[0])}${p[4] === D.person.id ? ' <u>você</u>' : ''}</b><small>${esc(p[1])}</small></span><span class="el-dir">${p[3] ? `<em>${esc(p[3])}</em>` : ''}<small class="el-sit">${sit.t}</small></span></li>`;
          })()
        : `<li class="st vazio" ${st(3 + i)}>${canJoin ? `<button data-act="tourform" data-v="1"><span class="el-num">${String(i + 1).padStart(2, '0')}</span>${avJog(stt, null, 'grande')}<span class="el-tx"><b>Vaga aberta</b><small>Toque para entrar na chave</small></span>${ic('plus')}</button>` : `<span class="el-num">${String(i + 1).padStart(2, '0')}</span>${avJog(stt, null, 'grande')}<span class="el-tx"><b>Vaga</b><small>sem inscrito</small></span>`}</li>`,
    )
    .join('')}</ul>`;
}
/* Regras: como funciona em passos, regras em tópicos, horários e prêmio. A organização pode editar o texto pelo painel. */
function regras(t, stt) {
  const texto = stt.rules || t.rules;
  const itens = texto
    .split(/(?<=\.)\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const passos = [
    ['trophy', 'Inscreva-se', 'pelo app, até a chave fechar'],
    ['qr', 'Faça o check-in', `no QR da ${t.place.split(' · ')[0]}`],
    ['swords', 'Jogue sua partida', t.format.split(' · ').slice(1).join(' · ') || t.format],
    ['award', 'Quem vence avança', 'até a final'],
  ];
  return `<section class="st" ${st(3)}><h3 class="tr-h">Como funciona</h3><ol class="tr-passos">${passos.map(([i, b, sm]) => `<li>${ic(i)}<span><b>${b}</b><small>${esc(sm)}</small></span></li>`).join('')}</ol></section>
      <section class="st" ${st(4)}><h3 class="tr-h">Regras</h3><ul class="tr-regras">${itens.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="st" ${st(5)}><h3 class="tr-h">Horários das quartas</h3><div class="tr-horas">${t.times.map((h, i) => `<span><b>${h}</b><small>partida ${i + 1}</small></span>`).join('')}</div></section>
      <div class="tr-premio st" ${st(6)}>${ic('trophy')}<span><small>Prêmio</small><b>${esc(t.prize)}</b></span></div>`;
}

/* Inscrição: apelido, escolha (personagem ou time) e como a pessoa quer jogar. */
const TOUR_LEVELS = ['Só pela diversão', 'Jogo às vezes', 'Vim para ganhar'];
function tourForm(t, stt) {
  const f = S.tourForm || {};
  const nick = f.nick ?? D.person.first ?? '';
  return `<form class="t-form st" ${st(2)} data-form="tourjoin" data-id="${t.id}">
      <h3>Entrar na chave</h3>
      <label class="t-field"><span>Seu apelido na chave</span><input name="nick" maxlength="14" required autocomplete="off" value="${esc(nick)}" placeholder="Como vão te chamar"></label>
      <div class="t-field"><span>${t.pickLabel}</span><div class="t-chips">${t.picks.map((x) => `<button type="button" class="${(f.pick || t.picks[t.picks.length - 1]) === x ? 'on' : ''}" data-act="tourpick" data-k="pick" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
      <div class="t-field"><span>Como você joga</span><div class="t-chips">${TOUR_LEVELS.map((x, i) => `<button type="button" class="${(f.level ?? 1) === i ? 'on' : ''}" data-act="tourpick" data-k="level" data-v="${i}">${x}</button>`).join('')}</div></div>
      <p class="t-note">${stt.free} ${stt.free === 1 ? 'vaga' : 'vagas'}. A ordem dos confrontos é definida pela organização.</p>
      <div class="t-row"><button type="button" class="btn t-ghost" data-act="tourform" data-v="0">Cancelar</button><button type="submit" class="btn t-cta">Confirmar inscrição</button></div>
    </form>`;
}

Screens.tournament = ({ id }) => {
  const t = D.tournaments.find((x) => x.id === id);
  const stt = tourSt(t);
  const R = window.TOUR.rounds(stt);
  const mi = tourMine(stt);
  const me = mi >= 0 ? stt.players[mi] : null;
  const ses = tourSession(t);
  const watching = ses && S.saved.has(ses.id);
  const tab = S.tourTab;
  const tabs = [
    ['chave', 'Chave'],
    ['jogadores', `Jogadores · ${8 - stt.free}`],
    ['regras', 'Regras'],
  ];
  const canJoin = stt.open && stt.free > 0 && !R.played && !me;
  const lvl = (p) => (p[5] !== undefined ? TOUR_LEVELS[p[5]] : '');
  const body = `<div class="tr-pad">${tab === 'chave' ? bracket(t, stt) : tab === 'jogadores' ? jogadores(t, stt, canJoin) : regras(t, stt)}</div>`;
  const cta =
    S.tourForm && canJoin
      ? tourForm(t, stt)
      : `<div class="t-actions st" ${st(1)}>
          ${
            me
              ? `<div class="t-in">${ic('check', 'i t-in-ok')}<span><b>Você está na chave como ${esc(me[0])}</b><small>${[me[3], lvl(me)].filter(Boolean).map(esc).join(' · ') || 'Inscrição confirmada'}</small></span>${R.played ? '' : `<button data-act="tourleave" data-id="${t.id}">Sair</button>`}</div>`
              : canJoin
                ? `<button class="btn t-cta" data-act="tourform" data-v="1">${ic('trophy')}Quero jogar</button>`
                : ''
          }
          <div class="t-row">
            ${
              ses
                ? `<button class="btn t-ghost ${watching ? 'on' : ''}" data-act="tourwatch" data-id="${ses.id}" aria-pressed="${!!watching}">${ic(watching ? 'check' : 'cal')}${watching ? 'Na sua agenda' : 'Vou assistir'}</button>
            <button class="btn t-ghost" data-act="openmap" data-floor="${ses.floor}" data-zone="${ses.zone}">${ic('pin')}Como chegar</button>`
                : ''
            }
          </div>
        </div>`;
  const facts = `<dl class="t-facts st" ${st(1)}><div><dt>Quando</dt><dd>${dayOf(t.day).week} ${t.day}<small>${t.time}</small></dd></div><div><dt>Onde</dt><dd>${t.place.split(' · ')[0]}<small>${t.place.split(' · ')[1] || ''}</small></dd></div><div><dt>Chave</dt><dd>${8 - stt.free}/8<small>${stt.free ? `${stt.free} ${stt.free === 1 ? 'vaga' : 'vagas'}` : 'completa'}</small></dd></div></dl>`;
  return {
    dark: true,
    html: `<div class="tour ${t.theme}">
        <div class="tour-hero">${gameArt(t)}
          <header class="bar on-dark"><button class="iconbtn" data-act="back" aria-label="Voltar">${ic('back')}</button><span></span><span class="iconbtn ghost"></span></header>
          <div class="tour-title st" ${st(0)}>${tourChip(stt)}${titleOf(t)}<span class="tour-meta">${t.tagline} ${t.format}.</span></div>
        </div>
        ${facts}
        ${cta}
        <div class="tour-tabs st" style="--i:1;--k:${tabs.findIndex((x) => x[0] === tab)}"><i class="seg-ind"></i>${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-act="tourtab" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="tour-body">${body}</div>
      </div>`,
  };
};

/* ===== app/18-sobreposicoes.js ===== */
/* app/18-sobreposicoes.js · leitor de QR, boas-vindas, resultados da leitura e folhas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- overlays ---------------- */
/* Selo de confirmação: hexágono que estoura com favos coloridos. */
const HX_COLORS = ['#65b32e', '#d6332c', '#f2b230', '#8fdc5c', '#5d86dc'];
const hxBurst = (n = 14) =>
  `<span class="hx-burst" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="--a:${Math.round((i / n) * 360 + (i % 3) * 9)}deg;--d:${62 + ((i * 37) % 46)}px;--c:${HX_COLORS[i % 5]};--s:${(0.55 + ((i * 13) % 7) / 10).toFixed(2)};--t:${(i % 4) * 40}ms"></i>`).join('')}</span>`;
const hxBadge = (cls = '', inner = '<path class="hx-ck" d="M-17 1l11 11 23-24"/>') =>
  `<div class="hx-badge ${cls}"><i class="hx-ring"></i><i class="hx-ring r2"></i>${hxBurst()}<svg viewBox="-50 -50 100 100" aria-hidden="true"><path class="hx-bg" d="M0-44 38.100-22V22L0 44-38.100 22V-22Z"/>${inner}</svg></div>`;
const floorName = (f) => (f ? `${f}º andar` : 'Térreo');
const SPOTS = {
  recepcao: { name: 'Recepção', sign: 'Credenciamento', where: 'Térreo', icon: 'id', seed: 21 },
  'react-native': {
    get name() {
      return byId('react-native')?.room || 'Lab';
    },
    sign: 'React Native com Expo',
    where: '2º andar',
    icon: 'qr',
    seed: 34,
  }, // a sala segue a programação (o painel pode trocar)
  'saude-mental': { name: 'Auditório', sign: 'Saúde mental na era da IA', where: 'Térreo', icon: 'mic', seed: 47 },
  colega: { name: 'Colega', sign: 'Crachá de participante', where: 'Trocar contato', icon: 'contact', seed: 58 },
};
const placard = (k) => {
  const p = SPOTS[k];
  return `<div class="placard" data-k="${k}"><header>${mark('mark xs')}<b>${p.name}</b></header><div class="pl-qr">${qr(p.seed, 21)}</div><footer>${p.sign}</footer></div>`;
};
const scanHint = (k) => (k === 'recepcao' && !S.credAt ? 'Comece pelo QR da recepção' : 'Aponte para o QR');
const canDebugQr = () => (API ? !!D.person.org && !!window.ETAL_CONFIG?.demo : !!orgDe());
Overlays.scan = (mode = 'ler') => {
  const spot = S.credAt ? 'react-native' : 'recepcao';
  return `<div class="scanner" data-mode="${mode}">
      <div class="scan-view">
        <div class="scene"><svg class="scene-bg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dfe6"/><stop offset=".62" stop-color="#b9c1ca"/><stop offset=".62" stop-color="#7b8590"/><stop offset="1" stop-color="#59626d"/></linearGradient></defs><rect width="400" height="700" fill="url(#wl)"/><path d="M0 0 150 190V470L0 700Z" fill="#a6afb9"/><path d="M400 0 250 190V470L400 700Z" fill="#98a2ad"/><rect x="150" y="190" width="100" height="280" fill="#eef1f4"/><path d="M12 70 22 80V530L12 590Z M60 130 70 140V490L60 530Z" fill="#3a5a9b"/><path d="M388 70 378 80V530L388 590Z M340 130 330 140V490L340 530Z" fill="#4f6270"/><path d="M165 60h70l-8 40h-54Z M120 0h160l-20 30H140Z" fill="#fff"/></svg></div>
        <div class="placard-wrap">${placard(spot)}</div>
        <video class="scan-cam" playsinline muted aria-label="Imagem da câmera"></video><svg class="scan-track" aria-hidden="true"><polygon class="tk-poly"/><path class="tk-brk"/><g class="tk-ok"><g class="tk-okin"><circle r="24"/><path d="M-10 0l6 6 13-14"/></g></g></svg><span class="tk-tag" aria-hidden="true"></span>
        <div class="scan-mask"></div>
        <div class="frame"><i></i><i></i><i></i><i></i><span class="scanline"></span></div>
        <div class="torch-glow"></div>
        <div class="scan-top">
          <button class="round" data-act="closeov" aria-label="Fechar">${ic('x')}</button>
          <div class="scan-seg" style="--k:${mode === 'meu' ? 1 : 0}"><i></i><button data-act="scanmode" data-v="ler">Ler QR</button><button data-act="scanmode" data-v="meu">Meu QR</button></div>
          <button class="round" data-act="torch" aria-label="Lanterna" aria-pressed="false">${ic('flash')}</button>
        </div>
        <p class="scan-hint" aria-live="polite"><span>${scanHint(spot)}</span></p>
      </div>
      <div class="scan-dock cam-dock ${canDebugQr() ? 'with-debug' : ''}"><p id="camst">Aponte a câmera para o QR da sala ou da recepção.</p><button class="btn soft" data-act="camstart" hidden>Abrir a câmera</button></div>
      ${
        canDebugQr()
          ? `<details class="qr-debug"><summary>Debug · QR Codes</summary><div class="qr-debug-grid"><button type="button" data-act="simulate" data-q="recepcao">Credenciamento</button><button type="button" data-act="colega-teste"><b>Colega de teste</b><small>Crachá com perfil completo</small></button>${D.sessions
              .filter((x) => x.id !== 'credenciamento')
              .map(
                (x) =>
                  `<button type="button" data-act="simulate" data-q="${esc(x.id)}"><b>${esc(x.title)}</b><small>${esc(x.type)} · ${x.day}/11 ${x.time} · ${esc(x.room)}</small></button>`,
              )
              .join('')}</div></details>`
          : ''
      }
      <div class="myqr" aria-hidden="${mode !== 'meu'}">
        <div class="myqr-card">${meAv('av xl')}<strong>${esc(D.person.name)}</strong><span>${esc(D.person.course)}</span>${cardGet()?.publish ? `<em class="myqr-card-on">${ic('check')}Perfil público visível</em>` : ''}<div class="qrbox">${qr()}</div><small>Mostre para um colega trocar contato com você.</small></div>
      </div>
    </div>`;
};

Overlays.welcome = (c = null) => `<div class="wl">
      <div class="w-top">${hxBadge('big')}
        <p class="w-kick">Credenciamento</p>
        <h1>Participação confirmada</h1>
        <p class="w-sub">Boas-vindas ao ETAL, ${esc(D.person.first)}!</p>
      </div>
      <div class="w-ticket">
        <div class="wt-head">${meAv('av')}<span><b>${esc(D.person.name)}</b><small>${esc(D.person.course || '')}</small></span><span class="wt-ok">${ic('check')}Confirmado</span></div>
        <i class="wt-cut"></i>
        <dl class="wt-facts"><div><dt>Entrada</dt><dd>${S.credAt}</dd><small>Qua, 26 nov</small></div><div><dt>Local</dt><dd>Recepção</dd><small>Térreo</small></div><div><dt>Na agenda</dt><dd>${S.saved.size}</dd><small>atividades</small></div></dl>
        ${c ? combRow(c) : ''}
      </div>
      <div class="w-actions"><button class="btn big w-main" data-act="closeov" data-then="credential">${ic('id')}Ver credencial</button><button class="btn ghost" data-act="closeov">Continuar</button></div>
    </div>`;

/* Resultado da leitura: um cartão sobe por cima da câmera. */
function scanSheet(html) {
  const root = $('.scanner', ov);
  if (!root) return;
  $('.scan-res', root)?.remove();
  const d = document.createElement('div');
  d.className = 'scan-res';
  d.setAttribute('role', 'status');
  d.innerHTML = `<div class="sr-card"><i class="grab"></i>${html}</div>`;
  root.appendChild(d);
  root.classList.add('has-res');
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('in')));
}
function scanAgain() {
  const root = $('.scanner', ov);
  if (!root) return;
  const d = $('.scan-res', root);
  d?.classList.remove('in');
  root.classList.remove('has-res', 'is-locked');
  delete root.dataset.busy;
  trackReset();
  $('.scan-hint span', ov).textContent = 'Aponte para o QR';
  setTimeout(() => d?.remove(), 400);
  if (API && root.dataset.mode !== 'meu') setTimeout(camStart, 300);
}
/* Resultado da leitura por tipo de atividade. Regra: momento de destaque vai para a tela toda (credenciamento e
     check-in no campeonato); presença em aula, palestra e mesa-redonda é uma folha que sobe sobre a câmera, com a cor do
     tipo e a ação que importa ali (abrir a aula, perguntar ao palestrante, perguntar à mesa). Leitura repetida é curta. */
const KICK = {
  mini: 'Presença na aula',
  pal: 'Presença na palestra',
  mesa: 'Presença na mesa-redonda',
  camp: 'Check-in no campeonato',
  out: 'Presença registrada',
};
function roomResult(q, { again, first, c }) {
  const s = byId(q);
  const t = tipoDe(s);
  const hora = again ? `desde ${S.present[q]}` : `às ${S.present[q]}`;
  const hero = `<div class="sr-hero">${hxBadge(again ? 'muted' : `tp-${t.k}`)}<div><small class="sr-kick">${again ? 'Presença já registrada' : first ? 'Credenciado e presente' : KICK[t.g]}</small><h2>${esc(s.short)}</h2><p>${esc(s.room)} · ${floorName(s.floor)} · ${hora}</p></div></div>`;
  const outro = `<button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button>`;
  if (again)
    return `${hero}<div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="${q}">Abrir a atividade</button>${outro}</div>`;
  const mats = s.materials?.length
    ? `<li>${ic('file')}<span><b>${s.materials.length} ${s.materials.length === 1 ? 'material' : 'materiais'}</b><small>liberados agora</small></span></li>`
    : '';
  const corpo =
    {
      mini: `<ul class="sr-facts">${mats}<li>${ic('clock')}<span><b>até ${s.end}</b><small>${duracao(s)} de aula</small></span></li></ul>`,
      pal: `<div class="sr-quem">${spAv(s)}<span><b>${esc(s.speakerShort)}</b><small>${esc(s.role)}</small></span></div>${mats ? `<ul class="sr-facts">${mats}</ul>` : ''}`,
      mesa: `<div class="sr-quem"><span class="ses-rostos">${pessoasDe(s)
        .map((p) => spAv(p))
        .join(
          '',
        )}</span><span><b>${pessoasDe(s).length} na conversa</b><small>mediação de ${esc(s.speakerShort)}</small></span></div>`,
    }[t.g] || '';
  const acao =
    {
      mini: `<button class="btn primary big" data-act="scanopen" data-q="${q}">${ic('laptop')}Abrir a aula</button>`,
      pal: `<button class="btn primary big" data-act="scanask" data-q="${q}">${ic('chat')}Perguntar ao palestrante</button>`,
      mesa: `<button class="btn primary big" data-act="scanask" data-q="${q}">${ic('chat')}Perguntar à mesa</button>`,
    }[t.g] || `<button class="btn primary big" data-act="scanopen" data-q="${q}">Abrir a atividade</button>`;
  return `${hero}${corpo}${c ? combRow(c) : ''}<div class="sr-actions">${acao}${outro}</div>`;
}
/* Campeonato: tela toda com a arte do jogo; diz se a pessoa está na chave (e contra quem joga) ou na torcida. */
Overlays.jogo = (s, c) => {
  const t = D.tournaments.find((x) => x.id === s.tournament);
  const stt = tourSt(t);
  const i = tourMine(stt);
  const me = i >= 0;
  const adv = me ? stt.players[i ^ 1] : null;
  const hora = me ? (t.times || [])[Math.floor(i / 2)] || t.time : null;
  const linha = me
    ? adv
      ? `Sua partida: ${hora}, contra ${esc(adv[0])}`
      : `Você está na chave · ${hora}`
    : stt.open && stt.free
      ? `Você está na torcida. Ainda há ${stt.free} ${stt.free === 1 ? 'vaga' : 'vagas'} na chave.`
      : 'Você está na torcida.';
  const botao = me ? 'Ver a chave' : stt.open && stt.free ? 'Quero jogar' : 'Ver a chave';
  return `<div class="jogo ${t.theme}">${gameArt(t)}
      <div class="jg-top">${hxBadge('big tp-camp')}<p class="jg-kick">Check-in feito</p>${titleOf(t, 'jg-logo')}<p class="jg-sub">${linha}</p></div>
      <dl class="jg-facts"><div><dt>Sala</dt><dd>${esc(s.room)}</dd></div><div><dt>Formato</dt><dd>${esc(t.format.split(' · ')[0])}</dd></div><div><dt>Chave</dt><dd>${8 - stt.free}/8</dd></div></dl>
      ${c ? `<div class="jg-comb">${combRow(c)}</div>` : ''}
      <div class="w-actions"><button class="btn big w-main" data-act="closeov" data-then="tournament" data-then-id="${t.id}">${ic('trophy')}${botao}</button><button class="btn ghost" data-act="closeov">Continuar</button></div>
    </div>`;
};
function peerResult(p, { again, c }) {
  if (p.card)
    return `<small class="sr-kick sr-kick-card">${again ? 'Vocês já são contatos' : 'Contato adicionado'}</small><div class="sr-peer-card">${cardPreview(p.card, p, { own: false })}</div>
      ${c ? combRow(c) : ''}
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="colega">Ver meus contatos</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
  return `<div class="sr-hero"><span class="sr-peer"><b>${esc(p.initials)}</b><i>${ic('check')}</i></span><div><small class="sr-kick">${again ? 'Vocês já são contatos' : 'Contato adicionado'}</small><h2>${esc(p.name)}</h2><p>${esc(p.course)}</p></div></div>
      <div class="sr-tags"><span>${ic('star')}Interesse em ${esc(p.interest)}</span>${p.nadic ? `<span>${ic('flag')}Bolsista do NADIC</span>` : ''}${(p.langs || []).map((l) => `<span>${ic('code')}${esc(l)}</span>`).join('')}<span>${ic('contact')}Contato trocado agora</span></div>
      ${c ? combRow(c) : ''}
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="colega">Ver meus contatos</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
}
function credResult() {
  return `<div class="sr-hero">${hxBadge('muted')}<div><small class="sr-kick">Tudo certo</small><h2>Você já está credenciado</h2><p>Entrada às ${S.credAt} na recepção</p></div></div>
      <div class="sr-actions"><button class="btn primary big" data-act="scanopen" data-q="credential">Ver credencial</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
}

Overlays.share = (id) => {
  const s = byId(id);
  return `<div class="sheet" role="dialog" aria-label="Abrir no computador"><i class="grab"></i>
      <h2>Abrir no computador</h2>
      <p class="sh-p">Digite este endereço no navegador do computador para ver todos os materiais da aula.</p>
      <div class="shortlink"><b>${s.link}</b><button class="btn soft sm" data-act="copy" data-text="https://${s.link}">${ic('copy')}<span>Copiar</span></button></div>
      <div class="share-row"><button data-act="toast" data-msg="Link enviado para o seu e-mail">${ic('laptop')}<span>Por e-mail</span></button><button data-act="toast" data-msg="Compartilhando">${ic('share')}<span>Compartilhar</span></button></div>
    </div>`;
};

Overlays.ask = (id) => `<form class="sheet" data-form="ask" data-id="${id}"><i class="grab"></i><h2>Sua pergunta</h2>
      <label class="sr" for="qtext">Escreva a pergunta</label><textarea id="qtext" rows="3" maxlength="180" placeholder="O que você quer perguntar para ${byId(id).speakerShort}?" required></textarea>
      <button class="btn primary big" type="submit">Enviar pergunta</button></form>`;

/* ===== app/19-navegacao.js ===== */
/* app/19-navegacao.js · navegação: histórico, telas, abas, toasts e notificações.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- motor de navegação ---------------- */
const vp = $('#viewport');
const tabbar = $('#tabbar');
const ov = $('#overlay');
const device = $('#device');
let busy = false;

/* Botão de voltar do celular: cada navegação entra no histórico do navegador. */
const navUndo = [];
let navSkip = 0;
const navQueue = [];
const navState = (n) => {
  try {
    history.pushState({ etal: n }, '');
  } catch (_) {
    /* opcional */
  }
};
function navPush(undo, tag) {
  if (navSkip) {
    navQueue.push([undo, tag]);
    return;
  }
  navUndo.push({ undo, tag });
  navState(navUndo.length);
}
const navTag = () => navUndo[navUndo.length - 1]?.tag;
/* Fechou pela tela: tira a entrada sem desfazer de novo. */
function navDrop() {
  if (!navUndo.length) return;
  navUndo.pop();
  navSkip += 1;
  try {
    history.back();
  } catch (_) {
    navSkip -= 1;
  }
}
function navBack() {
  if (navUndo.length) history.back();
}
window.addEventListener('popstate', (e) => {
  if (navSkip) {
    navSkip -= 1;
    if (!navSkip) {
      const q = navQueue.splice(0);
      q.forEach(([u, t]) => navPush(u, t));
    }
    return;
  }
  const target = (e.state && e.state.etal) || 0;
  while (navUndo.length > target) navUndo.pop().undo();
});
const snapStacks = () => Object.fromEntries(Object.entries(S.stacks).map(([k, v]) => [k, v.slice()]));
function snapshot() {
  const cur = vp.querySelector('.page:not(.leaving)');
  return {
    tab: S.tab,
    stacks: snapStacks(),
    scroll: cur ? cur.scrollTop : 0,
    mapView: S.mapView,
    mapFloor: S.mapFloor,
    mapZone: S.mapZone,
    mapRoute: S.mapRoute,
    campusPlace: S.campusPlace,
  };
}
function restore(sn) {
  const sameTab = sn.tab === S.tab;
  const before = top();
  Object.assign(S, {
    tab: sn.tab,
    stacks: sn.stacks,
    mapView: sn.mapView,
    mapFloor: sn.mapFloor,
    mapZone: sn.mapZone,
    mapRoute: sn.mapRoute,
    campusPlace: sn.campusPlace,
    pending: false,
    journeying: false,
    mapSync: true,
  });
  window.Campus3D.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
  window.Campus3D.clearRoute();
  busy = false;
  const after = top();
  if (sameTab && before === after) {
    rerender();
  } else {
    show(build(after), sameTab ? 'pop' : 'fade');
  }
  const cur = vp.querySelector('.page:not(.leaving)');
  if (cur) cur.scrollTop = sn.scroll;
}
/* Marca o ponto atual: voltar retorna exatamente para cá. */
function navMark(tag) {
  const sn = snapshot();
  navPush(() => restore(sn), tag);
}

function build(entry) {
  checkCombs();
  const out = Screens[entry.s](entry.p || {});
  const el = document.createElement('section');
  el.className = 'page';
  el.innerHTML = out.html;
  el._mount = (page) => {
    mountGalleries(page);
    out.mount?.(page);
  };
  el._dark = !!out.dark;
  el._chrome = out.chrome !== false;
  el._navy = !!out.navy;
  el._sky = !!out.sky;
  return el;
}
function setChrome(el) {
  device.classList.toggle('dark-status', el._dark);
  device.classList.toggle('no-chrome', !el._chrome);
  device.classList.toggle('navy-status', el._navy);
  device.classList.toggle('sky-status', el._sky);
  if (!el._sky) device.classList.remove('sky-past');
  renderTabbar();
  mapaFixoVer(el);
}
function show(el, mode) {
  const old = vp.querySelector('.page:not(.leaving)');
  vp.appendChild(el);
  setChrome(el);
  if (el._mount) el._mount(el);
  if (!old) {
    el.classList.add('in-fade');
    return;
  }
  if (reduce || mode === 'none') {
    old.remove();
    return;
  }
  busy = true;
  old.classList.add('leaving', `out-${mode}`);
  el.classList.add(`in-${mode}`);
  const done = () => {
    old.remove();
    el.classList.remove(`in-${mode}`);
    busy = false;
  };
  setTimeout(done, mode === 'fade' ? 260 : 420);
}
const top = () => S.stacks[S.tab][S.stacks[S.tab].length - 1];
function push(s, p) {
  if (busy) return;
  navMark('screen');
  S.stacks[S.tab].push({ s, p });
  show(build(top()), 'push');
}
function rerender() {
  const cur = vp.querySelector('.page:not(.leaving)');
  const sc = cur ? cur.scrollTop : 0;
  const el = build(top());
  el.classList.add('still');
  if (cur) cur.replaceWith(el);
  else vp.appendChild(el);
  el.scrollTop = sc;
  setChrome(el);
  if (el._mount) el._mount(el);
}
/* Entre atividades: se uma atividade sua começa em até 10 minutos, o mapa já abre com a rota até a sala.
     Uma vez por atividade; a primeira visita ao mapa (a entrada completa) tem prioridade. */
const soonSeen = new Set();
function soonRoute() {
  if (mapIntro === 'full') return false;
  const now = Math.round(skyHour * 60);
  const x = D.sessions
    .filter((q) => D.enrolled.includes(q.id) && q.day === D.now.day && q.floor !== undefined && !soonSeen.has(q.id))
    .map((q) => ({ q, left: toMin(q.time) - now }))
    .filter((o) => o.left >= 0 && o.left <= 10)
    .sort((a, b) => a.left - b.left)[0];
  if (!x) return false;
  soonSeen.add(x.q.id);
  const w = walkMin(x.q);
  S.mapView = 'bloco';
  S.mapFloor = x.q.floor;
  S.mapZone = x.q.zone;
  S.mapRoute = true;
  S.pending = true;
  S.journeying = true;
  switchTab('map', true);
  toast(`${x.q.short}: começa ${x.left ? `em ${x.left} min` : 'agora'}${w ? ` · ${w} min a pé` : ''}`);
  return true;
}
function switchTab(t, reset = false) {
  if (busy) return;
  if (t !== S.tab || reset || S.stacks[t].length > 1) navMark('tab');
  if (reset) S.stacks[t] = [S.stacks[t][0]];
  if (t === S.tab && !reset) {
    if (S.stacks[t].length > 1) {
      S.stacks[t] = [S.stacks[t][0]];
      show(build(top()), 'pop');
    }
    return;
  }
  S.tab = t;
  show(build(top()), 'fade');
}
function renderTabbar() {
  const tabs = [
    ['home', 'home', 'Início'],
    ['agenda', 'cal', 'Programação'],
    null,
    ['map', 'map', 'Mapa'],
    ['community', 'image', 'Publicações'],
  ];
  tabbar.innerHTML = tabs
    .map((t) =>
      t
        ? `<button class="${S.tab === t[0] ? 'on' : ''}" data-act="tab" data-tab="${t[0]}">${ic(t[1])}<span>${t[2]}</span></button>`
        : `<button class="qrbtn" data-act="scan" aria-label="Ler QR">${ic('qr')}</button>`,
    )
    .join('');
}

let ovNav = false;
function openOverlay(html, kind) {
  if (!ovNav) {
    ovNav = true;
    navPush(() => closeOverlay(null, true), 'overlay');
  }
  ov.innerHTML = `<div class="ov-backdrop" data-act="closeov"></div><div class="ov-panel ${kind}">${html}</div>`;
  ov.className = 'overlay ' + kind;
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
  device.classList.toggle('ov-dark', kind === 'scan');
  device.classList.toggle('ov-retro', kind === 'retro');
  device.classList.toggle('ov-navy', kind === 'welcome');
  device.classList.toggle('ov-dim', kind === 'share' || kind === 'ask' || kind === 'finder');
}
function closeOverlay(then, fromHistory = false) {
  camStop();
  kbTrack(false);
  if (ovNav) {
    ovNav = false;
    if (!fromHistory) navDrop();
  }
  ov.classList.remove('open');
  device.classList.remove('ov-dark', 'ov-light', 'ov-navy', 'ov-dim', 'ov-retro');
  if (retro) {
    clearTimeout(retro.t);
    retro = null;
  }
  setTimeout(
    () => {
      ov.innerHTML = '';
      ov.className = 'overlay';
      if (then) then();
    },
    reduce ? 0 : 380,
  );
}

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

let pushT;
function notify(title, text, id) {
  const n = $('#notif');
  n.innerHTML = `${mark('mark xs')}<span><b>${esc(title)}</b><small>${esc(text)}</small></span><time>agora</time>`;
  if (id && S.auth) {
    n.dataset.go = 'activity';
    n.dataset.id = id;
  } else {
    delete n.dataset.go;
    delete n.dataset.id;
  }
  n.classList.add('show');
  buzz(30);
  clearTimeout(pushT);
  pushT = setTimeout(() => n.classList.remove('show'), 4200);
}

/* ===== app/20-lembretes.js ===== */
/* app/20-lembretes.js · lembretes antes das atividades.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- lembretes ----------------
     O relógio do evento é o mesmo do "Horário do céu". Dez minutos antes de uma atividade com lembrete,
     o app avisa com a sala, o andar e o tempo a pé calculado pela rota do mapa. Com permissão,
     o aviso também sai como notificação do sistema, que abre a atividade. */
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const remFired = new Set();
const notifState = () => ('Notification' in window ? Notification.permission : 'unsupported');
async function askNotify() {
  if (notifState() !== 'default') return notifState();
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return 'denied';
  }
}
function walkMin(x) {
  if (x.floor === undefined) return null;
  try {
    return Math.max(1, Math.round(window.Campus3D.routeInfo(x.floor, x.zone).cost / 75));
  } catch (_) {
    return null;
  }
}
function reminderText(x, test) {
  const left = toMin(x.time) - Math.round(skyHour * 60);
  const w = walkMin(x);
  const title =
    test || left > LEAD || left < 0
      ? `Começa às ${x.time}: ${x.short}`
      : left
        ? `Começa em ${left} min: ${x.short}`
        : `Começando agora: ${x.short}`;
  return { title, body: [whereOf(x), w ? `${w} min a pé da entrada` : ''].filter(Boolean).join(' · ') };
}
async function deliver(x, test) {
  if (!x) return;
  const { title, body } = reminderText(x, test);
  notify(title, body, x.id);
  if (notifState() !== 'granted') return;
  const opts = {
    body,
    icon: 'assets/pwa/icon-192.png',
    badge: 'assets/pwa/icon-192.png',
    tag: `lembrete-${x.id}`,
    data: { id: x.id },
    vibrate: [60, 40, 60],
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch (_) {
    /* o aviso dentro do app já foi mostrado */
  }
}
function checkReminders() {
  const now = Math.round(skyHour * 60);
  S.reminders.forEach((id) => {
    const x = byId(id);
    if (!x || x.day !== D.now.day || remFired.has(id)) return;
    if (now >= toMin(x.time) - LEAD && now < toMin(x.time)) {
      remFired.add(id);
      deliver(x);
    }
  });
}
function openActivity(id) {
  if (!S.auth || !byId(id)) return;
  if (ov.classList.contains('open')) closeOverlay();
  if (S.tab !== 'home') {
    S.tab = 'home';
    S.stacks.home = [{ s: 'home' }];
    show(build(top()), 'fade');
  }
  push('activity', { id });
}

/* ===== app/21-pwa.js ===== */
/* app/21-pwa.js · app instalável e uso sem internet.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- app instalável e sem internet ----------------
     O service worker (sw.js) guarda o app no aparelho. Só funciona em HTTPS ou no próprio computador. */
const PWA = { prompt: null, waiting: null, updating: false, ready: false, version: null };
const swAllowed =
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));
if (swAllowed) {
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      const watch = (w) =>
        w &&
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            PWA.waiting = w;
            offerUpdate();
          }
        });
      if (reg.waiting && navigator.serviceWorker.controller) {
        PWA.waiting = reg.waiting;
        offerUpdate();
      }
      reg.addEventListener('updatefound', () => watch(reg.installing));
      if (reg.active) {
        PWA.ready = true;
        netState();
      }
    })
    .catch(() => {
      /* sem service worker, o app segue online */
    });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'ready') {
      PWA.ready = true;
      PWA.version = e.data.version;
      if (!prefs.get('etal-offline')) {
        prefs.set('etal-offline', '1');
        toast('Pronto para usar sem internet');
      }
    }
    if (e.data?.type === 'open') openActivity(e.data.id);
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (PWA.updating) location.reload();
  });
}
function offerUpdate() {
  const b = $('#upd');
  if (!b) return;
  b.innerHTML = `<span><b>Nova versão do app</b><small>As mudanças entram ao atualizar.</small></span><button data-act="update">Atualizar</button>`;
  b.classList.add('show');
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  PWA.prompt = e;
  if (S.auth && (S.tab === 'profile' || S.tab === 'home')) rerender();
});
window.addEventListener('appinstalled', () => {
  PWA.prompt = null;
  toast('ETAL Connect instalado');
});
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
async function installApp() {
  if (PWA.prompt) {
    PWA.prompt.prompt();
    const r = await PWA.prompt.userChoice.catch(() => null);
    PWA.prompt = null;
    if (r?.outcome !== 'accepted') toast('Instalação cancelada');
    else askNotify();
    rerender();
    return;
  }
  if (isIOS()) {
    notify('Instalar no iPhone', 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".');
    return;
  }
  notify(
    'Instalar o app',
    swAllowed
      ? 'Abra o menu do navegador e toque em "Instalar app".'
      : 'A instalação precisa de HTTPS. Pelo Wi-Fi local, o app abre só no navegador.',
  );
}
/* Sem internet: o app avisa e segue com a cópia guardada. */
function netState() {
  const bar = $('#netbar');
  if (!bar) return;
  if (navigator.onLine) {
    if (bar.classList.contains('show')) {
      bar.textContent = 'Conexão de volta';
      bar.classList.add('ok');
      setTimeout(() => bar.classList.remove('show', 'ok'), 1600);
    }
    return;
  }
  bar.classList.remove('ok');
  const n = S.auth && API ? pendentes().length : 0;
  bar.textContent =
    (PWA.ready ? 'Sem internet · usando a cópia salva no aparelho' : 'Sem internet') +
    (n ? ` · ${n} ${n === 1 ? 'leitura' : 'leituras'} para enviar` : '');
  bar.classList.add('show');
}
window.addEventListener('online', netState);
window.addEventListener('offline', netState);

function applyProfile(p) {
  Object.assign(D.person, p, { officialName: p.officialName || p.name }, profileLocal(p.id));
}
/* Troca entre IFRN e visitante sem refazer o crachá. */
function lgSwap(mode) {
  S.lgMode = mode;
  const lg = $('.login');
  if (!lg) return;
  lg.classList.toggle('guest-mode', mode === 'guest');
  lg.querySelectorAll('[data-act="lgmode"]').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.v === (mode || 'suap'))),
  );
  const box = $('.lx-form', lg);
  box.innerHTML = mode === 'guest' ? guestFields() : suapFields();
  box.classList.remove('swap');
  void box.offsetWidth;
  box.classList.add('swap');
  $('[data-live="name"]', lg).textContent = 'Seu nome';
  $('[data-live="sub"]', lg).textContent = mode === 'guest' ? 'Visitante' : 'Matrícula do SUAP';
  lg.querySelectorAll('.typed').forEach((n) => n.classList.remove('typed'));
  lgPhys?.kick(0, 0, 0.5, 900);
}
function navReset() {
  const n = navUndo.length;
  navUndo.length = 0;
  if (n) {
    navSkip += 1;
    history.go(-n);
  }
}

/* ===== app/22-campus.js ===== */
/* app/22-campus.js · campus: lugares, salas e rotas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- campus ---------------- */
let mapCanvas = null;
/* O mesmo canvas é reaproveitado entre as telas, para não recriar memória de vídeo. */
function useMapCanvas(page) {
  const ph = $('canvas.campus3d', page);
  if (!ph) return null;
  if (!mapCanvas) mapCanvas = ph;
  else {
    mapCanvas.setAttribute('aria-label', ph.getAttribute('aria-label'));
    ph.replaceWith(mapCanvas);
  }
  return mapCanvas;
}
/* Modelo novo em uma superfície isolada: o app conserva atividade, scroll e câmera. */
function abrirMapaNovo(floor, zone, fallback) {
  /* Só com o mapa novo escolhido (padrão); com o clássico, "Como chegar" usa o mapa Canvas. */
  if (UI.view === '2d' || !mapaNovoOn()) return false;
  /* tela grande: a rota vai para o mapa ao lado, sem abrir outra janela por cima do app */
  if (palcoOn()) {
    palcoEnviar({ floor, zone, via: S.mapVia || null });
    toast('Caminho traçado no mapa ao lado');
    return true;
  }
  /* usa o mesmo mapa da aba Mapa (já carregado), com a rota pedida; antes abria outro mapa por cima, montado do zero */
  S.mapFloor = floor;
  S.mapZone = zone;
  S.mapRoute = true;
  switchTab('map', true);
  return true;
}
function runJourney() {
  const C = window.Campus3D;
  const [lvl, zone] = [S.mapFloor, S.mapZone];
  S.journeying = true;
  C.journey(lvl, zone, { via: S.mapVia }).then(() => {
    if (!S.journeying || S.mapFloor !== lvl || S.mapZone !== zone) return;
    S.journeying = false;
    rerender();
    C.reframe(lvl, zone);
  });
}
function mountCampus(page) {
  const cv = useMapCanvas(page);
  if (!cv) return;
  const C = window.Campus3D;
  startHud(page);
  C.attach(cv, {
    onQuality: (t) => {
      rerender();
      if (t === 'simples') toast('Mapa em 2D para ficar mais fluido');
    },
    top: 8,
    bottom: ($('.map-dock', page)?.offsetHeight || 0) + ($('.sheet-card', page)?.offsetHeight || 0),
    skipGrow: S.pending,
    onPick: (id) => {
      if (id === S.campusPlace) return;
      if (id) navMark('place');
      S.campusPlace = id;
      C.select(id);
      rerender();
      if (id) C.focus(id);
    },
    onFloor: (l) => {
      navMark('floor');
      S.mapFloor = l;
      S.mapZone = null;
      S.mapRoute = false;
      rerender();
      C.goFloor(l);
    },
    onRoom: (l, id) => {
      if (id) navMark('room');
      S.mapZone = id;
      S.mapRoute = false;
      rerender();
      C.room(l, id);
    },
  });
  if (S.mapView !== 'bloco' && mapIntro) {
    const kind = mapIntro;
    mapIntro = null;
    C.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
    if (kind === 'short' && mapSaved.cam) C.setView(mapSaved.cam);
    if (kind === 'full') {
      /* A entrada é sempre em 3D: o botão 3D/2D acompanha na hora. */
      const dim = $('.dim', page);
      if (dim) {
        dim.style.setProperty('--k', 0);
        dim.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v !== '2d'));
      }
    }
    C.intro(kind).then(async () => {
      if (kind === 'full' && S.tab === 'map' && S.mapView === 'campus' && !S.campusPlace) {
        /* As abas acompanham a revelação na hora; a folha do evento entra no fim. */
        S.mapView = 'evento';
        const seg = $('.map-dock .seg[style*="--k"]:not(.four)', page) || $('.map-dock .seg', page);
        if (seg) {
          seg.style.setProperty(
            '--k',
            MAP_TABS.findIndex(([v]) => v === 'evento'),
          );
          seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === 'evento'));
        }
        await C.eventReveal();
        if (S.tab === 'map') rerender();
      }
      saveMap();
    });
    return;
  }
  if (S.mapView !== 'bloco') {
    const changed = C.setMode(S.mapView === 'campus' ? 'campus' : 'evento');
    const sync = S.mapSync;
    S.mapSync = false;
    if (C.inStack()) C.toCampus();
    else if (changed || (sync && !S.campusPlace)) C.fitAll();
    C.select(S.campusPlace);
    if (sync && S.campusPlace) C.focus(S.campusPlace);
    return;
  }
  if (S.mapSync) {
    S.mapSync = false;
    if (S.mapFloor === null) C.openStack();
    else if (S.mapZone) C.room(S.mapFloor, S.mapZone);
    else C.goFloor(S.mapFloor);
  } else if (S.pending) {
    S.pending = false;
    runJourney();
  } else if (!C.inStack()) {
    if (S.mapFloor === null && (C.isFlat() || !C.canUse3D())) {
      S.mapFloor = 0;
      rerender();
      return;
    }
    if (S.mapFloor === null) C.openStack();
    else C.goFloor(S.mapFloor);
  }
}

/* ===== app/23-busca.js ===== */
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

/* ===== app/24-leitor-qr.js ===== */
/* app/24-leitor-qr.js · leitura dos QR Codes e câmera.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- ações ---------------- */
let peerForce = null;
function scanResult(q) {
  const root = $('.scanner', ov);
  if (!root || root.dataset.busy) return;
  root.dataset.busy = '1';
  root.dataset.mode = 'ler';
  $('.scan-seg', ov).style.setProperty('--k', 0);
  const hint = $('.scan-hint span', ov);
  const wrap = $('.placard-wrap', ov);
  /* 1. a câmera move até o QR; 2. a linha lê; 3. os cantos travam e o aparelho vibra. */
  if (wrap.firstElementChild.dataset.k !== q) {
    wrap.classList.add('moving');
    setTimeout(
      () => {
        wrap.innerHTML = placard(q);
        wrap.classList.remove('moving');
      },
      reduce ? 0 : 240,
    );
  }
  hint.textContent = 'Lendo…';
  root.classList.add('reading');
  setTimeout(
    () => {
      root.classList.remove('reading');
      root.classList.add('is-locked');
      buzz([18, 40, 18]);
      hint.innerHTML = `${ic('check')}${SPOTS[q].name} reconhecido`;
    },
    reduce ? 20 : 950,
  );
  setTimeout(
    () => {
      if (q === 'colega') {
        const peer = peerForce || D.peers[S.contacts.length % D.peers.length];
        peerForce = null;
        const again = S.contacts.includes(peer);
        if (!again) S.contacts.unshift(peer);
        const c = takeNewComb();
        scanSheet(peerResult(peer, { again, c }));
        return;
      }
      if (q === 'recepcao') {
        if (S.credAt) {
          scanSheet(credResult());
          return;
        }
        S.credAt = D.now.time;
        const c = takeNewComb();
        rerender();
        openOverlay(Overlays.welcome(c), 'welcome');
        return;
      }
      const first = !S.credAt;
      if (first) S.credAt = D.now.time;
      const again = !!S.present[q];
      if (!again) S.present[q] = D.now.time;
      communityCheckin(q);
      const c = takeNewComb();
      rerender();
      if (!again && tipoDe(byId(q) || {}).g === 'camp' && byId(q)?.tournament) {
        openOverlay(Overlays.jogo(byId(q), c), 'welcome');
        return;
      }
      scanSheet(roomResult(q, { again, first, c }));
    },
    reduce ? 60 : 1500,
  );
}
/* Saída do cartão de resultado para a tela certa. */
function scanOpen(q) {
  closeOverlay(() => {
    if (q === 'colega') {
      if (top().s === 'network') rerender();
      else push('network');
      return;
    }
    if (q === 'credential') {
      push('credential');
      return;
    }
    if (S.tab !== 'home' && S.tab !== 'agenda') {
      S.tab = 'home';
      S.stacks.home = [{ s: 'home' }];
      show(build(top()), 'none');
    }
    const t = top();
    if (t.s === 'activity' && t.p && t.p.id === q) rerender();
    else push('activity', { id: q });
  });
}

/* ===== app/25-acoes-agenda.js ===== */
/* app/25-acoes-agenda.js · ações de agenda.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['agendaLugar'] = (el, e, a) => {
  S.agendaLugar = null;
  rerender();
};

ACOES['day'] = (el, e, a) => {
  S.agendaDay = +el.dataset.day;
  rerender();
  vp.querySelector('.page .agenda-list')?.classList.add('swap');
};

ACOES['filter'] = (el, e, a) => {
  S.agendaFilter = el.dataset.f;
  rerender();
  vp.querySelector('.page .agenda-list')?.classList.add('swap');
};

ACOES['today'] = (el, e, a) => {
  S.todayOpen = !S.todayOpen;
  el.setAttribute('aria-expanded', S.todayOpen);
  el.closest('.today').classList.toggle('open', S.todayOpen);
};

/* "Programação" (atalho da home e aba de baixo) é sempre a lista completa; "Minha agenda" é o filtro de "Ver tudo" */
ACOES['programacao'] = (el, e, a) => {
  S.agendaFilter = 'all';
  switchTab('agenda', true);
};

/* ===== app/25-acoes-atividade.js ===== */
/* app/25-acoes-atividade.js · ações de atividade.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['mat-abrir'] = (el, e, a) => {
  matAbrir({ url: el.dataset.url, kind: el.dataset.kind, name: el.dataset.name, meta: el.dataset.meta });
};

ACOES['mv-clone'] = (el, e, a) => {
  navigator.clipboard?.writeText(`git clone ${el.dataset.url}`).then(
    () => toast('Comando copiado'),
    () => toast(`git clone ${el.dataset.url}`),
  );
};

ACOES['lermais'] = (el, e, a) => {
  el.classList.toggle('clamp');
};

ACOES['vote'] = (el, e, a) => {
  const k = el.dataset.q;
  if (S.votes.has(k)) S.votes.delete(k);
  else S.votes.add(k);
  rerender();
};

ACOES['ask'] = (el, e, a) => {
  openOverlay(Overlays.ask(el.dataset.id), 'ask');
  setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
};

ACOES['rate'] = (el, e, a) => {
  S.ratings[el.dataset.id] = +el.dataset.n;
  rerender();
  toast('Avaliação enviada');
};

ACOES['save'] = (el, e, a) => {
  const id = el.dataset.id;
  if (comInscricao(byId(id))) {
    toast('A inscrição em minicurso é feita no SUAP');
    return;
  }
  if (API && S.auth)
    API[S.saved.has(id) ? 'del' : 'post'](`/api/eu/agenda/${encodeURIComponent(id)}`).catch((x) => {
      toast(x.message);
      if (S.saved.has(id)) S.saved.delete(id);
      else S.saved.add(id);
      rerender();
    });
  if (S.saved.has(id)) {
    S.saved.delete(id);
    toast('Removida dos salvos');
  } else {
    S.saved.add(id);
    const x = byId(id);
    const clash = D.sessions.some((o) => o.id !== id && S.saved.has(o.id) && o.day === x.day && o.time === x.time);
    toast(clash ? 'Salva. Há outra atividade neste horário' : 'Salva na sua agenda');
  }
  rerender();
};

/* ===== app/25-acoes-busca.js ===== */
/* app/25-acoes-busca.js · ações de busca.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['finder'] = (el, e, a) => {
  S.finderMode = null;
  openOverlay(Overlays.finder(), 'finder');
  kbTrack(true);
  setTimeout(() => $('#fq')?.focus({ preventScroll: true }), 480);
};

ACOES['finderq'] = (el, e, a) => {
  const i = $('#fq');
  if (i) {
    i.value = el.dataset.q;
    S.finderMode = null;
    finderRender();
  }
};

ACOES['finderacts'] = (el, e, a) => {
  const i = $('#fq');
  S.finderMode = S.finderMode === 'acts' ? null : 'acts';
  if (i && S.finderMode) i.value = '';
  finderRender();
  if (S.finderMode) i?.blur();
};

ACOES['findergo'] = (el, e, a) => {
  if (e.target.closest('.fd-route') && el !== e.target.closest('.fd-route')) return;
  const d = { ...el.dataset };
  if (d.k === 'act' && d.route) {
    const x = byId(d.id);
    if (x && x.floor !== undefined && x.floor !== null) Object.assign(d, { k: 'room', floor: x.floor, zone: x.zone });
  }
  closeOverlay(() => {
    if (d.k === 'act') {
      openActivity(d.id);
      return;
    }
    if (d.k === 'place' && d.route) {
      S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
      window.Campus3D.setMode(S.mapView);
      S.campusPlace = d.id;
      window.Campus3D.select(d.id);
      switchTab('map', true);
      setTimeout(
        () => {
          if (window.Campus3D.hasRoute(d.id)) window.Campus3D.route(d.id);
          else window.Campus3D.focus(d.id);
          rerender();
        },
        reduce ? 0 : 700,
      );
      return;
    }
    if (d.k === 'poi') {
      S.mapView = 'campus';
      S.campusPlace = null;
      window.Campus3D.setMode('campus');
      window.Campus3D.select(null);
      switchTab('map', true);
      setTimeout(
        () =>
          d.route && window.Campus3D.hasRoute(d.id) ? window.Campus3D.route(d.id) : window.Campus3D.focusPoi(d.id),
        reduce ? 0 : 700,
      );
      return;
    }
    if (d.k === 'place') {
      S.mapView = EVENT_PLACES.includes(d.id) ? 'evento' : 'campus';
      window.Campus3D.setMode(S.mapView);
      S.campusPlace = d.id;
      window.Campus3D.select(d.id);
      switchTab('map', true);
      setTimeout(() => window.Campus3D.focus(d.id), reduce ? 0 : 950);
      return;
    }
    S.mapView = 'bloco';
    S.mapFloor = +d.floor;
    S.mapZone = d.zone;
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
    switchTab('map', true);
  });
};

/* ===== app/25-acoes-campeonatos.js ===== */
/* app/25-acoes-campeonatos.js · ações de campeonatos.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['tourtab'] = (el, e, a) => {
  S.tourTab = el.dataset.k;
  rerender();
};

ACOES['tourround'] = (el, e, a) => {
  S.tourRound = el.dataset.k;
  rerender();
};

ACOES['tourform'] = (el, e, a) => {
  S.tourForm = el.dataset.v === '1' ? S.tourForm || {} : null;
  rerender();
};

ACOES['tourpick'] = (el, e, a) => {
  const nick = el.closest('form')?.querySelector('[name=nick]')?.value;
  S.tourForm = {
    ...(S.tourForm || {}),
    nick,
    [el.dataset.k]: el.dataset.k === 'level' ? +el.dataset.v : el.dataset.v,
  };
  rerender();
};

ACOES['tourleave'] = (el, e, a) => {
  const t = D.tournaments.find((x) => x.id === el.dataset.id);
  orgWrite((o) => {
    const stt = window.TOUR.state(t, o);
    const i = stt.players.findIndex((p) => p && p[4] === D.person.id);
    if (i < 0) return;
    stt.players[i] = null;
    o.torneios = { ...(o.torneios || {}), [t.id]: { ...((o.torneios || {})[t.id] || {}), players: stt.players } };
  });
  toast('Você saiu da chave');
  rerender();
};

ACOES['tourwatch'] = (el, e, a) => {
  const id = el.dataset.id;
  if (S.saved.has(id)) S.saved.delete(id);
  else S.saved.add(id);
  toast(S.saved.has(id) ? 'Adicionado à sua agenda' : 'Removido da sua agenda');
  rerender();
};

/* ===== app/25-acoes-comunidade.js ===== */
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

/* ===== app/25-acoes-entrada.js ===== */
/* app/25-acoes-entrada.js · ações de entrada.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['suapoauth'] = (el, e, a) => {
  el.classList.add('loading');
  location.href = API.url('/api/auth/suap');
};

ACOES['lgmode'] = (el, e, a) => {
  if ((el.dataset.v === 'guest') !== (S.lgMode === 'guest')) lgSwap(el.dataset.v === 'guest' ? 'guest' : null);
};

ACOES['lgenter'] = (el, e, a) => {
  lgOpenApp();
};

ACOES['lgredo'] = (el, e, a) => {
  lgPhys?.disarm?.();
  lgPending = null;
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  Object.assign(D.person, DEMO_PERSON);
  store.del(SAVE_KEY);
  $('.lx-card', $('.login'))?.setAttribute('aria-hidden', 'true');
  $('.login')?.classList.remove('filled');
  lgSwap(S.lgMode);
  lgPhys?.kick(0, 0, -1.1, 1200);
};

ACOES['guestresume'] = (el, e, a) => {
  const g = guestSaved();
  if (g) {
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile(g);
    store.set(SAVE_KEY, g);
    lgFilled(g);
  }
};

ACOES['togglepwd'] = (el, e, a) => {
  const i = $('#pwd');
  i.type = i.type === 'password' ? 'text' : 'password';
};

/* ===== app/25-acoes-leitor-qr.js ===== */
/* app/25-acoes-leitor-qr.js · ações de leitor qr.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['scan'] = (el, e, a) => {
  openOverlay(Overlays.scan(el.dataset.mode || 'ler'), 'scan');
  if ((el.dataset.mode || 'ler') === 'ler') setTimeout(camStart, 350);
};

ACOES['camstart'] = (el, e, a) => {
  camStart();
};

ACOES['scanmode'] = (el, e, a) => {
  const r = $('.scanner', ov);
  if (r.dataset.busy) return;
  r.dataset.mode = el.dataset.v;
  $('.scan-seg', ov).style.setProperty('--k', el.dataset.v === 'meu' ? 1 : 0);
};

ACOES['torch'] = (el, e, a) => {
  const r = $('.scanner', ov);
  const on = r.classList.toggle('torch');
  el.setAttribute('aria-pressed', on);
};

ACOES['flip'] = (el, e, a) => {
  el.classList.toggle('flipped');
  el.classList.remove('hint');
  S.flipSeen = true;
  buzz(8);
};

ACOES['demo'] = (el, e, a) => {
  Object.assign(D.person, DEMO_PERSON);
  lgFilled({ ...DEMO_PERSON });
};

ACOES['scanask'] = (el, e, a) => {
  const q = el.dataset.q;
  scanOpen(q);
  setTimeout(() => {
    openOverlay(Overlays.ask(q), 'ask');
    setTimeout(() => $('#qtext')?.focus({ preventScroll: true }), 480);
  }, 650);
};

ACOES['colega-teste'] = (el, e, a) => {
  if (!canDebugQr()) return;
  peerForce = D.peers.find((x) => x.card) || null;
  scanResult('colega');
};

ACOES['simulate'] = (el, e, a) => {
  if (!canDebugQr()) return;
  if (API) demoQr(el.dataset.q);
  else demoHit('etal:' + el.dataset.q);
};

ACOES['scanopen'] = (el, e, a) => {
  scanOpen(el.dataset.q);
};

ACOES['scanagain'] = (el, e, a) => {
  scanAgain();
};

/* ===== app/25-acoes-lembretes-e-pwa.js ===== */
/* app/25-acoes-lembretes-e-pwa.js · ações de lembretes e pwa.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['remind'] = (el, e, a) => {
  const id = el.dataset.id;
  const on = !S.reminders.has(id);
  const x = byId(id);
  if (on) S.reminders.add(id);
  else {
    S.reminders.delete(id);
    remFired.delete(id);
  }
  prefs.set(REM_KEY, JSON.stringify([...S.reminders]));
  if (on)
    askNotify().then(() => {
      rerender();
      toast(`Lembrete às ${hhmm(toMin(x.time) - LEAD)} de ${dayOf(x.day).week.toLowerCase()}, ${x.day}`);
      checkReminders();
    });
  else {
    rerender();
    toast('Lembrete desligado');
  }
};

ACOES['remindtest'] = (el, e, a) => {
  deliver(byId(el.dataset.id), true);
};

ACOES['install'] = (el, e, a) => {
  installApp();
};

ACOES['instalar-fechar'] = (el, e, a) => {
  prefs.set('etal-instalar-oculto', '1');
  el.closest('.instalar')?.remove();
  toast('Dá para instalar depois em Perfil');
};

ACOES['update'] = (el, e, a) => {
  if (PWA.waiting) {
    PWA.updating = true;
    PWA.waiting.postMessage({ type: 'skip' });
  } else location.reload();
};

/* ===== app/25-acoes-mapa.js ===== */
/* app/25-acoes-mapa.js · ações de mapa.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['nadicmap'] = (el, e, a) => {
  S.mapView = 'campus';
  S.campusPlace = 'predio-nadic';
  window.Campus3D.setMode('campus');
  window.Campus3D.select('predio-nadic');
  switchTab('map', true);
  setTimeout(() => window.Campus3D.focus('predio-nadic'), reduce ? 0 : 500);
};

ACOES['mapview'] = (el, e, a) => {
  if (S.mapView !== el.dataset.v) {
    navMark('view');
    S.journeying = false;
    S.mapView = el.dataset.v;
    if (S.mapView === 'bloco') {
      S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
      S.mapZone = null;
      S.mapRoute = false;
    } else {
      S.campusPlace = null;
      window.Campus3D.clearRoute();
    }
    rerender();
  }
};

ACOES['place'] = (el, e, a) => {
  navMark('place');
  S.campusPlace = el.dataset.id;
  window.Campus3D.select(S.campusPlace);
  rerender();
  window.Campus3D.focus(S.campusPlace);
};

ACOES['placeclose'] = (el, e, a) => {
  if (navTag() === 'place') {
    navBack();
    return;
  }
  S.campusPlace = null;
  window.Campus3D.select(null);
  window.Campus3D.clearRoute();
  rerender();
  window.Campus3D.fitAll();
};

ACOES['placeroute'] = (el, e, a) => {
  window.Campus3D.route(el.dataset.id);
  rerender();
};

ACOES['enterbloco'] = (el, e, a) => {
  navMark('bloco');
  S.mapView = 'bloco';
  S.mapFloor = window.Campus3D.isFlat() ? 0 : null;
  S.mapZone = null;
  S.mapRoute = false;
  S.campusPlace = null;
  window.Campus3D.select(null);
  window.Campus3D.clearRoute();
  rerender();
};

ACOES['cam'] = (el, e, a) => {
  const v = el.dataset.v;
  const C = window.Campus3D;
  if (v === 'in') C.zoom(1.4);
  else if (v === 'out') C.zoom(0.72);
  else if (v === 'rot') C.rotate(45);
  else C.fit();
};

ACOES['mapanovo'] = (el, e, a) => {
  abrirMapaNovo(null, null, () => toast('Você está no mapa leve.'));
};

ACOES['openmap'] = (el, e, a) => {
  const fl = +el.dataset.floor,
    z = el.dataset.zone;
  const legacy = () => {
    S.mapView = 'bloco';
    S.mapFloor = fl;
    S.mapZone = z;
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
    switchTab('map', true);
  };
  if (!abrirMapaNovo(fl, z, legacy)) legacy();
};

ACOES['palco'] = (el, e, a) => {
  palcoEnviar({ mode: el.dataset.mode });
};

ACOES['openplace'] = (el, e, a) => {
  S.mapView = 'evento';
  S.campusPlace = el.dataset.id;
  window.Campus3D.setMode('evento');
  window.Campus3D.select(el.dataset.id);
  switchTab('map', true);
  setTimeout(
    () => {
      window.Campus3D.select(el.dataset.id);
      window.Campus3D.focus(el.dataset.id);
      window.Campus3D.route(el.dataset.id);
    },
    reduce ? 0 : 450,
  );
};

ACOES['floorsel'] = (el, e, a) => {
  const v = el.dataset.v;
  const C = window.Campus3D;
  navMark('floor');
  S.mapZone = null;
  S.mapRoute = false;
  S.journeying = false;
  S.mapFloor = v === 'all' ? null : +v;
  rerender();
  if (v === 'all' && C.isFlat()) C.setFlat(false);
  rerender();
  if (v === 'all') C.openStack();
  else C.goFloor(+v);
};

ACOES['zoneclose'] = (el, e, a) => {
  if (navTag() === 'room') {
    navBack();
    return;
  }
  S.mapZone = null;
  S.mapRoute = false;
  rerender();
  window.Campus3D.room(S.mapFloor, null);
};

ACOES['roomroute'] = (el, e, a) => {
  if (
    abrirMapaNovo(S.mapFloor, S.mapZone, () => {
      S.mapRoute = true;
      S.journeying = true;
      rerender();
      runJourney();
    })
  )
    return;
  navMark('route');
  S.mapRoute = true;
  S.journeying = true;
  rerender();
  runJourney();
};

ACOES['via'] = (el, e, a) => {
  S.mapVia = el.dataset.v;
  S.mapRoute = true;
  S.journeying = true;
  rerender();
  runJourney();
};

/* ===== app/25-acoes-navegacao.js ===== */
/* app/25-acoes-navegacao.js · ações de navegacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['back'] = (el, e, a) => {
  if (navTag() === 'screen' || S.stacks[S.tab].length < 2) navBack();
  else if (!busy) {
    navMark('tab');
    S.stacks[S.tab].pop();
    show(build(top()), 'pop');
  }
};

ACOES['tab'] = (el, e, a) => {
  if (el.dataset.tab === 'map' && S.tab !== 'map' && soonRoute()) return;
  if (el.dataset.tab === 'agenda' && S.tab !== 'agenda') S.agendaFilter = 'all';
  switchTab(el.dataset.tab);
};

ACOES['link'] = (el, e, a) => {
  window.open(el.dataset.url, '_blank', 'noopener');
};

ACOES['closeov'] = (el, e, a) => {
  closeOverlay(
    el.dataset.then ? () => push(el.dataset.then, el.dataset.thenId ? { id: el.dataset.thenId } : undefined) : null,
  );
};

ACOES['share'] = (el, e, a) => {
  openOverlay(Overlays.share(el.dataset.id), 'share');
};

ACOES['copy'] = (el, e, a) => {
  const txt = el.dataset.text;
  const ok = () => {
    el.querySelector('span').textContent = 'Copiado';
    el.classList.add('done');
  };
  try {
    navigator.clipboard.writeText(txt).then(ok, ok);
  } catch (_) {
    ok();
  }
};

ACOES['toast'] = (el, e, a) => {
  toast(el.dataset.msg);
};

/* ===== app/25-acoes-organizacao.js ===== */
/* app/25-acoes-organizacao.js · ações de organizacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['oq-abrir'] = (el, e, a) => {
  openOverlay(
    `<div class="oq-full" role="dialog" aria-label="QR Code em tela cheia"><span class="oq-n"></span><button class="oq-x" data-act="closeov" aria-label="Fechar">${ic('x')}</button><div class="oq-qr"></div><b class="oq-t"></b><small class="oq-w"></small><div class="oq-nav"><button data-act="oq-ant">${ic('back')}Anterior</button><button data-act="oq-prox">Próximo${ic('chev')}</button></div></div>`,
    'qrfull',
  );
  oqTela(+el.dataset.i);
  {
    const f = $('.oq-full', ov);
    let x0 = null;
    f.addEventListener(
      'touchstart',
      (e) => {
        x0 = e.touches[0].clientX;
      },
      { passive: true },
    );
    f.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 50) oqTela(oqI + (d < 0 ? 1 : -1));
      x0 = null;
    });
  }
};

ACOES['oq-ant'] = (el, e, a) => {
  oqTela(oqI - 1);
};

ACOES['oq-prox'] = (el, e, a) => {
  oqTela(oqI + 1);
};

ACOES['orgres'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    const k = el.dataset.k;
    const w = el.dataset.w === '' ? null : +el.dataset.w;
    /* mudar uma partida desfaz as que dependem dela */
    const depois = k[0] === 'q' ? [`s${Math.floor(+k[1] / 2)}`, 'f'] : k[0] === 's' ? ['f'] : [];
    depois.forEach((d) => delete T.res[d]);
    if (w === null) delete T.res[k];
    else T.res[k] = w;
  });
  rerender();
  toast(el.dataset.w === '' ? 'Resultado desfeito' : 'Resultado salvo');
};

ACOES['orgopen'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    T.open = !T.open;
  });
  rerender();
};

ACOES['orgrmjog'] = (el, e, a) => {
  torneioSalvar(el.dataset.t, (T) => {
    T.players[+el.dataset.i] = null;
  });
  rerender();
  toast('Jogador fora da chave');
};

/* ===== app/25-acoes-perfil.js ===== */
/* app/25-acoes-perfil.js · ações de perfil.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['profile-edit'] = (el, e, a) => {
  profileEditOpen();
};

ACOES['cartao-pular'] = (el, e, a) => {
  cardSkip();
  cardDemoDone = true;
  if (el.closest('.ct-invite')) {
    el.closest('.ct-invite').remove();
    toast('Dá para personalizar depois em Perfil');
  } else {
    navBack();
    toast('Dá para personalizar depois em Perfil');
  }
};

ACOES['profile-preset'] = (el, e, a) => {
  profileEditDraft.photo = PROFILE_AVATARS[+el.dataset.index];
  profileEditRefresh();
};

ACOES['profile-remove-photo'] = (el, e, a) => {
  profileEditDraft.photo = null;
  profileEditRefresh();
};

ACOES['retro'] = (el, e, a) => {
  retroOpen(false);
};

ACOES['retrodemo'] = (el, e, a) => {
  closeOverlay(() => retroOpen(true));
};

ACOES['retroprev'] = (el, e, a) => {
  retroShow(retro.i - 1);
};

ACOES['retronext'] = (el, e, a) => {
  retroShow(retro.i + 1);
};

ACOES['retroclose'] = (el, e, a) => {
  closeOverlay();
};

ACOES['retroshare'] = (el, e, a) => {
  const text = retro.text;
  const done = () => toast('Texto copiado para compartilhar');
  if (navigator.share) {
    navigator.share({ title: 'Meu ETAL', text }).catch(() => {});
    return;
  }
  try {
    navigator.clipboard.writeText(text).then(done, done);
  } catch (_) {
    done();
  }
};

ACOES['mine'] = (el, e, a) => {
  S.agendaFilter = 'saved';
  switchTab('agenda', true);
};

ACOES['logout'] = (el, e, a) => {
  suapSummary = null;
  {
    if (API) API.post('/api/auth/sair').catch(() => {});
    const n = navUndo.length;
    navUndo.length = 0;
    if (n) {
      navSkip += 1;
      history.go(-n);
    }
  }
  S = fresh();
  Object.assign(communityDraft, {
    post: '',
    message: '',
    comments: {},
    images: [],
    activity: '',
    day: D.now.day,
    tag: 'No evento',
    contextReady: false,
    activityManual: false,
  });
  communityMode = 'feed';
  store.del(SAVE_KEY);
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  Object.assign(D.person, DEMO_PERSON);
  vp.innerHTML = '';
  show(build({ s: 'login' }), 'fade');
};

/* ===== app/25-acoes-personalizacao.js ===== */
/* app/25-acoes-personalizacao.js · ações de personalizacao.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['ui'] = (el, e, a) => {
  UI[el.dataset.k] = el.dataset.v;
  uiSave();
  applyUI();
  if (el.dataset.k === 'view') window.Campus3D.setFlat(el.dataset.v === '2d');
  rerender();
};

ACOES['theme'] = (el, e, a) => {
  UI.theme = el.dataset.v;
  UI.accent = null;
  uiSave();
  applyUI();
  rerender();
};

ACOES['accent'] = (el, e, a) => {
  UI.accent = el.dataset.v;
  uiSave();
  applyUI();
  rerender();
};

ACOES['uifps'] = (el, e, a) => {
  UI.fps = !UI.fps;
  uiSave();
  rerender();
};

ACOES['uimaphour'] = (el, e, a) => {
  UI.mapHour = !UI.mapHour;
  uiSave();
  syncMapHour();
  if (el.closest('.map-cfg')) {
    el.classList.toggle('on', UI.mapHour);
    el.setAttribute('aria-pressed', UI.mapHour);
  } else rerender();
};

ACOES['mapcfg'] = (el, e, a) => {
  const p = el.closest('.map-screen, .page, body').querySelector('.map-cfg');
  const open = !p.classList.contains('open');
  p.classList.toggle('open', open);
  el.setAttribute('aria-expanded', open);
};

ACOES['maplayer'] = (el, e, a) => {
  const k = el.dataset.k;
  UI.layers[k] = !UI.layers[k];
  uiSave();
  window.Campus3D.setLayers(UI.layers);
  el.classList.toggle('on', UI.layers[k]);
  el.setAttribute('aria-pressed', UI.layers[k]);
};

ACOES['perfrun'] = (el, e, a) => {
  perfRun();
};

ACOES['perfuse'] = (el, e, a) => {
  window.Campus3D.setQuality(el.dataset.v);
  rerender();
  toast(`Em uso: ${TIER_LABEL[el.dataset.v]}`);
};

ACOES['hudcycle'] = (el, e, a) => {
  const list = window.Campus3D.tiers();
  const cur = window.Campus3D.quality().tier;
  const next = list[(list.indexOf(cur) + 1) % list.length];
  window.Campus3D.setQuality(next);
  rerender();
  toast(TIER_LABEL[next]);
};

ACOES['uisky'] = (el, e, a) => {
  UI.sky = !UI.sky;
  uiSave();
  rerender();
};

ACOES['uihome'] = (el, e, a) => {
  UI.home[el.dataset.k] = !UI.home[el.dataset.k];
  uiSave();
  rerender();
};

ACOES['quality'] = (el, e, a) => {
  window.Campus3D.setQuality(el.dataset.v);
  rerender();
};

ACOES['uireset'] = (el, e, a) => {
  UI = JSON.parse(JSON.stringify(UI_DEFAULT));
  uiSave();
  applyUI();
  window.Campus3D.setQuality('auto');
  window.Campus3D.setFlat(false);
  rerender();
  toast('Padrão restaurado');
};

ACOES['skycycle'] = (el, e, a) => {
  const seq = [6.5, 14 + 2 / 60, 18, 20.5];
  const n = seq.find((v) => v > skyHour + 0.1);
  skyTo(n === undefined ? seq[0] : n);
};

ACOES['tema'] = (el, e, a) => {
  UI.mode = isDark() ? 'claro' : 'escuro';
  uiSave();
  applyUI();
  rerender();
};

ACOES['dim'] = (el, e, a) => {
  const C = window.Campus3D;
  const f = el.dataset.v === '2d';
  if (f === C.isFlat()) return;
  C.setFlat(f);
  if (f && S.mapView === 'bloco' && S.mapFloor === null) {
    S.mapFloor = 0;
    rerender();
    C.goFloor(0);
  } else rerender();
};

/* ===== app/25-acoes.js ===== */
/* app/25-acoes.js · despachante das ações (data-act).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act],[data-go]');
  if (!el || !device.contains(el)) return;
  if (el.closest('form') && el.type === 'submit') return;
  const a = el.dataset.act;
  if (el.dataset.go && !a) {
    e.stopPropagation();
    push(el.dataset.go, el.dataset.id ? { id: el.dataset.id } : undefined);
    return;
  }
  e.stopPropagation();
  ACOES[a]?.(el, e, a);
});

/* ===== app/26-formularios-e-toque.js ===== */
/* app/26-formularios-e-toque.js · formulários, entrada, toque e teclado.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */

document.addEventListener('submit', async (e) => {
  if (e.target.dataset.form === 'community-report') {
    e.preventDefault();
    if (!communityPode()) {
      toast('Leia o QR Code da recepção para participar.');
      return;
    }
    const data = new FormData(e.target);
    const target = e.target.dataset.target;
    if (API) {
      pubDenunciar(target, String(data.get('reason') || ''), String(data.get('detail') || ''));
      return;
    }
    if (
      communityWrite((v) =>
        SOCIAL.report(v, target, communityAuthor(), String(data.get('reason') || ''), String(data.get('detail') || '')),
      )
    )
      closeOverlay(() => toast('Denúncia registrada para revisão'));
    return;
  }

  if (e.target.dataset.form === 'profile-edit') {
    e.preventDefault();
    if (profilePhotoBusy || !profileEditDraft) return;
    const name = String(new FormData(e.target).get('name') || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!name) {
      toast('Informe o nome que quer exibir.');
      return;
    }
    const words = name.split(' ');
    const edited = {
      name,
      first: words[0],
      initials: (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase(),
      photo: profileEditDraft.photo,
    };
    try {
      localStorage.setItem(profileLocalKey(D.person.id), JSON.stringify(edited));
    } catch (_) {
      toast('Não foi possível salvar. Libere espaço no navegador.');
      return;
    }
    const onBadge = !!$('.login.filled');
    Object.assign(D.person, edited);
    store.set(SAVE_KEY, { ...D.person });
    const guest = guestSaved();
    if (guest && String(guest.id) === String(D.person.id))
      prefs.set('etal-visitante', JSON.stringify({ ...guest, ...edited }));
    if (lgPending) {
      Object.assign(lgPending, edited);
      lgPhys?.disarm?.();
    }
    closeOverlay(() => {
      if (onBadge) {
        $('.bx-face.filled', $('.login')).innerHTML = badgeFace(lgPending);
        $('[data-live="hello"]').textContent = `Tudo certo, ${D.person.first}!`;
      } else if (top().s === 'cartao') {
        /* na edição do perfil: troca só a foto e o nome, sem perder o que foi digitado no resto do formulário */
        const pg = vp.querySelector('.page:not(.leaving)');
        const eu = $('.ct-eu', pg);
        if (eu) eu.outerHTML = cartaoEu();
        $('[data-form="cartao"]', pg)?.dispatchEvent(new Event('input'));
        mapaFixoEnviar('etal:mapa:sincronizar', {});
      } else {
        rerender();
        mapaFixoEnviar('etal:mapa:sincronizar', {});
      }
      toast('Perfil atualizado neste aparelho');
    });
    return;
  }

  if (['community-post', 'community-message', 'community-comment'].includes(e.target.dataset.form)) {
    e.preventDefault();
    if (!S.auth || (e.target.dataset.form !== 'community-message' && !communityPode())) {
      toast('Leia o QR da recepção para participar.');
      return;
    }
    if (communityImageBusy && e.target.dataset.form === 'community-post') {
      toast('Aguarde a foto terminar de carregar.');
      return;
    }
    const f = e.target;
    const kind = f.dataset.form;
    const data = new FormData(f);
    const text = String(data.get('text') || '')
      .trim()
      .slice(0, kind === 'community-post' ? 2000 : 1000);
    if (!text && !(kind === 'community-post' && communityDraft.images.length)) {
      toast('Escreva algo para compartilhar.');
      return;
    }
    if (API) {
      pubEnviar(kind, text, f.dataset.id).then((ok) => {
        if (ok) communityLimparRascunho(kind, f.dataset.id, 'Publicado');
      });
      return;
    }
    const item = {
      ...communityAuthor(),
      handle: communityPeople().find((p) => p.id === String(D.person.id))?.handle,
      id: SOCIAL.uid(),
      created: Date.now(),
      text,
      mentions: communityMentions(text).map((p) => p.id),
    };
    const saved = communityWrite((v) => {
      if (kind === 'community-post')
        v.posts.unshift({
          ...item,
          activity: byId(communityDraft.activity)?.id || null,
          day:
            byId(communityDraft.activity)?.day ||
            (D.days.some((d) => d.day === +communityDraft.day) ? +communityDraft.day : D.now.day),
          tag: communityDraft.tag,
          images: communityDraft.images.map((img) => ({ ...img })),
        });
      else if (kind === 'community-message') v.messages.push(item);
      else {
        if (!communityPosts(v).some((p) => p.id === f.dataset.id))
          throw new Error('Esta publicação não está mais disponível.');
        (v.comments[f.dataset.id] ||= []).push(item);
      }
    });
    if (saved) communityLimparRascunho(kind, f.dataset.id, 'Publicação salva neste aparelho');
    return;
  }
  if (e.target.dataset.form === 'tourjoin') {
    e.preventDefault();
    const t = D.tournaments.find((x) => x.id === e.target.dataset.id);
    const f = S.tourForm || {};
    const nick = String(new FormData(e.target).get('nick') || '')
      .trim()
      .slice(0, 14);
    if (!nick) return;
    let ok = false;
    orgWrite((o) => {
      const stt = window.TOUR.state(t, o);
      const i = stt.players.indexOf(null);
      if (i < 0 || !stt.open || stt.players.some((p) => p && p[4] === D.person.id)) return;
      const pick = f.pick && f.pick !== t.picks[t.picks.length - 1] ? f.pick : '';
      stt.players[i] = [nick, D.person.name, D.person.initials, pick, D.person.id, f.level ?? 1];
      ok = true;
      o.torneios = { ...(o.torneios || {}), [t.id]: { ...((o.torneios || {})[t.id] || {}), players: stt.players } };
    });
    S.tourForm = null;
    if (ok) {
      S.tourTab = 'chave';
      buzz([20, 40, 20]);
      notify(`Você está na chave de ${t.name}`, `${dayOf(t.day).week} ${t.day}, ${t.time} · ${t.place}`);
    } else toast('As vagas acabaram');
    rerender();
    return;
  }
  const ask = e.target.closest('[data-form="ask"]');
  if (ask) {
    e.preventDefault();
    const text = $('#qtext').value.trim();
    if (!text) return;
    const id = ask.dataset.id;
    (S.asked[id] ||= []).unshift({ id: `m${Date.now()}`, who: 'Você', text, votes: 0 });
    closeOverlay(() => {
      rerender();
      toast('Pergunta enviada');
    });
    return;
  }
  const on = e.target.closest('[data-form="orgnotice"]');
  if (on) {
    e.preventDefault();
    const title = $('#ontitle').value.trim();
    const text = $('#ontext').value.trim();
    if (!title) {
      $('#ontitle').focus();
      return;
    }
    D.notices.unshift({
      time: skyClock(),
      title,
      text: text || 'Aviso da organização do ETAL.',
      fresh: true,
      org: true,
    });
    const nid = `n${Date.now()}`;
    orgSeen.add(nid);
    orgWrite((o) =>
      o.notices.unshift({ id: nid, time: skyClock(), title, text: text || 'Aviso da organização do ETAL.' }),
    );
    rerender();
    notify(title, text || 'Aviso da organização do ETAL.');
    toast('Aviso enviado para todos');
    return;
  }
  const ofm = e.target.closest('[data-form^="org"]');
  if (ofm && ['orgjog', 'orgregra', 'orgcred', 'orgequipe'].includes(ofm.dataset.form)) {
    e.preventDefault();
    const f = new FormData(ofm);
    const v = (k) => String(f.get(k) || '').trim();
    const tipo = ofm.dataset.form;
    if (tipo === 'orgjog') {
      const nome = v('nome');
      const ini = nome
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      let ok = false;
      torneioSalvar(ofm.dataset.t, (T) => {
        const i = T.players.findIndex((p) => !p);
        if (i >= 0) {
          T.players[i] = [v('nick'), nome, ini, v('pick'), `manual-${Date.now()}`];
          ok = true;
        }
      });
      rerender();
      toast(ok ? `${v('nick')} entrou na chave` : 'A chave está completa');
    }
    if (tipo === 'orgregra') {
      torneioSalvar(ofm.dataset.t, (T) => {
        T.rules = v('regras');
      });
      toast('Regras salvas');
      rerender();
    }
    if (tipo === 'orgcred') {
      const mat = v('mat');
      orgWrite((o) => {
        o.manuais = { ...(o.manuais || {}), [mat]: { nome: v('nome'), hora: skyClock() } };
        o.creds[mat] = skyClock();
      });
      rerender();
      toast(`${v('nome').split(' ')[0]} credenciado às ${skyClock()}`);
    }
    if (tipo === 'orgequipe') {
      orgWrite((o) => {
        o.organizadores = [
          ...(o.organizadores || []).filter((x) => x.matricula !== v('mat')),
          { matricula: v('mat'), papel: v('papel') },
        ];
      });
      rerender();
      toast('Acesso ao painel liberado');
    }
    return;
  }
  const orf = e.target.closest('[data-form="orgroom"]');
  if (orf) {
    e.preventDefault();
    const x = byId($('#orx').value);
    const [fl, zone] = $('#ory').value.split('|');
    const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
    if (!x || !r) return;
    if (x.zone === r.zone && x.floor === r.floor) {
      toast('A atividade já está nessa sala');
      return;
    }
    const from = x.room;
    Object.assign(x, { floor: r.floor, zone: r.zone, room: r.name });
    const msg = `${x.short}: agora em ${r.name}, ${floorOf(r.floor).label}`;
    D.notices.unshift({
      time: skyClock(),
      title: 'Mudança de sala',
      text: `${msg}. Antes era ${from}.`,
      fresh: true,
      org: true,
    });
    const nid = `n${Date.now()}`;
    orgSeen.add(nid);
    orgWrite((o) => {
      o.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name };
      o.notices.unshift({
        id: nid,
        time: skyClock(),
        title: 'Mudança de sala',
        text: `${msg}. Antes era ${from}.`,
        to: `inscritos em ${x.short}`,
      });
    });
    rerender();
    notify('Mudança de sala', msg, x.id);
    toast('Sala trocada e inscritos avisados');
    return;
  }
  const gf = e.target.closest('[data-form="guest"]');
  if (gf) {
    e.preventDefault();
    const err = $('#lgerr');
    const say = (m, el) => {
      err.textContent = m;
      err.hidden = false;
      el?.focus();
      lgShake();
    };
    const v = {
      name: $('#gname').value.trim(),
      email: $('#gmail').value.trim(),
      kind: (gf.querySelector('[name=gkind]:checked') || {}).value,
      inst: $('#ginst').value.trim(),
      city: $('#gcity').value.trim(),
    };
    err.hidden = true;
    err.classList.remove('ok');
    if (v.name.split(/\s+/).length < 2)
      return say('Escreva o nome e o sobrenome, como devem sair no crachá.', $('#gname'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      return say('Confira o e-mail: é por ele que chega o certificado.', $('#gmail'));
    if (!v.city) return say('Informe a sua cidade.', $('#gcity'));
    if (!$('#gok').checked) return say('Para criar a conta, é preciso concordar com o uso dos dados.', $('#gok'));
    if (API) {
      /* Visitante de verdade: o servidor manda um link de entrada para o e-mail. */
      const btn = $('button[type="submit"]', gf);
      btn?.classList.add('loading');
      try {
        const j = await API.post('/api/auth/visitante', {
          nome: v.name,
          email: v.email,
          instituicao: v.inst || null,
          cidade: v.city,
        });
        err.classList.add('ok');
        err.hidden = false;
        err.innerHTML = j.link
          ? `Link de teste (sem e-mail configurado): <a href="${esc(j.link)}">entrar</a>`
          : `Pronto! Enviamos um link de entrada para <b>${esc(v.email)}</b>. Abra o e-mail neste aparelho.`;
      } catch (x) {
        say(x.message);
      } finally {
        btn?.classList.remove('loading');
      }
      return;
    }
    const prof = guestProfile(v);
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile(prof);
    store.set(SAVE_KEY, prof);
    prefs.set('etal-visitante', JSON.stringify(prof));
    lgFilled(prof);
    return;
  }
  const f = e.target.closest('[data-form="login"]');
  if (!f) return;
  e.preventDefault();
  const btn = $('button[type="submit"]', f);
  const err = $('#lgerr');
  const say = (m) => {
    err.textContent = m;
    err.hidden = false;
    lgShake();
  };
  const mat = $('#mat').value.trim();
  const pwd = $('#pwd').value;
  err.hidden = true;
  if (!mat || !pwd) {
    say('Informe a matrícula e a senha.');
    return;
  }
  btn.classList.add('loading');
  btn.disabled = true;
  const state = $('[data-live="state"]');
  if (state) state.textContent = 'Consultando o SUAP…';
  $('.login')?.classList.add('asking');
  try {
    if (API) {
      /* Servidor do ETAL: pede o token JWT ao SUAP, lê o perfil e abre a sessão. A senha não fica guardada. */
      /* Na abertura do evento muita gente entra junto: se a fila do SUAP estiver cheia, o servidor responde 503 com
         Retry-After e o app espera esses segundos (contando na tela) e tenta de novo, sem a pessoa fazer nada, por até
         4 minutos (no teste de carga com 700 pessoas e o SUAP lento, a última entrou em pouco mais de 2). */
      const desde = Date.now();
      for (;;) {
        try {
          await API.post('/api/auth/suap/senha', { matricula: mat, senha: pwd });
          break;
        } catch (x) {
          if (x.status === 503 && x.retryAfter && Date.now() - desde < 240000) {
            for (let s = x.retryAfter; s > 0; s--) {
              if (state) state.textContent = `Muita gente entrando agora. Tentando de novo em ${s} s…`;
              await new Promise((ok) => setTimeout(ok, 1000));
            }
            if (state) state.textContent = 'Consultando o SUAP…';
            continue;
          }
          say(x.message);
          return;
        }
      }
      const me = await API.get('/api/eu');
      apiState(me);
      lgFilled(D.person);
      return;
    }
    const r = await fetch('api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula: mat, senha: pwd }),
    });
    const j = await r.json().catch(() => {
      throw new TypeError('sem servidor');
    });
    if (!r.ok) {
      say(j.erro || 'Não foi possível entrar.');
      if (r.status >= 500) $('#lgdemo')?.removeAttribute('hidden');
      return;
    }
    Object.keys(D.person).forEach((k) => delete D.person[k]);
    applyProfile({ ...DEMO_PERSON, ...j.perfil });
    store.set(SAVE_KEY, j.perfil);
    lgFilled(D.person);
  } catch (_) {
    say(
      navigator.onLine === false
        ? 'Sem internet agora. Entre como visitante ou tente de novo quando a conexão voltar.'
        : 'Não foi possível falar com o servidor local. Abra o protótipo por server.py para usar o SUAP, ou entre como visitante.',
    );
    $('#lgdemo')?.removeAttribute('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    $('.login')?.classList.remove('asking');
  }
});

$('#skyr')?.addEventListener('input', (e) => {
  cancelAnimationFrame(skyAnim);
  horaManual = true;
  skyHour = +e.target.value;
  applySky();
});
/* Resposta imediata ao toque em tudo que é clicável. */
const PRESS = '[data-act],[data-go],a,.btn';
let pressed = null;
const unpress = () => {
  if (pressed) {
    pressed.classList.remove('is-press');
    pressed = null;
  }
};
device.addEventListener(
  'pointerdown',
  (e) => {
    const t = e.target.closest(PRESS);
    if (t && !t.matches('canvas,.ov-backdrop')) {
      unpress();
      pressed = t;
      t.classList.add('is-press');
    }
  },
  { passive: true },
);
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => device.addEventListener(n, unpress, { passive: true }));
device.addEventListener('scroll', unpress, { passive: true, capture: true });
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flip')) {
    e.preventDefault();
    e.target.click();
  }
});

/* ===== app/27-painel-do-computador.js ===== */
/* app/27-painel-do-computador.js · mudanças vindas do painel do computador (etal-org).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- painel no computador (admin.html) ----------------
     Avisos e trocas de sala feitos no painel ficam em etal-org e chegam aqui, mesmo com o app já aberto. */
const ORG_KEY = 'etal-org';
const orgSeen = new Set();
const orgRead = () => {
  try {
    return { notices: [], moves: {}, creds: {}, ...JSON.parse(localStorage.getItem(ORG_KEY)) };
  } catch (_) {
    return { notices: [], moves: {}, creds: {} };
  }
};
/* grava o estado de um campeonato no etal-org (o mesmo que o painel do computador usa) */
function torneioSalvar(id, fn) {
  const t = D.tournaments.find((x) => x.id === id);
  const st0 = tourSt(t);
  orgWrite((o) => {
    const T = { open: st0.open, players: st0.players.slice(), res: { ...st0.res }, rules: st0.rules };
    fn(T);
    o.torneios = { ...(o.torneios || {}), [id]: T };
  });
}
function orgWrite(fn) {
  const o = orgRead();
  fn(o);
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(o));
  } catch (_) {
    /* sem armazenamento */
  }
}
/* Números de sala definidos no painel (etal-org.rooms, chave "andar:zona"). Troca na planta, nas atividades e no 3D. */
function applyRoomNumbers(rooms) {
  P.floors.forEach((f) =>
    f.zones.forEach((z) => {
      if (!z.roomNumber) return;
      if (z.num0 === undefined) z.num0 = z.roomNumber;
      const v = (rooms[`${f.level}:${z.id}`] || '').trim();
      const n = v || z.num0;
      z.orgNumber = !!v && v !== z.num0;
      if (n === z.roomNumber) return;
      z.roomNumber = n;
      if (!z.name) z.label = zoneName(z);
      const re = new RegExp(`(data-num="${f.level}:${z.id}"[^>]*>)[^<]*<`, 'g');
      f.svg = f.svg.replace(re, `$1${esc(n)}<`);
      f.svgDark = f.svgDark.replace(re, `$1${esc(n)}<`);
    }),
  );
  D.sessions.forEach((x) => {
    if (x.floor === undefined) return;
    const z = zoneOf(x.floor, x.zone);
    if (z && z.roomNumber) x.room = zoneName(z);
  });
  window.Campus3D?.syncRooms?.();
}
function orgSync(first) {
  const o = orgRead();
  const sig = JSON.stringify(o.atividades || {});
  const mudou = sig !== orgSync.sig;
  orgSync.sig = sig;
  Object.values(o.atividades || {}).forEach((a) => {
    const x = byId(a.id);
    if (x) {
      delete x.floor;
      delete x.zone;
      delete x.prerequisites;
      Object.assign(x, a);
    } else D.sessions.push({ learn: [], materials: [], taken: 0, ...a });
  });
  Object.entries(o.moves).forEach(([id, m]) => {
    const x = byId(id);
    if (x) Object.assign(x, m);
  });
  applyRoomNumbers(o.rooms || {});
  const fresh = o.notices.filter((n) => !orgSeen.has(n.id));
  fresh
    .slice()
    .reverse()
    .forEach((n) => {
      orgSeen.add(n.id);
      D.notices.unshift({ time: n.time, title: n.title, text: n.text, fresh: true, org: true });
    });
  if (!first && fresh.length) {
    notify(fresh[0].title, fresh[0].text);
    buzz([20, 40, 20]);
    if (S.auth && vp.querySelector('.page')) rerender();
  } else if (!first && mudou && S.auth && vp.querySelector('.page')) rerender();
}
orgSync(true);
window.addEventListener('storage', (e) => {
  if (e.key !== ORG_KEY) return;
  orgSync(false);
  if (S.auth && vp.querySelector('.tour, .poster, .duel')) rerender();
});

/* ===== app/28-servidor.js ===== */
/* app/28-servidor.js · servidor: config.js, api.js e eventos ao vivo.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- servidor (config.js → api) ----------------
     Com a API ligada, programação, perfil, agenda, presenças e avisos vêm do servidor; sem ela, tudo segue de exemplo. */
const isoHM = (iso) => (iso ? iso.slice(11, 16) : null);
function apiPerson(p) {
  suapSummary = null;
  return {
    ...DEMO_PERSON,
    name: p.name,
    first: p.first,
    initials: p.initials,
    course: p.course || (p.source === 'visitante' ? 'Visitante' : ''),
    courseFull: p.course || '',
    year: '',
    campus: p.campus || p.city || '',
    id: p.matricula || p.email || String(p.id),
    photo: p.photo || null,
    source: p.source === 'visitante' ? 'guest' : 'suap',
    org: p.org,
  };
}
function apiState(me) {
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  applyProfile(apiPerson(me.person));
  S.saved = new Set(me.saved);
  D.enrolled.length = 0;
  D.enrolled.push(...me.saved);
  S.present = { ...me.present };
  S.credAt = isoHM(me.person.credentialedAt);
}
/* ---- presença lida sem internet ----
   Sem conexão na hora da leitura, o app guarda o QR (só se for um QR assinado do ETAL, de uma atividade da agenda ou do
   credenciamento) e mostra "Leitura guardada": a presença ainda NÃO está registrada. Quando a internet volta, o app
   envia sozinho com a hora da leitura, e o servidor decide com as regras de sempre (QR assinado, leitura durante a
   atividade, envio até pouco depois do fim). O resultado aparece numa notificação; o que for recusado não volta. */
const PEND_PREFIXO = 'etal-presencas-pendentes:';
const pendKey = () => PEND_PREFIXO + (D.person.id || 'anon');
/* localStorage, e não o store da sessão: a leitura guardada tem que sobreviver a fechar o app e abrir depois */
function pendentes() {
  try {
    return JSON.parse(localStorage.getItem(pendKey())) || [];
  } catch (_) {
    return [];
  }
}
function gravarPendentes(lista) {
  try {
    if (lista.length) localStorage.setItem(pendKey(), JSON.stringify(lista));
    else localStorage.removeItem(pendKey());
    return true;
  } catch (_) {
    return false;
  }
}
function pendenteDe(id) {
  return pendentes().find((p) => p.q === id);
}
/* QR assinado do ETAL (link /q/<token> ou o token): a atividade vai dentro, sem precisar do servidor para ler */
function qrAssinado(texto) {
  const t = (/\/q\/([\w.-]+)/.exec(texto) || [])[1] || (/^[\w-]+\.[\w-]+$/.test(texto) ? texto : null);
  if (!t) return undefined;
  const q = qrActivity(t);
  if (q === undefined) return undefined;
  return q === 'recepcao' || byId(q) ? q : undefined;
}
const falhaDeRede = (x) => !x.status;
function guardarPendente(qr, q) {
  const lista = pendentes().filter((p) => p.q !== q);
  lista.push({ qr, q, lidoEm: new Date().toISOString() });
  const ok = gravarPendentes(lista);
  netState();
  return ok;
}
function tirarPendente(q) {
  gravarPendentes(pendentes().filter((p) => p.q !== q));
  netState();
}
function pendenteResult(q) {
  const x = byId(q);
  const onde = x ? `a presença em <b>${esc(x.short)}</b>` : 'o credenciamento';
  return `<div class="sr-hero">${hxBadge('muted')}<div><small class="sr-kick">Sem internet</small><h2>Leitura guardada</h2><p>Ainda não vale: ${onde} só fica registrada quando o app conseguir enviar. Ele envia sozinho quando a conexão voltar e avisa aqui.</p></div></div>
      <div class="sr-actions"><button class="btn primary big" data-act="closeov">Entendi</button></div>`;
}
let enviandoPendentes = false;
async function enviarPendentes() {
  if (!API || !S.auth || enviandoPendentes || !navigator.onLine) return;
  const lista = pendentes();
  if (!lista.length) return;
  enviandoPendentes = true;
  try {
    for (const p of lista) {
      const x = byId(p.q);
      const nome = x ? x.short : 'credenciamento';
      try {
        const r = await API.post('/api/presenca', { qr: p.qr, lidoEm: p.lidoEm });
        tirarPendente(p.q);
        if (r.activity) {
          S.present[r.activity] = S.present[r.activity] || r.time;
          communityCheckin(r.activity);
        }
        if (!S.credAt) S.credAt = r.time;
        notify(
          x ? 'Presença registrada' : 'Credenciamento confirmado',
          x ? `${nome}: a leitura guardada foi enviada.` : 'A leitura guardada foi enviada.',
          x ? p.q : undefined,
        );
      } catch (e) {
        /* sem rede, sessão expirada, servidor ocupado ou fora do ar: tenta de novo depois */
        if (falhaDeRede(e) || e.status === 401 || e.status === 429 || e.status >= 500) break;
        tirarPendente(p.q); // recusada pelas regras (QR inválido, leitura fora da atividade, envio tarde): não volta
        notify('Leitura não valeu', `${nome}: ${e.message}`);
      }
    }
  } finally {
    enviandoPendentes = false;
    if (S.auth && vp.querySelector('.page')) rerender();
  }
}
window.addEventListener('online', () => setTimeout(enviarPendentes, 1500));
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && enviarPendentes());
setInterval(() => pendentes().length && enviarPendentes(), 30000);

async function apiQr(token) {
  try {
    const r = await API.post('/api/presenca', { qr: token });
    if (r.activity) {
      S.present[r.activity] = r.time;
      communityCheckin(r.activity);
    }
    if (!S.credAt) S.credAt = r.time;
    const x = r.activity && byId(r.activity);
    toast(
      r.alreadyPresent
        ? 'Presença já estava registrada'
        : x
          ? `Presença registrada: ${x.short}`
          : 'Credenciamento confirmado',
    );
    rerender();
  } catch (x) {
    const q = falhaDeRede(x) && qrAssinado(token);
    if (q && guardarPendente(token, q)) {
      toast('Sem internet: leitura guardada. A presença vale quando o app enviar.');
      return;
    }
    toast(x.message);
  }
}
/* Para a câmera e deixa o último quadro na tela, atrás do cartão de confirmação. */
function freezeCam() {
  const v = $('.scan-cam');
  if (v && v.videoWidth) {
    try {
      const cv = document.createElement('canvas');
      cv.width = v.videoWidth;
      cv.height = v.videoHeight;
      cv.getContext('2d').drawImage(v, 0, 0);
      v.poster = cv.toDataURL('image/jpeg', 0.8);
    } catch (_) {
      /* sem quadro */
    }
  }
  camStop();
  if (v) v.srcObject = null;
}
/* QR lido pela câmera com o servidor: trava o leitor, registra no servidor e mostra o mesmo cartão de confirmação. */
async function apiScan(hit) {
  const root = $('.scanner', ov);
  const hint = $('.scan-hint span', ov);
  if (root) {
    root.dataset.busy = '1';
    root.classList.add('is-locked');
  }
  if (hint) hint.innerHTML = `${ic('check')}QR reconhecido`;
  freezeCam();
  let r;
  try {
    r = await API.post('/api/presenca', { qr: hit });
  } catch (x) {
    camStop();
    const q = falhaDeRede(x) && qrAssinado(hit);
    if (q && guardarPendente(hit, q)) {
      scanSheet(pendenteResult(q));
      return;
    }
    closeOverlay(() => toast(falhaDeRede(x) ? 'Sem internet, e esse QR não é do ETAL.' : x.message));
    return;
  }
  const first = !S.credAt;
  if (first) S.credAt = r.time;
  const q = r.activity && byId(r.activity) ? r.activity : null;
  if (!q) {
    const c = takeNewComb();
    rerender();
    if (first) closeOverlay(() => openOverlay(Overlays.welcome(c), 'welcome'));
    else scanSheet(credResult());
    return;
  }
  const again = !!r.alreadyPresent;
  S.present[q] = S.present[q] || r.time;
  communityCheckin(q);
  const c = takeNewComb();
  rerender();
  scanSheet(roomResult(q, { again, first, c }));
}
/* Câmera de verdade no leitor. Lê com o BarcodeDetector do navegador ou, sem ele (computador, iPhone), com o jsQR.
     Com o servidor, o QR assinado vai para /api/presenca; sem ele, o app tira a atividade de dentro do QR. */
let cam = null;
function camStop() {
  if (!cam) return;
  cam.stop = true;
  cam.stream?.getTracks().forEach((t) => t.stop());
  cam = null;
}
/* ZXing em WebAssembly (vendor/zxing-reader.js + zxing_reader.wasm, MIT): bem mais rápido que o jsQR e lê imagem borrada
     de webcam. O .wasm vem do próprio app (fica no cache offline), nunca de CDN. */
let zxLoad = null;
const loadZXing = () =>
  zxLoad ||
  (zxLoad = new Promise((ok, no) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/zxing-reader.js';
    sc.onerror = no;
    sc.onload = () => {
      const Z = window.ZXingWASM;
      if (!Z) {
        no(new Error('zxing'));
        return;
      }
      Z.prepareZXingModule({
        overrides: {
          locateFile: (f, pre) =>
            f.endsWith('.wasm') ? new URL('vendor/zxing_reader.wasm', location.href).href : pre + f,
        },
        fireImmediately: true,
      }).then(() => ok(Z), no);
    };
    document.head.appendChild(sc);
  }));
let jsqrLoad = null;
const loadJsQR = () =>
  jsqrLoad ||
  (jsqrLoad = new Promise((ok, no) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/jsQR.js';
    sc.onload = () => ok(window.jsQR);
    sc.onerror = no;
    document.head.appendChild(sc);
  }));
async function makeReader(video) {
  if ('BarcodeDetector' in window) {
    try {
      const fm = await window.BarcodeDetector.getSupportedFormats?.();
      if (!fm || fm.includes('qr_code')) {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async () => (await det.detect(video)).map((c) => ({ v: c.rawValue, pts: c.cornerPoints }));
      }
    } catch (_) {
      /* cai no jsQR */
    }
  }
  try {
    const Z = await loadZXing();
    const zc = document.createElement('canvas');
    const zx = zc.getContext('2d', { willReadFrequently: true });
    let zv = 0;
    return async () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w) return [];
      zv++;
      let sx = 0;
      let sy = 0;
      let sw = w;
      let sh = h;
      if (zv % 2) {
        const lado = Math.round(Math.min(w, h) * 0.85);
        sx = Math.round((w - lado) / 2);
        sy = Math.round((h - lado) / 2);
        sw = sh = lado;
      }
      const k = Math.min(1, 1280 / Math.max(sw, sh));
      zc.width = Math.round(sw * k);
      zc.height = Math.round(sh * k);
      zx.drawImage(video, sx, sy, sw, sh, 0, 0, zc.width, zc.height);
      const out = await Z.readBarcodes(zx.getImageData(0, 0, zc.width, zc.height), {
        formats: ['QRCode'],
        tryHarder: true,
        maxNumberOfSymbols: 1,
      });
      return out
        .filter((r) => r.isValid && r.text)
        .map((r) => {
          const P = r.position;
          return {
            v: r.text,
            pts: [P.topLeft, P.topRight, P.bottomRight, P.bottomLeft].map((p) => ({
              x: sx + p.x / k,
              y: sy + p.y / k,
            })),
          };
        });
    };
  } catch (_) {
    /* sem WebAssembly: jsQR */
  }
  const jsQR = await loadJsQR();
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d', { willReadFrequently: true });
  /* Webcam de notebook é borrada: em vez de reduzir o quadro inteiro, alterna entre o recorte do centro (onde fica a
       moldura) em resolução cheia e o quadro todo. A inversão de cores só é tentada de vez em quando (é mais lenta). */
  let vez = 0;
  return async () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w) return [];
    vez++;
    let sx = 0;
    let sy = 0;
    let sw = w;
    let sh = h;
    if (vez % 3) {
      const lado = Math.round(Math.min(w, h) * (vez % 3 === 1 ? 0.75 : 0.95));
      sx = Math.round((w - lado) / 2);
      sy = Math.round((h - lado) / 2);
      sw = sh = lado;
    }
    const k = Math.min(1, 900 / Math.max(sw, sh));
    cv.width = Math.round(sw * k);
    cv.height = Math.round(sh * k);
    cx.drawImage(video, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    const r = jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, {
      inversionAttempts: vez % 6 === 0 ? 'attemptBoth' : 'dontInvert',
    });
    if (!r) return [];
    const L = r.location;
    return [
      {
        v: r.data,
        pts: [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner].map((p) => ({
          x: sx + p.x / k,
          y: sy + p.y / k,
        })),
      },
    ];
  };
}
/* Conteúdo do QR → atividade (sem servidor). Aceita o link /q/<token> e o texto "etal:<atividade>". */
function qrActivity(text) {
  const m = /etal:([\w-]+)/i.exec(text);
  if (m) return m[1];
  const t = (/\/q\/([\w.-]+)/.exec(text) || [])[1] || (/^[\w-]+\.[\w-]+$/.test(text) ? text : null);
  if (!t) return undefined;
  try {
    const j = JSON.parse(atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
    return j.a || 'recepcao';
  } catch (_) {
    return undefined;
  }
}
function demoHit(text) {
  const q = qrActivity(text);
  if (q === undefined) return false;
  const x = byId(q);
  if (!SPOTS[q]) {
    if (!x) return false;
    SPOTS[q] = {
      name: x.room || 'Sala',
      sign: x.short,
      where: floorOf(x.floor ?? 0).label,
      icon: 'qr',
      seed: 30 + Object.keys(SPOTS).length * 7,
    };
  }
  scanResult(q);
  return true;
}
/* QR lido pela câmera do celular, sem servidor (página qrs.html): o link abre o app com ?qr=etal:<atividade>. O login
     vem primeiro; depois dele o leitor abre e a leitura acontece como se fosse na sala. */
function qrPendente() {
  let t = null;
  try {
    t = sessionStorage.getItem('etal-qr-demo');
  } catch (_) {
    /* sem armazenamento */
  }
  if (!t || !S.auth || API) return;
  try {
    sessionStorage.removeItem('etal-qr-demo');
  } catch (_) {
    /* opcional */
  }
  setTimeout(() => {
    openOverlay(Overlays.scan(), 'scan');
    setTimeout(() => {
      if (!demoHit(t)) toast('Esse QR não é de uma atividade do ETAL.');
    }, 650);
  }, 500);
}
let demoQrs = null;
async function demoQr(q) {
  try {
    if (!canDebugQr()) return;
    demoQrs = demoQrs || (await API.get('/api/org/debug/qrs'));
    const it = demoQrs.find((d) => (d.id || 'recepcao') === q);
    if (!it) {
      toast('QR Code não encontrado.');
      return;
    }
    await apiScan(it.url);
  } catch (error) {
    toast(error.message || 'Não foi possível abrir os QR Codes de debug.');
  }
}
/* Rastreio do QR na imagem da câmera: um contorno segue os quatro cantos (suavizado a cada quadro), os cantos
     "agarram" o código e a etiqueta diz o que foi visto. Ao validar, o QR acende, pulsa e mostra o ✓ antes de seguir. */
const trk = { tgt: null, cur: null, seen: 0, raf: 0, state: '' };
function trackSet(code, state) {
  const video = $('.scan-cam', ov);
  const root = $('.scanner', ov);
  if (!video || !root) return;
  if (code?.pts?.length === 4 && video.videoWidth) {
    const r = video.getBoundingClientRect();
    const s = Math.max(r.width / video.videoWidth, r.height / video.videoHeight);
    const ox = (r.width - video.videoWidth * s) / 2;
    const oy = (r.height - video.videoHeight * s) / 2;
    trk.tgt = code.pts.map((p) => ({ x: p.x * s + ox, y: p.y * s + oy }));
    trk.seen = performance.now();
    if (!trk.cur) {
      const c = trk.tgt.reduce((m, p) => ({ x: m.x + p.x / 4, y: m.y + p.y / 4 }), { x: 0, y: 0 });
      trk.cur = trk.tgt.map(() => ({ ...c }));
    }
  }
  if (state) trk.state = state;
  root.classList.toggle('tracking', !!trk.cur);
  if (!trk.raf) trk.raf = requestAnimationFrame(trackDraw);
}
function trackReset() {
  cancelAnimationFrame(trk.raf);
  Object.assign(trk, { tgt: null, cur: null, seen: 0, raf: 0, state: '' });
  const svg = $('.scan-track', ov);
  if (svg) {
    svg.classList.remove('on');
    delete svg.dataset.state;
  }
  $('.tk-tag', ov)?.classList.remove('on');
  $('.scanner', ov)?.classList.remove('tracking');
}
function trackDraw() {
  trk.raf = 0;
  const svg = $('.scan-track', ov);
  const tag = $('.tk-tag', ov);
  const root = $('.scanner', ov);
  if (!svg || !trk.cur) return;
  const lock = trk.state === 'lock';
  if (!lock && performance.now() - trk.seen > 450) {
    svg.classList.remove('on');
    tag.classList.remove('on');
    root?.classList.remove('tracking');
    trk.cur = null;
    return;
  }
  const a = lock ? 0.35 : 0.45;
  trk.cur.forEach((p, i) => {
    p.x += (trk.tgt[i].x - p.x) * a;
    p.y += (trk.tgt[i].y - p.y) * a;
  });
  const P = trk.cur;
  const pt = (p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  const r = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  $('.tk-poly', svg).setAttribute('points', P.map(pt).join(' '));
  const k = 0.24;
  const brk = P.map((p, i) => {
    const a1 = P[(i + 3) % 4];
    const b1 = P[(i + 1) % 4];
    const m = (q) => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
    return `M${pt(m(a1))}L${pt(p)}L${pt(m(b1))}`;
  }).join('');
  $('.tk-brk', svg).setAttribute('d', brk);
  const cx = P.reduce((t, p) => t + p.x, 0) / 4;
  const cy = P.reduce((t, p) => t + p.y, 0) / 4;
  $('.tk-ok', svg).setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
  svg.dataset.state = trk.state;
  svg.classList.add('on');
  const top = P.reduce((m, p) => (p.y < m.y ? p : m), P[0]);
  tag.textContent = { lock: 'QR reconhecido', ok: 'QR do ETAL', outro: 'Não é do ETAL' }[trk.state] || 'Lendo…';
  tag.dataset.state = trk.state;
  tag.style.transform = `translate(${cx.toFixed(0)}px, ${(top.y - 34).toFixed(0)}px) translateX(-50%)`;
  tag.classList.add('on');
  trk.raf = requestAnimationFrame(trackDraw);
}
async function camStart() {
  const st = $('#camst');
  const btn = $('[data-act="camstart"]');
  const video = $('.scan-cam');
  const say = (m) => {
    if (st) st.textContent = m;
  };
  if (!video) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    say('A câmera só abre com o app em HTTPS. Use a câmera do celular: ela abre o ETAL Connect e registra a presença.');
    return;
  }
  camStop();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    try {
      const tr = stream.getVideoTracks()[0];
      const c = tr.getCapabilities?.() || {};
      if (c.focusMode?.includes('continuous')) await tr.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch (_) {
      /* câmera sem ajuste de foco */
    }
    if (!$('.scan-cam')) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    cam = { stream, stop: false };
    video.srcObject = stream;
    await video.play();
    video.classList.add('on');
    $('.scanner', ov)?.classList.add('cam-live');
    if (btn) btn.hidden = true;
    say('Aponte para o QR. A leitura é automática.');
    const read = await makeReader(video);
    const me = cam;
    let warned = 0;
    let firm = 0;
    trackReset();
    const tick = async () => {
      if (me.stop) return;
      try {
        const codes = await read();
        const good = codes.find((c) => qrActivity(c.v) !== undefined);
        if (codes.length) trackSet(good || codes[0], good ? 'ok' : 'outro');
        /* dois quadros seguidos com o mesmo QR do ETAL: trava, acende e só então segue */
        if (good) {
          firm = performance.now() - (me.goodAt || 0) < 500 ? firm + 1 : 1;
          me.goodAt = performance.now();
        }
        if (good && firm >= 2) {
          const hit = good.v;
          trackSet(good, 'lock');
          buzz([18, 40, 18]);
          const root = $('.scanner', ov);
          if (root) {
            root.dataset.busy = '1';
            root.classList.add('is-locked');
          }
          say('QR reconhecido');
          setTimeout(
            () => {
              if (me.stop) return;
              if (API) {
                apiScan(hit);
                return;
              }
              freezeCam();
              root?.removeAttribute('data-busy');
              if (!demoHit(hit)) toast('Esse QR não é de uma atividade do ETAL.');
            },
            reduce ? 150 : 900,
          );
          return;
        }
        if (!good && codes.length && Date.now() - warned > 2500) {
          warned = Date.now();
          say('Esse QR não é do ETAL. Procure o QR da sala ou da recepção.');
        }
      } catch (_) {
        /* quadro ainda carregando */
      }
      setTimeout(tick, 60);
    };
    tick();
  } catch (x) {
    say(
      x && x.name === 'NotAllowedError' ? 'Permita o uso da câmera para ler o QR.' : 'Não foi possível abrir a câmera.',
    );
    if (btn) btn.hidden = false;
  }
}
async function apiStart() {
  const qs0 = new URLSearchParams(location.search);
  const qr = qs0.get('qr');
  const login = qs0.get('login');
  if (qr || login) history.replaceState(history.state, '', location.pathname);
  if (qr) sessionStorage.setItem('etal-qr', qr);
  try {
    const prog = await API.get('/api/programacao');
    const extra = Object.fromEntries(D.sessions.map((x) => [x.id, x]));
    D.sessions.length = 0;
    prog.sessions.forEach((x) => D.sessions.push({ ...(extra[x.id] || {}), ...x }));
    applyRoomNumbers(prog.rooms || {});
    if (window.ETAL_CONFIG?.demo) {
      try {
        const scenario = await API.get('/api/cenario-demo');
        D.event = scenario.event;
        if (Array.isArray(scenario.tournaments)) D.tournaments.splice(0, D.tournaments.length, ...scenario.tournaments);
        if (Array.isArray(scenario.posts)) SOCIAL.seeds.splice(0, SOCIAL.seeds.length, ...scenario.posts);
      } catch (_) {
        /* cenário embarcado disponível sem rede */
      }
    }
    const av = await API.get('/api/avisos');
    if (av.length) {
      D.notices.length = 0;
      av.forEach((n) => D.notices.push({ time: n.time, title: n.title, text: n.text, org: true }));
    }
  } catch (_) {
    toast('Sem conexão com o servidor: mostrando a programação salva.');
  }
  let me = null;
  try {
    me = await API.get('/api/eu');
  } catch (_) {
    /* não entrou */
  }
  API.live({
    publicacoes: pubAviso,
    aviso: (n) => {
      D.notices.unshift({ time: n.time, title: n.title, text: n.text, fresh: true, org: true });
      notify(n.title, n.text, n.activity);
      buzz([20, 40, 20]);
      if (S.auth && vp.querySelector('.page')) rerender();
    },
    sala: (m) => {
      const x = byId(m.activity);
      if (x) {
        Object.assign(x, { floor: m.floor, zone: m.zone, room: m.room });
        if (S.auth) rerender();
      }
    },
    numeros: (rooms) => {
      applyRoomNumbers(rooms);
      if (S.auth) rerender();
    },
    atividade: (a) => {
      const x = byId(a.id);
      if (x) {
        ['floor', 'zone', 'seats', 'prerequisites'].forEach((k) => {
          if (!(k in a)) delete x[k];
        });
        Object.assign(x, a);
      } else D.sessions.push({ learn: [], materials: [], ...a });
      if (S.auth && vp.querySelector('.page')) rerender();
    },
  });
  if (login && login !== 'ok')
    toast(
      {
        erro: 'Não foi possível entrar. Tente de novo.',
        'suap-indisponivel': 'O SUAP não respondeu. Tente de novo.',
        'suap-ocupado': 'Muita gente entrando agora. Toque em entrar de novo em instantes.',
        'link-expirado': 'Esse link expirou. Peça outro.',
      }[login] || 'Não foi possível entrar.',
    );
  if (!me) {
    show(build({ s: 'login' }), 'fade');
    return;
  }
  apiState(me);
  S.auth = true;
  show(build(top()), 'fade');
  setTimeout(enviarPendentes, 2500);
  const pend = sessionStorage.getItem('etal-qr');
  if (pend) {
    sessionStorage.removeItem('etal-qr');
    setTimeout(() => apiQr(pend), 600);
  } else if (DEMO || login === 'ok') cardIntro(900);
}

/* ===== app/29-inicio-do-app.js ===== */
/* app/29-inicio-do-app.js · início do app.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- início ---------------- */
setInterval(checkReminders, 30000);
netState();
const openParam = new URLSearchParams(location.search).get('abrir');
if (openParam) setTimeout(() => openActivity(openParam), 900);
const clock = $('#clock');
if (clock) clock.textContent = D.now.time;
/* Atalhos de demonstração: ?tela=home, agenda, atividade, aula, mapa, credencial, campeonato... */
const q = new URLSearchParams(location.search).get('tela');
if (history.state && history.state.etal) {
  navSkip += 1;
  history.go(-history.state.etal);
}
const qs = new URLSearchParams(location.search);
if (qs.get('fps')) UI.fps = true;
if (qs.get('ceu')) {
  skyHour = +qs.get('ceu');
  horaManual = true;
}
if (qs.get('tema')) UI.mode = qs.get('tema') === 'dark' ? 'escuro' : 'claro';
if (qs.get('paleta')) UI.theme = qs.get('paleta');
applyUI();
syncMapHour();
window.Campus3D.setLayers?.(UI.layers);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (UI.mode === 'auto') {
    applyUI();
    rerender();
  }
});
if (mapSaved && mapSaved.seen ? mapSaved.flat : UI.view === '2d') window.Campus3D.setFlat(true);
if (!q && API) {
  apiStart();
  return;
}
if (!API && qs.get('qr')) {
  if (qrActivity(qs.get('qr')) !== undefined)
    try {
      sessionStorage.setItem('etal-qr-demo', qs.get('qr'));
    } catch (_) {
      /* opcional */
    }
  history.replaceState(history.state, '', location.pathname);
}
if (!q) {
  const saved = store.get(SAVE_KEY);
  if (saved) {
    applyProfile(saved);
    S.auth = true;
    telaGrande();
    show(build(top()), 'fade');
    qrPendente();
    if (DEMO) cardIntro(900);
    return;
  }
  show(build({ s: 'login' }), 'fade');
  return;
}
if (q === 'login') {
  show(build({ s: 'login' }), 'fade');
  return;
}
if (q === 'visitante') {
  S.lgMode = 'guest';
  show(build({ s: 'login' }), 'fade');
  return;
}
S.auth = true;
applyProfile(D.person);
const ok = () => {
  S.credAt = D.now.time;
};
const setups = {
  home: () => {},
  'home-ok': ok,
  comunidade: () => {
    S.tab = 'community';
  },
  'comunidade-ok': () => {
    ok();
    S.tab = 'community';
  },
  mural: () => {
    S.tab = 'community';
    communityMode = 'wall';
  },
  moderacao: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'orgCommunity' });
  },
  chat: () => {
    ok();
    S.tab = 'community';
    communityMode = 'chat';
  },
  agenda: () => {
    S.tab = 'agenda';
  },
  atividade: () => {
    S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } });
  },
  aula: () => {
    ok();
    S.present['react-native'] = '14:03';
    S.stacks.home.push({ s: 'activity', p: { id: 'react-native' } });
  },
  compartilhar: () => {
    setups.aula();
    setTimeout(() => openOverlay(Overlays.share('react-native'), 'share'), 300);
  },
  mapa: () => {
    S.tab = 'map';
  },
  campus: () => {
    S.tab = 'map';
    S.mapView = 'campus';
  },
  bloco: () => {
    S.tab = 'map';
    S.mapView = 'bloco';
  },
  nadic: () => {
    S.stacks.home.push({ s: 'nadic' });
  },
  etal: () => {
    S.stacks.home.push({ s: 'etal' });
  },
  agendaVazia: () => {
    S.tab = 'agenda';
    S.agendaDay = 28;
    S.agendaFilter = 'saved';
    S.saved.delete('saude-mental');
  },
  perf: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'perf' });
  },
  palestrante: () => {
    S.stacks.home.push({ s: 'speaker', p: { id: 'react-native' } });
  },
  personalizar: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'personalizar' });
  },
  retro: () => {
    S.tab = 'profile';
    setTimeout(() => retroOpen(true), 400);
  },
  colmeia: () => {
    ok();
    S.present['react-native'] = D.now.time;
    S.ratings['react-native'] = 5;
    S.stacks.home.push({ s: 'colmeia' });
  },
  'home-favos': () => {
    ok();
    S.present['react-native'] = D.now.time;
    S.ratings['react-native'] = 5;
  },
  rota: () => {
    S.tab = 'map';
    S.mapView = 'bloco';
    S.mapFloor = 2;
    S.mapZone = 'labs-norte-2';
    S.mapRoute = true;
    S.pending = true;
    S.journeying = true;
  },
  qr: () => {
    setTimeout(() => {
      openOverlay(Overlays.scan(), 'scan');
      setTimeout(camStart, 350);
    }, 300);
  },
  meuqr: () => {
    ok();
    setTimeout(() => openOverlay(Overlays.scan('meu'), 'scan'), 300);
  },
  palestrantes: () => {
    S.stacks.home.push({ s: 'speakers' });
  },
  certificados: () => {
    ok();
    S.present['react-native'] = '14:03';
    S.stacks.home.push({ s: 'certificates' });
  },
  contatos: () => {
    S.stacks.home.push({ s: 'network' });
  },
  org: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'org' });
  },
  sobre: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'sobre' });
  },
  materiais: () => {
    S.stacks.home.push({ s: 'materials' });
  },
  boasvindas: () => {
    ok();
    S.newComb = 'cred';
    setTimeout(() => openOverlay(Overlays.welcome(D.combs[0]), 'welcome'), 300);
  },
  favo: () => {
    ok();
    S.present['react-native'] = D.now.time;
    setTimeout(() => {
      S.newComb = 'react-native';
      combToast(D.combs[1]);
    }, 900);
  },
  credencial: () => {
    ok();
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'credential' });
  },
  avisos: () => {
    S.stacks.home.push({ s: 'notices' });
  },
  perfil: () => {
    S.tab = 'profile';
  },
  campeonatos: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'games' });
  },
  campeonato: () => {
    S.tab = 'profile';
    S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'mk' } });
  },
  fifa: () => {
    S.tab = 'profile';
    S.tourTab = 'jogadores';
    S.stacks.profile.push({ s: 'games' }, { s: 'tournament', p: { id: 'fifa' } });
  },
};
(setups[q] || (() => {}))();
telaGrande();
wideMq.addEventListener('change', () => location.reload());
show(build(top()), 'fade');
})();
