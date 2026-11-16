"""Aplicação FastAPI. Em produção, o Caddy serve o app (prototipo/) e encaminha /api e /q para cá."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .config import config
from . import documentacao
from .db import migrar
from .monitor import Monitor
from .rotas import auth, contingencia, eu, homologacao, org, publicacoes, publico, suap
from .seguranca import publica


@asynccontextmanager
async def ciclo(_app: FastAPI):
    import anyio.to_thread
    anyio.to_thread.current_default_thread_limiter().total_tokens = config().threads
    migrar()
    yield


app = FastAPI(title='ETAL Connect', version='0.5.0', description=documentacao.introducao(), openapi_tags=documentacao.TAGS, lifespan=ciclo, docs_url='/api/docs', openapi_url='/api/openapi.json', swagger_ui_parameters={'deepLinking':True,'displayRequestDuration':True,'defaultModelsExpandDepth':0,'filter':True,'docExpansion':'list','withCredentials':True})
app.add_middleware(Monitor)
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in config().origens.split(',') if o.strip()],
                   allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
for r in (auth.rota, eu.rota, publico.rota, publicacoes.rota, org.rota, contingencia.rota, homologacao.rota, suap.rota):
    documentacao.aplicar(r)
    app.include_router(r)


@app.get('/q/{token}', include_in_schema=False)
def qr_aberto_na_camera(token: str, request: Request):
    """QR lido pela câmera do celular, fora do app: abre o app, que registra a presença."""
    return RedirectResponse(f'{publica(request)}/?qr={token}', 302)
