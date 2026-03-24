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

function engagementScore(v) {
  const views = parseInt(v.views_count) || 0;
  const whatsapp = parseInt(v.whatsapp_clicks) || 0;
  const saves = parseInt(v.saves_count) || 0;
  return Math.min(100, Math.round(views * 1 + whatsapp * 15 + saves * 10));
}

function listingQualityScore(v) {
  let score = 0;
  if (v.photos && v.photos.length > 0) score += 30;
  if (v.photos && v.photos.length >= 3) score += 20;
  if (v.specs?.color) score += 10;
  if (v.specs?.transmission) score += 10;
  if (v.specs?.body) score += 10;
  if (v.specs?.fuel) score += 10;
  if (v.mileage_km) score += 10;
  return score;
}

function viewToInquiryRate(v) {
  const views = parseInt(v.views_count) || 0;
  const inquiries = (parseInt(v.whatsapp_clicks) || 0) + (parseInt(v.saves_count) || 0);
  if (views === 0) return 0;
  return Math.round((inquiries / views) * 100);
}

function aiFlag(v, avgPrice) {
  const days = parseFloat(v.days_listed) || 0;
  const views = parseInt(v.views_count) || 0;
  const whatsapp = parseInt(v.whatsapp_clicks) || 0;
  const priceDiff = avgPrice ? Math.round(((v.price_aed - avgPrice) / avgPrice) * 100) : null;

  const flags = [];

  if (days <= 3 && views > 8) flags.push({ label: 'High Demand', color: 'green', action: 'This listing is attracting strong interest. Respond quickly to inquiries.' });
  if (views > 15 && whatsapp > 2) flags.push({ label: 'Hot Listing', color: 'green', action: 'Excellent engagement. Keep this listing confirmed and updated.' });
  if (days > 10 && views < 5) flags.push({ label: 'Underexposed', color: 'orange', action: 'Very few buyers have seen this car. Confirm listing and ensure photos are added.' });
  if (days > 7 && views > 10 && whatsapp === 0) flags.push({ label: 'Price Resistance', color: 'red', action: priceDiff > 0 ? `Your price is ${priceDiff}% above market. Consider reducing to attract inquiries.` : 'High views but no contact. Consider reducing price or improving photos.' });
  if (days > 14) flags.push({ label: 'Slow Moving', color: 'red', action: 'This car has been listed for over 2 weeks. Review pricing and photos.' });
  if (priceDiff !== null && priceDiff > 5) flags.push({ label: 'Above Market', color: 'red', action: `Priced ${priceDiff}% above market average. Consider reducing by AED ${Math.round((v.price_aed - avgPrice) * 0.05).toLocaleString()} to enter competitive range.` });

  if (flags.length === 0) return [{ label: 'Active', color: 'blue', action: 'Listing is performing normally.' }];
  return flags;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getDealer(req);
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });

  try {
    const dealerId = user.dealerId;

    // Dealer profile + showroom
    const dealers = await query(`
      SELECT d.*, s.showroom_number, s.section, s.location_hint, m.name as market_name, m.id as market_id
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      LEFT JOIN markets m ON s.market_id = m.id
      WHERE d.id = $1
    `, [dealerId]);

    if (!dealers.length) return res.status(404).json({ error: 'Dealer not found' });
    const dealer = dealers[0];

    // All vehicles
    const vehicles = await query(`
      SELECT v.*,
        EXTRACT(DAY FROM (NOW() - v.created_at)) as days_listed,
        EXTRACT(DAY FROM (v.expires_at - NOW())) as days_until_expiry
      FROM vehicles v
      WHERE v.dealer_id = $1
      ORDER BY v.created_at DESC
    `, [dealerId]);

    // Market price intelligence per active vehicle
    const priceIntel = {};
    for (const v of vehicles.filter(v => v.status === 'active')) {
      const rows = await query(`
        SELECT 
          ROUND(AVG(price_aed)) as avg_price,
          MIN(price_aed) as min_price,
          MAX(price_aed) as max_price,
          COUNT(*) as count,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_aed) as median_price
        FROM vehicles
        WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
      `, [v.make, v.model, v.year]);

      const r = rows[0];
      const avg = parseFloat(r.avg_price) || null;
      const median = parseFloat(r.median_price) || null;
      const pct = avg ? Math.round(((v.price_aed - avg) / avg) * 100) : null;
      const recommended_min = median ? Math.round(median * 0.95) : null;
      const recommended_max = median ? Math.round(median * 1.02) : null;
      const in_range = recommended_min && recommended_max
        ? v.price_aed >= recommended_min && v.price_aed <= recommended_max
        : null;

      priceIntel[v.id] = {
        avg_price: avg ? Math.round(avg) : null,
        min_price: parseInt(r.min_price) || null,
        max_price: parseInt(r.max_price) || null,
        median_price: median ? Math.round(median) : null,
        similar_count: parseInt(r.count) || 0,
        pct_vs_market: pct,
        recommended_min,
        recommended_max,
        in_competitive_range: in_range,
      };
    }

    // Enrich vehicles with computed metrics
    const enriched = vehicles.map(v => {
      const intel = priceIntel[v.id] || null;
      const avgPrice = intel?.avg_price || null;
      return {
        ...v,
        engagement_score: engagementScore(v),
        listing_quality_score: listingQualityScore(v),
        view_to_inquiry_rate: viewToInquiryRate(v),
        price_intel: intel,
        ai_flag: v.status === 'active' ? aiFlag(v, avgPrice) : null,
      };
    });

    const activeVehicles = enriched.filter(v => v.status === 'active');

    // Overall stats
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
        COALESCE(SUM(views_count) FILTER (WHERE status = 'active'), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks) FILTER (WHERE status = 'active'), 0) as total_whatsapp,
        COALESCE(SUM(saves_count) FILTER (WHERE status = 'active'), 0) as total_saves,
        COALESCE(AVG(days_to_sell) FILTER (WHERE status = 'sold'), 0) as avg_days_to_sell,
        COALESCE(AVG(price_aed) FILTER (WHERE status = 'active'), 0) as avg_listing_price
      FROM vehicles WHERE dealer_id = $1
    `, [dealerId]);

    // Market demand — top viewed makes in this market last 30 days
    const marketDemand = await query(`
      SELECT v.make, v.specs->>'body' as body_type,
        COUNT(ae.id) as view_count
      FROM analytics_events ae
      JOIN vehicles v ON ae.vehicle_id = v.id
      WHERE ae.event_type = 'view'
      AND ae.market_id = $1
      AND ae.created_at > NOW() - INTERVAL '30 days'
      GROUP BY v.make, v.specs->>'body'
      ORDER BY view_count DESC
      LIMIT 10
    `, [dealer.market_id]);

    // Most searched price ranges
    const priceRanges = await query(`
      SELECT
        CASE
          WHEN v.price_aed < 30000 THEN 'Under 30K'
          WHEN v.price_aed < 60000 THEN '30K - 60K'
          WHEN v.price_aed < 100000 THEN '60K - 100K'
          WHEN v.price_aed < 150000 THEN '100K - 150K'
          ELSE 'Above 150K'
        END as range,
        COUNT(ae.id) as view_count
      FROM analytics_events ae
      JOIN vehicles v ON ae.vehicle_id = v.id
      WHERE ae.event_type = 'view'
      AND ae.market_id = $1
      AND ae.created_at > NOW() - INTERVAL '30 days'
      GROUP BY range
      ORDER BY view_count DESC
    `, [dealer.market_id]);

    // Body type demand
    const bodyTypeDemand = await query(`
      SELECT v.specs->>'body' as body_type, COUNT(ae.id) as view_count
      FROM analytics_events ae
      JOIN vehicles v ON ae.vehicle_id = v.id
      WHERE ae.event_type = 'view'
      AND ae.market_id = $1
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND v.specs->>'body' IS NOT NULL
      GROUP BY body_type
      ORDER BY view_count DESC
    `, [dealer.market_id]);

    // Competitive benchmarks — all dealers in same market
    const allDealers = await query(`
      SELECT 
        d.id,
        d.business_name,
        d.listing_integrity_score,
        d.score_tier,
        d.total_sold,
        d.total_expired,
        COALESCE(AVG(v.days_to_sell) FILTER (WHERE v.status = 'sold'), 0) as avg_days_to_sell,
        COALESCE(SUM(v.views_count) FILTER (WHERE v.status = 'active'), 0) as total_views,
        COALESCE(SUM(v.whatsapp_clicks) FILTER (WHERE v.status = 'active'), 0) as total_whatsapp,
        COUNT(v.id) FILTER (WHERE v.status = 'active') as active_count
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      LEFT JOIN vehicles v ON d.id = v.dealer_id
      WHERE s.market_id = $1
      GROUP BY d.id
      ORDER BY d.listing_integrity_score DESC
    `, [dealer.market_id]);

    const myRank = allDealers.findIndex(d => d.id === dealerId) + 1;
    const marketAvgDaysToSell = allDealers.reduce((sum, d) => sum + parseFloat(d.avg_days_to_sell || 0), 0) / (allDealers.length || 1);
    const top10AvgViews = allDealers.slice(0, Math.min(10, allDealers.length)).reduce((sum, d) => sum + parseInt(d.total_views || 0), 0) / Math.min(10, allDealers.length);

    const myStats = allDealers.find(d => d.id === dealerId) || {};
    const priceCompScore = activeVehicles.length > 0
      ? Math.round(activeVehicles.filter(v => v.price_intel?.in_competitive_range).length / activeVehicles.length * 100)
      : null;

    // Reputation metrics
    const photoRate = activeVehicles.length > 0
      ? Math.round(activeVehicles.filter(v => v.photos && v.photos.length > 0).length / activeVehicles.length * 100)
      : 0;
    const specRate = activeVehicles.length > 0
      ? Math.round(activeVehicles.filter(v => v.listing_quality_score >= 70).length / activeVehicles.length * 100)
      : 0;
    const avgQualityScore = activeVehicles.length > 0
      ? Math.round(activeVehicles.reduce((s, v) => s + v.listing_quality_score, 0) / activeVehicles.length)
      : 0;

    // Global recommended actions
    const actions = [];
    const slowMovers = activeVehicles.filter(v => parseFloat(v.days_listed) > 14);
    const priceResistance = activeVehicles.filter(v => parseFloat(v.days_listed) > 7 && parseInt(v.views_count) > 10 && parseInt(v.whatsapp_clicks) === 0);
    const priceAbove = activeVehicles.filter(v => v.price_intel?.pct_vs_market > 5);
    const underexposed = activeVehicles.filter(v => parseFloat(v.days_listed) > 10 && parseInt(v.views_count) < 5);
    const noPhotos = activeVehicles.filter(v => !v.photos || v.photos.length === 0);
    const expiringSoon = activeVehicles.filter(v => parseFloat(v.days_until_expiry) <= 3);

    if (expiringSoon.length > 0) actions.push({ priority: 'high', icon: '⏰', text: `${expiringSoon.length} listing${expiringSoon.length > 1 ? 's are' : ' is'} expiring within 3 days. Send /confirm on the bot now.`, vehicle_ids: expiringSoon.map(v => v.id) });
    if (noPhotos.length > 0) actions.push({ priority: 'high', icon: '📷', text: `${noPhotos.length} listing${noPhotos.length > 1 ? 's have' : ' has'} no photos. Listings with photos get up to 3x more views.`, vehicle_ids: noPhotos.map(v => v.id) });
    if (priceAbove.length > 0) actions.push({ priority: 'medium', icon: '💰', text: `${priceAbove.length} of your cars are priced above market average. Review pricing to improve inquiry rate.`, vehicle_ids: priceAbove.map(v => v.id) });
    if (priceResistance.length > 0) actions.push({ priority: 'medium', icon: '🚫', text: `${priceResistance.length} car${priceResistance.length > 1 ? 's have' : ' has'} high views but zero WhatsApp contact — buyers are looking but not buying. Review price or photos.`, vehicle_ids: priceResistance.map(v => v.id) });
    if (underexposed.length > 0) actions.push({ priority: 'medium', icon: '📉', text: `${underexposed.length} listing${underexposed.length > 1 ? 's have' : ' has'} very low visibility after 10 days. Confirm listing and add photos.`, vehicle_ids: underexposed.map(v => v.id) });
    if (slowMovers.length > 0) actions.push({ priority: 'medium', icon: '🐢', text: `${slowMovers.length} car${slowMovers.length > 1 ? 's have' : ' has'} been listed over 14 days without selling. Consider a price reduction.`, vehicle_ids: slowMovers.map(v => v.id) });
    if (marketDemand.length > 0) {
      const topMake = marketDemand[0];
      const hasTopMake = activeVehicles.some(v => v.make.toLowerCase() === topMake.make?.toLowerCase());
      if (!hasTopMake) actions.push({ priority: 'low', icon: '📈', text: `${topMake.make} is the most viewed brand in your market this month but you have none in stock.`, vehicle_ids: [] });
    }

    return res.status(200).json({
      dealer,
      stats: stats[0],
      vehicles: enriched,
      price_intelligence: priceIntel,
      market_demand: marketDemand,
      price_ranges: priceRanges,
      body_type_demand: bodyTypeDemand,
      competitive: {
        my_rank: myRank,
        total_dealers: allDealers.length,
        all_dealers: allDealers,
        market_avg_days_to_sell: Math.round(marketAvgDaysToSell),
        my_avg_days_to_sell: Math.round(parseFloat(myStats.avg_days_to_sell || 0)),
        top10_avg_views: Math.round(top10AvgViews),
        my_total_views: parseInt(myStats.total_views || 0),
        price_competitiveness_score: priceCompScore,
      },
      reputation: {
        photo_rate: photoRate,
        quality_rate: specRate,
        avg_quality_score: avgQualityScore,
        listing_integrity_score: dealer.listing_integrity_score,
        score_tier: dealer.score_tier,
      },
      actions,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

