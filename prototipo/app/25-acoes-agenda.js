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
