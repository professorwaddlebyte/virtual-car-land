// pages/api/admin/approve-dealer.js
// Admin-only: approve or reject a pending dealer registration
// POST { dealer_id, action: 'approve' | 'reject' }

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getAdmin(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user?.role === 'admin' ? user : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const admin = getAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const { dealer_id, action } = req.body;
  if (!dealer_id || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'dealer_id and action (approve|reject) are required' });
  }

  const check = await pool.query(`SELECT id, status, business_name FROM dealers WHERE id = $1`, [dealer_id]);
  if (check.rows.length === 0) return res.status(404).json({ error: 'Dealer not found' });

  const dealer = check.rows[0];
  if (dealer.status !== 'pending') return res.status(409).json({ error: `Dealer is already ${dealer.status}` });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (action === 'approve') {
      await client.query(`UPDATE dealers SET status = 'active' WHERE id = $1`, [dealer_id]);
      await client.query('COMMIT');
      return res.status(200).json({ ok: true, message: `${dealer.business_name} approved.` });
    } else {
      await client.query(`DELETE FROM showrooms WHERE dealer_id = $1`, [dealer_id]);
      await client.query(`DELETE FROM dealers WHERE id = $1`, [dealer_id]);
      await client.query('COMMIT');
      return res.status(200).json({ ok: true, message: `${dealer.business_name} rejected and removed.` });
    }
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Approve/reject error:', e.message);
    return res.status(500).json({ error: 'Action failed. Please try again.' });
  } finally {
    client.release();
  }
}


