import survey from "./campus-survey.json";
export const places = [
  {
    id: "principal",
    element: 0,
    label: "Bloco principal",
    short: "Principal",
    description: "Edifício principal identificado no seu levantamento.",
    labelAt: [-8, -35],
    category: "Edifício",
  },
  {
    id: "anexo",
    element: 1,
    label: "Anexo",
    short: "Anexo",
    description: "Bloco ao fundo, conectado pelo caminho marcado no KML.",
    labelAt: [-44, -96],
    category: "Edifício",
  },
  {
    id: "laboratorios",
    element: 3,
    label: "Bloco de laboratórios",
    short: "Laboratórios",
    description:
      "Contorno do laboratório preservado do levantamento. Salas das atividades são propostas.",
    labelAt: [-47, 9],
    category: "Aprendizado",
  },
  {
    id: "cantina",
    element: 4,
    label: "Cantina",
    short: "Cantina",
    description: "Espaço de alimentação identificado no levantamento.",
    labelAt: [-62, -37],
    category: "Convivência",
  },
  {
    id: "patio",
    element: 5,
    label: "Pátio",
    short: "Pátio",
    description:
      "Área central de convivência. Arena de jogos proposta para a demonstração.",
    labelAt: [0, -2],
    category: "Convivência",
  },
  {
    id: "diretoria",
    element: 6,
    label: "Diretoria",
    short: "Diretoria",
    description: "Edificação independente ao lado do pátio.",
    labelAt: [26, 3],
    category: "Edifício",
  },
  {
    id: "biblioteca",
    element: 7,
    label: "Biblioteca",
    short: "Biblioteca",
    description: "Biblioteca identificada no KML original.",
    labelAt: [-78, -69],
    category: "Aprendizado",
  },
  {
    id: "portaria",
    element: 8,
    label: "Portaria",
    short: "Entrada",
    description:
      "Acesso principal conforme o contorno original do levantamento.",
    labelAt: [15, 48],
    category: "Acesso",
  },
] as const;
export type PlaceId = (typeof places)[number]["id"];
export const campusElements = survey.elementos;
export const coreView = "-111 -128 166 193";
export const wholeView = "-205 -308 285 385";
export const points = (index: number) =>
  campusElements[index].pontos.map((p) => p.join(",")).join(" ");
export function footprintArea(index: number) {
  const pts = campusElements[index].pontos;
  return Math.abs(
    pts.reduce((sum, p, i) => {
      const n = pts[(i + 1) % pts.length];
      return sum + p[0] * n[1] - n[0] * p[1];
    }, 0) / 2,
  );
}
export function placeById(id: PlaceId) {
  return places.find((p) => p.id === id)!;
}
