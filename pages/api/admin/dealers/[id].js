import { query } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

function getAdmin(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user.role === 'admin' ? user : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { business_name, phone, listing_integrity_score, subscription_tier } = req.body;
    await query(`
      UPDATE dealers SET
        business_name = COALESCE($1, business_name),
        phone = COALESCE($2, phone),
        listing_integrity_score = COALESCE($3, listing_integrity_score),
        subscription_tier = COALESCE($4, subscription_tier)
      WHERE id = $5
    `, [business_name, phone, listing_integrity_score ? parseInt(listing_integrity_score) : null, subscription_tier, id]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM vehicles WHERE dealer_id = $1`, [id]);
    await query(`DELETE FROM showrooms WHERE dealer_id = $1`, [id]);
    await query(`DELETE FROM dealers WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



