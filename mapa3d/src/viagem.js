/* A viagem até o destino, como um GPS e como no mapa antigo do app (15/11/2026):
   - o bloco continua inteiro, na altura real (sem abrir os andares em escadinha);
   - a pessoa (o marcador azul) anda em ritmo constante e só desacelera e para um instante nos pontos-chave: a entrada,
     o começo e o fim da escada ou da rampa, e a chegada;
   - dentro do bloco só o andar em que ela está fica em destaque: os de cima somem e os de baixo ficam bem fracos.
     Na escada ou na rampa ela sobe na vertical e o andar de cima aparece quando ela chega nele;
   - a câmera acompanha a pessoa de perto e, no fim, enquadra a sala (girando até a porta, se ela estiver de costas).
   Para um lugar de fora (bebedouro do Anexo ou da Cantina) a linha fica no campus.
   A câmera é sempre interpolada por pose (alvo, distância, elevação, azimute): ela gira em arco, sem tranco. */
import * as THREE from 'three';
import { rota } from './rotas.js';
import { FH } from './dados.js';
import { mapear, ROOM_H } from './interior.js';
import { AZ0, aplicar, daCamera, mistura, suave, enquadrar, centrarLivre } from './camera.js';

const COR = 0x3f8f1a;
const clamp = (t) => Math.min(1, Math.max(0, t));
const V3 = (p) => new THREE.Vector3(...p);
/* ritmo (m/s) de cada trecho e pausas (ms) nos pontos-chave */
const VEL = { fora: 30, dentro: 16, rampa: 10, escada: 5.5 };
const PAUSA = { entrada: 420, sobe: 220, chega: 160 };
const LENTO = 5; // metros antes e depois de um ponto-chave em que a pessoa desacelera

function posFita(P, larg, sobe, pos) {
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; pos.set([p.x - (dz / L) * larg / 2, p.y + sobe, p.z + (dx / L) * larg / 2, p.x + (dz / L) * larg / 2, p.y + sobe, p.z - (dx / L) * larg / 2], i * 6); });
}
function fita(P, larg, sobe, mat) {
  const pos = new Float32Array(P.length * 6), idx = []; posFita(P, larg, sobe, pos);
  for (let i = 1; i < P.length; i++) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

/* marcador de GPS: aro branco, miolo azul, seta de direção e um halo claro em volta */
function marcadorGPS() {
  const g = new THREE.Group(); const sem = { depthTest: false, depthWrite: false, fog: false, transparent: true };
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.5, 40), new THREE.MeshBasicMaterial({ color: 0x2f6fe4, opacity: 0.35, ...sem }));
  const aro = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, ...sem }));
  const miolo = new THREE.Mesh(new THREE.CircleGeometry(0.78, 40), new THREE.MeshBasicMaterial({ color: 0x2f6fe4, ...sem }));
  const s = new THREE.Shape(); s.moveTo(0, 2.25); s.lineTo(0.85, 1.25); s.lineTo(-0.85, 1.25); s.closePath();
  const seta = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0x2f6fe4, ...sem }));
  [halo, aro, miolo, seta].forEach((m, i) => { m.rotation.x = -Math.PI / 2; m.position.y = i * 0.01; m.renderOrder = 40 + i; });
  const gira = new THREE.Group(); gira.add(seta); g.add(halo, aro, miolo, gira);
  g.userData = { halo, gira }; return g;
}
/* pino do destino: gota vermelha com miolo branco, sempre visível */
function pinoDestino() {
  const g = new THREE.Group(); const sem = { depthTest: false, depthWrite: false, fog: false };
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshBasicMaterial({ color: 0xd6332c, transparent: true, ...sem }));
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.9, 24), new THREE.MeshBasicMaterial({ color: 0xd6332c, transparent: true, ...sem }));
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, ...sem }));
  cabeca.position.y = 2.6; ponta.position.y = 1.35; ponta.rotation.x = Math.PI; miolo.position.set(0, 2.62, 0);
  [ponta, cabeca, miolo].forEach((m, i) => { m.renderOrder = 45 + i; }); g.add(ponta, cabeca, miolo); g.scale.setScalar(0.58);
  g.userData.alfa = (a) => [ponta, cabeca, miolo].forEach((m) => { m.material.opacity = a; }); return g;
}

