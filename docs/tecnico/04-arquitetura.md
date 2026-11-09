# 04 · Estrutura, modos e execução

## Peças do projeto

| Caminho | Responsabilidade |
|---|---|
| prototipo/ | Produto atual: app de celular e painel desktop |
| prototipo/app.js e app.css | Telas, navegação, estado e apresentação |
| prototipo/api.js e config.js | Cliente da API e escolha do modo |
| prototipo/campus3d.js | Motor único do mapa, em Canvas |
| prototipo/plan-data.js | Planta gerada dos três andares |
| prototipo/admin.html, admin.js e admin.css | Painel da organização |
| prototipo/server.py | Servidor local e simulação autorizada de login com SuaPy |
| backend/app/main.py | Aplicação FastAPI e redirecionamento /q/{token} |
| backend/app/rotas/ | Autenticação, participante, público, organização e homologação |
| backend/app/modelos.py e db.py | Modelo SQLAlchemy, conexão e sessão do banco |
| backend/app/seguranca.py | Cookies, assinaturas de QR e papéis |
| backend/app/ao_vivo.py | Canal SSE em memória |
| backend/tests/ | Testes de API com pytest |
| deploy/ | Caddy + API + PostgreSQL em Docker Compose |
| api/index.py e vercel.json | Configuração alternativa de função Python e arquivos estáticos |
| app/ | Primeira versão React / Vinext; legado |
| modelo-3d/ | Cópia congelada do mapa; não editar |

## Caminho de uma chamada

No modo integrado: app → api.js → HTTP /api → FastAPI → dependências de sessão / permissão → SQLAlchemy → banco → JSON → interface.

No Docker: Caddy entrega os arquivos e encaminha /api e /q para a API. O navegador não conecta diretamente ao PostgreSQL.

## Escolha do modo

| Valor de api em config.js | Efeito |
|---|---|
| null | Demonstração no navegador, sem cliente da API |
| http://127.0.0.1:8011 | API local em outra porta; exige CORS compatível |
| string vazia | API na mesma origem; configuração entregue pelo deploy |

O cliente envia cookies com credentials: include. Ao iniciar com API, lê programação, avisos e perfil. O modo de avisos é SSE por padrão; vivo: consulta muda para consultas a cada 12 segundos.

## Offline

O service worker guarda arquivos do app e mapa. /api/ e /q/ ficam fora do cache. Sem conexão, pode ser mostrada a programação de exemplo embutida. A última programação vinda da API e presenças pendentes não têm sincronização offline implementada. As notificações atuais são locais; não há push de servidor com o app fechado.

## Rodar localmente

```sh
# App demonstrativo, na raiz
sh prototipo/rodar.sh
# http://127.0.0.1:8770
```

```sh
# API, na pasta backend; ambiente virtual já instalado
.venv/bin/python -m app.importar programacao seed/programacao.json
ETAL_LOGIN_DEV=1 .venv/bin/uvicorn app.main:app --port 8011
# http://127.0.0.1:8011/api/docs
```

Para conectar o app à API, configurar api com o endereço local em prototipo/config.js e liberar a origem em ETAL_ORIGENS. Usar o modo de desenvolvimento apenas no ambiente de teste. A apresentação e suas capturas não mudam essa configuração.

## Gerar e manter

```sh
npm run planta       # somente ao alterar a geometria, na fonte scripts/build-principal-plan.py
npm run pwa          # depois de mudar arquivos do protótipo
npm run export:html  # gera index.html da raiz a partir de prototipo/
npm run docs         # gera documentação, sem alterar o app
```

Não editar o index.html gerado. Preservar a geometria e as regras em docs/mapas.html. Atualizar a documentação local não publica nem muda o compartilhamento do Site original.

## Implantação e limites

Docker Compose usa PostgreSQL 16 e Caddy. A API roda com um processo porque o SSE vive na memória. Escalar exige distribuir os eventos por outro mecanismo. A configuração Vercel usa função Python e consulta periódica, com PostgreSQL externo. A existência desses arquivos não é evidência de implantação ativa.

O workflow backend.yml contém testes e uma etapa condicional de implantação. A documentação não presume uma rotina git flow nem um histórico de releases apenas por existir uma sugestão de fluxo.
