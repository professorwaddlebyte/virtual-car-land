import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

function getAdmin(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user.role === 'admin' ? user : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = getAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Platform overview
    const overview = await query(`
      SELECT
        (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as active_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'sold') as sold_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'expired') as expired_vehicles,
        (SELECT COUNT(*) FROM dealers) as total_dealers,
        (SELECT COUNT(*) FROM dealers WHERE subscription_tier != 'Basic') as paid_dealers,
        (SELECT COUNT(*) FROM markets WHERE status = 'active') as active_markets,
        (SELECT COUNT(*) FROM inquiries WHERE created_at > NOW() - INTERVAL '7 days') as inquiries_7d,
        (SELECT COUNT(*) FROM inquiries WHERE inquiry_type = 'whatsapp_click' AND created_at > NOW() - INTERVAL '7 days') as whatsapp_7d,
        (SELECT COALESCE(SUM(views_count), 0) FROM vehicles) as total_views
    `);

    // All dealers with stats
    const dealers = await query(`
      SELECT
        d.id,
        d.business_name,
        d.listing_integrity_score,
        d.score_tier,
        d.subscription_tier,
        d.subscription_status,
        d.total_listings,
        d.total_sold,
        d.total_expired,
        d.telegram_chat_id,
        d.phone,
        s.showroom_number,
        s.section,
        m.name as market_name,
        COUNT(v.id) FILTER (WHERE v.status = 'active') as active_vehicles,
        COALESCE(SUM(v.views_count), 0) as total_views
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      LEFT JOIN markets m ON s.market_id = m.id
      LEFT JOIN vehicles v ON d.id = v.dealer_id
      GROUP BY d.id, s.showroom_number, s.section, m.name
      ORDER BY d.listing_integrity_score DESC
    `);

    // All markets
    const markets = await query(`
      SELECT
        m.*,
        COUNT(DISTINCT s.id) as showroom_count,
        COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'active') as active_vehicles,
        COUNT(DISTINCT d.id) as dealer_count
      FROM markets m
      LEFT JOIN showrooms s ON m.id = s.market_id
      LEFT JOIN vehicles v ON m.id = v.market_id
      LEFT JOIN dealers d ON s.dealer_id = d.id
      GROUP BY m.id
      ORDER BY m.name ASC
    `);

    // Recent inquiries
    const recentInquiries = await query(`
      SELECT
        i.inquiry_type,
        i.created_at,
        v.make,
        v.model,
        v.year,
        d.business_name as dealer_name
      FROM inquiries i
      JOIN vehicles v ON i.vehicle_id = v.id
      JOIN dealers d ON i.dealer_id = d.id
      ORDER BY i.created_at DESC
      LIMIT 20
    `);

    // Tier distribution
    const tierDist = await query(`
      SELECT score_tier, COUNT(*) as count
      FROM dealers
      GROUP BY score_tier
      ORDER BY count DESC
    `);

    return res.status(200).json({
      overview: overview[0],
      dealers,
      markets,
      recent_inquiries: recentInquiries,
      tier_distribution: tierDist
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

