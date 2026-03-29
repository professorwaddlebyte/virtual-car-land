import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/middleware';

// GET - Get detailed engagement analytics
const getEngagementAnalytics = async (req, res) => {
  try {
    const dealershipId = req.user.profile_id;
    const { period = '30d' } = req.query;

    // Determine date range based on period
    let interval;
    switch (period) {
      case '7d':
        interval = '7 days';
        break;
      case '30d':
        interval = '30 days';
        break;
      case '90d':
        interval = '90 days';
        break;
      default:
        interval = '30 days';
    }

    // Get engagement trends over time
    const engagementTrends = await query(`
      SELECT 
        DATE_TRUNC('week', created_at) as period,
        SUM(views_count) as total_views,
        SUM(whatsapp_clicks) as total_whatsapp_clicks,
        SUM(saves_count) as total_saves,
        COUNT(*) as active_vehicles
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'active'
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY period
    `, [dealershipId]);

    // Get top engaged vehicles
    const topEngagedVehicles = await query(`
      SELECT 
        id,
        make,
        model,
        year,
        views_count,
        whatsapp_clicks,
        saves_count,
        (views_count + whatsapp_clicks + saves_count) as total_engagement
      FROM vehicles 
      WHERE dealer_id = $1
      ORDER BY total_engagement DESC
      LIMIT 10
    `, [dealershipId]);

    // Get engagement ratios
    const engagementRatios = await query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COALESCE(SUM(CASE WHEN views_count > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_views,
        COALESCE(SUM(CASE WHEN whatsapp_clicks > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_whatsapp,
        COALESCE(SUM(CASE WHEN saves_count > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_saves,
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
        COALESCE(SUM(saves_count), 0) as total_saves,
        COALESCE(AVG(views_count), 0) as avg_views,
        COALESCE(AVG(whatsapp_clicks), 0) as avg_whatsapp,
        COALESCE(AVG(saves_count), 0) as avg_saves
      FROM vehicles 
      WHERE dealer_id = $1
    `, [dealershipId]);

    // Get inquiry data (assuming inquiries table tracks view events)
    const inquiryData = await query(`
      SELECT 
        DATE_TRUNC('week', created_at) as period,
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN inquiry_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN inquiry_type = 'whatsapp_click' THEN 1 END) as whatsapp_clicks,
        COUNT(CASE WHEN inquiry_type = 'save' THEN 1 END) as saves
      FROM inquiries 
      WHERE dealer_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY period
    `, [dealershipId]);

    return res.status(200).json({
      success: true,
      data: {
        trends: engagementTrends,
        topVehicles: topEngagedVehicles,
        ratios: engagementRatios[0],
        inquiries: inquiryData
      },
      period: period
    });

  } catch (error) {
    console.error('Engagement analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch engagement analytics data',
      details: error.message 
    });
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getEngagementAnalytics, 'dealership')(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}