import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/middleware';

// GET - Get comprehensive dealership analytics
const getAnalytics = async (req, res) => {
  try {
    const dealershipId = req.user.profile_id;
    
    // Get basic inventory stats
    const inventoryStats = await query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vehicles,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_vehicles,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_vehicles,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_vehicles,
        COALESCE(SUM(CASE WHEN status = 'sold' THEN price_aed END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'sold' THEN price_aed END), 0) as avg_selling_price
      FROM vehicles 
      WHERE dealer_id = $1
    `, [dealershipId]);

    // Get sales performance over time (last 30 days)
    const salesTrend = await query(`
      SELECT 
        DATE_TRUNC('day', sold_at) as date,
        COUNT(*) as vehicles_sold,
        COALESCE(SUM(price_aed), 0) as revenue
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', sold_at)
      ORDER BY date
    `, [dealershipId]);

    // Get engagement metrics
    const engagementStats = await query(`
      SELECT 
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp_clicks,
        COALESCE(SUM(saves_count), 0) as total_saves,
        COALESCE(AVG(views_count), 0) as avg_views_per_vehicle,
        COALESCE(AVG(whatsapp_clicks), 0) as avg_whatsapp_per_vehicle,
        COALESCE(AVG(saves_count), 0) as avg_saves_per_vehicle
      FROM vehicles 
      WHERE dealer_id = $1
    `, [dealershipId]);

    // Get top performing vehicles (by views)
    const topVehicles = await query(`
      SELECT 
        id,
        make,
        model,
        year,
        price_aed,
        views_count,
        whatsapp_clicks,
        saves_count,
        status
      FROM vehicles 
      WHERE dealer_id = $1
      ORDER BY views_count DESC
      LIMIT 5
    `, [dealershipId]);

    // Get inventory age distribution
    const inventoryAge = await query(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 7 THEN '0-7 days'
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 30 THEN '8-30 days'
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 90 THEN '31-90 days'
          ELSE '90+ days'
        END as age_group,
        COUNT(*) as count
      FROM vehicles 
      WHERE dealer_id = $1 AND status = 'active'
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '0-7 days' THEN 1
          WHEN '8-30 days' THEN 2
          WHEN '31-90 days' THEN 3
          ELSE 4
        END
    `, [dealershipId]);

    // Get dealership info for context
    const dealershipInfo = await query(`
      SELECT 
        business_name,
        listing_integrity_score,
        score_tier,
        total_listings,
        total_sold,
        response_rate
      FROM dealers 
      WHERE id = $1
    `, [dealershipId]);

    return res.status(200).json({
      success: true,
      data: {
        inventory: inventoryStats[0],
        salesTrend: salesTrend,
        engagement: engagementStats[0],
        topVehicles: topVehicles,
        inventoryAge: inventoryAge,
        dealership: dealershipInfo[0]
      }
    });

  } catch (error) {
    console.error('Dealership analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getAnalytics, 'dealership')(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}