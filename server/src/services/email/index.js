import { env } from '../../config/env.js';
import { Order } from '../../models/Order.js';
import { buildHtml, buildSubject, buildText } from './formatEmail.js';

const RESEND_API_KEY = () => (process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = () =>
  (process.env.EMAIL_FROM || '').trim() || 'Al Noor Books <onboarding@resend.dev>';

// OWNER_EMAIL can hold one address or several separated by commas.
function ownerRecipients() {
  return (env.smtp.ownerEmail || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY() && ownerRecipients().length);
}

/** Boot-time check: only logs whether the settings are present. */
export async function verifyEmailSetup() {
  if (!isEmailConfigured()) {
    console.warn('[email] Not configured - owner order emails are disabled. Set RESEND_API_KEY and OWNER_EMAIL.');
    return;
  }
  console.log('[email] Resend is configured.');
}

async function sendViaResend({ to, subject, text, html }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM(), to, subject, text, html }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Emails the owner about a new order. NEVER throws: the order is already saved and must
 * stay valid whatever happens here. The outcome is recorded on the order for admins and
 * any failure is logged under the [email] tag, separate from order handling.
 */
export async function notifyOwnerOfOrder(order) {
  const patch = { 'notification.attemptedAt': new Date() };

  if (!isEmailConfigured()) {
    console.warn(`[email] Skipped for ${order.orderId}: email is not configured.`);
    if (!env.isProd) console.log(`\n${buildText(order)}\n`);
    patch['notification.status'] = 'skipped';
    patch['notification.error'] = 'Email not configured';
  } else {
    try {
      await sendViaResend({
        to: ownerRecipients(),
        subject: buildSubject(order),
        text: buildText(order),
        html: buildHtml(order),
      });
      patch['notification.status'] = 'sent';
      patch['notification.error'] = '';
    } catch (err) {
      console.error(`[email] Failed to send order email for ${order.orderId}:`, err.message);
      patch['notification.status'] = 'failed';
      patch['notification.error'] = String(err.message).slice(0, 300);
    }
  }

  try {
    await Order.updateOne({ _id: order._id }, { $set: patch });
  } catch (err) {
    console.error('[email] Could not record notification result:', err.message);
  }
}