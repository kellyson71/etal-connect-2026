FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY seed ./seed
# migrações do banco: a API aplica as que faltam ao iniciar (app/db.py)
COPY alembic.ini ./
COPY migracoes ./migracoes
RUN useradd -r -u 10001 etal && mkdir -p /srv/arquivos && chown etal /srv/arquivos
ENV ETAL_ARQUIVOS=/srv/arquivos
USER etal
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/saude', timeout=4)"
# Um worker só: o canal ao vivo (SSE) e os limites ficam na memória do processo. Sem o log de acesso do uvicorn
# (ele grava o endereço inteiro, com tokens, e o IP): o registro de cada requisição é o de app/monitor.py.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*", "--no-access-log"]
