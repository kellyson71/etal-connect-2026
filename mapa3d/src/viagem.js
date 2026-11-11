/* A viagem até o destino, no espírito do mapa original do app.
   Da portaria até uma sala:
     1. a câmera vai para o campus e a linha sai da portaria até a entrada do bloco;
     2. o campus desbota, o prédio real é fatiado e o interior em maquete se abre em escada (só até o andar de destino);
     3. a linha anda pelo térreo e sobe pela escada ou rampa, com a câmera parada mostrando a subida inteira;
     4. a câmera se aproxima do andar de destino; se a porta estiver virada para longe, ela gira devagar até ficar de
        frente para a porta; a sala sobe e fica verde.
   Saindo de uma sala (a da atividade atual), o bloco já começa aberto. Para um lugar de fora (bebedouro do Anexo ou da
   Cantina) a linha fica no campus, com a parte de dentro do prédio vista em transparência.
   A câmera é sempre interpolada por pose (alvo, distância, elevação, azimute): ela gira em arco, sem tranco. */
import * as THREE from 'three';
import { rota } from './rotas.js';
import { PLAN, wp } from './dados.js';
import { mapear, ROOM_H } from './interior.js';
import { AZ0, pose, aplicar, daCamera, mistura, suave, enquadrar } from './camera.js';

const COR = 0x3f8f1a;
const clamp = (t) => Math.min(1, Math.max(0, t));
const V3 = (p) => new THREE.Vector3(...p);

function amostrar(pts) {
  const out = [V3(pts[0])];
  for (let i = 1; i < pts.length; i++) { const a = V3(pts[i - 1]), b = V3(pts[i]); const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.3)); for (let j = 1; j <= n; j++) out.push(a.clone().lerp(b, j / n)); }
  return out;
}
function posFita(P, larg, sobe, pos) {
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; pos.set([p.x - (dz / L) * larg / 2, p.y + sobe, p.z + (dx / L) * larg / 2, p.x + (dz / L) * larg / 2, p.y + sobe, p.z - (dx / L) * larg / 2], i * 6); });
}
function fita(P, larg, sobe, mat) {
  const pos = new Float32Array(P.length * 6), idx = []; posFita(P, larg, sobe, pos);
  for (let i = 1; i < P.length; i++) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  m.refazer = (Q) => { posFita(Q, larg, sobe, g.attributes.position.array); g.attributes.position.needsUpdate = true; };
  return m;
}

