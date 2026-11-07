/* Dados demonstrativos do protótipo. Datas de referência: VII ETAL, 26 a 28 de novembro de 2025. */
window.DATA = {
  person: {
    name: 'Maria Clara Fernandes',
    first: 'Maria Clara',
    initials: 'MC',
    course: 'Informática',
    courseFull: 'Técnico Integrado em Informática',
    year: '3º ano',
    id: '20231094010012',
    campus: 'Pau dos Ferros',
  },
  now: { day: 26, time: '14:02' },
  days: [
    { day: 26, week: 'Qua', long: 'Quarta, 26 de novembro' },
    { day: 27, week: 'Qui', long: 'Quinta, 27 de novembro' },
    { day: 28, week: 'Sex', long: 'Sexta, 28 de novembro' },
  ],
  sessions: [
    {
      id: 'react-native', type: 'Minicurso', day: 26, time: '14:00', end: '18:00',
      title: 'Introdução ao React Native com Expo', short: 'React Native com Expo',
      speaker: 'Jonhy Everton Silva Gomes de Santana', speakerShort: 'Jonhy Everton', initials: 'JE',
      role: 'Desenvolvedor mobile', floor: 2, zone: 'labs-norte-2', room: 'Lab 204',
      description: 'Da ideia ao primeiro app. Explore componentes, navegação e as primeiras telas de um aplicativo com React Native e Expo.',
      requirements: 'Notebook com Node.js instalado e conhecimentos básicos de JavaScript.',
      learn: ['Criar um projeto com Expo e abrir no seu celular', 'Montar telas com View, Text, Image e listas', 'Navegar entre telas com o Expo Router'],
      link: 'etal.app/rn201',
      materials: [
        { kind: 'pdf', name: 'Slides da aula', meta: 'PDF · 3,1 MB' },
        { kind: 'link', name: 'Projeto inicial', meta: 'github.com/etal-demo/expo-inicial' },
        { kind: 'zip', name: 'Exercício 1 · lista de contatos', meta: 'ZIP · 120 KB', fresh: 'Adicionado às 14:01' },
        { kind: 'link', name: 'Documentação do Expo', meta: 'docs.expo.dev' },
      ],
    },
    {
      id: 'fastapi', type: 'Minicurso', day: 26, time: '14:00', end: '18:00',
      title: 'FastAPI: construindo APIs modernas e performáticas', short: 'APIs modernas com FastAPI',
      speaker: 'Marcos Queiroz', speakerShort: 'Marcos Queiroz', initials: 'MQ',
      role: 'Desenvolvedor backend', floor: 2, zone: 'labs-norte', room: 'Lab 201',
      description: 'Crie sua primeira API com Python e FastAPI. Entenda rotas, validação de dados e documentação interativa.',
      requirements: 'Notebook com Python instalado e noções básicas de programação.',
      learn: ['Criar rotas e respostas em JSON', 'Validar dados com Pydantic', 'Usar a documentação interativa'],
      link: 'etal.app/api204',
      materials: [
        { kind: 'pdf', name: 'Slides da aula', meta: 'PDF · 2,4 MB' },
        { kind: 'link', name: 'Repositório de exemplo', meta: 'github.com/etal-demo/fastapi-basico' },
      ],
    },
    {
      id: 'experiencia-ia', type: 'Minicurso', day: 26, time: '14:00', end: '18:00',
      title: 'O futuro da experiência com IA', short: 'O futuro da experiência com IA',
      speaker: 'Pablo Rodrigo Bernardino de Lira', speakerShort: 'Pablo Rodrigo', initials: 'PR',
      role: 'Designer de produto', floor: 0, zone: 'sala-norte-0', room: 'Sala 001',
      description: 'Uso, experiência e tecnologia: como a inteligência artificial está redefinindo nossas interações.',
      requirements: 'Notebook e curiosidade para experimentar novas ferramentas.',
      learn: ['Padrões de interface para produtos com IA', 'Como testar ideias com protótipos rápidos'],
      link: 'etal.app/ia001',
      materials: [{ kind: 'pdf', name: 'Slides da aula', meta: 'PDF · 5,8 MB' }],
    },
    {
      id: 'react-next', type: 'Minicurso', day: 27, time: '08:00', end: '12:00',
      title: 'Desenvolvimento de aplicações web com React e Next.js', short: 'React e Next.js',
      speaker: 'Caio Rafael da Rocha Gomes', speakerShort: 'Caio Rafael', initials: 'CR',
      role: 'Desenvolvedor web', floor: 1, zone: 'sala-interna-norte-1', room: 'Sala 106',
      description: 'Explore componentes e rotas na construção de uma aplicação web com React e Next.js.',
      requirements: 'Notebook com Node.js e noções de JavaScript.',
      learn: ['Componentes e estado no React', 'Rotas e páginas no Next.js'],
      link: 'etal.app/web108',
      materials: [{ kind: 'pdf', name: 'Slides da aula', meta: 'PDF · 2,9 MB' }, { kind: 'link', name: 'Projeto inicial', meta: 'github.com/etal-demo/next-inicial' }],
    },
    {
      id: 'saude-mental', type: 'Palestra', day: 28, time: '07:30', end: '08:30',
      title: 'Saúde mental na era da IA', short: 'Saúde mental na era da IA',
      speaker: 'Francisco Rômulo Raulino Santos', speakerShort: 'Francisco Rômulo', initials: 'FR',
      role: 'Palestrante', floor: 0, zone: 'auditorio', room: 'Auditório',
      description: 'Da atenção fragmentada ao foco com significado. Uma conversa sobre bem-estar, hábitos e a presença da tecnologia em nosso cotidiano.',
      requirements: 'Venha com suas perguntas e disponibilidade para uma boa conversa.',
      learn: ['Hábitos que protegem a atenção', 'Como usar a tecnologia a seu favor'],
      link: 'etal.app/saude',
      materials: [{ kind: 'pdf', name: 'Slides da palestra', meta: 'PDF · 1,8 MB' }, { kind: 'link', name: 'Leituras recomendadas', meta: 'Lista com 6 textos' }],
    },
    {
      id: 'imagens-ia', type: 'Palestra', day: 28, time: '09:20', end: '10:20',
      title: 'Como a IA está transformando o mundo das imagens', short: 'IA e imagens',
      speaker: 'Keylly Eyglys Araújo dos Santos', speakerShort: 'Keylly Eyglys', initials: 'KE',
      role: 'Palestrante', floor: 0, zone: 'auditorio', room: 'Auditório',
      description: 'Novas possibilidades criativas, ferramentas e reflexões sobre inteligência artificial e imagens.',
      requirements: 'Não é necessário levar equipamento.',
      learn: ['Ferramentas atuais de geração e edição', 'Cuidados éticos com imagens geradas'],
      link: 'etal.app/imagens',
      materials: [{ kind: 'pdf', name: 'Slides da palestra', meta: 'PDF · 7,2 MB' }],
    },
  ],
  enrolled: ['react-native', 'react-next', 'saude-mental'],
  notices: [
    { time: '13:30', title: 'Minicursos da tarde começam às 14:00', text: 'Chegue alguns minutos antes para registrar presença na porta.', fresh: true },
    { time: '11:05', title: 'Lab 204: traga notebook', text: 'Com Node.js instalado. Há tomadas nas bancadas.', fresh: true },
    { time: '07:30', title: 'Credenciamento aberto', text: 'Na recepção do térreo, ao lado da rampa.' },
  ],
  tournaments: [
    {
      id: 'mk', name: 'Mortal Kombat', tagline: 'Um round muda tudo.', day: 27, time: '14:00', place: 'Sala 102 · 1º andar',
      format: '1 × 1 · melhor de 3', theme: 'mk',
      rules: 'Eliminação simples. Cada confronto é decidido em melhor de três partidas. Configurações e personagens são combinados pela organização.',
      prize: 'Troféu simbólico',
      players: [['Arcade', 'Alex Costa', 'AC'], ['Pixel', 'Nina Martins', 'NM'], ['Raio', 'Ravi Lima', 'RL'], ['Lunar', 'Lia Souza', 'LS'],
        ['Combo', 'Davi Alves', 'DA'], ['Nova', 'Bia Nunes', 'BN'], ['Zero', 'Ivo Rocha', 'IR'], ['Spark', 'Sara Melo', 'SM']],
      times: ['14:00', '14:20', '14:40', '15:00'],
    },
    {
      id: 'fifa', name: 'FIFA', tagline: 'O campus também entra em campo.', day: 27, time: '15:30', place: 'Sala 102 · 1º andar',
      format: '1 × 1 · mata-mata', theme: 'fifa',
      rules: 'Oito participantes e confrontos eliminatórios. Tempo de partida, equipes e critérios de desempate são definidos pela organização.',
      prize: 'Troféu simbólico',
      players: [['Camisa 10', 'Caio Freitas', 'CF'], ['Finta', 'Luna Reis', 'LR'], ['Maestro', 'Theo Dias', 'TD'], ['Artilheira', 'Maya Lopes', 'ML'],
        ['Capitão', 'Noah Cruz', 'NC'], ['Canhota', 'Eva Ramos', 'ER'], ['Craque', 'Enzo Luz', 'EL'], ['Gol de Placa', 'Ana Vale', 'AV']],
      times: ['15:30', '15:50', '16:10', '16:30'],
    },
  ],
};

