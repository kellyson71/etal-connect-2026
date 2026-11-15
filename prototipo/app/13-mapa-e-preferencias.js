/* app/13-mapa-e-preferencias.js · telas de mapa, NADIC, ETAL, desempenho e personalização.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
Screens.map = () => {
  if (mapaNovoOn()) return telaMapaNovo();
  if (S.mapView !== 'bloco') return Screens.campus();
  const idx = S.mapFloor === null ? 0 : S.mapFloor + 1;
  return {
    html: `<div class="map-screen campus">
        <canvas class="campus3d" tabindex="0" role="application" aria-label="Bloco principal em volume, com os três andares. Toque num andar ou numa sala."></canvas>
        ${fpsHud()}
        ${mapBottom(blocoSheet(), `<div class="seg ${window.Campus3D.canUse3D() ? 'four' : ''}" style="--k:${window.Campus3D.canUse3D() ? idx : idx - 1}"><i class="seg-ind"></i>${window.Campus3D.canUse3D() ? `<button class="${idx === 0 ? 'on' : ''}" data-act="floorsel" data-v="all">Todos</button>` : ''}${[0, 1, 2].map((l) => `<button class="${S.mapFloor === l ? 'on' : ''}" data-act="floorsel" data-v="${l}">${l === 0 ? 'Térreo' : `${l}º`}</button>`).join('')}</div>`)}
      </div>`,
    mount: mountCampus,
  };
};

Screens.nadic = () => {
  const n = D.nadic;
  return {
    html: `${header('NADIC')}<div class="pad stack about">
        <section class="ab-hero st" ${st(0)}>
          <svg class="ab-pins" viewBox="0 0 200 120" aria-hidden="true"><path d="M150 120V70M170 120V50M190 120V70M0 34H96l14 14h40"/><circle cx="150" cy="64" r="5"/><circle cx="170" cy="44" r="5"/><circle cx="190" cy="64" r="5"/><circle cx="156" cy="48" r="5"/></svg>
          <img src="assets/nadic-logo.svg" alt="NADIC" width="170" height="74">
          <h1>${n.full}</h1>
          <p>${n.motto}</p>
        </section>
        <p class="desc st" ${st(1)}>${n.about}</p>
        <ul class="ab-tags st" ${st(2)}>${n.fields.map((f) => `<li>${f}</li>`).join('')}</ul>
        <dl class="nadic-stats st" ${st(3)}>${n.stats.map(([v, t]) => `<div><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>
        <h2 class="h st" ${st(4)}>Projetos</h2>
        <ul class="ab-list st" ${st(5)}>${n.projects.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join('')}</ul>
        <h2 class="h st" ${st(6)}>Contato</h2>
        <ul class="ab-list st" ${st(7)}>
          <li data-act="openmap" data-floor="1" data-zone="sala-nadic" class="tap"><b>Sala dos bolsistas</b><small>Bloco principal, 1º andar · ver no mapa</small>${ic('chev')}</li>
          <li><b>Coordenação</b><small>${n.lead}</small></li>
          <li><b>E-mail</b><small class="sel">${n.email}</small></li>
          <li><b>Endereço</b><small>${n.address}</small></li>
        </ul>
        <a class="btn primary big st" ${st(8)} href="${n.url}" target="_blank" rel="noopener">Abrir o site do NADIC ${ic('open')}</a>
        <p class="nadic-src st" ${st(9)}>${n.source}</p>
      </div>`,
  };
};

Screens.etal = () => {
  const e = D.etal;
  return {
    html: `${header('O que é o ETAL')}<div class="pad stack about">
        <div class="ab-logo st" ${st(0)}><img src="assets/etal-logo.png" alt="ETAL"></div>
        <h1 class="title-lg st" ${st(1)}>${e.full}</h1>
        <p class="desc st" ${st(2)}>${e.about}</p>
        <ul class="ab-tags st" ${st(3)}>${e.areas.map((f) => `<li>${f}</li>`).join('')}</ul>
        <ul class="ab-list st" ${st(4)}><li><b>Como acontece</b><small>${e.formats}</small></li><li><b>Onde</b><small>${e.place}</small></li></ul>
        <h2 class="h st" ${st(5)}>Edições</h2>
        <ol class="ab-time st" ${st(6)}>${e.editions.map(([y, n, d]) => `<li><time>${y}</time><span><b>${n}</b><small>${d}</small></span></li>`).join('')}</ol>
        <div class="ab-btns st" ${st(7)}><a class="btn primary" href="${e.site}" target="_blank" rel="noopener">Site do evento ${ic('open')}</a><a class="btn soft" href="${e.portal}" target="_blank" rel="noopener">Página no IFRN ${ic('open')}</a></div>
        <p class="nadic-src st" ${st(8)}>${e.source}</p>
      </div>`,
  };
};

const TIER_LABEL = { alta: '3D completo', media: '3D médio', leve: '3D leve', simples: '2D simples' };
/* Medidor de quadros, em cima do mapa: toque para trocar de versão. */
let hudTimer = 0;
const fpsHud = () =>
  UI.fps
    ? '<button class="fps-hud" data-act="hudcycle" aria-label="Trocar a versão do mapa"><b>--</b><small></small></button>'
    : '';
