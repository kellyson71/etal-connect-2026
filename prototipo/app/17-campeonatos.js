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

/* Sem chaves publicadas (com servidor, a programação do ano ainda sem os jogos): mostra as competições da agenda. */
const competicoes = () => D.sessions.filter((x) => tipoDe(x).g === 'camp' && !x.tournament);
const gamesLead = () => {
  const t = D.tournaments[0];
  if (t) return `${dayOf(t.day)?.long || ''}, na ${esc(t.room)}. Entre na chave ou venha torcer.`;
  if (jogosAno())
    return `${jogosAno().jogos.length} jogos em dois dias: classificatórias na quinta à tarde e finais na sexta. A vaga é pedida num formulário à parte.`;
  return 'As chaves e as regras aparecem aqui quando a organização publicar. Por enquanto, os horários:';
};
const listaCompeticoes = (n, so = () => true) =>
  `<ul class="splist st" ${st(n)}>${competicoes()
    .filter(so)
    .map(
      (x) =>
        `<li ${goOf(x)}><span class="date"><small>${dayOf(x.day)?.week || ''}</small><b>${x.day}</b></span><span><b>${esc(x.short)}</b><small>${esc(x.type)}</small><em>${x.time} às ${x.end} · ${esc(x.room || '')}</em></span>${ic('chev', 'i chev')}</li>`,
    )
    .join('')}</ul>`;

/* ---- jogos do ano (window.JOGOS, em data.js): antes das chaves, a inscrição, os jogos e as regras de cada um ---- */
const jogosAno = () => (!D.tournaments.length && window.JOGOS?.jogos?.length ? window.JOGOS : null);
const ehJogo = (x) => x.type === 'Campeonato';
const diaMesBr = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/* fase da inscrição pelo relógio do aparelho, no fuso do campus: antes, aberta (e se é o último dia) ou encerrada */
function prazoJogos(j) {
  const agora = Date.now();
  const abre = Date.parse(`${j.abre}T00:00:00-03:00`);
  const fecha = Date.parse(`${j.fecha}T23:59:59-03:00`);
  if (agora < abre) return { k: 'antes', t: `Inscrições de ${diaMesBr(j.abre)} a ${diaMesBr(j.fecha)}` };
  if (agora > fecha) return { k: 'fim', t: 'Inscrições encerradas' };
  const ultimo = fecha - agora < 864e5;
  return { k: 'aberta', t: ultimo ? 'Último dia de inscrição' : `Inscrições abertas até ${diaMesBr(j.fecha)}`, ultimo };
}
const botaoFormulario = (j, cls = 'primary big') =>
  `<a class="btn ${cls}" href="${esc(j.formulario)}" target="_blank" rel="noopener">${ic('open')}Inscrever-se nos jogos</a>`;
const cartaoJogo = (g, i) =>
  `<button class="jg-card st ${g.esgotado ? 'esgotado' : ''}" ${st(5 + i)} data-go="jogoRegras" data-id="${g.id}">
      <span class="jg-arte"><img src="${assetUrl(g.arte)}" style="object-position:${g.foco || '50% 50%'}" alt="" loading="lazy" onerror="this.remove()">${g.esgotado ? '<em>Esgotado</em>' : ''}</span>
      <span class="jg-tx"><b>${esc(g.nome)}</b><small>${g.esgotado ? 'Vagas preenchidas' : `${g.vagas} vagas`} · ${esc(g.modo)}</small></span>
    </button>`;
