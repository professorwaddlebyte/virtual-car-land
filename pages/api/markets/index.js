import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const markets = await query(`
      SELECT 
        m.*,
        COUNT(DISTINCT s.id) as showroom_count,
        COUNT(DISTINCT v.id) as active_vehicle_count,
        COUNT(DISTINCT d.id) as dealer_count
      FROM markets m
      LEFT JOIN showrooms s ON m.id = s.market_id
      LEFT JOIN vehicles v ON m.id = v.market_id AND v.status = 'active'
      LEFT JOIN dealers d ON s.dealer_id = d.id
      WHERE m.status = 'active'
      GROUP BY m.id
      ORDER BY m.name ASC
    `);

    return res.status(200).json({ markets });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}