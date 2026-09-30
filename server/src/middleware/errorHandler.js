import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'Not found.'));
}

export function zodToFields(err) {
  const fields = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

// Centralised error handling: customers never see raw backend errors.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors ? { errors: err.errors } : {}) });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Please check the highlighted fields.', errors: zodToFields(err) });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That image is too large. Please upload one under 5 MB.'
        : 'The upload could not be processed.';
    return res.status(400).json({ message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'That name is already in use. Please choose another.' });
  }
  if (err?.name === 'CastError') {
    return res.status(404).json({ message: 'Not found.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request.' });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}
