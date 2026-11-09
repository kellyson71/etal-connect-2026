"""Junta docs/tecnico/*.md num HTML só, com os diagramas Mermaid desenhados. Uso: python3 scripts/gerar-docs-html.py [saida.html]"""
import html
import json
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1] / 'docs' / 'tecnico'
saida = Path(sys.argv[1]) if len(sys.argv) > 1 else DOCS / 'documentacao-tecnica.html'
arquivos = [DOCS / 'README.md'] + sorted(p for p in DOCS.glob('[0-9][0-9]-*.md'))
secoes = []
for p in arquivos:
    texto = p.read_text()
    titulo = next((ln.lstrip('# ').strip() for ln in texto.splitlines() if ln.startswith('#')), p.stem)
    secoes.append({'id': p.stem, 'titulo': titulo, 'md': texto})

pagina = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Documentação técnica · ETAL Connect</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geologica:wght@600;700&family=Onest:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap">
<style>
:root{--bg:#f4f6fb;--card:#fff;--ink:#1f2f57;--ink-2:#3d4b6b;--muted:#66738f;--line:#e2e7f0;--brand:#2453c9;--code:#eef2fa;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1524;--card:#161e36;--ink:#e6ebf7;--ink-2:#c3cbe0;--muted:#8d98b5;--line:#28324f;--brand:#7aa2ff;--code:#1d2746;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Onest,system-ui,sans-serif}
.wrap{display:grid;grid-template-columns:260px minmax(0,1fr);max-width:1240px;margin:0 auto}
nav{position:sticky;top:0;height:100vh;overflow:auto;padding:28px 18px;border-right:1px solid var(--line)}
nav b{display:block;font:700 18px Geologica,sans-serif;margin-bottom:14px}nav a{display:block;color:var(--ink-2);text-decoration:none;padding:6px 10px;border-radius:8px;font-size:14px}
nav a:hover,nav a.on{background:var(--code);color:var(--brand)}
main{padding:28px 40px 80px;min-width:0}section{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px 32px 28px;margin-bottom:24px}
h1,h2,h3,h4{font-family:Geologica,sans-serif;line-height:1.25}h1{font-size:28px}h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin-top:26px}
a{color:var(--brand)}code{font:13.5px 'JetBrains Mono',monospace;background:var(--code);padding:1px 5px;border-radius:5px}
pre{background:var(--code);padding:14px 16px;border-radius:10px;overflow:auto}pre code{padding:0;background:none}
table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;display:block;overflow-x:auto}th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}th{background:var(--code)}
.mermaid{background:#fff;border-radius:10px;padding:12px;margin:14px 0;text-align:center;overflow:auto}
blockquote{margin:12px 0;padding:4px 16px;border-left:3px solid var(--brand);color:var(--ink-2)}
@media (max-width:820px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto;border:0;padding:16px}main{padding:0 16px 48px}section{padding:4px 16px 20px}}
@media print{nav{display:none}.wrap{display:block}section{break-after:page;border:0}}
</style></head><body><div class="wrap"><nav><b>ETAL Connect</b>__NAV__</nav><main id="docs"></main></div>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<script>
const SECOES = __DADOS__;
const ids = new Set(SECOES.map((s) => s.id));
const main = document.getElementById('docs');
SECOES.forEach((s) => {
  const el = document.createElement('section'); el.id = s.id;
  el.innerHTML = marked.parse(s.md);
  el.querySelectorAll('code.language-mermaid').forEach((c) => { const d = document.createElement('div'); d.className = 'mermaid'; d.textContent = c.textContent; c.parentElement.replaceWith(d); });
  el.querySelectorAll('a[href$=".md"]').forEach((a) => { const id = a.getAttribute('href').replace(/^.*\\//, '').replace(/\\.md$/, ''); if (ids.has(id)) a.href = '#' + id; });
  main.appendChild(el);
});
mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });
mermaid.run({ querySelector: '.mermaid' });
</script></body></html>"""
nav = ''.join(f'<a href="#{s["id"]}">{html.escape(s["titulo"])}</a>' for s in secoes)
dados = json.dumps(secoes, ensure_ascii=False).replace('</', '<\\/')
saida.write_text(pagina.replace('__NAV__', nav).replace('__DADOS__', dados))
print(f'{saida}: {len(secoes)} documentos')
