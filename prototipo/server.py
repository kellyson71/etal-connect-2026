#!/usr/bin/env python3
"""Servidor local do protótipo: entrega os arquivos e simula o login com o SUAP via suapy.

A senha só passa pela memória deste processo durante o login: não é gravada nem registrada.
O navegador recebe apenas os campos que a interface usa (sem CPF, e-mail ou tokens).
Uso: .venv/bin/python server.py   (porta padrão 8770; mude com PORT=...)
Com ETAL_API=http://127.0.0.1:8011 o app usa a API de verdade (backend/) em vez dos dados de exemplo.
"""
import base64
import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from suapy import Suap, SuapAuthError, SuapError

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get('PORT', '8770'))
HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
# REDE=<ip> libera o acesso pela rede local, só para esse endereço. Sem HTTPS: usar apenas em rede de confiança.
REDE = os.environ.get('REDE', '').strip()
if REDE:
    HOSTS.add(f'{REDE}:{PORT}')
# HTTPS=1 (com REDE): serve em HTTPS com o certificado de prototipo/.certs/ (rodar.sh gera com mkcert). O celular só
# libera a câmera do leitor de QR em HTTPS; o certificado é local, então o navegador avisa uma vez e é preciso aceitar.
HTTPS = os.environ.get('HTTPS', '') == '1'
ESQUEMA = 'https' if HTTPS else 'http'
API = os.environ.get('ETAL_API', '').strip().rstrip('/')
TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
         '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
         '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json'}
PUBLIC = {'index.html', 'homologacao.html', 'homologacao.js', 'qrs.html', 'vendor/qrcode.js', 'vendor/jsQR.js', 'config.js', 'api.js', 'admin.html', 'admin.js', 'admin.css', 'app.js', 'app.css', 'data.js', 'plan-data.js', 'campus-data.js', 'campus-fundo.js', 'campus-limpo.js', 'campus-entorno.js', 'campus-verde.js', 'sprites.js', 'campus3d.js', 'sw.js', 'manifest.webmanifest', 'admin.html', 'admin.js', 'admin.css'}
PREFIXES = ('Tecnologia em ', 'Técnico Integrado em ', 'Técnico Subsequente em ', 'Técnico em ', 'Bacharelado em ', 'Licenciatura em ')
CAMPUS = {'PF': 'Campus Pau dos Ferros'}


def photo_data_uri(url):
    """Baixa a foto do perfil e devolve data URI, só de hosts do SUAP e com limite de tamanho."""
    if not url or not url.startswith(('https://suap.ifrn.edu.br/', 'https://cdn.suap.ifrn.edu.br/')):
        return None
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'etal-connect-prototipo'})
        with urllib.request.urlopen(req, timeout=12) as r:
            kind = r.headers.get_content_type()
            data = r.read(1_500_001)
        if not kind.startswith('image/') or len(data) > 1_500_000:
            return None
        return f'data:{kind};base64,{base64.b64encode(data).decode()}'
    except OSError:
        return None


def consultar(matricula, senha):
    with Suap() as suap:
        suap.login(matricula, senha)
        perfil = suap.obter_perfil()
        vinculo = perfil.vinculo_aluno_ativo
        try:
            dados = suap.ensino.obter_dados_aluno() or {}
        except SuapError:
            dados = {}
    nome = ' '.join(p if p.lower() in ('de', 'da', 'do', 'das', 'dos', 'e') else p[:1].upper() + p[1:] for p in (perfil.nome or matricula).split())
    partes = nome.split()
    curso = (vinculo.curso if vinculo else '') or dados.get('curso') or 'Sem curso informado'
    curto = curso
    for prefixo in PREFIXES:
        if curto.startswith(prefixo):
            curto = curto[len(prefixo):]
            break
    periodo = dados.get('periodo_referencia')
    return {
        'name': nome,
        'first': partes[0],
        'initials': (partes[0][0] + (partes[-1][0] if len(partes) > 1 else '')).upper(),
        'course': curto,
        'courseFull': curso,
        'year': f'{periodo}º período' if periodo else (perfil.tipo_usuario or ''),
        'campus': CAMPUS.get(perfil.campus, perfil.campus or ''),
        'id': perfil.matricula or matricula,
        'photo': photo_data_uri(perfil.foto),
        'source': 'suap',
    }


