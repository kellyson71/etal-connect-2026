"""Limites de requisições, em memória (a API roda com um processo só).

No Wi-Fi do campus centenas de pessoas saem pelo mesmo IP público: por isso o IP só tem um teto alto, contra abuso,
e o limite que protege de verdade é por pessoa (matrícula, e-mail ou sessão)."""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hist: dict[tuple[str, str], deque] = defaultdict(deque)


def ip_de(request: Request) -> str:
    return request.headers.get('x-forwarded-for', '').split(',')[0].strip() or (request.client.host if request.client else '?')


def contar(nome: str, chave: str, limite: int, janela: float = 60, msg: str = 'Muitas tentativas. Espere um minuto.') -> None:
    """Conta mais uma ocorrência de (nome, chave) e recusa com 429 se passar de `limite` na `janela` (segundos)."""
    q = _hist[(nome, chave)]
    t = time.monotonic()
    while q and t - q[0] > janela:
        q.popleft()
    if len(q) >= limite:
        raise HTTPException(429, msg, headers={'Retry-After': str(int(janela - (t - q[0])) + 1)})
    q.append(t)


def limitar(nome: str, por_minuto: int):
    """Dependência: teto por IP (alto, contra abuso; o limite por pessoa fica na rota)."""
    def dep(request: Request):
        contar(nome, ip_de(request), por_minuto, msg='Muitas requisições desta rede. Espere um minuto.')
    return dep
