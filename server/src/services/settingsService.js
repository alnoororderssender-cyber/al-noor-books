import { Settings } from '../models/Settings.js';

export async function getSettings() {
  return Settings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

export function toPublicSettings(s) {
  return {
    announcement: s.announcement,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    store: { ...s.store },
  };
}

export function toPaymentInfo(s) {
  return { ...s.payment };
}

export function hasOnlinePaymentDetails(s) {
  const p = s.payment || {};
  return Boolean((p.jazzCashNumber && p.jazzCashNumber.trim()) || (p.accountNumber && p.accountNumber.trim()) || (p.iban && p.iban.trim()));
}
