/* app/10-colmeia.js · conquistas (colmeia).
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---- colmeia ---- */
function combEarned() {
  const got = new Set();
  if (S.credAt) got.add('cred');
  Object.keys(S.present).forEach((k) => got.add(k));
  if (Object.values(S.asked).some((a) => a.length)) got.add('ask');
  if (Object.keys(S.ratings).length) got.add('rate');
  if (S.contacts.length) got.add('contact');
  return D.combs.filter((c) => got.has(c.id)).map((c) => c.id);
}
/* Favo de 7 células: a chegada no centro e as outras em volta. */
const COMB_POS = [
  [0, 0],
  [14, -24.2],
  [28, 0],
  [14, 24.2],
  [-14, 24.2],
  [-28, 0],
  [-14, -24.2],
];
/* Desenho de cada conquista (traço em 24 × 24), feito para caber no favo. */
const COMB_ICONS = {
  cred: '<path d="M8 3l4 5 4-5"/><rect x="5.5" y="8" width="13" height="12.5" rx="2.5"/><circle cx="12" cy="13" r="2"/><path d="M8.8 18c.7-1.400 1.800-2 3.200-2s2.500.6 3.200 2"/>',
  'react-native':
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><ellipse cx="12" cy="11.5" rx="3.8" ry="1.5" transform="rotate(-30 12 11.5)"/><ellipse cx="12" cy="11.5" rx="3.8" ry="1.5" transform="rotate(30 12 11.5)"/><path d="M11 18.5h2"/>',
  'react-next': '<path d="M8.5 7.500 4 12l4.500 4.500M15.500 7.500 20 12l-4.500 4.500M13.500 5l-3 14"/>',
  'saude-mental':
    '<path d="M12 20s-7.500-4.400-7.500-10A4.300 4.300 0 0 1 12 7.300 4.300 4.300 0 0 1 19.500 10c0 5.600-7.500 10-7.500 10Z"/><path d="M7.500 12.500h2.300l1.200-2.300 2 4.300 1.200-2h2.300"/>',
  ask: '<path d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v8a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 3.500V17A2.500 2.500 0 0 1 4 14.500Z"/><path d="M10 8.800a2.100 2.100 0 1 1 3.100 1.900c-.7.4-1.100.8-1.100 1.600"/><path d="M12 14.300v.1"/>',
  rate: '<path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1.100 5.800L12 16.800l-5.300 2.800 1.100-5.800-4.300-4.100 5.900-.8Z"/>',
  contact:
    '<circle cx="8" cy="8.5" r="2.8"/><circle cx="16" cy="8.5" r="2.8"/><path d="M3 19c.5-3 2.400-4.800 5-4.800 1.600 0 3 .7 4 2 1-1.300 2.400-2 4-2 2.600 0 4.500 1.800 5 4.800"/>',
};
const combGlyph = (c) => COMB_ICONS[c.id] || ICONS[c.icon] || '';
const HEX = 'M0-15.300 13.250-7.650V7.650L0 15.300-13.250 7.650V-7.650Z';
/* Degradês do mel e da cera, uma vez só no documento (os favos de qualquer tela apontam para eles). */
function combDefs() {
  if (document.getElementById('cb-defs')) return;
  const d = document.createElement('div');
  d.id = 'cb-defs';
  d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg width="0" height="0"><defs>
      <linearGradient id="cb-honey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd761"/><stop offset=".55" stop-color="#f4ab1c"/><stop offset="1" stop-color="#d98507"/></linearGradient>
      <radialGradient id="cb-honey-in" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffe58c"/><stop offset=".6" stop-color="#f7b524"/><stop offset="1" stop-color="#e7960d"/></radialGradient>
      <linearGradient id="cb-wax" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b83a" stop-opacity=".16"/><stop offset="1" stop-color="#f0b83a" stop-opacity=".05"/></linearGradient>
      <clipPath id="cb-clip"><path d="${HEX}"/></clipPath>
    </defs></svg>`;
  document.body.appendChild(d);
}
function comb(cls = '', all = false) {
  combDefs();
  const got = all ? D.combs.map((c) => c.id) : combEarned();
  return `<svg class="hm-comb ${cls}" viewBox="-44 -42 88 84" aria-hidden="true">${D.combs
    .map((c, i) => {
      const on = got.includes(c.id);
      const [x, y] = COMB_POS[i];
      /* célula: borda de cera, fundo (mel cheio ou cera vazia), brilho no alto e o desenho da conquista */
      return `<g class="cell ${on ? 'on' : ''} ${S.newComb === c.id ? 'pop' : ''}" style="--n:${i}" transform="translate(${x} ${y})"><g class="cell-in"><path class="hx-rim" d="${HEX}"/><path class="hx-in" d="${HEX}" transform="scale(.8)"/>${on ? `<path class="hx-gloss" d="M-8.6-6.400 0-11.400 8.600-6.400C5-7.600-5-7.600-8.600-6.400Z"/><g clip-path="url(#cb-clip)"><rect class="hx-shine" x="-30" y="-18" width="9" height="36" transform="skewX(-20)"/></g>` : ''}<g class="glyph" transform="scale(.56) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round">${combGlyph(c)}</g></g></g>`;
    })
    .join('')}</svg>`;
}
/* Um favo só, para as linhas da lista. */
const combHex = (c, on) =>
  `<svg class="hm-hex ${on ? 'on' : ''}" viewBox="-16 -17 32 34" aria-hidden="true"><path class="hx-rim" d="${HEX}"/><path class="hx-in" d="${HEX}" transform="scale(.8)"/>${on ? '<path class="hx-gloss" d="M-8.600-6.400 0-11.400 8.600-6.400C5-7.600-5-7.600-8.600-6.400Z"/>' : ''}<g class="glyph" transform="scale(.56) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round">${combGlyph(c)}</g></svg>`;
function combCard() {
  const got = combEarned();
  const next = D.combs.find((c) => !got.includes(c.id));
  return `<button class="hm-combcard rv" data-go="colmeia">${comb()}<span class="hm-combtx"><b>Sua colmeia</b><strong>${got.length} de ${D.combs.length} favos</strong><span class="hm-combbar" aria-hidden="true">${D.combs.map((c) => `<i class="${got.includes(c.id) ? 'on' : ''}"></i>`).join('')}</span><small>${next ? `Próximo: ${next.how.charAt(0).toLowerCase()}${next.how.slice(1)}` : 'Colmeia completa!'}</small></span>${ic('chev')}</button>`;
}
Screens.colmeia = () => {
  const got = combEarned();
  const done = got.length === D.combs.length;
  return {
    html: `${header('Sua colmeia')}<div class="pad stack hm-colmeia">
        <div class="hm-bigcomb st" ${st(0)}><i class="hm-halo"></i>${comb('big')}</div>
        <p class="hm-count st" ${st(1)}><b>${got.length}</b> de ${D.combs.length} favos${done ? '. Colmeia completa!' : ''}</p>
        <ul class="hm-combs st" ${st(2)}>${D.combs
          .map((c, i) => {
            const on = got.includes(c.id);
            return `<li class="${on ? 'on' : ''}" style="--n:${i}">${combHex(c, on)}<span><b>${c.title}</b><small>${on ? 'Conquistado' : c.how}</small></span>${on ? ic('check', 'i hm-ok') : ''}</li>`;
          })
          .join('')}</ul>
        ${got.length ? `<button class="btn soft big st" ${st(3)} data-act="toast" data-msg="Imagem da colmeia pronta para compartilhar">${ic('share')}Compartilhar minha colmeia</button>` : ''}
      </div>`,
  };
};
let combSeen = null;
/* Favo recém-ganho. Quem mostrar primeiro (tela de resultado ou aviso) consome, para não repetir. */
function takeNewComb() {
  const got = combEarned();
  if (combSeen === null) {
    combSeen = got;
    return null;
  }
  const fresh = got.find((g) => !combSeen.includes(g));
  combSeen = got;
  if (!fresh) return null;
  S.newComb = fresh;
  setTimeout(() => {
    if (S.newComb === fresh) S.newComb = null;
  }, 6000);
  return D.combs.find((x) => x.id === fresh);
}
function checkCombs() {
  const c = takeNewComb();
  if (c) setTimeout(() => combToast(c), 900);
}
/* Linha "novo favo" dentro das telas de resultado. */
function combRow(c) {
  const n = combEarned().length;
  return `<div class="res-comb">${comb('rc')}<span><small>Novo favo na colmeia</small><b>${esc(c.title)}</b></span><em><b>${n}</b>/${D.combs.length}</em></div>`;
}
/* Aviso de favo novo: cai do topo com a colmeia e o favo acendendo. Tocar abre a colmeia. */
let combT;
function combToast(c) {
  let n = $('#combtoast');
  if (!n) {
    n = document.createElement('button');
    n.type = 'button';
    n.id = 'combtoast';
    n.className = 'combtoast';
    n.dataset.go = 'colmeia';
    n.addEventListener('click', () => n.classList.remove('show'));
    $('.screen').appendChild(n);
  }
  const got = combEarned();
  n.innerHTML = `<span class="ct-comb">${comb('ct')}</span>
      <span class="ct-tx"><small>${ic('star')}Novo favo na sua colmeia</small><b>${esc(c.title)}</b>
      <span class="ct-bar">${D.combs.map((x) => `<i class="${got.includes(x.id) ? 'on' : ''}${x.id === c.id ? ' new' : ''}"></i>`).join('')}</span></span>
      <span class="ct-n"><b>${got.length}</b>de ${D.combs.length}</span><i class="ct-shine"></i>`;
  n.classList.remove('show');
  void n.offsetWidth;
  n.classList.add('show');
  buzz([12, 30, 12]);
  clearTimeout(combT);
  combT = setTimeout(() => n.classList.remove('show'), 4800);
}
