"""Tabelas. Atividade guarda data e horário locais (fuso do campus)."""
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Pessoa(Base):
    __tablename__ = 'pessoas'
    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(16))  # suap | visitante | dev
    matricula: Mapped[str | None] = mapped_column(String(32), unique=True)
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    nome: Mapped[str] = mapped_column(String(200))
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
    via: Mapped[str] = mapped_column(String(16), default='qr')  # qr | manual


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
