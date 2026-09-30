import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Files are kept in memory only long enough to validate and forward them to storage.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5, fieldSize: 100 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new ApiError(400, 'Please upload a JPG, PNG or WebP image.'));
    }
    return cb(null, true);
  },
});
