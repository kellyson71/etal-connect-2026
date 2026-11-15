/* app/20-lembretes.js · lembretes antes das atividades.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- lembretes ----------------
     O relógio do evento é o mesmo do "Horário do céu". Dez minutos antes de uma atividade com lembrete,
     o app avisa com a sala, o andar e o tempo a pé calculado pela rota do mapa. Com permissão,
     o aviso também sai como notificação do sistema, que abre a atividade. */
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const remFired = new Set();
const notifState = () => ('Notification' in window ? Notification.permission : 'unsupported');
async function askNotify() {
  if (notifState() !== 'default') return notifState();
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return 'denied';
  }
}
function walkMin(x) {
  if (x.floor === undefined) return null;
  try {
    return Math.max(1, Math.round(window.Campus3D.routeInfo(x.floor, x.zone).cost / 75));
  } catch (_) {
    return null;
  }
}
function reminderText(x, test) {
  const left = toMin(x.time) - Math.round(skyHour * 60);
  const w = walkMin(x);
  const title =
    test || left > LEAD || left < 0
      ? `Começa às ${x.time}: ${x.short}`
      : left
        ? `Começa em ${left} min: ${x.short}`
        : `Começando agora: ${x.short}`;
  return { title, body: [whereOf(x), w ? `${w} min a pé da entrada` : ''].filter(Boolean).join(' · ') };
}
async function deliver(x, test) {
  if (!x) return;
  const { title, body } = reminderText(x, test);
  notify(title, body, x.id);
  if (notifState() !== 'granted') return;
  const opts = {
    body,
    icon: 'assets/pwa/icon-192.png',
    badge: 'assets/pwa/icon-192.png',
    tag: `lembrete-${x.id}`,
    data: { id: x.id },
    vibrate: [60, 40, 60],
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch (_) {
    /* o aviso dentro do app já foi mostrado */
  }
}
function checkReminders() {
  const now = Math.round(skyHour * 60);
  S.reminders.forEach((id) => {
    const x = byId(id);
    if (!x || x.day !== D.now.day || remFired.has(id)) return;
    if (now >= toMin(x.time) - LEAD && now < toMin(x.time)) {
      remFired.add(id);
      deliver(x);
    }
  });
}
function openActivity(id) {
  if (!S.auth || !byId(id)) return;
  if (ov.classList.contains('open')) closeOverlay();
  if (S.tab !== 'home') {
    S.tab = 'home';
    S.stacks.home = [{ s: 'home' }];
    show(build(top()), 'fade');
  }
  push('activity', { id });
}
