"""Configuração por variáveis de ambiente (prefixo ETAL_) ou arquivo .env. Ver deploy/.env.example."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_prefix='ETAL_', extra='ignore')

    banco: str = 'sqlite:///./etal.db'
    segredo: str = 'troque-este-segredo'
    url_publica: str = 'http://127.0.0.1:8770'
    origens: str = 'http://127.0.0.1:8770,http://localhost:8770'
    cookie_seguro: bool = False
    login_dev: bool = False

    # OAuth2 do SUAP: a aplicação precisa ser registrada pela TI do IFRN.
    suap_client_id: str = ''
    suap_client_secret: str = ''
    suap_authorize_url: str = 'https://suap.ifrn.edu.br/o/authorize/'
    suap_token_url: str = 'https://suap.ifrn.edu.br/o/token/'
    suap_userinfo_url: str = 'https://suap.ifrn.edu.br/api/eu/'
    suap_escopo: str = 'identificacao email'

    # Matrículas ou e-mails com acesso ao painel da organização, separados por vírgula.
    organizacao: str = ''

    smtp_host: str = ''
    smtp_porta: int = 587
    smtp_usuario: str = ''
    smtp_senha: str = ''
    smtp_remetente: str = ''

    # Presença: aceita a leitura do QR de uma atividade só perto do horário dela.
    janela_presenca: bool = True
    antecedencia_min: int = 20
    fuso: str = 'America/Fortaleza'

    @property
    def org(self) -> set[str]:
        return {x.strip().lower() for x in self.organizacao.split(',') if x.strip()}


@lru_cache
def config() -> Config:
    return Config()
