/* app/03-planta.js · desenho da planta do bloco (SVG) usado nas fichas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- mapa ---------------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
const floorOf = (lvl) => P.floors.find((f) => f.level === lvl);
const zoneOf = (lvl, id) => floorOf(lvl).zones.find((z) => z.id === id);
function bbox(z) {
  if (z.points) {
    const p = z.points.split(' ').map((q) => q.split(',').map(Number));
    const xs = p.map((q) => q[0]),
      ys = p.map((q) => q[1]);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }
  return { x: z.x, y: z.y, w: z.w, h: z.h };
}
function hitLayer(f, sel) {
  return (
    '<g class="hits">' +
    f.zones
      .map((z) => {
        const c = `class="hit${z.id === sel ? ' sel' : ''}" data-zone="${z.id}"`;
        return z.points
          ? `<polygon ${c} points="${z.points}"/>`
          : `<rect ${c} x="${z.x + 2}" y="${z.y + 2}" width="${z.w - 4}" height="${z.h - 4}" rx="8"/>`;
      })
      .join('') +
    '</g>'
  );
}
function planSvg(lvl, vb, sel, cls = 'plan') {
  const f = floorOf(lvl);
  return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid ${cls === 'thumb' ? 'slice' : 'meet'}" role="img" aria-label="Planta do ${f.label}">${P.defs}<rect x="-400" y="-400" width="1700" height="1300" fill="${isDark() ? '#0e1932' : '#f4f6fa'}"/>${isDark() ? f.svgDark : f.svg}${hitLayer(f, sel)}</svg>`;
}
function focusBox(lvl, id, width = 420, ratio = 0.78) {
  const z = zoneOf(lvl, id);
  if (!z) {
    const [, , w, h] = (P.viewBox || '0 0 900 430').split(' ').map(Number);
    return { x: 0, y: 0, w, h };
  }
  const b = bbox(z);
  const w = Math.max(width, b.w + 80),
    h = w * ratio;
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
}
const zoneName = (z) =>
  z.name
    ? z.name
    : z.roomNumber
      ? `${z.kind === 'laboratory' ? 'Lab' : z.kind === 'staff' ? 'Sala dos professores' : 'Sala'} ${z.kind === 'staff' ? '' : z.roomNumber}`.trim()
      : z.label;