class Handler(BaseHTTPRequestHandler):
    server_version = 'etal-prototipo'
    sys_version = ''

    def log_message(self, fmt, *args):
        print(f'{self.command} {self.path.split("?")[0]} {args[1] if len(args) > 1 else ""}')

    def _send(self, code, body, kind):
        self.send_response(code)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code, data):
        self._send(code, json.dumps(data, ensure_ascii=False).encode(), 'application/json; charset=utf-8')

    def _host_ok(self):
        # Bloqueia DNS rebinding e chamadas de outros sites ao servidor local.
        origin = self.headers.get('Origin')
        host = self.headers.get('Host', '')
        return host in HOSTS and (origin is None or origin == f'{ESQUEMA}://{host}')

    def do_GET(self):
        if self.headers.get('Host', '') not in HOSTS:
            return self._json(403, {'erro': 'Host não permitido.'})
        rel = self.path.split('?')[0].lstrip('/') or 'index.html'
        rel = {'demo': 'index.html', 'homologacao': 'homologacao.html'}.get(rel.rstrip('/'), rel)
        is_asset = rel.startswith('assets/') and '..' not in rel and Path(rel).suffix in ('.svg', '.png', '.jpg', '.webp')
        if rel == 'mapa3d/': rel = 'mapa3d/index.html'
        is_map = rel.startswith('mapa3d/') and '..' not in rel and Path(rel).suffix in ('.html', '.js', '.css', '.glb')
        file = ROOT / rel
        if rel == 'config.js' and API:
            return self._send(200, f"window.ETAL_CONFIG = {{ api: {json.dumps(API)} }};".encode(), TYPES['.js'])
        if (rel in PUBLIC or is_asset or is_map) and file.is_file():
            return self._send(200, file.read_bytes(), TYPES[file.suffix])
        self._json(404, {'erro': 'Não encontrado.'})

    def do_POST(self):
        if self.path != '/api/login' or not self._host_ok():
            return self._json(403, {'erro': 'Requisição não permitida.'})
        if self.headers.get_content_type() != 'application/json':
            return self._json(415, {'erro': 'Envie JSON.'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 4096:
                raise ValueError
            body = json.loads(self.rfile.read(size))
            matricula, senha = str(body['matricula']).strip(), str(body['senha'])
        except (ValueError, KeyError, TypeError):
            return self._json(400, {'erro': 'Informe matrícula e senha.'})
        try:
            self._json(200, {'perfil': consultar(matricula, senha)})
        except SuapAuthError:
            self._json(401, {'erro': 'Matrícula ou senha incorretas.'})
        except (SuapError, OSError):
            self._json(502, {'erro': 'O SUAP não respondeu. Tente de novo.'})
        except Exception as erro:  # resposta inesperada do SUAP: avisa em vez de derrubar a conexão (sem registrar dados)
            print(f'login: erro inesperado {type(erro).__name__}')
            self._json(502, {'erro': 'O SUAP respondeu de um jeito inesperado. Tente de novo ou entre como visitante.'})


if __name__ == '__main__':
    srv = ThreadingHTTPServer(('0.0.0.0' if REDE else '127.0.0.1', PORT), Handler)
    if HTTPS:
        import ssl
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(ROOT / '.certs/rede.pem', ROOT / '.certs/rede-key.pem')
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    print(f'ETAL Connect em {ESQUEMA}://{REDE or "127.0.0.1"}:{PORT}', flush=True)
    srv.serve_forever()
