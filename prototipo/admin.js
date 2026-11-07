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
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  /* ---------- relógio do evento e salas ---------- */
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const NOW = toMin(D.now.time);
  const dayOf = (n) => D.days.find((d) => d.day === n);
  const floorLabel = (l) => P.floors[l].label;
  const isNow = (x) => x.day === D.now.day && toMin(x.time) <= NOW && NOW < toMin(x.end);
  const isPast = (x) => x.day < D.now.day || (x.day === D.now.day && toMin(x.end) <= NOW);
  const roomsAll = () => P.floors.flatMap((f) => f.zones.filter((z) => z.roomNumber).map((z) => ({ floor: f.level, zone: z.id, name: z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : `Sala ${z.roomNumber}` })));
  const where = (x) => (x.floor === undefined ? x.room : `${x.room} · ${floorLabel(x.floor)}`);
  const present = (x) => (x.seats ? Math.min(x.seats, Math.round(x.taken * 0.86 + 1)) : 0);

  /* ---------- estado compartilhado com o app ---------- */
  const KEY = 'etal-org';
  const load = () => { try { return { notices: [], moves: {}, creds: {}, ...JSON.parse(localStorage.getItem(KEY)) }; } catch (_) { return { notices: [], moves: {}, creds: {} }; } };
  let ORG = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ORG)); } catch (_) { /* sem armazenamento */ } };
  const applyMoves = () => Object.entries(ORG.moves).forEach(([id, m]) => { const x = D.sessions.find((s) => s.id === id); if (x) Object.assign(x, m); });
  applyMoves();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { ORG = load(); applyMoves(); render(); } });

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
    ['participantes', 'Participantes', 'users'], ['avisos', 'Avisos', 'bell'],
  ];
  const state = { day: D.now.day, ptype: 'todos', pstat: 'todos', q: '', limit: 40, floor: 2, room: null };
  const current = () => (SECTIONS.find(([k]) => `#${k}` === location.hash) || SECTIONS[0])[0];
  function nav() {
    const k = current();
    $('#nav').innerHTML = SECTIONS.map(([id, t, i]) => `<a href="#${id}" ${id === k ? 'aria-current="page"' : ''}>${ic(i)}${t}${id === 'avisos' && ORG.notices.length ? `<em>${ORG.notices.length}</em>` : id === 'planta' ? `<em title="atividades acontecendo agora">${D.sessions.filter(isNow).length}</em>` : ''}</a>`).join('');
    $('#title').textContent = SECTIONS.find(([id]) => id === k)[1];
  }
  $('#clock').textContent = `${dayOf(D.now.day).long} · ${D.now.time}, horário do evento`;

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
          <section class="card kpi"><b>${cred}</b><span>credenciados</span><small>de ${PEOPLE.length} inscritos</small><span class="bar"><i style="width:${(cred / PEOPLE.length) * 100}%"></i></span></section>
          <section class="card kpi"><b>${inRooms}</b><span>pessoas em sala agora</span><small>em ${now.length} atividades com vagas</small></section>
          <section class="card kpi"><b>${vis}</b><span>visitantes inscritos</span><small>${Math.round((vis / PEOPLE.length) * 100)}% do público, de ${new Set(PEOPLE.filter((p) => !p.ifrn).map((p) => p.city)).size} cidades</small></section>
          <section class="card kpi"><b>${ORG.notices.length}</b><span>avisos enviados</span><small>pela organização hoje</small></section>
        </div>
        <div class="grid g-2 mt">
          <section class="card"><h2>Credenciamento por hora <small>hoje, até ${D.now.time}</small></h2><p class="sub">O pico foi às ${D.org.porHora.reduce((a, b) => (b[1] > a[1] ? b : a))[0]}h, antes da abertura das atividades da manhã.</p>${hourChart(hourRows())}</section>
          <section class="card"><h2>De onde vem o público</h2><p class="sub">Quem é do IFRN e quem veio de fora.</p>${originRows()}<h2 class="mt">Cidades dos visitantes</h2><p class="sub">As seis com mais inscritos.</p>${cityBars()}</section>
        </div>
        <div class="grid g-2 mt">
          <section class="card"><h2>Acontecendo agora <small>${now.length} atividades</small></h2>${nowTable(now)}</section>
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
      const zr = state.room && f.zones.find((z) => z.id === state.room); const zname = zr && (zr.kind === 'laboratory' ? `Lab ${zr.roomNumber}` : zr.roomNumber ? `Sala ${zr.roomNumber}` : zr.label);
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Andar">${P.floors.map((q) => `<button type="button" data-act="floor" data-v="${q.level}" aria-pressed="${q.level === state.floor}">${q.label}</button>`).join('')}</div>
          <span class="count">${today.filter(isNow).length} atividades agora neste andar · ${dayOf(D.now.day).long}, ${D.now.time}</span></div>
        <div class="plan-wrap"><div><div class="plan"><svg viewBox="0 0 900 430" role="img" aria-label="Planta do ${f.label} com a lotação das salas">${P.defs}${f.svg}${overlays}</svg></div>
          <div class="plan-legend"><span>Lotação</span><span class="ramp">${RAMP.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span>vazia → cheia</span><span class="pill full">${ic('alert')}90% ou mais</span><span class="pill ifrn">Tracejado: começa mais tarde</span></div></div>
          <aside class="room-panel">${zr ? `<h3>${esc(zname)}</h3><p>${f.label} · ${sel.length ? `${sel.length} ${sel.length === 1 ? 'atividade' : 'atividades'} hoje` : 'sem atividades hoje'}</p>
            <ul>${sel.map((x) => `<li><b>${esc(x.short)}</b>${x.time} às ${x.end} · ${statusOf(x)}${x.seats ? `<div class="mt"><small>Inscritos</small>${meter(x)}${isNow(x) ? `<small>${present(x)} em sala agora</small>` : ''}</div>` : ''}<div class="mt"><button class="btn soft sm" data-act="move" data-id="${x.id}" type="button">${ic('route')}Trocar sala</button></div></li>`).join('')}</ul>`
            : `<h3>Escolha uma sala</h3><p>As salas coloridas têm atividade agora. Clique numa delas para ver a lotação e trocar a sala, se precisar.</p>`}</aside></div></section>`;
    },
    programacao() {
      const list = D.sessions.filter((x) => x.day === state.day).sort((a, b) => a.time.localeCompare(b.time));
      return `<section class="card"><div class="toolbar"><div class="seg" role="group" aria-label="Dia">${D.days.map((d) => `<button type="button" data-act="day" data-v="${d.day}" aria-pressed="${d.day === state.day}">${d.week} ${d.day}</button>`).join('')}</div>
        <span class="count">${list.length} atividades · ${list.filter((x) => x.demo).length} de exemplo</span><button class="btn soft sm" data-act="csv" data-v="programacao" type="button">${ic('download')}Exportar CSV</button></div>
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
    avisos() {
      const opts = D.sessions.filter((x) => x.day === D.now.day && !isPast(x) && x.seats);
      return `<div class="grid g-2"><section class="card"><h2>Enviar aviso</h2><p class="sub">Chega para quem está com o app aberto e fica na tela Avisos.</p>
          <form class="compose" data-form="notice"><label class="fld">Título<input name="title" maxlength="70" required placeholder="Ex.: Palestra de encerramento às 17:00"></label>
          <label class="fld">Texto<textarea name="text" rows="3" maxlength="200" placeholder="Detalhes para quem está no evento"></textarea></label>
          <label class="fld">Para quem<select name="to"><option value="">Todos os participantes</option>${opts.map((x) => `<option value="${x.id}">Inscritos em ${esc(x.short)} (${x.taken})</option>`).join('')}</select></label>
          <div><button class="btn primary" type="submit">${ic('bell')}Enviar aviso</button></div></form></section>
        <section class="card"><h2>Enviados e programados</h2>${feed()}</section></div>`;
    },
  };
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
  function sendNotice(title, text, to) {
    ORG.notices.unshift({ id: `n${Date.now()}`, time: stamp(), title, text: text || 'Aviso da organização do ETAL.', to: to || '' });
    save(); render(); toast('Aviso enviado');
  }
  function moveDialog(id) {
    const x = D.sessions.find((s) => s.id === id); const dlg = $('#dlg');
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
    if (a === 'compose') { location.hash = '#avisos'; setTimeout(() => $('[name=title]')?.focus(), 60); }
    if (a === 'floor') { state.floor = +el.dataset.v; state.room = null; render(); }
    if (a === 'room') { state.room = el.dataset.zone; render(); }
    if (a === 'day') { state.day = +el.dataset.v; render(); }
    if (a === 'ptype' || a === 'pstat') { state[a] = el.dataset.v; state.limit = 40; render(); }
    if (a === 'more') { state.limit += 40; render(); }
    if (a === 'move') moveDialog(el.dataset.id);
    if (a === 'close') $('#dlg').close();
    if (a === 'csv') csv(el.dataset.v);
    if (a === 'cred') { const p = PEOPLE.find((q) => q.id === el.dataset.id); ORG.creds[p.id] = stamp(); save(); render(); toast(`Credenciamento de ${p.name.split(' ')[0]} confirmado às ${stamp()}`); }
  });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.occ')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'notice') {
      e.preventDefault(); const d = new FormData(f); const to = D.sessions.find((x) => x.id === d.get('to'));
      sendNotice(d.get('title').trim(), d.get('text').trim(), to ? `inscritos em ${to.short}` : '');
    }
    if (f.dataset.form === 'move') {
      e.preventDefault(); const x = D.sessions.find((s) => s.id === f.dataset.id); const d = new FormData(f);
      const [fl, zone] = String(d.get('room')).split('|'); const r = roomsAll().find((q) => q.zone === zone && q.floor === +fl);
      const from = where(x); ORG.moves[x.id] = { floor: r.floor, zone: r.zone, room: r.name }; Object.assign(x, ORG.moves[x.id]);
      $('#dlg').close();
      if (d.get('warn')) sendNotice('Mudança de sala', `${x.short}: agora em ${r.name}, ${floorLabel(r.floor)}. Antes era ${from}.`, `inscritos em ${x.short}`);
      else { save(); render(); toast('Sala trocada'); }
    }
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value; state.limit = 40; if (current() !== 'participantes') location.hash = '#participantes'; else render(); });

  function render() { nav(); view.innerHTML = Views[current()](); }
  window.addEventListener('hashchange', () => { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  render();
})();
