/* app/11-ceu.js · céu do Alto Oeste pelo horário e silhueta do campus.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- céu do Alto Oeste: muda com o horário, sem imagem nenhuma ---- */
const SKY_KEYS = [
  [5, '#111a3d', '#343b6c', '#a8685e'],
  [6.25, '#3d5c9f', '#e6a174', '#fbd7a6'],
  [8.5, '#3f86d8', '#8bc1ee', '#d8eefa'],
  [14, '#2c7bd3', '#68afed', '#cfe9f8'],
  [16.75, '#4a74bd', '#efae6d', '#fbdb9b'],
  [18, '#34396f', '#c9644e', '#f4a15b'],
  [19, '#141d40', '#2b2f63', '#6d4a6e'],
  [22, '#0b1230', '#141d45', '#232c5c'],
];
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c) => `rgb(${c.join(',')})`;
/* Relógio do app: segue a hora do aparelho, minuto a minuto (céu, luz do mapa, "agora" da agenda e lembretes). Com
     servidor, os dias vêm da programação (ETAL_API.calendario); sem ele, continuam os do exemplo de 2025. ?ceu=<hora>, mexer no horário do céu
     ou no botão do sol fixa uma hora para demonstrar, até recarregar. */
const horaAparelho = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
let skyHour = horaAparelho(),
  horaManual = false;
