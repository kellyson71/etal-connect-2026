/* Destaque do evento no modelo realista: as partes do evento recebem um véu da cor delas (bloco principal verde,
   auditório e entrada azuis, cantina laranja, pátio verde-claro) e o resto do campus perde um pouco da cor.
   As texturas, a luz e as sombras continuam as mesmas; só a cor é misturada no fim do sombreamento.
   O modo Campus volta tudo ao natural. */
import { DESAT, ISO, VEU, VEUS, comVeu } from './texturas.js';
import { CART, ESC } from './cartum.js';

/* o bloco principal não desbota quando é ele que está isolado */
const SEM_ISO = { value: 0 };
export const CORES = { verde: 0x4fa627, azul: 0x2f55c8, laranja: 0xf08a1c, patio: 0x56c29b, vermelho: 0xc0392b };
export const LEGENDA = [
  ['verde', 'Bloco principal', 'minicursos e salas'],
  ['azul', 'Auditório', 'palestras'],
  ['laranja', 'Cantina', 'refeições'],
  ['patio', 'Pátio', 'convivência'],
];

/* Modo Evento = mapa ilustrado (cartum.js): cores chapadas por categoria e luz de dia; a troca com o Campus é animada.
   `aoMudar` refaz a luz a cada passo. */
export function criarEstilo({ aoMudar = () => {} } = {}) {
  let mode = 'evento';
  let anim = 0;
  function cartum(alvo, ms = 450) {
    cancelAnimationFrame(anim);
    const de = CART.value,
      t0 = performance.now();
    if (de === alvo || ms <= 0) {
      CART.value = alvo;
      aoMudar();
      return;
    }
    const passo = (t) => {
      const u = Math.min(1, (t - t0) / ms),
        e = u * u * (3 - 2 * u);
      CART.value = de + (alvo - de) * e;
      aoMudar();
      if (u < 1) anim = requestAnimationFrame(passo);
    };
    anim = requestAnimationFrame(passo);
  }
  /* cada parte do evento ganha materiais só dela (os do campus são compartilhados entre prédios) */
  function destacar(grupo, cor, { clonar = true, isolado = false } = {}) {
    const vistos = new Map();
    grupo.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.isMeshBasicMaterial) return;
      const orig = o.material;
      let m = vistos.get(orig);
      if (!m) {
        m = clonar ? orig.clone() : orig;
        comVeu(m, CORES[cor], VEUS[cor], isolado ? SEM_ISO : undefined);
        vistos.set(orig, m);
      }
      o.material = m;
    });
  }
  /* véu do bloco principal visto por dentro (andares abertos): mais fraco, para as salas mostrarem a cor real */
  function veuDentro(v) {
    VEUS.verde.value = v;
  }
  /* tema escuro do app: a paleta do mapa ilustrado escurece (a luz passa a seguir o horário, em main.js) */
  let animEsc = 0;
  function tema(escuro, ms = 450) {
    cancelAnimationFrame(animEsc);
    const de = ESC.value,
      alvo = escuro ? 1 : 0,
      t0 = performance.now();
    if (de === alvo || ms <= 0) {
      ESC.value = alvo;
      aoMudar();
      return;
    }
    const passo = (t) => {
      const u = Math.min(1, (t - t0) / ms),
        e = u * u * (3 - 2 * u);
      ESC.value = de + (alvo - de) * e;
      aoMudar();
      if (u < 1) animEsc = requestAnimationFrame(passo);
    };
    animEsc = requestAnimationFrame(passo);
  }
  function apply(ms) {
    DESAT.value = mode === 'evento' ? 0.42 : 0;
    VEU.value = mode === 'evento' ? 0.42 : 0;
    cartum(mode === 'evento' ? 1 : 0, ms);
  }
  apply(0);
  return {
    tema,
    escuro: () => ESC.value > 0.5,
    destacar,
    veuDentro,
    veuParte: (cor, v) => {
      VEUS[cor].value = v;
    },
    setMode(m) {
      mode = m === 'campus' ? 'campus' : 'evento';
      apply();
    },
    mode: () => mode,
    isolate(t) {
      ISO.value = t;
    },
    isolation: () => ISO.value,
  };
}
