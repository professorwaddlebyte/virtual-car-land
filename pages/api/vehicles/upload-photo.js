import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'ddxvujhad',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Important: Increase body size limit for Base64 image strings
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_base64 } = req.body;

    if (!image_base64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Upload to Cloudinary folder 'dawirny_listings'
    const uploadRes = await cloudinary.uploader.upload(image_base64, {
      folder: 'dawirny_listings',
    });

    // Return the secure URL to the frontend
    return res.status(200).json({ 
      url: uploadRes.secure_url 
    });
    
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}



