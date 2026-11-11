/* Interior do bloco principal em maquete: a mesma planta, com salas em blocos baixos coloridos pelo uso, número grande
   em cima, corredores claros, escada e rampa à mostra. Aparece quando o bloco se abre (andares e rotas); de longe, vale
   o prédio realista.
   Abertura em escada (escolha do usuário): com t = 1 cada andar sobe GAP_Y e recua BACK em relação ao de baixo, como uma
   arquibancada vista de frente; assim dá para ver dentro de todos ao mesmo tempo. Com t = 0 os andares ficam nas alturas
   reais, dentro do prédio. As distâncias da rota continuam as reais; só a apresentação é afastada. */
import * as THREE from 'three';
import { PLAN, wp, zonePoly, insetPoly, centroid, FH } from './dados.js';
import { fracaoRampa } from './subidas.js';
import { Lote } from './geo.js';
import { placa } from './texturas.js';
import { PONTOS } from './rotas.js';

export const GAP_Y = 7.5, BACK = 30, ROOM_H = 1.2;
const DESTAQUE = new THREE.Color(0x4d971f);
const gy = (t) => FH + (GAP_Y - FH) * t, gb = (t) => BACK * t;
/* leva um ponto do mundo real (altura real) para a maquete aberta em escada */
export function mapear([x, y, z], t = 1) { const lf = Math.max(0, (y - 0.03) / FH); return [x, lf * gy(t) + 0.03, z - lf * gb(t)]; }

const COR = { classroom: 0xdfe8fb, laboratory: 0xd2e3f6, office: 0xf6ead2, staff: 0xf6ead2, restroom: 0xd3ece9, reception: 0xffd99a, auditorium: 0xc7d3f3, lounge: 0xdcebcf };
const BORDA = 0x8d9cb8;

