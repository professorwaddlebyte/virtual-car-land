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
  // 1. Verify Authorization (matching your working photos.js)
  const user = getDealer(req);
  if (!user || user.role !== 'dealer') return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image_base64 } = req.body;
    if (!image_base64) return res.status(400).json({ error: 'No image data' });

    // 2. Use the dynamic import that works in your photos.js
    const { uploadImage } = await import('../../../lib/cloudinary.js');
    
    // 3. Convert to Buffer exactly like the working version
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 4. Perform upload
    const result = await uploadImage(buffer, { 
      folder: 'vcarland/vehicles',
      public_id: `temp_new_car_${Date.now()}` 
    });

    return res.status(200).json({ ok: true, url: result.secure_url });
  } catch (e) {
    console.error("Upload Error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}



