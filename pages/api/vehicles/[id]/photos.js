import { query } from '../../../../lib/db';
import { uploadImage } from '../../../../lib/cloudinary';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

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
  const { id } = req.query;

  if (req.method === 'POST') {
    const user = getDealer(req);
    if (!user || user.role !== 'dealer') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Verify vehicle belongs to this dealer
      const vehicles = await query(`
        SELECT id, photos, dealer_id FROM vehicles WHERE id = $1
      `, [id]);

      if (!vehicles.length) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      if (vehicles[0].dealer_id !== user.dealerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { image_base64 } = req.body;

      if (!image_base64) {
        return res.status(400).json({ error: 'image_base64 required' });
      }

      // Strip data URL prefix if present
      const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Upload to Cloudinary
      const result = await uploadImage(imageBuffer, {
        public_id: `vehicle_${id}_${Date.now()}`
      });

      // Append URL to vehicle photos array
      const currentPhotos = vehicles[0].photos || [];
      const updatedPhotos = [...currentPhotos, result.secure_url];

      await query(`
        UPDATE vehicles SET photos = $1 WHERE id = $2
      `, [updatedPhotos, id]);

      return res.status(200).json({
        ok: true,
        url: result.secure_url,
        photos: updatedPhotos
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const user = getDealer(req);
    if (!user || user.role !== 'dealer') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { url } = req.body;

      const vehicles = await query(`
        SELECT id, photos, dealer_id FROM vehicles WHERE id = $1
      `, [id]);

      if (!vehicles.length) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      if (vehicles[0].dealer_id !== user.dealerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedPhotos = (vehicles[0].photos || []).filter(p => p !== url);

      await query(`
        UPDATE vehicles SET photos = $1 WHERE id = $2
      `, [updatedPhotos, id]);

      return res.status(200).json({ ok: true, photos: updatedPhotos });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

