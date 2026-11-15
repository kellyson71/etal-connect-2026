/* Modo Evento em estilo de mapa ilustrado (15/11/2026). Cada material do campus ganha uma cor chapada pela categoria do que ele é (grama, via, calçada,
   parede, telhado, vidro…), sem textura, e as partes do evento ficam com a cor cheia delas. Tudo é uniform no mesmo
   programa do campus (chave 'etal'): CART vai de 0 (realista, modo Campus) a 1 (ilustrado, modo Evento). */
import * as THREE from 'three';

export const CART = { value: 0 };
/* ESC: paleta escura (tema escuro do app), de 0 a 1 */
export const ESC = { value: 0 };

/* paleta clara, no espírito do mapa clássico do app e das referências de mapa de campus */
const P = {
  grama: 0xc6e3a2,
  mato: 0xd6e3b0,
  campo: 0x8fcf62,
  sebe: 0x86c266,
  asfalto: 0x9aa1ab,
  estrada: 0xe8dec8,
  terra: 0xf2f0e9,
  calcada: 0xf6f4ee,
  piso: 0xe6e4dd,
  passarela: 0xfaf8f2,
  tijolo: 0xecdccf,
  faixa: 0xffffff,
  amarelo: 0xf2c84b,
  agua: 0x5cc0ea,
  areia: 0xf0dfaa,
  parede: 0xf6f4ef,
  reboco: 0xe9e6df,
  teto: 0xd9dee5,
  vidro: 0xa7c0db,
  vidroClaro: 0xc9dbec,
  escuro: 0x7c8592,
  cinza: 0xb9bfc7,
  madeira: 0xd9b48c,
  tela: 0x8a939e,
  faixaPredio: 0xb9c3d2,
  folha: 0x79bf5a,
  tronco: 0xa07c58,
};
/* paleta escura: chão em ardósia, prédios em cinza-azulado claro (continuam sendo o que mais aparece), vias escuras */
const PE = {
  grama: 0x2e4a37,
  mato: 0x33473a,
  campo: 0x3d7a3e,
  sebe: 0x3b6a45,
  asfalto: 0x232a35,
  estrada: 0x4a4437,
  terra: 0x252d3a,
  calcada: 0x3b4453,
  piso: 0x323a48,
  passarela: 0x485263,
  tijolo: 0x4c4048,
  faixa: 0xc9d1dc,
  amarelo: 0xc9a23a,
  agua: 0x2c6f97,
  areia: 0x6b6146,
  parede: 0x97a2b4,
  reboco: 0x828c9c,
  teto: 0x667082,
  vidro: 0x40597a,
  vidroClaro: 0x58708f,
  escuro: 0x2a2f38,
  cinza: 0x5a6270,
  madeira: 0x7d6650,
  tela: 0x434b57,
  faixaPredio: 0x56627a,
  folha: 0x447f4c,
  tronco: 0x5e4b3b,
};
/* chave do material → categoria. O que não está aqui mantém a cor original (placas, detalhes coloridos). */
const CAT = {
  grama: 'grama',
  patioInterno: 'grama',
  mato: 'mato',
  campo: 'campo',
  sebe: 'sebe',
  sebeFlor: 'sebe',
  verdeMuro: 'sebe',
  asfalto: 'asfalto',
  estrada: 'estrada',
  terra: 'terra',
  terraFora: 'terra',
  chao: 'terra',
  calcada: 'calcada',
  concreto: 'calcada',
  cimento: 'calcada',
  intertravado: 'piso',
  paralelo: 'piso',
  passarela: 'passarela',
  tijolo: 'tijolo',
  faixa: 'faixa',
  faixaAmarela: 'amarelo',
  meioFio: 'amarelo',
  tatil: 'amarelo',
  faixaTubo: 'amarelo',
  agua: 'agua',
  areia: 'areia',
  azulejo: 'parede',
  azulejoAnexo: 'parede',
  azulejoClaro: 'parede',
  moldura: 'parede',
  branco: 'parede',
  brancoPuro: 'parede',
  brancoSujo: 'parede',
  muro: 'parede',
  casaBranca: 'parede',
  casaCreme: 'parede',
  xadrez: 'parede',
  totem: 'parede',
  ar: 'parede',
  caixilho: 'parede',
  reboco: 'reboco',
  reboco2: 'reboco',
  obra: 'reboco',
  laje: 'teto',
  fibro: 'teto',
  metal: 'teto',
  metalBaixo: 'teto',
  telha: 'teto',
  lona: 'teto',
  forroMetal: 'teto',
  aco: 'teto',
  pastilha: 'faixaPredio',
  vidro: 'vidro',
  vidroAceso: 'vidro',
  solar: 'vidro',
  vidroClaro: 'vidroClaro',
  beiral: 'escuro',
  preto: 'escuro',
  cinzaEscuro: 'escuro',
  barParede: 'escuro',
  porta: 'escuro',
  arame: 'escuro',
  cinza: 'cinza',
  sombrite: 'tela',
  alambrado: 'tela',
  grade: 'tela',
  rede: 'tela',
  madeira: 'madeira',
  madeiraClara: 'madeira',
  palco: 'madeira',
  folha: 'folha',
  palma: 'folha',
  tronco: 'tronco',
};
/* dentro do bloco (andares abertos): cores próprias, sem textura, e nunca a cor do evento */
const DENTRO =
  /^(piso|teto|corredor|sala$|borracha|carteira|cadeira|bancada|tela$|quadro|armario|sofa|capacho|poltrona|batente|portaFolha|folhaPorta|mural|placaEntrada)/;
