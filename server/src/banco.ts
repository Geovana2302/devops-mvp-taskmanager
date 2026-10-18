import pg from 'pg';

/** Cria o pool de conexões a partir da DATABASE_URL, ou devolve null se ela não existir. */
export function criarPool(url = process.env.DATABASE_URL): pg.Pool | null {
  if (!url) return null;
  return new pg.Pool({ connectionString: url, max: 5 });
}