function telaJogosAno(j) {
  const p = prazoJogos(j);
  const total = j.jogos.reduce((n, g) => n + g.vagas, 0);
  const esgotados = j.jogos.filter((g) => g.esgotado);
  const [a, b, c] = j.jogos.filter((g) => !g.esgotado);
  return `<section class="jg-topo st ${p.k}" ${st(1)}>
        <span class="jg-prazo">${p.k === 'aberta' ? '<i></i>' : ''}${p.t}</span>
        <h2>Competição de jogos</h2>
        <p>${j.jogos.length} jogos, ${total} vagas. Quinta, 3 de dezembro, a partir das 13h45; finais na sexta, às 13h.</p>
        ${esgotados.length ? `<p class="jg-aviso">${ic('info')}<span><b>${esgotados.map((g) => esc(g.nome)).join(', ')}:</b> todas as vagas já foram preenchidas.</span></p>` : ''}
        <div class="jg-acoes">${p.k === 'aberta' ? botaoFormulario(j, 'primary') : ''}<a class="btn soft" href="${esc(j.regulamentos)}" target="_blank" rel="noopener">${ic('file')}Regulamentos</a></div>
      </section>
      <section class="jg-sec st" ${st(2)}><h2 class="h">Como funciona a inscrição</h2><ol class="jg-passos">${j.inscricao
        .map(([i, t, s]) => `<li>${ic(i)}<span><b>${esc(t)}</b><small>${esc(s)}</small></span></li>`)
        .join('')}</ol></section>
      ${
        a && b && c
          ? `<section class="jg-prio st" ${st(3)}><h2 class="h">Se os horários baterem</h2>
        <p>Quando duas opções caem no mesmo horário, fica a de maior prioridade. Exemplo:</p>
        <ol><li class="ok"><i>1ª</i><b>${esc(a.nome)}</b><small>${ic('check')}Vale</small></li><li class="fora"><i>2ª</i><b>${esc(b.nome)}</b><small>${ic('x')}Mesmo horário da 1ª: sai</small></li><li class="ok"><i>3ª</i><b>${esc(c.nome)}</b><small>${ic('check')}Outro horário: vale</small></li></ol>
        <p class="jg-nota">E nunca mais de ${j.maximo} jogos diferentes por pessoa.</p></section>`
          : ''
      }
      <section class="jg-sec st" ${st(4)}><h2 class="h">Os jogos</h2><p class="jg-sub">Toque num jogo para ver como funciona e as regras.</p></section>
      <div class="jg-grade">${j.jogos.map(cartaoJogo).join('')}</div>
      ${competicoes().some(ehJogo) ? `<section class="st" ${st(12)}><h2 class="h">Na programação</h2></section>${listaCompeticoes(13, ehJogo)}` : ''}`;
}
/* Um jogo: arte, números, como as fases levam até a final, o que pode desclassificar e as regras da partida. */
Screens.jogoRegras = ({ id }) => {
  const j = window.JOGOS;
  const g = j.jogos.find((x) => x.id === id);
  const p = prazoJogos(j);
  const quando = (f, i) => {
    const d = f.dia && dayOf(f.dia);
    return d
      ? `<span class="jg-dia"><small>${d.week}</small><b>${f.dia}</b></span>`
      : `<span class="jg-dia n"><b>${i + 1}</b></span>`;
  };
  const cta = g.esgotado
    ? `<a class="btn soft big" href="${esc(j.regulamentos)}" target="_blank" rel="noopener">${ic('file')}Regulamento completo</a>`
    : p.k === 'aberta'
      ? botaoFormulario(j)
      : `<button class="btn soft big" disabled>${p.t}</button>`;
  return {
    html: `${header('')}
      <div class="pad stack jg-det">
        <div class="jg-hero st" ${st(0)}><img src="${assetUrl(g.arte)}" style="object-position:${g.foco || '50% 50%'}" alt="${esc(g.nome)}" onerror="this.remove()"></div>
        <h1 class="title-lg st" ${st(1)}>${esc(g.nome)}</h1>
        <div class="jg-fatos st" ${st(2)}>
          <div class="${g.esgotado ? 'cheio' : ''}"><small>Vagas</small><b>${g.esgotado ? 'Esgotado' : g.vagas}</b><span>${g.esgotado ? `${g.vagas} preenchidas` : 'por ordem de inscrição'}</span></div>
          <div><small>Disputa</small><b>${esc(g.modo)}</b><span>${esc(g.formato)}</span></div>
          <div><small>Quando</small><b>${esc(g.dias)}</b><span>${g.fases.some((f) => f.dia) ? 'dia de cada fase abaixo' : 'dia e hora no sorteio'}</span></div>
        </div>
        ${g.esgotado ? `<p class="jg-aviso st" ${st(3)}>${ic('info')}<span><b>Todas as vagas do ${esc(g.nome)} já foram preenchidas.</b> Se alguém desistir, a vaga vai para o próximo da lista de espera do formulário.</span></p>` : p.k === 'aberta' ? `<p class="jg-prazo-linha st ${p.ultimo ? 'ultimo' : ''}" ${st(3)}>${ic('alarm')}${p.t}</p>` : ''}
        <section class="st" ${st(4)}><h2 class="h">Como funciona</h2><ol class="jg-fases">${g.fases
          .map((f, i) => `<li>${quando(f, i)}<span><b>${esc(f.nome)}</b><small>${esc(f.txt)}</small></span></li>`)
          .join(
            '',
          )}<li class="fim">${ic('trophy')}<span><b>Campeão</b><small>Premiação na sexta, no encerramento.</small></span></li></ol></section>
        <section class="jg-olho st" ${st(5)}><h2 class="h">${ic('flag')}Fique de olho</h2><ul>${g.destaques.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="st" ${st(6)}><h2 class="h">Regras da partida</h2><ul class="jg-regras">${[
          ...g.regras,
          'Pontualidade, respeito e nada de comportamento antiesportivo (insultos, trapaça, provocação).',
          'O que o regulamento não prevê, a organização decide.',
        ]
          .map((x) => `<li>${ic('check')}<span>${esc(x)}</span></li>`)
          .join('')}</ul></section>
        <section class="levar st" ${st(7)}>${ic('file')}<span><b>No formulário</b><small>${esc(g.informar)}</small></span></section>
        <a class="jg-reg st" ${st(8)} href="${esc(j.regulamentos)}" target="_blank" rel="noopener">${ic('file')}<span><b>Regulamento completo</b><small>Os documentos da organização, no Google Drive</small></span>${ic('open')}</a>
      </div>
      <div class="cta-bar">${cta}</div>`,
  };
};

Screens.games = () => ({
  html: `${header('Campeonatos')}
      <div class="pad stack">
        <p class="games-lead st" ${st(0)}>${gamesLead()}</p>
        ${D.tournaments.length ? '' : jogosAno() ? telaJogosAno(jogosAno()) : listaCompeticoes(1)}
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
            ${semMapa(ses) ? '' : `<button class="btn t-ghost" data-act="openmap" data-floor="${ses.floor}" data-zone="${ses.zone}">${ic('pin')}Como chegar</button>`}`
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
