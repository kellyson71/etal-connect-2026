# Continuidade do ETAL Connect

Leia `DOCUMENTACAO.html`, `docs/contexto.html`, `docs/mapas.html` e `docs/proximos-passos.html` antes de alterações amplas.

- Interface de aplicativo de evento, somente mockup do celular; não transformar em dashboard ou slides.
- “Swap” nas instruções do usuário significa SUAP. Login demonstrativo vem primeiro; participação só após QR válido.
- Preservar a identidade inspirada no NADIC, navegação normal, animações e telas iniciais compactas.
- Nenhuma integração SUAP ou presença oficial está implementada. Não solicitar credenciais reais nem apresentar mock como operação oficial.
- Exceção autorizada pelo usuário: `prototipo/` faz login de simulação no SUAP pelo servidor local `prototipo/server.py` (biblioteca suapy). Credenciais nunca vão para arquivos; o navegador recebe só nome, foto, curso, campus e matrícula. Presença, programação e materiais continuam mockados.
- Datas de referência são do VII ETAL de novembro de 2025. A proposta se chama 2026; não inventar programação oficial.
- Salas e alocações demonstrativas. Preservar invariantes geométricas descritas em `docs/mapas.html`, especialmente recepção na faixa inferior de salas, corredor livre, escada oeste, rampa em toda a largura até o meio da linha da recepção, patamar aberto abaixo dela (entrada no térreo) e bebedouro só no 1º andar, no canto inferior esquerdo do patamar.
- Editar a geometria em `scripts/build-principal-plan.py`, regenerar JSON/SVG e depois executar `npm run export:html`.
- O HTML é gerado: editar fonte em `app/`, não o bundle minificado no `index.html`.
- Atualizar esta exportação local não autoriza alterar compartilhamento ou publicar a versão hospedada. O manifest retido pertence ao Site original.

## Protótipo (`prototipo/`)

- Abrir com `prototipo/rodar.sh` (http://127.0.0.1:8770). Atalhos de teste: `?tela=`, `?qualidade=alta|media|simples`, `?tema=dark`, `?paleta=mel`.
- Modo Evento é o padrão do mapa: bloco principal, auditório, cantina e pátio têm cor; o resto é neutro.
- `campus3d.js` tem quatro versões: 3D completo, médio e leve, e 2D simples. O automático usa aparelho, teste de velocidade e medição da animação real; depois de "Testar desempenho", usa a versão recomendada pelo teste (`etal-q-teste`); só o 2D simples não tem 3D. Perfil → Personalizar → Mapa permite forçar qualquer versão, ver o FPS (`?fps=1`) e rodar o teste do aparelho.
- O botão de voltar do celular usa o histórico do navegador (`navMark`, `navPush`). Toda navegação nova precisa marcar o ponto de retorno.
- A aba Campus usa as cores reais das fotos. Atividades além das seis originais são de exemplo (`demo: true`).
- Temas e preferências ficam em `etal-ui` (localStorage). As cores derivam do destaque com contraste garantido.
- `modelo-3d/` é uma cópia congelada do mapa, de antes das otimizações. Não editar lá.
- O bloco principal tem três entradas: principal, auditório e Anexo. A do Anexo é o corredor da esquerda no térreo, que segue reto até a saída do auditório (confirmado pelo usuário).
- O auditório é um volume só, alto e mais baixo que o bloco (`AUD_H` em `campus3d.js`), com fachada curva, faixa de pastilha azul e janelas estreitas. Acima dele não há andares: os andares de cima mostram o telhado dele.
- No modo Evento, o obelisco também aparece em destaque, como ponto de referência.
