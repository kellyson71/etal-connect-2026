# Demonstração com a programação do VII ETAL

Execute `sh scripts/rodar-demo.sh` na raiz. App: http://127.0.0.1:8770; API: http://127.0.0.1:8011/api/docs. O login é feito com matrícula e senha do SUAP. Não há botão de entrada alternativa; o runner desabilita `/api/auth/dev`. A matrícula administradora autorizada é reconhecida após a autenticação normal. No leitor, somente administradores veem o menu simples “Debug · QR Codes”, que usa os QRs assinados do banco local. O endpoint de debug exige papel de organização e `ETAL_DEMO=1`.

O banco SQLite `backend/demo-etal.db` fica separado do banco normal e fora do Git. A preparação é repetível: atualiza 21 atividades, oito participantes de exemplo, uma matrícula administradora autorizada, agenda/presenças simuladas e um cenário com quatro campeonatos e seis publicações. Postagens e campeonatos começam no banco; as interações e a moderação seguem locais no navegador. Não importamos inscrições, documentos, contatos ou presenças oficiais.

## Fonte e adaptações

A fonte da programação é https://suap.ifrn.edu.br/eventos/inscricao/1/8528/ (VII ETAL, novembro de 2025). `backend/seed/suap-vii-etal-publico.json` preserva os 15 títulos, tipos, IDs e horários públicos. O app mantém seis minicursos, três palestras, duas mesas-redondas, abertura, duas apresentações culturais e encerramento. Cada atividade mantém `suapId`, `sourceType` e `sourceUrl`. Não é programação oficial de 2026.

As alocações de salas e os conteúdos de apoio foram preparados para explorar o mapa. MK11, FIFA, VALORANT e Guitar Hero III foram conferidos no local; horários, regras, jogadores e vencedores são simulados. FIFA usa arte de FIFA 23 sem atribuir essa edição ao evento original. Fontes e créditos das quatro artes em `prototipo/assets/games/CREDITOS.txt`.

## Eventos pessoais e certificados

`ETAL_SUAP_PORTAL=1` permite consultar a aba do titular no portal, após autenticação por senha. A sessão web é independente do JWT do SUAP e fica apenas na memória por até 20 minutos, vinculada a cookie aleatório do login. Senha, tokens e URLs privadas não são gravados. O navegador recebe somente os metadados e um identificador opaco por certificado; o servidor verifica a sessão e devolve PDF, com limite de 8 MB. Não há inscrição automática, emissão de certificados ou presença oficial. Login demonstrativo não herda a consulta de uma conta real. Mudanças no HTML ou exigência de autenticação adicional podem exigir abrir o SUAP.

## Atualizar e verificar

`python3 scripts/preparar-demo-etal.py` atualiza o snapshot público e os seeds (requer BeautifulSoup). Depois use `npm run pwa` e `npm run export:html`. Reinicie o runner para reaplicar o seed. Testes: `cd backend && .venv/bin/python -m pytest -q`; `npm run test:comunidade`.

Para começar a apresentação sem agenda, credenciamento nem presenças prévios da matrícula administradora: `sh scripts/rodar-demo.sh --reiniciar-admin`. Esse parâmetro afeta somente o usuário administrador no SQLite local. As telas de uso omitem rótulos demonstrativos por decisão do projeto; a origem e as adaptações permanecem registradas nesta documentação e nos metadados do seed.

## Oficina do autor

“Entendendo e programando com agentes de IA”, de Kellyson Raphael, foi adicionada ao primeiro dia para a apresentação. Conteúdo e foto foram fornecidos pelo próprio ministrante; não pertencem ao snapshot histórico das 15 atividades do SUAP. A configuração está em `backend/seed/oficina-kellyson.json` e é preservada pelo gerador. O horário existente de 16:30–17:30 e o Auditório são alocações para a apresentação. A foto do ministrante é independente da foto pessoal editável. Um cartão no perfil leva à única atividade ministrada.
