"""Teto de chamadas simultâneas ao SUAP (login com senha, retorno do OAuth2 e portal).

Na abertura do evento muita gente entra ao mesmo tempo. Em vez de mandar tudo de uma vez ao SUAP, no máximo
ETAL_SUAP_SIMULTANEOS chamadas correm juntas; as outras esperam a vez (sem ocupar as threads que atendem o resto da
API) por até ETAL_SUAP_ESPERA segundos. Passado isso, a resposta é 503 com Retry-After, e o app tenta de novo sozinho.
Vale para um processo (a API roda com um só)."""
import asyncio
from contextlib import asynccontextmanager

from fastapi import HTTPException

from .config import config

_sem: asyncio.Semaphore | None = None
_laco: asyncio.AbstractEventLoop | None = None
esperando = 0


def _semaforo() -> asyncio.Semaphore:
    global _sem, _laco
    laco = asyncio.get_running_loop()
    if _sem is None or _laco is not laco:
        _sem, _laco = asyncio.Semaphore(max(1, config().suap_simultaneos)), laco
    return _sem


@asynccontextmanager
async def vez_no_suap():
    global esperando
    sem = _semaforo()
    esperando += 1
    try:
        await asyncio.wait_for(sem.acquire(), timeout=config().suap_espera)
    except TimeoutError:
        raise HTTPException(503, 'Muita gente entrando agora. O app tenta de novo em instantes.',
                            headers={'Retry-After': '4'}) from None
    finally:
        esperando -= 1
    try:
        yield
    finally:
        sem.release()
