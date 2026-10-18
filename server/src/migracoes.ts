import fs from 'node:fs/promises';
import path from 'node:path';

/** O mínimo que as migrações precisam do banco: uma conexão que roda SQL. */
export interface Conexao {
  query(sql: string, parametros?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/**
 * Aplica, em ordem, os arquivos .sql da pasta que ainda não rodaram neste banco.
 * Cada arquivo roda numa transação: ou entra inteiro, ou não entra nada.
 * Devolve os nomes dos arquivos aplicados agora.
 */
export async function aplicarMigracoes(conexao: Conexao, pasta: string): Promise<string[]> {
  await conexao.query(
    'CREATE TABLE IF NOT EXISTS migracoes (nome text PRIMARY KEY, aplicada_em timestamptz NOT NULL DEFAULT now())',
  );
  const { rows } = await conexao.query('SELECT nome FROM migracoes');
  const jaAplicadas = new Set(rows.map((linha) => String(linha.nome)));

  const arquivos = (await fs.readdir(pasta)).filter((nome) => nome.endsWith('.sql')).sort();
  const aplicadasAgora: string[] = [];

  for (const arquivo of arquivos) {
    if (jaAplicadas.has(arquivo)) continue;
    const sql = await fs.readFile(path.join(pasta, arquivo), 'utf8');
    await conexao.query('BEGIN');
    try {
      await conexao.query(sql);
      await conexao.query('INSERT INTO migracoes (nome) VALUES ($1)', [arquivo]);
      await conexao.query('COMMIT');
    } catch (erro) {
      await conexao.query('ROLLBACK');
      throw new Error(`Falha na migração ${arquivo}: ${(erro as Error).message}`);
    }
    aplicadasAgora.push(arquivo);
  }
  return aplicadasAgora;
}
