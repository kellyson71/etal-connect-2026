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
