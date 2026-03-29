import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const markets = await query(`
      SELECT * 
      FROM markets 
      WHERE id = $1
    `, [id]);

    if (!markets.length) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const showrooms = await query(`
      SELECT 
        s.*,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        COUNT(v.id) as active_vehicles
      FROM showrooms s
      LEFT JOIN dealers d ON s.dealer_id = d.id
      LEFT JOIN vehicles v ON s.id = v.showroom_id AND v.status = 'active'
      WHERE s.market_id = $1
      GROUP BY s.id, d.business_name, d.listing_integrity_score, d.score_tier, d.phone
      ORDER BY s.showroom_number ASC
    `, [id]);

    return res.status(200).json({
      market: markets[0],
      showrooms
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}