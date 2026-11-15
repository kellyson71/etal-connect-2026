"""SUAP de mentira, só para o teste de carga: responde como a API do SUAP no login com senha, com um atraso parecido
com o de verdade. Nunca use senha real aqui: a senha aceita é a palavra "certa".

    SUAP_ATRASO=0.8 backend/.venv/bin/uvicorn suap_falso:app --app-dir scripts/carga --port 8099

SUAP_ATRASO: atraso médio de cada chamada, em segundos (cada login faz duas: token e perfil). Varia de 50% a 150%.
"""
import asyncio
import os
import random

from fastapi import FastAPI, HTTPException, Request

app = FastAPI()
ATRASO = float(os.environ.get('SUAP_ATRASO', '0.8'))


async def esperar():
    await asyncio.sleep(ATRASO * random.uniform(0.5, 1.5))


@app.post('/api/token/pair')
async def token(request: Request):
    d = await request.json()
    await esperar()
    if d.get('password') != 'certa':
        raise HTTPException(401)
    return {'access': d['username'], 'refresh': 'x'}


@app.get('/api/rh/eu/')
async def eu(request: Request):
    await esperar()
    matricula = request.headers.get('authorization', '').removeprefix('Bearer ')
    return {'identificacao': matricula, 'nome_usual': f'Pessoa {matricula[-4:]}', 'email': None,
            'campus': 'Pau dos Ferros', 'url_foto_150x200': ''}
