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
  const { id } = req.query;
  const user = getDealer(req);

  // GET — public
  if (req.method === 'GET') {
    try {
      const vehicles = await query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
      if (!vehicles.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ vehicle: vehicles[0] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // All other methods require dealer auth
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });

  // PATCH — edit vehicle
  if (req.method === 'PATCH') {
    try {
      const { price_aed, description, mileage_km, specs } = req.body;

      // Verify ownership
      const vehicles = await query(`SELECT id, dealer_id, price_aed FROM vehicles WHERE id = $1`, [id]);
      if (!vehicles.length) return res.status(404).json({ error: 'Not found' });
      if (vehicles[0].dealer_id !== user.dealerId) return res.status(403).json({ error: 'Forbidden' });

      // Track price change
      if (price_aed && parseInt(price_aed) !== parseInt(vehicles[0].price_aed)) {
        await query(`
          INSERT INTO price_history (vehicle_id, old_price, new_price, changed_at)
          VALUES ($1, $2, $3, NOW())
        `, [id, vehicles[0].price_aed, price_aed]);
      }

      await query(`
        UPDATE vehicles SET
          price_aed = COALESCE($1, price_aed),
          description = COALESCE($2, description),
          mileage_km = COALESCE($3, mileage_km),
          specs = CASE WHEN $4::text IS NOT NULL THEN $4::jsonb ELSE specs END
        WHERE id = $5
      `, [price_aed || null, description || null, mileage_km || null, specs ? JSON.stringify(specs) : null, id]);

      const updated = await query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
      return res.status(200).json({ ok: true, vehicle: updated[0] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — remove vehicle
  if (req.method === 'DELETE') {
    try {
      const vehicles = await query(`SELECT dealer_id FROM vehicles WHERE id = $1`, [id]);
      if (!vehicles.length) return res.status(404).json({ error: 'Not found' });
      if (vehicles[0].dealer_id !== user.dealerId) return res.status(403).json({ error: 'Forbidden' });

      await query(`DELETE FROM vehicles WHERE id = $1`, [id]);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


