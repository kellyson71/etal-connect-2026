"""Sessão em cookie assinado e QR codes assinados (não dá para inventar um QR válido)."""
import hashlib
import secrets
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeSerializer, URLSafeTimedSerializer
from sqlalchemy.orm import Session

from .config import config
from .db import sessao
from .modelos import Pessoa

COOKIE = 'etal_sessao'
DURACAO = 60 * 60 * 24 * 30  # 30 dias


def _sessoes():
    return URLSafeTimedSerializer(config().segredo, salt='sessao')


def _qrs():
    return URLSafeSerializer(config().segredo, salt='qr')


def abrir_sessao(resp: Response, pessoa: Pessoa) -> None:
    resp.set_cookie(COOKIE, _sessoes().dumps(pessoa.id), max_age=DURACAO, httponly=True,
                    secure=config().cookie_seguro, samesite='lax', path='/')


def fechar_sessao(resp: Response) -> None:
    resp.delete_cookie(COOKIE, path='/')


def pessoa_atual(request: Request, db: Session = Depends(sessao)) -> Pessoa:
    raw = request.cookies.get(COOKIE)
    if not raw:
        raise HTTPException(401, 'Entre para continuar.')
    try:
        pid = _sessoes().loads(raw, max_age=DURACAO)
    except BadSignature:
        raise HTTPException(401, 'Sessão inválida. Entre de novo.')
    pessoa = db.get(Pessoa, pid)
    if not pessoa:
        raise HTTPException(401, 'Sessão inválida. Entre de novo.')
    return pessoa


def organizacao(pessoa: Pessoa = Depends(pessoa_atual)) -> Pessoa:
    if pessoa.papel != 'organizacao':
        raise HTTPException(403, 'Só a organização do evento.')
    return pessoa


def eh_organizacao(matricula: str | None, email: str | None) -> bool:
    ids = config().org
    return bool(ids) and ((matricula or '').lower() in ids or (email or '').lower() in ids)


def token_qr(atividade_id: str | None) -> str:
    """QR de uma atividade, ou do credenciamento no evento (atividade_id=None)."""
    return _qrs().dumps({'a': atividade_id})


def ler_qr(texto: str) -> dict:
    """Aceita o token puro ou a URL impressa (…/q/<token>)."""
    token = texto.strip().rsplit('/q/', 1)[-1].split('?')[0]
    try:
        dados = _qrs().loads(token)
    except BadSignature:
        raise HTTPException(400, 'QR não reconhecido. Use um QR do ETAL.')
    if not isinstance(dados, dict) or 'a' not in dados:
        raise HTTPException(400, 'QR não reconhecido. Use um QR do ETAL.')
    return dados


def novo_token() -> tuple[str, str]:
    t = secrets.token_urlsafe(32)
    return t, hashlib.sha256(t.encode()).hexdigest()


def hash_token(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()


def publica(request: Request | None = None) -> str:
    """Endereço público do app: ETAL_URL_PUBLICA ou, vazio, o endereço pelo qual o pedido chegou."""
    url = config().url_publica.rstrip('/')
    if url or request is None:
        return url
    h = request.headers
    host = h.get('x-forwarded-host') or h.get('host') or request.url.netloc
    proto = h.get('x-forwarded-proto') or request.url.scheme
    return f'{proto.split(",")[0]}://{host.split(",")[0]}'


def agora() -> datetime:
    """Hora local do campus, sem fuso (é como os horários das atividades são guardados)."""
    return datetime.now(ZoneInfo(config().fuso)).replace(tzinfo=None, microsecond=0)
