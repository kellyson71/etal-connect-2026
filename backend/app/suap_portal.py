"""Leitura do portal do próprio titular. Senha, cookies e links privados nunca vão ao banco."""
from dataclasses import dataclass,field
from datetime import datetime,timedelta,timezone
import re
from urllib.parse import urljoin,urlsplit
import httpx
from bs4 import BeautifulSoup

@dataclass
class Portal:
    client: httpx.Client
    base: str
    expires: datetime
    events: list = field(default_factory=list)
    certificates: list = field(default_factory=list)
    downloads: dict = field(default_factory=dict)

_sessions: dict[str,Portal]={}

def discard(person_id:str):
    portal=_sessions.pop(person_id,None)
    if portal:portal.client.close()

def _alive(person_id:str):
    now=datetime.now(timezone.utc)
    for id,portal in list(_sessions.items()):
        if portal.expires<=now:discard(id)
    return _sessions.get(person_id)

def connect(person_id:str,base:str,username:str,password:str):
    """Autentica uma sessão web distinta do JWT. Falha aqui não desfaz o login do app."""
    discard(person_id)
    if len(_sessions)>=64:discard(next(iter(_sessions)))
    base=base.rstrip('/');client=httpx.Client(timeout=10,follow_redirects=True)
    try:
        response=client.get(base+'/accounts/login/')
        response.raise_for_status();html=BeautifulSoup(response.text,'html.parser')
        form=next((f for f in html.find_all('form') if f.select_one('input[type=password]')),None)
        if not form:raise ValueError('Login web indisponível')
        action=urljoin(str(response.url),form.get('action') or str(response.url))
        if urlsplit(action).netloc!=urlsplit(base).netloc:raise ValueError('Origem inesperada')
        data={n['name']:n.get('value','') for n in form.select('input[name][type=hidden]')}
        data.update(username=username,password=password,next='/admin/eventos/evento/?tab=tab_participante')
        response=client.post(action,data=data,headers={'Referer':str(response.url)})
        response.raise_for_status()
        if BeautifulSoup(response.text,'html.parser').select_one('input[type=password]'):raise ValueError('É preciso completar o login no SUAP')
        portal=Portal(client,base,datetime.now(timezone.utc)+timedelta(minutes=20))
        response=client.get(base+'/admin/eventos/evento/',params={'tab':'tab_participante'})
        response.raise_for_status();parse_events(portal,response.text)
        _sessions[person_id]=portal
        return True
    except (httpx.HTTPError,ValueError,AttributeError,TypeError):
        client.close();return False

def parse_events(portal:Portal,html:str):
    """Seleciona linhas da aba pessoal; nunca tenta listas de terceiros ou áreas de organização."""
    soup=BeautifulSoup(html,'html.parser');seen=set()
    for row in soup.select('tbody tr'):
        event_link=next((a for a in row.select('a[href]') if re.search(r'/eventos/evento/\d+/',a['href'])),None)
        if not event_link:continue
        event_id=int(re.search(r'/eventos/evento/(\d+)/',event_link['href'])[1])
        cells=row.find_all(['td','th'],recursive=False)
        title=cells[1].get_text(' ',strip=True) if len(cells)>1 else event_link.get_text(' ',strip=True)
        if event_id not in seen:portal.events.append({'id':event_id,'name':title,'url':portal.base+f'/eventos/evento/{event_id}/'});seen.add(event_id)
        for link in row.select('a[href]'):
            url=urljoin(portal.base,link['href']);parts=urlsplit(url)
            if parts.netloc==urlsplit(portal.base).netloc and re.fullmatch(r'/eventos/download/[a-zA-Z0-9_-]+/',parts.path):
                cert_id=f'evento-{event_id}-{len(portal.certificates)}'
                portal.downloads[cert_id]=url
                portal.certificates.append({'id':cert_id,'eventId':event_id,'name':title,'status':'Disponível no SUAP'})

def summary(person_id:str):
    portal=_alive(person_id)
    if not portal:return {'connected':False,'events':[],'certificates':[],'message':'Entre novamente com matrícula e senha para consultar, ou abra o SUAP.'}
    return {'connected':True,'events':portal.events,'certificates':portal.certificates,'expiresAt':portal.expires.isoformat()}

def certificate(person_id:str,cert_id:str):
    portal=_alive(person_id)
    if not portal or cert_id not in portal.downloads:raise ValueError('Certificado indisponível nesta sessão. Entre novamente no SUAP.')
    with portal.client.stream('GET',portal.downloads[cert_id]) as response:
        response.raise_for_status();content=bytearray()
        for chunk in response.iter_bytes():
            content.extend(chunk)
            if len(content)>8_000_000:raise ValueError('O certificado ultrapassa o limite de tamanho.')
    if not content.startswith(b'%PDF'):raise ValueError('O SUAP não retornou um PDF. Abra o documento no portal oficial.')
    return bytes(content)
