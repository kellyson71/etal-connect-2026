/* app/03-planta.js · desenho da planta do bloco (SVG) usado nas fichas.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* ---------------- mapa ---------------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
const floorOf = (lvl) => P.floors.find((f) => f.level === lvl);
const zoneOf = (lvl, id) => floorOf(lvl).zones.find((z) => z.id === id);
const zoneName = (z) =>
  z.name
    ? z.name
    : z.roomNumber
      ? `${z.kind === 'laboratory' ? 'Lab' : z.kind === 'staff' ? 'Sala dos professores' : 'Sala'} ${z.kind === 'staff' ? '' : z.roomNumber}`.trim()
      : z.label;