/* Extras demonstrativos: vagas, perguntas, contatos e participação. */
(() => {
  const seats = { 'react-native': [24, 30], fastapi: [27, 30], 'experiencia-ia': [18, 40], 'react-next': [30, 30], 'saude-mental': [96, 200], 'imagens-ia': [71, 200] };
  window.DATA.sessions.forEach((s) => { [s.taken, s.seats] = seats[s.id]; });
  window.DATA.questions = {
    'react-native': [
      { id: 'q1', who: 'Ana V.', text: 'Dá para testar no iPhone sem ter um Mac?', votes: 9 },
      { id: 'q2', who: 'Theo D.', text: 'O projeto da aula funciona sem internet depois de instalado?', votes: 4 },
    ],
    'saude-mental': [{ id: 'q3', who: 'Luna R.', text: 'Como reduzir o tempo de tela sem perder o que importa?', votes: 12 }],
  };
  window.DATA.peers = [
    { name: 'Ana Vale', initials: 'AV', course: 'Informática · 4º ano', interest: 'Mobile' },
    { name: 'Theo Dias', initials: 'TD', course: 'ADS · 3º período', interest: 'Back-end' },
    { name: 'Luna Reis', initials: 'LR', course: 'Informática · 2º ano', interest: 'Design' },
  ];
  window.DATA.venue = 'IFRN Campus Pau dos Ferros';
})();

