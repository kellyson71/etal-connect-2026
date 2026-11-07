export const tournaments = [
  {
    id: "mortal-kombat",
    name: "Mortal Kombat",
    subtitle: "Um round muda tudo.",
    short: "MK",
    color: "mk",
    day: 27,
    time: "14:00",
    format: "1 × 1 · Melhor de 3",
    rules:
      "Eliminação simples. Cada confronto é decidido em melhor de três partidas. Configurações e personagens serão combinados pela organização.",
    prize: "Troféu simbólico · Proposta de premiação",
    players: [
      { name: "Alex Costa", nick: "Arcade", initials: "AC" },
      { name: "Nina Martins", nick: "Pixel", initials: "NM" },
      { name: "Ravi Lima", nick: "Raio", initials: "RL" },
      { name: "Lia Souza", nick: "Lunar", initials: "LS" },
      { name: "Davi Alves", nick: "Combo", initials: "DA" },
      { name: "Bia Nunes", nick: "Nova", initials: "BN" },
      { name: "Ivo Rocha", nick: "Zero", initials: "IR" },
      { name: "Sara Melo", nick: "Spark", initials: "SM" },
    ],
  },
  {
    id: "fifa",
    name: "FIFA",
    subtitle: "O campus também entra em campo.",
    short: "FC",
    color: "fifa",
    day: 27,
    time: "15:30",
    format: "1 × 1 · Mata-mata",
    rules:
      "Oito participantes e confrontos eliminatórios. Tempos de partida, equipes e critérios de desempate serão definidos pela organização.",
    prize: "Troféu simbólico · Proposta de premiação",
    players: [
      { name: "Caio Freitas", nick: "Camisa 10", initials: "CF" },
      { name: "Luna Reis", nick: "Finta", initials: "LR" },
      { name: "Theo Dias", nick: "Maestro", initials: "TD" },
      { name: "Maya Lopes", nick: "Artilheira", initials: "ML" },
      { name: "Noah Cruz", nick: "Capitão", initials: "NC" },
      { name: "Eva Ramos", nick: "Canhota", initials: "ER" },
      { name: "Enzo Luz", nick: "Craque", initials: "EL" },
      { name: "Ana Vale", nick: "Gol de Placa", initials: "AV" },
    ],
  },
];
export type Tournament = (typeof tournaments)[number];
