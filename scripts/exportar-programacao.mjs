// Exporta a programação de exemplo do protótipo (prototipo/data.js) para backend/seed/programacao.json,
// no formato que `python -m app.importar programacao` lê. Ano e mês: --ano 2025 --mes 11 (padrão: os do VII ETAL).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ano = +arg('ano', 2025), mes = +arg('mes', 11);
const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['plan-data.js', 'data.js']) vm.runInContext(fs.readFileSync(path.join(root, 'prototipo', f), 'utf8').replace(/\bwindow\./g, 'window.'), ctx);
const D = ctx.window.DATA;
const date = (d) => `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const sessions = D.sessions.map((s) => ({ ...s, date: date(s.day), taken: undefined, demo: undefined }));
const out = { event: { name: 'ETAL', days: D.days.map((d) => ({ ...d, date: date(d.day) })) }, sessions };
fs.mkdirSync(path.join(root, 'backend/seed'), { recursive: true });
fs.writeFileSync(path.join(root, 'backend/seed/programacao.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`${sessions.length} atividades exportadas para backend/seed/programacao.json (${date(D.days[0].day)} a ${date(D.days.at(-1).day)})`);
