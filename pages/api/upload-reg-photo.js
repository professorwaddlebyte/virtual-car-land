// pages/api/upload-reg-photo.js
// Unauthenticated image upload for dealer self-registration
// No auth required — public endpoint
// Mirrors the exact same pattern as upload-photo.js

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image_base64, doc_type } = req.body;

    if (!image_base64) return res.status(400).json({ error: 'No image data provided' });
    if (!['trade_license', 'emirates_id_front', 'emirates_id_back'].includes(doc_type)) {
      return res.status(400).json({ error: 'Invalid doc_type' });
    }

    const { uploadImage } = await import('../../lib/cloudinary.js');

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await uploadImage(buffer, {
      folder: 'vcarland/registrations',
      public_id: `${doc_type}_${Date.now()}`,
    });

    return res.status(200).json({ ok: true, url: result.secure_url });
  } catch (e) {
    console.error('Registration upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}


