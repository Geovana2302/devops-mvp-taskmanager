import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aplicarMigracoes, type Conexao } from '../src/migracoes.js';

/** Banco de mentira: guarda os comandos recebidos e finge a tabela migracoes. */
function bancoFalso(jaAplicadas: string[] = []) {
  const comandos: string[] = [];
  const conexao: Conexao = {
    async query(sql, parametros) {
      comandos.push(sql.trim().split('\n')[0] + (parametros ? ` ${JSON.stringify(parametros)}` : ''));
      if (sql.startsWith('SELECT nome FROM migracoes')) {
        return { rows: jaAplicadas.map((nome) => ({ nome })) };
      }
      if (sql.includes('QUEBRA')) throw new Error('erro de sintaxe');
      return { rows: [] };
    },
  };
  return { conexao, comandos };
}

async function pastaCom(arquivos: Record<string, string>) {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'migracoes-'));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    await fs.writeFile(path.join(pasta, nome), conteudo);
  }
  return pasta;
}

describe('aplicarMigracoes', () => {
  it('aplica os arquivos .sql em ordem, cada um numa transação', async () => {
    const pasta = await pastaCom({ '002_b.sql': '-- b', '001_a.sql': '-- a', 'leia.txt': 'ignorar' });
    const { conexao, comandos } = bancoFalso();
    const aplicadas = await aplicarMigracoes(conexao, pasta);
    expect(aplicadas).toEqual(['001_a.sql', '002_b.sql']);
    expect(comandos.filter((c) => c.startsWith('INSERT'))).toEqual([
      'INSERT INTO migracoes (nome) VALUES ($1) ["001_a.sql"]',
      'INSERT INTO migracoes (nome) VALUES ($1) ["002_b.sql"]',
    ]);
    expect(comandos.filter((c) => c === 'BEGIN')).toHaveLength(2);
  });

  it('pula o que já foi aplicado', async () => {
    const pasta = await pastaCom({ '001_a.sql': '-- a', '002_b.sql': '-- b' });
    const { conexao } = bancoFalso(['001_a.sql']);
    expect(await aplicarMigracoes(conexao, pasta)).toEqual(['002_b.sql']);
  });

  it('desfaz a transação e para quando um arquivo falha', async () => {
    const pasta = await pastaCom({ '001_a.sql': 'QUEBRA', '002_b.sql': '-- b' });
    const { conexao, comandos } = bancoFalso();
    await expect(aplicarMigracoes(conexao, pasta)).rejects.toThrow('Falha na migração 001_a.sql');
    expect(comandos).toContain('ROLLBACK');
    expect(comandos.some((c) => c.includes('002_b.sql'))).toBe(false);
  });

  it('a migração 001 cria as tabelas usuarios, fontes e glifos', async () => {
    const sql = await fs.readFile(new URL('../migracoes/001_inicial.sql', import.meta.url), 'utf8');
    for (const tabela of ['usuarios', 'fontes', 'glifos']) {
      expect(sql).toContain(`CREATE TABLE ${tabela} (`);
    }
  });
});
