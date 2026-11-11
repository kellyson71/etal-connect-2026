/* Perfil único da rampa, usado pela geometria e pelo percurso. Patamares planos. */
export function fracaoRampa(q, i, pontos) {
  if (i === 0) return 0;
  if (i === pontos.length - 1) return 1;
  const retorno = pontos.findIndex((p, j) => j > 1 && p[1] === 185 && pontos[j - 1][1] < 185);
  if (q[1] <= 185) return 0.5;
  const t = Math.max(0, Math.min(1, (500 - q[1]) / 315));
  return i < retorno ? t * 0.5 : 1 - t * 0.5;
}

/* Escada em dois lances (medidas em metros): no lado sul fica a faixa de piso de cada andar, por onde se entra vindo da
   circulação; o lance da esquerda sobe para o norte até o patamar e o da direita volta, chegando na faixa do andar de
   cima. A porta da antiga sala do Grêmio (1º andar) abre para essa faixa. Usado pela geometria, pela rota e pela física. */
export const ESC = { faixa: 1.8, pat: 1.5 };
export function escadaPlanta(s, sy) {
  const f = ESC.faixa / sy, p = ESC.pat / sy; const xw = s.x + s.w * 0.27, xe = s.x + s.w * 0.73, ys = s.y + s.h - f, yn = s.y + p;
  return { xw, xe, ys, yn, meio: s.y + s.h - f / 2, pe: [s.x + s.w + 8, s.y + s.h - f / 2], loop: [[xw, ys], [xw, yn], [xe, yn], [xe, ys]], fr: [0, 0.5, 0.5, 1],
    furo: [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, ys], [s.x, ys]] };
}
/* Parede do meio da rampa e fechamentos, em unidades da planta. */
export const RAMPA_PAREDES = { meio: [[752.5, 190], [878.8, 505]], oeste: [[705, 165], [841, 505]], fechoLeste: [[878.8, 505], [920, 505]], fechoOeste: [[841, 505], [878.8, 505]], norte: [[705, 165], [784, 165]] };