export function criarViagem({ scene, camera, controls, interior, palco, pedir, ficha, passos }) {
  const grupo = new THREE.Group(); grupo.name = 'viagem'; scene.add(grupo);
  const mLinha = new THREE.MeshBasicMaterial({ color: COR, side: THREE.DoubleSide, fog: false });
  const mBorda = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
  const mRaioX = new THREE.MeshBasicMaterial({ color: COR, side: THREE.DoubleSide, transparent: true, opacity: 0.32, depthWrite: false, depthFunc: THREE.GreaterDepth, fog: false });
  let st = null, ultimo = null;
  const reduzir = () => document.querySelector('#reduzir')?.checked;

  /* Com dentro = true os pontos são os reais (altura de verdade) e a linha acompanha a maquete: a cada quadro eles são
     levados para a abertura atual (t), então a linha sobe pela rampa desenhada e não corta caminho pelo ar. */
  function linha(pts, larg = 1, dentro = false) {
    const R = amostrar(pts), acc = [0]; for (let i = 1; i < R.length; i++) acc.push(acc.at(-1) + R[i].distanceTo(R[i - 1]));
    const P = R.map((p) => p.clone()); let tAtual = null;
    const mats = [mBorda.clone(), mLinha.clone(), mRaioX.clone()]; mats[0].transparent = mats[1].transparent = true;
    const ms = [fita(P, 1.3 * larg, 0.18, mats[0]), fita(P, 0.76 * larg, 0.21, mats[1]), fita(P, 0.76 * larg, 0.21, mats[2])];
    ms.forEach((m, i) => { m.renderOrder = 30 + i; m.geometry.setDrawRange(0, 0); grupo.add(m); });
    const total = acc.at(-1) || 1;
    const at = (f) => { const d = clamp(f) * total; let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; return P[i - 1].clone().lerp(P[i], clamp((d - acc[i - 1]) / Math.max(0.001, acc[i] - acc[i - 1]))); };
    const fr = (p) => { const v = V3(p); let k = 0, dd = Infinity; R.forEach((q, i) => { const e = q.distanceToSquared(v); if (e < dd) { dd = e; k = i; } }); return acc[k] / total; };
    const real = (f) => { const d = clamp(f) * total; let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; return R[i - 1].clone().lerp(R[i], clamp((d - acc[i - 1]) / Math.max(0.001, acc[i] - acc[i - 1]))); };
    const ajustar = (t) => { if (!dentro || t === tAtual) return; tAtual = t; R.forEach((q, i) => P[i].set(...mapear([q.x, q.y, q.z], t))); ms.forEach((m) => m.refazer(P)); };
    if (dentro) ajustar(1);
    const alfa = (a) => { mats[0].opacity = a; mats[1].opacity = a; mats[2].opacity = 0.32 * a; };
    return { P, R, total, at, fr, real, ajustar, alfa, show(f, vis = true) { const d = clamp(f) * total; let i = 0; while (i < acc.length - 1 && acc[i] < d) i++; ms.forEach((m) => { m.visible = vis; m.geometry.setDrawRange(0, i * 6); }); } };
  }
  function limpar() {
    for (const c of [...grupo.children]) { grupo.remove(c); c.geometry?.dispose(); }
    const havia = !!st; st = null; ficha.hidden = true; passos.hidden = true; document.body.classList.remove('em-viagem');
    if (havia) palco.set({ abre: 0, ops: [1, 1, 1], elos: [1, 1], chegada: 0, plano: 0, iso: 0, esc: 1 }); interior.select(-1, null); controls.enabled = true; pedir();
  }
  /* poses de câmera para cada ato */
  function poses(s) {
    const q = s.plano, L = q.level;
    const pe0 = PLAN.floors[0].outlinePts.map((p) => { const w = wp(p); return new THREE.Vector3(w[0], 0, w[1]); });
    if (q.externo) { s.A = enquadrar(camera, [...s.fora.P, ...pe0], { e: 55, min: 40 }); s.R = s.A; return; }
    const andares = []; for (let l = Math.min(s.lOrig, L); l <= Math.max(s.lOrig, L); l++) andares.push(...interior.contorno(l, 1));
    s.A = enquadrar(camera, [...(s.fora ? s.fora.P : []), ...pe0], { e: 50, min: 40 });
    s.S = enquadrar(camera, andares, { e: 42, min: 36, folga: 1.06 });
    /* com subida, a partir dela os andares ficam na altura real (t = 0), "rentes ao prédio" */
    const tF = q.via ? 0 : 1; s.tF = tF;
    if (q.via) {
      /* subida: a câmera chega perto da escada ou da rampa, com um pedaço dos dois andares em volta */
      const sub = s.dentro.R.filter((p, i) => { const f = s.dentro.fr(p); return f >= s.fS - 0.04 && f <= s.fC + 0.04; }).map((p) => V3(mapear([p.x, p.y, p.z], 0)));
      s.C = enquadrar(camera, sub, { e: 40, min: 24, folga: 1.35 });
    }
    s.F = enquadrar(camera, interior.contorno(L, tF), { e: 55, min: 32, folga: 1.04 });
    /* chegada: perto da sala; se a porta olha para longe da câmera padrão, a câmera gira até o lado do corredor */
    const sala = (q.poly || [[q.centro[0], q.centro[1]]]).map((p) => V3(mapear([p[0], L * 3.45 + 0.03, p[1]], tF)).add(new THREE.Vector3(0, ROOM_H, 0)));
    const fim = s.dentro.R.slice(Math.max(0, s.dentro.R.length - 60)).map((p) => V3(mapear([p.x, p.y, p.z], tF)));
    let a = AZ0; const v = q.portaVista; if (v) { const az = Math.atan2(v[0], v[1]); if (Math.cos(az - AZ0) < 0.55) a = az + 0.3 * Math.sign(Math.sin(AZ0 - az) || 1); }
    s.az = a;
    /* meio-termo entre o andar inteiro e a sala: dá para ver onde a sala fica no andar */
    s.R = mistura(enquadrar(camera, interior.contorno(L, tF), { e: 55, a, min: 32, folga: 1.04 }), enquadrar(camera, [...sala, ...fim], { e: 52, a, min: 26, folga: 1.6 }), 0.55);
  }
  function ir(dest, { origem = null, forcar = null, animar = false } = {}) {
    const plano = rota(dest, origem, forcar); if (!plano) return null;
    limpar(); palco.parar(); palco.set({ corte: 99, esc: 1 }); ultimo = { dest, origem, forcar };
    document.body.classList.add('em-viagem');
    if (plano.zona) interior.select(plano.level, plano.zona.id);
    const s = { plano, t: 0, ultimoQuadro: performance.now(), fim: false, pausa: null, etapa: -1, lOrig: plano.origem ? plano.origem.level : 0, de: daCamera(camera, controls) };
    if (plano.externo) {
      s.fora = linha(plano.pts); s.tempos = [900, Math.max(2600, s.fora.total * 22), 900];
      s.nomes = [plano.origem ? 'Saída da sala' : 'Portaria', plano.saida ? 'Saída: ' + plano.saida : 'Caminho', plano.ponto.onde];
    } else {
      const k = plano.iEntrada; const dentro = plano.pts.slice(k);
      s.fora = k > 0 ? linha(plano.pts.slice(0, k + 1)) : null; s.dentro = linha(dentro, 1, true);
      /* o trecho até chegar ao andar de destino esmaece no fim, para não cruzar as salas do andar */
      const jC = plano.iChega >= 0 ? plano.iChega - k : 0; s.antes = jC > 0 ? linha(dentro.slice(0, jC + 1), 1, true) : null; s.depois = jC > 0 ? linha(dentro.slice(jC), 1, true) : null; if (s.antes) s.dentro.show(0, false);
      const fS = plano.iSobe >= 0 ? s.dentro.fr(dentro[plano.iSobe - k]) : 1, fC = plano.iChega >= 0 ? s.dentro.fr(dentro[plano.iChega - k]) : 1;
      s.fS = plano.via ? fS : 1; s.fC = plano.via ? fC : 1;
      const m = s.dentro.total; const sobeAndares = Math.abs(plano.level - s.lOrig);
      /* ato 4: primeiro os andares descem até a altura real e a câmera se aproxima; depois a linha sobe */
      s.tempos = [s.fora ? 900 : 700, s.fora ? Math.max(2200, s.fora.total * 20) : 0, s.fora ? 1600 : 1300, Math.max(1300, s.fS * m * 36), plano.via ? 1300 + 2600 * sobeAndares : 0, Math.max(1500, (1 - s.fC) * m * 42), 1500];
      const andar = plano.level ? plano.level + 'º andar' : 'Térreo'; const alvo = plano.zona ? (plano.zona.roomNumber ? 'Sala ' + plano.zona.roomNumber : plano.zona.label) : plano.ponto.nome;
      s.nomes = [plano.origem ? 'Sua sala' : 'Portaria', plano.origem ? 'Sua sala' : plano.entrada[0].toUpperCase() + plano.entrada.slice(1), 'Dentro do bloco', s.lOrig ? s.lOrig + 'º andar' : 'Térreo', plano.via === 'escada' ? 'Escada' : 'Rampa', andar, alvo];
      /* marcador do destino: um aro na porta */
      const aro = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 32), mBorda); aro.rotation.x = -Math.PI / 2; aro.renderOrder = 33; grupo.add(aro); s.aro = aro;
    }
    /* ponto que anda na ponta da linha */
    s.ponto = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 12), new THREE.MeshBasicMaterial({ color: 0x22386f, depthTest: false, fog: false })); s.ponto.renderOrder = 35; grupo.add(s.ponto);
    s.limites = [0]; s.tempos.forEach((t) => s.limites.push(s.limites.at(-1) + t)); s.dur = s.limites.at(-1);
    const unicos = s.nomes.filter((t, i) => s.nomes.indexOf(t) === i && s.tempos[i] > 0); s.rot = s.nomes.map((t) => Math.max(0, unicos.indexOf(t)));
    passos.replaceChildren(...unicos.map((t) => { const el = document.createElement('span'); el.textContent = t; return el; })); passos.hidden = false;
    const nome = plano.zona ? (plano.zona.roomNumber ? 'Sala ' + plano.zona.roomNumber : plano.zona.label) : plano.ponto.nome;
    ficha.querySelector('.f-num').textContent = nome; ficha.querySelector('.f-nome').textContent = plano.zona ? plano.zona.name || plano.zona.label : plano.ponto.onde; ficha.querySelector('.f-via').textContent = '';
    poses(s); st = s; controls.enabled = false;
    if (reduzir() && !animar) st.t = st.dur;
    pedir(); return plano;
  }
  /* Andares por cima da ponta da linha ficam translúcidos (dá para ver a rampa e o andar de baixo por eles); os de baixo
     esmaecem um pouco. Só vale com os andares na altura real (sem a escada); com eles afastados não há o que esconder. */
  function fantasmas(ops, hCab, peso) {
    for (let l = 0; l < 3; l++) {
      if (!ops[l]) continue; const a = (l * 3.45 - hCab) / 3.45;
      const acima = suave(clamp((a - 0.12) / 0.45)), abaixo = suave(clamp((-a - 0.12) / 0.45));
      ops[l] *= 1 - peso * (0.8 * acima + 0.6 * abaixo);
    }
  }
  function tick(now) {
    if (!st || st.fim) return false; const s = st, q = s.plano;
    const dt = Math.min(60, Math.max(0, now - s.ultimoQuadro)); s.ultimoQuadro = now; if (s.pausa == null) s.t = Math.min(s.dur, s.t + dt);
    const t = s.pausa != null ? s.pausa * s.dur : s.t;
    let ato = 0; while (ato < s.tempos.length - 1 && t >= s.limites[ato + 1]) ato++;
    const k = clamp((t - s.limites[ato]) / Math.max(1, s.tempos[ato])), e = suave(k), lin = k * k * (3 - 2 * k);
    let p = s.A, cab = null;
    if (q.externo) {
      if (ato === 0) { p = mistura(s.de, s.A, e); s.fora.show(0); cab = s.fora.at(0); }
      else if (ato === 1) { s.fora.show(lin); cab = s.fora.at(lin); }
      else { s.fora.show(1); cab = s.fora.at(1); }
      palco.set({ abre: 0, iso: 0 });
    } else {
      const L = q.level, lo = s.lOrig; const ops = [0, 0, 0], elos = [0, 0];
      const faixa = (o) => { for (let l = Math.min(lo, L); l <= Math.max(lo, L); l++) ops[l] = o; for (let l = Math.min(lo, L); l < Math.max(lo, L); l++) elos[l] = o; };
      let f = 0, abre = 1, chegada = 0, esc = 1;
      if (ato === 0) { p = mistura(s.de, s.fora ? s.A : s.S, e); abre = s.fora ? 0 : e; faixa(1); }
      if (ato === 1) { abre = 0; faixa(1); s.fora.show(lin); cab = s.fora.at(lin); }
      if (ato === 2) { abre = e; faixa(1); p = mistura(s.A, s.S, e); if (s.fora) s.fora.show(1, k < 0.5); }
      if (ato === 3) { p = s.S; faixa(1); f = s.fS * lin; }
      if (ato === 4) {
        /* 30%: os andares descem até a altura real e a câmera vem para perto da subida; 70%: a linha sobe (ou desce) */
        const kd = suave(clamp(k / 0.3)), ks = clamp((k - 0.3) / 0.7), ls = ks * ks * (3 - 2 * ks);
        faixa(1); esc = 1 - kd; f = s.fS + (s.fC - s.fS) * ls;
        /* a câmera acompanha um pouco a ponta da linha enquanto ela sobe */
        const c = s.C; const alvo = V3(mapear(s.dentro.real(f).toArray(), 0));
        const segue = { t: c.t.clone().lerp(alvo, 0.35 * ks), d: c.d, e: c.e, a: c.a + 0.18 * (ls - 0.5) };
        p = mistura(s.S, segue, kd);
      }
      if (ato === 5) {
        const kk = suave(clamp(k * 1.4)); faixa(1); esc = q.via ? 0 : 1;
        p = mistura(q.via ? { ...s.C, a: s.C.a + 0.09 } : s.S, s.F, kk);
        for (let l = 0; l < 3; l++) if (l !== L) ops[l] *= 1 - 0.85 * kk; elos[0] *= 1 - 0.8 * kk; elos[1] *= 1 - 0.8 * kk; f = s.fC + (1 - s.fC) * lin;
      }
      if (ato === 6) { esc = q.via ? 0 : 1; p = mistura(s.F, s.R, e); ops[L] = 1; for (let l = 0; l < 3; l++) if (l !== L && (l < Math.max(lo, L) && l >= Math.min(lo, L))) ops[l] = 0.15; f = 1; chegada = e; }
      if (q.via && ato >= 3) fantasmas(ops, s.dentro.real(f).y, 1 - esc);
      palco.set({ abre, ops, elos, chegada, plano: 0, iso: 0, esc });
      /* a linha segue a abertura que o palco acabou de aplicar */
      const tAb = interior.abertura(); [s.dentro, s.antes, s.depois].forEach((l) => l?.ajustar(tAb));
      if (s.aro) { s.aro.position.set(...mapear(q.door, tAb)); s.aro.position.y += 0.35; }
      if (ato >= 3) {
        if (s.fora) s.fora.show(1, false); cab = s.dentro.at(f);
        if (s.antes) { s.dentro.show(0, false); s.antes.show(clamp(f / s.fC)); s.depois.show(clamp((f - s.fC) / (1 - s.fC || 1)), f >= s.fC); s.antes.alfa(ato >= 5 ? 1 - 0.75 * suave(clamp(k * 1.6 + (ato === 6 ? 1 : 0))) : 1); }
        else s.dentro.show(f);
      } else { s.dentro.show(0); if (s.antes) { s.antes.show(0); s.depois.show(0); } }
      if (ato < 3 && !cab) cab = s.fora ? s.fora.at(ato >= 1 ? 1 : 0) : s.dentro.at(0);
    }
    if (cab) { s.ponto.position.copy(cab); s.ponto.position.y += 0.8; } s.ponto.visible = !!cab && t < s.dur - 1;
    aplicar(camera, controls, p);
    const et = s.rot[ato];
    if (et !== s.etapa) { s.etapa = et; [...passos.children].forEach((el, i) => { el.className = i === et ? 'agora' : i < et ? 'feito' : ''; }); document.dispatchEvent(new CustomEvent('mapa:etapa', { detail: { etapa: et, text: passos.children[et]?.textContent || '' } })); }
    if (t >= s.dur && s.pausa == null) { s.fim = true; controls.enabled = true; controls.update(); document.dispatchEvent(new CustomEvent('mapa:chegada', { detail: q })); }
    return !s.fim && s.pausa == null;
  }
  function posicionarFicha(w, h) {
    if (!st || !st.fim) { ficha.hidden = true; return; }
    const q = st.plano; const base = q.externo ? V3(q.pts.at(-1)).add(new THREE.Vector3(0, 3, 0)) : V3(mapear([q.centro[0], q.level * 3.45 + 0.03, q.centro[1]], interior.abertura())).add(new THREE.Vector3(0, ROOM_H + 2.6, 0));
    const v = base.project(camera); ficha.hidden = v.z > 1 || v.z < -1;
    ficha.style.transform = `translate(${Math.max(80, Math.min(w - 80, (v.x * 0.5 + 0.5) * w))}px,${Math.max(110, Math.min(h - 60, (-v.y * 0.5 + 0.5) * h))}px) translate(-50%,-100%)`;
  }
  function pular() { if (st) { st.pausa = null; st.t = st.dur; st.fim = false; pedir(); } }
  function congelar(u) { if (st) { st.pausa = u; st.fim = false; st.ultimoQuadro = performance.now(); pedir(); } }
  function resize() { if (st) { poses(st); if (st.fim) aplicar(camera, controls, st.R); pedir(); } }
  /* camada de desenho da rota: 1 quando o bloco está aberto (segunda passada, por cima) */
  function camada(n) { grupo.traverse((o) => o.layers.set(n)); }
  return { camada, ir, limpar, tick, posicionarFicha, pular, congelar, resize, ativa: () => !!st, estado: () => st, repetir: () => ultimo && ir(ultimo.dest, { origem: ultimo.origem, forcar: ultimo.forcar, animar: true }) };
}
