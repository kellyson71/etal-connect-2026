"""Avisos, trocas de sala e lotação em tempo real por SSE. Um processo só (uvicorn com 1 worker);
para mais de um, trocar por PostgreSQL LISTEN/NOTIFY ou Redis."""
import asyncio
import json


class Canal:
    def __init__(self) -> None:
        self.ouvintes: set[asyncio.Queue] = set()

    def entrar(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self.ouvintes.add(q)
        return q

    def sair(self, q: asyncio.Queue) -> None:
        self.ouvintes.discard(q)

    def publicar(self, tipo: str, dados: dict) -> None:
        msg = f'event: {tipo}\ndata: {json.dumps(dados, ensure_ascii=False, default=str)}\n\n'
        for q in list(self.ouvintes):
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                self.ouvintes.discard(q)


canal = Canal()
