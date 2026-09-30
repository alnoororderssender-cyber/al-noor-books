import mongoose from 'mongoose';

// One centralised settings document (key: "main"), editable from the admin panel.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    announcement: { type: String, default: 'FREE DELIVERY ON ORDERS ABOVE RS. 3,000', maxlength: 160 },
    deliveryCharge: { type: Number, default: 200, min: 0 },
    freeDeliveryThreshold: { type: Number, default: 3000, min: 0 },
    payment: {
      jazzCashTitle: { type: String, default: '' },
      jazzCashNumber: { type: String, default: '' },
      bankTitle: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      iban: { type: String, default: '' },
    },
    // Public store details used by footer, Contact page and the WhatsApp banner.
    store: {
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      hours: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model('Settings', settingsSchema);
