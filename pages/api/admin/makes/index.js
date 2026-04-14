// pages/api/admin/makes/index.js
// GET  — list all car makes
// POST — create a new make

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
      `SELECT id, name, nationality, is_luxury, sort_order
       FROM car_makes ORDER BY sort_order, name`
    );
    return res.status(200).json({ makes: rows });
  }

  if (req.method === 'POST') {
    const { name, nationality, is_luxury = false } = req.body;
    if (!name?.trim() || !nationality?.trim()) {
      return res.status(400).json({ error: 'name and nationality are required' });
    }
    // sort_order: place after last existing row
    const { rows: [last] } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS max FROM car_makes`
    );
    const sort_order = last.max + 10;

    try {
      const { rows } = await pool.query(
        `INSERT INTO car_makes (name, nationality, is_luxury, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, nationality, is_luxury, sort_order`,
        [name.trim(), nationality.trim(), is_luxury, sort_order]
      );
      return res.status(201).json({ make: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Make already exists' });
      throw err;
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



