/* app/16-avaliacao-e-pessoas.js · avaliação no fim da atividade, crachá para mostrar e busca de pessoas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */

/* ---------------- avaliação ----------------
   Fluxo: a pessoa lê o QR da sala na entrada (presença) e de novo no fim (saída). A saída libera uma folha curta: nota
   em estrelas, comentários rápidos de um toque e um comentário aberto opcional. A organização vê tudo sem o nome. */
const RAPIDOS_BONS = [
  'Didática clara',
  'Conteúdo prático',
  'Bom ritmo',
  'Material útil',
  'Tirou minhas dúvidas',
  'Quero mais',
];
const RAPIDOS_RUINS = [
  'Rápido demais',
  'Faltou prática',
  'Difícil de acompanhar',
  'Problema técnico',
  'Sala desconfortável',
];
const NOTA_TXT = ['', 'Não gostei', 'Poderia ser melhor', 'Foi ok', 'Gostei', 'Amei'];
/* nota guardada: número (versões antigas) ou { n, quick, text } */
const notaDe = (id) => {
  const r = S.ratings[id];
  return typeof r === 'number' ? r : r?.n || 0;
};
const saidaAbre = (s) => hhmm(toMin(s.end) - 20);
const oQue = (s) => ({ mini: 'a aula', pal: 'a palestra', mesa: 'a mesa' })[tipoDe(s).g] || 'a atividade';

