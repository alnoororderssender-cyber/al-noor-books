import { z } from 'zod';
import { MAX_IMAGES, MAX_TYPES } from '../models/Product.js';
import { normalizePkPhone } from './phone.js';

const str = (max) => z.string().trim().max(max);
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  password: z.string().min(1, 'Enter your password.').max(200),
});

export const imageRefSchema = z.object({
  url: z.string().trim().min(1).max(600),
  publicId: z.string().trim().max(300).nullish(),
});

export const categorySchema = z.object({
  name: str(60).min(2, 'Enter a category name.'),
  image: imageRefSchema,
});

export const productSchema = z.object({
  name: str(120).min(2, 'Enter a product name.'),
  categoryId: objectId,
  price: z.coerce.number({ invalid_type_error: 'Enter a valid price.' }).int('Use a whole number.').min(1, 'Price must be at least Rs. 1.').max(10_000_000),
  description: str(5000).min(1, 'Enter a description.'),
  images: z.array(imageRefSchema).min(1, 'Add at least 1 image.').max(MAX_IMAGES, `You can add up to ${MAX_IMAGES} images.`),
  types: z
    .array(str(40).min(1))
    .max(MAX_TYPES, `You can add up to ${MAX_TYPES} types.`)
    .default([])
    .transform((arr) => [...new Set(arr.map((t) => t.trim()).filter(Boolean))]),
  featured: z.boolean().default(false),
});

const money = z.coerce.number().int('Use a whole number.').min(0).max(1_000_000);

export const settingsSchema = z
  .object({
    announcement: str(160).min(1, 'Announcement cannot be empty.'),
    deliveryCharge: money,
    freeDeliveryThreshold: money,
    payment: z
      .object({
        jazzCashTitle: str(100),
        jazzCashNumber: str(40),
        bankTitle: str(100),
        bankName: str(100),
        accountNumber: str(60),
        iban: str(60),
      })
      .partial(),
    store: z
      .object({
        phone: str(40),
        whatsapp: str(40),
        email: str(120),
        address: str(300),
        hours: str(200),
        facebook: str(300),
        instagram: str(300),
      })
      .partial(),
  })
  .partial();

export const orderStatusSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    paymentStatus: z.enum(['pending', 'submitted', 'paid']),
  })
  .partial();

// ---- Checkout ----
export const orderPayloadSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(80).optional(),
  paymentMethod: z.enum(['cod', 'online'], { errorMap: () => ({ message: 'Choose a payment method.' }) }),
  customer: z.object({
    name: str(80).min(2, 'Enter your full name.'),
    phone: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const n = normalizePkPhone(v);
        if (!n) ctx.addIssue({ code: 'custom', message: 'Enter a valid phone number, e.g. 03XX XXXXXXX.' });
        return n ?? v;
      }),
    cityArea: str(120).min(2, 'Enter your city and area.'),
    address: str(300).min(5, 'Enter your complete delivery address.'),
    note: str(500).optional().default(''),
  }),
  items: z
    .array(
      z.object({
        productId: objectId,
        selectedType: str(40).optional().default(''),
        quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(100),
      }),
    )
    .min(1, 'Your cart is empty.')
    .max(40),
});
