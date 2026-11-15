/* app/25-acoes-lembretes-e-pwa.js · ações de lembretes e pwa.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
ACOES['remind'] = (el, e, a) => {
  const id = el.dataset.id;
  const on = !S.reminders.has(id);
  const x = byId(id);
  if (on) S.reminders.add(id);
  else {
    S.reminders.delete(id);
    remFired.delete(id);
  }
  prefs.set(REM_KEY, JSON.stringify([...S.reminders]));
  if (on)
    askNotify().then(() => {
      rerender();
      toast(`Lembrete às ${hhmm(toMin(x.time) - LEAD)} de ${dayOf(x.day).week.toLowerCase()}, ${x.day}`);
      checkReminders();
    });
  else {
    rerender();
    toast('Lembrete desligado');
  }
};

ACOES['remindtest'] = (el, e, a) => {
  deliver(byId(el.dataset.id), true);
};

ACOES['install'] = (el, e, a) => {
  installApp();
};

ACOES['instalar-fechar'] = (el, e, a) => {
  prefs.set('etal-instalar-oculto', '1');
  el.closest('.instalar')?.remove();
  toast('Dá para instalar depois em Perfil');
};

ACOES['update'] = (el, e, a) => {
  if (PWA.waiting) {
    PWA.updating = true;
    PWA.waiting.postMessage({ type: 'skip' });
  } else location.reload();
};
