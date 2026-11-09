"""Limite simples de requisições por IP (em memória), para login e presença."""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hist: dict[tuple[str, str], deque] = defaultdict(deque)


def limitar(nome: str, por_minuto: int):
    def dep(request: Request):
        ip = request.headers.get('x-forwarded-for', '').split(',')[0].strip() or (request.client.host if request.client else '?')
        q = _hist[(nome, ip)]
        t = time.monotonic()
        while q and t - q[0] > 60:
            q.popleft()
        if len(q) >= por_minuto:
            raise HTTPException(429, 'Muitas tentativas. Espere um minuto.')
        q.append(t)
    return dep
