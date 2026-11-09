"""Aplicação FastAPI. Em produção, o Caddy serve o app (prototipo/) e encaminha /api e /q para cá."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .config import config
from .db import criar_tabelas
from .rotas import auth, eu, homologacao, org, publico
from .seguranca import publica


@asynccontextmanager
async def ciclo(_app: FastAPI):
    criar_tabelas()
    yield


app = FastAPI(title='ETAL Connect', version='0.3.0', lifespan=ciclo, docs_url='/api/docs', openapi_url='/api/openapi.json')
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in config().origens.split(',') if o.strip()],
                   allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
for r in (auth.rota, eu.rota, publico.rota, org.rota, homologacao.rota):
    app.include_router(r)


@app.get('/q/{token}', include_in_schema=False)
def qr_aberto_na_camera(token: str, request: Request):
    """QR lido pela câmera do celular, fora do app: abre o app, que registra a presença."""
    return RedirectResponse(f'{publica(request)}/?qr={token}', 302)
