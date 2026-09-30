import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const COOKIE_NAME = 'anb_admin';
const SESSION_MS = 8 * 60 * 60 * 1000;

export function cookieOptions() {
  const sameSite = ['lax', 'strict', 'none'].includes(env.cookieSameSite) ? env.cookieSameSite : 'lax';
  return {
    httpOnly: true,
    secure: env.isProd || sameSite === 'none',
    sameSite,
    path: '/',
  };
}

export function signAdminToken(email) {
  return jwt.sign({ role: 'admin', email }, env.jwtSecret, { algorithm: 'HS256', expiresIn: '8h' });
}

export function setAdminCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_MS });
}

export function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

/** Protects every /api/admin route (except login). */
export function requireAdmin(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(new ApiError(401, 'Please sign in to continue.'));
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    if (payload.role !== 'admin' || !env.admin.email || payload.email !== env.admin.email) {
      throw new Error('bad claims');
    }
    req.admin = { email: payload.email };
    return next();
  } catch {
    return next(new ApiError(401, 'Your session has expired. Please sign in again.'));
  }
}
