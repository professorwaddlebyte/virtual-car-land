import { query } from '../../../../lib/db';
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
  const user = getDealer(req);
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;

  // Verify ownership
  const vehicles = await query(`SELECT id, dealer_id, photos FROM vehicles WHERE id = $1`, [id]);
  if (!vehicles.length) return res.status(404).json({ error: 'Not found' });
  if (vehicles[0].dealer_id !== user.dealerId) return res.status(403).json({ error: 'Forbidden' });

  // PATCH — reorder or delete photos
  if (req.method === 'PATCH') {
    const { photos } = req.body;
    await query(`UPDATE vehicles SET photos = $1 WHERE id = $2`, [photos, id]);
    return res.status(200).json({ ok: true, photos });
  }

  // POST — upload new photo
  if (req.method === 'POST') {
    try {
      const { image_base64 } = req.body;
      const { uploadImage } = await import('../../../../lib/cloudinary.js');
      const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await uploadImage(buffer, { public_id: `vehicle_${id}_${Date.now()}` });
      const current = vehicles[0].photos || [];
      const updated = [...current, result.secure_url];
      await query(`UPDATE vehicles SET photos = $1 WHERE id = $2`, [updated, id]);
      return res.status(200).json({ ok: true, url: result.secure_url, photos: updated });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