setInterval(() => {
  if (!horaManual && Math.abs(horaAparelho() - skyHour) > 0.5 / 60) {
    skyHour = horaAparelho();
    applySky();
    if (mapaPronto) mapaFixoEnviar('etal:mapa:sincronizar', {});
  }
}, 30000);
const skyClock = () => {
  const m = Math.round(skyHour * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/* O mapa 3D acompanha o horário do céu (noite, pôr do sol), a menos que a pessoa desligue em Personalizar. */
const syncMapHour = () => window.Campus3D?.setHour?.(UI.mapHour ? skyHour : null);
function applySky() {
  const h = skyHour;
  syncMapHour();
  let a = SKY_KEYS[0],
    b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++)
    if (h >= SKY_KEYS[i][0] && h <= SKY_KEYS[i + 1][0]) {
      a = SKY_KEYS[i];
      b = SKY_KEYS[i + 1];
      break;
    }
  const t = b === a ? 0 : Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
  const [c1, c2, c3] = [1, 2, 3].map((i) => mixC(hex2(a[i]), hex2(b[i]), t));
  const night = Math.max(0, Math.min(1, h < 6 ? (6 - h) / 0.8 : (h - 18.2) / 0.8));
  const navy = hex2('#1b2d5c');
  const st_ = device.style;
  st_.setProperty('--sky-1', css(c1));
  st_.setProperty('--sky-2', css(c2));
  st_.setProperty('--sky-3', css(c3));
  st_.setProperty('--sil-near', css(mixC(navy, c1, 0.1 * (1 - night))));
  st_.setProperty('--sil-mid', css(mixC(navy, c2, 0.3 * (1 - night * 0.7))));
  st_.setProperty('--sil-far', css(mixC(navy, c3, 0.5 * (1 - night * 0.7))));
  st_.setProperty('--night', night.toFixed(3));
  const p = (h - 5.6) / (18.6 - 5.6);
  st_.setProperty('--sun-o', p > 0 && p < 1 ? '1' : '0');
  st_.setProperty('--sun-x', `${8 + Math.max(0, Math.min(1, p)) * 84}%`);
  st_.setProperty('--sun-y', `${74 - Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) * 62}%`);
  st_.setProperty('--sun-c', p < 0.12 || p > 0.86 ? '#ffb765' : '#ffe9a8');
  const m = (h - 18.6) / 5;
  st_.setProperty('--moon-x', `${14 + Math.max(0, Math.min(1, m)) * 56}%`);
  st_.setProperty('--moon-y', `${56 - Math.sin(Math.max(0, Math.min(1, m)) * 2.2) * 40}%`);
  const clock = skyClock();
  D.now.time = D.now.fixo || clock; // o "agora" da agenda segue o mesmo relógio (fixo antes e depois do evento)
  const ck = $('#clock');
  if (ck) ck.textContent = clock;
  const nc = $('#nowclock');
  if (nc) nc.textContent = clock;
  const r = $('#skyr');
  if (r && document.activeElement !== r) r.value = h;
  const o = $('#skyo');
  if (o) o.textContent = clock;
  if (typeof checkReminders === 'function') checkReminders();
}
let skyAnim = 0;
function skyTo(target) {
  cancelAnimationFrame(skyAnim);
  horaManual = true;
  if (reduce) {
    skyHour = target;
    applySky();
    return;
  }
  const from = skyHour;
  const t0 = performance.now();
  const step = (n) => {
    const k = Math.min(1, (n - t0) / 1400);
    skyHour = from + (target - from) * (1 - (1 - k) ** 3);
    applySky();
    if (k < 1) skyAnim = requestAnimationFrame(step);
  };
  skyAnim = requestAnimationFrame(step);
}
/* Vista da rua, desenhada em camadas para ter profundidade: serras do Alto Oeste ao fundo, névoa, a linha de árvores,
     o campus (ginásio, auditório de fachada curva, bloco principal com as três fileiras de janelas, entrada, laboratórios,
     cobertura do pátio, obelisco), o muro e as carnaúbas na frente. As cores vêm do céu da hora. */
function skyline() {
  const R = (() => {
    let v = 7;
    return () => {
      v = (v * 16807) % 2147483647;
      return v / 2147483647;
    };
  })();
  /* copas em sequência, como mata vista de longe */
  const mata = (y, x0, x1, passo, amp) => {
    let d = `M${x0} 150V${y}`;
    for (let x = x0; x < x1; x += passo) {
      const h = amp * (0.45 + R() * 0.75),
        w = passo * (0.8 + R() * 0.5);
      d += `q${(w / 2).toFixed(1)} ${(-h).toFixed(1)} ${w.toFixed(1)} 0`;
      x += w - passo;
    }
    return d + `V150Z`;
  };
  const carnauba = (x, h, inc = 0) => {
    const top = [x + inc, 134 - h];
    let o = `<path class="sl-trunk" d="M${x} 136Q${x + inc * 0.2} ${134 - h * 0.5} ${top[0]} ${top[1]}"/>`;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.08 + i * 0.105),
        L = 8.5 + (i % 2) * 2.2,
        ex = Math.cos(a) * L,
        ey = Math.sin(a) * L * 0.9;
      o += `<path class="sl-frond" d="M${top[0]} ${top[1]}q${(ex * 0.55).toFixed(1)} ${(ey * 0.9 - 2.2).toFixed(1)} ${ex.toFixed(1)} ${(ey + 3.4).toFixed(1)}"/>`;
    }
    return o;
  };
  const copa = (x, y, k = 1) =>
    `<path class="sl-near" d="M${x - 1} ${y + 12 * k}h2V${y}h-2Z"/><path class="sl-near" d="M${x - 9 * k} ${y}c${-4.5 * k} ${-1 * k} ${-5.5 * k} ${-7 * k} ${-1.5 * k} ${-9 * k} ${0.2 * k} ${-6 * k} ${7 * k} ${-8.5 * k} ${10.5 * k} ${-4.5 * k} ${4 * k} ${-3.2 * k} ${10 * k} ${0.3 * k} ${9 * k} ${5 * k} ${4.2 * k} ${1.2 * k} ${4.2 * k} ${7.3 * k} ${0} ${8.5 * k}Z"/>`;
  let jan = '';
  [97, 108, 119].forEach((y) => {
    for (let x = 158; x < 293; x += 11) jan += `<rect x="${x}" y="${y}" width="7" height="4.600" rx=".9"/>`;
  });
  for (let x = 109; x < 144; x += 9) jan += `<rect x="${x}" y="106" width="2.600" height="15" rx="1"/>`;
  for (let x = 326; x < 374; x += 10) jan += `<rect x="${x}" y="112" width="6" height="4" rx=".8"/>`;
  const predios = `<path d="M14 132v-15q30-17 60 0v15Z"/><rect x="318" y="104" width="62" height="28"/><path d="M150 132V96h-32c-10 0-18 7-18 16v20Z"/><rect x="150" y="86" width="150" height="46"/><rect x="300" y="103" width="19" height="29"/>`;
  return `<svg class="hm-skyline" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sk-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
      <linearGradient id="sk-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".17"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>
      <path class="sl-hill" d="M0 150V78c18-8 34-11 52-6 14 4 24 10 40 9 20-2 30-17 52-19 18-2 30 9 46 13 20 5 34-5 54-10 22-6 40-2 58 6 16 7 28 6 44 1s30-6 44-2V150Z"/>
      <path class="sl-far" d="M0 150V98c22-8 44-6 62 0 20 6 38 4 58-3 24-9 44-8 66-1 22 7 40 8 62 2 24-7 46-9 70-2 26 7 48 5 72-2V150Z"/>
      <rect class="sl-haze" x="0" y="80" width="390" height="46" fill="url(#sk-haze)"/>
      <path class="sl-mata" d="${mata(116, 0, 392, 9, 9)}"/>
      <g class="sl-b">${predios}</g><g class="sl-luz" fill="url(#sk-shade)">${predios}</g>
      <rect class="sl-plat" x="150" y="86" width="150" height="5.200"/><path class="sl-plat" d="M150 96h-32c-10 0-18 7-18 16v5.500c0-9 8-16.500 18-16.500h32Z"/><rect class="sl-plat" x="318" y="104" width="62" height="3.600"/><rect class="sl-plat" x="300" y="103" width="19" height="29" opacity=".35"/>
      <path class="sl-rim" d="M100 112c0-9 8-16 18-16h32M150 86h150M300 103h19M318 104h62M22 113.500q22-11 44 0"/>
      <g class="sl-win">${jan}<rect x="306" y="119" width="7" height="13" rx="1"/></g>
      <path class="sl-near" d="M174 120l54-7 54 7v2.200H174Z"/>${[180, 228, 276].map((x) => `<rect class="sl-near" x="${x}" y="121" width="1.500" height="12"/>`).join('')}
      <rect class="sl-near" x="236.300" y="100" width="3" height="33"/><rect class="sl-mark" x="236.800" y="103" width="2" height="4.500" rx=".6"/>
      ${copa(206, 122, 0.8)}${copa(262, 124, 0.7)}
      <path class="sl-near" d="M0 150v-16.500h390V150Z"/><path class="sl-cap" d="M0 133.500h390"/>
      ${copa(28, 126, 1.15)}${copa(324, 127, 1)}${carnauba(64, 42, 2)}${carnauba(88, 31, -3)}${carnauba(352, 38, -2)}${carnauba(372, 27, 3)}
      <path class="sl-near" d="${mata(143, 0, 392, 13, 5)}"/>
    </svg>`;
}
const skyArt = () =>
  `<div class="hm-bg"><i class="hm-stars"></i><i class="hm-glow"></i><i class="hm-cloud c1"></i><i class="hm-cloud c2"></i><i class="hm-cloud c3"></i><button class="hm-sun" data-act="skycycle" aria-label="Mudar a hora do céu"></button><i class="hm-moon"></i><svg class="hm-birds" viewBox="0 0 60 24" aria-hidden="true"><path d="M2 12q5-6 9 0 4-6 9 0"/><path d="M26 5q4-5 7 0 3-5 7 0"/><path d="M40 17q3-4 6 0 3-4 6 0"/></svg>${skyline()}</div>`;