Overlays.avaliar = (id, pre = 0) => {
  const s = byId(id);
  const r = S.ratings[id] && typeof S.ratings[id] === 'object' ? S.ratings[id] : { n: notaDe(id), quick: [], text: '' };
  const n = pre || r.n || 0;
  const chip = (t) =>
    `<label class="av-chip"><input type="checkbox" name="quick" value="${esc(t)}" ${r.quick?.includes(t) ? 'checked' : ''}><span>${esc(t)}</span></label>`;
  return `<form class="sheet av-sheet" data-form="avaliar" data-id="${esc(id)}" role="dialog" aria-modal="true" aria-labelledby="av-tt"><i class="grab"></i>
      <header class="av-head">${hxBadge(`tp-${tipoDe(s).k}`)}<div><small>Você ficou até o fim</small><h2 id="av-tt">Como foi ${oQue(s)}?</h2><p>${esc(s.short)}</p></div></header>
      <fieldset class="av-stars" data-nota="${n}"><legend class="sr">Nota de 1 a 5</legend>${[1, 2, 3, 4, 5].map((k) => `<label><input type="radio" name="n" value="${k}" ${k === n ? 'checked' : ''}><span aria-label="${k} de 5">${ic('star')}</span></label>`).join('')}</fieldset>
      <p class="av-nota-tx" aria-live="polite">${n ? NOTA_TXT[n] : 'Toque nas estrelas'}</p>
      <div class="av-rapidos" ${n ? '' : 'hidden'}>
        <small class="av-rot">${n >= 4 ? 'O que você mais curtiu?' : 'O que pode melhorar?'}</small>
        <div class="av-chips">${(n >= 4 ? [...RAPIDOS_BONS, ...RAPIDOS_RUINS] : [...RAPIDOS_RUINS, ...RAPIDOS_BONS]).map(chip).join('')}</div>
        <label class="av-texto"><span class="sr">Comentário</span><textarea name="text" rows="2" maxlength="600" placeholder="Quer contar mais? (opcional)">${esc(r.text || '')}</textarea></label>
      </div>
      <button class="btn primary big" type="submit" ${n ? '' : 'disabled'}>${ic('check')}Enviar avaliação</button>
      <p class="av-anon">${ic('lock')}A organização vê as notas e os comentários sem o seu nome.</p>
    </form>`;
};
/* estrelas e chips vivos dentro da folha, sem redesenhar a folha inteira */
document.addEventListener('change', (e) => {
  const f = e.target.closest('[data-form="avaliar"]');
  if (!f || e.target.name !== 'n') return;
  const n = +e.target.value;
  $('.av-stars', f).dataset.nota = n;
  $('.av-nota-tx', f).textContent = NOTA_TXT[n];
  const box = $('.av-rapidos', f);
  const novo = box.hidden;
  box.hidden = false;
  $('.av-rot', f).textContent = n >= 4 ? 'O que você mais curtiu?' : 'O que pode melhorar?';
  /* na primeira nota, ordena os chips pelo tom (bons primeiro em nota alta); depois não mexe no que já foi tocado */
  if (novo) {
    const chips = $('.av-chips', f);
    const ordem = n >= 4 ? [...RAPIDOS_BONS, ...RAPIDOS_RUINS] : [...RAPIDOS_RUINS, ...RAPIDOS_BONS];
    ordem.forEach((t) => {
      const el = [...chips.children].find((c) => c.querySelector('input').value === t);
      if (el) chips.appendChild(el);
    });
  }
  $('[type="submit"]', f).disabled = false;
  buzz(8);
});
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.dataset.form !== 'avaliar') return;
  e.preventDefault();
  const id = f.dataset.id;
  const d = new FormData(f);
  const v = {
    n: +d.get('n') || 0,
    quick: d.getAll('quick').slice(0, 6),
    text: String(d.get('text') || '')
      .trim()
      .slice(0, 600),
  };
  if (!v.n) return;
  const btn = $('[type="submit"]', f);
  if (API) {
    btn.disabled = true;
    try {
      await API.put(`/api/eu/avaliacoes/${encodeURIComponent(id)}`, {
        nota: v.n,
        rapidos: v.quick,
        comentario: v.text,
      });
    } catch (x) {
      btn.disabled = false;
      toast(x.message);
      return;
    }
  }
  S.ratings[id] = v;
  buzz(14);
  closeOverlay(() => {
    rerender();
    toast(v.n >= 4 ? 'Valeu! Avaliação enviada' : 'Obrigado pela sinceridade! Avaliação enviada');
  });
});
/* Cartão da saída no leitor: confirma a saída e chama para avaliar (ou mostra a nota já dada). */
function exitResult(q, { rated }) {
  const s = byId(q);
  const t = tipoDe(s);
  const n = notaDe(q);
  return `<div class="sr-hero">${hxBadge(`tp-${t.k}`)}<div><small class="sr-kick">Saída registrada às ${S.left[q]}</small><h2>${esc(s.short)}</h2><p>${esc(s.room)} · entrada às ${S.present[q]}</p></div></div>
      ${rated || n ? `<p class="sr-fim ok">${ic('check')}<span>Você avaliou com <b>${n} ${n === 1 ? 'estrela' : 'estrelas'}</b>. Dá para mudar até o fim do evento.</span></p>` : ''}
      <div class="sr-actions"><button class="btn primary big" data-act="avaliar" data-id="${q}">${ic('star')}${rated || n ? 'Mudar avaliação' : `Avaliar ${oQue(s)}`}</button><button class="btn soft" data-act="scanagain">${ic('qr')}Ler outro QR</button></div>`;
}
ACOES['avaliar'] = (el) => {
  const id = el.dataset.id;
  const abrir = () => openOverlay(Overlays.avaliar(id, +el.dataset.n || 0), 'ask');
  if (ov.classList.contains('open')) closeOverlay(abrir);
  else abrir();
};
/* Bloco de avaliação na tela da aula: trancado até a saída, com a hora em que libera. */
function rateBlock(id) {
  const s = byId(id);
  const n = notaDe(id);
  if (!S.left[id])
    return `<section class="block rate-lock"><span class="rl-ic">${ic('qr')}</span><span><b>Avalie no fim ${oQue(s) === 'a aula' ? 'da aula' : oQue(s) === 'a palestra' ? 'da palestra' : 'da atividade'}</b><small>A partir das ${saidaAbre(s)}, leia o QR da sala de novo. Isso registra a sua saída e libera a avaliação.</small></span></section>`;
  return `<section class="block rate"><h2 class="h">${n ? 'Sua avaliação' : 'Avalie esta atividade'}</h2><div class="stars" role="group" aria-label="Nota">${[1, 2, 3, 4, 5].map((k) => `<button class="${n >= k ? 'on' : ''}" data-act="avaliar" data-id="${id}" data-n="${k}" aria-label="${k} de 5">${ic('star')}</button>`).join('')}</div>${n ? `<small class="rate-tx">${NOTA_TXT[n]}${S.ratings[id]?.quick?.length ? ` · ${esc(S.ratings[id].quick.join(', '))}` : ''}</small>` : `<small class="rate-tx">Saída às ${S.left[id]}. Toque nas estrelas.</small>`}</section>`;
}

/* ---------------- crachá para mostrar ----------------
   O mesmo crachá da tela de entrada, com o fundo que a pessoa escolheu no perfil e o QR de verdade, grande, para o colega
   ler. Aparece em "Meu QR" e na credencial. */
