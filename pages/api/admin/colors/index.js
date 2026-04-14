// pages/api/admin/colors/index.js
// GET  — list all car colors
// POST — create a new color

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

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT id, name, sort_order FROM car_colors ORDER BY sort_order, name`
    );
    return res.status(200).json({ colors: rows });
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    // Enforce capitalized noun format
    const formatted = name.trim().replace(/\b\w/g, c => c.toUpperCase());

    const { rows: [last] } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS max FROM car_colors`
    );
    const sort_order = last.max + 10;

    try {
      const { rows } = await pool.query(
        `INSERT INTO car_colors (name, sort_order)
         VALUES ($1, $2)
         RETURNING id, name, sort_order`,
        [formatted, sort_order]
      );
      return res.status(201).json({ color: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Color already exists' });
      throw err;
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



