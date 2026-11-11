/* Abertura do mapa, no espírito da entrada do mapa original do app (Campus3D.intro + eventReveal), com mais detalhe:
   1. Voo contínuo (um único ritmo, acelera e desacelera uma vez): começa de cima, com o horizonte; aproxima indo para o
      IF; no meio inclina e passa baixo por cima da Elétrica e dos apartamentos, do outro lado da rodovia; termina com
      o campus em perspectiva, na vista do evento. A câmera segue uma curva (Catmull-Rom) pelos pontos-chave, em pose
      (alvo, distância em escala log, elevação, azimute), sem tranco.
   2. Destaque do evento: o resto do campus perde um pouco da cor e as partes do evento sobem do chão, uma de cada vez,
      com um salto (bloco principal, cantina, pátio, obelisco), cada uma ganhando a sua cor enquanto sobe.
   Na primeira visita roda tudo; depois, só uma aproximação curta. ?intro=1 força a versão completa. Movimento reduzido,
   ou uma rota pedida logo na abertura, pulam direto para o fim. */
import * as THREE from 'three';
import { aplicar, daCamera, mistura, suave } from './camera.js';
import { DESAT, VEU, VEUS } from './texturas.js';

const CHAVE = 'etal-mapa-novo-abertura';
const clamp = (t) => Math.min(1, Math.max(0, t));
const salto = (k) => { const c1 = 2.1, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }; // passa um pouco de 1 e assenta
const cr = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
const P = (x, z, d, e, a) => ({ t: new THREE.Vector3(x, 0, z), d, e: THREE.MathUtils.degToRad(e), a });

export function criarAbertura({ camera, controls, renderer, pedir, partes, fim, ocupado, aoTerminar }) {
  let st = null;
  const ler = () => { try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; } };
  const marcar = () => { try { localStorage.setItem(CHAVE, '1'); } catch {} };
  const reduzir = () => document.querySelector('#reduzir')?.checked;

  function cores(desat, veus) { DESAT.value = desat; VEU.value = 0.42; partes.forEach((p, i) => p.cores.forEach((c) => { VEUS[c].value = veus[i]; })); }
  function alturas(hs) { partes.forEach((p, i) => { p.grupo.scale.y = Math.max(0.01, hs[i]); }); renderer.shadowMap.needsUpdate = true; }

  function rodar(tipo = null) {
    const q = new URLSearchParams(location.search);
    tipo ??= q.get('intro') === '1' || !ler() ? 'completa' : 'curta';
    if (reduzir() || q.get('intro') === '0') { marcar(); return false; }
    const E = fim();
    if (tipo === 'curta') { st = { tipo, t0: performance.now(), ms: 650, de: { ...E, d: E.d * 1.35, e: E.e + 0.12, a: E.a - 0.12 }, E }; controls.enabled = false; pedir(); return true; }
    /* pontos-chave: de cima (quase vertical, horizonte no alto da tela), aproximação, passagem baixa pela Elétrica, fim */
    const K = [P(-30, -30, 1300, 66, -0.35), P(-30, -30, 1300, 66, -0.35), P(-25, -15, 480, 42, -0.05), P(-15, -8, 160, 13, 0.27), E, E];
    K.forEach((k) => { k.ld = Math.log(k.d); });
    for (let i = 1; i < K.length; i++) { let d = K[i].a - K[i - 1].a; d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; K[i].a = K[i - 1].a + d; }
    st = { tipo: 'completa', t0: null, K, T: [0, 0.4, 0.7, 1], voo: 5400, revela: 4500, sobe: [0, 260, 480, 660], dur: 4500 + 660 + 1000 };
    controls.enabled = false; cores(0, partes.map(() => 0)); alturas(partes.map(() => 0)); aplicar(camera, controls, K[0]); pedir(); return true;
  }
  function terminar() {
    if (!st) return; st = null; cores(0.42, partes.map(() => 1)); alturas(partes.map(() => 1)); aplicar(camera, controls, fim()); marcar();
    controls.enabled = true; controls.update(); aoTerminar?.(); pedir();
  }
  function tick(now) {
    if (!st) return false;
    if (ocupado()) { st.fim = true; const keep = daCamera(camera, controls); terminar(); aplicar(camera, controls, keep); return false; }
    st.t0 ??= now; /* o relógio começa no primeiro quadro desenhado, não durante a montagem da cena */
    const t = st.pausa ?? now - st.t0;
    if (st.tipo === 'curta') { const k = clamp(t / st.ms); aplicar(camera, controls, mistura(st.de, st.E, suave(k))); if (k >= 1) { terminar(); return false; } return true; }
    /* voo */
    const kv = clamp(t / st.voo), e = 0.5 - Math.cos(Math.PI * kv) / 2, { K, T } = st;
    let i = 0; while (i < 2 && e > T[i + 1]) i++;
    const u = (e - T[i]) / (T[i + 1] - T[i]), c = (f) => cr(f(K[i]), f(K[i + 1]), f(K[i + 2]), f(K[i + 3]), u);
    aplicar(camera, controls, { t: new THREE.Vector3(c((k) => k.t.x), c((k) => k.t.y), c((k) => k.t.z)), d: Math.exp(c((k) => k.ld)), e: c((k) => k.e), a: c((k) => k.a) });
    /* destaque do evento: começa quando a câmera ainda está chegando */
    const r = t - st.revela;
    const hs = st.sobe.map((d) => (r - d <= 0 ? 0 : r - d >= 900 ? 1 : salto(clamp((r - d) / 900))));
    const vs = st.sobe.map((d) => suave(clamp((r - d - 250) / 650)));
    cores(0.42 * suave(clamp(r / 900)), vs); alturas(hs);
    if (t >= st.dur) { terminar(); return false; }
    return true;
  }
  /* para revisar quadro a quadro: congelar(ms) prende o relógio; congelar(null) solta */
  function congelar(ms) { if (st) { st.pausa = ms; pedir(); } }
  return { rodar, tick, terminar, congelar, ativa: () => !!st };
}
