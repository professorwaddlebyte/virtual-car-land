// pages/api/dealership/analytics/engagement.js
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
    const [topVehicles, ratios] = await Promise.all([
      query(`
        SELECT id, make, model, year, views_count, whatsapp_clicks, saves_count,
          (views_count + whatsapp_clicks + saves_count) as total_engagement
        FROM vehicles
        WHERE dealer_id = $1
        ORDER BY total_engagement DESC
        LIMIT 10
      `, [dealerId]),

      query(`
        SELECT
          COUNT(*) as total_vehicles,
          COALESCE(SUM(CASE WHEN views_count > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_views,
          COALESCE(SUM(CASE WHEN whatsapp_clicks > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_whatsapp,
          COALESCE(SUM(views_count), 0) as total_views,
          COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
          COALESCE(SUM(saves_count), 0) as total_saves,
          COALESCE(AVG(views_count), 0) as avg_views,
          COALESCE(AVG(whatsapp_clicks), 0) as avg_whatsapp
        FROM vehicles
        WHERE dealer_id = $1
      `, [dealerId]),
    ]);

    return res.status(200).json({
      success: true,
      data: { topVehicles, ratios: ratios[0] },
      period,
    });
  } catch (err) {
    console.error('Engagement analytics error:', err);
    return res.status(500).json({ error: err.message });
  }
}