export function criarViagem({ scene, camera, controls, interior, palco, pedir, ficha, passos }) {
  const grupo = new THREE.Group(); grupo.name = 'viagem'; scene.add(grupo);
  const mLinha = new THREE.MeshBasicMaterial({ color: COR, side: THREE.DoubleSide, fog: false, transparent: true });
  const mBorda = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, transparent: true });
  const mRaioX = new THREE.MeshBasicMaterial({ color: COR, side: THREE.DoubleSide, transparent: true, opacity: 0.32, depthWrite: false, depthFunc: THREE.GreaterDepth, fog: false });
  const mPrevia = new THREE.MeshBasicMaterial({ color: COR, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthWrite: false, fog: false });
  let st = null, ultimo = null;
  const reduzir = () => document.querySelector('#reduzir')?.checked;

  /* um trecho da linha: aparece aos poucos atrás da pessoa (show) e pode esmaecer (alfa) */
  function linha(R, previa = false) {
    const acc = [0]; for (let i = 1; i < R.length; i++) acc.push(acc.at(-1) + R[i].distanceTo(R[i - 1]));
    const mats = [mBorda.clone(), mLinha.clone(), mRaioX.clone()];
    const ms = [fita(R, 1.3, 0.18, mats[0]), fita(R, 0.76, 0.21, mats[1]), fita(R, 0.76, 0.21, mats[2])];
    ms.forEach((m, i) => { m.renderOrder = 30 + i; m.geometry.setDrawRange(0, 0); grupo.add(m); });
    /* prévia do caminho inteiro, clarinha, por baixo: dá para ver por onde a pessoa vai */
    const pv = previa ? fita(R, 0.76, 0.16, mPrevia.clone()) : null; if (pv) { pv.renderOrder = 29; grupo.add(pv); }
    const total = acc.at(-1) || 1;
    return {
      total,
      alfa(a) { mats[0].opacity = a; mats[1].opacity = a; mats[2].opacity = 0.32 * a; if (pv) pv.material.opacity = 0.28 * a; },
      show(f, vis = true) { const d = clamp(f) * total; let i = 0; while (i < acc.length - 1 && acc[i] < d) i++; ms.forEach((m) => { m.visible = vis; m.geometry.setDrawRange(0, i * 6); }); if (pv) pv.visible = vis; },
    };
  }
  function limpar() {
    for (const c of [...grupo.children]) { grupo.remove(c); c.traverse((o) => o.geometry?.dispose()); }
    const havia = !!st; st = null; ficha.hidden = true; passos.hidden = true; document.body.classList.remove('em-viagem');
    if (havia) palco.set({ abre: 0, ops: [1, 1, 1], elos: [1, 1], chegada: 0, plano: 0, iso: 0, esc: 1 }); interior.select(-1, null); controls.enabled = true; pedir();
  }

  /* Percurso: os pontos amostrados a cada 30 cm, com a hora em que a pessoa passa por cada um. O ritmo muda por trecho
     (campus, corredor, subida) e cai perto dos pontos-chave, onde ela ainda para um instante. */
  function percurso(q) {
    const pts = q.pts; const R = [V3(pts[0])], idx = [0];
    for (let i = 1; i < pts.length; i++) { const a = V3(pts[i - 1]), b = V3(pts[i]); const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.3)); for (let j = 1; j <= n; j++) R.push(a.clone().lerp(b, j / n)); idx.push(R.length - 1); }
    const at = (i) => (i >= 0 && i < idx.length ? idx[i] : -1);
    /* trechos: dentro do bloco de [ini, fim]; subida de [sobe, chega] */
    const dIni = q.externo ? (q.iSaida >= 0 ? 0 : -1) : at(q.iEntrada), dFim = q.externo ? at(q.iSaida) : R.length - 1;
    const kSobe = at(q.iSobe), kChega = at(q.iChega);
    const chaves = [[q.externo ? -1 : (q.iEntrada > 0 ? dIni : -1), PAUSA.entrada], [kSobe, PAUSA.sobe], [kChega, PAUSA.chega], [q.externo && q.iSaida >= 0 ? dFim : -1, PAUSA.entrada]].filter(([k]) => k > 0);
    const acc = [0]; for (let i = 1; i < R.length; i++) acc.push(acc.at(-1) + R[i].distanceTo(R[i - 1]));
    const T = [0];
    for (let i = 1; i < R.length; i++) {
      const dentro = dIni >= 0 && i > dIni && i <= dFim, sobe = kSobe >= 0 && i > kSobe && i <= kChega;
      let v = sobe ? (q.via === 'escada' ? VEL.escada : VEL.rampa) : dentro ? VEL.dentro : VEL.fora;
      const perto = Math.min(acc.at(-1) - acc[i], ...chaves.map(([k]) => Math.abs(acc[i] - acc[k])));
      v *= 0.32 + 0.68 * suave(clamp(perto / LENTO));
      let t = T.at(-1) + ((acc[i] - acc[i - 1]) / v) * 1000;
      for (const [k, p] of chaves) if (k === i) t += p;
      T.push(t);
    }
    return { R, T, acc, dIni, dFim, kSobe, kChega, chaves };
  }
  /* posição da pessoa na hora t do percurso (e o índice do ponto) */
  function noPercurso(P, t) {
    const { R, T } = P; if (t <= 0) return { p: R[0].clone(), i: 0 }; if (t >= T.at(-1)) return { p: R.at(-1).clone(), i: R.length - 1 };
    let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
    const u = clamp((t - T[lo]) / Math.max(1e-6, T[hi] - T[lo])); return { p: R[lo].clone().lerp(R[hi], u), i: u > 0.5 ? hi : lo };
  }
  /* destaque por andar a partir da altura da pessoa: o andar dela inteiro, os de cima somem, os de baixo ficam fracos */
  function opsPorAltura(y) {
    return [0, 1, 2].map((l) => { const a = (l * FH - y) / FH; return a > 0 ? suave(clamp(1 - a / 0.42)) : 0.12 + 0.88 * suave(clamp(1 + a / 0.55)); });
  }

  function poseFinal(s) {
    const q = s.plano;
    if (q.externo) { s.Rf = enquadrar(camera, [s.R.at(-1), ...s.R.slice(Math.max(0, s.R.length - 120))], { e: 52, min: 30, folga: 1.4 }); return; }
    const L = q.level;
    const sala = (q.poly || [[q.centro[0], q.centro[1]]]).map((p) => V3(mapear([p[0], L * FH + 0.03, p[1]], 0)).add(new THREE.Vector3(0, ROOM_H, 0)));
    const fim = s.R.slice(Math.max(0, s.R.length - 60));
    let a = AZ0; const v = q.portaVista; if (v) { const az = Math.atan2(v[0], v[1]); if (Math.cos(az - AZ0) < 0.55) a = az + 0.3 * Math.sign(Math.sin(AZ0 - az) || 1); }
    s.az = a; s.Rf = enquadrar(camera, [...sala, ...fim.slice(-30)], { e: 54, a, min: 26, folga: 1.3 });
  }
  /* câmera que segue a pessoa: mais longe no campus, mais perto e mais de cima dentro do bloco */
  function poseSegue(s, alvo, dentro, sobe) {
    const d = sobe ? 46 : dentro ? 52 : 78, e = THREE.MathUtils.degToRad(sobe ? 46 : dentro ? 56 : 50);
    return { t: alvo.clone(), d, e, a: AZ0 };
  }

  function ir(dest, { origem = null, forcar = null, animar = false } = {}) {
    const plano = rota(dest, origem, forcar); if (!plano) return null;
    limpar(); palco.parar(); palco.set({ corte: 99, esc: 0 }); ultimo = { dest, origem, forcar };
    document.body.classList.add('em-viagem');
    if (plano.zona) interior.select(plano.level, plano.zona.id);
    const P = percurso(plano);
    const s = { plano, P, R: P.R, t: 0, ultimoQuadro: performance.now(), fim: false, pausa: null, etapa: -1, de: daCamera(camera, controls), alvo: null };
    /* trechos da linha: campus, andar de saída, subida, andar de chegada (cada um esmaece com o seu andar) */
    const corte = [0, P.dIni, P.kSobe, P.kChega, P.dFim, P.R.length - 1].filter((k, i, l) => k >= 0 && (i === 0 || k > Math.max(...l.slice(0, i).filter((x) => x >= 0))));
    s.trechos = [];
    for (let i = 1; i < corte.length; i++) {
      const a = corte[i - 1], b = corte[i]; if (b - a < 1) continue;
      const meio = P.R[Math.floor((a + b) / 2)]; const dentro = P.dIni >= 0 && a >= P.dIni && b <= P.dFim; const sobe = P.kSobe >= 0 && a === P.kSobe;
      s.trechos.push({ a, b, dentro, sobe, nivel: Math.round(meio.y / FH), l: linha(P.R.slice(a, b + 1), !dentro) });
    }
    /* etapas mostradas no cartão */
    const andarNome = (l) => (l ? l + 'º andar' : 'Térreo');
    const lOrig = plano.origem ? plano.origem.level : 0;
    const alvoNome = plano.zona ? (plano.zona.roomNumber ? 'Sala ' + plano.zona.roomNumber : plano.zona.label) : plano.ponto?.nome || 'Destino';
    s.etapas = plano.externo
      ? [[0, plano.origem ? 'Saída da sala' : 'Portaria'], [P.dFim > 0 ? P.dFim : 1, plano.saida ? 'Saída: ' + plano.saida : 'Caminho'], [P.R.length - 1, plano.ponto?.onde || alvoNome]]
      : [[0, plano.origem ? 'Sua sala' : 'Portaria'], ...(P.dIni > 0 ? [[P.dIni, plano.entrada ? plano.entrada[0].toUpperCase() + plano.entrada.slice(1) : 'Entrada']] : []), [P.dIni >= 0 ? P.dIni + 1 : 1, andarNome(lOrig)],
        ...(P.kSobe >= 0 ? [[P.kSobe, plano.via === 'escada' ? 'Escada' : 'Rampa'], [P.kChega, andarNome(plano.level)]] : []), [P.R.length - 1, alvoNome]];
    s.etapas = s.etapas.filter(([, t], i, l) => l.findIndex(([, u]) => u === t) === i);
    passos.replaceChildren(...s.etapas.map(([, t]) => { const el = document.createElement('span'); el.textContent = t; return el; })); passos.hidden = false;
    /* GPS e destino */
    s.gps = marcadorGPS(); grupo.add(s.gps);
    s.pino = pinoDestino(); grupo.add(s.pino);
    const dp = plano.externo ? P.R.at(-1) : plano.door ? V3(plano.door) : P.R.at(-1); s.pinoEm = dp.clone();
    ficha.querySelector('.f-num').textContent = alvoNome; ficha.querySelector('.f-nome').textContent = plano.zona ? plano.zona.name || plano.zona.label : plano.ponto?.onde || ''; ficha.querySelector('.f-via').textContent = '';
    /* tempos: voo até o começo, percurso, chegada */
    s.tVoo = 600; s.tCheg = 950; s.dur = s.tVoo + P.T.at(-1) + s.tCheg;
    poseFinal(s); st = s; controls.enabled = false;
    if (reduzir() && !animar) st.t = st.dur;
    pedir(); return plano;
  }

  function tick(now) {
    if (!st || st.fim) return false; const s = st, q = s.plano, P = s.P;
    const dt = Math.min(60, Math.max(0, now - s.ultimoQuadro)); s.ultimoQuadro = now; if (s.pausa == null) s.t = Math.min(s.dur, s.t + dt);
    const t = s.pausa != null ? s.pausa * s.dur : s.t;
    const tp = clamp((t - s.tVoo) / P.T.at(-1)) * P.T.at(-1), { p: cab, i } = noPercurso(P, tp);
    const dentro = P.dIni >= 0 && i >= P.dIni && i <= P.dFim, sobe = P.kSobe >= 0 && i > P.kSobe && i < P.kChega;
    /* abertura do bloco: abre enquanto a pessoa para na entrada (ou já começa aberto, saindo de uma sala) */
    let abre = 0;
    if (P.dIni >= 0) {
      const tIn = P.T[P.dIni] - (P.dIni > 0 ? PAUSA.entrada * 0.9 : 1e9), tOut = P.dFim < P.R.length - 1 ? P.T[P.dFim] : 1e12;
      abre = suave(clamp((tp - tIn) / 520)) * (1 - suave(clamp((tp - tOut) / 520)));
    }
    const ops0 = opsPorAltura(cab.y), ops = ops0.map((o) => 1 + (o - 1) * abre);
    const elos = [0, 1].map((k) => (sobe || (P.kSobe >= 0 && i >= P.kSobe - 4 && i <= P.kChega + 4) ? 1 : Math.max(ops[k], ops[k + 1]) * 0.5));
    const tFim = s.tVoo + P.T.at(-1), chegada = q.externo ? 0 : suave(clamp((t - tFim + 200) / 800));
    if (!q.externo || P.dIni >= 0) palco.set({ abre, ops, elos, chegada, plano: 0, iso: 0, esc: 0 });
    else palco.set({ abre: 0, iso: 0 });
    /* linha: cada trecho aparece atrás da pessoa e esmaece com o andar dele */
    for (const tr of s.trechos) {
      tr.l.show((i - tr.a) / Math.max(1, tr.b - tr.a), true);
      const op = tr.dentro ? (tr.sobe ? Math.max(ops[tr.nivel] ?? 1, i <= tr.b + 8 ? 1 : 0.35) : ops[Math.min(2, Math.max(0, tr.nivel))] ?? 1) : 1 - 0.6 * abre;
      tr.l.alfa(op);
    }
    /* marcador de GPS (com a direção do caminho) e pino do destino */
    const fr = P.R[Math.min(P.R.length - 1, i + 4)], bk = P.R[Math.max(0, i - 4)];
    s.gps.position.copy(cab).add(new THREE.Vector3(0, 0.35, 0)); s.gps.userData.gira.rotation.y = Math.atan2(fr.x - bk.x, fr.z - bk.z) + Math.PI; // a seta é desenhada apontando para -z
    /* halo discreto: anel fixo e claro que só respira devagar (sem piscar) */
    s.gps.userData.halo.scale.setScalar(1.12 + 0.06 * Math.sin(now / 900)); s.gps.userData.halo.material.opacity = 0.2;
    s.gps.visible = t < s.dur - 300;
    /* de fora, o pino fica acima do telhado (o destino está dentro do bloco); com o bloco aberto, desce até a porta */
    const pinoY = q.externo ? s.pinoEm.y + 1.6 : s.pinoEm.y + 1.6 + ROOM_H * chegada * 0.6;
    s.pino.position.set(s.pinoEm.x, pinoY + Math.abs(Math.sin(now / 420)) * 0.35 * (1 - chegada), s.pinoEm.z);
    /* dentro do bloco, enquanto a pessoa não chega ao andar do destino, o pino fica mais fraco (não briga com a escada) */
    /* o pino só aparece quando a pessoa chega ao andar do destino (dentro do bloco) */
    s.pinoVer = q.externo ? 1 : Math.min(1, (s.pinoVer || 0) + (abre > 0.6 && Math.abs(cab.y - s.pinoEm.y) < 0.8 ? dt / 300 : -dt / 200)); s.pinoVer = Math.max(0, s.pinoVer);
    if (t >= s.dur) s.pinoVer = 1;
    s.pino.visible = s.pinoVer > 0.01; s.pino.userData.alfa(s.pinoVer);
    /* câmera: voo inicial até a pessoa, depois segue de perto (alvo suavizado), e no fim enquadra o destino */
    /* a câmera mira um pouco à frente da pessoa (meio segundo de caminho), para mostrar por onde ela vai */
    const { p: frente } = noPercurso(P, Math.min(P.T.at(-1), tp + 500));
    const segue = centrarLivre(camera, poseSegue(s, cab.clone().lerp(frente, 0.6), dentro, sobe));
    if (!s.alvo || t < s.tVoo) s.alvo = segue; else {
      const k = 1 - Math.exp(-dt / 170), kd = 1 - Math.exp(-dt / 500);
      s.alvo = { t: s.alvo.t.clone().lerp(segue.t, k), d: s.alvo.d + (segue.d - s.alvo.d) * kd, e: s.alvo.e + (segue.e - s.alvo.e) * kd, a: segue.a };
    }
    let p = s.alvo;
    if (t < s.tVoo) p = mistura(s.de, segue, suave(t / s.tVoo));
    if (t > tFim) p = mistura(s.alvo, s.Rf, suave(clamp((t - tFim) / s.tCheg)));
    aplicar(camera, controls, p);
    /* etapa atual */
    let et = 0; s.etapas.forEach(([k], j) => { if (i >= k) et = j; });
    if (et !== s.etapa) { s.etapa = et; [...passos.children].forEach((el, j) => { el.className = j === et ? 'agora' : j < et ? 'feito' : ''; }); document.dispatchEvent(new CustomEvent('mapa:etapa', { detail: { etapa: et, text: passos.children[et]?.textContent || '' } })); }
    if (t >= s.dur && s.pausa == null) { s.fim = true; controls.enabled = true; controls.update(); document.dispatchEvent(new CustomEvent('mapa:chegada', { detail: q })); }
    return true;
  }
  function posicionarFicha(w, h) {
    if (!st || !st.fim) { ficha.hidden = true; return; }
    const q = st.plano; const base = q.externo ? st.R.at(-1).clone().add(new THREE.Vector3(0, 3, 0)) : V3(mapear([q.centro[0], q.level * FH + 0.03, q.centro[1]], interior.abertura())).add(new THREE.Vector3(0, ROOM_H + 2.6, 0));
    const v = base.project(camera); ficha.hidden = v.z > 1 || v.z < -1;
    ficha.style.transform = `translate(${Math.max(80, Math.min(w - 80, (v.x * 0.5 + 0.5) * w))}px,${Math.max(110, Math.min(h - 60, (-v.y * 0.5 + 0.5) * h))}px) translate(-50%,-100%)`;
  }
  function pular() { if (st) { st.pausa = null; st.t = st.dur; st.fim = false; pedir(); } }
  function congelar(u) { if (st) { st.pausa = u; st.fim = false; st.ultimoQuadro = performance.now(); pedir(); } }
  function resize() { if (st) { poseFinal(st); if (st.fim) aplicar(camera, controls, st.Rf); pedir(); } }
  /* camada de desenho da rota: 1 quando o bloco está aberto (segunda passada, por cima) */
  function camada(n) { grupo.traverse((o) => o.layers.set(n)); }
  return { camada, ir, limpar, tick, posicionarFicha, pular, congelar, resize, ativa: () => !!st, estado: () => st, repetir: () => ultimo && ir(ultimo.dest, { origem: ultimo.origem, forcar: ultimo.forcar, animar: true }) };
}
