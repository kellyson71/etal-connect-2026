# 01 · Estado do produto e decisões abertas

Este arquivo mantém seu caminho antigo para preservar os links. Seu conteúdo é um inventário da implementação, não um levantamento formal de requisitos.

## Como o trabalho aconteceu

Protótipo → experimentar telas → ajustar com o usuário → implementar fluxos e API → documentar o resultado. As decisões do evento ainda precisam ser validadas com quem vai operá-lo.

## Situação por parte do produto

| Parte | Evidência no código | Limite atual |
|---|---|---|
| App de participante | Telas, navegação, crachá, agenda, leitor de QR e personalização em prototipo/ | O modo padrão usa api: null, com dados de exemplo |
| Identificação | Simulação local SuaPy; API com OAuth2, entrada direta SUAP e link de visitante | OAuth2 e e-mail dependem de configuração; autenticar não credencia |
| Programação e agenda | API de consulta e de atividades salvas, com verificação de vagas | Programação embutida e seed são demonstrativas, baseadas em 2025 |
| Presença | API valida QR assinado e janela; credencia e registra atividade sem duplicar | Não grava presença no SUAP nem emite certificado oficial |
| Mapa | Campus, três andares, busca e rota no Canvas | Sem localização GPS interna; números e alocações demonstrativos |
| Avisos e salas | API de avisos, troca de sala e numeração; cliente SSE / consulta | SSE usa memória de um processo; consulta periódica na configuração Vercel |
| Organização | Painel desktop e rotas /api/org | Participantes, gráficos, credenciamento e CSV do painel ainda usam simulação |
| PWA | Manifest e service worker guardam o app e o mapa | API e QR não entram no cache; não existe fila de presença offline |
| Materiais e certificados | Telas e dados de demonstração | Entrega acadêmica e certificação oficial não estão integradas |

## Decisões que precisam de conversa com a organização

- Datas, programação, salas, vagas e responsáveis pela edição a operar.
- Quais leituras de QR contam como presença e quais regras valem para certificação.
- Acesso institucional, envio de e-mail e perfis de organização.
- Tratamento de dados, consentimento e rotinas de suporte.
- Atendimentos sem celular ou sem conexão e conferência manual dos registros.

## Cuidados de continuidade

- O produto do participante continua sendo um app de celular; o formato de slides é apenas para a documentação.
- Entrar vem antes de credenciar. Só um QR válido ou ação autorizada da organização confirma o credenciamento no modo API.
- A proposta se chama 2026. A programação de referência é do VII ETAL, de 26 a 28 de novembro de 2025; não é calendário oficial de 2026.
- Não inferir produção ou integração oficial pela existência de uma tela, rota ou arquivo de deploy.
