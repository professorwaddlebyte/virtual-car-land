import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

function getDealer(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = getDealer(req);
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { make, model, year, price_aed, mileage_km, color, transmission, fuel, body, cylinders, gcc, description, photos } = req.body;
    if (!make || !model || !year || !price_aed) return res.status(400).json({ error: 'make, model, year and price_aed are required' });

    const showrooms = await query(`SELECT id, market_id FROM showrooms WHERE dealer_id = $1 LIMIT 1`, [user.dealerId]);
    const showroom = showrooms[0];

    const hasPhotos = photos && photos.length > 0;

    // If photos are included, listing goes pending for admin approval
    // If no photos, listing goes active immediately
    const status = hasPhotos ? 'draft' : 'active';

    const result = await query(`
      INSERT INTO vehicles (
        dealer_id, showroom_id, market_id,
        make, model, year, price_aed, mileage_km,
        specs, description, photos, status,
         confirmed_at, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW() + INTERVAL '14 days')
      RETURNING id
    `, [
      user.dealerId, showroom?.id || null, showroom?.market_id || null,
      make, model, parseInt(year), parseInt(price_aed),
      mileage_km ? parseInt(mileage_km) : null,
      JSON.stringify({ gcc: !!gcc, color: color || null, transmission: transmission || null, fuel: fuel || null, body: body || null, cylinders: cylinders || null }),
      description || null,
      hasPhotos ? photos : null,
      status
    ]);

    await query(`UPDATE dealers SET total_listings = total_listings + 1 WHERE id = $1`, [user.dealerId]);

    return res.status(200).json({
      ok: true,
      id: result[0].id,
      status,
      message: hasPhotos
        ? 'Listing submitted for admin approval. It will go live once approved.'
        : 'Listing is now live.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


