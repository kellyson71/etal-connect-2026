"""Entrada: SUAP (OAuth2), visitante por link no e-mail e, só em desenvolvimento, entrada sem senha."""
import secrets
import smtplib
from datetime import timedelta
from email.message import EmailMessage
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import config
from ..db import sessao
from ..limite import limitar
from ..modelos import LinkAcesso, Pessoa
from ..seguranca import abrir_sessao, agora, eh_organizacao, fechar_sessao, hash_token, novo_token, publica

rota = APIRouter(prefix='/api/auth', tags=['entrada'])
ESTADO = 'etal_oauth_estado'


def _papel(matricula, email) -> str:
    return 'organizacao' if eh_organizacao(matricula, email) else 'participante'


@rota.get('/suap')
def suap_inicio(request: Request):
    c = config()
    if not c.suap_client_id:
        return RedirectResponse(f'{publica(request)}/?login=suap-indisponivel', 302)
    estado = secrets.token_urlsafe(24)
    q = urlencode({'response_type': 'code', 'client_id': c.suap_client_id, 'scope': c.suap_escopo,
                   'redirect_uri': f'{publica(request)}/api/auth/suap/retorno', 'state': estado})
    resp = RedirectResponse(f'{c.suap_authorize_url}?{q}', 302)
    resp.set_cookie(ESTADO, estado, max_age=600, httponly=True, secure=c.cookie_seguro, samesite='lax', path='/api/auth')
    return resp


_MINUSCULAS = {'de', 'da', 'do', 'das', 'dos', 'e'}


def _nome_bonito(nome: str) -> str:
    """O SUAP às vezes devolve o nome usual em minúsculas ("kellyson Silva"): sobe a primeira letra de cada parte."""
    return ' '.join(w if w in _MINUSCULAS or not w[:1].islower() else w[:1].upper() + w[1:] for w in str(nome).split())


def _pessoa_suap(d: dict, db: Session) -> Pessoa | None:
    """Cria ou atualiza a pessoa a partir dos dados do SUAP (OAuth2 /api/eu/ ou /api/rh/eu/ do JWT)."""
    matricula = str(d.get('identificacao') or d.get('matricula') or '').strip()
    if not matricula:
        return None
    email = (d.get('email') or d.get('email_academico') or d.get('email_preferencial') or '').lower() or None
    p = db.scalar(select(Pessoa).where(Pessoa.matricula == matricula))
    if not p:
        p = Pessoa(tipo='suap', matricula=matricula)
        db.add(p)
    p.nome = _nome_bonito(d.get('nome_usual') or d.get('nome') or matricula)
    p.email = p.email or (email if email and not db.scalar(select(Pessoa).where(Pessoa.email == email, Pessoa.id != p.id)) else None)
    p.campus = d.get('campus') or p.campus
    foto = d.get('foto') or d.get('url_foto_150x200') or ''
    if foto.startswith('/'):
        foto = 'https://suap.ifrn.edu.br' + foto
    p.foto_url = foto or p.foto_url
    p.papel = _papel(matricula, email)
    db.commit()
    return p


@rota.get('/suap/retorno')
def suap_retorno(request: Request, code: str = '', state: str = '', db: Session = Depends(sessao)):
    c = config()
    if not code or not state or state != request.cookies.get(ESTADO):
        return RedirectResponse(f'{publica(request)}/?login=erro', 302)
    try:
        with httpx.Client(timeout=15) as h:
            tok = h.post(c.suap_token_url, data={'grant_type': 'authorization_code', 'code': code,
                                                 'redirect_uri': f'{publica(request)}/api/auth/suap/retorno',
                                                 'client_id': c.suap_client_id, 'client_secret': c.suap_client_secret})
            tok.raise_for_status()
            cab = {'Authorization': f'Bearer {tok.json()["access_token"]}'}
            eu = h.get(c.suap_userinfo_url, headers=cab)
            if eu.status_code == 404:  # versões novas do SUAP: /api/rh/eu/
                eu = h.get(f'{c.suap_api_url.rstrip("/")}/api/rh/eu/', headers=cab)
            eu.raise_for_status()
            d = eu.json()
    except (httpx.HTTPError, KeyError, ValueError) as erro:
        print(f'login SUAP falhou: {erro!r}', flush=True)  # aparece nos logs da hospedagem
        return RedirectResponse(f'{publica(request)}/?login=suap-indisponivel', 302)
    p = _pessoa_suap(d, db)
    if not p:
        return RedirectResponse(f'{publica(request)}/?login=erro', 302)
    resp = RedirectResponse(f'{publica(request)}/?login=ok', 302)
    resp.delete_cookie(ESTADO, path='/api/auth')
    abrir_sessao(resp, p)
    return resp


class LoginSuap(BaseModel):
    matricula: str = Field(min_length=3, max_length=40)
    senha: str = Field(min_length=1, max_length=200)


