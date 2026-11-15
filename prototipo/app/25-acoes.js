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
