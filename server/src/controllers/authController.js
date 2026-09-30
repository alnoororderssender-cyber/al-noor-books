import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { loginSchema } from '../utils/schemas.js';
import { clearAdminCookie, setAdminCookie, signAdminToken } from '../middleware/auth.js';

// A real bcrypt hash used to keep response timing similar when the email is wrong.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 12);

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  if (!env.admin.email || !env.admin.passwordHash) {
    throw new ApiError(503, 'Admin sign-in is not configured yet.');
  }
  const emailOk = email === env.admin.email;
  const passwordOk = await bcrypt.compare(password, emailOk ? env.admin.passwordHash : DUMMY_HASH);
  if (!emailOk || !passwordOk) throw new ApiError(401, 'Incorrect email or password.');

  setAdminCookie(res, signAdminToken(env.admin.email));
  res.json({ email: env.admin.email });
}

export function logout(_req, res) {
  clearAdminCookie(res);
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ email: req.admin.email });
}
