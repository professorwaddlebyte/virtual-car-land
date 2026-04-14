// pages/api/admin/dealerships/[id].js
// REWRITTEN: removed all mockData references. Now queries NeonDB directly.

import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/db';

function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  // GET — fetch single dealer
  if (req.method === 'GET') {
    try {
      const rows = await query(`
        SELECT
          d.id, d.business_name, d.phone, d.showroom_number,
          d.listing_integrity_score, d.score_tier, d.subscription_tier,
          d.telegram_chat_id, d.created_at,
          u.email, u.id AS user_id
        FROM dealers d
        JOIN users u ON u.id = d.user_id
        WHERE d.id = $1
      `, [id]);

      if (!rows.length) return res.status(404).json({ error: 'Dealer not found' });
      return res.status(200).json({ dealer: rows[0] });
    } catch (err) {
      console.error('Get dealer error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT — update dealer fields
  if (req.method === 'PUT') {
    try {
      const { business_name, phone, showroom_number, subscription_tier } = req.body;

      const rows = await query(`
        UPDATE dealers
        SET
          business_name     = COALESCE($1, business_name),
          phone             = COALESCE($2, phone),
          showroom_number   = COALESCE($3, showroom_number),
          subscription_tier = COALESCE($4, subscription_tier)
        WHERE id = $5
        RETURNING id, business_name, phone, showroom_number, subscription_tier
      `, [business_name || null, phone || null, showroom_number || null, subscription_tier || null, id]);

      if (!rows.length) return res.status(404).json({ error: 'Dealer not found' });
      return res.status(200).json({ message: 'Dealer updated', dealer: rows[0] });
    } catch (err) {
      console.error('Update dealer error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE — remove dealer and their user account
  if (req.method === 'DELETE') {
    try {
      // Get user_id first
      const rows = await query(`SELECT user_id FROM dealers WHERE id = $1`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'Dealer not found' });

      const { user_id } = rows[0];

      // Delete dealer then user (FK order)
      await query(`DELETE FROM dealers WHERE id = $1`, [id]);
      await query(`DELETE FROM users WHERE id = $1`, [user_id]);

      return res.status(200).json({ message: 'Dealer deleted' });
    } catch (err) {
      console.error('Delete dealer error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}




