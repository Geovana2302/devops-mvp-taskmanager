import { describe, expect, it } from 'vitest';
import { METRICAS_PADRAO, metricasValidas } from './metricas.js';

describe('métricas (RN06)', () => {
  it('os valores padrão seguem a ordem da RN06', () => {
    expect(metricasValidas(METRICAS_PADRAO)).toBe(true);
  });

  it('recusa altura-x acima das maiúsculas', () => {
    expect(metricasValidas({ ...METRICAS_PADRAO, alturaX: 750 })).toBe(false);
  });

  it('recusa descendente acima da linha de base', () => {
    expect(metricasValidas({ ...METRICAS_PADRAO, descendente: 10 })).toBe(false);
  });
});