function crachaGrande(p = D.person, c = cardGet() || {}, { qrHtml = qr(), legenda = '' } = {}) {
  const av = p.photo
    ? `<span class="bx-av"><img src="${esc(p.photo)}" alt=""></span>`
    : `<span class="bx-av ini">${esc(p.initials || '?')}</span>`;
  const nadic = c.nadic === 'bolsista' ? 'Bolsista do NADIC' : c.nadic === 'ex' ? 'Ex-bolsista do NADIC' : '';
  const tags = [...(c.areas || []), ...(c.langs || [])].slice(0, 3);
  return `<div class="cracha bxt-${esc(c.tema || 'etal')}">
      <i class="bx-slot"></i>
      <div class="bx-head"><span class="bx-ed">IFRN · Pau dos Ferros</span><span class="bx-brand">${mark('mark')}<b>etal</b></span><i class="bx-holo"></i></div>
      <span class="bx-photo">${av}</span>
      <div class="cr-body">
        <b class="cr-nome">${esc(p.name)}</b>
        <span class="cr-sub">${esc(p.course || p.role || (isGuest(p) ? 'Visitante' : ''))}</span>
        ${nadic ? `<span class="cr-nadic"><img src="assets/nadic-logo.svg" alt="">${nadic}</span>` : ''}
        ${tags.length ? `<span class="cr-tags">${tags.map((x) => `<i>${esc(x)}</i>`).join('')}</span>` : ''}
        ${qrHtml ? `<span class="cr-qr">${qrHtml}</span>` : ''}
        ${legenda ? `<small class="cr-leg">${legenda}</small>` : ''}
      </div>
      <div class="cr-pe"><span>${isGuest(p) ? 'Visitante' : 'Participante'}</span><span>26 a 28 nov</span></div>
    </div>`;
}

/* ---------------- pessoas ----------------
   Busca por nome e perfil de cada pessoa: o que ela mostrou no perfil, o que fez no ETAL (minicursos, palestras),
   o que conduziu e como foi nos campeonatos. Com servidor, vem de /api/pessoas; sem ele, das pessoas de exemplo. */
