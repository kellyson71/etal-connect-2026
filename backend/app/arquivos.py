"""Materiais das atividades em disco (pasta ETAL_ARQUIVOS). O banco guarda nome, tipo e tamanho; o conteúdo fica num
arquivo com o id. Assim a API entrega o material em partes, sem carregar o arquivo inteiro na memória (cem pessoas
baixando os slides no fim de uma palestra não derrubam o servidor). Materiais antigos, guardados dentro do banco,
passam para o disco na primeira vez que são abertos."""
import os
import re
import tempfile
from pathlib import Path

from .config import config


def pasta() -> Path:
    p = Path(config().arquivos)
    p.mkdir(parents=True, exist_ok=True)
    return p


def caminho(arquivo_id: str) -> Path:
    if not re.fullmatch(r'[0-9a-f]{32}', arquivo_id):
        raise ValueError('id de arquivo inválido')
    return pasta() / arquivo_id


def gravar(arquivo_id: str, dados: bytes) -> None:
    """Grava num temporário e troca de uma vez: nunca fica um arquivo pela metade."""
    destino = caminho(arquivo_id)
    fd, tmp = tempfile.mkstemp(dir=destino.parent, prefix='.envio-')
    with os.fdopen(fd, 'wb') as f:
        f.write(dados)
    os.replace(tmp, destino)
