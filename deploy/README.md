# Publicar o ETAL Connect

No mesmo modelo dos outros sistemas do NADIC (como o `nadic-ifrn/horarios`): o GitHub gera as imagens Docker a cada
push na `main` e publica no GitHub Container Registry. O servidor só precisa de Docker, do `docker-compose.yml` e de um
`.env`. Nada é compilado no servidor.

```
celular ──https──▶ proxy do servidor (nginx/Apache, com o certificado)
                        │ http://127.0.0.1:8080
                        ▼
                  web  (Caddy: o app, o mapa 3D e o service worker; /api e /q vão para a api)
                        ▼
                  api  (FastAPI, um processo; aplica as migrações do banco sozinha ao iniciar)
                        ▼
                  db   (PostgreSQL 16)          volumes: pg_dados (banco), arquivos_dados (materiais e fotos)
```

Imagens: `ghcr.io/kellyson71/etal-connect-2026-web` e `ghcr.io/kellyson71/etal-connect-2026-api`, com as etiquetas
`latest` (a última `main`) e o hash curto de cada commit (para voltar uma versão).

## Primeira instalação

1. **Conferir o servidor.** Copiar `diagnostico.sh` e rodar `sh diagnostico.sh etal.nadic.ifrn.edu.br 8080`. Ele mostra
   se o Docker e o `docker compose` estão lá, quem já usa as portas 80/443, se a porta 8080 está livre, se o domínio
   resolve e se a máquina alcança o `ghcr.io` e o SUAP. Não muda nada.
2. **Pasta e arquivos.**
   ```sh
   mkdir -p ~/etal && cd ~/etal
   # copiar deploy/docker-compose.yml, deploy/.env.example (como .env), deploy/backup.sh
   ```
3. **Preencher o `.env`** (ver os comentários dentro dele):
   - `DOMINIO`, `PORTA` (8080, ou outra livre; o horários usa a 8000) e `ENDERECO` (127.0.0.1 se o proxy está na mesma máquina);
   - `POSTGRES_PASSWORD` e `ETAL_SEGREDO`: gerar com `python3 -c "import secrets;print(secrets.token_urlsafe(48))"`.
     **Trocar o `ETAL_SEGREDO` depois invalida todos os QRs impressos e todas as sessões.**
   - `ETAL_SUAP_CLIENT_ID` e `ETAL_SUAP_CLIENT_SECRET` (a aplicação OAuth2 do SUAP). No SUAP, o endereço de retorno
     precisa ser exatamente `https://etal.nadic.ifrn.edu.br/api/auth/suap/retorno`;
   - `ETAL_ORGANIZACAO`: matrículas ou e-mails de quem entra no painel, separados por vírgula;
   - `ETAL_SMTP_*`: sem e-mail configurado, a entrada de convidado responde "envio de e-mail não configurado".
4. **Subir.**
   ```sh
   docker compose pull && docker compose up -d
   docker compose ps                     # api "healthy", db "healthy", web "running"
   curl http://127.0.0.1:8080/api/saude  # {"ok":true}
   ```
   Se as imagens ainda forem privadas no GitHub: `docker login ghcr.io` com um token de leitura de pacotes, ou tornar
   os dois pacotes públicos (em Packages, no GitHub). O repositório é público.
5. **Programação.** O banco começa vazio. Para carregar a programação do arquivo do repositório (a de exemplo é a do
   VII ETAL; trocar pelo arquivo da edição antes do evento):
   ```sh
   docker compose exec api python -m app.importar programacao seed/programacao.json
   ```
6. **Proxy e HTTPS.** Se o servidor já tem nginx ou Apache nas portas 80/443 (o caso comum), usar
   `nginx-etal.conf` ou `apache-etal.conf`: encaminham o domínio para `127.0.0.1:8080`, com o certificado, o IP real
   de quem acessa (substituindo o `X-Forwarded-For`, para ninguém falsificar) e o ao vivo sem buffer.
   Se as portas 80/443 estiverem livres, o próprio app pede o certificado:
   `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d` (o DNS já precisa apontar para o servidor).
7. **Conferir de fora:** abrir `https://etal.nadic.ifrn.edu.br`, entrar com o SUAP e abrir o painel em `/admin.html`
   com uma conta da `ETAL_ORGANIZACAO`. Em **Servidor**, os números do servidor aparecem a cada 10 s.

## Atualizar

Automático, a cada push na `main` (`.github/workflows/publicar.yml`): testes → imagens → servidor. Para o GitHub
atualizar o servidor, configurar em *Settings → Secrets and variables → Actions*:

| Tipo | Nome | Valor |
|---|---|---|
| segredo | `SSH_HOST`, `SSH_PORT`, `SSH_USER` | acesso SSH ao servidor (os mesmos nomes do horários) |
| segredo | `SSH_PASSWORD` ou `SSH_CHAVE` | senha ou chave privada |
| variável | `IMPLANTAR` | `sim` (sem ela, só as imagens são publicadas) |
| variável | `PASTA` | opcional; padrão `/home/<SSH_USER>/etal` |

O GitHub leva o `docker-compose.yml` atualizado para a pasta, faz `docker compose pull` e `up -d` e espera a API
responder. O `.env` nunca sai do servidor.

À mão: `docker compose pull && docker compose up -d`. Para voltar a uma versão: `VERSAO=<hash>` no `.env` e
`docker compose up -d` (os hashes estão em Packages, no GitHub).

## Backup

```sh
sh backup.sh   # backups/etal-AAAAMMDD-HHMM.sql.gz e .arquivos.tar.gz; apaga os de mais de 14 dias
```
No cron, de hora em hora durante o evento: `0 * * * * cd /home/USUARIO/etal && sh backup.sh >> backups/backup.log 2>&1`.
Voltar o banco: `gunzip -c backups/etal-....sql.gz | docker compose exec -T db psql -U etal -d etal`.
Guardar uma cópia fora da máquina também.

## Acompanhar

- `docker compose logs -f api`: uma linha JSON por requisição (rota, situação, tempo), sem tokens, IP ou dados das
  pessoas. Os logs giram sozinhos (5 arquivos de 20 MB por serviço).
- Painel → **Servidor**: requisições por minuto, tempos, erros, fila do SUAP e celulares no ao vivo.
- O Docker reinicia a API se `/api/saude` (que consulta o banco) parar de responder.
- Capacidade: um processo aguentou 700 pessoas entrando no mesmo minuto no teste de carga
  (`docs/tecnico/09-teste-de-carga.md`), com cerca de 250 MB de memória. A API precisa ser um processo só (o ao vivo e
  os limites ficam na memória dele).

## Testar numa máquina com o repositório

Gera as imagens a partir do código, sem passar pelo GitHub:

```sh
cd deploy && cp .env.example .env   # preencher POSTGRES_PASSWORD e ETAL_SEGREDO; DOMINIO=127.0.0.1:8080
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

## No dia

- [ ] `docker compose ps` com tudo de pé; backup no cron.
- [ ] Programação da edição importada e conferida no app.
- [ ] Entrar com o SUAP (botão e senha) e como convidado (e-mail chega?).
- [ ] QRs impressos pelo painel (`/api/org/qrs`) e kit do plano B (`docs/contingencia.md`).
- [ ] Painel → Servidor aberto num computador da organização.
