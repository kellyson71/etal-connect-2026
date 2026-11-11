/* O "palco" junta tudo o que muda quando o bloco se abre: o campus desbota (iso), o prédio real é fatiado de cima para
   baixo e some, e o interior em maquete cresce no lugar dele e se abre em escada. Um número só, abre (0 a 1), comanda
   a sequência; a câmera anda junto, por pose. A viagem e os botões usam o mesmo palco, então nada pula. */
import { aplicar, daCamera, mistura, suave } from './camera.js';

const clamp = (t) => Math.min(1, Math.max(0, t));
export function criarPalco({ principal, interior, estilo, camera, controls, pedir }) {
  /* esc: quanto da abertura em escada vale (1 = andares afastados; 0 = cada andar na altura real, dentro do prédio).
     corte: altura em que o prédio real é cortado quando se olha por dentro sem a maquete (modos Evento e Campus). */
  const st = { abre: 0, ops: [1, 1, 1], elos: [1, 1], chegada: 0, plano: 0, iso: 0, esc: 1, corte: 99, isoMax: 1 };
  let tw = null;
  function aplicarEstado(s = st) {
    /* 0 a 0,4: o telhado sai e o prédio é cortado de cima até o teto das salas do último andar;
       0,4 a 1: cada andar fica cortado logo acima das salas e eles se afastam em escada. */
    const fc = suave(clamp(s.abre / 0.4)), escada = suave(clamp((s.abre - 0.4) / 0.6)) * s.esc, aberto = s.abre > 0.001;
    const topo = 3 * 3.45 - 0.22, corte = s.abre < 0.4 ? principal.ALTO - (principal.ALTO - topo) * fc : 99;
    estilo.isolate(Math.max(s.iso, suave(clamp(s.abre / 0.5))) * s.isoMax);
    estilo.veuDentro(1 - 0.8 * suave(clamp(s.abre / 0.6)));
    principal.escalonar({ corte, aberto, t: escada, ops: s.ops, elos: s.elos, plano2d: s.plano });
    /* da maquete fica só a sala escolhida (sobe e fica verde na chegada) */
    interior.view({ ops: s.ops.map((o) => (aberto ? o : 0)), elos: [0, 0], chegada: s.chegada, abre: escada, plano: s.plano, soSala: true });
  }
  /* vai até um estado (e uma pose de câmera) em ms; devolve uma promessa */
  function ir(alvo, poseAlvo = null, ms = 900) {
    tw?.fim?.(); const de = JSON.parse(JSON.stringify(st)); const p0 = poseAlvo ? daCamera(camera, controls) : null;
    return new Promise((fim) => { tw = { t0: performance.now(), ms, de, alvo, p0, p1: poseAlvo, fim }; controls.enabled = false; pedir(); });
  }
  function tick(now) {
    if (!tw) return false;
    const k = tw.ms ? clamp((now - tw.t0) / tw.ms) : 1, e = suave(k);
    for (const [key, v] of Object.entries(tw.alvo)) {
      if (Array.isArray(v)) st[key] = v.map((x, i) => tw.de[key][i] + (x - tw.de[key][i]) * e); else st[key] = tw.de[key] + (v - tw.de[key]) * e;
    }
    if (tw.p1) aplicar(camera, controls, mistura(tw.p0, tw.p1, e));
    aplicarEstado();
    if (k >= 1) { const f = tw.fim; tw = null; controls.enabled = true; controls.update(); f(); return false; }
    return true;
  }
  function set(parcial) { Object.assign(st, parcial); aplicarEstado(); }
  function parar() { if (tw) { tw = null; controls.enabled = true; } }
  return { ir, tick, set, parar, estado: () => st, ativo: () => !!tw };
}