/* Lugares do campus: nomes do levantamento; descrição do que o participante encontra. */
window.DATA.places = {
  principal: { name: 'Bloco principal', kind: 'Salas e auditório', floors: 3, text: 'Três andares, com recepção no térreo. Minicursos e palestras acontecem aqui.' },
  laboratorios: { name: 'Bloco de laboratórios', kind: 'Aprendizado', text: 'Laboratórios do campus, ao lado do pátio.' },
  patio: { name: 'Pátio', kind: 'Convivência', text: 'Área coberta no centro do campus, entre a entrada e o bloco principal.' },
  cantina: { name: 'Cantina', kind: 'Alimentação', text: 'Lanches e refeições, ao lado da coberta de madeira.' },
  biblioteca: { name: 'Biblioteca', kind: 'Aprendizado', text: 'Atrás da cantina, seguindo pela coberta de madeira.' },
  anexo: { name: 'Anexo', kind: 'Edifício', text: 'Bloco ao fundo, ligado ao bloco principal por um caminho.' },
  diretoria: { name: 'Diretoria', kind: 'Administração', text: 'Prédio térreo à direita de quem entra, ao lado do pátio.' },
  portaria: { name: 'Portaria', kind: 'Entrada do campus', text: 'Acesso de pedestres. A passarela leva direto ao pátio.' },
};
window.DATA.placeOrder = ['principal', 'laboratorios', 'patio', 'cantina', 'biblioteca', 'anexo', 'diretoria', 'portaria'];

/* Imagens enviadas pelo usuário para os banners; informações do NADIC vindas do site oficial. */
window.DATA.tournaments[0].logo = 'assets/logo-mk.png';
window.DATA.tournaments[1].hideName = true;
window.DATA.nadic = {
  full: 'Núcleo de Análise de Dados e Inteligência Computacional',
  motto: 'Trazendo avanços tecnológicos para o Alto Oeste Potiguar',
  about: 'Grupo de pesquisadores e desenvolvedores do IFRN Campus Pau dos Ferros que trabalha com inteligência artificial e pesquisa aplicada, levando os projetos do campus ao contexto nacional.',
  stats: [['6', 'projetos de pesquisa'], ['4', 'registros de software'], ['8', 'parceiros']],
  lead: 'Aluisio Igor Rego Fontes',
  url: 'https://nadic.ifrn.edu.br/',
  source: 'Fonte: site oficial do NADIC, versão de abril de 2025.',
};

