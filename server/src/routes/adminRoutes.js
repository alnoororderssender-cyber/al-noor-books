import path from 'node:path';
import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { imageUpload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as settings from '../controllers/settingsController.js';
import * as categories from '../controllers/categoryController.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as uploads from '../controllers/uploadController.js';
import { storage } from '../services/storage/index.js';
import { DEV_UPLOAD_ROOT } from '../services/storage/localStorage.js';

const router = Router();

// Public admin endpoints
router.post('/login', loginLimiter, h(auth.login));
router.post('/logout', auth.logout);

// Everything below requires a valid admin session.
router.use(requireAdmin);

router.get('/me', auth.me);
router.get('/stats', h(orders.adminStats));

router.post('/categories', h(categories.create));
router.put('/categories/:id', h(categories.update));
router.delete('/categories/:id', h(categories.remove));

router.get('/products/:id', h(products.getById));
router.post('/products', h(products.create));
router.put('/products/:id', h(products.update));
router.delete('/products/:id', h(products.remove));

router.post('/uploads/image', imageUpload.single('image'), h(uploads.uploadImage));

router.get('/orders', h(orders.adminList));
router.get('/orders/:id', h(orders.adminGet));
router.patch('/orders/:id', h(orders.adminUpdate));
router.delete('/orders/:id', h(orders.adminDelete));

router.get('/settings', h(settings.getAdmin));
router.put('/settings', h(settings.updateAdmin));

// Development-only: serves private payment screenshots stored on local disk.
if (storage.name === 'local') {
  router.get('/private-files/*', (req, res) => {
    const rel = req.params[0];
    if (!/^alnoor\/payments\/[\w-]+\.(jpg|png|webp)$/.test(rel)) return res.status(404).end();
    res.set('Cache-Control', 'private, no-store');
    return res.sendFile(path.join(DEV_UPLOAD_ROOT, 'private', rel));
  });
}

export default router;
