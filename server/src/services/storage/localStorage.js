// DEVELOPMENT-ONLY fallback used when Cloudinary is not configured.
// Files are written under server/.dev-uploads. Never used in production.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { detectImageType } from '../../utils/imageType.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEV_UPLOAD_ROOT = path.resolve(here, '../../../.dev-uploads');

async function save(buffer, { folder, area }) {
  const type = detectImageType(buffer);
  const id = crypto.randomUUID();
  const publicId = `${folder}/${id}`;
  const file = path.join(DEV_UPLOAD_ROOT, area, `${publicId}.${type.format}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
  return { publicId, format: type.format };
}

export const localStorage = {
  name: 'local',

  async uploadPublic(buffer, { folder }) {
    const { publicId, format } = await save(buffer, { folder, area: 'public' });
    return { url: `/dev-uploads/${publicId}.${format}`, publicId };
  },

  async uploadPrivate(buffer, { folder }) {
    const { publicId, format } = await save(buffer, { folder, area: 'private' });
    return { publicId, format, storage: 'local' };
  },

  getPrivateUrl({ screenshotPublicId, screenshotFormat }) {
    if (!screenshotPublicId) return null;
    return `/api/admin/private-files/${screenshotPublicId}.${screenshotFormat}`;
  },

  async destroy(publicId, { isPrivate = false } = {}) {
    if (!publicId) return;
    const area = isPrivate ? 'private' : 'public';
    for (const ext of ['jpg', 'png', 'webp']) {
      // eslint-disable-next-line no-await-in-loop
      await fs.rm(path.join(DEV_UPLOAD_ROOT, area, `${publicId}.${ext}`), { force: true });
    }
  },

  isTrustedImage({ url }) {
    return typeof url === 'string' && (url.startsWith('/placeholders/') || url.startsWith('/dev-uploads/'));
  },
};
