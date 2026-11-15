/* app/28-servidor.js · servidor: config.js, api.js e eventos ao vivo.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- servidor (config.js → api) ----------------
     Com a API ligada, programação, perfil, agenda, presenças e avisos vêm do servidor; sem ela, tudo segue de exemplo. */
const isoHM = (iso) => (iso ? iso.slice(11, 16) : null);
function apiPerson(p) {
  suapSummary = null;
  return {
    ...DEMO_PERSON,
    name: p.name,
    first: p.first,
    initials: p.initials,
    course: p.course || (p.source === 'visitante' ? 'Visitante' : ''),
    courseFull: p.course || '',
    year: '',
    campus: p.campus || p.city || '',
    id: p.matricula || p.email || String(p.id),
    photo: p.photo || null,
    source: p.source === 'visitante' ? 'guest' : 'suap',
    org: p.org,
  };
}
function apiState(me) {
  Object.keys(D.person).forEach((k) => delete D.person[k]);
  applyProfile(apiPerson(me.person));
  S.saved = new Set(me.saved);
  D.enrolled.length = 0;
  D.enrolled.push(...me.saved);
  S.present = { ...me.present };
  S.credAt = isoHM(me.person.credentialedAt);
}
async function apiQr(token) {
  try {
    const r = await API.post('/api/presenca', { qr: token });
    if (r.activity) {
      S.present[r.activity] = r.time;
      communityCheckin(r.activity);
    }
    if (!S.credAt) S.credAt = r.time;
    const x = r.activity && byId(r.activity);
    toast(
      r.alreadyPresent
        ? 'Presença já estava registrada'
        : x
          ? `Presença registrada: ${x.short}`
          : 'Credenciamento confirmado',
    );
    rerender();
  } catch (x) {
    toast(x.message);
  }
}
/* Para a câmera e deixa o último quadro na tela, atrás do cartão de confirmação. */
function freezeCam() {
  const v = $('.scan-cam');
  if (v && v.videoWidth) {
    try {
      const cv = document.createElement('canvas');
      cv.width = v.videoWidth;
      cv.height = v.videoHeight;
      cv.getContext('2d').drawImage(v, 0, 0);
      v.poster = cv.toDataURL('image/jpeg', 0.8);
    } catch (_) {
      /* sem quadro */
    }
  }
  camStop();
  if (v) v.srcObject = null;
}
/* QR lido pela câmera com o servidor: trava o leitor, registra no servidor e mostra o mesmo cartão de confirmação. */
async function apiScan(hit) {
  const root = $('.scanner', ov);
  const hint = $('.scan-hint span', ov);
  if (root) {
    root.dataset.busy = '1';
    root.classList.add('is-locked');
  }
  if (hint) hint.innerHTML = `${ic('check')}QR reconhecido`;
  freezeCam();
  let r;
  try {
    r = await API.post('/api/presenca', { qr: hit });
  } catch (x) {
    camStop();
    closeOverlay(() => toast(x.message));
    return;
  }
  const first = !S.credAt;
  if (first) S.credAt = r.time;
  const q = r.activity && byId(r.activity) ? r.activity : null;
  if (!q) {
    const c = takeNewComb();
    rerender();
    if (first) closeOverlay(() => openOverlay(Overlays.welcome(c), 'welcome'));
    else scanSheet(credResult());
    return;
  }
  const again = !!r.alreadyPresent;
  S.present[q] = S.present[q] || r.time;
  communityCheckin(q);
  const c = takeNewComb();
  rerender();
  scanSheet(roomResult(q, { again, first, c }));
}
/* Câmera de verdade no leitor. Lê com o BarcodeDetector do navegador ou, sem ele (computador, iPhone), com o jsQR.
     Com o servidor, o QR assinado vai para /api/presenca; sem ele, o app tira a atividade de dentro do QR. */
let cam = null;
function camStop() {
  if (!cam) return;
  cam.stop = true;
  cam.stream?.getTracks().forEach((t) => t.stop());
  cam = null;
}
/* ZXing em WebAssembly (vendor/zxing-reader.js + zxing_reader.wasm, MIT): bem mais rápido que o jsQR e lê imagem borrada
     de webcam. O .wasm vem do próprio app (fica no cache offline), nunca de CDN. */
