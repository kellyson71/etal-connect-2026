/* Painel da organização do ETAL Connect, para computador.
   Lê a mesma programação e a mesma planta do app (data.js, plan-data.js). Participantes e números são simulados.
   Avisos, trocas de sala e credenciamentos ficam em localStorage (etal-org) e chegam ao app aberto no mesmo navegador. */
(() => {
  'use strict';
  const D = window.DATA,
    P = window.PLAN;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const view = $('#view');

  /* ---------- ícones ---------- */
  const IC = {
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    file: '<path d="M6 3h8l5 5v13H6Z"/><path d="M14 3v5h5"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
    route:
      '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.01"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    trophy:
      '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8M9 17h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  };
  const ic = (n) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  /* ---------- relógio do evento e salas ---------- */
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const NOW = toMin(D.now.time);
  const dayOf = (n) => D.days.find((d) => d.day === n);
  const floorLabel = (l) => P.floors[l].label;
  const isNow = (x) => x.day === D.now.day && toMin(x.time) <= NOW && NOW < toMin(x.end);
  const isPast = (x) => x.day < D.now.day || (x.day === D.now.day && toMin(x.end) <= NOW);
  const roomName = (z) =>
    z.name ||
    (z.kind === 'laboratory'
      ? `Lab ${z.roomNumber}`
      : z.kind === 'staff'
        ? `Sala dos professores ${z.roomNumber}`
        : `Sala ${z.roomNumber}`);
  const roomsAll = () =>
    P.floors.flatMap((f) =>
      f.zones.filter((z) => z.roomNumber).map((z) => ({ floor: f.level, zone: z.id, name: roomName(z) })),
    );
  const editavel = (z) => z.w && (z.roomNumber || ['auditorium', 'reception', 'lounge'].includes(z.kind));
  const placesAll = () =>
    P.floors.flatMap((f) => f.zones.filter(editavel).map((z) => ({ floor: f.level, zone: z.id, name: roomName(z) })));
  const where = (x) => (x.floor === undefined ? x.room : `${x.room} · ${floorLabel(x.floor)}`);
  /* Quem está na sala: com servidor, a contagem real de presenças (/api/lotacao e o evento "lotacao"); sem ele, estimativa. */
  const PRES = {};
  const PULSO = {};
  const present = (x) =>
    window.ETAL_API ? PRES[x.id] || 0 : x.seats ? Math.min(x.seats, Math.round(x.taken * 0.86 + 1)) : 0;

  /* ---------- estado compartilhado com o app ---------- */
  const KEY = 'etal-org';
  const load = () => {
    try {
      return { notices: [], moves: {}, creds: {}, rooms: {}, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch (_) {
      return { notices: [], moves: {}, creds: {}, rooms: {} };
    }
  };
  let ORG = load();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ORG));
    } catch (_) {
      /* sem armazenamento */
    }
  };
  /* Atividades criadas ou editadas no painel sem servidor (etal-org.atividades, id → atividade no formato do app). */
  const applyActivities = () =>
    Object.values(ORG.atividades || {}).forEach((a) => {
      const x = D.sessions.find((s) => s.id === a.id);
      if (x) Object.assign(x, a);
      else D.sessions.push({ learn: [], materials: [], taken: 0, ...a });
    });
  applyActivities();
  const applyMoves = () =>
    Object.entries(ORG.moves).forEach(([id, m]) => {
      const x = D.sessions.find((s) => s.id === id);
      if (x) Object.assign(x, m);
    });
  /* Numeração das salas definida pela organização (ORG.rooms, chave "andar:zona"). Igual à do app. */
  function applyRooms() {
    P.floors.forEach((f) =>
      f.zones.forEach((z) => {
        if (!z.roomNumber) return;
        if (z.num0 === undefined) z.num0 = z.roomNumber;
        const v = (ORG.rooms[`${f.level}:${z.id}`] || '').trim();
        const n = v || z.num0;
        z.orgNumber = !!v && v !== z.num0;
        if (n === z.roomNumber) return;
        z.roomNumber = n;
        const re = new RegExp(`(data-num="${f.level}:${z.id}"[^>]*>)[^<]*<`, 'g');
        f.svg = f.svg.replace(re, `$1${esc(n)}<`);
        f.svgDark = f.svgDark.replace(re, `$1${esc(n)}<`);
      }),
    );
    D.sessions.forEach((x) => {
      if (x.floor === undefined) return;
      const z = P.floors[x.floor].zones.find((q) => q.id === x.zone);
      if (z && z.roomNumber) x.room = roomName(z);
    });
  }
  applyMoves();
  applyRooms();
  window.addEventListener('storage', (e) => {
    if (e.key === window.COMMUNITY.key && current() === 'comunidade') {
      render();
      return;
    }
    if (e.key === KEY) {
      ORG = load();
      applyMoves();
      applyRooms();
      render();
    }
  });

  /* ---------- participantes simulados (sempre os mesmos) ---------- */
  const rng = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const FIRST = [
    'Ana',
    'João',
    'Maria',
    'Pedro',
    'Lucas',
    'Júlia',
    'Gabriel',
    'Larissa',
    'Rafael',
    'Beatriz',
    'Mateus',
    'Camila',
    'Davi',
    'Letícia',
    'Thiago',
    'Isabela',
    'Felipe',
    'Yasmin',
    'Caio',
    'Bianca',
    'Vitor',
    'Sofia',
    'Heitor',
    'Lívia',
    'Samuel',
    'Clara',
    'Enzo',
    'Alice',
    'Ruan',
    'Emanuelly',
    'Arthur',
    'Lara',
  ];
  const LAST = [
    'Silva',
    'Souza',
    'Oliveira',
    'Fernandes',
    'Medeiros',
    'Costa',
    'Pereira',
    'Lima',
    'Rocha',
    'Dantas',
    'Nunes',
    'Queiroz',
    'Carvalho',
    'Freitas',
    'Morais',
    'Bezerra',
    'Holanda',
    'Maia',
    'Pinto',
    'Rêgo',
  ];
  const COURSES = [
    'Informática',
    'Informática',
    'Análise e Desenvolvimento de Sistemas',
    'Edificações',
    'Apicultura',
    'Alimentos',
    'Meio Ambiente',
    'Química',
    'Gestão Ambiental',
  ];
  const CITIES = [
    ['Mossoró', 9],
    ['São Miguel', 7],
    ['Alexandria', 5],
    ['Encanto', 5],
    ['Rafael Fernandes', 4],
    ['Portalegre', 4],
    ['Marcelino Vieira', 3],
    ['Cajazeiras', 3],
    ['Natal', 2],
    ['Pau dos Ferros', 8],
  ];
  const KINDS = ['Estudante', 'Estudante', 'Estudante', 'Profissional', 'Professor(a)', 'Comunidade'];
  const PEOPLE = (() => {
    const r = rng(2026);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const cityBag = CITIES.flatMap(([c, w]) => Array(w).fill(c));
    const hours = D.org.porHora.flatMap(([h, n]) => Array(n).fill(h));
    const out = [];
    for (let i = 0; i < D.org.inscritos; i++) {
      const name = `${pick(FIRST)} ${pick(LAST)} ${pick(LAST)}`;
      const ifrn = r() < 0.76;
      const p = {
        id: ifrn ? `2023109${String(40000 + i * 37).padStart(7, '0')}` : `VIS${String(100000 + i * 911).slice(-6)}`,
        name,
        ifrn,
        email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${i}@exemplo.com`,
      };
      if (ifrn) p.course = pick(COURSES);
      else {
        p.kind = pick(KINDS);
        p.city = pick(cityBag);
      }
      out.push(p);
    }
    /* Credenciados na ordem das horas do painel: os números batem com o gráfico. */
    const order = out
      .map((_, i) => i)
      .sort(() => r() - 0.5)
      .slice(0, hours.length);
    order.forEach((idx, k) => {
      const h = hours[k];
      out[idx].cred = `${String(h).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`;
    });
    /* A conta de visitante criada neste aparelho aparece no topo. */
    try {
      const g = JSON.parse(localStorage.getItem('etal-visitante'));
      if (g)
        out.unshift({ id: g.id, name: g.name, ifrn: false, kind: g.year, city: g.campus, email: g.email, here: true });
    } catch (_) {
      /* sem conta */
    }
    return out;
  })();
  const credOf = (p) => ORG.creds[p.id] || p.cred || null;
  const credCount = () => PEOPLE.filter(credOf).length;

  /* ---------- navegação ---------- */
  const SECTIONS = [
    ['visao', 'Visão geral', 'home'],
    ['planta', 'Planta ao vivo', 'map'],
    ['programacao', 'Programação', 'cal'],
    ['participantes', 'Participantes', 'users'],
    ['campeonatos', 'Campeonatos', 'trophy'],
    ['avisos', 'Avisos', 'bell'],
    ['comunidade', 'Moderação', 'alert'],
  ];
  const state = { day: D.now.day, ptype: 'todos', pstat: 'todos', q: '', limit: 40, floor: 2, room: null };
  const current = () => (SECTIONS.find(([k]) => `#${k}` === location.hash) || SECTIONS[0])[0];
  /* No celular a barra lateral vira uma barra de abas embaixo: as quatro seções do dia a dia e "Mais" (as outras). */
  const PRINCIPAIS = ['visao', 'planta', 'programacao', 'participantes'];
  const CURTO = { visao: 'Início', planta: 'Planta', programacao: 'Agenda', participantes: 'Pessoas' };
  function nav() {
    const k = current();
    const extra = !PRINCIPAIS.includes(k);
    $('#nav').innerHTML =
      SECTIONS.map(
        ([id, t, i]) =>
          `<a href="#${id}" class="${PRINCIPAIS.includes(id) ? '' : 'extra'}" ${id === k ? 'aria-current="page"' : ''}>${ic(i)}<span data-curto="${CURTO[id] || t}">${t}</span>${id === 'avisos' && ORG.notices.length ? `<em>${ORG.notices.length}</em>` : id === 'planta' ? `<em title="atividades acontecendo agora">${D.sessions.filter(isNow).length}</em>` : ''}</a>`,
      ).join('') +
      `<button type="button" class="mais ${extra ? 'on' : ''}" data-act="mais">${ic('more')}<span>Mais</span></button>`;
    $('#title').textContent = SECTIONS.find(([id]) => id === k)[1];
  }
  function maisSheet() {
    const dlg = $('#dlg');
    dlg.className = 'sheet';
    dlg.innerHTML = `<nav class="mais-lista">${SECTIONS.filter(([id]) => !PRINCIPAIS.includes(id))
      .map(([id, t, i]) => `<a href="#${id}" data-act="close">${ic(i)}${t}</a>`)
      .join('')}<a href="./" target="_blank" rel="noopener">${ic('open')}Abrir o app</a></nav>`;
    dlg.showModal();
    dlg.addEventListener(
      'click',
      (e) => {
        if (e.target === dlg) dlg.close();
      },
      { once: true },
    );
  }
  /* Tema: o mesmo do app (etal-ui), com um botão no topo para trocar. */
  const temaEscuro = () => {
    try {
      const m = JSON.parse(localStorage.getItem('etal-ui'))?.mode;
      return m === 'escuro' || ((!m || m === 'auto') && matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (_) {
      return matchMedia('(prefers-color-scheme: dark)').matches;
    }
  };
  function aplicarTema() {
    const d = temaEscuro();
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
    const b = $('#tema');
    if (b) {
      b.innerHTML = ic(d ? 'sun' : 'moon');
      b.setAttribute('aria-label', d ? 'Usar o tema claro' : 'Usar o tema escuro');
    }
  }
  function trocarTema() {
    let u = {};
    try {
      u = JSON.parse(localStorage.getItem('etal-ui')) || {};
    } catch (_) {
      /* vazio */
    }
    u.mode = temaEscuro() ? 'claro' : 'escuro';
    try {
      localStorage.setItem('etal-ui', JSON.stringify(u));
    } catch (_) {
      /* opcional */
    }
    aplicarTema();
  }
  aplicarTema();
  /* Tabelas no celular viram cartões: cada célula ganha o nome da coluna (CSS mostra quando a tela é estreita). */
  function rotularTabelas() {
    view.querySelectorAll('table').forEach((t) => {
      const hs = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
      t.querySelectorAll('tbody tr').forEach((tr) =>
        [...tr.children].forEach((td, i) => {
          if (td.tagName === 'TD' && hs[i]) td.dataset.l = hs[i];
        }),
      );
    });
  }
  $('#clock').textContent = `${dayOf(D.now.day).week} ${D.now.day} nov · ${D.now.time}`;

  /* ---------- gráficos ---------- */
  const tip = $('#tip');
  document.addEventListener('pointermove', (e) => {
    const g = e.target.closest('[data-tip]');
    if (!g) {
      tip.classList.remove('on');
      return;
    }
    tip.textContent = g.dataset.tip;
    tip.style.left = `${e.clientX}px`;
    tip.style.top = `${e.clientY - 12}px`;
    tip.classList.add('on');
  });
  document.addEventListener('focusin', (e) => {
    const g = e.target.closest('[data-tip]');
    if (!g) return;
    const r = g.getBoundingClientRect();
    tip.textContent = g.dataset.tip;
    tip.style.left = `${r.left + r.width / 2}px`;
    tip.style.top = `${r.top - 6}px`;
    tip.classList.add('on');
  });
  document.addEventListener('focusout', () => tip.classList.remove('on'));

  /* Credenciamentos por hora: os simulados mais os feitos neste painel. */
  function hourRows() {
    const rows = D.org.porHora.map(([h, v]) => [h, v]);
    Object.values(ORG.creds).forEach((t) => {
      const h = +t.split(':')[0];
      const r = rows.find((q) => q[0] === h);
      if (r) r[1] += 1;
      else rows.push([h, 1]);
    });
    return rows.sort((a, b) => a[0] - b[0]);
  }
  /* Barras verticais, uma série: credenciamento por hora. Valor só no pico; o resto vem na dica. */
  function hourChart(rows) {
    const W = 560,
      H = 230,
      L = 34,
      T = 16,
      B = 196;
    const max = Math.max(...rows.map((r) => r[1]));
    const top = Math.ceil(max / 25) * 25;
    const bw = (W - L - 8) / rows.length;
    const y = (v) => B - ((B - T) * v) / top;
    const ticks = [0, top / 2, top]
      .map(
        (v) =>
          `<path class="grid-l" d="M${L} ${y(v) + 0.5}H${W}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`,
      )
      .join('');
    const bars = rows
      .map(([h, v]) => {
        const x = L + bw * rows.findIndex((q) => q[0] === h) + 4,
          w = bw - 8,
          yy = y(v);
        return `<g tabindex="0" data-tip="${h}h às ${h + 1}h · ${v} credenciamentos"><rect class="hit" x="${x - 4}" y="${T}" width="${bw}" height="${B - T + 24}"/>
        <path class="m" fill="var(--s-ifrn)" d="M${x} ${B}V${yy + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4V${B}Z"/>
        ${v === max ? `<text class="val" x="${x + w / 2}" y="${yy - 7}" text-anchor="middle">${v}</text>` : ''}<text class="axis" x="${x + w / 2}" y="${B + 18}" text-anchor="middle">${h}h</text></g>`;
      })
      .join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Credenciamentos por hora: ${rows.map(([h, v]) => `${h} horas, ${v}`).join('; ')}">${ticks}${bars}</svg>`;
  }
  /* Composição em duas categorias: IFRN e visitantes, com rótulo direto em cada parte. */
  function originRows() {
    const row = (label, list) => {
      const a = list.filter((p) => p.ifrn).length,
        b = list.length - a;
      const pa = Math.round((a / list.length) * 100);
      return `<div class="stack-row"><span>${label}</span><div class="stack" role="img" aria-label="${label}: ${a} do IFRN, ${b} visitantes">
        <div style="flex:${a};background:var(--s-ifrn)" data-tip="${label} do IFRN: ${a} (${pa}%)" tabindex="0">${a} · ${pa}%</div>
        <div style="flex:${b};background:var(--s-vis)" data-tip="${label} visitantes: ${b} (${100 - pa}%)" tabindex="0">${b}</div></div></div>`;
    };
    return `<ul class="legend"><li><i style="background:var(--s-ifrn)"></i>IFRN</li><li><i style="background:var(--s-vis)"></i>Visitantes</li></ul>
      ${row('Inscritos', PEOPLE)}${row('Credenciados', PEOPLE.filter(credOf))}`;
  }
  function cityBars() {
    const n = {};
    PEOPLE.filter((p) => !p.ifrn).forEach((p) => {
      n[p.city] = (n[p.city] || 0) + 1;
    });
    const list = Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const max = list[0]?.[1] || 1;
    return `<ul class="hbars">${list.map(([c, v]) => `<li data-tip="${c}: ${v} visitantes"><span>${esc(c)}</span><span class="track"><i style="width:${(v / max) * 100}%"></i></span><b>${v}</b></li>`).join('')}</ul>`;
  }
  const meter = (x) => {
    const pc = Math.round((x.taken / x.seats) * 100);
    return `<div class="meter ${pc >= 90 ? 'full' : ''}"><span class="track"><i style="width:${pc}%"></i></span><b>${x.taken}/${x.seats}</b></div>`;
  };
  const statusOf = (x) =>
    isNow(x)
      ? '<span class="pill live">Agora</span>'
      : isPast(x)
        ? '<span class="pill wait">Encerrada</span>'
        : '<span class="pill ifrn">Próxima</span>';

  /* ---------- seções ---------- */
  let socialModFilter = 'pending';
  /* Com servidor, a moderação lê e grava em /api/publicacoes (vale para todos); sem, fica neste navegador. */
  let socialV = null;
  let socialBuscando = false;
  async function socialCarregar() {
    if (socialBuscando) return;
    socialBuscando = true;
    try {
      const v = await window.ETAL_API.get('/api/publicacoes');
      for (const p of v.posts) for (const img of p.images || []) img.src = window.ETAL_API.url(img.src);
      socialV = v;
      if (current() === 'comunidade') render();
    } catch (x) {
      toast(x.message);
    } finally {
      socialBuscando = false;
    }
  }
  const Views = {
    comunidade() {
      if (!window.ETAL_API) return window.COMMUNITY.moderationHTML(window.COMMUNITY.read(), socialModFilter);
      if (!socialV) {
        socialCarregar();
        return '<p class="social-empty">Carregando as publicações…</p>';
      }
      return window.COMMUNITY.moderationHTML(socialV, socialModFilter);
    },
    visao() {
      const now = D.sessions.filter((x) => isNow(x) && x.seats);
      const inRooms = now.reduce((n, x) => n + present(x), 0);
      const cred = credCount();
      const vis = PEOPLE.filter((p) => !p.ifrn).length;
      return `<div class="grid g-kpi">
          <section class="card kpi"><b>${cred}</b><span>credenciados de ${PEOPLE.length}</span><span class="bar"><i style="width:${(cred / PEOPLE.length) * 100}%"></i></span></section>
          <section class="card kpi"><b>${inRooms}</b><span>em sala agora</span></section>
          <section class="card kpi"><b>${vis}</b><span>visitantes</span></section>
          <section class="card kpi"><b>${ORG.notices.length}</b><span>avisos enviados</span></section>
        </div>
        <div class="grid g-2 mt">
          <section class="card"><h2>Credenciamento por hora</h2>${hourChart(hourRows())}</section>
          <section class="card"><h2>De onde vem o público</h2>${originRows()}<h2 class="mt">Cidades dos visitantes</h2>${cityBars()}</section>
        </div>
        <div class="grid g-2 mt">
          <section class="card"><h2>Acontecendo agora</h2>${nowTable(now)}</section>
          <section class="card"><h2>Últimos avisos <small><button class="btn ghost" data-act="compose" type="button">Enviar aviso</button></small></h2>${feed(4)}</section>
        </div>`;
    },
    planta() {
      const f = P.floors[state.floor];
      const today = D.sessions.filter((x) => x.day === D.now.day && x.floor === state.floor);
      const RAMP = ['#dbe6fb', '#b3c9f2', '#86a7e6', '#5a82d3', '#3b63b8'];
      const overlays = f.zones
        .filter((z) => z.w)
        .map((z) => {
          const live = today.find((x) => isNow(x) && x.zone === z.id);
          const later = today.find((x) => !isNow(x) && !isPast(x) && x.zone === z.id);
          if (!live && !later) return '';
          const g = 4;
          const cx = z.x + z.w / 2,
            cy = z.y + z.h / 2;
          if (!live)
            return `<g class="occ" tabindex="0" data-act="room" data-zone="${z.id}" data-tip="${esc(later.short)} às ${later.time}"><rect x="${z.x + g}" y="${z.y + g}" width="${z.w - 2 * g}" height="${z.h - 2 * g}" rx="8" fill="#fff" fill-opacity=".55" stroke="#3b63b8" stroke-dasharray="5 4" stroke-width="2"/><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#3b63b8">às ${later.time}</text></g>`;
          const n = live.seats ? present(live) : 0;
          const pc = live.seats ? n / live.seats : 0.5;
          const full = pc >= 0.9;
          const fill = full ? '#c4492f' : RAMP[Math.min(4, Math.floor(pc * 5))];
          const ink = full || pc >= 0.6 ? '#fff' : '#1f2f57';
          const pulso = PULSO[live.id] > Date.now() - 2500;
          return `<g class="occ${pulso ? ' pulso' : ''}" tabindex="0" data-act="room" data-zone="${z.id}" data-tip="${esc(live.short)} · ${live.seats ? `${n} de ${live.seats} lugares` : 'sem limite de vagas'}">${pulso ? `<rect class="onda" x="${z.x + g}" y="${z.y + g}" width="${z.w - 2 * g}" height="${z.h - 2 * g}" rx="8"/><text class="mais1" x="${cx}" y="${z.y + 20}" text-anchor="middle">+1</text>` : ''}<rect x="${z.x + g}" y="${z.y + g}" width="${z.w - 2 * g}" height="${z.h - 2 * g}" rx="8" fill="${fill}"/>
          <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="15" font-weight="700" fill="${ink}" font-family="Geologica">${live.seats ? `${n}/${live.seats}` : 'Agora'}</text><text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${ink}">${full ? 'lotada' : esc(live.short.length > 17 ? `${live.short.slice(0, 16).trim()}…` : live.short)}</text></g>`;
        })
        .join('');
      const alvos = f.zones
        .filter(editavel)
        .map(
          (z) =>
            `<rect class="alvo${state.room === z.id ? ' on' : ''}" tabindex="0" data-act="room" data-zone="${z.id}" data-tip="${esc(roomName(z))}" x="${z.x + 3}" y="${z.y + 3}" width="${z.w - 6}" height="${z.h - 6}" rx="8"/>`,
        )
        .join('');
      const sel =
        state.room &&
        D.sessions
          .filter((x) => x.floor === state.floor && x.zone === state.room)
          .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
      const zr = state.room && f.zones.find((z) => z.id === state.room);
      const zname = zr && (zr.roomNumber ? roomName(zr) : zr.label);
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Andar">${P.floors.map((q) => `<button type="button" data-act="floor" data-v="${q.level}" aria-pressed="${q.level === state.floor}">${q.label}</button>`).join('')}</div>
          <span class="count">${today.filter(isNow).length} agora</span></div>
        <div class="plan-wrap"><div><div class="plan"><svg viewBox="${P.viewBox || '0 0 900 430'}" role="img" aria-label="Planta do ${f.label} com a lotação das salas">${P.defs}${f.svg}${alvos}${overlays}</svg></div>
          <div class="plan-legend"><span>Lotação</span><span class="ramp">${RAMP.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span>vazia → cheia</span><span class="pill full">${ic('alert')}90% ou mais</span><span class="pill ifrn">Tracejado: mais tarde</span></div></div>
          <aside class="room-panel">${
            zr
              ? (() => {
                  const k = `${state.floor}:${zr.id}`;
                  const KIND = {
                    classroom: 'Sala de aula',
                    laboratory: 'Laboratório',
                    staff: 'Professores',
                    office: 'Setor',
                    auditorium: 'Auditório',
                    reception: 'Recepção',
                    lounge: 'Área de descanso',
                  };
                  return `<h3>${esc(zname)}</h3><p>${f.label} · ${esc(zr.name && zr.roomNumber ? zr.name : KIND[zr.kind] || zr.kind)}</p>
            ${zr.roomNumber ? `<label class="fld rp-num">Número na porta<span class="rp-num-in"><input class="num-in" data-room-num="${k}" value="${esc(zr.roomNumber)}" maxlength="12" aria-label="Número de ${esc(zname)}">${ORG.rooms[k] ? `<button class="btn ghost sm" type="button" data-act="roomreset" data-k="${k}">Restaurar</button>` : ''}</span><small>${zr.orgNumber ? 'Definido pela organização' : zr.confirmed ? 'Confirmado' : 'A confirmar · digite e saia do campo para salvar'}</small></label>` : ''}
            <div class="rp-h"><b>Atividades aqui</b><button class="btn primary sm" type="button" data-act="ativ" data-sala="${state.floor}|${zr.id}">${ic('plus')}Cadastrar</button></div>
            ${sel.length ? `<ul>${sel.map((x) => `<li><b>${esc(x.short)}</b>${dayOf(x.day).week} ${x.day} · ${x.time} às ${x.end} · ${statusOf(x)}${x.seats && x.day === D.now.day ? `<div class="mt"><small>Inscritos</small>${meter(x)}${isNow(x) ? `<small>${present(x)} em sala agora</small>` : ''}</div>` : ''}<div class="mt rp-acts"><button class="btn soft sm" data-act="ativ" data-id="${x.id}" type="button">${ic('edit')}Editar</button>${!isPast(x) ? `<button class="btn soft sm" data-act="move" data-id="${x.id}" type="button">${ic('route')}Trocar sala</button>` : ''}</div></li>`).join('')}</ul>` : '<p class="rp-vazio">Nenhuma atividade nesta sala.</p>'}`;
                })()
              : `<h3>Toque numa sala</h3><p>Para mudar o número, ver o que acontece nela ou cadastrar uma atividade.</p>`
          }</aside></div></section>`;
    },
    programacao() {
      const list = D.sessions.filter((x) => x.day === state.day).sort((a, b) => a.time.localeCompare(b.time));
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Dia">${D.days.map((d) => `<button type="button" data-act="day" data-v="${d.day}" aria-pressed="${d.day === state.day}">${d.week} ${d.day}</button>`).join('')}</div>
        <span class="count">${list.length} atividades</span><button class="btn soft sm" data-act="csv" data-v="programacao" type="button">${ic('download')}Exportar CSV</button><button class="btn primary sm" data-act="ativ" type="button">${ic('plus')}Nova atividade</button></div>
        <div class="tbl-wrap"><table><thead><tr><th>Horário</th><th>Atividade</th><th>Tipo</th><th>Local</th><th>Inscritos</th><th>Situação</th><th></th></tr></thead><tbody>
        ${list
          .map(
            (
              x,
            ) => `<tr><td class="num">${x.time}–${x.end}</td><td class="title"><b>${esc(x.title)}</b><small>${esc(x.speaker || 'Organização')}</small></td><td>${esc(x.type)}</td><td>${esc(where(x))}</td><td>${x.seats ? meter(x) : '<small>sem limite</small>'}</td><td>${statusOf(x)}</td>
          <td class="r"><span class="row-acts"><button class="btn ghost sm" data-act="ativ" data-id="${x.id}" type="button">${ic('edit')}Editar</button>${x.floor !== undefined && !isPast(x) ? `<button class="btn ghost sm" data-act="move" data-id="${x.id}" type="button">Trocar sala</button>` : ''}</span></td></tr>`,
          )
          .join('')}
        </tbody></table></div></section>`;
    },
    participantes() {
      const q = state.q.trim().toLowerCase();
      const list = PEOPLE.filter(
        (p) =>
          (state.ptype === 'todos' || (state.ptype === 'ifrn') === p.ifrn) &&
          (state.pstat === 'todos' || (state.pstat === 'cred') === !!credOf(p)) &&
          (!q || `${p.name} ${p.id} ${p.email}`.toLowerCase().includes(q)),
      );
      const seg = (k, opts) =>
        `<div class="seg" role="group">${opts.map(([v, t]) => `<button type="button" data-act="${k}" data-v="${v}" aria-pressed="${state[k] === v}">${t}</button>`).join('')}</div>`;
      return `<section class="card"><div class="toolbar">${seg('ptype', [
        ['todos', 'Todos'],
        ['ifrn', 'IFRN'],
        ['vis', 'Visitantes'],
      ])}${seg('pstat', [
        ['todos', 'Todos'],
        ['cred', 'Credenciados'],
        ['pend', 'Pendentes'],
      ])}
        <span class="count">${list.length} ${list.length === 1 ? 'pessoa' : 'pessoas'}${q ? ` para “${esc(state.q)}”` : ''}</span><button class="btn soft sm" data-act="csv" data-v="participantes" type="button">${ic('download')}Exportar CSV</button></div>
        ${
          list.length
            ? `<div class="tbl-wrap"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Matrícula ou código</th><th>Credenciamento</th><th></th></tr></thead><tbody>
        ${list
          .slice(0, state.limit)
          .map((p) => {
            const c = credOf(p);
            return `<tr><td class="title"><b>${esc(p.name)}${p.here ? ' <span class="pill vis">neste aparelho</span>' : ''}</b><small>${esc(p.email)}</small></td>
          <td>${p.ifrn ? `<span class="pill ifrn">IFRN</span> ${esc(p.course)}` : `<span class="pill vis">Visitante</span> ${esc(p.kind || '')} · ${esc(p.city || '')}`}</td><td class="num">${esc(p.id)}</td>
          <td>${c ? `<span class="pill ok">${ic('check')}às ${c}</span>` : '<span class="pill wait">Pendente</span>'}</td>
          <td class="r">${c ? '' : `<button class="btn soft sm" data-act="cred" data-id="${esc(p.id)}" type="button">Credenciar</button>`}</td></tr>`;
          })
          .join('')}
        </tbody></table></div>${list.length > state.limit ? `<p class="empty"><button class="btn soft" data-act="more" type="button">Mostrar mais ${Math.min(40, list.length - state.limit)}</button></p>` : ''}`
            : `<p class="empty">Ninguém encontrado. Confira o nome, a matrícula ou o e-mail.</p>`
        }</section>`;
    },
    campeonatos() {
      return D.tournaments.map(tourCard).join('');
    },
    avisos() {
      const opts = D.sessions.filter((x) => x.day === D.now.day && !isPast(x) && x.seats);
      return `<div class="grid g-2"><section class="card"><h2>Enviar aviso</h2>
          <form class="compose" data-form="notice"><label class="fld">Título<input name="title" maxlength="70" required placeholder="Ex.: Palestra de encerramento às 17:00"></label>
          <label class="fld">Texto<textarea name="text" rows="3" maxlength="200" placeholder="Detalhes para quem está no evento"></textarea></label>
          <label class="fld">Para quem<select name="to"><option value="">Todos os participantes</option>${opts.map((x) => `<option value="${x.id}">Inscritos em ${esc(x.short)} (${x.taken})</option>`).join('')}</select></label>
          <div><button class="btn primary" type="submit">${ic('bell')}Enviar aviso</button></div></form></section>
        <section class="card"><h2>Enviados e programados</h2>${feed()}</section></div>`;
    },
  };
  /* ---------- campeonatos ----------
     Tudo num clique: clicar no jogador marca quem venceu (clicar de novo desfaz); os campos salvam ao sair.
     O estado fica em ORG.torneios e o app aberto neste navegador atualiza na hora. */
  const T = window.TOUR;
  const tourOf = (id) => D.tournaments.find((t) => t.id === id);
  function tourSet(id, fn) {
    const st = T.state(tourOf(id), ORG);
    fn(st);
    /* resultado que ficou sem os dois jogadores deixa de valer */
    const R = T.rounds(st);
    [...R.q, ...R.s, R.f].forEach((m) => {
      if (m.w === null) delete st.res[m.k];
    });
    ORG.torneios = {
      ...(ORG.torneios || {}),
      [id]: { ...((ORG.torneios || {})[id] || {}), open: st.open, players: st.players, res: st.res },
    }; // mantém as regras editadas no celular
    save();
    render();
  }
  const ini = (name) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?';
  function tourCard(t) {
    const st = T.state(t, ORG);
    const R = T.rounds(st);
    const [k, label] = T.status(st);
    const side = (m, i) => {
      const p = i ? m.b : m.a;
      const ready = m.a && m.b;
      return p
        ? `<button type="button" class="tm-p ${m.w === i ? 'win' : m.w === null ? '' : 'lose'}" ${ready ? `data-act="twin" data-id="${t.id}" data-k="${m.k}" data-v="${i}"` : 'disabled'} title="${ready ? (m.w === i ? 'Clique para desfazer' : 'Clique para marcar como vencedor') : 'Falta o adversário'}"><i>${esc(p[2])}</i><b>${esc(p[0])}</b>${m.w === i ? ic('check') : ''}</button>`
        : `<span class="tm-p none">${m.k[0] === 'q' ? 'Vaga aberta' : 'A definir'}</span>`;
    };
    const match = (m, title) =>
      `<div class="tm ${m.w !== null ? 'done' : ''}"><small>${title}</small>${side(m, 0)}${side(m, 1)}</div>`;
    const row = (p, i) => `<tr><td class="num">${i + 1}</td>
      <td><input data-tp="${t.id}:${i}:0" value="${esc(p ? p[0] : '')}" placeholder="Apelido" maxlength="14" aria-label="Apelido da vaga ${i + 1}"></td>
      <td><input data-tp="${t.id}:${i}:1" value="${esc(p ? p[1] : '')}" placeholder="Nome completo" maxlength="40" aria-label="Nome da vaga ${i + 1}"></td>
      <td><input data-tp="${t.id}:${i}:3" value="${esc(p ? p[3] || '' : '')}" placeholder="${esc(t.pickLabel)}" maxlength="20" list="picks-${t.id}" aria-label="${esc(t.pickLabel)} da vaga ${i + 1}"></td>
      <td>${p ? `${p[4] ? '<span class="pill vis">pelo app</span>' : ''}<button type="button" class="btn ghost" data-act="tdel" data-id="${t.id}" data-v="${i}" title="Tirar da chave">Tirar</button>` : '<span class="pill wait">vaga</span>'}</td></tr>`;
    return `<section class="card tour-adm">
      <h2>${esc(t.name)} <span class="pill ${k === 'live' ? 'live' : k === 'open' ? 'ok' : 'wait'}">${label}</span>
        <small>${dayOf(t.day).week} ${t.day} · ${t.time} · ${esc(t.place)}</small></h2>
      <div class="toolbar">
        <button type="button" class="btn ${st.open ? 'primary' : 'soft'}" data-act="topen" data-id="${t.id}" aria-pressed="${st.open}">${st.open ? 'Inscrições abertas' : 'Inscrições fechadas'}</button>
        <button type="button" class="btn soft" data-act="tshuffle" data-id="${t.id}" ${R.played ? 'disabled title="Zere os resultados para sortear de novo"' : ''}>Sortear confrontos</button>
        <button type="button" class="btn soft" data-act="tclear" data-id="${t.id}" ${R.played ? '' : 'disabled'}>Zerar resultados</button>
        ${R.champ ? `<button type="button" class="btn primary" data-act="tannounce" data-id="${t.id}">${ic('bell')}Avisar o campeão</button>` : ''}
        <button type="button" class="btn ghost" data-act="treset" data-id="${t.id}">Restaurar o exemplo</button>
      </div>
      <div class="tour-grid">
        <div><h3>Jogadores <small>${8 - st.free} de 8 · digite e saia do campo para salvar</small></h3>
          <div class="tbl-wrap"><table class="tplayers"><thead><tr><th></th><th>Apelido</th><th>Nome</th><th>${esc(t.pickLabel)}</th><th></th></tr></thead><tbody>${st.players.map(row).join('')}</tbody></table></div>
          <datalist id="picks-${t.id}">${t.picks.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
        <div><h3>Chave <small>clique em quem venceu</small></h3>
          <div class="tm-cols"><div>${R.q.map((m, i) => match(m, `Quartas ${i + 1} · ${t.times[i]}`)).join('')}</div>
            <div class="mid">${R.s.map((m, i) => match(m, `Semifinal ${i + 1}`)).join('')}</div>
            <div class="mid">${match(R.f, 'Final')}${R.champ ? `<p class="tm-champ">${ic('trophy')}<b>${esc(R.champ[0])}</b> é o campeão</p>` : ''}</div></div></div>
      </div></section>`;
  }

  function nowTable(now) {
    if (!now.length) return '<p class="empty">Nenhuma atividade com vagas acontecendo agora.</p>';
    return `<div class="tbl-wrap"><table><thead><tr><th>Atividade</th><th>Local</th><th>Em sala</th><th></th></tr></thead><tbody>${now
      .map((x) => {
        const n = present(x);
        const pc = Math.round((n / x.seats) * 100);
        return `<tr><td class="title"><b>${esc(x.short)}</b><small>${x.time} às ${x.end}</small></td><td>${esc(where(x))}</td><td><div class="meter ${pc >= 90 ? 'full' : ''}"><span class="track"><i style="width:${pc}%"></i></span><b>${n}/${x.seats}</b></div></td><td class="r"><button class="btn ghost sm" data-act="move" data-id="${x.id}" type="button">Trocar sala</button></td></tr>`;
      })
      .join('')}</tbody></table></div>`;
  }
  function feed(limit) {
    const list = [...ORG.notices.map((n) => ({ ...n, org: true })), ...D.notices].slice(0, limit || 99);
    return `<ul class="feed">${list.map((n) => `<li class="${n.org ? 'org' : ''}"><time>${n.time}</time><span><b>${esc(n.title)}</b><small>${esc(n.text)}${n.to ? ` · para ${esc(n.to)}` : ''}</small></span></li>`).join('')}</ul>`;
  }

  /* ---------- ações ---------- */
  const toast = (m) => {
    const t = $('#toast');
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('on'), 2400);
  };
  const stamp = () => D.now.time;
  const API = window.ETAL_API; // null: painel de demonstração, tudo neste navegador
  function sendNotice(title, text, to, activity) {
    if (API) {
      API.post('/api/org/avisos', {
        titulo: title,
        texto: text || 'Aviso da organização do ETAL.',
        atividade: activity || null,
      })
        .then(() => toast('Aviso enviado para todos'))
        .catch((x) => toast(x.message));
      return;
    }
    ORG.notices.unshift({
      id: `n${Date.now()}`,
      time: stamp(),
      title,
      text: text || 'Aviso da organização do ETAL.',
      to: to || '',
    });
    save();
    render();
    toast('Aviso enviado');
  }
  function moveDialog(id) {
    const x = D.sessions.find((s) => s.id === id);
    const dlg = $('#dlg');
    dlg.className = '';
    const busy = new Set(
      D.sessions
        .filter(
          (s) =>
            s.id !== id &&
            s.day === x.day &&
            s.floor !== undefined &&
            toMin(s.time) < toMin(x.end) &&
            toMin(x.time) < toMin(s.end),
        )
        .map((s) => `${s.floor}|${s.zone}`),
    );
    dlg.innerHTML = `<form method="dialog" data-form="move" data-id="${id}"><h2>Trocar sala</h2><p>${esc(x.title)} · hoje em ${esc(where(x))}, das ${x.time} às ${x.end}.</p>
      <label class="fld">Nova sala<select name="room">${roomsAll()
        .map((r) => {
          const k = `${r.floor}|${r.zone}`;
          return `<option value="${k}" ${busy.has(k) || (r.zone === x.zone && r.floor === x.floor) ? 'disabled' : ''}>${r.name} · ${floorLabel(r.floor)}${busy.has(k) ? ' (ocupada no horário)' : ''}</option>`;
        })
        .join('')}</select></label>
      <label class="fld mt"><span><input type="checkbox" name="warn" checked> Avisar os ${x.taken || ''} inscritos pelo app</span></label>
      <div class="acts"><button class="btn soft" value="cancel" type="button" data-act="close">Cancelar</button><button class="btn primary" type="submit">${ic('route')}Trocar sala</button></div></form>`;
    dlg.showModal();
  }
  /* Cadastro e edição de atividade, com a lista de materiais. Com servidor vai para /api/org/atividades; sem ele, para
     etal-org.atividades, que o app também lê. */
  const TIPOS_ATIV = ['Palestra', 'Minicurso', 'Oficina', 'Mesa-redonda', 'Apresentação', 'Abertura', 'Encerramento'];
  /* Materiais: link (GitHub, YouTube, site) ou arquivo anexado (PDF, imagem, ZIP, slides). Anexos já enviados ficam como estão. */
  const MAT_TIPOS = { pdf: 'PDF', imagem: 'Imagem', zip: 'ZIP', slides: 'Slides', texto: 'Texto', link: 'Link' };
  const ACEITA = '.pdf,.png,.jpg,.jpeg,.webp,.zip,.ppt,.pptx,.txt';
  const matRow = (m = {}) => {
    const anexo =
      m.file ||
      (m.url && (m.url.startsWith('data:') || m.url.startsWith('/api/arquivos/') || m.url.startsWith('assets/')));
    if (anexo)
      return `<div class="mat-row anexo" data-file="${esc(m.file || '')}" data-url="${esc(m.url || '')}" data-kind="${esc(m.kind || 'pdf')}" data-mime="${esc(m.mime || '')}" data-meta="${esc(m.meta || '')}">
      <span class="mat-ic k-${esc(m.kind || 'pdf')}">${ic('file')}</span><input name="mname" maxlength="120" value="${esc(m.name || '')}" aria-label="Nome do material"><small>${esc(m.meta || MAT_TIPOS[m.kind] || 'Arquivo')}</small>
      <button type="button" class="btn ghost sm icon-only" data-act="matdel" aria-label="Remover material">${ic('x')}</button></div>`;
    if (m.novo)
      return `<div class="mat-row novo"><span class="mat-ic k-pdf">${ic('file')}</span><input name="mname" placeholder="Nome (ex.: Slides da aula)" maxlength="120"><label class="mat-pick">${ic('plus')}<span>Escolher arquivo</span><input type="file" name="mfile" accept="${ACEITA}" hidden></label>
      <button type="button" class="btn ghost sm icon-only" data-act="matdel" aria-label="Remover material">${ic('x')}</button></div>`;
    return `<div class="mat-row link"><span class="mat-ic k-link">${ic('link')}</span><input name="mname" placeholder="Nome (ex.: Repositório no GitHub)" maxlength="120" value="${esc(m.name || '')}"><input name="murl" type="url" placeholder="https://github.com/…" maxlength="500" value="${esc(m.url || '')}">
      <button type="button" class="btn ghost sm icon-only" data-act="matdel" aria-label="Remover material">${ic('x')}</button></div>`;
  };
  const tipoDoArquivo = (f) =>
    /pdf/.test(f.type)
      ? 'pdf'
      : /^image\//.test(f.type)
        ? 'imagem'
        : /zip/.test(f.type)
          ? 'zip'
          : /presentation|powerpoint/.test(f.type)
            ? 'slides'
            : 'texto';
  const tamanho = (n) =>
    n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
  const lerDataURL = (f) =>
    new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = no;
      r.readAsDataURL(f);
    });
  function activityDialog(id, salaPre) {
    const x = id ? D.sessions.find((s) => s.id === id) : null;
    const dlg = $('#dlg');
    dlg.className = 'wide';
    const v = (k, d = '') => esc(x?.[k] ?? d);
    const req = Array.isArray(x?.prerequisites) ? x.prerequisites.join('\n') : x?.requirements || '';
    const salaSel = x && x.floor !== undefined ? `${x.floor}|${x.zone}` : salaPre || '';
    dlg.innerHTML = `<form method="dialog" data-form="ativ" ${id ? `data-id="${esc(id)}"` : ''}><h2>${id ? 'Editar atividade' : 'Nova atividade'}</h2>
      <label class="fld">Título<input name="titulo" required minlength="2" maxlength="300" value="${v('title')}"></label>
      <div class="row mt"><label class="fld">Tipo<select name="tipo">${[...new Set([...(x ? [x.type] : []), ...TIPOS_ATIV])].map((t) => `<option ${x?.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label class="fld">Nome curto<input name="curto" maxlength="120" placeholder="Opcional" value="${v('short')}"></label></div>
      <div class="row mt"><label class="fld">Dia<select name="dia">${D.days.map((d) => `<option value="${d.day}" ${(x ? x.day : state.day) === d.day ? 'selected' : ''}>${d.week} ${d.day}</option>`).join('')}</select></label>
        <label class="fld">Início<input name="inicio" type="time" required value="${v('time', '14:00')}"></label><label class="fld">Fim<input name="fim" type="time" required value="${v('end', '15:00')}"></label></div>
      <div class="row mt"><label class="fld">Sala<select name="sala"><option value="">Outro local</option>${placesAll()
        .map(
          (r) =>
            `<option value="${r.floor}|${r.zone}" ${salaSel === `${r.floor}|${r.zone}` ? 'selected' : ''}>${esc(r.name)} · ${floorLabel(r.floor)}</option>`,
        )
        .join('')}</select></label>
        <label class="fld">Outro local<input name="local" maxlength="120" placeholder="Ex.: Pátio coberto" value="${x && x.floor === undefined ? v('room') : ''}"></label></div>
      <div class="row mt"><label class="fld">Quem conduz<input name="palestrante" maxlength="200" value="${v('speaker')}"></label><label class="fld">Vagas<input name="vagas" type="number" min="1" max="5000" placeholder="Sem limite" value="${x?.seats || ''}"></label></div>
      <label class="fld mt">Sobre<textarea name="descricao" rows="3" maxlength="4000">${v('description')}</textarea></label>
      <label class="fld mt">O que levar<textarea name="requisitos" rows="2" maxlength="1000">${esc(req)}</textarea></label>
      <div class="mats-ed mt"><div class="mats-h"><b>${ic('file')}Materiais</b><span class="mats-bts"><button type="button" class="btn soft sm" data-act="matfile">${ic('file')}Anexar arquivo</button><button type="button" class="btn soft sm" data-act="matadd">${ic('link')}Adicionar link</button></span></div>
        <div class="mats-list">${(x?.materials || []).map(matRow).join('') || '<p class="mats-vazio">Nenhum material ainda.</p>'}</div></div>
      <div class="acts"><button class="btn soft" type="button" data-act="close">Cancelar</button><button class="btn primary" type="submit">${ic('check')}${id ? 'Salvar' : 'Cadastrar'}</button></div></form>`;
    dlg.showModal();
  }
  function activityForm(f) {
    const d = new FormData(f);
    const t = (k) => String(d.get(k) || '').trim();
    const [fl, zone] = t('sala') ? t('sala').split('|') : [];
    const r = zone ? placesAll().find((q) => q.zone === zone && q.floor === +fl) : null;
    const mats = [...f.querySelectorAll('.mat-row:not(.novo)')]
      .map((row) => {
        const nome = row.querySelector('[name=mname]').value.trim();
        if (row.classList.contains('anexo'))
          return {
            tipo: row.dataset.kind,
            nome: nome || 'Material',
            arquivo: row.dataset.file || null,
            url: row.dataset.file ? null : row.dataset.url,
            mime: row.dataset.mime || null,
            detalhe: row.dataset.meta || null,
          };
        const url = row.querySelector('[name=murl]').value.trim();
        return url ? { tipo: 'link', nome: nome || url.replace(/^https?:\/\//, '').slice(0, 60), url } : null;
      })
      .filter(Boolean);
    const novos = [...f.querySelectorAll('.mat-row.novo')]
      .map((row) => ({
        arquivo: row.querySelector('[name=mfile]').files[0],
        nome: row.querySelector('[name=mname]').value.trim(),
      }))
      .filter((x) => x.arquivo);
    const dia = +t('dia');
    const base = (D.sessions.find((s) => s.date) || {}).date || '2025-11-26';
    return {
      titulo: t('titulo'),
      curto: t('curto') || null,
      tipo: t('tipo'),
      data: `${base.slice(0, 8)}${String(dia).padStart(2, '0')}`,
      dia,
      inicio: t('inicio'),
      fim: t('fim'),
      sala: r ? r.name : t('local') || null,
      andar: r ? r.floor : null,
      zona: r ? r.zone : null,
      palestrante: t('palestrante') || null,
      descricao: t('descricao') || null,
      requisitos: t('requisitos') || null,
      vagas: t('vagas') ? +t('vagas') : null,
      materiais: mats,
      novos,
    };
  }
  /* sem servidor: monta a atividade no formato do app */
  function activityLocal(b, id) {
    const old = id ? D.sessions.find((s) => s.id === id) : null;
    const slug =
      b.titulo
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'atividade';
    let nid = id || slug;
    for (let k = 2; !id && D.sessions.some((s) => s.id === nid); k++) nid = `${slug}-${k}`;
    const ws = (b.palestrante || '').split(/\s+/).filter(Boolean);
    const a = {
      id: nid,
      type: b.tipo,
      title: b.titulo,
      short: b.curto || b.titulo.slice(0, 120),
      day: b.dia,
      date: b.data,
      time: b.inicio,
      end: b.fim,
      room: b.sala || 'A definir',
      speaker: b.palestrante || undefined,
      speakerShort: ws.length ? (ws.length > 1 ? `${ws[0]} ${ws[ws.length - 1]}` : ws[0]) : undefined,
      initials: ws.length ? (ws[0][0] + (ws.length > 1 ? ws[ws.length - 1][0] : '')).toUpperCase() : undefined,
      description: b.descricao || '',
      requirements: b.requisitos || '',
      seats: b.vagas || undefined,
      floor: b.andar ?? undefined,
      zone: b.zona || undefined,
      materials: b.materiais.map((m) => ({
        kind: m.tipo,
        name: m.nome,
        url: m.url,
        meta: m.detalhe || MAT_TIPOS[m.tipo],
      })),
      learn: old?.learn || [],
      taken: old?.taken || 0,
    };
    if (old) {
      delete old.floor;
      delete old.zone;
      delete old.prerequisites;
    }
    return a;
  }
  function csv(kind) {
    const rows =
      kind === 'programacao'
        ? [
            ['dia', 'inicio', 'fim', 'atividade', 'tipo', 'local', 'inscritos', 'vagas', 'exemplo'],
            ...D.sessions.map((x) => [
              x.day,
              x.time,
              x.end,
              x.title,
              x.type,
              where(x),
              x.taken || '',
              x.seats || '',
              x.demo ? 'sim' : 'não',
            ]),
          ]
        : [
            ['nome', 'perfil', 'curso_ou_cidade', 'matricula_ou_codigo', 'email', 'credenciado_as'],
            ...PEOPLE.map((p) => [
              p.name,
              p.ifrn ? 'IFRN' : 'Visitante',
              p.ifrn ? p.course : p.city,
              p.id,
              p.email,
              credOf(p) || '',
            ]),
          ];
    const text = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' }));
    a.download = `etal-${kind}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Arquivo CSV baixado');
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const a = el.dataset.act;
    if (a === 'social-mod-filter') {
      socialModFilter = el.dataset.filter;
      render();
      return;
    }
    if (a === 'social-mod') {
      const note = el.closest('[data-mod-target]')?.querySelector('[data-mod-note]')?.value || '';
      if (API) {
        API.post('/api/publicacoes/moderar', { alvo: el.dataset.target, acao: el.dataset.action, nota: note })
          .then(() => {
            toast('Revisão salva');
            return socialCarregar();
          })
          .catch((x) => toast(x.message));
        return;
      }
      try {
        window.COMMUNITY.write((v) =>
          window.COMMUNITY.moderate(v, el.dataset.target, el.dataset.action, 'Organização · painel local', note),
        );
        render();
        toast('Revisão salva neste navegador');
      } catch (error) {
        toast(error.message);
      }
      return;
    }
    if (a === 'mais') {
      maisSheet();
      return;
    }
    if (a === 'tema') {
      trocarTema();
      return;
    }
    if (a === 'compose') {
      location.hash = '#avisos';
      setTimeout(() => $('[name=title]')?.focus(), 60);
    }
    if (a === 'floor') {
      state.floor = +el.dataset.v;
      state.room = null;
      render();
    }
    if (a === 'roomreset') {
      if (API) {
        API.put('/api/org/salas', { [el.dataset.k]: '' }).catch((x) => toast(x.message));
        return;
      }
      delete ORG.rooms[el.dataset.k];
      save();
      applyRooms();
      render();
      toast('Número restaurado');
    }
    if (a === 'room') {
      state.room = el.dataset.zone;
      render();
    }
    if (a === 'day') {
      state.day = +el.dataset.v;
      render();
    }
    if (a === 'ptype' || a === 'pstat') {
      state[a] = el.dataset.v;
      state.limit = 40;
      render();
    }
    if (a === 'more') {
      state.limit += 40;
      render();
    }
    if (a === 'move') moveDialog(el.dataset.id);
    if (a === 'ativ') activityDialog(el.dataset.id, el.dataset.sala);
    if (a === 'matadd' || a === 'matfile') {
      const l = el.closest('form').querySelector('.mats-list');
      l.querySelector('.mats-vazio')?.remove();
      l.insertAdjacentHTML('beforeend', matRow(a === 'matfile' ? { novo: true } : {}));
      const row = l.lastElementChild;
      if (a === 'matfile') row.querySelector('[name=mfile]').click();
      else row.querySelector('[name=murl]').focus();
    }
    if (a === 'matdel') el.closest('.mat-row').remove();
    if (a === 'close') $('#dlg').close();
    if (a === 'csv') csv(el.dataset.v);
    /* campeonatos */
    const tid = el.dataset.id;
    if (a === 'twin')
      tourSet(tid, (st) => {
        const k = el.dataset.k,
          v = +el.dataset.v;
        if (st.res[k] === v) delete st.res[k];
        else st.res[k] = v;
        if (k[0] === 'q') {
          delete st.res[`s${Math.floor(+k[1] / 2)}`];
          delete st.res.f;
        }
        if (k[0] === 's') delete st.res.f;
      });
    if (a === 'topen') {
      tourSet(tid, (st) => {
        st.open = !st.open;
      });
      toast(T.state(tourOf(tid), ORG).open ? 'Inscrições abertas' : 'Inscrições fechadas');
    }
    if (a === 'tdel')
      tourSet(tid, (st) => {
        st.players[+el.dataset.v] = null;
      });
    if (a === 'tclear') {
      tourSet(tid, (st) => {
        st.res = {};
      });
      toast('Resultados zerados');
    }
    if (a === 'tshuffle') {
      tourSet(tid, (st) => {
        const ps = st.players.filter(Boolean);
        for (let i = ps.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ps[i], ps[j]] = [ps[j], ps[i]];
        }
        st.players = [...ps, ...Array(8 - ps.length).fill(null)];
      });
      toast('Confrontos sorteados');
    }
    if (a === 'treset') {
      delete (ORG.torneios || {})[tid];
      save();
      render();
      toast('Exemplo restaurado');
    }
    if (a === 'tannounce') {
      const t = tourOf(tid);
      const c = T.rounds(T.state(t, ORG)).champ;
      sendNotice(
        `${c[0]} venceu o campeonato de ${t.name}`,
        `Parabéns, ${c[1]}! Obrigado a quem jogou e a quem veio torcer.`,
        '',
      );
    }
    if (a === 'cred') {
      const p = PEOPLE.find((q) => q.id === el.dataset.id);
      ORG.creds[p.id] = stamp();
      save();
      render();
      toast(`Credenciamento de ${p.name.split(' ')[0]} confirmado às ${stamp()}`);
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.occ')) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'notice') {
      e.preventDefault();
      const d = new FormData(f);
      const to = D.sessions.find((x) => x.id === d.get('to'));
      sendNotice(d.get('title').trim(), d.get('text').trim(), to ? `inscritos em ${to.short}` : '', to ? to.id : null);
    }
    if (f.dataset.form === 'ativ') {
      e.preventDefault();
      const id = f.dataset.id;
      const b = activityForm(f);
      if (b.inicio >= b.fim) {
        toast('O fim precisa ser depois do início.');
        return;
      }
      const grande = b.novos.find((x) => x.arquivo.size > (API ? 15 : 2) * 1048576);
      if (grande) {
        toast(API ? 'Arquivo acima de 15 MB.' : 'Sem servidor, anexe arquivos de até 2 MB.');
        return;
      }
      const { dia, novos, ...corpo } = b;
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true;
      const fim = (x, msg) => {
        $('#dlg').close();
        const i = D.sessions.findIndex((s) => s.id === x.id);
        if (i >= 0) D.sessions[i] = x;
        else D.sessions.push(x);
        state.day = x.day;
        render();
        toast(msg);
      };
      if (API) {
        (async () => {
          let x = await (id
            ? API.patch(`/api/org/atividades/${encodeURIComponent(id)}`, corpo)
            : API.post('/api/org/atividades', corpo));
          for (const n of novos) {
            toast(`Enviando ${n.arquivo.name}…`);
            x = await API.enviar(
              `/api/org/atividades/${encodeURIComponent(x.id)}/arquivos?nome=${encodeURIComponent(n.nome || n.arquivo.name.replace(/\.[^.]+$/, ''))}`,
              n.arquivo,
            );
          }
          fim(x, id ? 'Atividade atualizada' : 'Atividade cadastrada');
        })().catch((x2) => {
          btn.disabled = false;
          toast(x2.message);
        });
        return;
      }
      (async () => {
        for (const n of novos)
          corpo.materiais.push({
            tipo: tipoDoArquivo(n.arquivo),
            nome: n.nome || n.arquivo.name.replace(/\.[^.]+$/, ''),
            url: await lerDataURL(n.arquivo),
            detalhe: `${MAT_TIPOS[tipoDoArquivo(n.arquivo)]} · ${tamanho(n.arquivo.size)}`,
          });
        const a = activityLocal({ ...corpo, dia }, id);
        ORG.atividades = { ...(ORG.atividades || {}), [a.id]: a };
        try {
          save();
        } catch (_) {
          /* cheio */
        }
        applyActivities();
        fim(a, id ? 'Atividade atualizada' : 'Atividade cadastrada');
      })().catch(() => {
        btn.disabled = false;
        toast('Não foi possível ler o arquivo.');
      });
      return;
    }
    if (f.dataset.form === 'move') {
      e.preventDefault();
      const x = D.sessions.find((s) => s.id === f.dataset.id);
      const d = new FormData(f);
      const [fl, zone] = String(d.get('room')).split('|');
      const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
      const from = where(x);
      if (API) {
        $('#dlg').close();
        API.patch(`/api/org/atividades/${encodeURIComponent(x.id)}/sala`, {
          andar: r.floor,
          zona: r.zone,
          sala: r.name,
          avisar: !!d.get('warn'),
        })
          .then(() => toast(d.get('warn') ? 'Sala trocada e inscritos avisados' : 'Sala trocada'))
          .catch((x2) => toast(x2.message));
        return;
      }
      ORG.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name };
      Object.assign(x, ORG.moves[x.id]);
      $('#dlg').close();
      if (d.get('warn'))
        sendNotice(
          'Mudança de sala',
          `${x.short}: agora em ${r.name}, ${floorLabel(r.floor)}. Antes era ${from}.`,
          `inscritos em ${x.short}`,
        );
      else {
        save();
        render();
        toast('Sala trocada');
      }
    }
  });
  document.addEventListener('change', (e) => {
    const inp = e.target;
    if (inp.name !== 'mfile' || !inp.files[0]) return;
    const f = inp.files[0];
    const row = inp.closest('.mat-row');
    const k = tipoDoArquivo(f);
    row.querySelector('.mat-pick span').textContent = `${f.name} · ${tamanho(f.size)}`;
    row.querySelector('.mat-pick').classList.add('ok');
    row.querySelector('.mat-ic').className = `mat-ic k-${k}`;
    const nome = row.querySelector('[name=mname]');
    if (!nome.value.trim()) nome.value = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  });
  document.addEventListener('input', (e) => {});
  /* Número de sala: salva ao sair do campo ou com Enter. */
  /* Jogador do campeonato: salva ao sair do campo. Apelido vazio tira a pessoa da chave. */
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.matches('[data-tp]')) return;
    const [id, i, f] = el.dataset.tp.split(':');
    const v = el.value.trim();
    tourSet(id, (st) => {
      const p = st.players[+i] ? [...st.players[+i]] : ['', '', '', ''];
      p[+f] = v;
      if (!p[0] && +f === 1 && v) p[0] = v.split(' ')[0].slice(0, 14);
      if (!p[0]) {
        st.players[+i] = null;
        return;
      }
      p[2] = ini(p[1] || p[0]);
      st.players[+i] = p;
    });
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.matches('[data-room-num]')) return;
    const k = el.dataset.roomNum;
    const v = el.value.trim().slice(0, 12);
    const z = P.floors[+k.split(':')[0]].zones.find((q) => q.id === k.split(':')[1]);
    if (API) {
      API.put('/api/org/salas', { [k]: v && v !== z.num0 ? v : '' })
        .then(() => toast(v && v !== z.num0 ? `Agora é ${v}` : 'Número restaurado'))
        .catch((x) => toast(x.message));
      return;
    }
    if (!v || v === z.num0) delete ORG.rooms[k];
    else ORG.rooms[k] = v;
    save();
    applyRooms();
    render();
    toast(v && v !== z.num0 ? `Agora é ${roomName(z)}` : 'Número restaurado');
  });
  $('#q').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.limit = 40;
    if (current() !== 'participantes') location.hash = '#participantes';
    else render();
  });

  function render() {
    nav();
    view.innerHTML = Views[current()]();
    rotularTabelas();
  }
  window.addEventListener('hashchange', () => {
    render();
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });
  /* Com o servidor ligado: só a organização entra; programação, numeração e avisos vêm da API e se atualizam ao vivo. */
  async function apiStart() {
    let me = null;
    try {
      me = await API.get('/api/eu');
    } catch (_) {
      /* não entrou */
    }
    if (!me || !me.person.org) {
      $('#nav').innerHTML = '';
      $('#title').textContent = 'Painel da organização';
      view.innerHTML = `<section class="card"><h2>Só para a organização do ETAL</h2><p class="sub">${me ? `Você entrou como ${esc(me.person.name)}, que não está na lista da organização.` : 'Entre pelo app com a sua conta do SUAP e volte para esta página.'}</p><a class="btn primary" href="./">Abrir o app</a></section>`;
      return;
    }
    const sync = async () => {
      const prog = await API.get('/api/programacao');
      D.sessions.length = 0;
      prog.sessions.forEach((x) => D.sessions.push(x));
      ORG.rooms = prog.rooms || {};
      applyRooms();
      try {
        Object.assign(PRES, await API.get('/api/lotacao'));
      } catch (_) {
        /* sem lotação: mostra zero */
      }
      ORG.notices = (await API.get('/api/avisos')).map((n) => ({
        id: `a${n.id}`,
        time: n.time,
        title: n.title,
        text: n.text,
        to: n.activity ? `inscritos em ${(D.sessions.find((x) => x.id === n.activity) || {}).short || ''}` : '',
      }));
      render();
    };
    await sync().catch((x) => {
      console.error(x);
      toast('Sem conexão com o servidor.');
    });
    API.live({
      publicacoes: (d) => {
        if (socialV && d.versao !== socialV.versao) socialCarregar();
      },
      aviso: () => sync(),
      sala: () => sync(),
      numeros: () => sync(),
      atividade: () => sync(),
      lotacao: (m) => {
        if (!m || !m.activity) {
          sync();
          return;
        }
        const antes = PRES[m.activity] || 0;
        PRES[m.activity] = m.present;
        if (m.present > antes) {
          PULSO[m.activity] = Date.now();
          const x = D.sessions.find((s) => s.id === m.activity);
          toast(`Presença em ${x ? x.short : 'atividade'}: ${m.present} na sala`);
        }
        if (['planta', 'visao'].includes(current())) render();
      },
    });
  }
  if (API) {
    window.COMMUNITY.usarServidor();
    apiStart();
  } else render();
})();
