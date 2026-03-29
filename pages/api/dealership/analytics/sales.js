import { query } from '../../../../lib/db';
import { withAuth } from '../../../../lib/middleware';

// GET - Get detailed sales analytics
const getSalesAnalytics = async (req, res) => {
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

    // Get sales trends
    const salesTrends = await query(`
      SELECT 
        DATE_TRUNC('week', sold_at) as period,
        COUNT(*) as vehicles_sold,
        COALESCE(SUM(price_aed), 0) as revenue,
        COALESCE(AVG(price_aed), 0) as avg_selling_price
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('week', sold_at)
      ORDER BY period
    `, [dealershipId]);

    // Get sales by make/model
    const salesByModel = await query(`
      SELECT 
        make,
        model,
        COUNT(*) as units_sold,
        COALESCE(SUM(price_aed), 0) as total_revenue,
        COALESCE(AVG(price_aed), 0) as avg_selling_price,
        COALESCE(MIN(sold_at), NOW()) as first_sale_date,
        COALESCE(MAX(sold_at), NOW()) as last_sale_date
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${interval}'
      GROUP BY make, model
      ORDER BY units_sold DESC
      LIMIT 10
    `, [dealershipId]);

    // Get average days to sell
    const daysToSell = await query(`
      SELECT 
        AVG(days_to_sell) as avg_days_to_sell,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_sell) as median_days_to_sell,
        MIN(days_to_sell) as min_days_to_sell,
        MAX(days_to_sell) as max_days_to_sell
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND days_to_sell IS NOT NULL
        AND sold_at >= NOW() - INTERVAL '${interval}'
    `, [dealershipId]);

    // Get price performance
    const pricePerformance = await query(`
      SELECT 
        make,
        model,
        COUNT(*) as units_sold,
        COALESCE(AVG(price_aed), 0) as avg_selling_price,
        COALESCE(AVG(mileage_km), 0) as avg_mileage,
        COALESCE(MIN(price_aed), 0) as min_price,
        COALESCE(MAX(price_aed), 0) as max_price
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${interval}'
      GROUP BY make, model
      ORDER BY avg_selling_price DESC
      LIMIT 10
    `, [dealershipId]);

    return res.status(200).json({
      success: true,
      data: {
        trends: salesTrends,
        byModel: salesByModel,
        daysToSell: daysToSell[0],
        pricePerformance: pricePerformance
      },
      period: period
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sales analytics data',
      details: error.message 
    });
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getSalesAnalytics, 'dealership')(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}