/* Colmeia de conquistas: cada favo depende de algo feito no app. */
window.DATA.combs = [
  { id: 'cred', title: 'Chegou ao ETAL', how: 'Leia o QR da recepção', icon: 'id' },
  { id: 'react-native', title: 'React Native com Expo', how: 'Registre presença no minicurso', icon: 'qr' },
  { id: 'react-next', title: 'React e Next.js', how: 'Registre presença no minicurso', icon: 'qr' },
  { id: 'saude-mental', title: 'Saúde mental na era da IA', how: 'Registre presença na palestra', icon: 'mic' },
  { id: 'ask', title: 'Fez uma pergunta', how: 'Pergunte algo na tela de uma aula', icon: 'chat' },
  { id: 'rate', title: 'Avaliou uma atividade', how: 'Dê uma nota na tela de uma aula', icon: 'star' },
  { id: 'contact', title: 'Fez um contato', how: 'Leia o QR do crachá de um colega', icon: 'contact' },
];
/* Campus ao vivo: números demonstrativos. */
window.DATA.liveBase = { credenciados: 312 };

/* Resto do campus: fora da programação do evento. Nomes e andares informados pelo usuário. */
Object.assign(window.DATA.places, {
  auxiliar: { name: 'Prédio auxiliar', kind: 'Edifício', text: 'Prédio de dois andares, ao lado do Coliseu.' },
  coliseu: { name: 'Coliseu', kind: 'Convivência', text: 'Deck coberto de seis lados, com colunas e uma escadinha de acesso. Fica no meio do caminho entre o bloco e o anexo.' },
  'centro-medico': { name: 'Centro médico', kind: 'Saúde', text: 'Prédio térreo, entre a cantina e o vestiário.' },
  vestiario: { name: 'Vestiário', kind: 'Apoio', text: 'Prédio térreo, ao lado do centro médico e da biblioteca.' },
  ginasio: { name: 'Ginásio', kind: 'Esporte', text: 'Quadra coberta, atrás da biblioteca.' },
  'predio-nadic': { name: 'Prédio do NADIC', kind: 'Pesquisa', text: 'Prédio de dois andares, quase da altura do bloco principal, atrás do Anexo.', link: 'nadic' },
  academia: { name: 'Academia', kind: 'Esporte', text: 'Prédio térreo, entre o ginásio e a piscina.' },
  piscina: { name: 'Piscina', kind: 'Esporte', text: 'Área da piscina, ao lado da academia e do campo.' },
  volei: { name: 'Quadra de vôlei', kind: 'Esporte', text: 'Quadra de areia, ao lado do Prédio do NADIC.' },
  campo: { name: 'Campo de futebol', kind: 'Esporte', text: 'Campo ao fundo, depois da piscina.' },
  estufa: { name: 'Estufa', kind: 'Jardim', text: 'Estufa simples, no caminho para a Casa do Mel.' },
  'casa-mel': { name: 'Casa do Mel', kind: 'Apicultura', text: 'Prédio térreo no fim do campus, entre as árvores.' },
  'seu-assis': { name: 'Seu Assis', kind: 'Restaurante vizinho', text: 'Restaurante familiar ao lado do campus, do lado de fora do muro.' },
});
window.DATA.placeOrder.push('coliseu', 'auxiliar', 'centro-medico', 'vestiario', 'ginasio', 'predio-nadic', 'academia', 'piscina', 'volei', 'campo', 'estufa', 'casa-mel', 'seu-assis');

/* Partes do evento, destacadas no modo Evento. O auditório fica na ala oeste do bloco principal, no térreo. */
Object.assign(window.DATA.places.principal, { kind: 'Minicursos', text: 'Três andares, com recepção no térreo. Os minicursos acontecem aqui.' });
Object.assign(window.DATA.places.cantina, { kind: 'Refeições', text: 'Onde acontecem as refeições do evento, ao lado da coberta de madeira.' });
window.DATA.places.auditorio = { name: 'Auditório', kind: 'Apresentações e palestras', text: 'No térreo do bloco principal, na ala oeste. As apresentações e palestras acontecem aqui.', noArea: true, plan: [0, 'auditorio'] };

