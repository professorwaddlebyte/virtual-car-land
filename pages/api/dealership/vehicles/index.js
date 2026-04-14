// pages/api/dealership/vehicles/index.js
// REWRITTEN: removed all mockData references. Now queries NeonDB directly.
// Auth: JWT decoded inline — no dependency on broken lib/middleware role check.

import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/db';

function getDealer(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'dealer') return null;
    return decoded; // { userId, email, role, dealerId }
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const decoded = getDealer(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list this dealer's vehicles
  // ?sold=true  → sold_at IS NOT NULL
  // ?sold=false or omitted → sold_at IS NULL (active inventory)
  if (req.method === 'GET') {
    try {
      const { sold, page = 1, limit = 20 } = req.query;

      const conditions = ['v.dealer_id = $1'];
      const params = [decoded.dealerId];

      if (sold === 'true') {
        conditions.push('v.sold_at IS NOT NULL');
      } else if (sold === 'false' || sold === undefined) {
        conditions.push('v.sold_at IS NULL');
      }
      // sold param omitted entirely → no filter, return all

      const where = conditions.join(' AND ');
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const [vehiclesRes, countRes] = await Promise.all([
        query(`
          SELECT
            v.id, v.make, v.model, v.year, v.price_aed,
            v.mileage_km, v.status, v.photos, v.specs,
            v.description, v.created_at, v.sold_at
          FROM vehicles v
          WHERE ${where}
          ORDER BY v.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, parseInt(limit), offset]),

        query(`
          SELECT COUNT(*) AS total FROM vehicles v WHERE ${where}
        `, params),
      ]);

      const total = parseInt(countRes[0].total);

      return res.status(200).json({
        vehicles: vehiclesRes,
        pagination: {
          page:  parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error('GET dealership vehicles error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}




