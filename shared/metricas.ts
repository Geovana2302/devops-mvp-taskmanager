/** Tamanho da grade de todo glifo (RN06). */
export const UNIDADES_POR_EM = 1000;

/** Métricas de uma fonte nova (RN06). */
export const METRICAS_PADRAO = {
  ascendente: 800,
  maiusculas: 700,
  alturaX: 500,
  descendente: -200,
} as const;

export interface Metricas {
  ascendente: number;
  maiusculas: number;
  alturaX: number;
  descendente: number;
}

/** RN06: descendente < 0 (linha de base) < altura-x ≤ maiúsculas ≤ ascendente. */
export function metricasValidas(m: Metricas): boolean {
  return m.descendente < 0 && 0 < m.alturaX && m.alturaX <= m.maiusculas && m.maiusculas <= m.ascendente;
}