/* O que é o ETAL: descrição e edições registradas no SUAP. */
window.DATA.etal = {
  full: 'Encontro de Tecnologia do Alto Oeste Potiguar',
  about: 'O ETAL dissemina tecnologias de sistemas de informação, sistemas inteligentes e sistemas embarcados, e promove a troca de experiências entre a comunidade acadêmica e as empresas.',
  areas: ['Sistemas de informação', 'Sistemas inteligentes', 'Sistemas embarcados'],
  formats: 'Palestras, mesas-redondas, oficinas e minicursos',
  place: 'IFRN Campus Pau dos Ferros',
  editions: [
    ['2018', '3º ETAL', '10 de dezembro'],
    ['2021', 'Edição online', '10 de dezembro'],
    ['2023', 'V ETAL', '29 de novembro a 1º de dezembro'],
    ['2024', 'VI ETAL', '27 a 29 de novembro'],
    ['2025', 'VII ETAL', '26 a 28 de novembro'],
  ],
  site: 'https://etal.nadic.com.br/',
  portal: 'https://portal.ifrn.edu.br/eventos/8528/',
  source: 'Fonte: eventos registrados no SUAP. A lista traz só as edições encontradas lá.',
};
window.DATA.ifrnUrl = 'https://portal.ifrn.edu.br/campus/paudosferros/';
Object.assign(window.DATA.nadic, {
  email: 'nadicifrn@gmail.com',
  address: 'BR-405, Pau dos Ferros, RN',
  fields: ['Inteligência artificial', 'Análise de dados', 'Pesquisa aplicada'],
  projects: [
    ['Placas automotivas', 'Classificação automática para gestão de espaços veiculares'],
    ['Infovia Potiguar', 'Rede de dados em fibra óptica para o RN'],
    ['Pechinchou', 'Comunidade de preços baixos e promoções'],
    ['IA em licitações', 'Automação do processo licitatório'],
    ['Metalicitação', 'Classificação automática de licitações públicas'],
    ['ASRV', 'Síntese e reconhecimento de voz'],
    ['Self-checkout', 'Identificação de objetos por inteligência artificial'],
  ],
});

