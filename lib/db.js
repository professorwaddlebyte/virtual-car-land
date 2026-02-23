import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

export async function query(queryText, params = []) {
  if (params.length > 0) {
    return sql.query(queryText, params);
  }
  return sql.query(queryText);
}

export default sql;
