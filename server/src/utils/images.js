import { ApiError } from './ApiError.js';
import { storage } from '../services/storage/index.js';

/** Only accept image references that came from our own storage (or bundled demo art). */
export function assertTrustedImages(images, field = 'images') {
  for (const img of images) {
    if (!storage.isTrustedImage(img)) {
      throw new ApiError(400, 'One of the images is not valid. Please upload it again.', { [field]: 'Invalid image.' });
    }
  }
}

export const cleanImage = (img) => ({ url: img.url, publicId: img.publicId || null });

/** Delete storage assets that are no longer referenced (best effort). */
export async function destroyImages(images) {
  await Promise.all(images.filter((i) => i?.publicId).map((i) => storage.destroy(i.publicId)));
}
