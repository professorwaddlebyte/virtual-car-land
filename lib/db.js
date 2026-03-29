import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export async function query(queryText, params = []) {
  if (!sql) {
    throw new Error('Database not configured');
  }
  if (params.length > 0) {
    return sql.query(queryText, params);
  }
  return sql.query(queryText);
}

export default sql;
