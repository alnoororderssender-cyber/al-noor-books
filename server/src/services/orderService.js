import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { detectImageType } from '../utils/imageType.js';
import { getSettings, hasOnlinePaymentDetails } from './settingsService.js';
import { calculateTotals } from './pricingService.js';
import { storage } from './storage/index.js';
import { notifyOwnerOfOrder } from './email/index.js';

const ORDER_ID_ATTEMPTS = 6;
const newOrderId = () => `ANB-${crypto.randomInt(100000, 1000000)}`;

/** Public, customer-safe view of an order (shown on the confirmation page). */
export function toCustomerOrder(order) {
  return {
    orderId: order.orderId,
    createdAt: order.createdAt,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      cityArea: order.customer.cityArea,
      address: order.customer.address,
    },
    items: order.items.map((i) => ({
      name: i.productNameSnapshot,
      slug: i.productSlug,
      image: i.image,
      selectedType: i.selectedType,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    payment: { method: order.payment.method, status: order.payment.status },
    pricing: order.pricing,
  };
}

/** Re-prices the cart from the database. Nothing price-related is taken from the client. */
async function buildItems(rawItems) {
  const ids = [...new Set(rawItems.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = rawItems.map((raw) => {
    const product = byId.get(raw.productId);
    if (!product) {
      throw new ApiError(400, 'One of the items in your cart is no longer available. Please review your cart.');
    }
    const hasTypes = product.types.length > 0;
    if (hasTypes && !raw.selectedType) {
      throw new ApiError(400, `Please choose a type for "${product.name}".`);
    }
    if (hasTypes && !product.types.includes(raw.selectedType)) {
      throw new ApiError(400, `The selected type for "${product.name}" is no longer available. Please review your cart.`);
    }
    return {
      productId: product._id,
      productNameSnapshot: product.name,
      productSlug: product.slug,
      image: product.images[0]?.url || '',
      selectedType: hasTypes ? raw.selectedType : '',
      quantity: raw.quantity,
      unitPrice: product.price,
      subtotal: product.price * raw.quantity,
    };
  });
  return items;
}

async function insertWithUniqueId(doc) {
  for (let attempt = 0; attempt < ORDER_ID_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await Order.create({ ...doc, orderId: newOrderId() });
    } catch (err) {
      const dup = err?.code === 11000;
      const onOrderId = dup && (err.keyPattern?.orderId || /orderId/.test(err.message));
      if (!onOrderId) throw err;
    }
  }
  throw new ApiError(500, 'We could not generate an order number. Please try again.');
}

export async function createOrder({ payload, file }) {
  // Duplicate-submit protection: same key returns the order that was already created.
  if (payload.idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey: payload.idempotencyKey });
    if (existing) return { order: existing, duplicate: true };
  }

  const settings = await getSettings();
  const items = await buildItems(payload.items);
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const pricing = calculateTotals(subtotal, settings);

  const isOnline = payload.paymentMethod === 'online';
  let screenshot = null;

  if (isOnline) {
    if (!hasOnlinePaymentDetails(settings)) {
      throw new ApiError(400, 'Online payment is not available right now. Please choose Cash on Delivery.');
    }
    if (!file) {
      throw new ApiError(400, 'Please upload your payment screenshot.', { screenshot: 'Payment screenshot is required.' });
    }
    if (!detectImageType(file.buffer)) {
      throw new ApiError(400, 'The screenshot must be a JPG, PNG or WebP image.', { screenshot: 'Upload a JPG, PNG or WebP image.' });
    }
    try {
      screenshot = await storage.uploadPrivate(file.buffer, { folder: 'alnoor/payments' });
    } catch (err) {
      console.error('[orders] Screenshot upload failed:', err.message);
      throw new ApiError(502, 'We could not upload your screenshot. Please try again.');
    }
  }

  const doc = {
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    customer: payload.customer,
    items,
    pricing,
    payment: {
      method: payload.paymentMethod,
      status: isOnline ? 'submitted' : 'pending',
      screenshotPublicId: screenshot?.publicId ?? null,
      screenshotFormat: screenshot?.format ?? null,
      screenshotStorage: screenshot?.storage ?? null,
    },
  };

  let order;
  try {
    order = await insertWithUniqueId(doc);
  } catch (err) {
    if (screenshot) await storage.destroy(screenshot.publicId, { isPrivate: true });
    // Lost a race with a concurrent identical submit: return the winner.
    if (err?.code === 11000 && payload.idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey: payload.idempotencyKey });
      if (existing) return { order: existing, duplicate: true };
    }
    throw err;
  }

  // Order is saved. Notify the owner in the background; failures never affect the customer.
  notifyOwnerOfOrder(order.toObject()).catch((e) => console.error('[orders] notify error', e));

  return { order, duplicate: false };
}
