# Investigação: eventos e inscrições no SUAP

Consulta em **12/11/2026**, iniciada pela documentação pública do IFRN e depois ampliada com acesso temporário autorizado pelo titular. A investigação não implementa integração nem altera inscrições ou presenças. Resultados pessoais e credenciais não foram arquivados. As referências de programação são do VII ETAL de **26 a 28 de novembro de 2025**.

**Resultado atualizado:** a API autenticada fornece catálogo e programação, inclusive do VII ETAL finalizado. Os eventos relacionados à conta podem ser consultados na aba Participante do site, em `/admin/eventos/evento/?tab=tab_participante`. Não identifiquei essa listagem pessoal no OpenAPI. Para minicursos, foi possível observar correspondência nominal na programação pública; o vínculo por ID do participante e o estado da inscrição ainda não foram confirmados.

## Atualização: teste autenticado autorizado

- Login JWT pela API e sessão institucional pelo site funcionaram para a conta autorizada. Os resultados descrevem esse teste, não garantem acesso idêntico a todos os perfis ou aplicações OAuth.
- O catálogo retornou HTTP 200, paginação de 100 itens e 9.029 eventos na consulta. O evento público 8528 retornou como `Finalizado`, com 15 atividades, das quais seis minicursos. Datas e horários vieram efetivamente preenchidos.
- A aba **Participante** retorna HTML com os eventos vinculados à conta e links de certificados. O parâmetro correto é `?tab=tab_participante`; `tab=...` encontrado em links relativos é tratado pelo JavaScript de abas, não faz parte do caminho do evento.
- A Área do Participante continuou pedindo identificação separada. A consulta do próprio titular localizou o participante e mostrou uma segunda etapa com `email` e `chave_acesso`. A sessão institucional não dispensou essa chave no fluxo observado. O link de reenvio de confirmação não foi acionado.
- A comparação em memória entre o nome do perfil e as listas públicas encontrou atividades correspondentes. Nenhum nome, lista pessoal, resultado de inscrição individual, matrícula, CPF, e-mail ou link privado de certificado foi copiado para o repositório.
- A aba pessoal e a conferência nominal são evidências diferentes: a primeira vincula eventos à sessão; a segunda ainda não comprova por ID a inscrição nem distingue solicitação, confirmação, cancelamento ou presença.

Autenticação e consultas foram feitas com clientes HTTP mantidos em memória. A sessão web temporária foi encerrada pelo logout, e o processo descartou os tokens e cookies. A evidência REA pública anterior continua separada; ela não contém esta sessão autenticada.

## Evidências verificadas

