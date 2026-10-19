import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';

describe('GET /health', () => {
  it('responde 200 com status e banco ok quando o banco responde', async () => {
    const app = criarApp({ verificarBanco: async () => {} });
    const resposta = await request(app).get('/health');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok', banco: 'ok' });
  });

  it('responde 503 quando o banco não responde', async () => {
    const app = criarApp({
      verificarBanco: async () => {
        throw new Error('banco fora do ar');
      },
    });
    const resposta = await request(app).get('/health');
    expect(resposta.status).toBe(503);
    expect(resposta.body).toEqual({ status: 'erro', banco: 'erro' });
  });
});

describe('rotas da API que não existem', () => {
  it('respondem 404 em JSON', async () => {
    const app = criarApp({ verificarBanco: async () => {} });
    const resposta = await request(app).get('/api/nao-existe');
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'Rota não encontrada' });
  });
});