function startHud(page) {
  clearInterval(hudTimer);
  const el = $('.fps-hud', page);
  if (!el) return;
  const paint = () => {
    if (!el.isConnected) {
      clearInterval(hudTimer);
      return;
    }
    const t = window.Campus3D.stats();
    el.querySelector('b').textContent = t.fps ? `${t.fps} fps` : '-- fps';
    el.classList.toggle('bad', t.fps > 0 && t.fps < 24);
    el.querySelector('small').textContent = `${TIER_LABEL[t.tier]} · ${t.cost} ms`;
  };
  paint();
  hudTimer = setInterval(paint, 500);
}
Screens.perf = () => {
  const r = S.perfResults || [];
  const best = bestOf(r);
  const q = window.Campus3D.quality();
  return {
    mount: mountPerf,
    html: `${header('Testar desempenho')}<div class="perf">
        <div class="perf-stage"><canvas class="campus3d" tabindex="-1" aria-label="Mapa durante o teste"></canvas>${fpsHudForce()}</div>
        <div class="pad stack">
          <p class="desc">O teste roda as quatro versões do mapa neste aparelho e mostra os quadros por segundo. Leva cerca de 40 segundos.</p>
          <button class="btn primary big" data-act="perfrun" ${S.perfBusy ? 'disabled' : ''}>${S.perfBusy ? `Testando: ${TIER_LABEL[S.perfBusy]}…` : r.length ? 'Testar de novo' : 'Iniciar teste'}</button>
          ${
            r.length
              ? `<ul class="perf-table">${r.map((x) => `<li class="${best === x ? 'best' : ''}"><button data-act="perfuse" data-v="${x.tier}"><b>${TIER_LABEL[x.tier]}${best === x ? '<em>Recomendado</em>' : ''}</b><span><i>Girar</i>${x.giro.fps} fps</span><span><i>Como chegar</i>${x.rota.fps} fps</span>${q.tier === x.tier ? ic('check', 'i') : ''}</button></li>`).join('')}</ul>
          <label class="sr" for="perfout">Resultado</label><textarea id="perfout" class="perf-out" rows="6" readonly>${perfText(r)}</textarea>`
              : ''
          }
          <p class="nadic-src">Em uso: ${TIER_LABEL[q.tier]}. Toque numa versão para usá-la.</p>
        </div>
      </div>`,
  };
};
const fpsHudForce = () => '<div class="fps-hud" aria-hidden="true"><b>--</b><small></small></div>';
/* A melhor versão que ficou fluida: 50 fps girando, sem tranco maior que 50 ms, e o "como chegar" liso.
     Em aparelho fraco, aceita a primeira que ainda anda; senão, o 2D. */
const bestOf = (r) =>
  r.find((x) => x.giro.fps >= 50 && x.giro.p95 <= 50 && x.rota.p95 <= 34) ||
  r.find((x) => x.tier !== 'simples' && x.rota.fps >= 30 && x.giro.fps >= 20) ||
  r.find((x) => x.tier === 'simples');
const perfText = (r) =>
  `${navigator.userAgent}\nnúcleos ${navigator.hardwareConcurrency || '?'} · memória ${navigator.deviceMemory || '?'} GB · tela ${screen.width}×${screen.height} @${window.devicePixelRatio}\n${r.map((x) => `${x.tier}: girar ${x.giro.fps} fps (pior ${x.giro.p95} ms), como chegar ${x.rota.fps} fps (pior ${x.rota.p95} ms)`).join('\n')}\nautomático: ${window.Campus3D.quality().tier} · ${window.Campus3D.quality().why} · teste rápido ${window.Campus3D.quality().info?.ms ?? '?'} ms`;
function mountPerf(page) {
  const cv = useMapCanvas(page);
  if (!cv) return;
  window.Campus3D.attach(cv, { top: 0, bottom: 0, onPick: () => {}, onQuality: () => {} });
  startHud(page);
}
async function perfRun() {
  if (S.perfBusy) return;
  const C = window.Campus3D;
  const out = [];
  for (const t of C.tiers()) {
    S.perfBusy = t;
    S.perfResults = out.slice();
    rerender();
    out.push(await C.benchTier(t));
  }
  const best = bestOf(out);
  C.useTested(best.tier);
  S.perfBusy = null;
  S.perfResults = out;
  rerender();
  toast(`Teste concluído: o automático agora usa ${TIER_LABEL[best.tier]}`);
}

