"""Eventos e certificados do titular; os links de acesso privados ficam no servidor."""
import httpx
from fastapi import APIRouter,Depends,HTTPException,Request
from fastapi.responses import Response
from ..modelos import Pessoa
from ..seguranca import pessoa_atual
from .. import suap_portal
rota=APIRouter(prefix='/api/eu/suap',tags=['SUAP do participante'])

@rota.get('')
def resumo(request:Request,response:Response,person:Pessoa=Depends(pessoa_atual)):
    response.headers['Cache-Control']='no-store'
    return suap_portal.summary(f"{person.id}:{request.cookies.get('etal_suap_portal', '')}")

@rota.get('/certificados/{cert_id}')
def certificado(cert_id:str,request:Request,person:Pessoa=Depends(pessoa_atual)):
    try:data=suap_portal.certificate(f"{person.id}:{request.cookies.get('etal_suap_portal', '')}",cert_id)
    except ValueError as error:raise HTTPException(409,str(error)) from None
    except httpx.HTTPError:raise HTTPException(502,'Não foi possível baixar o certificado no SUAP.') from None
    return Response(data,media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="certificado-suap.pdf"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