@rota.post('/suap/senha', dependencies=[Depends(limitar('suap-senha', 8))])
def suap_senha(l: LoginSuap, response: Response, db: Session = Depends(sessao)):
    """Entrada direta com matrícula e senha: pede o token JWT à API do SUAP e lê o perfil.
    A senha e os tokens só passam por aqui; nada é guardado."""
    base = config().suap_api_url.rstrip('/')
    try:
        with httpx.Client(timeout=20) as h:
            tok = h.post(f'{base}/api/token/pair', json={'username': l.matricula.strip(), 'password': l.senha})
            if tok.status_code in (400, 401, 403):
                raise HTTPException(401, 'Matrícula ou senha incorreta.')
            tok.raise_for_status()
            eu = h.get(f'{base}/api/rh/eu/', headers={'Authorization': f'Bearer {tok.json()["access"]}'})
            eu.raise_for_status()
            d = eu.json()
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError) as erro:
        print(f'login SUAP (senha) falhou: {erro!r}', flush=True)
        raise HTTPException(503, 'O SUAP não respondeu. Tente de novo em instantes.') from None
    p = _pessoa_suap(d, db)
    if not p:
        raise HTTPException(502, 'O SUAP não informou a matrícula.')
    abrir_sessao(response, p)
    return {'ok': True}


class Visitante(BaseModel):
    nome: str = Field(min_length=2, max_length=200)
    email: EmailStr
    instituicao: str | None = Field(default=None, max_length=200)
    cidade: str | None = Field(default=None, max_length=120)


def _enviar_link(email: str, nome: str, url: str) -> bool:
    c = config()
    if not c.smtp_host:
        return False
    msg = EmailMessage()
    msg['Subject'] = 'Seu acesso ao ETAL Connect'
    msg['From'] = c.smtp_remetente or c.smtp_usuario
    msg['To'] = email
    msg.set_content(f'Olá, {nome.split()[0]}!\n\nToque no link para entrar no ETAL Connect (vale por 30 minutos):\n{url}\n\nSe não foi você, ignore este e-mail.')
    with smtplib.SMTP(c.smtp_host, c.smtp_porta, timeout=20) as s:
        s.starttls()
        if c.smtp_usuario:
            s.login(c.smtp_usuario, c.smtp_senha)
        s.send_message(msg)
    return True


@rota.post('/visitante', status_code=202, dependencies=[Depends(limitar('visitante', 5))])
def visitante(v: Visitante, request: Request, db: Session = Depends(sessao)):
    email = v.email.lower()
    p = db.scalar(select(Pessoa).where(Pessoa.email == email))
    if not p:
        p = Pessoa(tipo='visitante', email=email, nome=v.nome.strip(), instituicao=v.instituicao, cidade=v.cidade, papel=_papel(None, email))
        db.add(p)
        db.flush()
    t, h = novo_token()
    db.add(LinkAcesso(pessoa_id=p.id, token_hash=h, expira_em=agora() + timedelta(minutes=30)))
    db.commit()
    url = f'{publica(request)}/api/auth/link?t={t}'
    enviado = _enviar_link(email, p.nome, url)
    if not enviado and config().login_dev:
        return {'enviado': False, 'link': url}  # só em desenvolvimento, sem servidor de e-mail
    if not enviado:
        raise HTTPException(503, 'Envio de e-mail não configurado.')
    return {'enviado': True}


@rota.get('/link')
def link(request: Request, t: str = '', db: Session = Depends(sessao)):
    c = config()
    la = db.scalar(select(LinkAcesso).where(LinkAcesso.token_hash == hash_token(t))) if t else None
    if not la or la.usado_em or la.expira_em < agora():
        return RedirectResponse(f'{publica(request)}/?login=link-expirado', 302)
    la.usado_em = agora()
    db.commit()
    resp = RedirectResponse(f'{publica(request)}/?login=ok', 302)
    abrir_sessao(resp, db.get(Pessoa, la.pessoa_id))
    return resp


class Dev(BaseModel):
    nome: str = 'Pessoa de Teste'
    matricula: str | None = None
    organizacao: bool = False
    codigo: str = ''


@rota.post('/dev')
def dev(d: Dev, request: Request, response: Response, db: Session = Depends(sessao)):
    """Só com ETAL_LOGIN_DEV=1: entra sem SUAP, para testar."""
    if not config().login_dev:
        raise HTTPException(404)
    senha = config().senha_homologacao
    if senha and not secrets.compare_digest(d.codigo.strip(), senha):
        raise HTTPException(403, 'Código de homologação errado.')
    matricula = d.matricula or f'dev-{secrets.token_hex(3)}'
    p = db.scalar(select(Pessoa).where(Pessoa.matricula == matricula)) or Pessoa(tipo='dev', matricula=matricula, nome=d.nome)
    p.papel = 'organizacao' if d.organizacao else 'participante'
    db.add(p)
    db.commit()
    abrir_sessao(response, p)
    return {'ok': True, 'id': p.id}


@rota.post('/sair')
def sair(response: Response):
    fechar_sessao(response)
    return {'ok': True}