const pessoasCache = new Map();
function pessoasLocais() {
  const out = new Map();
  const nomes = new Set();
  /* a mesma pessoa pode vir de mais de uma fonte com códigos diferentes (perfil de exemplo e chave do campeonato) */
  const add = (p) => {
    if (!p?.id || !p.name || out.has(String(p.id)) || nomes.has(fold(p.name))) return;
    nomes.add(fold(p.name));
    out.set(String(p.id), p);
  };
  for (const [id, p] of Object.entries(D.demoProfiles || {})) add({ id, ...p });
  D.peers.forEach(add);
  communityPeople().forEach((p) => add({ ...p, ...(otherProfile(p.id) || {}), name: p.name, photo: p.photo }));
  for (const t of D.tournaments || [])
    for (const pl of t.players || []) if (pl?.[4]) add({ id: pl[4], name: pl[1], initials: pl[2] });
  return [...out.values()].filter((p) => String(p.id) !== String(D.person.id));
}
/* Colocação de alguém num campeonato, pelo id ou pelo nome do jogador na chave. */
function colocacao(t, pessoa) {
  const stt = tourSt(t);
  const pl = stt.players.find((x) => x && (String(x[4]) === String(pessoa.id) || fold(x[1]) === fold(pessoa.name)));
  if (!pl) return null;
  const R = window.TOUR.rounds(stt);
  if (R.champ === pl) return { k: 'ouro', t: 'Campeão' };
  if (R.f && R.f.w !== null && (R.f.a === pl || R.f.b === pl)) return { k: 'prata', t: 'Vice-campeão' };
  if (R.s.some((m) => m.w !== null && (m.a === pl || m.b === pl) && m.win !== pl))
    return { k: 'bronze', t: 'Semifinal' };
  if (R.q.some((m) => m.w !== null && (m.a === pl || m.b === pl) && m.win !== pl))
    return { k: '', t: 'Quartas de final' };
  return { k: '', t: stt.open ? 'Inscrito na chave' : 'Na disputa' };
}
const pessoaItem = (p) => {
  const c = p.card || {};
  const tags = c.publish === false ? [] : [...(c.areas || []), ...(c.langs || [])].slice(0, 3);
  return `<li class="ps-item" data-go="pessoa" data-id="${esc(p.id)}">${personAv(p)}<span><b>${esc(p.name)}</b><small>${esc(p.course || (p.source === 'visitante' ? 'Visitante' : ''))}${c.nadic === 'bolsista' ? ' · NADIC' : ''}</small>${tags.length ? `<em>${tags.map(esc).join(' · ')}</em>` : ''}</span>${ic('chev', 'i chev')}</li>`;
};
Screens.pessoas = () => ({
  html: `${header('Encontrar pessoas')}<div class="pad stack pessoas">
      <label class="ps-busca">${ic('search')}<input type="search" name="q" placeholder="Nome de quem você procura" autocomplete="off" enterkeyhint="search" aria-label="Buscar pessoa pelo nome"></label>
      <ul class="ps-lista" aria-live="polite"></ul>
    </div>`,
  mount: (page) => {
    const inp = $('.ps-busca input', page);
    const lista = $('.ps-lista', page);
    let t = null;
    let pedido = 0;
    const vazio = (titulo, sub) => `<li class="ps-vazio">${illo('people')}<b>${titulo}</b><small>${sub}</small></li>`;
    const mostrar = (rows, q) => {
      lista.innerHTML = rows.length
        ? rows.map(pessoaItem).join('')
        : q.length < 2
          ? vazio(
              'Procure pelo nome',
              'Digite pelo menos duas letras para achar um colega, um ministrante ou quem jogou no campeonato.',
            )
          : vazio('Ninguém com esse nome', 'Confira a grafia ou tente só o primeiro nome.');
    };
    const buscar = async () => {
      const q = inp.value.trim();
      const n = ++pedido;
      if (fold(q).length < 2) return mostrar([], q);
      if (!API)
        return mostrar(
          pessoasLocais()
            .filter((p) => fold(p.name).includes(fold(q)))
            .slice(0, 30),
          q,
        );
      try {
        const rows = await API.get(`/api/pessoas?q=${encodeURIComponent(q)}`);
        if (n !== pedido) return;
        rows.forEach((p) => pessoasCache.set(String(p.id), p));
        mostrar(
          rows.filter((p) => String(p.id) !== String(D.person.serverId)),
          q,
        );
      } catch (x) {
        if (n === pedido) lista.innerHTML = vazio('Não foi possível buscar', x.message);
      }
    };
    inp.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(buscar, API ? 280 : 60);
    });
    mostrar([], '');
    setTimeout(() => inp.focus({ preventScroll: true }), 420);
  },
});
function pessoaConteudo(p, extra = {}) {
  const c = p.card || {};
  const priv = c.publish === false;
  const att = (extra.attended || []).map(byId).filter(Boolean);
  const fez = att.filter((x) => ['mini'].includes(tipoDe(x).g));
  const viu = att.filter((x) => ['pal', 'mesa'].includes(tipoDe(x).g));
  const deu = (extra.taught || []).map(byId).filter(Boolean);
  const camps = (D.tournaments || []).map((t) => [t, colocacao(t, p)]).filter(([, r]) => r);
  const linha = (x) =>
    `<li ${goOf(x)}><span class="ps-dia"><small>${dayOf(x.day)?.week || ''}</small><b>${x.day}</b></span><span><b>${esc(x.short)}</b><small>${esc(x.type)} · ${esc(x.room || '')}</small></span>${ic('chev', 'i chev')}</li>`;
  const bloco = (titulo, icone, itens) =>
    itens.length
      ? `<section class="ps-bloco"><h2 class="h">${ic(icone)}${titulo}</h2><ul class="splist">${itens.join('')}</ul></section>`
      : '';
  const nada = !fez.length && !viu.length && !deu.length && !camps.length;
  return `<div class="ps-cracha">${crachaGrande(p, priv ? {} : c, { qrHtml: '' })}</div>
      ${priv ? '' : cardPreview(c, p, { own: false, taught: false })}
      ${
        priv
          ? `<div class="ct-empty">${ic('eye')}<span><b>Perfil privado</b><small>Esta pessoa preferiu não mostrar o que fez no evento.</small></span></div>`
          : `${bloco('Conduziu', 'mic', deu.map(linha))}
      ${bloco('Minicursos que fez', 'laptop', fez.map(linha))}
      ${bloco('Palestras e mesas', 'chat', viu.map(linha))}
      ${bloco(
        'Campeonatos',
        'trophy',
        camps.map(
          ([t, r]) =>
            `<li data-go="tournament" data-id="${esc(t.id)}"><span class="ps-medalha ${r.k}">${ic('trophy')}</span><span><b>${esc(t.name)}</b><small>${r.t} · ${esc(t.place || '')}</small></span>${ic('chev', 'i chev')}</li>`,
        ),
      )}
      ${nada ? `<p class="note">${API ? 'Ainda sem presenças registradas no ETAL.' : 'As atividades de cada pessoa aparecem aqui quando o app está ligado ao servidor.'}</p>` : ''}`
      }`;
}
Screens.pessoa = ({ id }) => {
  const base = pessoasCache.get(String(id)) ||
    pessoasLocais().find((p) => String(p.id) === String(id)) || { id, name: 'Participante' };
  const local = !API
    ? { attended: [], taught: D.sessions.filter((a) => a.speakerId === String(id)).map((a) => a.id) }
    : null;
  return {
    html: `${header('Participante')}<div class="pad stack pessoa">${pessoaConteudo(base, local || {})}</div>`,
    mount: async (page) => {
      if (!API) return;
      try {
        const p = await API.get(`/api/pessoas/${encodeURIComponent(id)}`);
        pessoasCache.set(String(id), p);
        const box = $('.pessoa', page);
        if (box) box.innerHTML = pessoaConteudo(p, p);
      } catch (x) {
        toast(x.message);
      }
    },
  };
};