/* Programação ampliada: atividades novas são de exemplo, para ver a agenda cheia. Não é a programação oficial. */
(() => {
  const D = window.DATA;
  const zoneRoom = (floor, zone) => { const z = window.PLAN.floors[floor].zones.find((q) => q.id === zone); return z.kind === 'laboratory' ? `Lab ${z.roomNumber}` : z.roomNumber ? `Sala ${z.roomNumber}` : z.label; };
  const talk = (o) => ({ demo: true, learn: [], materials: [], requirements: 'Não é preciso levar nada.', link: 'etal.app/exemplo', taken: 12, seats: 40, room: zoneRoom(o.floor, o.zone), ...o });
  const stop = (o) => ({ demo: true, simple: true, learn: [], materials: [], requirements: '', ...o });
  D.sessions.push(
    stop({ id: 'credenciamento', type: 'Credenciamento', day: 26, time: '13:00', end: '14:00', title: 'Credenciamento', short: 'Credenciamento', floor: 0, zone: 'recepcao', room: 'Recepção', description: 'Leia o QR da recepção para confirmar sua participação.' }),
    talk({ id: 'git', type: 'Oficina', day: 26, time: '14:00', end: '18:00', title: 'Git e GitHub na prática', short: 'Git e GitHub', speaker: 'Helena Duarte', speakerShort: 'Helena Duarte', initials: 'HD', role: 'Desenvolvedora de software', floor: 1, zone: 'sala-norte-2', description: 'Versione seu código, trabalhe em equipe e publique seu primeiro repositório.', requirements: 'Notebook com Git instalado.', learn: ['Commits, branches e merge', 'Pull requests em equipe'], taken: 22, seats: 25, materials: [{ kind: 'pdf', name: 'Guia de comandos', meta: 'PDF · 800 KB' }] }),
    stop({ id: 'intervalo-26', type: 'Intervalo', day: 26, time: '16:00', end: '16:20', title: 'Intervalo com lanche', short: 'Intervalo', place: 'cantina', room: 'Cantina', description: 'Pausa da tarde, na cantina.' }),
    stop({ id: 'abertura', type: 'Abertura', day: 26, time: '19:00', end: '20:00', title: 'Abertura do ETAL', short: 'Abertura', floor: 0, zone: 'auditorio', room: 'Auditório', description: 'Boas-vindas e apresentação da programação.' }),
    talk({ id: 'arduino', type: 'Oficina', day: 27, time: '08:00', end: '12:00', title: 'Primeiros passos com Arduino', short: 'Arduino', speaker: 'Rafael Nóbrega', speakerShort: 'Rafael Nóbrega', initials: 'RN', role: 'Engenheiro de sistemas embarcados', floor: 2, zone: 'labs-norte', description: 'Monte circuitos simples e programe sensores e LEDs.', learn: ['Montar um circuito simples', 'Ler um sensor e reagir a ele'], taken: 19, seats: 20 }),
    talk({ id: 'mesa-carreira', type: 'Mesa-redonda', day: 27, time: '10:00', end: '11:30', title: 'Carreira em tecnologia no interior', short: 'Carreira no interior', speaker: 'Beatriz Lacerda', speakerShort: 'Beatriz Lacerda', initials: 'BL', role: 'Mediadora', floor: 0, zone: 'auditorio', description: 'Conversa sobre trabalho remoto, empresas locais e como começar.', learn: ['Caminhos para o primeiro emprego', 'Como montar um portfólio'], taken: 88, seats: 200 }),
    stop({ id: 'almoco-27', type: 'Refeição', day: 27, time: '12:00', end: '13:30', title: 'Almoço', short: 'Almoço', place: 'cantina', room: 'Cantina', description: 'Refeição na cantina do campus.' }),
    talk({ id: 'dados', type: 'Minicurso', day: 27, time: '14:00', end: '18:00', title: 'Análise de dados com Python', short: 'Dados com Python', speaker: 'Marina Telles', speakerShort: 'Marina Telles', initials: 'MT', role: 'Analista de dados', floor: 1, zone: 'sala-interna-sul-1', description: 'Limpe, explore e visualize dados com Pandas.', requirements: 'Notebook com Python instalado.', learn: ['Ler e limpar planilhas com Pandas', 'Fazer gráficos claros'], taken: 27, seats: 30 }),
    stop({ id: 'jogo-mk', type: 'Campeonato', day: 27, time: '14:00', end: '15:20', title: 'Campeonato de Mortal Kombat', short: 'Mortal Kombat', tournament: 'mk', floor: 1, zone: 'sala-norte-1', room: 'Sala 102', description: 'Eliminação simples, melhor de três.' }),
    stop({ id: 'jogo-fifa', type: 'Campeonato', day: 27, time: '15:30', end: '16:50', title: 'Campeonato de FIFA', short: 'FIFA', tournament: 'fifa', floor: 1, zone: 'sala-norte-1', room: 'Sala 102', description: 'Mata-mata com oito participantes.' }),
    stop({ id: 'intervalo-28', type: 'Intervalo', day: 28, time: '10:20', end: '10:40', title: 'Intervalo com lanche', short: 'Intervalo', place: 'cantina', room: 'Cantina', description: 'Pausa da manhã, na cantina.' }),
    talk({ id: 'seguranca', type: 'Palestra', day: 28, time: '10:40', end: '11:40', title: 'Segurança digital no dia a dia', short: 'Segurança digital', speaker: 'Tiago Brandão', speakerShort: 'Tiago Brandão', initials: 'TB', role: 'Especialista em segurança', floor: 0, zone: 'auditorio', description: 'Golpes comuns, senhas e como proteger suas contas.', learn: ['Reconhecer golpes comuns', 'Proteger suas contas'], taken: 64, seats: 200 }),
    stop({ id: 'almoco-28', type: 'Refeição', day: 28, time: '12:00', end: '13:30', title: 'Almoço', short: 'Almoço', place: 'cantina', room: 'Cantina', description: 'Refeição na cantina do campus.' }),
    talk({ id: 'interfaces', type: 'Oficina', day: 28, time: '14:00', end: '16:30', title: 'Design de interfaces para quem programa', short: 'Design de interfaces', speaker: 'Camila Rocha', speakerShort: 'Camila Rocha', initials: 'CM', role: 'Designer de produto', floor: 0, zone: 'sala-norte-2', description: 'Hierarquia, contraste e como deixar uma tela clara.', learn: ['Hierarquia visual', 'Contraste e legibilidade'], taken: 15, seats: 30 }),
    stop({ id: 'encerramento', type: 'Encerramento', day: 28, time: '17:00', end: '18:00', title: 'Encerramento e premiação', short: 'Encerramento', place: 'patio', room: 'Pátio', description: 'Premiação dos campeonatos e encerramento, no pátio.' }),
  );
  D.sessions.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
})();

window.DATA.places.obelisco = { name: 'Obelisco do IFRN', kind: 'Monumento', text: 'Na entrada, à esquerda da passarela, quase chegando ao pátio, entre canteiros floridos.', noArea: true };
window.DATA.placeOrder.splice(1, 0, 'obelisco');