/* quanto da cor chapada entra (o resto é a cor original): árvores guardam um pouco da variação entre copas */
const FORCA = { folha: 0.82, tronco: 0.9 };

const branco = new THREE.Color(0xffffff),
  preto = new THREE.Color(0x000000);
export const chaveDe = (m) => (m.userData.chave || '').replace(/Chao$/, '');

/* uniforms do modo ilustrado para um material; `ev` é a cor do evento quando o material é de uma parte do evento */
export function planoDe(m, ev = null) {
  const k = chaveDe(m);
  const cat = CAT[k];
  const u = {
    uCart: CART,
    uEsc: ESC,
    uPlanoEsc: { value: new THREE.Color() },
    uPlano: { value: new THREE.Color() },
    uPlanoEv: { value: new THREE.Color() },
    uTem: { value: 0 },
    uEvento: { value: 0 },
  };
  if (DENTRO.test(k)) {
    /* cor própria do material, sem o desenho da textura (as texturas brancas viram um cinza claro) */
    u.uPlano.value.copy(m.color || branco);
    if (m.map && u.uPlano.value.getHex() === 0xffffff) u.uPlano.value.set(0xecebe6);
    u.uTem.value = 1;
    u.uPlanoEv.value.copy(u.uPlano.value);
    u.uPlanoEsc.value.copy(u.uPlano.value).lerp(new THREE.Color(0x2b3446), 0.42);
    return u;
  }
  if (!cat) {
    u.uPlano.value.copy(m.color || branco);
    u.uPlanoEv.value.copy(u.uPlano.value);
    u.uPlanoEsc.value.copy(u.uPlano.value);
    return u;
  }
  u.uPlano.value.set(P[cat]);
  u.uPlanoEsc.value.set(PE[cat]);
  u.uTem.value = FORCA[cat] ?? 1;
  if (ev != null) {
    const c = new THREE.Color(ev);
    if (cat === 'teto') c.lerp(branco, 0.16);
    else if (cat === 'faixaPredio') c.lerp(preto, 0.22);
    else if (cat === 'vidro' || cat === 'vidroClaro') c.lerp(branco, 0.5);
    else if (cat === 'escuro') c.lerp(preto, 0.32);
    else if (cat === 'tela' || cat === 'cinza') c.lerp(preto, 0.12);
    else if (['grama', 'calcada', 'piso', 'passarela', 'terra', 'tijolo'].includes(cat)) c.lerp(branco, 0.5);
    else if (cat === 'reboco' || cat === 'madeira') c.lerp(branco, 0.15);
    u.uPlanoEv.value.copy(c);
    u.uEvento.value = 1;
  } else u.uPlanoEv.value.copy(u.uPlano.value);
  return u;
}

/* trecho do fragment shader: troca a cor do material (textura incluída) pela cor chapada */
export const CART_DECL =
  'uniform float uCart; uniform float uEsc; uniform vec3 uPlanoEsc; uniform vec3 uPlano; uniform vec3 uPlanoEv; uniform float uTem; uniform float uEvento;\n';
export const CART_COR = `#include <color_fragment>
 diffuseColor.rgb = mix(diffuseColor.rgb, mix(mix(uPlano, uPlanoEsc, uEsc), uPlanoEv, uParte * uEvento), uCart * uTem);`;

/* categoria de um material (para os contornos) */
export const categoria = (m) => {
  const k = chaveDe(m);
  return DENTRO.test(k) ? 'dentro:' + k : CAT[k] || null;
};
