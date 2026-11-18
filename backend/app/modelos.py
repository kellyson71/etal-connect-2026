"""Tabelas. Atividade guarda data e horário locais (fuso do campus)."""
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Pessoa(Base):
    __tablename__ = 'pessoas'
    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(16))  # suap | visitante | dev
    matricula: Mapped[str | None] = mapped_column(String(32), unique=True)
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    nome: Mapped[str] = mapped_column(String(200))
    # nome completo no SUAP (social ou de registro): é por ele que a pessoa é achada nas listas de inscrição
    nome_completo: Mapped[str | None] = mapped_column(String(200))
    curso: Mapped[str | None] = mapped_column(String(200))
    campus: Mapped[str | None] = mapped_column(String(120))
    instituicao: Mapped[str | None] = mapped_column(String(200))
    cidade: Mapped[str | None] = mapped_column(String(120))
    foto_url: Mapped[str | None] = mapped_column(String(500))
    papel: Mapped[str] = mapped_column(String(16), default='participante')  # participante | organizacao
    credenciado_em: Mapped[datetime | None] = mapped_column(DateTime)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Atividade(Base):
    __tablename__ = 'atividades'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tipo: Mapped[str] = mapped_column(String(40))
    titulo: Mapped[str] = mapped_column(String(300))
    curto: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str | None] = mapped_column(Text)
    palestrante: Mapped[str | None] = mapped_column(String(200))
    papel_palestrante: Mapped[str | None] = mapped_column(String(200))
    data: Mapped[date] = mapped_column(Date)
    inicio: Mapped[str] = mapped_column(String(5))  # HH:MM
    fim: Mapped[str] = mapped_column(String(5))
    andar: Mapped[int | None] = mapped_column(Integer)
    zona: Mapped[str | None] = mapped_column(String(64))
    sala: Mapped[str | None] = mapped_column(String(120))
    vagas: Mapped[int | None] = mapped_column(Integer)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)  # materiais, requisitos etc., no formato do app


class Agenda(Base):
    __tablename__ = 'agenda'
    __table_args__ = (UniqueConstraint('pessoa_id', 'atividade_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id', ondelete='CASCADE'))
    atividade_id: Mapped[str] = mapped_column(ForeignKey('atividades.id', ondelete='CASCADE'))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Presenca(Base):
    """Presença numa atividade. O credenciamento no evento fica em Pessoa.credenciado_em."""
    __tablename__ = 'presencas'
    __table_args__ = (UniqueConstraint('pessoa_id', 'atividade_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id', ondelete='CASCADE'))
    atividade_id: Mapped[str] = mapped_column(ForeignKey('atividades.id', ondelete='CASCADE'))
    em: Mapped[datetime] = mapped_column(DateTime)
    via: Mapped[str] = mapped_column(String(16), default='qr')  # qr | qr-adiado (lida sem internet) | manual


class Aviso(Base):
    __tablename__ = 'avisos'
    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(140))
    texto: Mapped[str] = mapped_column(Text)
    atividade_id: Mapped[str | None] = mapped_column(ForeignKey('atividades.id', ondelete='SET NULL'))
    autor_id: Mapped[int | None] = mapped_column(ForeignKey('pessoas.id', ondelete='SET NULL'))
    em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class NumeroSala(Base):
    """Número de sala definido pela organização (chave "andar:zona", como no app)."""
    __tablename__ = 'numeros_sala'
    chave: Mapped[str] = mapped_column(String(80), primary_key=True)
    numero: Mapped[str] = mapped_column(String(12))


