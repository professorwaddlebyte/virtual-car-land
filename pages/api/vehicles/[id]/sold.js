import { query } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

function getDealer(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = getDealer(req);
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  try {
    const vehicles = await query(`SELECT id, dealer_id, make, model, year, price_aed, created_at FROM vehicles WHERE id = $1`, [id]);
    if (!vehicles.length) return res.status(404).json({ error: 'Not found' });
    if (vehicles[0].dealer_id !== user.dealerId) return res.status(403).json({ error: 'Forbidden' });

    const daysToSell = Math.floor((new Date() - new Date(vehicles[0].created_at)) / (1000 * 60 * 60 * 24));

    await query(`
      UPDATE vehicles SET status = 'sold', sold_at = NOW(), days_to_sell = $1 WHERE id = $2
    `, [daysToSell, id]);

    await query(`
      UPDATE dealers SET total_sold = total_sold + 1,
      listing_integrity_score = LEAST(100, listing_integrity_score + 5)
      WHERE id = $1
    `, [user.dealerId]);

    return res.status(200).json({ ok: true, days_to_sell: daysToSell });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


