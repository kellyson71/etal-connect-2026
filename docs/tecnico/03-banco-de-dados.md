# 03 · Banco de dados e persistência

O modelo está em backend/app/modelos.py, com SQLAlchemy 2. A apresentação mostra uma visão resumida e oferece um dicionário completo extraído do modelo.

## Relações centrais

| Origem | Relação | Destino | Significado |
|---|---|---|---|
| pessoas | 1 → N | agenda | Uma pessoa salva várias atividades |
| atividades | 1 → N | agenda | Uma atividade pode ser salva por várias pessoas |
| pessoas | 1 → N | presencas | Uma pessoa pode ter várias presenças |
| atividades | 1 → N | presencas | Uma atividade pode ter várias presenças |
| pessoas | 1 → N | links_acesso | Links de entrada de um visitante |
| pessoas | 1 → N | avaliacoes | Uma pessoa avalia cada atividade uma vez (avaliar de novo substitui) |
| atividades | 1 → N | avaliacoes | Notas, comentários rápidos e comentário aberto de uma atividade |
| pessoas | 0 ou 1 autor por aviso | avisos | autor_id é anulável |
| atividades | 0 ou 1 atividade por aviso | avisos | atividade_id é anulável; aviso pode ser geral |

## As sete tabelas

| Tabela | Guarda | Regra principal |
|---|---|---|
| pessoas | Identidade, origem, papel e credenciamento | Matrícula e e-mail têm unicidade quando preenchidos |
| atividades | Programação, horário, local, vagas e extra JSON | id é o identificador textual usado pelo app |
| agenda | Relação pessoa / atividade salva | Par pessoa_id + atividade_id é único |
| presencas | Relação pessoa / atividade, horário e via | Par pessoa_id + atividade_id é único |
| avisos | Título, texto, data, autor e atividade opcionais | Autor e atividade podem ser removidos sem apagar o aviso |
| links_acesso | Hash do token, validade e momento de uso | Token de visitante é único e de uso único |
| numeros_sala | Número personalizado por chave andar:zona | Não tem FK: zonas pertencem à planta no app |
| avaliacoes | Nota de 1 a 5, comentários rápidos (JSON) e comentário aberto | Par pessoa_id + atividade_id é único; só existe depois da saída registrada em presencas.saida_em |
| configuracoes | Chave e valor curtos mudados pelo painel | Hoje guarda a versão do link da planilha; trocar a versão invalida o link anterior |

Além das tabelas, duas colunas sustentam o perfil e a avaliação: pessoas.cartao (JSON com o perfil preenchido no app: NADIC, linguagens, interesses, o que a pessoa procura, contato, frase e fundo do crachá) e presencas.saida_em (hora da segunda leitura do QR da sala, no fim da atividade). As duas vieram na migração 0005.

## Distinções que evitam confusão

- Credenciamento no evento fica em pessoas.credenciado_em. Não existe uma tabela separada de credenciamentos.
- Agenda é intenção / seleção. Presença é um registro diferente.
- Presença e saída ficam na mesma linha de presencas: a primeira leitura grava em, a segunda (perto do fim) grava saida_em.
- O painel vê as avaliações sem o nome de quem avaliou; a ligação com a pessoa fica só no banco, para impedir avaliação repetida.
- materiais e outros complementos podem aparecer em atividades.extra; os conteúdos atuais são de demonstração.
- Não existe tabela de salas arquitetônicas. A geometria e as zonas vêm de prototipo/plan-data.js.
- A tabela pessoas não tem coluna de senha. links_acesso guarda hash, não o token de entrada em texto aberto.

## Onde os dados ficam

| Ambiente | Persistência |
|---|---|
| Demonstração sem API | Estado no navegador; visitante, preferências e alterações demonstrativas do painel no aparelho |
| Desenvolvimento da API | SQLite, por padrão sqlite:///./etal.db |
| Docker Compose | PostgreSQL 16 com volume pg_dados |
| Função Vercel | PostgreSQL configurado por ETAL_BANCO, DATABASE_URL ou POSTGRES_URL |

Horários das atividades usam data e HH:MM locais; o fuso de referência é America/Fortaleza. O esquema é criado com create_all ao iniciar. Não há migrações versionadas implementadas; mudanças com dados persistentes precisam de uma estratégia própria antes da operação.

## Dicionário completo

Na apresentação, cada tabela pode ser aberta para consultar nomes, tipos, nulabilidade, PK, FK e unicidade. A fonte legível por máquina está em docs/assets/evidencias.json, extraída diretamente do SQLAlchemy. Atualizar com python3 scripts/docs/capturar-documentacao.py depois de mudar o modelo.
