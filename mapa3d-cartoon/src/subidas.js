/* Perfil único da rampa, usado pela geometria e pelo percurso. Patamares planos. */
export function fracaoRampa(q, i, pontos) {
  if (i === 0) return 0;
  if (i === pontos.length - 1) return 1;
  const retorno = pontos.findIndex((p, j) => j > 1 && p[1] === 185 && pontos[j - 1][1] < 185);
  if (q[1] <= 185) return 0.5;
  const t = Math.max(0, Math.min(1, (500 - q[1]) / 315));
  return i < retorno ? t * 0.5 : 1 - t * 0.5;
}