let zxLoad = null;
const loadZXing = () =>
  zxLoad ||
  (zxLoad = new Promise((ok, no) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/zxing-reader.js';
    sc.onerror = no;
    sc.onload = () => {
      const Z = window.ZXingWASM;
      if (!Z) {
        no(new Error('zxing'));
        return;
      }
      Z.prepareZXingModule({
        overrides: {
          locateFile: (f, pre) =>
            f.endsWith('.wasm') ? new URL('vendor/zxing_reader.wasm', location.href).href : pre + f,
        },
        fireImmediately: true,
      }).then(() => ok(Z), no);
    };
    document.head.appendChild(sc);
  }));
let jsqrLoad = null;
const loadJsQR = () =>
  jsqrLoad ||
  (jsqrLoad = new Promise((ok, no) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/jsQR.js';
    sc.onload = () => ok(window.jsQR);
    sc.onerror = no;
    document.head.appendChild(sc);
  }));
async function makeReader(video) {
  if ('BarcodeDetector' in window) {
    try {
      const fm = await window.BarcodeDetector.getSupportedFormats?.();
      if (!fm || fm.includes('qr_code')) {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async () => (await det.detect(video)).map((c) => ({ v: c.rawValue, pts: c.cornerPoints }));
      }
    } catch (_) {
      /* cai no jsQR */
    }
  }
  try {
    const Z = await loadZXing();
    const zc = document.createElement('canvas');
    const zx = zc.getContext('2d', { willReadFrequently: true });
    let zv = 0;
    return async () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w) return [];
      zv++;
      let sx = 0;
      let sy = 0;
      let sw = w;
      let sh = h;
      if (zv % 2) {
        const lado = Math.round(Math.min(w, h) * 0.85);
        sx = Math.round((w - lado) / 2);
        sy = Math.round((h - lado) / 2);
        sw = sh = lado;
      }
      const k = Math.min(1, 1280 / Math.max(sw, sh));
      zc.width = Math.round(sw * k);
      zc.height = Math.round(sh * k);
      zx.drawImage(video, sx, sy, sw, sh, 0, 0, zc.width, zc.height);
      const out = await Z.readBarcodes(zx.getImageData(0, 0, zc.width, zc.height), {
        formats: ['QRCode'],
        tryHarder: true,
        maxNumberOfSymbols: 1,
      });
      return out
        .filter((r) => r.isValid && r.text)
        .map((r) => {
          const P = r.position;
          return {
            v: r.text,
            pts: [P.topLeft, P.topRight, P.bottomRight, P.bottomLeft].map((p) => ({
              x: sx + p.x / k,
              y: sy + p.y / k,
            })),
          };
        });
    };
  } catch (_) {
    /* sem WebAssembly: jsQR */
  }
  const jsQR = await loadJsQR();
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d', { willReadFrequently: true });
  /* Webcam de notebook é borrada: em vez de reduzir o quadro inteiro, alterna entre o recorte do centro (onde fica a
       moldura) em resolução cheia e o quadro todo. A inversão de cores só é tentada de vez em quando (é mais lenta). */
  let vez = 0;
  return async () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w) return [];
    vez++;
    let sx = 0;
    let sy = 0;
    let sw = w;
    let sh = h;
    if (vez % 3) {
      const lado = Math.round(Math.min(w, h) * (vez % 3 === 1 ? 0.75 : 0.95));
      sx = Math.round((w - lado) / 2);
      sy = Math.round((h - lado) / 2);
      sw = sh = lado;
    }
    const k = Math.min(1, 900 / Math.max(sw, sh));
    cv.width = Math.round(sw * k);
    cv.height = Math.round(sh * k);
    cx.drawImage(video, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    const r = jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, {
      inversionAttempts: vez % 6 === 0 ? 'attemptBoth' : 'dontInvert',
    });
    if (!r) return [];
    const L = r.location;
    return [
      {
        v: r.data,
        pts: [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner].map((p) => ({
          x: sx + p.x / k,
          y: sy + p.y / k,
        })),
      },
    ];
  };
}
/* Conteúdo do QR → atividade (sem servidor). Aceita o link /q/<token> e o texto "etal:<atividade>". */
function qrActivity(text) {
  const m = /etal:([\w-]+)/i.exec(text);
  if (m) return m[1];
  const t = (/\/q\/([\w.-]+)/.exec(text) || [])[1] || (/^[\w-]+\.[\w-]+$/.test(text) ? text : null);
  if (!t) return undefined;
  try {
    const j = JSON.parse(atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
    return j.a || 'recepcao';
  } catch (_) {
    return undefined;
  }
}
function demoHit(text) {
  const q = qrActivity(text);
  if (q === undefined) return false;
  const x = byId(q);
  if (!SPOTS[q]) {
    if (!x) return false;
    SPOTS[q] = {
      name: x.room || 'Sala',
      sign: x.short,
      where: floorOf(x.floor ?? 0).label,
      icon: 'qr',
      seed: 30 + Object.keys(SPOTS).length * 7,
    };
  }
  scanResult(q);
  return true;
}
/* QR lido pela câmera do celular, sem servidor (página qrs.html): o link abre o app com ?qr=etal:<atividade>. O login
     vem primeiro; depois dele o leitor abre e a leitura acontece como se fosse na sala. */
function qrPendente() {
  let t = null;
  try {
    t = sessionStorage.getItem('etal-qr-demo');
  } catch (_) {
    /* sem armazenamento */
  }
  if (!t || !S.auth || API) return;
  try {
    sessionStorage.removeItem('etal-qr-demo');
  } catch (_) {
    /* opcional */
  }
  setTimeout(() => {
    openOverlay(Overlays.scan(), 'scan');
    setTimeout(() => {
      if (!demoHit(t)) toast('Esse QR não é de uma atividade do ETAL.');
    }, 650);
  }, 500);
}
let demoQrs = null;
async function demoQr(q) {
  try {
    if (!canDebugQr()) return;
    demoQrs = demoQrs || (await API.get('/api/org/debug/qrs'));
    const it = demoQrs.find((d) => (d.id || 'recepcao') === q);
    if (!it) {
      toast('QR Code não encontrado.');
      return;
    }
    await apiScan(it.url);
  } catch (error) {
    toast(error.message || 'Não foi possível abrir os QR Codes de debug.');
  }
}
/* Rastreio do QR na imagem da câmera: um contorno segue os quatro cantos (suavizado a cada quadro), os cantos
     "agarram" o código e a etiqueta diz o que foi visto. Ao validar, o QR acende, pulsa e mostra o ✓ antes de seguir. */
const trk = { tgt: null, cur: null, seen: 0, raf: 0, state: '' };
function trackSet(code, state) {
  const video = $('.scan-cam', ov);
  const root = $('.scanner', ov);
  if (!video || !root) return;
  if (code?.pts?.length === 4 && video.videoWidth) {
    const r = video.getBoundingClientRect();
    const s = Math.max(r.width / video.videoWidth, r.height / video.videoHeight);
    const ox = (r.width - video.videoWidth * s) / 2;
    const oy = (r.height - video.videoHeight * s) / 2;
    trk.tgt = code.pts.map((p) => ({ x: p.x * s + ox, y: p.y * s + oy }));
    trk.seen = performance.now();
    if (!trk.cur) {
      const c = trk.tgt.reduce((m, p) => ({ x: m.x + p.x / 4, y: m.y + p.y / 4 }), { x: 0, y: 0 });
      trk.cur = trk.tgt.map(() => ({ ...c }));
    }
  }
  if (state) trk.state = state;
  root.classList.toggle('tracking', !!trk.cur);
  if (!trk.raf) trk.raf = requestAnimationFrame(trackDraw);
}
function trackReset() {
  cancelAnimationFrame(trk.raf);
  Object.assign(trk, { tgt: null, cur: null, seen: 0, raf: 0, state: '' });
  const svg = $('.scan-track', ov);
  if (svg) {
    svg.classList.remove('on');
    delete svg.dataset.state;
  }
  $('.tk-tag', ov)?.classList.remove('on');
  $('.scanner', ov)?.classList.remove('tracking');
}
function trackDraw() {
  trk.raf = 0;
  const svg = $('.scan-track', ov);
  const tag = $('.tk-tag', ov);
  const root = $('.scanner', ov);
  if (!svg || !trk.cur) return;
  const lock = trk.state === 'lock';
  if (!lock && performance.now() - trk.seen > 450) {
    svg.classList.remove('on');
    tag.classList.remove('on');
    root?.classList.remove('tracking');
    trk.cur = null;
    return;
  }
  const a = lock ? 0.35 : 0.45;
  trk.cur.forEach((p, i) => {
    p.x += (trk.tgt[i].x - p.x) * a;
    p.y += (trk.tgt[i].y - p.y) * a;
  });
  const P = trk.cur;
  const pt = (p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  const r = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  $('.tk-poly', svg).setAttribute('points', P.map(pt).join(' '));
  const k = 0.24;
  const brk = P.map((p, i) => {
    const a1 = P[(i + 3) % 4];
    const b1 = P[(i + 1) % 4];
    const m = (q) => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
    return `M${pt(m(a1))}L${pt(p)}L${pt(m(b1))}`;
  }).join('');
  $('.tk-brk', svg).setAttribute('d', brk);
  const cx = P.reduce((t, p) => t + p.x, 0) / 4;
  const cy = P.reduce((t, p) => t + p.y, 0) / 4;
  $('.tk-ok', svg).setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
  svg.dataset.state = trk.state;
  svg.classList.add('on');
  const top = P.reduce((m, p) => (p.y < m.y ? p : m), P[0]);
  tag.textContent = { lock: 'QR reconhecido', ok: 'QR do ETAL', outro: 'Não é do ETAL' }[trk.state] || 'Lendo…';
  tag.dataset.state = trk.state;
  tag.style.transform = `translate(${cx.toFixed(0)}px, ${(top.y - 34).toFixed(0)}px) translateX(-50%)`;
  tag.classList.add('on');
  trk.raf = requestAnimationFrame(trackDraw);
}
async function camStart() {
  const st = $('#camst');
  const btn = $('[data-act="camstart"]');
  const video = $('.scan-cam');
  const say = (m) => {
    if (st) st.textContent = m;
  };
  if (!video) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    say('A câmera só abre com o app em HTTPS. Use a câmera do celular: ela abre o ETAL Connect e registra a presença.');
    return;
  }
  camStop();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    try {
      const tr = stream.getVideoTracks()[0];
      const c = tr.getCapabilities?.() || {};
      if (c.focusMode?.includes('continuous')) await tr.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch (_) {
      /* câmera sem ajuste de foco */
    }
    if (!$('.scan-cam')) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    cam = { stream, stop: false };
    video.srcObject = stream;
    await video.play();
    video.classList.add('on');
    $('.scanner', ov)?.classList.add('cam-live');
    if (btn) btn.hidden = true;
    say('Aponte para o QR. A leitura é automática.');
    const read = await makeReader(video);
    const me = cam;
    let warned = 0;
    let firm = 0;
    trackReset();
    const tick = async () => {
      if (me.stop) return;
      try {
        const codes = await read();
        const good = codes.find((c) => qrActivity(c.v) !== undefined);
        if (codes.length) trackSet(good || codes[0], good ? 'ok' : 'outro');
        /* dois quadros seguidos com o mesmo QR do ETAL: trava, acende e só então segue */
        if (good) {
          firm = performance.now() - (me.goodAt || 0) < 500 ? firm + 1 : 1;
          me.goodAt = performance.now();
        }
        if (good && firm >= 2) {
          const hit = good.v;
          trackSet(good, 'lock');
          buzz([18, 40, 18]);
          const root = $('.scanner', ov);
          if (root) {
            root.dataset.busy = '1';
            root.classList.add('is-locked');
          }
          say('QR reconhecido');
          setTimeout(
            () => {
              if (me.stop) return;
              if (API) {
                apiScan(hit);
                return;
              }
              freezeCam();
              root?.removeAttribute('data-busy');
              if (!demoHit(hit)) toast('Esse QR não é de uma atividade do ETAL.');
            },
            reduce ? 150 : 900,
          );
          return;
        }
        if (!good && codes.length && Date.now() - warned > 2500) {
          warned = Date.now();
          say('Esse QR não é do ETAL. Procure o QR da sala ou da recepção.');
        }
      } catch (_) {
        /* quadro ainda carregando */
      }
      setTimeout(tick, 60);
    };
    tick();
  } catch (x) {
    say(
      x && x.name === 'NotAllowedError' ? 'Permita o uso da câmera para ler o QR.' : 'Não foi possível abrir a câmera.',
    );
    if (btn) btn.hidden = false;
  }
}
async function apiStart() {
  const qs0 = new URLSearchParams(location.search);
  const qr = qs0.get('qr');
  const login = qs0.get('login');
  if (qr || login) history.replaceState(history.state, '', location.pathname);
  if (qr) sessionStorage.setItem('etal-qr', qr);
  try {
    const prog = await API.get('/api/programacao');
    const extra = Object.fromEntries(D.sessions.map((x) => [x.id, x]));
    D.sessions.length = 0;
    prog.sessions.forEach((x) => D.sessions.push({ ...(extra[x.id] || {}), ...x }));
    applyRoomNumbers(prog.rooms || {});
    if (window.ETAL_CONFIG?.demo) {
      try {
        const scenario = await API.get('/api/cenario-demo');
        D.event = scenario.event;
        if (Array.isArray(scenario.tournaments)) D.tournaments.splice(0, D.tournaments.length, ...scenario.tournaments);
        if (Array.isArray(scenario.posts)) SOCIAL.seeds.splice(0, SOCIAL.seeds.length, ...scenario.posts);
      } catch (_) {
        /* cenário embarcado disponível sem rede */
      }
    }
    const av = await API.get('/api/avisos');
    if (av.length) {
      D.notices.length = 0;
      av.forEach((n) => D.notices.push({ time: n.time, title: n.title, text: n.text, org: true }));
    }
  } catch (_) {
    toast('Sem conexão com o servidor: mostrando a programação salva.');
  }
  let me = null;
  try {
    me = await API.get('/api/eu');
  } catch (_) {
    /* não entrou */
  }
  API.live({
    aviso: (n) => {
      D.notices.unshift({ time: n.time, title: n.title, text: n.text, fresh: true, org: true });
      notify(n.title, n.text, n.activity);
      buzz([20, 40, 20]);
      if (S.auth && vp.querySelector('.page')) rerender();
    },
    sala: (m) => {
      const x = byId(m.activity);
      if (x) {
        Object.assign(x, { floor: m.floor, zone: m.zone, room: m.room });
        if (S.auth) rerender();
      }
    },
    numeros: (rooms) => {
      applyRoomNumbers(rooms);
      if (S.auth) rerender();
    },
    atividade: (a) => {
      const x = byId(a.id);
      if (x) {
        ['floor', 'zone', 'seats', 'prerequisites'].forEach((k) => {
          if (!(k in a)) delete x[k];
        });
        Object.assign(x, a);
      } else D.sessions.push({ learn: [], materials: [], ...a });
      if (S.auth && vp.querySelector('.page')) rerender();
    },
  });
  if (login && login !== 'ok')
    toast(
      {
        erro: 'Não foi possível entrar. Tente de novo.',
        'suap-indisponivel': 'O SUAP não respondeu. Tente de novo.',
        'suap-ocupado': 'Muita gente entrando agora. Toque em entrar de novo em instantes.',
        'link-expirado': 'Esse link expirou. Peça outro.',
      }[login] || 'Não foi possível entrar.',
    );
  if (!me) {
    show(build({ s: 'login' }), 'fade');
    return;
  }
  apiState(me);
  S.auth = true;
  show(build(top()), 'fade');
  const pend = sessionStorage.getItem('etal-qr');
  if (pend) {
    sessionStorage.removeItem('etal-qr');
    setTimeout(() => apiQr(pend), 600);
  } else if (DEMO || login === 'ok') cardIntro(900);
}
