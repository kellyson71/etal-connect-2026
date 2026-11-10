"""Renderização das referências textuais e dos contratos extraídos do código."""
from html import escape
import json
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
EVIDENCIA = json.loads((ROOT / 'docs/assets/evidencias.json').read_text())

def screenshot(file, alt, url='', extra=''):
    return f'<figure class="reference-image"><button data-zoom aria-label="Ampliar imagem"><img src="{{assets}}/{file}" alt="{escape(alt)}"></button></figure>'

def inline(text):
    text = escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text


def markdown(text):
    """Subset usado nas referências: títulos, parágrafos, listas, tabelas e código."""
    lines, out, index = text.splitlines(), [], 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith('```'):
            code = []
            index += 1
            while index < len(lines) and not lines[index].startswith('```'):
                code.append(lines[index]); index += 1
            out.append('<pre><code>' + escape('\n'.join(code)) + '</code></pre>')
        elif line.startswith('#'):
            match = re.match(r'(#{1,6})\s+(.*)', line)
            level, title = len(match[1]), match[2]
            out.append(f'<h{level}>{inline(title)}</h{level}>')
        elif line.startswith('|'):
            rows = []
            while index < len(lines) and lines[index].startswith('|'):
                row = [cell.strip() for cell in lines[index].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\- ]+', cell) for cell in row):
                    rows.append(row)
                index += 1
            out.append('<div class="table-scroll"><table><thead><tr>' + ''.join('<th>' + inline(c) + '</th>' for c in rows[0]) + '</tr></thead><tbody>')
            out.extend('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in row) + '</tr>' for row in rows[1:])
            out.append('</tbody></table></div>')
            continue
        elif re.match(r'^(- |\d+\. )', line):
            ordered = line[0].isdigit()
            tag = 'ol' if ordered else 'ul'
            items = []
            while index < len(lines) and re.match(r'^(- |\d+\. )', lines[index]):
                items.append('<li>' + inline(re.sub(r'^(- |\d+\. )', '', lines[index])) + '</li>')
                index += 1
            out.append(f'<{tag}>' + ''.join(items) + f'</{tag}>')
            continue
        else:
            paragraph = [line]
            while index + 1 < len(lines) and lines[index + 1].strip() and not re.match(r'^(#|```|\||- |\d+\. )', lines[index + 1]):
                index += 1; paragraph.append(lines[index])
            out.append('<p>' + inline(' '.join(paragraph)) + '</p>')
        index += 1
    return '\n'.join(out)


def reference(root):
    out = ['<section class="reference" id="referencias"><h2>Referências para continuar.</h2><p>O detalhe técnico fica aqui. As tabelas de banco e de rotas são extraídas do código, sem redesenhar o contrato à mão.</p>']
    for path in sorted((ROOT / 'docs/tecnico').glob('[0-9][0-9]-*.md')):
        title = path.read_text().splitlines()[0].lstrip('# ')
        body = markdown(path.read_text())
        body = re.sub(r'href="([0-9]{2}-[^"/]+)\.md"', r'href="#ref-\1"', body)
        body = body.replace('href="../../', f'href="{root}')
        body = body.replace('href="../', f'href="{root}docs/')
        out.append(f'<details id="ref-{path.stem}"><summary>{escape(title)}</summary><div class="reference-body">{body}<p><a class="source-link" href="{root}docs/tecnico/{path.name}">Fonte Markdown ↗</a></p></div></details>')
    out.append('<h2 id="schema">Dicionário do banco</h2><p>Extraído de backend/app/modelos.py. Campos, tipos, nulabilidade e restrições do modelo SQLAlchemy.</p>')
    for table in EVIDENCIA['tabelas']:
        rows = []
        for field in table['campos']:
            constraints = (['PK'] if field['pk'] else []) + (['único'] if field['unico'] else []) + [f'FK → {fk}' for fk in field['fk']]
            rows.append('<tr>' + ''.join(f'<td>{escape(str(v))}</td>' for v in [field['nome'], field['tipo'], 'sim' if field['nulo'] else 'não', '; '.join(constraints) or '—']) + '</tr>')
        unique = '; '.join(' + '.join(pair) for pair in table['unicos'])
        unique_note = f'<p>Unicidade: <code>{escape(unique)}</code>.</p>' if unique else ''
        out.append(f'<details id="schema-{table["nome"]}"><summary>{table["nome"]} · {len(table["campos"])} campos</summary><div class="reference-body"><div class="table-scroll"><table><thead><tr><th>Campo</th><th>Tipo</th><th>Aceita nulo</th><th>Restrição / referência</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div>{unique_note}</div></details>')
    rows = []
    for path, methods in EVIDENCIA['openapi']['paths'].items():
        for method, operation in methods.items():
            if method not in {'get', 'post', 'put', 'patch', 'delete'}:
                continue
            rows.append(f'<tr><td><span class="http {method}">{method.upper()}</span></td><td><code>{escape(path)}</code></td><td>{escape(", ".join(operation.get("tags", [])))}</td><td>{escape(operation.get("summary", ""))}</td></tr>')
    out.append('<details id="rotas"><summary>Rotas extraídas do OpenAPI</summary><div class="reference-body"><div class="table-scroll"><table><thead><tr><th>Método</th><th>Caminho</th><th>Grupo</th><th>Operação</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></div><p><code>GET /q/{token}</code> redireciona para o app e fica fora do esquema OpenAPI.</p></div></details>')
    out.append('<details><summary>Contrato de presença no Swagger · captura</summary><div class="reference-body">' + screenshot('swagger-presenca.png','Contrato POST /api/presenca no Swagger') + '</div></details>')
    out.append(f'<div class="doc-links"><a href="{root}docs/ETAL-Connect-documentacao.pdf">Baixar apresentação em PDF</a><a href="{root}docs/contexto.html">Contexto</a><a href="{root}docs/mapas.html">Regras da planta</a><a href="{root}docs/PLANO_TECNICO.md">Plano técnico</a><a href="{root}docs/programacao-referencia.html">Referência de 2025</a><a href="{root}docs/assets/evidencias.json">Esquema capturado</a></div><p class="caption">Documentação independente; não constitui registro oficial do IFRN, SUAP, NADIC ou ETAL. Capturas locais em {EVIDENCIA["capturado_em"]}; sem credenciais ou dados de participantes reais.</p></section>')
    return '\n'.join(out)

