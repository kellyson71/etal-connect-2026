"""Registro de cada requisição e números do servidor, para acompanhar o evento.

- Uma linha JSON por requisição na saída padrão (o Docker guarda, com rodízio; ver deploy/docker-compose.yml):
  hora, método, rota, situação e tempo até a resposta começar. A rota vai como modelo (/api/publicacoes/{pid}), sem o
  caminho real nem a query: tokens de QR e de links de entrada não aparecem no log. Também não vão IP, matrícula,
  nome nem nada da pessoa.
- Erro do servidor (5xx) vai junto com o rastro do erro, para achar a causa.
- Os últimos 10 minutos ficam na memória para GET /api/org/sistema (painel da organização → Servidor): requisições
  por minuto, tempos (mediana, p95, p99), erros, limites batendo, fila do SUAP, conexões ao vivo e do banco.
"""
import json
import logging
import resource
import sys
import time
from collections import Counter, deque
from datetime import datetime

log = logging.getLogger('etal')
_JANELA = 600  # segundos guardados para os números
_reqs: deque = deque(maxlen=400_000)  # (instante, rota, situação, ms)
_inicio = time.time()
_andamento = {'n': 0}
# respostas que significam "a pessoa entrou" (o retorno do OAuth2 redireciona também nos erros: conta aproximada)
_ENTROU = {('/api/auth/suap/senha', 200), ('/api/auth/suap/retorno', 302), ('/api/auth/link', 302), ('/api/auth/dev', 200)}


def _configurar_log() -> None:
    if log.handlers:
        return
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(logging.Formatter('%(message)s'))
    log.addHandler(h)
    log.setLevel(logging.INFO)
    log.propagate = False


def _rota(scope) -> str:
    r = scope.get('route')
    if r is not None and getattr(r, 'path', None):
        return r.path
    caminho = scope.get('path', '')
    return 'sem-rota' if caminho.startswith('/api') else 'arquivo'


class Monitor:
    """Middleware ASGI (não atrapalha o SSE: o tempo medido é até a resposta começar)."""

    def __init__(self, app):
        self.app = app
        _configurar_log()

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        t0 = time.perf_counter()
        info = {'status': 500, 'ms': None}

        async def enviar(msg):
            if msg['type'] == 'http.response.start':
                info['status'] = msg['status']
                info['ms'] = (time.perf_counter() - t0) * 1000
            await send(msg)

        _andamento['n'] += 1
        erro = None
        try:
            await self.app(scope, receive, enviar)
        except Exception as e:  # o Starlette responde 500; aqui só registra
            erro = e
            raise
        finally:
            _andamento['n'] -= 1
            ms = info['ms'] if info['ms'] is not None else (time.perf_counter() - t0) * 1000
            rota = _rota(scope)
            _reqs.append((time.monotonic(), rota, info['status'], ms))
            if rota != '/api/saude':
                linha = json.dumps({'em': datetime.now().isoformat(timespec='seconds'), 'metodo': scope.get('method'),
                                    'rota': rota, 'status': info['status'] if not erro else 500, 'ms': round(ms, 1)},
                                   ensure_ascii=False)
                if erro is not None:
                    log.error(linha, exc_info=erro)
                elif info['status'] >= 500:
                    log.error(linha)
                else:
                    log.info(linha)


def _pct(valores: list[float], p: float) -> float | None:
    if not valores:
        return None
    v = sorted(valores)
    return round(v[min(len(v) - 1, int(len(v) * p))], 1)


def numeros() -> dict:
    """Resumo dos últimos 10 minutos e do processo."""
    agora = time.monotonic()
    while _reqs and agora - _reqs[0][0] > _JANELA:
        _reqs.popleft()
    todas = list(_reqs)
    ultimo = [r for r in todas if agora - r[0] <= 60]
    tempos = [r[3] for r in todas if r[1] != '/api/ao-vivo']
    por_rota: dict[str, list[float]] = {}
    for _, rota, _, ms in todas:
        if rota != '/api/ao-vivo':
            por_rota.setdefault(rota, []).append(ms)
    lentas = sorted(({'rota': k, 'n': len(v), 'p95_ms': _pct(v, .95)} for k, v in por_rota.items() if len(v) >= 5),
                    key=lambda x: -x['p95_ms'])[:5]
    situacoes = Counter(r[2] for r in todas)
    entradas = sum(1 for r in todas if (r[1], r[2]) in _ENTROU)
    por_minuto = Counter(int((agora - r[0]) // 60) for r in todas)
    return {
        'janela_min': _JANELA // 60,
        'requisicoes': {
            'ultimo_minuto': len(ultimo),
            'por_minuto': [por_minuto.get(i, 0) for i in range(_JANELA // 60)],  # [agora, 1 min atrás, ...]
            'em_andamento': _andamento['n'],
            'mediana_ms': _pct(tempos, .5), 'p95_ms': _pct(tempos, .95), 'p99_ms': _pct(tempos, .99),
            'erros_5xx': sum(n for s, n in situacoes.items() if s >= 500 and s != 503),  # 503 é a fila do SUAP
            'limites_429': situacoes.get(429, 0),
            'fila_cheia_503': situacoes.get(503, 0),
            'sem_sessao_401': situacoes.get(401, 0),
            'mais_lentas': lentas,
            'entradas': entradas,
        },
        'processo': {
            'no_ar_min': round((time.time() - _inicio) / 60, 1),
            'memoria_pico_mb': round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 1),
        },
    }
