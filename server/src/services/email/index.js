import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { Order } from '../../models/Order.js';
import { buildHtml, buildSubject, buildText } from './formatEmail.js';

let transporter;

export function isEmailConfigured() {
  const s = env.smtp;
  return Boolean(s.host && s.user && s.pass && s.ownerEmail);
}

function getTransporter() {
  if (!transporter) {
    const s = env.smtp;
    transporter = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.secure, // true for 465, false for 587 (STARTTLS)
      auth: { user: s.user, pass: s.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/** Optional boot-time check so a wrong SMTP password shows up in the logs immediately. */
export async function verifyEmailSetup() {
  if (!isEmailConfigured()) {
    console.warn('[email] SMTP is not configured - owner order emails are disabled. Set SMTP_* and OWNER_EMAIL.');
    return;
  }
  try {
    await getTransporter().verify();
    console.log('[email] SMTP connection verified.');
  } catch (err) {
    console.error('[email] SMTP verification failed:', err.message);
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
    console.warn(`[email] Skipped for ${order.orderId}: SMTP is not configured.`);
    if (!env.isProd) console.log(`\n${buildText(order)}\n`);
    patch['notification.status'] = 'skipped';
    patch['notification.error'] = 'SMTP not configured';
  } else {
    try {
      await getTransporter().sendMail({
        from: env.smtp.from,
        to: env.smtp.ownerEmail,
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
