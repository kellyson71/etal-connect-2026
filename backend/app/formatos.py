"""Formato das respostas: o mesmo das atividades do protótipo (prototipo/data.js), para o app trocar os dados de exemplo pelos reais."""
from .modelos import Atividade, Aviso, Pessoa


def atividade(a: Atividade, inscritos: int = 0) -> dict:
    return {**(a.extra or {}), 'id': a.id, 'type': a.tipo, 'title': a.titulo, 'short': a.curto, 'description': a.descricao,
            'speaker': a.palestrante, 'role': a.papel_palestrante, 'date': a.data.isoformat(), 'day': a.data.day,
            'time': a.inicio, 'end': a.fim, 'floor': a.andar, 'zone': a.zona, 'room': a.sala, 'seats': a.vagas, 'taken': inscritos}


def aviso(v: Aviso) -> dict:
    return {'id': v.id, 'title': v.titulo, 'text': v.texto, 'activity': v.atividade_id, 'time': v.em.strftime('%H:%M'), 'at': v.em.isoformat()}


def pessoa(p: Pessoa) -> dict:
    partes = p.nome.split()
    return {'id': p.id, 'name': p.nome, 'first': partes[0] if partes else p.nome, 'initials': ''.join(x[0] for x in partes[:1] + partes[-1:]).upper() if partes else '',
            'source': p.tipo, 'matricula': p.matricula, 'course': p.curso, 'campus': p.campus, 'institution': p.instituicao,
            'city': p.cidade, 'photo': p.foto_url, 'org': p.papel == 'organizacao',
            'credentialedAt': p.credenciado_em.isoformat() if p.credenciado_em else None}
