import { Settings } from '../models/Settings.js';
import { settingsSchema } from '../utils/schemas.js';
import { getSettings, toPaymentInfo, toPublicSettings } from '../services/settingsService.js';

export async function getPublic(_req, res) {
  res.json(toPublicSettings(await getSettings()));
}

// Payment details are only needed at checkout, so they have their own endpoint.
export async function getPaymentInfo(_req, res) {
  res.json(toPaymentInfo(await getSettings()));
}

export async function getAdmin(_req, res) {
  const s = await getSettings();
  res.json({
    announcement: s.announcement,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    payment: s.payment,
    store: s.store,
  });
}

export async function updateAdmin(req, res) {
  const data = settingsSchema.parse(req.body);
  await getSettings(); // make sure the document exists
  const $set = {};
  for (const key of ['announcement', 'deliveryCharge', 'freeDeliveryThreshold']) {
    if (data[key] !== undefined) $set[key] = data[key];
  }
  for (const group of ['payment', 'store']) {
    for (const [k, v] of Object.entries(data[group] || {})) $set[`${group}.${k}`] = v;
  }
  if (Object.keys($set).length) await Settings.updateOne({ key: 'main' }, { $set });
  await getAdmin(req, res);
}
