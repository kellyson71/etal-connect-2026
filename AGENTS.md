# Continuidade do ETAL Connect

Leia `DOCUMENTACAO.html`, `docs/contexto.html`, `docs/mapas.html` e `docs/proximos-passos.html` antes de alterações amplas.

- Interface de aplicativo de evento, somente mockup do celular; não transformar em dashboard ou slides.
- “Swap” nas instruções do usuário significa SUAP. Login demonstrativo vem primeiro; participação só após QR válido.
- Preservar a identidade inspirada no NADIC, navegação normal, animações e telas iniciais compactas.
- Nenhuma integração SUAP ou presença oficial está implementada. Não solicitar credenciais reais nem apresentar mock como operação oficial.
- Exceção autorizada pelo usuário: `prototipo/` faz login de simulação no SUAP pelo servidor local `prototipo/server.py` (biblioteca suapy). Credenciais nunca vão para arquivos; o navegador recebe só nome, foto, curso, campus e matrícula. Presença, programação e materiais continuam mockados.
- Datas de referência são do VII ETAL de novembro de 2025. A proposta se chama 2026; não inventar programação oficial.
- Salas e alocações demonstrativas. Preservar invariantes geométricas descritas em `docs/mapas.html`, especialmente recepção na faixa inferior de salas, corredor livre, escada oeste, rampa em toda a largura até o meio da linha da recepção, patamar aberto abaixo dela (entrada no térreo) e bebedouro só no 1º andar, no canto inferior esquerdo do patamar.
- Editar a geometria em `scripts/build-principal-plan.py` e rodar `npm run planta` (gera JSON, SVG e `prototipo/plan-data.js` e confere as regras).
- O `index.html` da raiz é gerado a partir de `prototipo/` por `npm run export:html` (`scripts/export-prototipo.py`). Não editar o arquivo gerado.
- `app/` é a primeira versão, em React (Vinext). Ficou como legado; o produto é o `prototipo/`, com um motor de mapa só (`campus3d.js`). A exportação antiga continua em `npm run export:html:react`, que precisa de `npm ci`.
- Depois de mudar arquivos do protótipo, rodar `npm run pwa` para atualizar a versão do cache offline (`prototipo/sw.js`).
- Atualizar esta exportação local não autoriza alterar compartilhamento ou publicar a versão hospedada. O manifest retido pertence ao Site original.

## Protótipo (`prototipo/`)

- Abrir com `prototipo/rodar.sh` (http://127.0.0.1:8770). Atalhos de teste: `?tela=`, `?qualidade=alta|media|simples`, `?tema=dark`, `?paleta=mel`.
- Modo Evento é o padrão do mapa: bloco principal, auditório, cantina e pátio têm cor; o resto é neutro.
- `campus3d.js` tem quatro versões: 3D completo, médio e leve, e 2D simples. O automático usa aparelho, teste de velocidade e medição da animação real; depois de "Testar desempenho", usa a versão recomendada pelo teste (`etal-q-teste`); só o 2D simples não tem 3D. Perfil → Personalizar → Mapa permite forçar qualquer versão, ver o FPS (`?fps=1`) e rodar o teste do aparelho.
- O botão de voltar do celular usa o histórico do navegador (`navMark`, `navPush`). Toda navegação nova precisa marcar o ponto de retorno.
- A aba Campus usa as cores reais das fotos. Atividades além das seis originais são de exemplo (`demo: true`).
- Login: SUAP ou conta de visitante (nome, e-mail, perfil, instituição, cidade, consentimento), salva só no aparelho (`etal-visitante`).
- PWA: `manifest.webmanifest` e `sw.js`. Instalação e uso sem internet só em HTTPS ou em 127.0.0.1. Lembretes 10 min antes, pelo relógio do evento ("Horário do céu"), salvos em `etal-lembretes`.
- Painel da organização (`?tela=org`) e "Sobre este protótipo" (`?tela=sobre`), que separa o real do exemplo. Manter essa tela atualizada quando algo passar de exemplo para real.
- Temas e preferências ficam em `etal-ui` (localStorage). As cores derivam do destaque com contraste garantido.
- `modelo-3d/` é uma cópia congelada do mapa, de antes das otimizações. Não editar lá.
- O bloco principal tem três entradas: principal, auditório e Anexo. A do Anexo é o corredor da esquerda no térreo, que segue reto até a saída do auditório (confirmado pelo usuário).
- O auditório é um volume só, alto e mais baixo que o bloco (`AUD_H` em `campus3d.js`), com fachada curva, faixa de pastilha azul e janelas estreitas. Acima dele não há andares: os andares de cima mostram o telhado dele.
- No modo Evento, o obelisco também aparece em destaque, como ponto de referência.
