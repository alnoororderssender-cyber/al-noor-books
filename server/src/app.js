import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { storage } from './services/storage/index.js';
import { DEV_UPLOAD_ROOT } from './services/storage/localStorage.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { originCheck } from './middleware/originCheck.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.isProd) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'script-src': ["'self'"],
          'connect-src': ["'self'"],
          'font-src': ["'self'", 'data:'],
          'frame-src': ["'self'", 'https://www.google.com'],
          'upgrade-insecure-requests': env.isProd ? [] : null,
        },
      },
    }),
  );
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false); // no CORS headers, instead of throwing a 500
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', apiLimiter, originCheck);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);
  app.use('/api', notFound);

  if (storage.name === 'local') {
    app.use('/dev-uploads', express.static(path.join(DEV_UPLOAD_ROOT, 'public'), { maxAge: '1h' }));
  }

  // Production: serve the built React app and fall back to index.html for client routes.
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: env.isProd ? '7d' : 0, index: false }));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}