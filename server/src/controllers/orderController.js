import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { objectId, orderPayloadSchema, orderStatusSchema } from '../utils/schemas.js';
import { createOrder, toCustomerOrder } from '../services/orderService.js';
import { storage } from '../services/storage/index.js';
import { getSettings } from '../services/settingsService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- Public ----------
export async function create(req, res) {
  let raw;
  try {
    raw = JSON.parse(req.body?.payload ?? '');
  } catch {
    throw new ApiError(400, 'Your order could not be read. Please try again.');
  }
  const payload = orderPayloadSchema.parse(raw);
  const { order, duplicate } = await createOrder({ payload, file: req.file });
  res.status(duplicate ? 200 : 201).json(toCustomerOrder(order));
}

// ---------- Admin ----------
function adminView(order) {
  const o = order.toObject ? order.toObject() : order;
  const { screenshotPublicId, screenshotFormat, screenshotStorage, ...payment } = o.payment;
  return {
    ...o,
    payment: {
      ...payment,
      hasScreenshot: Boolean(screenshotPublicId),
      screenshotUrl: screenshotPublicId ? storage.getPrivateUrl({ screenshotPublicId, screenshotFormat }) : null,
    },
  };
}

export async function adminList(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ orderId: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-items').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({
    orders: orders.map((o) => ({
      _id: o._id,
      orderId: o.orderId,
      createdAt: o.createdAt,
      customer: { name: o.customer.name, phone: o.customer.phone },
      pricing: o.pricing,
      payment: { method: o.payment.method, status: o.payment.status },
      status: o.status,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

async function findOrder(idParam) {
  if (/^ANB-\d{6}$/i.test(idParam)) return Order.findOne({ orderId: idParam.toUpperCase() });
  return Order.findById(objectId.parse(idParam));
}

export async function adminGet(req, res) {
  const order = await findOrder(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json(adminView(order));
}

export async function adminUpdate(req, res) {
  const { status, paymentStatus } = orderStatusSchema.parse(req.body);
  const order = await findOrder(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (status) order.status = status;
  if (paymentStatus) order.payment.status = paymentStatus;
  await order.save();
  res.json(adminView(order));
}

export async function adminDelete(req, res) {
  const order = await findOrder(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  await order.deleteOne();
  // The private payment screenshot goes with the order.
  if (order.payment.screenshotPublicId) {
    await storage.destroy(order.payment.screenshotPublicId, { isPrivate: true });
  }
  res.json({ ok: true });
}

export async function adminStats(_req, res) {
  const [productCount, categoryCount, orderCount, recent, settings] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(5).select('-items').lean(),
    getSettings(),
  ]);
  res.json({
    productCount,
    categoryCount,
    orderCount,
    deliveryCharge: settings.deliveryCharge,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    recentOrders: recent.map((o) => ({
      _id: o._id,
      orderId: o.orderId,
      createdAt: o.createdAt,
      customer: { name: o.customer.name },
      pricing: o.pricing,
      payment: { method: o.payment.method, status: o.payment.status },
      status: o.status,
    })),
  });
}
