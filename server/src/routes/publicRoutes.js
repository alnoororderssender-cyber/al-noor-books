import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import * as settings from '../controllers/settingsController.js';
import * as categories from '../controllers/categoryController.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import { imageUpload } from '../middleware/upload.js';
import { orderLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/settings/public', h(settings.getPublic));
router.get('/settings/payment', h(settings.getPaymentInfo));
router.get('/categories', h(categories.list));
router.get('/products', h(products.list));
router.get('/products/:slug', h(products.getBySlug));

// multipart: `payload` (JSON string) + optional `screenshot` file
router.post('/orders', orderLimiter, imageUpload.single('screenshot'), h(orders.create));

export default router;
