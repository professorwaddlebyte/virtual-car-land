// pages/api/dealership/vehicles/[id].js
// REWRITTEN: removed all mockData references. Now queries NeonDB directly.
// Handles PATCH (edit) and DELETE for a dealer's own vehicle.

import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/db';

function getDealer(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'dealer') return null;
    return decoded;
  } catch { return null; }
}

export default async function handler(req, res) {
  const decoded = getDealer(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  // Verify ownership — dealer can only touch their own vehicles
  const ownerCheck = await query(
    `SELECT id FROM vehicles WHERE id = $1 AND dealer_id = $2`,
    [id, decoded.dealerId]
  );
  if (!ownerCheck.length) {
    return res.status(404).json({ error: 'Vehicle not found or access denied' });
  }

  // PATCH — update price, mileage, description, specs
  if (req.method === 'PATCH') {
    try {
      const { price_aed, mileage_km, description, specs } = req.body;

      // Build dynamic SET clause for only provided fields
      const updates = [];
      const params = [];

      if (price_aed !== undefined) {
        params.push(parseInt(price_aed));
        updates.push(`price_aed = $${params.length}`);
      }
      if (mileage_km !== undefined) {
        params.push(parseInt(mileage_km));
        updates.push(`mileage_km = $${params.length}`);
      }
      if (description !== undefined) {
        params.push(description);
        updates.push(`description = $${params.length}`);
      }
      if (specs !== undefined) {
        params.push(JSON.stringify(specs));
        updates.push(`specs = $${params.length}`);

        // If photos exist and specs changed, revert to draft for re-approval
        const photoCheck = await query(
          `SELECT photos FROM vehicles WHERE id = $1`, [id]
        );
        const hasPhotos = photoCheck[0]?.photos?.length > 0;
        if (hasPhotos) {
          updates.push(`status = 'draft'`);
        }
      }

      if (!updates.length) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(id);
      const rows = await query(`
        UPDATE vehicles
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id, make, model, year, price_aed, mileage_km, status, specs, description
      `, params);

      return res.status(200).json({ ok: true, vehicle: rows[0] });
    } catch (err) {
      console.error('PATCH vehicle error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE — remove vehicle
  if (req.method === 'DELETE') {
    try {
      await query(`DELETE FROM vehicles WHERE id = $1`, [id]);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE vehicle error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}




