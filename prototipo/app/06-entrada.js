/* app/06-entrada.js · entrada pelo crachá: SUAP, visitante e abertura do app.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- entrada: o crachá ----------------
     Um crachá em branco pendurado no cordão. Enquanto a pessoa digita, os dados aparecem nele; ao entrar,
     o cartão vira e mostra o crachá preenchido. Para abrir o app, puxa-se o crachá para baixo e a tela desce.
     Padrão dos apps de evento: o ingresso é um QR no app (Web Summit) e a conta serve ao credenciamento (Doity). */
const guestSaved = () => {
  try {
    return JSON.parse(localStorage.getItem('etal-visitante'));
  } catch (_) {
    return null;
  }
};
const GUEST_KINDS = [
  ['estudante', 'Estudante'],
  ['professor', 'Professor(a)'],
  ['profissional', 'Profissional'],
  ['comunidade', 'Comunidade'],
];
let lgPending = null;
let lgPhys = null;

function suapFields() {
  return `<form class="login-form" data-form="login" novalidate>
        <label class="field" for="mat"><span>Matrícula</span><input id="mat" inputmode="numeric" autocomplete="username" placeholder="Sua matrícula do SUAP" required></label>
        <label class="field" for="pwd"><span>Senha</span><div class="pwd"><input id="pwd" type="password" autocomplete="current-password" placeholder="A mesma senha do SUAP" required><button type="button" class="iconbtn sm" data-act="togglepwd" aria-label="Mostrar senha">${ic('eye')}</button></div></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Entrar com o SUAP</span><i class="spin"></i></button>
        ${API ? `<button class="btn ghost" type="button" data-act="suapoauth">Entrar pela página do SUAP</button>` : '<button class="btn ghost" type="button" id="lgdemo" data-act="demo" hidden>Entrar com dados de exemplo</button>'}
      </form>`;
}
function guestFields() {
  const saved = guestSaved();
  return `${saved ? `<button class="lx-resume" type="button" data-act="guestresume"><span class="lx-ic">${esc(saved.initials)}</span><span><b>Continuar como ${esc(saved.first)}</b><small>Conta de visitante neste aparelho</small></span>${ic('chev')}</button><p class="lx-or">ou crie outra conta</p>` : ''}
      <form class="login-form guest-form" data-form="guest" novalidate>
        <label class="field" for="gname"><span>Nome completo</span><input id="gname" autocomplete="name" placeholder="Como vai aparecer no crachá" required></label>
        <label class="field" for="gmail"><span>E-mail</span><input id="gmail" type="email" inputmode="email" autocomplete="email" placeholder="Para receber o certificado" required></label>
        <fieldset class="g-kind"><legend>Você é</legend>${GUEST_KINDS.map(([v, t], i) => `<label><input type="radio" name="gkind" value="${v}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}</fieldset>
        <div class="g-two">
          <label class="field" for="ginst"><span>Instituição</span><input id="ginst" autocomplete="organization" placeholder="Opcional"></label>
          <label class="field" for="gcity"><span>Cidade</span><input id="gcity" list="gcities" autocomplete="address-level2" placeholder="Sua cidade" required></label>
        </div>
        <datalist id="gcities">${['Pau dos Ferros', 'Mossoró', 'São Miguel', 'Alexandria', 'Encanto', 'Rafael Fernandes', 'Portalegre', 'Marcelino Vieira', 'Cajazeiras', 'Natal'].map((c) => `<option value="${c}">`).join('')}</datalist>
        <label class="g-ok"><input type="checkbox" id="gok" required><span>Concordo que o ETAL use estes dados só para o credenciamento e os certificados.</span></label>
        <p class="lg-err" id="lgerr" role="alert" hidden></p>
        <button class="btn primary big" type="submit"><span>Criar conta</span><i class="spin"></i></button>
      </form>`;
}
/* Frente do crachá. Sem perfil, é o cartão em branco que vai se preenchendo enquanto a pessoa digita. */
const bxClip =
  '<svg class="bx-clip" viewBox="0 0 40 44" aria-hidden="true"><circle cx="20" cy="7" r="5.200" fill="none" stroke="#98a2b3" stroke-width="2.800"/><rect x="13" y="11" width="14" height="15" rx="3.500" fill="#c4cbd7"/><rect x="15.500" y="13" width="3.500" height="11" rx="1.750" fill="#eef1f6"/><rect x="4" y="27" width="32" height="12" rx="3.500" fill="rgba(255,255,255,.6)" stroke="rgba(110,125,150,.55)"/></svg>';
function badgeFace(p) {
  const blank = !p;
  const av = blank
    ? `<span class="bx-av ph">${ic('user')}</span>`
    : p.photo
      ? `<span class="bx-av"><img src="${p.photo}" alt=""></span>`
      : `<span class="bx-av ini">${esc(p.initials)}</span>`;
  const role = blank ? ['ph', 'Credencial'] : p.source === 'visitante' ? ['guest', 'Visitante'] : ['', 'Participante'];
  return `<i class="bx-slot"></i>
      <div class="bx-head"><span class="bx-ed">IFRN · Pau dos Ferros</span><span class="bx-brand">${mark('mark')}<b>etal</b></span>${blank ? '' : '<i class="bx-holo"></i>'}</div>
      <span class="bx-photo">${av}${blank ? '' : `<button class="badge-photo-edit" data-act="profile-edit" aria-label="Editar nome e foto do crachá">${ic('pencil')}</button>`}</span>
      <div class="bx-body">
        ${
          blank
            ? `<b class="bx-name ph" data-live="name">Seu nome</b><span class="bx-sub" data-live="sub">${S.lgMode === 'guest' ? 'Visitante' : 'Matrícula do SUAP'}</span>`
            : `<b class="bx-name">${esc(p.name)}</b>${officialName(p) !== p.name ? `<small class="bx-real">${ic('lock')}${esc(officialName(p))}</small>` : ''}<span class="bx-sub">${esc(p.course || '')}</span><small class="bx-sub2">${esc([p.year, p.campus].filter(Boolean).join(' · '))}</small>`
        }
        <div class="bx-row">${
          blank
            ? `<span class="bx-qr ph">${ic('qr')}</span><small data-live="state">Seu QR aparece aqui depois de entrar</small>`
            : `<span class="bx-qr">${qr(7, 25)}</span><small><span>Seu código</span><b>${esc(p.id)}</b></small>`
        }</div>
      </div>
      <div class="bx-role ${role[0]}"><b>${role[1]}</b><span>${periodoEvento()}</span></div>
      <i class="bx-sheen"></i>`;
}
const yardText = 'ETAL · CONNECT · '.repeat(16);

Screens.login = () => {
  const guest = S.lgMode === 'guest';
  return {
    chrome: false,
    mount: (el) => mountBadgeLogin(el),
    html: `<div class="login lx lx-cracha${guest ? ' guest-mode' : ''}">
        <header class="lx-brand dark">${mark('mark xs')}<b>etal</b><span>connect</span></header>
        <div class="lx-hang" id="lxhang">
          <svg class="lx-yard" aria-hidden="true">${['lyA', 'lyB'].map((id) => `<g class="ly"><path class="ly-e"/><path class="ly-m" id="${id}"/><text dy="2.600"><textPath href="#${id}">${yardText}</textPath></text></g>`).join('')}</svg>
          <div class="lx-card" aria-hidden="true"><div class="bx">${bxClip}<div class="bx-flip"><div class="bx-face blank">${badgeFace(null)}</div><div class="bx-face filled"></div></div></div></div>
        </div>
        <p class="lx-pull" aria-hidden="true"><span class="lx-arrow">${ic('chev')}</span><span class="t1">Puxe o crachá para baixo</span><span class="t2">Solte para abrir</span></p>
        <div class="lx-bottom">
          <div class="lx-start">
            <div class="lx-seg" role="tablist" aria-label="Como você vai entrar">
              <button type="button" role="tab" data-act="lgmode" data-v="suap" aria-selected="${!guest}">Sou do IFRN</button>
              <button type="button" role="tab" data-act="lgmode" data-v="guest" aria-selected="${guest}">Vim de fora</button>
            </div>
            <div class="lx-form">${guest ? guestFields() : suapFields()}</div>
          </div>
          <div class="lx-done" role="status">
            <h2 class="lx-q" data-live="hello">Tudo certo!</h2>
            <button class="btn ghost badge-edit" data-act="profile-edit" type="button">${ic('pencil')}Editar nome e foto</button>
            <button class="btn primary big" data-act="lgenter" type="button">Entrar no ETAL</button>
            <button class="btn ghost" data-act="lgredo" type="button">Não sou eu</button>
          </div>
        </div>
      </div>`,
  };
};

/* Física do crachá. O cartão pende do cordão como um pêndulo de mola: segue o dedo com resistência elástica,
     balança com o movimento e volta quicando. Depois de entrar, o cordão tem uma folga; passou dela, o cordão
     estica e puxa a própria tela, que desce e mostra o app já montado por baixo. */
function mountBadgeLogin(el) {
  const lg = $('.login', el);
  const hang = $('#lxhang', el);
  const piv = $('.lx-card', el);
  const bx = $('.bx', el);
  const yard = [...el.querySelectorAll('.ly')].map((g) => [...g.querySelectorAll('path')]);
  const P = {
    x: 0,
    y: 0,
    a: reduce ? 0 : 0.32,
    vx: 0,
    vy: 0,
    va: 0,
    cv: 0,
    vc: 0,
    drag: null,
    app: null,
    going: false,
    raf: 0,
    last: 0,
    until: 0,
    touch: 0,
    filledAt: 0,
    ready: false,
  };
  lgPhys = P;
  const SLACK = 64;
  const OPEN = 120;
  const rb = (d, c) => c * (1 - 1 / ((d / c) * 0.55 + 1));
  const rbs = (d, c) => (d < 0 ? -rb(-d, c) : rb(d, c));
  const live = (k, v) => {
    const n = $(`[data-live="${k}"]`, el);
    if (n) {
      n.textContent = v;
      n.classList.toggle('typed', true);
    }
  };

  function draw() {
    const W = hang.clientWidth;
    const L = parseFloat(getComputedStyle(lg).getPropertyValue('--L')) || 46;
    piv.style.setProperty('--px', `${P.x.toFixed(2)}px`);
    piv.style.setProperty('--py', `${P.y.toFixed(2)}px`);
    piv.style.setProperty('--pa', `${P.a.toFixed(4)}rad`);
    bx.style.setProperty('--tilt', P.a.toFixed(3));
    const px = W / 2 + P.x;
    const py = L + P.y;
    const tp = -110;
    const ends = [
      [W / 2 - 46, px - 3.5],
      [W / 2 + 46, px + 3.5],
    ];
    yard.forEach(([e, m], i) => {
      const d = `M${ends[i][0].toFixed(1)} ${tp}L${ends[i][1].toFixed(1)} ${py.toFixed(1)}`;
      e.setAttribute('d', d);
      m.setAttribute('d', d);
    });
    if (P.app && !P.going) {
      const k = Math.min(1, P.cv / Math.max(1, el.clientHeight));
      el.style.transform = P.cv > 0.3 ? `translate3d(0,${P.cv.toFixed(1)}px,0)` : '';
      P.app.style.transform = `scale(${(0.92 + 0.08 * k).toFixed(4)})`;
      P.app.style.filter = `brightness(${(0.7 + 0.3 * k).toFixed(3)})`;
      el.classList.toggle('lx-moving', P.cv > 0.3);
    }
  }
  function step(t) {
    P.raf = 0;
    if (!el.isConnected) return;
    const dt = Math.min(0.033, Math.max(0.001, (t - (P.last || t - 16)) / 1000));
    P.last = t;
    if (!P.drag) {
      P.vx += (-240 * P.x - 13 * P.vx) * dt;
      P.vy += (-240 * P.y - 13 * P.vy) * dt;
      P.x += P.vx * dt;
      P.y += P.vy * dt;
      if (P.app && !P.going) {
        P.vc += (-280 * P.cv - 26 * P.vc) * dt;
        P.cv += P.vc * dt;
        if (P.cv < 0) {
          P.cv = 0;
          P.vc = 0;
        }
      }
    }
    /* O cartão atrasa em relação ao ponto de pendurar: quem anda para a direita faz ele girar para a esquerda. */
    const aT = Math.max(-0.75, Math.min(0.75, -P.vx * 0.00085));
    P.va += (-70 * (P.a - aT) - 3.2 * P.va) * dt;
    P.a += P.va * dt;
    draw();
    const motion =
      Math.abs(P.x) +
      Math.abs(P.y) +
      Math.abs(P.vx) * 0.05 +
      Math.abs(P.vy) * 0.05 +
      Math.abs(P.a) * 200 +
      Math.abs(P.va) * 60 +
      P.cv +
      Math.abs(P.vc) * 0.05;
    if (motion > 0.25 || P.drag || P.going || t < P.until) wake();
    else {
      P.last = 0;
      P.x = P.y = P.a = 0;
      draw();
    }
  }
  function wake(ms) {
    if (ms) P.until = Math.max(P.until, performance.now() + ms);
    if (!P.raf) P.raf = requestAnimationFrame(step);
  }
  P.kick = (vx = 0, vy = 0, va = 0, ms = 0) => {
    if (reduce) {
      wake(ms);
      return;
    }
    P.vx += vx;
    P.vy += vy;
    P.va += va;
    wake(ms);
  };

  /* O app é montado por baixo assim que a pessoa começa a puxar; se ela desistir, ele fica lá esperando. */
  function arm() {
    if (P.app || !lgPending) return;
    navReset();
    S.auth = true;
    S.tab = 'home';
    el.style.animation = 'none';
    el.classList.remove('in-fade', 'in-push', 'in-pop');
    const app = build(top());
    app.classList.add('lx-under');
    vp.insertBefore(app, el);
    if (app._mount) app._mount(app);
    P.app = app;
    draw();
  }
  P.disarm = () => {
    if (!P.app) return;
    P.app.remove();
    P.app = null;
    S.auth = false;
    P.cv = P.vc = 0;
    el.style.transform = '';
    el.classList.remove('lx-moving');
  };
  P.commit = (v = 0) => {
    if (P.going) return;
    arm();
    if (!P.app) return;
    const prof = lgPending;
    lgPending = null;
    P.going = true;
    S.lgMode = null;
    const app = P.app;
    const H = el.clientHeight + 60;
    const dur = reduce ? 1 : Math.round(Math.max(260, Math.min(600, (H - P.cv) / Math.max(1.5, v / 1000))));
    setChrome(app);
    el.classList.add('lx-moving');
    el.style.transition = `transform ${dur}ms cubic-bezier(.3,.6,.25,1)`;
    app.style.transition = `transform ${dur}ms cubic-bezier(.2,.7,.2,1), filter ${dur}ms ease-out`;
    void el.offsetWidth;
    el.style.transform = `translate3d(0,${H}px,0)`;
    app.style.transform = 'none';
    app.style.filter = 'none';
    P.kick(0, 420, 0.9);
    buzz([10, 30, 18]);
    setTimeout(() => {
      el.remove();
      app.style.transition = app.style.transform = app.style.filter = '';
      app.classList.remove('lx-under');
      qrPendente();
    }, dur + 40);
    cardIntro(dur + 700);
    if (prof.source === 'visitante')
      setTimeout(
        () =>
          notify(
            `Boas-vindas, ${prof.first}!`,
            'Sua conta de visitante está pronta. Mostre o QR do crachá na recepção.',
          ),
        dur + 350,
      );
  };

  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'mat') live('sub', t.value.trim() ? `Matrícula ${t.value.trim()}` : 'Matrícula do SUAP');
    if (t.id === 'gname') live('name', t.value.trim() || 'Seu nome');
    if (t.id === 'gcity' || t.name === 'gkind') {
      const kind = (GUEST_KINDS.find(([v]) => v === ($('[name=gkind]:checked', el) || {}).value) || GUEST_KINDS[0])[1];
      live('sub', ['Visitante', kind, $('#gcity', el)?.value.trim()].filter(Boolean).join(' · '));
    }
    if (/^(mat|gname|gcity)$/.test(t.id) || t.name === 'gkind') P.kick(0, 0, (Math.random() - 0.5) * 0.7);
  });
  el.addEventListener('change', (e) => {
    if (e.target.name === 'gkind') e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });

  let samples = [];
  hang.addEventListener('pointerdown', (e) => {
    if (P.going || e.button > 0 || e.target.closest('button')) return;
    P.drag = { x0: e.clientX, y0: e.clientY, bx: P.x, by: P.y + P.cv, moved: false };
    samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
    P.vc = 0;
    P.touch = performance.now();
    hang.setPointerCapture(e.pointerId);
    lg.classList.add('pulling');
    wake();
  });
  hang.addEventListener('pointermove', (e) => {
    const d = P.drag;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
    const s0 = samples[0];
    const sdt = Math.max(10, e.timeStamp - s0.t);
    P.vx = ((e.clientX - s0.x) / sdt) * 1000;
    P.vy = ((e.clientY - s0.y) / sdt) * 1000;
    P.x = d.bx + rbs(dx, 70);
    const yy = d.by + dy;
    if (lgPending) {
      if (yy > SLACK * 0.4) arm();
      if (yy <= SLACK) {
        P.y = yy < 0 ? -rb(-yy, 28) : yy;
        P.cv = 0;
      } else {
        const ex = yy - SLACK;
        const st = rb(ex, 22);
        P.y = SLACK + st;
        P.cv = ex - st;
      }
      const rdy = P.cv > OPEN;
      if (rdy !== P.ready) {
        P.ready = rdy;
        lg.classList.toggle('ready', rdy);
        buzz(rdy ? 14 : 6);
      }
    } else P.y = rbs(yy, yy > 0 ? 80 : 28);
    P.touch = performance.now();
  });
  const release = () => {
    const d = P.drag;
    if (!d) return;
    P.drag = null;
    lg.classList.remove('pulling');
    if (!d.moved) {
      P.kick(0, 0, (Math.random() < 0.5 ? -1 : 1) * 1.8);
      return;
    }
    if (lgPending && (P.cv > OPEN || (P.vy > 650 && P.cv > 14))) {
      P.commit(P.vy);
      return;
    }
    if (P.cv > 0) {
      P.vc = Math.min(0, P.vy) * 0.4;
      P.vy = 0;
    }
    P.ready = false;
    lg.classList.remove('ready');
    wake();
  };
  hang.addEventListener('pointerup', release);
  hang.addEventListener('pointercancel', release);
  hang.addEventListener('keydown', (e) => {
    if (e.target.closest('button')) return;
    if (lgPending && (e.key === 'ArrowDown' || e.key === 'Enter')) P.commit();
  });

  /* Até a pessoa mexer, o crachá dá um puxãozinho sozinho para mostrar que dá para puxar. */
  const nudge = setInterval(() => {
    if (!el.isConnected) {
      clearInterval(nudge);
      return;
    }
    const now = performance.now();
    if (lgPending && !P.drag && !P.going && now - P.touch > 2600 && now - P.filledAt > 1500) P.kick(0, 520, 0, 0);
  }, 2800);
  new ResizeObserver(() => wake(50)).observe(hang);
  wake(reduce ? 50 : 400);
}
/* Entrou: o cartão vira e mostra o crachá preenchido. */
function lgFilled(prof) {
  if (API && irParaDestino()) return;
  prof.officialName = prof.officialName || prof.name;
  Object.assign(prof, profileLocal(prof.id));
  applyProfile(prof);
  lgPending = prof;
  const lg = $('.login');
  if (!lg) return;
  $('.bx-face.filled', lg).innerHTML = badgeFace(prof);
  $('.lx-card', lg).removeAttribute('aria-hidden');
  $('.bx-face.blank', lg).setAttribute('aria-hidden', 'true');
  $('[data-live="hello"]', lg).textContent = `Tudo certo, ${prof.first}!`;
  lg.classList.add('filled');
  buzz([14, 40, 14]);
  if (lgPhys) {
    lgPhys.filledAt = performance.now();
    lgPhys.kick(0, 0, 1.3, 1400);
  }
  setTimeout(() => $('[data-act="lgenter"]', lg)?.focus({ preventScroll: true }), 700);
}
/* A tela de entrada desce e o app aparece por trás. */
function lgOpenApp() {
  if (lgPending && lgPhys) lgPhys.commit(0);
}
function lgShake(msg) {
  lgPhys?.kick(950, 0, 0.6);
  buzz(40);
  const s = $('[data-live="state"]');
  if (s) s.textContent = msg || 'Confira os dados abaixo';
}
/* Conta de visitante: só o necessário para o crachá e o certificado. */
function guestProfile(f) {
  const name = f.name.replace(/\s+/g, ' ').trim();
  const parts = name.split(' ');
  const kind = (GUEST_KINDS.find(([v]) => v === f.kind) || GUEST_KINDS[0])[1];
  let h = 0;
  for (const ch of f.email.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    name,
    first: parts[0],
    initials: (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '')).toUpperCase(),
    course: 'Visitante',
    courseFull: `Visitante · ${kind}${f.inst ? ` · ${f.inst}` : ''}`,
    year: kind,
    campus: f.city,
    id: `VIS${String(h % 1000000).padStart(6, '0')}`,
    email: f.email,
    institution: f.inst || '',
    source: 'visitante',
    photo: null,
  };
}

function badge() {
  const ok = !!S.credAt;
  const pinsSvg =
    '<svg class="pins" viewBox="0 0 60 20" aria-hidden="true"><path d="M8 20V9M30 20V9M52 20V9"/><circle cx="8" cy="5.500" r="3.400"/><circle cx="30" cy="5.500" r="3.400"/><circle cx="52" cy="5.500" r="3.400"/></svg>';
  return `<section class="badge st" ${st(0)}>
      <div class="flip ${S.flipSeen ? '' : 'hint'}" data-act="flip" role="button" tabindex="0" aria-label="Virar crachá e ver o código">
        <div class="flip-in">
          <div class="face front">
            <div class="b-top"><span class="b-mark">${mark('mark xs')}etal</span>${pinsSvg}</div>
            <div class="b-id">${meAv('av')}<span class="b-name"><strong>${esc(D.person.name)}</strong><span>${esc(D.person.course)}</span><small>${esc([D.person.year, D.person.campus].filter(Boolean).join(' · '))}</small></span></div>
            <span class="flip-tip">${ic('rotate')}Virar</span>
          </div>
          <div class="face back">
            <div class="back-qr ${ok ? '' : 'locked-qr'}">${qr()}${ok ? '' : `<i>${ic('lock')}</i>`}</div>
            <div class="back-tx"><b>${ok ? 'Seu código' : 'Código bloqueado'}</b><span>${ok ? 'Mostre quando a organização pedir.' : 'Libera depois da leitura na recepção.'}</span><small>${esc(D.person.id)}</small></div>
          </div>
        </div>
      </div>
      ${
        ok
          ? `<button class="b-strip ok" data-go="credential">${ic('check', 'i dot')}<span><b>Credenciamento confirmado</b><small>Entrada às ${S.credAt} na recepção</small></span>${ic('chev')}</button>`
          : `<button class="b-strip pend" data-act="scan">${ic('qr', 'i dot')}<span><b>Credenciamento pendente</b><small>Leia o QR da recepção, no térreo</small></span>${ic('chev')}</button>`
      }
    </section>`;
}
