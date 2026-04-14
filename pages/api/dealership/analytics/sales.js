// pages/api/dealership/analytics/sales.js
// FIXED: replaced withAuth('dealership') + profile_id with inline JWT decode using dealerId.

import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/db';

function getDealer(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'dealer' ? decoded : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getDealer(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const dealerId = user.dealerId;
  const { period = '30d' } = req.query;
  const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';

  try {
    const [salesTrends, salesByModel, daysToSell, pricePerformance] = await Promise.all([
      query(`
        SELECT
          DATE_TRUNC('week', sold_at) as period,
          COUNT(*) as vehicles_sold,
          COALESCE(SUM(price_aed), 0) as revenue,
          COALESCE(AVG(price_aed), 0) as avg_selling_price
        FROM vehicles
        WHERE dealer_id = $1 AND sold_at IS NOT NULL
          AND sold_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE_TRUNC('week', sold_at)
        ORDER BY period
      `, [dealerId]),

      query(`
        SELECT make, model,
          COUNT(*) as units_sold,
          COALESCE(SUM(price_aed), 0) as total_revenue,
          COALESCE(AVG(price_aed), 0) as avg_selling_price
        FROM vehicles
        WHERE dealer_id = $1 AND sold_at IS NOT NULL
          AND sold_at >= NOW() - INTERVAL '${interval}'
        GROUP BY make, model
        ORDER BY units_sold DESC
        LIMIT 10
      `, [dealerId]),

      query(`
        SELECT
          AVG(days_to_sell) as avg_days_to_sell,
          MIN(days_to_sell) as min_days_to_sell,
          MAX(days_to_sell) as max_days_to_sell
        FROM vehicles
        WHERE dealer_id = $1 AND sold_at IS NOT NULL AND days_to_sell IS NOT NULL
          AND sold_at >= NOW() - INTERVAL '${interval}'
      `, [dealerId]),

      query(`
        SELECT make, model,
          COUNT(*) as units_sold,
          COALESCE(AVG(price_aed), 0) as avg_selling_price,
          COALESCE(AVG(mileage_km), 0) as avg_mileage
        FROM vehicles
        WHERE dealer_id = $1 AND sold_at IS NOT NULL
          AND sold_at >= NOW() - INTERVAL '${interval}'
        GROUP BY make, model
        ORDER BY avg_selling_price DESC
        LIMIT 10
      `, [dealerId]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        trends: salesTrends,
        byModel: salesByModel,
        daysToSell: daysToSell[0],
        pricePerformance,
      },
      period,
    });
  } catch (err) {
    console.error('Sales analytics error:', err);
    return res.status(500).json({ error: err.message });
  }
}



