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

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]).join(',');
  const lines = rows.map(row =>
    Object.values(row).map(v => {
      if (v === null || v === undefined) return '';
      const str = String(v).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    }).join(',')
  );
  return [headers, ...lines].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = getAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type } = req.query;

  try {
    let data, filename;

    if (type === 'vehicles') {
      data = await query(`
        SELECT
          v.id,
          v.make,
          v.model,
          v.year,
          v.price_aed,
          v.mileage_km,
          v.status,
          v.views_count,
          v.whatsapp_clicks,
          v.saves_count,
          v.days_to_sell,
          v.specs->>'gcc' as gcc,
          v.specs->>'color' as color,
          v.specs->>'transmission' as transmission,
          v.specs->>'body' as body,
          d.business_name as dealer,
          s.showroom_number,
          m.name as market,
          v.created_at,
          v.sold_at
        FROM vehicles v
        LEFT JOIN dealers d ON v.dealer_id = d.id
        LEFT JOIN showrooms s ON v.showroom_id = s.id
        LEFT JOIN markets m ON v.market_id = m.id
        ORDER BY v.created_at DESC
      `);
      filename = 'vehicles-export.csv';

    } else if (type === 'dealers') {
      data = await query(`
        SELECT
          d.id,
          d.business_name,
          d.phone,
          d.listing_integrity_score,
          d.score_tier,
          d.subscription_tier,
          d.subscription_status,
          d.total_listings,
          d.total_sold,
          d.total_expired,
          d.telegram_chat_id IS NOT NULL as bot_connected,
          s.showroom_number,
          s.section,
          m.name as market,
          d.created_at
        FROM dealers d
        LEFT JOIN showrooms s ON d.id = s.dealer_id
        LEFT JOIN markets m ON s.market_id = m.id
        ORDER BY d.listing_integrity_score DESC
      `);
      filename = 'dealers-export.csv';

    } else if (type === 'inquiries') {
      data = await query(`
        SELECT
          i.id,
          i.inquiry_type,
          i.created_at,
          v.make,
          v.model,
          v.year,
          v.price_aed,
          d.business_name as dealer,
          s.showroom_number,
          m.name as market
        FROM inquiries i
        JOIN vehicles v ON i.vehicle_id = v.id
        JOIN dealers d ON i.dealer_id = d.id
        LEFT JOIN showrooms s ON v.showroom_id = s.id
        LEFT JOIN markets m ON v.market_id = m.id
        ORDER BY i.created_at DESC
      `);
      filename = 'inquiries-export.csv';

    } else {
      return res.status(400).json({ error: 'Invalid type. Use vehicles, dealers, or inquiries' });
    }

    const csv = toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

