import { ApiError } from '../utils/ApiError.js';
import { detectImageType } from '../utils/imageType.js';
import { storage } from '../services/storage/index.js';

const FOLDERS = { product: 'alnoor/products', category: 'alnoor/categories' };

// Admin-only. Returns { url, publicId } that the product/category form then submits.
export async function uploadImage(req, res) {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload.');
  if (!detectImageType(req.file.buffer)) {
    throw new ApiError(400, 'That file is not a valid JPG, PNG or WebP image.');
  }
  const folder = FOLDERS[req.query.kind] || FOLDERS.product;
  try {
    const image = await storage.uploadPublic(req.file.buffer, { folder });
    res.status(201).json({ url: image.url, publicId: image.publicId });
  } catch (err) {
    console.error('[upload] failed:', err.message);
    throw new ApiError(502, 'The image could not be uploaded. Please try again.');
  }
}
