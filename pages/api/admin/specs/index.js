// pages/api/admin/specs/index.js
// GET  — list all car specs (features)
// POST — create a new feature

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

const VALID_GROUPS = [
  'Comfort & Seating',
  'Roof & Glass',
  'Infotainment & Tech',
  'Sound Systems',
  'Safety & Driver Assist',
  'Performance & Drivetrain',
  'Off-Road & Towing',
  'EV / Hybrid & Other',
];

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT id, feature_name, group_name, sort_order
       FROM car_specs ORDER BY group_name, sort_order, feature_name`
    );
    return res.status(200).json({ specs: rows, groups: VALID_GROUPS });
  }

  if (req.method === 'POST') {
    const { feature_name, group_name } = req.body;
    if (!feature_name?.trim()) return res.status(400).json({ error: 'feature_name is required' });
    if (!VALID_GROUPS.includes(group_name)) {
      return res.status(400).json({ error: 'Invalid group_name', valid: VALID_GROUPS });
    }

    // sort_order: last within the same group
    const { rows: [last] } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS max FROM car_specs WHERE group_name = $1`,
      [group_name]
    );
    const sort_order = last.max + 10;

    try {
      const { rows } = await pool.query(
        `INSERT INTO car_specs (feature_name, group_name, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id, feature_name, group_name, sort_order`,
        [feature_name.trim(), group_name, sort_order]
      );
      return res.status(201).json({ spec: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Feature already exists' });
      throw err;
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



