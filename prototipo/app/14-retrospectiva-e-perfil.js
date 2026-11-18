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
    `<div class="re-c re-end">${mark('mark re-mark')}${tag}<h1>Até o próximo ETAL</h1><p>${horasTxt(r.hours)} ${r.hours === 1 ? 'hora' : 'horas'}, ${n} ${n === 1 ? 'atividade' : 'atividades'} e ${got} ${got === 1 ? 'favo' : 'favos'}.</p><div class="re-actions"><button class="btn big re-primary" data-act="retroshare">${ic('share')}Compartilhar</button><button class="btn big re-ghost" data-act="retroclose">Fechar</button></div></div>`,
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
      num.textContent = `${k < 1 ? Math.round(to * (1 - (1 - k) ** 3)) : horasTxt(to)}h`;
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
    text: `Meu ETAL: ${horasTxt(data.hours)} horas em ${data.list.length} atividades e ${demo ? D.combs.length : combEarned().length} favos na colmeia.`,
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
