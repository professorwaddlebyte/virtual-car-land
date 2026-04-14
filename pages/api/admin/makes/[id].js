// pages/api/admin/makes/[id].js
// PATCH  — update name / nationality / is_luxury
// DELETE — remove a make

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { name, nationality, is_luxury } = req.body;
    if (!name?.trim() || !nationality?.trim()) {
      return res.status(400).json({ error: 'name and nationality are required' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE car_makes
         SET name = $1, nationality = $2, is_luxury = $3
         WHERE id = $4
         RETURNING id, name, nationality, is_luxury, sort_order`,
        [name.trim(), nationality.trim(), !!is_luxury, id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ make: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Make name already exists' });
      throw err;
    }
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await pool.query(
      `DELETE FROM car_makes WHERE id = $1`, [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



