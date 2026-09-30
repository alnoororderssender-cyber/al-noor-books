import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (on top of SameSite cookies): state-changing requests that
 * carry an Origin header must come from our own site.
 */
export function originCheck(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next(); // non-browser clients (curl, server-to-server)
  const sameHost = `${req.protocol}://${req.get('host')}`;
  if (origin === sameHost || env.allowedOrigins.includes(origin)) return next();
  return next(new ApiError(403, 'Request blocked.'));
}
