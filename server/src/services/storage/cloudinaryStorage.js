import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

// Cap absurdly large uploads; Cloudinary applies this on ingest.
const INCOMING = [{ width: 2000, height: 2000, crop: 'limit' }];

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: 'image', transformation: INCOMING, ...options }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(buffer);
  });
}

export const cloudinaryStorage = {
  name: 'cloudinary',

  /** Public catalogue images (products, categories). */
  async uploadPublic(buffer, { folder }) {
    const r = await uploadBuffer(buffer, { folder, type: 'upload' });
    return { url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height };
  },

  /** Private assets (payment screenshots): type "authenticated" - no public URL exists. */
  async uploadPrivate(buffer, { folder }) {
    const r = await uploadBuffer(buffer, { folder, type: 'authenticated' });
    return { publicId: r.public_id, format: r.format, storage: 'cloudinary' };
  },

  /** Short-lived signed download URL. Only ever handed to the authenticated admin. */
  getPrivateUrl({ screenshotPublicId, screenshotFormat }) {
    if (!screenshotPublicId) return null;
    return cloudinary.utils.private_download_url(screenshotPublicId, screenshotFormat || 'jpg', {
      resource_type: 'image',
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
    });
  },

  async destroy(publicId, { isPrivate = false } = {}) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        type: isPrivate ? 'authenticated' : 'upload',
        invalidate: true,
      });
    } catch (err) {
      console.error('[storage] Failed to delete asset', publicId, err.message);
    }
  },

  isTrustedImage({ url, publicId }) {
    if (typeof url !== 'string') return false;
    if (url.startsWith('/placeholders/')) return true; // bundled demo art
    const prefix = `https://res.cloudinary.com/${env.cloudinary.cloudName}/`;
    return url.startsWith(prefix) && typeof publicId === 'string' && publicId.startsWith('alnoor/');
  },
};