- [OpenAPI oficial](https://suap.ifrn.edu.br/api/openapi.json): HTTP 200; 99 caminhos e 101 operações no arquivo obtido. Hash e recorte do contrato em [evidencias-suap-eventos.json](evidencias-suap-eventos.json).
- `GET /api/midia/eventos/ativos-deferidos/`: documentado como lista paginada de eventos ativos e deferidos. O GET sem autenticação retornou **401**, `{"detail":"Unauthorized"}`. Documentação pública não significa acesso anônimo aos dados.
- O contrato aceita autenticação JWT, OAuth2 ou sessão web nessa rota. Acesso JWT foi posteriormente validado com a conta autorizada; escopos OAuth e demais perfis continuam sem validação.
- A versão **1.4.1** de `suapy` instalada no protótipo já implementa a rota em `Suap.ensino.obter_eventos()`, em `modules/ensino.py`. Esse método é catálogo, não lista pessoal de inscrições.

## O que o contrato oferece para o app

| Informação | Evidência no contrato | Utilidade |
|---|---|---|
| Evento | `EventoSchema.id`, `nome`, `apresentacao`, `imagem`, `site` | Identidade, descrição e arte |
| Campus e local | `campus_id`, `campus_sigla`, `campus_nome`, `local`, `localizacao` | Recorte pelo campus; o contrato não prova a sala interna ou coordenadas |
| Datas e períodos | início/fim do evento e `periodos_inscricoes` | Agenda e indicação de inscrições abertas |
| Programação | `programacao[].data` e `atividades[]` | Importação de atividades por dia |
| Atividade | `AtividadeEventoSchema.id`, `tipo`, `descricao`, datas, horas e carga horária | Minicursos, palestras e demais atividades |
| Capacidade | `limite_inscricoes`, `vagas_disponiveis` | Exibir disponibilidade, quando preenchida |
| Links | `link_suap`, links de submissão | Abrir o fluxo oficial no SUAP |
| Perfil e vínculo | `/api/rh/eu/`, `/api/rh/meus-vinculos/`, `/api/ensino/meus-dados-aluno/` | Nome/foto, campus e curso, conforme conta e autorização |

A resposta autenticada foi posteriormente validada para o VII ETAL: o evento finalizado aparece e contém programação. Campos opcionais continuam podendo vir nulos. O único filtro de consulta declarado nessa operação é `page`; filtro de campus pode precisar ocorrer no nosso servidor.

O contrato de atividade não declara um campo próprio de sala, palestrante ou materiais. Descrições podem conter nomes, mas isso não prova uma estrutura separada para essas informações.

As rotas acadêmicas de aulas, diários e turmas virtuais também existem. Elas não comprovam inscrição em minicurso de evento: ensino regular e eventos são domínios diferentes.

## O que falta para “meus minicursos”

Nesse OpenAPI não identifiquei rotas para:

- Listar inscrições do usuário em eventos.
- Listar atividades escolhidas por ele dentro de um evento.
- Consultar sua confirmação, presença ou certificado de evento.
- Inscrever, cancelar inscrição ou registrar presença no módulo de eventos.

Isso significa **não documentado neste esquema**, não que seja impossível obter a informação ou que não exista alguma rota legada/interna. O catálogo não contém o vínculo pessoa → inscrição → atividade; ter a programação completa não resolve essa associação.

## Caminho web encontrado

O [registro do VII ETAL no portal do IFRN](https://portal.ifrn.edu.br/eventos/8528/) aponta para:

1. [Página do evento no SUAP](https://suap.ifrn.edu.br/eventos/inscricao/1/8528/). O HTML público obtido mostrou programação e listas nominais de participantes por atividade. Nenhum nome dessas listas foi incluído nos arquivos de evidência.
2. [Área do Participante](https://suap.ifrn.edu.br/eventos/area_do_participante/8528/). Em sessão vazia, mostrou formulário POST com e-mail e CPF. Nenhum formulário foi enviado.

A [Central de Ajuda do SUAP](https://ajuda.suap.ifrn.edu.br/comunicacao-social/eventos/) também descreve acompanhamento pela Área do Participante, com chave de acesso enviada por e-mail. O formulário observado e o fluxo descrito pela ajuda não bastam para afirmar como o SUAP associa uma sessão autenticada às inscrições.

A lista pública possibilita uma **correspondência indicativa por nome**, mas não deve virar confirmação automática: homônimos, nome social, grafia diferente e situação da inscrição podem produzir erros. Não foi verificado se essa lista distingue inscrição solicitada, confirmada, cancelada ou presença.

## Precisamos de engenharia reversa?

**Para catálogo e programação, não:** começar pela API existente.

**Para eventos pessoais, a aba Participante autenticada já foi validada. Para a situação individual do minicurso, a investigação continua aberta.** A Área do Participante exigiu uma chave própria; falta determinar:

- Se a página já traz eventos, atividades e situação da inscrição no HTML.
- Se ela consulta uma API JSON não publicada nesse OpenAPI.
- Como entram a sessão web, o OAuth e a chave do participante.
- Quais identificadores estáveis ligam a inscrição à atividade.

A observação pública com a skill [reverse-engineer-anything](/home/kellyson/.agents/skills/reverse-engineer-anything/SKILL.md) usou REA/Chromium em perfil temporário vazio, acessou a Área do Participante e aguardou o `body`. O navegador foi encerrado pelo provedor. O [resumo sanitizado](evidencia-rea-suap-publico.json) mantém a referência da evidência e suas limitações: 100 eventos de rede retidos, 12 omitidos pelo orçamento, sem corpos ou valores de cabeçalhos. Esse recorte **não demonstra ausência de APIs internas**.

Não foi necessário desmontar aplicativo ou buscar binários. Se for preciso mapear o fluxo web, trata-se de observar HTML e requisições que o acesso legítimo do participante realiza, mantendo os limites de permissão da conta.

## Caminho de implementação recomendado

1. **Catálogo:** consumir a rota existente pelo servidor, identificar o evento e aproveitar os IDs oficiais de evento/atividade; manter a associação entre sala oficial e planta do app explícita.
2. **Inscrição pessoal:** confirmar o fluxo web identificado antes de implementar. Se houver API adequada e autorização, preferi-la; caso exista apenas HTML, avaliar um adaptador de leitura e sua manutenção.
3. **Produção:** solicitar à equipe do SUAP uma operação oficial equivalente a “minhas inscrições”, caso ela não esteja disponível. Não confundir OAuth de identificação com autorização automática para dados de eventos.
4. **Alternativa já viável no projeto:** importação de CSV fornecido pela organização. O importador atual cadastra pessoas; ainda não mapeia minicursos, estados de inscrição ou presenças por atividade.

O login atual em `prototipo/server.py` fecha o cliente `Suap` após ler o perfil. Ele não mantém uma sessão de eventos e não deve passar tokens ao navegador. `suapy.login()` usa `/api/token/pair` e cabeçalho Bearer; esse comportamento não demonstra login nas páginas HTML. Uma futura coleta precisará ser feita no contexto de autenticação adequado, pelo servidor.

Nenhuma alteração foi feita no login, no app ou no backend durante esta investigação. Na fase pública não houve identificação de participante. Na fase autenticada, o titular forneceu acesso temporário: dados estritamente necessários às consultas ficaram somente em memória, sem gravação de senha, tokens, cookies ou identidade nos arquivos do projeto.


## Integrações adicionais: inscrição e certificados

Verificação complementar em 12/11/2026, sem nova autenticação nem envio de inscrição:

- O catálogo público de inscrições abertas conduz a formulários reais de inscrição. Em um evento aberto, o primeiro passo observado foi um POST com CSRF, nacionalidade, CPF, país/passaporte e a ação `Continuar`. Esse primeiro passo não comprova o envio completo de inscrição nem a escolha individual de minicurso. Nenhuma etapa foi submetida.
- A ajuda oficial descreve identificação, dados pessoais e confirmação do tipo de participação. Inscrições podem ficar pendentes de confirmação pela organização; a interface do app deve refletir a resposta real, distinguindo solicitação, confirmação e inscrição na atividade.
- Na fase autenticada foram encontrados links individuais de **Imprimir certificado**. Eles não foram seguidos e o PDF não foi baixado. O acesso ao link foi identificado; o download autenticado, o formato do arquivo e suas condições de disponibilidade continuam por validar. Não registrar esses links privados nas evidências públicas.
- Não foi identificada operação de inscrição, cancelamento, confirmação de presença ou emissão de certificado de evento no OpenAPI consultado. Um botão que abra o formulário oficial é diferente de um adaptador que envie a inscrição pelo servidor do app.
- Prioridades viáveis: programação e vagas sincronizadas; carteira de eventos e links oficiais de certificados; descoberta de eventos do campus. Funcionalidades calculadas pelo app podem usar esses dados: aviso de conflito de horários, lembretes, alerta de alteração entre sincronizações e rotas com associação de salas validada pela organização.
- Registro de presença no SUAP e emissão oficial de certificados continuam dependendo das permissões da organização e de validação do fluxo institucional. O QR do protótipo não passa a ser presença oficial por consumir o catálogo.
