# 08 · PWA e demonstrações dentro dos slides

## Por que a implementação atual é uma PWA

O produto atual está em HTML, CSS e JavaScript, com o mapa desenhado em Canvas. O acesso por link, a instalação pelo navegador e o cache dos arquivos favorecem a distribuição de um app de evento e reaproveitam a base que já existe.

Essa é uma leitura da implementação e do contexto do projeto, não uma ata de decisão formal nem o resultado de um benchmark entre tecnologias.

| Aspecto | PWA atual | Alternativa React Native |
|---|---|---|
| Entrada | Link no navegador; instalação quando suportada | Aplicativo nativo com seu processo de distribuição |
| Código existente | Reaproveita diretamente o app web e o Canvas | Exigiria adaptar as partes dependentes do navegador |
| Sem rede | Service worker e Cache Storage guardam a interface | Seria necessário definir uma estratégia de armazenamento e sincronização |
| Integração com o aparelho | Depende das APIs e permissões disponíveis no navegador | Permite uma abordagem nativa, com outras decisões de build e integração |

A escolha atual não resolve sozinha o uso sem rede. API e links de QR ficam fora do cache; presença precisa de confirmação do servidor. Instalação e recursos variam por navegador e exigem contexto seguro. Não há fila de presenças offline nem push de servidor implementados.

Fontes técnicas: [service workers](https://web.dev/learn/pwa/service-workers), [ambiente React Native](https://reactnative.dev/docs/set-up-your-environment) e [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API).

## Como as demonstrações da apresentação funcionam

| Demonstração | Fonte | Isolamento |
|---|---|---|
| App e cards | docs/demos/app.html, gerado de prototipo/index.html; usa os JS e CSS atuais | Iframe com sandbox; API desabilitada; armazenamento da sessão principal não é compartilhado |
| Mapa do campus | docs/demos/campus.html e campus.js, carregando os arquivos reais do mapa | Mesmo sandbox; controles enviam comandos limitados por postMessage |
| Planta comparada | Figuras de 2012 e SVGs gerados a partir de PLAN | Comparação visual; não altera geometria |
| Banco | Modelo SQLAlchemy capturado em evidencias.json | Seleção visual; não consulta registros de pessoas |
| Offline e GPS | Diagramas explicativos | Não desligam a rede nem captam localização |

As demos carregam ao entrar no slide e são descarregadas ao sair. Isso evita manter vários mapas animando ao mesmo tempo. O modo de redução de movimento é respeitado. O PDF usa imagens atuais no lugar dos iframes.

## Manutenção

- Conteúdo e demos geradas: scripts/build-documentacao.py.
- Aparência e movimento: docs/assets/apresentacao.css e apresentacao.js.
- Referências e contratos: scripts/documentacao_base.py e docs/tecnico/*.md.
- Capturas do app e Swagger: scripts/capturar-documentacao.py.
- Cenas amplas do motor: scripts/capturar-cenas-documentacao.py.
- Geração final: npm run docs; PDF: npm run docs:pdf.

As fontes das imagens ficam em docs/assets/fontes/, com crédito e procedência em creditos.json. Não adicionar a dissertação e as referências ao cache do aplicativo.
