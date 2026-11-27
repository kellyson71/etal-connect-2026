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


def _limpar(q: deque, janela: float, t: float) -> None:
    while q and t - q[0] > janela:
        q.popleft()


def barrar_se_passou(nome: str, chave: str, limite: int, janela: float = 60, msg: str = 'Muitas tentativas. Espere um minuto.') -> None:
    """Recusa com 429 se (nome, chave) já tem `limite` ocorrências na janela, sem contar esta. As ocorrências são
    anotadas à parte com anotar() (por exemplo, só as senhas erradas)."""
    q = _hist[(nome, chave)]
    t = time.monotonic()
    _limpar(q, janela, t)
    if len(q) >= limite:
        raise HTTPException(429, msg, headers={'Retry-After': str(int(janela - (t - q[0])) + 1)})


def anotar(nome: str, chave: str) -> None:
    _hist[(nome, chave)].append(time.monotonic())


def limitar(nome: str, por_minuto: int | None = None):
    """Dependência: teto por IP (alto, contra abuso; o limite por pessoa fica na rota). Sem número, usa
    ETAL_TETO_REDE: o Wi-Fi do campus põe centenas de pessoas atrás de um IP só."""
    def dep(request: Request):
        from .config import config
        contar(nome, ip_de(request), por_minuto or config().teto_rede, msg='Muitas requisições desta rede. Espere um minuto.')
    return dep
