import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static uploadImage(buffer: Buffer, folder: string): Promise<{ url: string, publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  static async deleteImage(publicId: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok' || result.result === 'not found') {
          return;
        }
        throw new Error(`Cloudinary delete returned: ${result.result}`);
      } catch (error) {
        if (i === retries - 1) {
          console.error(`Failed to delete image ${publicId} after ${retries} attempts:`, error);
        } else {
          // exponential backoff
          await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
        }
      }
    }
  }
}
