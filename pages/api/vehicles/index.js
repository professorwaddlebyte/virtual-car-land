import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const {
      market_id, make, model, year_min, year_max,
      price_min, price_max, gcc, transmission, body,
      status = 'active', page = 1, limit = 40
    } = req.query;

    let conditions = ['v.status = $1'];
    let params = [status];
    let paramIndex = 2;

    if (market_id) { conditions.push(`v.market_id = $${paramIndex++}`); params.push(market_id); }
    if (make) { conditions.push(`LOWER(v.make) = LOWER($${paramIndex++})`); params.push(make); }
    if (model) { conditions.push(`LOWER(v.model) LIKE LOWER($${paramIndex++})`); params.push(`%${model}%`); }
    if (year_min) { conditions.push(`v.year >= $${paramIndex++}`); params.push(parseInt(year_min)); }
    if (year_max) { conditions.push(`v.year <= $${paramIndex++}`); params.push(parseInt(year_max)); }
    if (price_min) { conditions.push(`v.price_aed >= $${paramIndex++}`); params.push(parseInt(price_min)); }
    if (price_max) { conditions.push(`v.price_aed <= $${paramIndex++}`); params.push(parseInt(price_max)); }
    if (gcc !== undefined && gcc !== '') { conditions.push(`(v.specs->>'gcc')::boolean = $${paramIndex++}`); params.push(gcc === 'true'); }
    if (transmission) { conditions.push(`LOWER(v.specs->>'transmission') = LOWER($${paramIndex++})`); params.push(transmission); }
    if (body) { conditions.push(`LOWER(v.specs->>'body') = LOWER($${paramIndex++})`); params.push(body); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = conditions.join(' AND ');

    const vehicles = await query(`
      SELECT v.id, v.make, v.model, v.year, v.price_aed, v.mileage_km,
        v.specs, v.photos, v.status, v.views_count, v.description,
        v.created_at, v.expires_at,
        d.business_name as dealer_name, d.listing_integrity_score, d.score_tier, d.phone as dealer_phone,
        s.showroom_number, s.section, s.location_hint, s.map_x, s.map_y,
        m.name as market_name
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE ${whereClause}
      ORDER BY d.listing_integrity_score DESC, v.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, parseInt(limit), offset]);

    const countResult = await query(`SELECT COUNT(*) as total FROM vehicles v WHERE ${whereClause}`, params);

    return res.status(200).json({
      vehicles,
      pagination: {
        total: parseInt(countResult[0]?.total || 0),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult[0]?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}



