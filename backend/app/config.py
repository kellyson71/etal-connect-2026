"""Configuração por variáveis de ambiente (prefixo ETAL_) ou arquivo .env. Ver deploy/.env.example."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_prefix='ETAL_', extra='ignore')

    banco: str = 'sqlite:///./etal.db'
    segredo: str = 'troque-este-segredo'
    # Vazio: usa o endereço pelo qual o pedido chegou (mesma origem, como na Vercel e atrás do Caddy).
    url_publica: str = ''
    origens: str = 'http://127.0.0.1:8770,http://localhost:8770'
    cookie_seguro: bool = False
    demo: bool = False
    login_dev: bool = False
    # Se preenchido, a entrada de teste (/api/auth/dev) pede este código. Use em homologação pública.
    senha_homologacao: str = ''

    # OAuth2 do SUAP: a aplicação precisa ser registrada pela TI do IFRN.
    suap_portal: bool = False
    # Página pública de inscrição do evento no SUAP: vagas reais dos minicursos e quem está inscrito em cada um
    # (app/suap_inscricoes.py). Vazio desliga.
    suap_inscricoes_url: str = 'https://suap.ifrn.edu.br/eventos/inscricao/1/8528/'
    # Programação carregada na primeira subida, só se o banco ainda não tem atividades (app/importar.py). Vazio desliga.
    programacao_inicial: str = ''
    suap_client_id: str = ''
    suap_client_secret: str = ''
    suap_authorize_url: str = 'https://suap.ifrn.edu.br/o/authorize/'
    suap_token_url: str = 'https://suap.ifrn.edu.br/o/token/'
    suap_userinfo_url: str = 'https://suap.ifrn.edu.br/api/eu/'
    suap_escopo: str = 'identificacao email'
    # Entrada direta com matrícula e senha (token JWT da API do SUAP).
    suap_api_url: str = 'https://suap.ifrn.edu.br'
    # Teto de chamadas simultâneas ao SUAP e quanto tempo (s) um login espera a vez antes do 503 (app/suap_fila.py).
    # No teste de carga (scripts/carga), 700 pessoas em 1 minuto: com 8, a última esperou 2 min; com 16, 33 s.
    suap_simultaneos: int = 16
    suap_espera: float = 12

    # Tetos por endereço de rede, por minuto. No Wi-Fi do campus todo mundo pode sair pelo mesmo IP: por isso o teto
    # geral é alto (o teste de carga com 700 pessoas num IP só passa) e o que protege de verdade é o limite por pessoa.
    # Na senha do SUAP, o teto da rede conta só as senhas erradas (é o que uma tentativa de adivinhar senha gera).
    teto_rede: int = 3000
    teto_rede_senha_errada: int = 60

    # Capacidade de um processo: threads para as rotas comuns (o padrão do AnyIO é 40) e conexões com o PostgreSQL
    # (fixas + extras na hora do pico). Threads e conexões andam juntas: cada rota comum usa uma conexão.
    threads: int = 60
    banco_conexoes: int = 30
    banco_extras: int = 20

    # Pasta dos materiais enviados pela organização (app/arquivos.py). Em produção, um volume do Docker.
    arquivos: str = './arquivos'

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
    # Leitura guardada sem internet: ela precisa ter sido feita durante a atividade e chegar ao servidor até estes minutos
    # depois do fim (relógio do servidor). A hora informada pelo aparelho só restringe, nunca amplia a janela.
    tolerancia_envio_min: int = 60
    # Saída: a segunda leitura do QR da sala vale como saída (e libera a avaliação) a partir destes minutos antes do fim
    # e até estes minutos depois do fim. Sem a janela de presença (demonstração), a segunda leitura já é a saída.
    saida_antes_min: int = 20
    saida_depois_min: int = 30
    fuso: str = 'America/Fortaleza'

    # Publicações (app/rotas/publicacoes.py). Denúncias de pessoas diferentes que tiram um conteúdo do ar até a
    # organização revisar, e por quantos dias as publicações ficam guardadas (python -m app.manutencao publicacoes).
    denuncias_para_ocultar: int = 3
    publicacoes_dias: int = 90

    @property
    def org(self) -> set[str]:
        return {x.strip().lower() for x in self.organizacao.split(',') if x.strip()}


    def model_post_init(self, _ctx) -> None:
        # Hospedagens como a Vercel entregam o banco em DATABASE_URL/POSTGRES_URL (postgres://...).
        import os
        if self.banco == 'sqlite:///./etal.db':
            self.banco = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL') or self.banco
        for velho in ('postgres://', 'postgresql://'):
            if self.banco.startswith(velho):
                self.banco = 'postgresql+psycopg://' + self.banco[len(velho):]


@lru_cache
def config() -> Config:
    return Config()
