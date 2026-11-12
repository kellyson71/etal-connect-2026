/* Dados da animação "Como a rota é calculada" da apresentação (docs/assets/rota-completa.json).
   Roda o mesmo código de rotas do mapa (mapa3d/src/rotas.js, função explicar) para uma rota de exemplo que sai da
   portaria, anda pelas calçadas, entra no bloco e sobe aos três andares:
     node scripts/gerar-rota-apresentacao.mjs
   Guarda a ordem de visita do Dijkstra (calçadas) e do A* (cada andar), o custo de cada entrada e de escada × rampa. */
import fs from 'node:fs'; import vm from 'node:vm';
globalThis.window = globalThis;
const R = new URL('..', import.meta.url).pathname;
for (const n of ['campus-data', 'campus-limpo', 'campus-fundo', 'campus-entorno', 'campus-verde', 'plan-data']) vm.runInThisContext(fs.readFileSync(`${R}prototipo/${n}.js`, 'utf8'));
const { explicar } = await import(`${R}mapa3d/src/rotas.js`);
const D = await import(`${R}mapa3d/src/dados.js`);
const DEST = { level: 2, zonaId: 'labs-norte-2' };
const x = explicar(DEST);
const r1 = (v) => Math.round(v * 10) / 10; const P = (l) => l.map((q) => q.map(r1));
const zona = D.PLAN.floors[DEST.level].zones.find((z) => z.id === DEST.zonaId);
const andares = D.PLAN.floors.map((f, level) => ({
  level, label: f.label,
  zonas: f.zones.filter((z) => !['wall'].includes(z.kind)).map((z) => ({ k: z.kind, n: z.roomNumber || '', p: P(D.zonePoly(z)) })),
  corredores: f.corridors.map((c) => P(c.points ? c.points.split(' ').map((q) => q.split(',').map(Number)) : [[c.x, c.y], [c.x + c.w, c.y], [c.x + c.w, c.y + c.h], [c.x, c.y + c.h]])),
  contorno: P(f.outlinePts || D.PLAN.floors[0].outlinePts),
  mundo: P((level ? D.PLAN.floors[1].outlinePts : f.outlinePts).map((q) => D.wp(q))),
}));
const lugares = [...D.BUILDINGS, ...D.COVERS].filter((b) => ['principal', 'anexo', 'laboratorios', 'cantina', 'diretoria', 'biblioteca', 'portaria', 'patio', 'coberta', 'obelisco'].includes(b.id)).map((b) => ({ id: b.id, nome: b.label, p: P(b.p) }));
const out = {
  destino: `${zona.kind === 'laboratory' ? 'Lab' : 'Sala'} ${zona.roomNumber} · ${D.PLAN.floors[DEST.level].label}`,
  viewBox: D.PLAN.viewBox, mundo: D.PLAN.world, lugares,
  inicio: x.inicio, nos: P(x.nos), arestas: x.arestas, ordem: x.ordem.map(([n, d, p]) => [n, r1(d), p]),
  entradas: x.entradas.map((e) => ({ ...e, pos: P([x.nos[e.no]])[0] })), escolhida: x.escolhida,
  vias: x.vias, via: x.via, subida: { pe: P([x.subida.foot])[0], volta: P(x.subida.loop) },
  andares,
  busca: x.andares.map((a) => ({ level: a.level, visitados: a.visitados, grade: P(a.grade), final: P(a.final) })),
  rota: { pts: P(x.rota.pts), iEntrada: x.rota.iEntrada, iSobe: x.rota.iSobe, iChega: x.rota.iChega, metros: Math.round(x.rota.metros), minutos: x.rota.minutos, porta: P([x.rota.door])[0] },
};
fs.writeFileSync(`${R}docs/assets/rota-completa.json`, JSON.stringify(out));
console.log(`docs/assets/rota-completa.json: ${out.destino}, ${out.escolhida}, ${out.via}, ${out.rota.metros} m, ${out.busca.map((b) => b.visitados.length).join(' + ')} células`);