class LinkAcesso(Base):
    """Link de entrada por e-mail para visitantes. Guarda só o hash do token."""
    __tablename__ = 'links_acesso'
    id: Mapped[int] = mapped_column(primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id', ondelete='CASCADE'))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime)
    usado_em: Mapped[datetime | None] = mapped_column(DateTime)


class CenarioDemo(Base):
    """Complementos da apresentação: campeonato e publicações simulados, sem dados de acesso."""
    __tablename__ = 'cenarios_demo'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    dados: Mapped[dict] = mapped_column(JSON, default=dict)


class Arquivo(Base):
    """Material enviado pela organização (PDF, imagem, ZIP...). O conteúdo fica em disco (app/arquivos.py); `dados` só
    existe em materiais antigos, de quando ficavam no banco, até a primeira leitura."""
    __tablename__ = 'arquivos'
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    atividade_id: Mapped[str] = mapped_column(ForeignKey('atividades.id'))
    nome: Mapped[str] = mapped_column(String(200))
    tipo: Mapped[str] = mapped_column(String(100))
    tamanho: Mapped[int] = mapped_column(Integer)
    dados: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Publicacao(Base):
    """Publicação, comentário (pai_id = a publicação) ou mensagem do chat geral. Fotos ficam em disco
    (app/arquivos.py), com o id e a descrição guardados aqui."""
    __tablename__ = 'publicacoes'
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    tipo: Mapped[str] = mapped_column(String(12))  # post | comentario | mensagem
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id'), index=True)
    pai_id: Mapped[str | None] = mapped_column(ForeignKey('publicacoes.id', ondelete='CASCADE'), index=True)
    texto: Mapped[str] = mapped_column(Text, default='')
    atividade_id: Mapped[str | None] = mapped_column(String(64))
    dia: Mapped[int | None] = mapped_column(Integer)
    assunto: Mapped[str | None] = mapped_column(String(40))
    mencoes: Mapped[list] = mapped_column(JSON, default=list)  # ids de pessoas
    fotos: Mapped[list] = mapped_column(JSON, default=list)  # [{id, alt}]
    oculta: Mapped[bool] = mapped_column(default=False)  # tirada do ar pela moderação (ou por denúncias)
    criada_em: Mapped[datetime] = mapped_column(DateTime, index=True)


class Curtida(Base):
    __tablename__ = 'curtidas'
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id'), primary_key=True)
    publicacao_id: Mapped[str] = mapped_column(ForeignKey('publicacoes.id', ondelete='CASCADE'), primary_key=True)


class Salvo(Base):
    __tablename__ = 'salvos'
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id'), primary_key=True)
    publicacao_id: Mapped[str] = mapped_column(ForeignKey('publicacoes.id', ondelete='CASCADE'), primary_key=True)


class Denuncia(Base):
    """Denúncia de um conteúdo. Guarda uma cópia do texto, para a revisão continuar possível se o autor apagar."""
    __tablename__ = 'denuncias'
    id: Mapped[int] = mapped_column(primary_key=True)
    publicacao_id: Mapped[str | None] = mapped_column(ForeignKey('publicacoes.id', ondelete='SET NULL'), index=True)
    alvo: Mapped[str] = mapped_column(String(80))  # post:<id> | comment:<pai>:<id> | message:<id>
    pessoa_id: Mapped[int] = mapped_column(ForeignKey('pessoas.id'))
    motivo: Mapped[str] = mapped_column(String(60))
    detalhe: Mapped[str] = mapped_column(String(500), default='')
    copia: Mapped[dict] = mapped_column(JSON, default=dict)  # {name, text, type}
    situacao: Mapped[str] = mapped_column(String(12), default='pendente')  # pendente | ocultada | arquivada
    revisada_por: Mapped[str | None] = mapped_column(String(200))
    revisada_em: Mapped[datetime | None] = mapped_column(DateTime)
    nota: Mapped[str | None] = mapped_column(String(240))
    criada_em: Mapped[datetime] = mapped_column(DateTime)


class Moderacao(Base):
    """Histórico da moderação: quem ocultou, restaurou ou arquivou o quê, quando e por quê."""
    __tablename__ = 'moderacao'
    id: Mapped[int] = mapped_column(primary_key=True)
    alvo: Mapped[str] = mapped_column(String(80))
    acao: Mapped[str] = mapped_column(String(12))  # hide | restore | dismiss | auto
    por: Mapped[str] = mapped_column(String(200))
    nota: Mapped[str] = mapped_column(String(240), default='')
    texto: Mapped[str] = mapped_column(String(300), default='')
    em: Mapped[datetime] = mapped_column(DateTime)
