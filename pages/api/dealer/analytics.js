import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

function getDealer(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getDealer(req);
  if (!user || user.role !== 'dealer') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const dealerId = user.dealerId;

    // Dealer profile
    const dealers = await query(`
      SELECT 
        d.*,
        s.showroom_number,
        s.section,
        s.location_hint
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      WHERE d.id = $1
    `, [dealerId]);

    if (!dealers.length) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const dealer = dealers[0];

    // Vehicle stats per car
    const vehicles = await query(`
      SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.price_aed,
        v.mileage_km,
        v.specs,
        v.status,
        v.views_count,
        v.whatsapp_clicks,
        v.saves_count,
        v.created_at,
        v.expires_at,
        v.confirmed_at,
        v.days_to_sell,
        EXTRACT(DAY FROM (NOW() - v.created_at)) as days_listed,
        EXTRACT(DAY FROM (v.expires_at - NOW())) as days_until_expiry
      FROM vehicles v
      WHERE v.dealer_id = $1
      ORDER BY v.created_at DESC
    `, [dealerId]);

    // Overall stats
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
        COALESCE(SUM(views_count) FILTER (WHERE status = 'active'), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks) FILTER (WHERE status = 'active'), 0) as total_whatsapp,
        COALESCE(AVG(days_to_sell) FILTER (WHERE status = 'sold'), 0) as avg_days_to_sell,
        COALESCE(AVG(price_aed) FILTER (WHERE status = 'active'), 0) as avg_listing_price
      FROM vehicles
      WHERE dealer_id = $1
    `, [dealerId]);

    // Market demand — top searched makes in this market
    const marketDemand = await query(`
      SELECT
        v.make,
        COUNT(ae.id) as search_count
      FROM analytics_events ae
      JOIN vehicles v ON ae.vehicle_id = v.id
      WHERE ae.event_type = 'view'
      AND ae.market_id = (
        SELECT market_id FROM showrooms WHERE dealer_id = $1 LIMIT 1
      )
      AND ae.created_at > NOW() - INTERVAL '7 days'
      GROUP BY v.make
      ORDER BY search_count DESC
      LIMIT 5
    `, [dealerId]);

    // Underperforming vehicles — active more than 7 days with less than 5 views
    const underperforming = vehicles.filter(v =>
      v.status === 'active' &&
      parseInt(v.days_listed) > 7 &&
      v.views_count < 5
    );

    // Expiring soon — within 3 days
    const expiringSoon = vehicles.filter(v =>
      v.status === 'active' &&
      parseFloat(v.days_until_expiry) <= 3
    );

    // Performance insight messages
    const insights = [];

    const s = stats[0];
    if (parseInt(s.sold_count) > 0 && parseInt(s.expired_count) > 0) {
      const ratio = parseInt(s.sold_count) / parseInt(s.expired_count);
      if (ratio < 1) {
        insights.push('⚠️ More listings are expiring than selling. Consider revising prices on slow movers.');
      }
    }

    if (underperforming.length > 0) {
      insights.push(`📉 ${underperforming.length} listing${underperforming.length > 1 ? 's have' : ' has'} low views after 7 days. Consider reducing the price.`);
    }

    if (expiringSoon.length > 0) {
      insights.push(`⏰ ${expiringSoon.length} listing${expiringSoon.length > 1 ? 's are' : ' is'} expiring within 3 days. Send /confirm on the bot to renew.`);
    }

    if (parseInt(s.total_whatsapp) > 0 && parseInt(s.total_views) > 0) {
      const convRate = ((parseInt(s.total_whatsapp) / parseInt(s.total_views)) * 100).toFixed(1);
      insights.push(`💬 Your WhatsApp conversion rate is ${convRate}%. Market average is ~8%.`);
    }

    return res.status(200).json({
      dealer,
      stats: stats[0],
      vehicles,
      market_demand: marketDemand,
      underperforming,
      expiring_soon: expiringSoon,
      insights
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