Screens.personalizar = () => {
  const C = window.Campus3D;
  const q = C.quality();
  const LABEL = TIER_LABEL;
  return {
    html: `${header('Personalizar')}<div class="pad stack custom">
        <section class="cu-preview st" ${st(0)} aria-hidden="true">
          <div class="cu-badge"><span class="av">${esc(D.person.initials)}</span><span><b>${esc(D.person.first)}</b><small>${esc(D.person.course)}</small></span></div>
          <div class="cu-row"><span class="btn primary">Como chegar</span><span class="btn soft">Presença</span></div>
        </section>
        <h2 class="h">Tema</h2>
        <div class="cu-themes">${Object.entries(THEMES)
          .map(([k, t]) => {
            const dk = isDark();
            const n = t.hue;
            const bg = n === null ? (dk ? '#0e1932' : '#f4f6fa') : dk ? hsl(n, 0.34, 0.1) : hsl(n, 0.3, 0.955);
            return `<button class="${UI.theme === k && !UI.accent ? 'on' : ''}" data-act="theme" data-v="${k}" aria-pressed="${UI.theme === k}"><i style="background:${bg}"><u style="background:${t.accent}"></u></i><b>${t.name}</b><small>${t.desc}</small></button>`;
          })
          .join('')}</div>
        <h2 class="h">Cor de destaque</h2>
        <div class="cu-accents">${ACCENTS.map((a) => `<button class="${UI.accent === a ? 'on' : ''}" style="background:${a}" data-act="accent" data-v="${a}" aria-label="Usar a cor ${a}">${UI.accent === a ? ic('check') : ''}</button>`).join('')}<label class="cu-custom" aria-label="Escolher outra cor"><input type="color" id="accentpick" value="${UI.accent || (THEMES[UI.theme] || THEMES.etal).accent}">${ic('plus')}</label></div>
        <ul class="cu-opts">
          <li><span>Aparência</span>${uiSeg('mode', [
            ['claro', 'Claro'],
            ['escuro', 'Escuro'],
            ['auto', 'Automático'],
          ])}</li>
          <li><span>Crachá</span>${uiSeg('badge', [
            ['solido', 'Sólido'],
            ['degrade', 'Degradê'],
            ['colmeia', 'Colmeia'],
          ])}</li>
          <li><span>Cantos</span>${uiSeg('corners', [
            ['retos', 'Retos'],
            ['suaves', 'Suaves'],
            ['redondos', 'Redondos'],
          ])}</li>
          <li><span>Fonte</span>${uiSeg('font', [
            ['padrao', 'Padrão'],
            ['arredondada', 'Arredondada'],
            ['leitura', 'Leitura fácil'],
          ])}</li>
          <li><span>Texto</span>${uiSeg('text', [
            ['normal', 'Normal'],
            ['grande', 'Grande'],
            ['maior', 'Maior'],
          ])}</li>
          <li><span>Animações</span>${uiSeg('motion', [
            ['completas', 'Completas'],
            ['reduzidas', 'Reduzidas'],
          ])}</li>
        </ul>
        <h2 class="h">No início</h2>
        <ul class="cu-toggles">
          <li><button data-act="uisky" aria-pressed="${UI.sky}" class="${UI.sky ? 'on' : ''}"><span>Céu do Alto Oeste</span><i class="switch"></i></button></li>
          ${HOME_PARTS.map(([k, t]) => `<li><button data-act="uihome" data-k="${k}" aria-pressed="${UI.home[k]}" class="${UI.home[k] ? 'on' : ''}"><span>${t}</span><i class="switch"></i></button></li>`).join('')}
        </ul>
        <h2 class="h">Mapa</h2>
        <ul class="cu-opts">
          <li><span>Mapa</span>${uiSeg('mapa', [
            ['novo', 'Novo (3D)'],
            ['classico', 'Clássico'],
          ])}</li>
          ${
            C.canUse3D()
              ? `<li><span>Vista inicial</span>${uiSeg('view', [
                  ['3d', '3D'],
                  ['2d', '2D'],
                ])}</li>`
              : ''
          }
          <li><span>Qualidade</span><div class="mini-seg wide" role="radiogroup">${[
            ['auto', 'Auto'],
            ['alta', 'Completo'],
            ['media', 'Médio'],
            ['leve', 'Leve'],
            ['simples', '2D'],
          ]
            .map(
              ([v, t]) =>
                `<button class="${q.setting === v ? 'on' : ''}" role="radio" aria-checked="${q.setting === v}" data-act="quality" data-v="${v}">${t}</button>`,
            )
            .join(
              '',
            )}</div><small class="cu-note">Em uso: ${LABEL[q.tier]}${q.setting === 'auto' ? ` · ${q.why}` : ''}. </small></li>
          <li class="cu-row2"><button data-act="uimaphour" aria-pressed="${UI.mapHour}" class="${UI.mapHour ? 'on' : ''}"><span>Luz do mapa segue o horário</span><i class="switch"></i></button></li>
          <li class="cu-row2"><button data-act="uifps" aria-pressed="${!!UI.fps}" class="${UI.fps ? 'on' : ''}"><span>Mostrar FPS no mapa</span><i class="switch"></i></button></li>
          <li class="cu-row2"><button data-go="perf"><span>Testar desempenho neste aparelho</span>${ic('chev', 'i card-chev')}</button></li>
        </ul>
        <button class="btn ghost" data-act="uireset">Restaurar o padrão</button>
      </div>`,
  };
};
