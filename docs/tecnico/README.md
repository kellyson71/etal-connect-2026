# ETAL Connect · por dentro do projeto

A documentação principal é uma apresentação dinâmica de 22 slides, com telas atuais, fontes originais, demonstrações do app e do mapa, banco interativo e capturas do Swagger.

[Abrir a apresentação](documentacao-tecnica.html) · [Entrada pela raiz](../../DOCUMENTACAO.html)

O projeto cresceu por experimentação e ajustes no protótipo. Não houve reuniões formais de requisitos. Estes documentos descrevem a implementação observada no repositório em novembro de 2026; não reconstituem atas, entrevistas, prioridades aprovadas ou validações que não aconteceram.

## Como ler

| Primeiro | Depois, se precisar de detalhe |
|---|---|
| Jornada e casos de uso | [Fluxos observados](02-casos-de-uso.md) |
| O que existe / é demonstração / depende de validação | [Estado do produto](01-requisitos.md) |
| Arquitetura e modos do app | [Estrutura e execução](04-arquitetura.md) |
| Modelo do banco, em partes | [Persistência](03-banco-de-dados.md) e dicionário da apresentação |
| Swagger e chamada real | [API](05-api.md) e tabela de rotas da apresentação |
| Evidências e próximos passos | [Verificação](06-testes.md) |
| Plantas, satélite e lógica de localização | [Mapa e fontes](07-mapa-e-fontes.md) |
| PWA, alternativa nativa e demos dos slides | [PWA e apresentação](08-pwa-e-apresentacao.md) |

## Atualizar a documentação

```sh
npm run docs
# Gerar também o PDF, com Chrome e Playwright locais:
npm run docs:pdf
# Atualizar também as capturas e os contratos extraídos do código:
python3 scripts/capturar-documentacao.py
npm run docs
```

O gerador não usa CDN: fontes, imagens, estilos, navegação e referências são locais. As capturas exigem Playwright no Python que executa o script, Chrome e backend/.venv instalado. A API da captura usa SQLite temporário e programação de exemplo. Nenhuma conta real é utilizada.

A apresentação já abre em slides. Setas, Page Up / Page Down e os controles de baixo navegam; F ativa a tela cheia. O índice permite saltar para qualquer quadro. Fontes e detalhes abre documentos, galeria e contratos. Imagens ampliam com um clique. O PDF registra as mesmas 22 páginas em paisagem, com capturas estáticas no lugar das demos.

A versão interativa abre por arquivo local no Chrome, mas o servidor local oferece maior compatibilidade para os iframes: `python3 -m http.server 8870 --bind 127.0.0.1`, e depois http://127.0.0.1:8870/DOCUMENTACAO.html.

A apresentação descreve configurações de hospedagem presentes no código. Não atesta o estado atual de serviços publicados e não publica o projeto.
