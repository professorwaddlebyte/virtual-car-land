import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const vehicles = await query(`
      SELECT 
        v.*,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        d.telegram_username as dealer_telegram,
        s.showroom_number,
        s.section,
        s.location_hint,
        s.map_x,
        s.map_y,
        m.name as market_name,
        m.id as market_id
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE v.id = $1
    `, [id]);

    if (!vehicles.length) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicles[0];

    // Log view event
    await query(`
      UPDATE vehicles 
      SET views_count = views_count + 1 
      WHERE id = $1
    `, [id]);

    await query(`
      INSERT INTO analytics_events (vehicle_id, dealer_id, market_id, event_type, metadata)
      VALUES ($1, $2, $3, 'view', $4)
    `, [id, vehicle.dealer_id, vehicle.market_id, JSON.stringify({ timestamp: new Date() })]);

    // Get price history
    const priceHistory = await query(`
      SELECT old_price, new_price, changed_at
      FROM price_history 
      WHERE vehicle_id = $1 
      ORDER BY changed_at ASC
    `, [id]);

    // Get market average for same make/model/year
    const marketAvg = await query(`
      SELECT 
        ROUND(AVG(price_aed)) as avg_price,
        COUNT(*) as similar_count,
        MIN(price_aed) as min_price,
        MAX(price_aed) as max_price
      FROM vehicles 
      WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
    `, [vehicle.make, vehicle.model, vehicle.year]);

    const avg = marketAvg[0];
    const priceDiff = avg?.avg_price ? Math.round(((vehicle.price_aed - avg.avg_price) / avg.avg_price) * 100) : null;

    return res.status(200).json({
      vehicle,
      price_history: priceHistory,
      market_intelligence: {
        avg_price: parseInt(avg?.avg_price || 0),
        similar_count: parseInt(avg?.similar_count || 0),
        min_price: parseInt(avg?.min_price || 0),
        max_price: parseInt(avg?.max_price || 0),
        price_vs_market_pct: priceDiff
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}