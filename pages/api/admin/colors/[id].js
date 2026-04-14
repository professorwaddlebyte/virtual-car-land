// pages/api/admin/colors/[id].js
// PATCH  — update color name
// DELETE — remove a color

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
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const formatted = name.trim().replace(/\b\w/g, c => c.toUpperCase());

    try {
      const { rows } = await pool.query(
        `UPDATE car_colors SET name = $1 WHERE id = $2
         RETURNING id, name, sort_order`,
        [formatted, id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ color: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Color name already exists' });
      throw err;
    }
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await pool.query(
      `DELETE FROM car_colors WHERE id = $1`, [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



