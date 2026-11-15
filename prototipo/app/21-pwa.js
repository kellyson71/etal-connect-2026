/* app/21-pwa.js · app instalável e uso sem internet.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- app instalável e sem internet ----------------
     O service worker (sw.js) guarda o app no aparelho. Só funciona em HTTPS ou no próprio computador. */
const PWA = { prompt: null, waiting: null, updating: false, ready: false, version: null };
const swAllowed =
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));
if (swAllowed) {
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      const watch = (w) =>
        w &&
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            PWA.waiting = w;
            offerUpdate();
          }
        });
      if (reg.waiting && navigator.serviceWorker.controller) {
        PWA.waiting = reg.waiting;
        offerUpdate();
      }
      reg.addEventListener('updatefound', () => watch(reg.installing));
      if (reg.active) {
        PWA.ready = true;
        netState();
      }
    })
    .catch(() => {
      /* sem service worker, o app segue online */
    });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'ready') {
      PWA.ready = true;
      PWA.version = e.data.version;
      if (!prefs.get('etal-offline')) {
        prefs.set('etal-offline', '1');
        toast('Pronto para usar sem internet');
      }
    }
    if (e.data?.type === 'open') openActivity(e.data.id);
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (PWA.updating) location.reload();
  });
}
function offerUpdate() {
  const b = $('#upd');
  if (!b) return;
  b.innerHTML = `<span><b>Nova versão do app</b><small>As mudanças entram ao atualizar.</small></span><button data-act="update">Atualizar</button>`;
  b.classList.add('show');
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  PWA.prompt = e;
  if (S.auth && (S.tab === 'profile' || S.tab === 'home')) rerender();
});
window.addEventListener('appinstalled', () => {
  PWA.prompt = null;
  toast('ETAL Connect instalado');
});
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
async function installApp() {
  if (PWA.prompt) {
    PWA.prompt.prompt();
    const r = await PWA.prompt.userChoice.catch(() => null);
    PWA.prompt = null;
    if (r?.outcome !== 'accepted') toast('Instalação cancelada');
    else askNotify();
    rerender();
    return;
  }
  if (isIOS()) {
    notify('Instalar no iPhone', 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".');
    return;
  }
  notify(
    'Instalar o app',
    swAllowed
      ? 'Abra o menu do navegador e toque em "Instalar app".'
      : 'A instalação precisa de HTTPS. Pelo Wi-Fi local, o app abre só no navegador.',
  );
}
/* Sem internet: o app avisa e segue com a cópia guardada. */
function netState() {
  const bar = $('#netbar');
  if (!bar) return;
  if (navigator.onLine) {
    if (bar.classList.contains('show')) {
      bar.textContent = 'Conexão de volta';
      bar.classList.add('ok');
      setTimeout(() => bar.classList.remove('show', 'ok'), 1600);
    }
    return;
  }
  bar.classList.remove('ok');
  const n = S.auth && API ? pendentes().length : 0;
  bar.textContent =
    (PWA.ready ? 'Sem internet · usando a cópia salva no aparelho' : 'Sem internet') +
    (n ? ` · ${n} ${n === 1 ? 'leitura' : 'leituras'} para enviar` : '');
  bar.classList.add('show');
}
window.addEventListener('online', netState);
window.addEventListener('offline', netState);

function applyProfile(p) {
  Object.assign(D.person, p, { officialName: p.officialName || p.name }, profileLocal(p.id));
}
/* Troca entre IFRN e visitante sem refazer o crachá. */
function lgSwap(mode) {
  S.lgMode = mode;
  const lg = $('.login');
  if (!lg) return;
  lg.classList.toggle('guest-mode', mode === 'guest');
  lg.querySelectorAll('[data-act="lgmode"]').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.v === (mode || 'suap'))),
  );
  const box = $('.lx-form', lg);
  box.innerHTML = mode === 'guest' ? guestFields() : suapFields();
  box.classList.remove('swap');
  void box.offsetWidth;
  box.classList.add('swap');
  $('[data-live="name"]', lg).textContent = 'Seu nome';
  $('[data-live="sub"]', lg).textContent = mode === 'guest' ? 'Visitante' : 'Matrícula do SUAP';
  lg.querySelectorAll('.typed').forEach((n) => n.classList.remove('typed'));
  lgPhys?.kick(0, 0, 0.5, 900);
}
function navReset() {
  const n = navUndo.length;
  navUndo.length = 0;
  if (n) {
    navSkip += 1;
    history.go(-n);
  }
}
