# Exportação local — ETAL Connect

Abra **index.html** por duplo clique para usar o protótipo offline. Abra **DOCUMENTACAO.html** para ler o contexto, decisões, fluxos, mapa, pendências e instruções de edição.

Pasta: `/home/kellyson/Documentos/Github/etal-connect-2026`.

Para continuar desenvolvendo: `npm ci`, editar `app/` e executar `npm run export:html`. Para alterar a planta, editar `scripts/build-principal-plan.py` e rodar `python3 scripts/build-principal-plan.py` antes de exportar. Para editar a documentação, alterar `scripts/build-export-docs.py` e executar esse script.

`index.html` incorpora o aplicativo, fontes, CSS, JavaScript e imagens utilizadas. A pasta `maps/` acompanha a prancha SVG. O fonte original, recursos e referências ficam nesta mesma pasta. `node_modules`, credenciais, caches e histórico Git não fazem parte da entrega. Não foi criado nem enviado repositório no GitHub.

A versão hospedada e o projeto original permanecem intactos. Os comandos abaixo em “documentação original” descrevem o projeto Vinext; a exportação HTML usa `npm run export:html`.

---

# Documentação original do protótipo

# ETAL Connect — Campus e comunidade

Protótipo independente de um aplicativo de evento inspirado na identidade do NADIC. React 19, React Native for Web (View, Text, Pressable, TextInput e StyleSheet), React Hook Form, Motion e react-zoom-pan-pinch. Vinext fornece o ambiente web.

## Executar

```sh
npm install
npm run dev -- --port 4173
```

O mockup do celular é o único elemento da página. Em celulares, ocupa a tela. Login, início, leitor, confirmação, perfil e credencial cabem sem rolagem nos tamanhos testados; listas e conteúdos extensos têm rolagem interna.

## Fluxo de participação

1. O primeiro acesso apresenta o login SUAP demonstrativo. Use os dados fictícios preenchidos. Um link abre o SUAP oficial em outra aba.
2. Após entrar, o usuário navega como **ainda não participante**. Programação, mapa, campeonatos e detalhes ficam disponíveis. Login institucional não confirma participação no evento.
3. A credencial permanece pendente até a primeira leitura de um QR reconhecido do evento.
4. Em **QR Code**, experimente Evento, Minicurso ou Palestra. A animação dura 2,1 segundos.
5. O QR do evento confirma somente a participação no ETAL. O QR de uma atividade confirma a participação no ETAL e também a presença naquela atividade, liberando seus materiais.
6. Repetir a leitura não duplica a presença. Um QR inválido não é aceito como credenciamento.
7. **Eu → Recomeçar demonstração** limpa a sessão e volta ao login.

Não há autenticação real, câmera nem comunicação com o SUAP. Matrícula e senha não são transmitidas ou persistidas. A chave `etal-demo-session-v4` do sessionStorage guarda apenas o acesso demonstrativo, o status de participação e as IDs de agenda/presenças. Não é um mecanismo de segurança ou um registro oficial.

## Mapa do campus

`app/data/campus-survey.json` é uma cópia integral das 35 marcações de `~/projetos/jogo-3d/assets/fase/implantacao_kml.json`. Contornos e coordenadas locais em metros são preservados, sem aplicar a ampliação de 1,2 usada pelo jogo.

O mapa mostra os prédios identificados, a passarela de entrada, o caminho ao anexo, jardins, áreas de árvores, árvores pontuais e o perímetro institucional. Oferece zoom, arraste, pinça, centralização, vista dos prédios ou do campus inteiro, camadas e seleção de espaços por toque ou teclado. A área exibida é calculada sobre o contorno do KML; contornos de cobertura não representam necessariamente a área útil ou as paredes.

A agenda e os detalhes de atividades mostram uma miniatura ampliada da sala, seu número e andar. O toque abre a planta interna do bloco principal no andar correspondente e aproxima a sala destacada. Selecionar uma sala mostra suas atividades. Campeonatos abrem o pátio no mapa externo. Números e distribuição de atividades são demonstrativos e precisam ser validados.

Procedência e arquivos originais: `docs/CAMPUS_REFERENCIAS.md`. O projeto Godot original não foi alterado. Não há chamadas à API do Google nem dependência de mapas de terceiros para desenhar a planta.

## Campeonatos

O atalho **Campeonatos** no início abre Mortal Kombat e FIFA. Cada modalidade tem descrição, formato, horário de exemplo, arena proposta, oito participantes fictícios e quatro confrontos ilustrativos. Os cards de localização abrem o pátio no mapa. Não há inscrição real nem competição em andamento.

## Conteúdo de referência

Datas e apresentadores se baseiam no VII ETAL de 26 a 28/11/2025, fornecido pelo usuário. A proposta visual é para 2026; as datas de 2025 não são datas confirmadas da edição de 2026. Salas, distribuição das atividades, campeonatos, participantes de jogos e materiais de apoio são demonstrativos. O aplicativo não é oficial do IFRN.

Uma futura integração poderá usar API Python e SuaPy, conforme autorização institucional. Autenticação, permissões e registros oficiais devem ser validados e implementados no servidor.

## Verificar

```sh
npx tsc --noEmit
npm run build
```

O app é carregado no navegador com `next/dynamic` e `ssr: false`, com uma abertura leve servida pelo servidor. Componentes React Native Web são importados individualmente em `app/components/native.ts`. React Native é dependência de desenvolvimento para os tipos compartilhados.

## Planta interna do bloco principal

Abra **Mapa → Principal → Explorar planta interna**. A planta usa as imagens e as correções manuais fornecidas pelo usuário, com térreo, 1º e 2º andar. Corredores horizontais têm salas dos dois lados; nos andares superiores o corredor inferior se estende à extremidade esquerda. A escada ocupa uma caixa lateral quadrada, e a rampa à direita tem a saliência da entrada.

A planta é esquemática, sem escala arquitetônica ou numeração oficial. A mesma geometria gera a prancha ampliada em `/maps/bloco-principal.svg`. Para regenerar o JSON e a prancha: `python scripts/build-principal-plan.py`.

O corredor lateral direito segue o mesmo alinhamento em todos os pisos. A recepção ocupa o fim da faixa inferior de salas do térreo, substituindo parte da última sala e deixando o corredor horizontal livre. O acesso desde a entrada utiliza a passagem ao lado da rampa de meia largura. O bebedouro aparece exclusivamente no canto inferior direito do 1º andar.

Os ambientes recebem números demonstrativos por andar (001…, 101…, 201…), mantendo a identificação do tipo de uso nos detalhes. As atividades usam associações propostas: React Native na Sala 201, FastAPI na Sala 204, experiência com IA na Sala 001, React/Next na Sala 108 e as duas palestras no auditório do térreo.
