/* Destaque do evento no modelo realista: as partes do evento recebem um véu da cor delas (bloco principal verde,
   auditório e entrada azuis, cantina laranja, pátio verde-claro) e o resto do campus perde um pouco da cor.
   As texturas, a luz e as sombras continuam as mesmas; só a cor é misturada no fim do sombreamento.
   O modo Campus volta tudo ao natural. */
import { DESAT, ISO, VEU, VEUS, comVeu } from './texturas.js';

/* o bloco principal não desbota quando é ele que está isolado */
const SEM_ISO = { value: 0 };
export const CORES = { verde: 0x4fa627, azul: 0x2f55c8, laranja: 0xf08a1c, patio: 0x8fd060, vermelho: 0xc0392b };
export const LEGENDA = [['verde', 'Bloco principal', 'minicursos e salas'], ['azul', 'Auditório', 'palestras'], ['laranja', 'Cantina', 'refeições'], ['patio', 'Pátio', 'convivência']];

export function criarEstilo() {
  let mode = 'evento';
  /* cada parte do evento ganha materiais só dela (os do campus são compartilhados entre prédios) */
  function destacar(grupo, cor, { clonar = true, isolado = false } = {}) {
    const vistos = new Map();
    grupo.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.isMeshBasicMaterial) return;
      const orig = o.material; let m = vistos.get(orig);
      if (!m) { m = clonar ? orig.clone() : orig; comVeu(m, CORES[cor], VEUS[cor], isolado ? SEM_ISO : undefined); vistos.set(orig, m); }
      o.material = m;
    });
  }
  /* véu do bloco principal visto por dentro (andares abertos): mais fraco, para as salas mostrarem a cor real */
  function veuDentro(v) { VEUS.verde.value = v; }
  function apply() { DESAT.value = mode === 'evento' ? 0.42 : 0; VEU.value = mode === 'evento' ? 0.42 : 0; }
  apply();
  return { destacar, veuDentro, veuParte: (cor, v) => { VEUS[cor].value = v; }, setMode(m) { mode = m === 'campus' ? 'campus' : 'evento'; apply(); }, mode: () => mode, isolate(t) { ISO.value = t; }, isolation: () => ISO.value };
}
