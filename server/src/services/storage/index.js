import { env } from '../../config/env.js';
import { cloudinaryStorage } from './cloudinaryStorage.js';
import { localStorage } from './localStorage.js';

/** Cloudinary when configured (required in production); local disk fallback for development only. */
export const storage = env.hasCloudinary ? cloudinaryStorage : localStorage;

if (!env.hasCloudinary) {
  console.warn('[storage] Cloudinary is not configured - using local disk fallback (development only).');
}
