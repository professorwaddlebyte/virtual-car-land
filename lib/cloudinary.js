import { v2 as cloudinary } from 'cloudinary';

cloudinary.config();

export async function uploadImage(imageBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'vcarland/vehicles',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(imageBuffer);
  });
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;

