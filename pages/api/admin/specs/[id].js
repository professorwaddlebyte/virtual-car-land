// pages/api/admin/specs/[id].js
// PATCH  — update feature_name / group_name
// DELETE — remove a feature

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

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { feature_name, group_name } = req.body;
    if (!feature_name?.trim()) return res.status(400).json({ error: 'feature_name is required' });
    if (!VALID_GROUPS.includes(group_name)) {
      return res.status(400).json({ error: 'Invalid group_name', valid: VALID_GROUPS });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE car_specs
         SET feature_name = $1, group_name = $2
         WHERE id = $3
         RETURNING id, feature_name, group_name, sort_order`,
        [feature_name.trim(), group_name, id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ spec: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Feature name already exists' });
      throw err;
    }
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await pool.query(
      `DELETE FROM car_specs WHERE id = $1`, [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



