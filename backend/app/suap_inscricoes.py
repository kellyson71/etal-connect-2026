"""Inscrições nos minicursos pela página pública do evento no SUAP (ETAL_SUAP_INSCRICOES_URL).

A página de inscrição do evento lista, em cada atividade, as vagas restantes e os nomes de quem está inscrito. O app usa
isso para duas coisas:
- vagas de verdade nos minicursos (preenchidas e total), no lugar dos números de exemplo;
- as inscrições da pessoa que entrou: o nome dela no SUAP é comparado com as listas de cada atividade. No SUAP a
  inscrição é por atividade (minicurso, palestra, mesa...), feita antes do evento. Essas atividades entram na agenda
  dela como "inscrito"; nos minicursos a lista manda sozinha (minicurso não se salva no app).

Os nomes ficam só na memória do processo, normalizados, por alguns minutos; não vão para o banco nem para as respostas.
A comparação é por nome (a página não traz matrícula): nome completo igual, ou nome usual com o mesmo primeiro e último
nome e as outras partes na ordem. Sem a página (SUAP fora do ar, endereço vazio), nada muda no app.
"""
import re
import time
import unicodedata
from dataclasses import dataclass, field

import httpx

from .config import config

VALIDADE = 600  # segundos com a página guardada
ESPERA_ERRO = 120  # depois de uma falha, quanto esperar para tentar de novo
_PARTICULAS = {'de', 'da', 'do', 'das', 'dos', 'e'}
COM_INSCRICAO = {'Minicurso', 'Oficina'}


@dataclass
class AtividadeSuap:
    tipo: str
    titulo: str
    restantes: int | None  # None: vagas ilimitadas
    participantes: int
    nomes: set[tuple[str, ...]] = field(default_factory=set)


_cache: dict = {'em': 0.0, 'erro_em': 0.0, 'atividades': None, 'url': ''}


def normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize('NFKD', texto or '').encode('ascii', 'ignore').decode()
    return ' '.join(re.sub(r'[^a-z0-9 ]+', ' ', sem_acento.lower()).split())  # aspas retas e curvas viram a mesma coisa


def partes(nome: str) -> tuple[str, ...]:
    return tuple(p for p in normalizar(nome).split() if p not in _PARTICULAS)


def ler_pagina(html: str) -> list[AtividadeSuap]:
    from bs4 import BeautifulSoup
    pagina = BeautifulSoup(html, 'html.parser')
    saida = []
    for caixa in pagina.select('div.box-item'):
        tipo = caixa.select_one('h5 strong')
        textos = [p.get_text(' ', strip=True) for p in caixa.find_all('p', recursive=False)]
        if not tipo or len(textos) < 2:
            continue
        vagas = textos[0].lower()
        n = re.search(r'(\d+)\s*vaga', vagas)
        restantes = None if 'ilimitad' in vagas else int(n.group(1)) if n else 0
        nomes, inscritos = set(), 0
        for item in caixa.select('dl .list-item'):
            papel, nome = item.find('dt'), item.find('dd')
            if not nome:
                continue
            nomes.add(partes(nome.get_text(' ', strip=True)))
            if papel and papel.get_text(strip=True) == 'Participante':
                inscritos += 1
        saida.append(AtividadeSuap(tipo.get_text(strip=True), textos[1], restantes, inscritos, nomes))
    return saida


def atividades() -> list[AtividadeSuap] | None:
    """A página do evento, guardada por VALIDADE segundos. None se não há endereço ou se o SUAP não respondeu."""
    url = config().suap_inscricoes_url.strip()
    if not url:
        return None
    agora = time.monotonic()
    if _cache['atividades'] is not None and _cache['url'] == url and agora - _cache['em'] < VALIDADE:
        return _cache['atividades']
    if agora - _cache['erro_em'] < ESPERA_ERRO:
        return _cache['atividades'] if _cache['url'] == url else None
    try:
        r = httpx.get(url, timeout=5, follow_redirects=True, headers={'User-Agent': 'ETAL Connect'})
        r.raise_for_status()
        lidas = ler_pagina(r.text)
        if not lidas:
            raise ValueError('página sem atividades')
    except (httpx.HTTPError, ValueError) as erro:
        print(f'inscrições do SUAP indisponíveis: {erro!r}', flush=True)
        _cache['erro_em'] = agora
        return _cache['atividades'] if _cache['url'] == url else None
    _cache.update(em=agora, atividades=lidas, url=url, erro_em=0.0)
    return lidas


def _base(titulo: str) -> str:
    """O título no SUAP vem com quem ministra e a duração ("Coral (Apresentação Cultural de 1:30h)",
    "Introdução ao React Native com Expo - Jonhy ..."): fica só o nome da atividade."""
    return normalizar(re.split(r' - | \(', titulo, maxsplit=1)[0])


def correspondencia(lidas: list[AtividadeSuap], ativs) -> dict[str, AtividadeSuap]:
    """id da atividade do app → atividade da página, pelo título: igual primeiro; senão, um começando pelo outro."""
    saida = {}
    for a in ativs:
        meu = normalizar(a.titulo)
        if not meu:
            continue
        achada = next((s for s in lidas if _base(s.titulo) == meu), None) or next(
            (s for s in lidas if normalizar(s.titulo).startswith(meu + ' ') or meu.startswith(_base(s.titulo) + ' ')), None)
        if achada and achada not in saida.values():
            saida[a.id] = achada
    return saida


def _confere(meu: tuple[str, ...], dele: tuple[str, ...]) -> bool:
    if len(meu) < 2 or meu[0] != dele[0] or meu[-1] != dele[-1]:
        return False
    resto = iter(dele)
    return all(p in resto for p in meu)  # as partes do meu nome, na ordem, dentro do nome da lista


def esta_na_lista(nomes_da_pessoa: list[str], atividade: AtividadeSuap) -> bool:
    meus = [partes(n) for n in nomes_da_pessoa if n]
    return any(_confere(m, d) for m in meus for d in atividade.nomes)
