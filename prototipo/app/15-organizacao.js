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
function hourBars(rows) {
  const W = 320,
    H = 132,
    top = 18,
    base = 104,
    max = Math.max(...rows.map((r) => r[1]));
  const bw = (W - 20) / rows.length;
  const peak = rows.find((r) => r[1] === max);
  const bars = rows
    .map(([h, v], i) => {
      const x = 10 + i * bw + 3,
        w = bw - 6,
        y = base - ((base - top) * v) / max;
      return `<g class="ob-bar" tabindex="0" aria-label="${h} h: ${v} credenciamentos"><title>${h} h · ${v} credenciamentos</title><rect class="hit" x="${x - 3}" y="${top}" width="${bw}" height="${base - top + 22}"/>
        <path d="M${x} ${base}V${y + 4}a4 4 0 0 1 4-4h${w - 8}a4 4 0 0 1 4 4V${base}Z"/>${peak && h === peak[0] ? `<text class="ob-val" x="${x + w / 2}" y="${y - 6}">${v}</text>` : ''}<text class="ob-x" x="${x + w / 2}" y="${base + 16}">${h}h</text></g>`;
    })
    .join('');
  return `<svg class="ob-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Credenciamentos por hora hoje: ${rows.map(([h, v]) => `${h} h, ${v}`).join('; ')}"><path class="ob-base" d="M8 ${base + 0.5}H${W - 8}"/>${bars}</svg>`;
}
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
            const [k, l] = window.TOUR.status(stt);
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
