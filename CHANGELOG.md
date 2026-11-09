# Histórico de versões

O projeto segue o git flow: `main` tem só versões publicadas, `develop` junta as funcionalidades e cada uma nasce num ramo `feature/*`.

## 0.4.0 (2026-11-09)

Primeiro teste como produção.

- Entrada pelo SUAP de duas formas: pela página do SUAP (OAuth2) ou com matrícula e senha (token JWT da API do SUAP). Senha e token não ficam guardados.
- Sem moldura de celular nem enfeites de demonstração quando há servidor.
- Mapa pensado para o polegar: abas e busca embaixo, 3D/2D e controles numa coluna à direita; sai o cartão "Onde o ETAL acontece".
- Busca colada no teclado, com Banheiro, Bebedouro e Descanso à mão e o botão Atividades; o melhor resultado fica junto da barra, e Enter abre com a rota.
- Rota até o bebedouro mais próximo.
- Pátio interno: jardim só no térreo; no 1º e 2º andar, vão aberto com mureta de ponta a ponta.
- Documentação técnica (requisitos, casos de uso, banco de dados, arquitetura, API e testes).

## 0.3.0 (2026-11-09)

O app passa a funcionar de verdade, com servidor.

- API em FastAPI com banco (SQLite para desenvolver, PostgreSQL em produção): entrada pelo SUAP (OAuth2) e de visitante por link no e-mail, programação, agenda com vagas, presença por QR assinado, avisos ao vivo e painel da organização.
- App e painel ligados à API; sem ela, seguem com os dados de exemplo.
- Leitor de QR com a câmera do aparelho (BarcodeDetector ou jsQR) e QR lido pela câmera do celular abrindo o app.
- Página `/homologacao` com entrada de teste e os QRs para ler; `/demo` com as ferramentas de teste no leitor.
- Versão de teste na Vercel (API como função Python e PostgreSQL Neon), publicada a cada push no GitHub.
- Implantação no IFRN com Docker Compose e Caddy; testes no GitHub Actions.

## 0.2.0 (2026-11-09)

Mapa e planta revisados com o campus de hoje.

- Crachá que desce puxando, conquista da colmeia e participação confirmada.
- Entorno da BR-405: apartamentos, Elétrica, Brisanet, faixas, calçada, postes e as duas entradas.
- Planta interna refeita a partir das plantas de 2012, com o uso atual das salas e marcas com ícones.
- Sol e sombras pelo horário, luzes da noite, jardim e obra do prédio novo do NADIC.
- Busca por salas, atividades, banheiros e bebedouros, com o mais próximo primeiro.
- Animação de entrada do mapa e rota automática antes da atividade.

## 0.1.0 (2026-11-07)

Primeiro protótipo navegável.

- Telas do app: entrada, início, programação, agenda, atividade, crachá e QR do evento.
- Mapa do campus em 3D, com os prédios do fundo importados do KML e o entorno.
- Planta do bloco principal e rota a pé até a sala.
- PWA instalável, com uso sem internet.
- Painel da organização para computador.
