// pages/api/markets-public.js
// Returns active markets for registration form dropdown — no auth required

import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { rows } = await pool.query(
      `SELECT id, name, city, address FROM markets WHERE status = 'active' ORDER BY name`
    );
    return res.status(200).json({ markets: rows });
  } catch (e) {
    console.error('Markets fetch error:', e.message);
    return res.status(500).json({ error: 'Could not load markets' });
  }
}



