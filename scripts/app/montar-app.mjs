// Monta prototipo/app.js a partir das partes em prototipo/app/ (na ordem dos números, no mesmo escopo).
// O app.js é gerado: edite as partes.
// Uso: node scripts/app/montar-app.mjs [--verificar]
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const proto = path.join(raiz, 'prototipo');
const partes = (dir, ext) =>
  fs
    .readdirSync(path.join(proto, dir))
    .filter((f) => f.endsWith(ext))
    .sort();
const ler = (dir, f) => fs.readFileSync(path.join(proto, dir, f), 'utf8');

export function montarJs() {
  let out =
    '/* ETAL Connect · app do participante.\n' +
    '   GERADO por scripts/app/montar-app.mjs a partir de prototipo/app/ (um arquivo por assunto): não editar aqui. */\n' +
    '(() => {\n' +
    "  'use strict';\n";
  for (const f of partes('app', '.js')) out += `\n/* ===== app/${f} ===== */\n` + ler('app', f);
  return out + '})();\n';
}

const SAIDAS = [
  ['app.js', montarJs],
];

if (process.argv[1] === new URL(import.meta.url).pathname) {
  let ok = true;
  for (const [nome, montar] of SAIDAS) {
    const novo = montar();
    const alvo = path.join(proto, nome);
    if (process.argv.includes('--verificar')) {
      const atual = fs.existsSync(alvo) ? fs.readFileSync(alvo, 'utf8') : '';
      if (atual !== novo) {
        console.error(`prototipo/${nome} está desatualizado: rode npm run app`);
        ok = false;
      }
    } else if (!fs.existsSync(alvo) || fs.readFileSync(alvo, 'utf8') !== novo) {
      fs.writeFileSync(alvo, novo);
      console.log(`prototipo/${nome}: ${novo.split('\n').length} linhas`);
    }
  }
  if (!ok) process.exit(1);
  if (process.argv.includes('--verificar')) console.log('prototipo/app.js em dia');
}