export function criarInterior() {
  const grupo = new THREE.Group(); grupo.name = 'interior-maquete'; grupo.visible = false;
  const floors = [], rooms = [], labels = [], links = [];
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const shape = (poly) => new THREE.Shape(poly.map((p) => new THREE.Vector2(...p)));
  function block(poly, base, height, color, holes = []) {
    const s = shape(poly); holes.forEach((p) => s.holes.push(new THREE.Path(p.map((q) => new THREE.Vector2(...q)))));
    const geo = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: false, steps: 1 }); geo.rotateX(Math.PI / 2); geo.translate(0, base + height, 0);
    return new THREE.Mesh(geo, mat(color));
  }
  const escrita = (texto, cor, sub) => placa(256, 112, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = cor;
    g.font = `800 ${texto.length > 4 ? 40 : 64}px system-ui`; g.fillText(texto, W / 2, sub ? 42 : 56);
    if (sub) { g.font = '700 24px system-ui'; g.globalAlpha = 0.75; g.fillText(sub, W / 2, 90); }
  });
  const rotulo = (texto, sub, w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.44), new THREE.MeshBasicMaterial({ map: escrita(texto, '#1f2f57', sub), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 6; m.userData = { texto, sub }; return m;
  };
  const curto = (z) => (z.kind === 'classroom' ? 'SALA' : z.kind === 'laboratory' ? 'LAB' : (z.word || '').length <= 12 ? z.word || '' : '');

  PLAN.floors.forEach((f, l) => {
    const floor = new THREE.Group(); floor.name = 'andar-' + l; grupo.add(floor); floors.push(floor);
    const holes = f.zones.filter((z) => ['courtyard', 'stairs', 'ramp'].includes(z.kind)).map((z) => zonePoly(z).map(wp));
    /* laje com borda grossa: dá a espessura que faltava quando o andar aparece solto */
    floor.add(block(f.outlinePts.map(wp), -0.55, 0.52, 0xe4e9f3, holes));
    for (const c of f.corridors) floor.add(block(zonePoly(c).map(wp), 0, 0.03, 0xffffff));
    if (l === 0) { const pat = f.zones.find((z) => z.kind === 'courtyard'); if (pat) floor.add(block(zonePoly(pat).map(wp), -0.05, 0.08, 0xb9d99a)); }
    for (const z of f.zones) {
      if (['courtyard', 'stairs', 'ramp', 'wall'].includes(z.kind)) continue;
      const poly = insetPoly(zonePoly(z).map(wp), 0.16); const cor = z.closed ? 0xdadde3 : COR[z.kind] || 0xe4e8ef;
      const h = z.kind === 'lounge' ? 0.12 : z.kind === 'auditorium' ? 1.8 : ROOM_H;
      const mesh = block(poly, 0.03, h, cor); mesh.name = 'sala:' + l + ':' + z.id; mesh.userData = { level: l, zone: z, baseColor: cor, h }; floor.add(mesh); rooms.push(mesh);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 35), new THREE.LineBasicMaterial({ color: BORDA })));
      const c = centroid(poly); const larg = Math.max(...poly.map((p) => p[0])) - Math.min(...poly.map((p) => p[0]));
      const texto = z.roomNumber || (z.kind === 'auditorium' ? 'AUDITÓRIO' : z.kind === 'restroom' ? 'WC' : z.kind === 'reception' ? 'RECEPÇÃO' : '');
      if (texto) { const r = rotulo(texto, z.roomNumber ? curto(z) : '', Math.min(z.kind === 'auditorium' ? 9 : 4.6, larg - 0.5)); r.position.set(c[0], h + 0.08, c[1]); r.userData.zone = z; floor.add(r); labels.push(r); mesh.userData.label = r; }
    }
    /* portas: umbral escuro no corredor */
    for (const d of f.doors) { const p = wp([d.x, d.y]); const m = new THREE.Mesh(new THREE.BoxGeometry(d.axis === 'h' ? 1.1 : 0.2, 0.22, d.axis === 'h' ? 0.2 : 1.1), mat(0x4c5f88)); m.position.set(p[0], 0.14, p[1]); floor.add(m); }
    /* nomes da escada e da rampa no chão */
    for (const z of f.zones.filter((q) => q.kind === 'stairs' || q.kind === 'ramp')) { const c = centroid(zonePoly(z).map(wp)); const r = rotulo(z.kind === 'stairs' ? 'ESCADA' : 'RAMPA', '', z.kind === 'stairs' ? 3 : 5); r.position.set(c[0], 0.12, c[1]); floor.add(r); labels.push(r); }
    /* bebedouro (só onde existe) */
    Object.values(PONTOS).filter((P) => P.dentro?.level === l).forEach((P) => {
      const p = wp(P.dentro.p); const g = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 14), mat(0x3a8fd8)); g.position.set(p[0], 0.5, p[1]); floor.add(g);
    });
  });

  /* escada e rampa entre os andares: desenhadas com altura de uma unidade por andar e esticadas pela matriz do grupo,
     para acompanhar a abertura em escada sem refazer a geometria */
  const mats = { rampa: mat(0xb8c6e0), escada: mat(0xaebfdd), borda: mat(0x7c8fb4) };
  for (let l = 0; l < 2; l++) {
    const g = new THREE.Group(); g.name = 'subida-' + l; g.matrixAutoUpdate = false; grupo.add(g); links.push(g); const L = new Lote();
    const loop = PLAN.rampLoop;
    loop.slice(1).forEach((q, j) => {
      const a = wp(loop[j]), b = wp(q); const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.01) return;
      const n = [(-(b[1] - a[1]) / len) * 0.95, ((b[0] - a[0]) / len) * 0.95], ha = fracaoRampa(loop[j], j, loop), hb = fracaoRampa(q, j + 1, loop);
      L.quadUp('rampa', [a[0] + n[0], ha, a[1] + n[1]], [a[0] - n[0], ha, a[1] - n[1]], [b[0] - n[0], hb, b[1] - n[1]], [b[0] + n[0], hb, b[1] + n[1]]);
    });
    const s = PLAN.floors[1].zones.find((z) => z.kind === 'stairs');
    const A = wp([s.x + s.w * 0.27, s.y + s.h - 6]), B = wp([s.x + s.w * 0.27, s.y + 10]), C = wp([s.x + s.w * 0.73, s.y + 10]), D = wp([s.x + s.w * 0.73, s.y + s.h - 6]);
    const lance = (p0, p1, h0, h1) => { const n = 10; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, ya = p0[1] + (p1[1] - p0[1]) * t0, yb = p0[1] + (p1[1] - p0[1]) * t1, h = h0 + (h1 - h0) * t1; L.quadUp('escada', [p0[0] - 0.65, h, ya], [p0[0] + 0.65, h, ya], [p0[0] + 0.65, h, yb], [p0[0] - 0.65, h, yb]); } };
    lance(A, B, 0, 0.5); lance(C, D, 0.5, 1);
    L.quadUp('escada', [B[0] - 0.65, 0.5, B[1] - 0.6], [C[0] + 0.65, 0.5, C[1] - 0.6], [C[0] + 0.65, 0.5, C[1] + 0.6], [B[0] - 0.65, 0.5, B[1] + 0.6]);
    L.build(g, mats, { cast: false, receive: false });
  }

  /* materiais próprios, fora da neblina, translúcidos por andar */
  grupo.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.fog = false; o.material.transparent = true; o.material.side = THREE.DoubleSide; } });
  floors.forEach((f, l) => f.traverse((o) => { if (o.isMesh || o.isLineSegments) o.renderOrder = l * 3 + (o.material.map ? 2 : 0); }));
  links.forEach((g, l) => g.traverse((o) => { if (o.isMesh) o.renderOrder = l * 3 + 1; }));

  let focused = null, abertura = 1, achata = 0;
  const M4 = new THREE.Matrix4();
  function posicionar() {
    floors.forEach((f, l) => { f.position.set(0, l * gy(abertura), -l * gb(abertura)); f.scale.y = 1 - 0.88 * achata; f.updateMatrix(); });
    /* (x, y, z) da subida, com y de 0 a 1 por andar → (x, base + y·gy, z − base·gb − y·gb) */
    links.forEach((g, l) => { M4.set(1, 0, 0, 0, 0, gy(abertura), 0, l * gy(abertura), 0, -gb(abertura), 1, -l * gb(abertura), 0, 0, 0, 1); g.matrix.copy(M4); g.matrixWorldNeedsUpdate = true; });
  }
  posicionar();
  /* ops: opacidade de cada andar (0 some); elos: de cada subida; chegada: 0 a 1, a sala escolhida sobe e fica verde */
  /* soSala: o andar em si é o prédio real (principal.escalonar); da maquete aparece só a sala escolhida, da altura
     das salas de verdade, por cima delas */
  function view({ ops = [1, 1, 1], elos = [1, 1], chegada = 0, abre = abertura, plano = achata, soSala = false } = {}) {
    if (abre !== abertura || plano !== achata) { abertura = abre; achata = plano; posicionar(); }
    if (soSala) {
      grupo.visible = !!focused && (ops[focused.userData.level] || 0) > 0.05;
      floors.forEach((f) => { f.visible = true; f.children.forEach((o) => { o.visible = o === focused || (focused && o === focused.userData.label); }); });
      links.forEach((g) => { g.visible = false; });
      if (focused) {
        const e = chegada * chegada * (3 - 2 * chegada), alto = 3.3 / focused.userData.h; focused.scale.y = alto; focused.position.y = e * 0.9;
        focused.material.opacity = Math.min(1, chegada * 1.6); focused.material.depthWrite = true; focused.material.color.set(focused.userData.baseColor).lerp(DESTAQUE, e);
        focused.children.forEach((c) => { if (c.material) c.material.opacity = focused.material.opacity; });
        const r = focused.userData.label; if (r) { r.position.y = 3.38 + e * 0.9; r.material.opacity = focused.material.opacity; r.material.map = e > 0.5 ? r.userData.claro : r.userData.escuro; }
      }
      return;
    }
    floors.forEach((f) => f.children.forEach((o) => { o.visible = true; })); if (focused) focused.scale.y = 1;
    grupo.visible = ops.some((v) => v > 0.001);
    floors.forEach((f, l) => {
      const a = ops[l] || 0; f.visible = a > 0.001;
      f.traverse((o) => { if (!o.material) return; const texto = !!o.material.map; o.material.opacity = texto ? Math.max(0, (a - 0.5) / 0.5) : a; o.material.depthWrite = !texto && a > 0.6; });
    });
    links.forEach((g, l) => { const a = elos[l] || 0; g.visible = a > 0.001; g.traverse((o) => { if (o.material) { o.material.opacity = a; o.material.depthWrite = a > 0.6; } }); });
    if (focused) {
      const e = chegada * chegada * (3 - 2 * chegada); focused.position.y = e * 1.1; focused.material.color.set(focused.userData.baseColor).lerp(DESTAQUE, e);
      const r = focused.userData.label; if (r) { r.position.y = focused.userData.h + 0.08 + e * 1.1; r.material.map = e > 0.5 ? r.userData.claro : r.userData.escuro; }
    }
  }
  function select(l, id) {
    if (focused) { focused.material.color.set(focused.userData.baseColor); focused.position.y = 0; const r = focused.userData.label; if (r) { r.position.y = focused.userData.h + 0.08; r.material.map = r.userData.escuro; } }
    focused = rooms.find((r) => r.userData.level === l && r.userData.zone.id === id) || null;
    const r = focused?.userData.label; if (r && !r.userData.claro) { r.userData.escuro = r.material.map; r.userData.claro = escrita(r.userData.texto, '#ffffff', r.userData.sub); }
  }
  /* os números ficam de pé para quem olha: giram com a câmera */
  function virar(az) { labels.forEach((r) => { r.rotation.z = az; }); }
  function syncRooms() {
    labels.forEach((r) => { const z = r.userData.zone; if (!z || !z.roomNumber || z.roomNumber === r.userData.texto) return; r.userData.texto = z.roomNumber; r.material.map.dispose(); r.material.map = escrita(z.roomNumber, '#1f2f57', r.userData.sub); r.userData.escuro = r.material.map; r.userData.claro = null; });
  }
  /* centro e contorno de um andar já na posição aberta (para enquadrar a câmera) */
  function contorno(l, t = abertura) { const f = PLAN.floors[l]; return (l ? f.outlinePts : PLAN.floors[1].outlinePts).map((p) => { const w = wp(p); return new THREE.Vector3(w[0], l * gy(t), w[1] - l * gb(t)); }); }
  return { grupo, floors, rooms, links, view, select, virar, syncRooms, contorno, abertura: () => abertura };
}
