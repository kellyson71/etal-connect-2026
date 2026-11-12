/* Painel da organização do ETAL Connect, para computador.
   Lê a mesma programação e a mesma planta do app (data.js, plan-data.js). Participantes e números são simulados.
   Avisos, trocas de sala e credenciamentos ficam em localStorage (etal-org) e chegam ao app aberto no mesmo navegador. */
(() => {
  'use strict';
  const D = window.DATA, P = window.PLAN;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const view = $('#view');

  /* ---------- ícones ---------- */
  const IC = {
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>', more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.01"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8M9 17h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  /* ---------- relógio do evento e salas ---------- */
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const NOW = toMin(D.now.time);
  const dayOf = (n) => D.days.find((d) => d.day === n);
  const floorLabel = (l) => P.floors[l].label;
  const isNow = (x) => x.day === D.now.day && toMin(x.time) <= NOW && NOW < toMin(x.end);
  const isPast = (x) => x.day < D.now.day || (x.day === D.now.day && toMin(x.end) <= NOW);
  const roomName = (z) => z.name || (z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : z.kind === 'staff' ? `Sala dos professores ${z.roomNumber}` : `Sala ${z.roomNumber}`);
  const roomsAll = () => P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => ({ floor: f.level, zone: z.id, name: roomName(z) })));
  const where = (x) => (x.floor === undefined ? x.room : `${x.room} · ${floorLabel(x.floor)}`);
  const present = (x) => (x.seats ? Math.min(x.seats, Math.round(x.taken * 0.86 + 1)) : 0);

  /* ---------- estado compartilhado com o app ---------- */
  const KEY = 'etal-org';
  const load = () => { try { return { notices: [], moves: {}, creds: {}, rooms: {}, ...JSON.parse(localStorage.getItem(KEY)) }; } catch (_) { return { notices: [], moves: {}, creds: {}, rooms: {} }; } };
  let ORG = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ORG)); } catch (_) { /* sem armazenamento */ } };
  const applyMoves = () => Object.entries(ORG.moves).forEach(([id, m]) => { const x = D.sessions.find((s) => s.id === id); if (x) Object.assign(x, m); });
  /* Numeração das salas definida pela organização (ORG.rooms, chave "andar:zona"). Igual à do app. */
  function applyRooms() {
    P.floors.forEach((f) => f.zones.forEach((z) => {
      if (!z.roomNumber) return;
      if (z.num0 === undefined) z.num0 = z.roomNumber;
      const v = (ORG.rooms[`${f.level}:${z.id}`] || '').trim(); const n = v || z.num0;
      z.orgNumber = !!v && v !== z.num0;
      if (n === z.roomNumber) return;
      z.roomNumber = n;
      const re = new RegExp(`(data-num="${f.level}:${z.id}"[^>]*>)[^<]*<`, 'g');
      f.svg = f.svg.replace(re, `$1${esc(n)}<`); f.svgDark = f.svgDark.replace(re, `$1${esc(n)}<`);
    }));
    D.sessions.forEach((x) => { if (x.floor === undefined) return; const z = P.floors[x.floor].zones.find((q) => q.id === x.zone); if (z && z.roomNumber) x.room = roomName(z); });
  }
  applyMoves(); applyRooms();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { ORG = load(); applyMoves(); applyRooms(); render(); } });

  /* ---------- participantes simulados (sempre os mesmos) ---------- */
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const FIRST = ['Ana', 'João', 'Maria', 'Pedro', 'Lucas', 'Júlia', 'Gabriel', 'Larissa', 'Rafael', 'Beatriz', 'Mateus', 'Camila', 'Davi', 'Letícia', 'Thiago', 'Isabela', 'Felipe', 'Yasmin', 'Caio', 'Bianca', 'Vitor', 'Sofia', 'Heitor', 'Lívia', 'Samuel', 'Clara', 'Enzo', 'Alice', 'Ruan', 'Emanuelly', 'Arthur', 'Lara'];
  const LAST = ['Silva', 'Souza', 'Oliveira', 'Fernandes', 'Medeiros', 'Costa', 'Pereira', 'Lima', 'Rocha', 'Dantas', 'Nunes', 'Queiroz', 'Carvalho', 'Freitas', 'Morais', 'Bezerra', 'Holanda', 'Maia', 'Pinto', 'Rêgo'];
  const COURSES = ['Informática', 'Informática', 'Análise e Desenvolvimento de Sistemas', 'Edificações', 'Apicultura', 'Alimentos', 'Meio Ambiente', 'Química', 'Gestão Ambiental'];
  const CITIES = [['Mossoró', 9], ['São Miguel', 7], ['Alexandria', 5], ['Encanto', 5], ['Rafael Fernandes', 4], ['Portalegre', 4], ['Marcelino Vieira', 3], ['Cajazeiras', 3], ['Natal', 2], ['Pau dos Ferros', 8]];
  const KINDS = ['Estudante', 'Estudante', 'Estudante', 'Profissional', 'Professor(a)', 'Comunidade'];
  const PEOPLE = (() => {
    const r = rng(2026); const pick = (a) => a[Math.floor(r() * a.length)];
    const cityBag = CITIES.flatMap(([c, w]) => Array(w).fill(c));
    const hours = D.org.porHora.flatMap(([h, n]) => Array(n).fill(h));
    const out = [];
    for (let i = 0; i < D.org.inscritos; i++) {
      const name = `${pick(FIRST)} ${pick(LAST)} ${pick(LAST)}`; const ifrn = r() < 0.76;
      const p = { id: ifrn ? `2023109${String(40000 + i * 37).padStart(7, '0')}` : `VIS${String(100000 + i * 911).slice(-6)}`, name, ifrn, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${i}@exemplo.com` };
      if (ifrn) p.course = pick(COURSES); else { p.kind = pick(KINDS); p.city = pick(cityBag); }
      out.push(p);
    }
    /* Credenciados na ordem das horas do painel: os números batem com o gráfico. */
    const order = out.map((_, i) => i).sort(() => r() - 0.5).slice(0, hours.length);
    order.forEach((idx, k) => { const h = hours[k]; out[idx].cred = `${String(h).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`; });
    /* A conta de visitante criada neste aparelho aparece no topo. */
    try { const g = JSON.parse(localStorage.getItem('etal-visitante')); if (g) out.unshift({ id: g.id, name: g.name, ifrn: false, kind: g.year, city: g.campus, email: g.email, here: true }); } catch (_) { /* sem conta */ }
    return out;
  })();
  const credOf = (p) => ORG.creds[p.id] || p.cred || null;
  const credCount = () => PEOPLE.filter(credOf).length;

  /* ---------- navegação ---------- */
  const SECTIONS = [
    ['visao', 'Visão geral', 'home'], ['planta', 'Planta ao vivo', 'map'], ['programacao', 'Programação', 'cal'],
    ['participantes', 'Participantes', 'users'], ['salas', 'Salas', 'grid'], ['campeonatos', 'Campeonatos', 'trophy'], ['avisos', 'Avisos', 'bell'],
  ];
  const state = { day: D.now.day, ptype: 'todos', pstat: 'todos', q: '', limit: 40, floor: 2, room: null };
  const current = () => (SECTIONS.find(([k]) => `#${k}` === location.hash) || SECTIONS[0])[0];
  /* No celular a barra lateral vira uma barra de abas embaixo: as quatro seções do dia a dia e "Mais" (as outras). */
  const PRINCIPAIS = ['visao', 'planta', 'programacao', 'participantes'];
  const CURTO = { visao: 'Início', planta: 'Planta', programacao: 'Agenda', participantes: 'Pessoas' };
  function nav() {
    const k = current();
    const extra = !PRINCIPAIS.includes(k);
    $('#nav').innerHTML = SECTIONS.map(([id, t, i]) => `<a href="#${id}" class="${PRINCIPAIS.includes(id) ? '' : 'extra'}" ${id === k ? 'aria-current="page"' : ''}>${ic(i)}<span data-curto="${CURTO[id] || t}">${t}</span>${id === 'avisos' && ORG.notices.length ? `<em>${ORG.notices.length}</em>` : id === 'planta' ? `<em title="atividades acontecendo agora">${D.sessions.filter(isNow).length}</em>` : ''}</a>`).join('')
      + `<button type="button" class="mais ${extra ? 'on' : ''}" data-act="mais">${ic('more')}<span>Mais</span></button>`;
    $('#title').textContent = SECTIONS.find(([id]) => id === k)[1];
  }
  function maisSheet() {
    const dlg = $('#dlg'); dlg.className = 'sheet';
    dlg.innerHTML = `<nav class="mais-lista">${SECTIONS.filter(([id]) => !PRINCIPAIS.includes(id)).map(([id, t, i]) => `<a href="#${id}" data-act="close">${ic(i)}${t}</a>`).join('')}<a href="./" target="_blank" rel="noopener">${ic('open')}Abrir o app</a></nav>`;
    dlg.showModal(); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }, { once: true });
  }
  /* Tema: o mesmo do app (etal-ui), com um botão no topo para trocar. */
  const temaEscuro = () => { try { const m = JSON.parse(localStorage.getItem('etal-ui'))?.mode; return m === 'escuro' || ((!m || m === 'auto') && matchMedia('(prefers-color-scheme: dark)').matches); } catch (_) { return matchMedia('(prefers-color-scheme: dark)').matches; } };
  function aplicarTema() { const d = temaEscuro(); document.documentElement.dataset.theme = d ? 'dark' : 'light'; const b = $('#tema'); if (b) { b.innerHTML = ic(d ? 'sun' : 'moon'); b.setAttribute('aria-label', d ? 'Usar o tema claro' : 'Usar o tema escuro'); } }
  function trocarTema() { let u = {}; try { u = JSON.parse(localStorage.getItem('etal-ui')) || {}; } catch (_) { /* vazio */ } u.mode = temaEscuro() ? 'claro' : 'escuro'; try { localStorage.setItem('etal-ui', JSON.stringify(u)); } catch (_) { /* opcional */ } aplicarTema(); }
  aplicarTema();
  /* Tabelas no celular viram cartões: cada célula ganha o nome da coluna (CSS mostra quando a tela é estreita). */
  function rotularTabelas() { view.querySelectorAll('table').forEach((t) => { const hs = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim()); t.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (td.tagName === 'TD' && hs[i]) td.dataset.l = hs[i]; })); }); }
  $('#clock').textContent = `${dayOf(D.now.day).week} ${D.now.day} nov · ${D.now.time}`;

  /* ---------- gráficos ---------- */
  const tip = $('#tip');
  document.addEventListener('pointermove', (e) => {
    const g = e.target.closest('[data-tip]');
    if (!g) { tip.classList.remove('on'); return; }
    tip.textContent = g.dataset.tip; tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY - 12}px`; tip.classList.add('on');
  });
  document.addEventListener('focusin', (e) => {
    const g = e.target.closest('[data-tip]'); if (!g) return;
    const r = g.getBoundingClientRect(); tip.textContent = g.dataset.tip; tip.style.left = `${r.left + r.width / 2}px`; tip.style.top = `${r.top - 6}px`; tip.classList.add('on');
  });
  document.addEventListener('focusout', () => tip.classList.remove('on'));

  /* Credenciamentos por hora: os simulados mais os feitos neste painel. */
  function hourRows() {
    const rows = D.org.porHora.map(([h, v]) => [h, v]);
    Object.values(ORG.creds).forEach((t) => { const h = +t.split(':')[0]; const r = rows.find((q) => q[0] === h); if (r) r[1] += 1; else rows.push([h, 1]); });
    return rows.sort((a, b) => a[0] - b[0]);
  }
  /* Barras verticais, uma série: credenciamento por hora. Valor só no pico; o resto vem na dica. */
  function hourChart(rows) {
    const W = 560, H = 230, L = 34, T = 16, B = 196; const max = Math.max(...rows.map((r) => r[1])); const top = Math.ceil(max / 25) * 25;
    const bw = (W - L - 8) / rows.length; const y = (v) => B - ((B - T) * v) / top;
    const ticks = [0, top / 2, top].map((v) => `<path class="grid-l" d="M${L} ${y(v) + 0.5}H${W}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
    const bars = rows.map(([h, v]) => {
      const x = L + bw * rows.findIndex((q) => q[0] === h) + 4, w = bw - 8, yy = y(v);
      return `<g tabindex="0" data-tip="${h}h às ${h + 1}h · ${v} credenciamentos"><rect class="hit" x="${x - 4}" y="${T}" width="${bw}" height="${B - T + 24}"/>
        <path class="m" fill="var(--s-ifrn)" d="M${x} ${B}V${yy + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4V${B}Z"/>
        ${v === max ? `<text class="val" x="${x + w / 2}" y="${yy - 7}" text-anchor="middle">${v}</text>` : ''}<text class="axis" x="${x + w / 2}" y="${B + 18}" text-anchor="middle">${h}h</text></g>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Credenciamentos por hora: ${rows.map(([h, v]) => `${h} horas, ${v}`).join('; ')}">${ticks}${bars}</svg>`;
  }
  /* Composição em duas categorias: IFRN e visitantes, com rótulo direto em cada parte. */
  function originRows() {
    const row = (label, list) => {
      const a = list.filter((p) => p.ifrn).length, b = list.length - a; const pa = Math.round((a / list.length) * 100);
      return `<div class="stack-row"><span>${label}</span><div class="stack" role="img" aria-label="${label}: ${a} do IFRN, ${b} visitantes">
        <div style="flex:${a};background:var(--s-ifrn)" data-tip="${label} do IFRN: ${a} (${pa}%)" tabindex="0">${a} · ${pa}%</div>
        <div style="flex:${b};background:var(--s-vis)" data-tip="${label} visitantes: ${b} (${100 - pa}%)" tabindex="0">${b}</div></div></div>`;
    };
    return `<ul class="legend"><li><i style="background:var(--s-ifrn)"></i>IFRN</li><li><i style="background:var(--s-vis)"></i>Visitantes</li></ul>
      ${row('Inscritos', PEOPLE)}${row('Credenciados', PEOPLE.filter(credOf))}`;
  }
  function cityBars() {
    const n = {}; PEOPLE.filter((p) => !p.ifrn).forEach((p) => { n[p.city] = (n[p.city] || 0) + 1; });
    const list = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 6); const max = list[0]?.[1] || 1;
    return `<ul class="hbars">${list.map(([c, v]) => `<li data-tip="${c}: ${v} visitantes"><span>${esc(c)}</span><span class="track"><i style="width:${(v / max) * 100}%"></i></span><b>${v}</b></li>`).join('')}</ul>`;
  }
  const meter = (x) => { const pc = Math.round((x.taken / x.seats) * 100); return `<div class="meter ${pc >= 90 ? 'full' : ''}"><span class="track"><i style="width:${pc}%"></i></span><b>${x.taken}/${x.seats}</b></div>`; };
  const statusOf = (x) => (isNow(x) ? '<span class="pill live">Agora</span>' : isPast(x) ? '<span class="pill wait">Encerrada</span>' : '<span class="pill ifrn">Próxima</span>');

  /* ---------- seções ---------- */
  const Views = {
    visao() {
      const now = D.sessions.filter((x) => isNow(x) && x.seats); const inRooms = now.reduce((n, x) => n + present(x), 0);
      const cred = credCount(); const vis = PEOPLE.filter((p) => !p.ifrn).length;
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
      const overlays = f.zones.filter((z) => z.w).map((z) => {
        const live = today.find((x) => isNow(x) && x.zone === z.id); const later = today.find((x) => !isNow(x) && !isPast(x) && x.zone === z.id);
        if (!live && !later) return '';
        const g = 4; const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
        if (!live) return `<g class="occ" tabindex="0" data-act="room" data-zone="${z.id}" data-tip="${esc(later.short)} às ${later.time}"><rect x="${z.x + g}" y="${z.y + g}" width="${z.w - 2 * g}" height="${z.h - 2 * g}" rx="8" fill="#fff" fill-opacity=".55" stroke="#3b63b8" stroke-dasharray="5 4" stroke-width="2"/><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#3b63b8">às ${later.time}</text></g>`;
        const n = live.seats ? present(live) : 0; const pc = live.seats ? n / live.seats : 0.5;
        const full = pc >= 0.9; const fill = full ? '#c4492f' : RAMP[Math.min(4, Math.floor(pc * 5))]; const ink = full || pc >= 0.6 ? '#fff' : '#1f2f57';
        return `<g class="occ" tabindex="0" data-act="room" data-zone="${z.id}" data-tip="${esc(live.short)} · ${live.seats ? `${n} de ${live.seats} lugares` : 'sem limite de vagas'}"><rect x="${z.x + g}" y="${z.y + g}" width="${z.w - 2 * g}" height="${z.h - 2 * g}" rx="8" fill="${fill}"/>
          <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="15" font-weight="700" fill="${ink}" font-family="Geologica">${live.seats ? `${n}/${live.seats}` : 'Agora'}</text><text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${ink}">${full ? 'lotada' : esc(live.short.length > 17 ? `${live.short.slice(0, 16).trim()}…` : live.short)}</text></g>`;
      }).join('');
      const sel = state.room && today.filter((x) => x.zone === state.room);
      const zr = state.room && f.zones.find((z) => z.id === state.room); const zname = zr && (zr.roomNumber ? roomName(zr) : zr.label);
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Andar">${P.floors.map((q) => `<button type="button" data-act="floor" data-v="${q.level}" aria-pressed="${q.level === state.floor}">${q.label}</button>`).join('')}</div>
          <span class="count">${today.filter(isNow).length} agora</span></div>
        <div class="plan-wrap"><div><div class="plan"><svg viewBox="${P.viewBox || '0 0 900 430'}" role="img" aria-label="Planta do ${f.label} com a lotação das salas">${P.defs}${f.svg}${overlays}</svg></div>
          <div class="plan-legend"><span>Lotação</span><span class="ramp">${RAMP.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span>vazia → cheia</span><span class="pill full">${ic('alert')}90% ou mais</span><span class="pill ifrn">Tracejado: mais tarde</span></div></div>
          <aside class="room-panel">${zr ? `<h3>${esc(zname)}</h3><p>${f.label} · ${sel.length ? `${sel.length} ${sel.length === 1 ? 'atividade' : 'atividades'} hoje` : 'sem atividades hoje'}</p>
            <ul>${sel.map((x) => `<li><b>${esc(x.short)}</b>${x.time} às ${x.end} · ${statusOf(x)}${x.seats ? `<div class="mt"><small>Inscritos</small>${meter(x)}${isNow(x) ? `<small>${present(x)} em sala agora</small>` : ''}</div>` : ''}<div class="mt"><button class="btn soft sm" data-act="move" data-id="${x.id}" type="button">${ic('route')}Trocar sala</button></div></li>`).join('')}</ul>`
            : `<h3>Toque numa sala colorida</h3>`}</aside></div></section>`;
    },
    salas() {
      const KIND = { classroom: 'Sala de aula', laboratory: 'Laboratório', staff: 'Professores', office: 'Setor' };
      const status = (z) => (z.orgNumber ? '<span class="pill ifrn">Definido pela organização</span>'
        : z.confirmed ? `<span class="pill ok">${ic('check')}Confirmado</span>` : '<span class="pill wait">Demonstrativo</span>');
      const used = (f, z) => D.sessions.filter((x) => x.floor === f.level && x.zone === z.id).length;
      const rows = P.floors.map((f) => `<tbody><tr class="grp"><th colspan="5">${f.label}</th></tr>${f.zones.filter((z) => z.roomNumber).map((z) => {
        const k = `${f.level}:${z.id}`; const n = used(f, z);
        return `<tr><td class="title"><b>${esc(z.name || KIND[z.kind] || z.kind)}</b></td>
          <td><input class="num-in" data-room-num="${k}" value="${esc(z.roomNumber)}" aria-label="Número de ${esc(roomName(z))}, ${f.label}" maxlength="12" inputmode="text"></td>
          <td>${status(z)}</td> <td class="num">${n ? `${n} ${n === 1 ? 'atividade' : 'atividades'}` : '—'}</td>
          <td class="r">${ORG.rooms[k] ? `<button class="btn ghost sm" type="button" data-act="roomreset" data-k="${k}">Restaurar</button>` : ''}</td></tr>`;
      }).join('')}</tbody>`).join('');
            return `<section class="card"><h2>Números das salas</h2>
        <div class="tbl-wrap"><table class="rooms"><thead><tr><th>Ambiente</th><th>Número</th><th>Situação</th><th>Atividades</th><th></th></tr></thead>${rows}</table></div></section>`;
    },
    programacao() {
      const list = D.sessions.filter((x) => x.day === state.day).sort((a, b) => a.time.localeCompare(b.time));
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Dia">${D.days.map((d) => `<button type="button" data-act="day" data-v="${d.day}" aria-pressed="${d.day === state.day}">${d.week} ${d.day}</button>`).join('')}</div>
        <span class="count">${list.length} atividades</span><button class="btn soft sm" data-act="csv" data-v="programacao" type="button">${ic('download')}Exportar CSV</button></div>
        <div class="tbl-wrap"><table><thead><tr><th>Horário</th><th>Atividade</th><th>Tipo</th><th>Local</th><th>Inscritos</th><th>Situação</th><th></th></tr></thead><tbody>
        ${list.map((x) => `<tr><td class="num">${x.time}–${x.end}</td><td class="title"><b>${esc(x.title)}</b><small>${esc(x.speaker || 'Organização')}</small></td><td>${esc(x.type)}</td><td>${esc(where(x))}</td><td>${x.seats ? meter(x) : '<small>sem limite</small>'}</td><td>${statusOf(x)}</td>
          <td class="r">${x.floor !== undefined && !isPast(x) ? `<button class="btn ghost sm" data-act="move" data-id="${x.id}" type="button">Trocar sala</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div></section>`;
    },
    participantes() {
      const q = state.q.trim().toLowerCase();
      const list = PEOPLE.filter((p) => (state.ptype === 'todos' || (state.ptype === 'ifrn') === p.ifrn)
        && (state.pstat === 'todos' || (state.pstat === 'cred') === !!credOf(p))
        && (!q || `${p.name} ${p.id} ${p.email}`.toLowerCase().includes(q)));
      const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, t]) => `<button type="button" data-act="${k}" data-v="${v}" aria-pressed="${state[k] === v}">${t}</button>`).join('')}</div>`;
      return `<section class="card"><div class="toolbar">${seg('ptype', [['todos', 'Todos'], ['ifrn', 'IFRN'], ['vis', 'Visitantes']])}${seg('pstat', [['todos', 'Todos'], ['cred', 'Credenciados'], ['pend', 'Pendentes']])}
        <span class="count">${list.length} ${list.length === 1 ? 'pessoa' : 'pessoas'}${q ? ` para “${esc(state.q)}”` : ''}</span><button class="btn soft sm" data-act="csv" data-v="participantes" type="button">${ic('download')}Exportar CSV</button></div>
        ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Matrícula ou código</th><th>Credenciamento</th><th></th></tr></thead><tbody>
        ${list.slice(0, state.limit).map((p) => { const c = credOf(p); return `<tr><td class="title"><b>${esc(p.name)}${p.here ? ' <span class="pill vis">neste aparelho</span>' : ''}</b><small>${esc(p.email)}</small></td>
          <td>${p.ifrn ? `<span class="pill ifrn">IFRN</span> ${esc(p.course)}` : `<span class="pill vis">Visitante</span> ${esc(p.kind || '')} · ${esc(p.city || '')}`}</td><td class="num">${esc(p.id)}</td>
          <td>${c ? `<span class="pill ok">${ic('check')}às ${c}</span>` : '<span class="pill wait">Pendente</span>'}</td>
          <td class="r">${c ? '' : `<button class="btn soft sm" data-act="cred" data-id="${esc(p.id)}" type="button">Credenciar</button>`}</td></tr>`; }).join('')}
        </tbody></table></div>${list.length > state.limit ? `<p class="empty"><button class="btn soft" data-act="more" type="button">Mostrar mais ${Math.min(40, list.length - state.limit)}</button></p>` : ''}`
        : `<p class="empty">Ninguém encontrado. Confira o nome, a matrícula ou o e-mail.</p>`}</section>`;
    },
    campeonatos() { return D.tournaments.map(tourCard).join(''); },
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
    const st = T.state(tourOf(id), ORG); fn(st);
    /* resultado que ficou sem os dois jogadores deixa de valer */
    const R = T.rounds(st); [...R.q, ...R.s, R.f].forEach((m) => { if (m.w === null) delete st.res[m.k]; });
    ORG.torneios = { ...(ORG.torneios || {}), [id]: { ...((ORG.torneios || {})[id] || {}), open: st.open, players: st.players, res: st.res } }; // mantém as regras editadas no celular
    save(); render();
  }
  const ini = (name) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  function tourCard(t) {
    const st = T.state(t, ORG); const R = T.rounds(st); const [k, label] = T.status(st);
    const side = (m, i) => { const p = i ? m.b : m.a; const ready = m.a && m.b;
      return p ? `<button type="button" class="tm-p ${m.w === i ? 'win' : m.w === null ? '' : 'lose'}" ${ready ? `data-act="twin" data-id="${t.id}" data-k="${m.k}" data-v="${i}"` : 'disabled'} title="${ready ? (m.w === i ? 'Clique para desfazer' : 'Clique para marcar como vencedor') : 'Falta o adversário'}"><i>${esc(p[2])}</i><b>${esc(p[0])}</b>${m.w === i ? ic('check') : ''}</button>`
        : `<span class="tm-p none">${m.k[0] === 'q' ? 'Vaga aberta' : 'A definir'}</span>`; };
    const match = (m, title) => `<div class="tm ${m.w !== null ? 'done' : ''}"><small>${title}</small>${side(m, 0)}${side(m, 1)}</div>`;
    const row = (p, i) => `<tr><td class="num">${i + 1}</td>
      <td><input data-tp="${t.id}:${i}:0" value="${esc(p ? p[0] : '')}" placeholder="Apelido" maxlength="14" aria-label="Apelido da vaga ${i + 1}"></td>
      <td><input data-tp="${t.id}:${i}:1" value="${esc(p ? p[1] : '')}" placeholder="Nome completo" maxlength="40" aria-label="Nome da vaga ${i + 1}"></td>
      <td><input data-tp="${t.id}:${i}:3" value="${esc(p ? p[3] || '' : '')}" placeholder="${esc(t.pickLabel)}" maxlength="20" list="picks-${t.id}" aria-label="${esc(t.pickLabel)} da vaga ${i + 1}"></td>
      <td>${p ? `${p[4] ? '<span class="pill vis">pelo app</span>' : ''}<button type="button" class="btn ghost" data-act="tdel" data-id="${t.id}" data-v="${i}" title="Tirar da chave">Tirar</button>` : '<span class="pill wait">vaga</span>'}</td></tr>`;
    return `<section class="card tour-adm">
      <h2>${esc(t.name)} <span class="pill ${k === 'live' ? 'live' : k === 'open' ? 'ok' : 'wait'}">${label}</span>
        <small>${dayOf(t.day).week} ${t.day} · ${t.time} · ${esc(t.place)}</small></h2>
      <div class="toolbar">
        <button type="button" class="btn ${st.open ? 'primary' : ''}" data-act="topen" data-id="${t.id}" aria-pressed="${st.open}">${st.open ? 'Inscrições abertas' : 'Inscrições fechadas'}</button>
        <button type="button" class="btn" data-act="tshuffle" data-id="${t.id}" ${R.played ? 'disabled title="Zere os resultados para sortear de novo"' : ''}>Sortear confrontos</button>
        <button type="button" class="btn" data-act="tclear" data-id="${t.id}" ${R.played ? '' : 'disabled'}>Zerar resultados</button>
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
    return `<div class="tbl-wrap"><table><thead><tr><th>Atividade</th><th>Local</th><th>Em sala</th><th></th></tr></thead><tbody>${now.map((x) => { const n = present(x); const pc = Math.round((n / x.seats) * 100);
      return `<tr><td class="title"><b>${esc(x.short)}</b><small>${x.time} às ${x.end}</small></td><td>${esc(where(x))}</td><td><div class="meter ${pc >= 90 ? 'full' : ''}"><span class="track"><i style="width:${pc}%"></i></span><b>${n}/${x.seats}</b></div></td><td class="r"><button class="btn ghost sm" data-act="move" data-id="${x.id}" type="button">Trocar sala</button></td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function feed(limit) {
    const list = [...ORG.notices.map((n) => ({ ...n, org: true })), ...D.notices].slice(0, limit || 99);
    return `<ul class="feed">${list.map((n) => `<li class="${n.org ? 'org' : ''}"><time>${n.time}</time><span><b>${esc(n.title)}</b><small>${esc(n.text)}${n.to ? ` · para ${esc(n.to)}` : ''}</small></span></li>`).join('')}</ul>`;
  }

  /* ---------- ações ---------- */
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); };
  const stamp = () => D.now.time;
  const API = window.ETAL_API; // null: painel de demonstração, tudo neste navegador
  function sendNotice(title, text, to, activity) {
    if (API) {
      API.post('/api/org/avisos', { titulo: title, texto: text || 'Aviso da organização do ETAL.', atividade: activity || null })
        .then(() => toast('Aviso enviado para todos')).catch((x) => toast(x.message));
      return;
    }
    ORG.notices.unshift({ id: `n${Date.now()}`, time: stamp(), title, text: text || 'Aviso da organização do ETAL.', to: to || '' });
    save(); render(); toast('Aviso enviado');
  }
  function moveDialog(id) {
    const x = D.sessions.find((s) => s.id === id); const dlg = $('#dlg'); dlg.className = '';
    const busy = new Set(D.sessions.filter((s) => s.id !== id && s.day === x.day && s.floor !== undefined && toMin(s.time) < toMin(x.end) && toMin(x.time) < toMin(s.end)).map((s) => `${s.floor}|${s.zone}`));
    dlg.innerHTML = `<form method="dialog" data-form="move" data-id="${id}"><h2>Trocar sala</h2><p>${esc(x.title)} · hoje em ${esc(where(x))}, das ${x.time} às ${x.end}.</p>
      <label class="fld">Nova sala<select name="room">${roomsAll().map((r) => { const k = `${r.floor}|${r.zone}`; return `<option value="${k}" ${busy.has(k) || (r.zone === x.zone && r.floor === x.floor) ? 'disabled' : ''}>${r.name} · ${floorLabel(r.floor)}${busy.has(k) ? ' (ocupada no horário)' : ''}</option>`; }).join('')}</select></label>
      <label class="fld mt"><span><input type="checkbox" name="warn" checked> Avisar os ${x.taken || ''} inscritos pelo app</span></label>
      <div class="acts"><button class="btn soft" value="cancel" type="button" data-act="close">Cancelar</button><button class="btn primary" type="submit">${ic('route')}Trocar sala</button></div></form>`;
    dlg.showModal();
  }
  function csv(kind) {
    const rows = kind === 'programacao'
      ? [['dia', 'inicio', 'fim', 'atividade', 'tipo', 'local', 'inscritos', 'vagas', 'exemplo'], ...D.sessions.map((x) => [x.day, x.time, x.end, x.title, x.type, where(x), x.taken || '', x.seats || '', x.demo ? 'sim' : 'não'])]
      : [['nome', 'perfil', 'curso_ou_cidade', 'matricula_ou_codigo', 'email', 'credenciado_as'], ...PEOPLE.map((p) => [p.name, p.ifrn ? 'IFRN' : 'Visitante', p.ifrn ? p.course : p.city, p.id, p.email, credOf(p) || ''])];
    const text = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = `etal-${kind}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Arquivo CSV baixado');
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act;
    if (a === 'mais') { maisSheet(); return; }
    if (a === 'tema') { trocarTema(); return; }
    if (a === 'compose') { location.hash = '#avisos'; setTimeout(() => $('[name=title]')?.focus(), 60); }
    if (a === 'floor') { state.floor = +el.dataset.v; state.room = null; render(); }
    if (a === 'roomreset') { if (API) { API.put('/api/org/salas', { [el.dataset.k]: '' }).catch((x) => toast(x.message)); return; } delete ORG.rooms[el.dataset.k]; save(); applyRooms(); render(); toast('Número restaurado'); }
    if (a === 'room') { state.room = el.dataset.zone; render(); }
    if (a === 'day') { state.day = +el.dataset.v; render(); }
    if (a === 'ptype' || a === 'pstat') { state[a] = el.dataset.v; state.limit = 40; render(); }
    if (a === 'more') { state.limit += 40; render(); }
    if (a === 'move') moveDialog(el.dataset.id);
    if (a === 'close') $('#dlg').close();
    if (a === 'csv') csv(el.dataset.v);
    /* campeonatos */
    const tid = el.dataset.id;
    if (a === 'twin') tourSet(tid, (st) => { const k = el.dataset.k, v = +el.dataset.v; if (st.res[k] === v) delete st.res[k]; else st.res[k] = v; if (k[0] === 'q') { delete st.res[`s${Math.floor(+k[1] / 2)}`]; delete st.res.f; } if (k[0] === 's') delete st.res.f; });
    if (a === 'topen') { tourSet(tid, (st) => { st.open = !st.open; }); toast(T.state(tourOf(tid), ORG).open ? 'Inscrições abertas' : 'Inscrições fechadas'); }
    if (a === 'tdel') tourSet(tid, (st) => { st.players[+el.dataset.v] = null; });
    if (a === 'tclear') { tourSet(tid, (st) => { st.res = {}; }); toast('Resultados zerados'); }
    if (a === 'tshuffle') { tourSet(tid, (st) => { const ps = st.players.filter(Boolean); for (let i = ps.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ps[i], ps[j]] = [ps[j], ps[i]]; } st.players = [...ps, ...Array(8 - ps.length).fill(null)]; }); toast('Confrontos sorteados'); }
    if (a === 'treset') { delete (ORG.torneios || {})[tid]; save(); render(); toast('Exemplo restaurado'); }
    if (a === 'tannounce') { const t = tourOf(tid); const c = T.rounds(T.state(t, ORG)).champ; sendNotice(`${c[0]} venceu o campeonato de ${t.name}`, `Parabéns, ${c[1]}! Obrigado a quem jogou e a quem veio torcer.`, ''); }
    if (a === 'cred') { const p = PEOPLE.find((q) => q.id === el.dataset.id); ORG.creds[p.id] = stamp(); save(); render(); toast(`Credenciamento de ${p.name.split(' ')[0]} confirmado às ${stamp()}`); }
  });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.occ')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'notice') {
      e.preventDefault(); const d = new FormData(f); const to = D.sessions.find((x) => x.id === d.get('to'));
      sendNotice(d.get('title').trim(), d.get('text').trim(), to ? `inscritos em ${to.short}` : '', to ? to.id : null);
    }
    if (f.dataset.form === 'move') {
      e.preventDefault(); const x = D.sessions.find((s) => s.id === f.dataset.id); const d = new FormData(f);
      const [fl, zone] = String(d.get('room')).split('|'); const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
      const from = where(x);
      if (API) {
        $('#dlg').close();
        API.patch(`/api/org/atividades/${encodeURIComponent(x.id)}/sala`, { andar: r.floor, zona: r.zone, sala: r.name, avisar: !!d.get('warn') })
          .then(() => toast(d.get('warn') ? 'Sala trocada e inscritos avisados' : 'Sala trocada')).catch((x2) => toast(x2.message));
        return;
      }
      ORG.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name }; Object.assign(x, ORG.moves[x.id]);
      $('#dlg').close();
      if (d.get('warn')) sendNotice('Mudança de sala', `${x.short}: agora em ${r.name}, ${floorLabel(r.floor)}. Antes era ${from}.`, `inscritos em ${x.short}`);
      else { save(); render(); toast('Sala trocada'); }
    }
  });
  document.addEventListener('input', (e) => {
  });
  /* Número de sala: salva ao sair do campo ou com Enter. */
  /* Jogador do campeonato: salva ao sair do campo. Apelido vazio tira a pessoa da chave. */
  document.addEventListener('change', (e) => {
    const el = e.target; if (!el.matches('[data-tp]')) return;
    const [id, i, f] = el.dataset.tp.split(':'); const v = el.value.trim();
    tourSet(id, (st) => {
      const p = st.players[+i] ? [...st.players[+i]] : ['', '', '', ''];
      p[+f] = v; if (!p[0] && +f === 1 && v) p[0] = v.split(' ')[0].slice(0, 14);
      if (!p[0]) { st.players[+i] = null; return; }
      p[2] = ini(p[1] || p[0]); st.players[+i] = p;
    });
  });
  document.addEventListener('change', (e) => {
    const el = e.target; if (!el.matches('[data-room-num]')) return;
    const k = el.dataset.roomNum; const v = el.value.trim().slice(0, 12);
    const z = P.floors[+k.split(':')[0]].zones.find((q) => q.id === k.split(':')[1]);
    if (API) { API.put('/api/org/salas', { [k]: v && v !== z.num0 ? v : '' }).then(() => toast(v && v !== z.num0 ? `Agora é ${v}` : 'Número restaurado')).catch((x) => toast(x.message)); return; }
    if (!v || v === z.num0) delete ORG.rooms[k]; else ORG.rooms[k] = v;
    save(); applyRooms(); render(); toast(v && v !== z.num0 ? `Agora é ${roomName(z)}` : 'Número restaurado');
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value; state.limit = 40; if (current() !== 'participantes') location.hash = '#participantes'; else render(); });

  function render() { nav(); view.innerHTML = Views[current()](); rotularTabelas(); }
  window.addEventListener('hashchange', () => { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  /* Com o servidor ligado: só a organização entra; programação, numeração e avisos vêm da API e se atualizam ao vivo. */
  async function apiStart() {
    let me = null;
    try { me = await API.get('/api/eu'); } catch (_) { /* não entrou */ }
    if (!me || !me.person.org) {
      $('#nav').innerHTML = ''; $('#title').textContent = 'Painel da organização';
      view.innerHTML = `<section class="card"><h2>Só para a organização do ETAL</h2><p class="sub">${me ? `Você entrou como ${esc(me.person.name)}, que não está na lista da organização.` : 'Entre pelo app com a sua conta do SUAP e volte para esta página.'}</p><a class="btn primary" href="./">Abrir o app</a></section>`;
      return;
    }
    const sync = async () => {
      const prog = await API.get('/api/programacao');
      D.sessions.length = 0; prog.sessions.forEach((x) => D.sessions.push(x));
      ORG.rooms = prog.rooms || {}; applyRooms();
      ORG.notices = (await API.get('/api/avisos')).map((n) => ({ id: `a${n.id}`, time: n.time, title: n.title, text: n.text, to: n.activity ? `inscritos em ${(D.sessions.find((x) => x.id === n.activity) || {}).short || ''}` : '' }));
      render();
    };
    await sync().catch((x) => { console.error(x); toast('Sem conexão com o servidor.'); });
    API.live({ aviso: () => sync(), sala: () => sync(), numeros: () => sync(), lotacao: () => { if (current() === 'planta') sync(); } });
  }
  if (API) apiStart(); else render();
})();
