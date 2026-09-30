import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'submitted', 'paid'];

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshots: old orders keep their original name/price if the product changes.
    productNameSnapshot: { type: String, required: true },
    productSlug: { type: String, default: '' },
    image: { type: String, default: '' },
    selectedType: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      cityArea: { type: String, required: true },
      address: { type: String, required: true },
      note: { type: String, default: '' },
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    payment: {
      method: { type: String, enum: ['cod', 'online'], required: true },
      status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
      // Payment screenshots live in PRIVATE storage; only the reference is stored.
      screenshotPublicId: { type: String, default: null },
      screenshotFormat: { type: String, default: null },
      screenshotStorage: { type: String, enum: ['cloudinary', 'local', null], default: null },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryCharge: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    notification: {
      status: { type: String, enum: ['pending', 'sent', 'failed', 'skipped', 'mock'], default: 'pending' },
      error: { type: String, default: '' },
      attemptedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
