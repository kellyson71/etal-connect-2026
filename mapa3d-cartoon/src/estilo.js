/* Estilo do experimento, no espírito do mapa original do app: no modo Evento o campus inteiro fica num tom neutro
   bem claro e só as partes do evento têm cor (bloco principal verde, auditório azul, cantina mel, pátio verde claro).
   No modo Campus voltam as cores e texturas do modelo. Isolar o prédio usa a neblina da cena: o campus some no
   fundo sem trocar material nenhum, então não há tranco. */
import * as THREE from 'three';

const TINTA = { verde: 0x62b22f, azul: 0x3558c0, mel: 0xf2ab26, patio: 0x86c85a };
const NEUTRO = { chao: 0xf1f3f7, via: 0xdfe3eb, grama: 0xe8ecf2, parede: 0xf4f6fa, teto: 0xffffff, folha: 0xe3e7ee, tronco: 0xd3d8e2, vidro: 0xc9d2e0, escuro: 0xc2c9d6 };
export const FUNDO = 0xeef1f6;

export function criarEstilo(campus, scene) {
  let mode = 'evento', isolation = 0; const records = [];
  const classe = (o, key, cor) => {
    if (o.isInstancedMesh) return cor && cor.r > cor.g * 1.12 ? 'tronco' : 'folha';
    if (o.name.startsWith('chao')) return /asfalto|paralelo|estrada|intertravado|tijolo/i.test(key) ? 'via' : /grama|campo|mato/i.test(key) ? 'grama' : 'chao';
    if (/vidro|solar/i.test(key)) return 'vidro';
    if (/preto|beiral|cinzaEscuro|barParede|sombrite/i.test(key)) return 'escuro';
    if (/laje|fibro|metal|telha|forro|lona|branco|totem/i.test(key)) return 'teto';
    if (/folha|sebe|flor|verdeMuro/i.test(key)) return 'folha';
    if (/tronco|madeira/i.test(key)) return 'tronco';
    return 'parede';
  };
  function prepare() {
    campus.traverse((o) => {
      if (!o.isMesh || o.userData.styled) return; o.userData.styled = true;
      const key = o.name.split(':').at(-1) || '';
      /* um material por malha: prédios que dividiam material passam a poder ter cores diferentes */
      const m = o.material.clone(); m.onBeforeCompile = () => {}; m.customProgramCacheKey = () => 'cartoon'; o.material = m;
      let node = o, ev = null; while (node && node !== campus) { if (node.userData.event) { ev = node.userData.event; break; } node = node.parent; }
      records.push({ o, m, key, ev, cor0: m.color ? m.color.clone() : null, map0: m.map || null, inst0: o.instanceColor || null, placa: /placa|totem|painel/i.test(key) && !!m.map, tipo: classe(o, key, m.color), especial: m === undefined });
    });
    apply();
  }
  const c = new THREE.Color(), branco = new THREE.Color(0xffffff), preto = new THREE.Color(0x000000);
  function apply() {
    for (const r of records) {
      if (!r.cor0 || r.key === 'poca') continue;
      let map = r.map0, inst = r.inst0;
      if (mode === 'campus') r.m.color.copy(r.cor0);
      else if (r.placa) r.m.color.copy(r.cor0);
      else if (r.ev) {
        c.set(TINTA[r.ev] || TINTA.verde); map = null; inst = null;
        if (r.tipo === 'vidro') c.lerp(branco, 0.72); else if (r.tipo === 'escuro') c.lerp(preto, 0.35); else if (r.tipo === 'parede') c.lerp(preto, 0.14); else if (r.key === 'aco') c.lerp(branco, 0.55);
        r.m.color.copy(c);
      } else { r.m.color.set(NEUTRO[r.tipo]); map = null; inst = null; }
      if (r.m.map !== map) { r.m.map = map; r.m.needsUpdate = true; }
      if (r.o.isInstancedMesh && r.o.instanceColor !== inst) { r.o.instanceColor = inst; r.m.needsUpdate = true; }
    }
    scene.background = new THREE.Color(mode === 'campus' ? 0xcfe3f5 : FUNDO); if (scene.fog) scene.fog.color.copy(scene.background);
  }
  /* t de 0 a 1: a neblina avança até engolir o campus; no fim ele deixa de ser desenhado */
  function isolate(t) {
    isolation = t; campus.visible = t < 0.999;
    if (scene.fog) { const e = t * t * (3 - 2 * t); scene.fog.near = 500 + (1 - 500) * e; scene.fog.far = 3600 + (40 - 3600) * e; }
  }
  return { prepare, setMode(m) { mode = m; apply(); }, isolate, mode: () => mode, isolation: () => isolation };
}
