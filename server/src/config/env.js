import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const get = (key, fallback = '') => clean(process.env[key]) || fallback;

export const env = {
  isProd,
  port: Number(get('PORT', '5000')),
  mongodbUri: get('MONGODB_URI'),
  jwtSecret: get('JWT_SECRET'),
  clientUrl: get('CLIENT_URL', 'http://localhost:5173'),
  cookieSameSite: get('COOKIE_SAMESITE', 'lax'), // lax | strict | none
  admin: {
    email: get('ADMIN_EMAIL').toLowerCase(),
    passwordHash: get('ADMIN_PASSWORD_HASH'),
  },
  cloudinary: {
    cloudName: get('CLOUDINARY_CLOUD_NAME'),
    apiKey: get('CLOUDINARY_API_KEY'),
    apiSecret: get('CLOUDINARY_API_SECRET'),
  },
  smtp: {
    host: get('SMTP_HOST'),
    port: Number(get('SMTP_PORT', '587')),
    secure: get('SMTP_SECURE', '') ? get('SMTP_SECURE') === 'true' : Number(get('SMTP_PORT', '587')) === 465,
    user: get('SMTP_USER'),
    pass: get('SMTP_PASS'),
    from: get('SMTP_FROM') || get('SMTP_USER'),
    ownerEmail: get('OWNER_EMAIL'), // one address, or several separated by commas
  },
};

env.hasCloudinary = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);
env.allowedOrigins = env.clientUrl
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

/** Fail fast on configuration that would make the app insecure or unusable. */
export function assertEnv() {
  const problems = [];
  if (!env.mongodbUri) problems.push('MONGODB_URI is required.');
  if (!env.jwtSecret) problems.push('JWT_SECRET is required.');
  if (isProd) {
    if (env.jwtSecret && env.jwtSecret.length < 32) {
      problems.push('JWT_SECRET must be at least 32 characters in production.');
    }
    if (!env.hasCloudinary) {
      problems.push('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required in production.');
    }
  }
  if (problems.length) {
    throw new Error(`Invalid server configuration:\n - ${problems.join('\n - ')}`);
  }
  if (!env.admin.email || !env.admin.passwordHash) {
    console.warn('[config] ADMIN_EMAIL / ADMIN_PASSWORD_HASH not set - admin login is disabled.');
  }
}
