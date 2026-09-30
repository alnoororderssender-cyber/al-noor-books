// Integration tests. They run against a RUNNING API and a SEEDED database:
//   1) npm run seed   2) npm run dev   3) (another terminal) npm test
// Env: API_URL (default http://localhost:5000), TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:5000';
const EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123';

let cookie = '';
let products = [];
let settingsBackup;

// Smallest valid PNG (1x1)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function call(path, { method = 'GET', json, form, auth = false } = {}) {
  const headers = {};
  if (auth) headers.Cookie = cookie;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (form) body = form;
  const res = await fetch(`${API}${path}`, { method, headers, body });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, data, res };
}

function orderForm({ items, method = 'cod', file, key, customer }) {
  const fd = new FormData();
  fd.set('payload', JSON.stringify({
    idempotencyKey: key,
    paymentMethod: method,
    customer: { name: 'Ahmed Khan', phone: '0300-1234567', cityArea: 'Johar Town, Lahore', address: 'House 123, Street 5', note: 'After 5 PM', ...customer },
    items,
  }));
  if (file) fd.set('screenshot', new Blob([file], { type: 'image/png' }), 'pay.png');
  return fd;
}

before(async () => {
  const r = await call('/api/products?limit=100');
  products = r.data.products;
  assert.ok(products.length >= 3, 'seed the database first (npm run seed)');
  const login = await call('/api/admin/login', { method: 'POST', json: { email: EMAIL, password: PASSWORD } });
  assert.equal(login.status, 200, 'admin login (check TEST_ADMIN_* env)');
  cookie = login.res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  settingsBackup = (await call('/api/admin/settings', { auth: true })).data;
});

const pick = (name) => products.find((p) => p.name.startsWith(name));

test('admin routes are blocked without a session', async () => {
  for (const p of ['/api/admin/me', '/api/admin/orders', '/api/admin/settings', '/api/admin/stats']) {
    assert.equal((await call(p)).status, 401, p);
  }
  assert.equal((await call('/api/admin/products', { method: 'POST', json: {} })).status, 401);
});

test('wrong admin password is rejected', async () => {
  const r = await call('/api/admin/login', { method: 'POST', json: { email: EMAIL, password: 'nope-nope' } });
  assert.equal(r.status, 401);
});

test('login cookie is httpOnly', async () => {
  const r = await call('/api/admin/login', { method: 'POST', json: { email: EMAIL, password: PASSWORD } });
  assert.match(r.res.headers.getSetCookie().join(';'), /HttpOnly/i);
});

test('delivery below threshold is charged; total calculated on the server', async () => {
  await call('/api/admin/settings', { method: 'PUT', auth: true, json: { deliveryCharge: 200, freeDeliveryThreshold: 3000 } });
  const sticky = pick('Sticky');
  const r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: sticky._id, quantity: 2 }] }) });
  assert.equal(r.status, 201);
  assert.match(r.data.orderId, /^ANB-\d{6}$/);
  assert.equal(r.data.pricing.subtotal, sticky.price * 2);
  assert.equal(r.data.pricing.deliveryCharge, 200);
  assert.equal(r.data.pricing.total, sticky.price * 2 + 200);
  assert.equal(r.data.customer.phone, '03001234567'); // normalised
});

test('free delivery at/above threshold', async () => {
  const pens = pick('Pilot');
  const r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: pens._id, selectedType: 'Blue', quantity: 3 }] }) });
  assert.equal(r.status, 201);
  assert.equal(r.data.pricing.deliveryCharge, 0);
  assert.equal(r.data.pricing.total, pens.price * 3);
});

test('client-sent prices are ignored', async () => {
  const sticky = pick('Sticky');
  const fd = new FormData();
  fd.set('payload', JSON.stringify({
    paymentMethod: 'cod',
    customer: { name: 'Ali', phone: '03211234567', cityArea: 'Lahore', address: 'Some street 1' },
    items: [{ productId: sticky._id, quantity: 1, unitPrice: 1, price: 1, subtotal: 1, total: 1 }],
    pricing: { total: 1 },
  }));
  const r = await call('/api/orders', { method: 'POST', form: fd });
  assert.equal(r.status, 201);
  assert.equal(r.data.items[0].unitPrice, sticky.price);
});

test('type is required when the product has types, and must be valid', async () => {
  const register = pick('English Register');
  let r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: register._id, quantity: 1 }] }) });
  assert.equal(r.status, 400);
  r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: register._id, selectedType: 'Klingon', quantity: 1 }] }) });
  assert.equal(r.status, 400);
  r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: register._id, selectedType: 'Urdu', quantity: 2 }] }) });
  assert.equal(r.status, 201);
  assert.equal(r.data.items[0].selectedType, 'Urdu');
});

test('invalid phone and unknown product are rejected', async () => {
  const sticky = pick('Sticky');
  let r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: sticky._id, quantity: 1 }], customer: { phone: '12345' } }) });
  assert.equal(r.status, 400);
  assert.ok(r.data.errors['customer.phone']);
  r = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: '64b000000000000000000000', quantity: 1 }] }) });
  assert.equal(r.status, 400);
});

test('online payment: requires screenshot, rejects non-images, accepts PNG', async () => {
  const sticky = pick('Sticky');
  const items = [{ productId: sticky._id, quantity: 1 }];
  await call('/api/admin/settings', { method: 'PUT', auth: true, json: { payment: { jazzCashTitle: 'Test Title', jazzCashNumber: '03000000000' } } });
  let r = await call('/api/orders', { method: 'POST', form: orderForm({ items, method: 'online' }) });
  assert.equal(r.status, 400);
  assert.ok(r.data.errors?.screenshot);
  r = await call('/api/orders', { method: 'POST', form: orderForm({ items, method: 'online', file: Buffer.from('#!/bin/sh\necho hi\n'.repeat(5)) }) });
  assert.equal(r.status, 400); // declared image/png but not an image
  r = await call('/api/orders', { method: 'POST', form: orderForm({ items, method: 'online', file: PNG }) });
  assert.equal(r.status, 201);
  assert.equal(r.data.payment.method, 'online');
  // customer response never exposes the screenshot
  assert.equal(JSON.stringify(r.data).includes('screenshot'), false);
  // admin can see it
  const detail = await call(`/api/admin/orders/${r.data.orderId}`, { auth: true });
  assert.equal(detail.status, 200);
  assert.ok(detail.data.payment.screenshotUrl);
  assert.equal(detail.data.payment.status, 'submitted');
  assert.equal(detail.data.payment.screenshotPublicId, undefined);
});

test('duplicate submissions with the same key create one order', async () => {
  const sticky = pick('Sticky');
  const key = `test-key-${Date.now()}`;
  const items = [{ productId: sticky._id, quantity: 1 }];
  const [a, b] = await Promise.all([
    call('/api/orders', { method: 'POST', form: orderForm({ items, key }) }),
    call('/api/orders', { method: 'POST', form: orderForm({ items, key }) }),
  ]);
  assert.ok([200, 201].includes(a.status) && [200, 201].includes(b.status));
  assert.equal(a.data.orderId, b.data.orderId);
});

test('changing a product price does not alter old orders', async () => {
  const sticky = pick('Sticky');
  const created = await call('/api/orders', { method: 'POST', form: orderForm({ items: [{ productId: sticky._id, quantity: 1 }] }) });
  const full = (await call(`/api/admin/products/${sticky._id}`, { auth: true })).data;
  const body = { name: full.name, categoryId: full.category._id, price: full.price + 100, description: full.description, images: full.images, types: full.types, featured: full.featured };
  const up = await call(`/api/admin/products/${sticky._id}`, { method: 'PUT', auth: true, json: body });
  assert.equal(up.status, 200);
  const order = (await call(`/api/admin/orders/${created.data.orderId}`, { auth: true })).data;
  assert.equal(order.items[0].unitPrice, sticky.price);
  await call(`/api/admin/products/${sticky._id}`, { method: 'PUT', auth: true, json: { ...body, price: full.price } });
});

test('product validation: max 4 images, max 5 types, min 1 image', async () => {
  const cat = (await call('/api/categories')).data.categories[0];
  const img = { url: '/placeholders/register.svg', publicId: null };
  const base = { name: 'Test Product X', categoryId: cat._id, price: 100, description: 'd', images: [img], types: [] };
  assert.equal((await call('/api/admin/products', { method: 'POST', auth: true, json: { ...base, images: [img, img, img, img, img] } })).status, 400);
  assert.equal((await call('/api/admin/products', { method: 'POST', auth: true, json: { ...base, images: [] } })).status, 400);
  assert.equal((await call('/api/admin/products', { method: 'POST', auth: true, json: { ...base, types: ['a', 'b', 'c', 'd', 'e', 'f'] } })).status, 400);
  assert.equal((await call('/api/admin/products', { method: 'POST', auth: true, json: { ...base, images: [{ url: 'https://evil.example/x.png' }] } })).status, 400);
  const ok = await call('/api/admin/products', { method: 'POST', auth: true, json: { ...base, types: ['a', 'b', 'c', 'd', 'e'] } });
  assert.equal(ok.status, 201);
  // slug uniqueness
  const dup = await call('/api/admin/products', { method: 'POST', auth: true, json: base });
  assert.equal(dup.status, 201);
  assert.notEqual(dup.data.slug, ok.data.slug);
  // rename updates slug
  const renamed = await call(`/api/admin/products/${ok.data._id}`, { method: 'PUT', auth: true, json: { ...base, name: 'Renamed Test Product', types: [] } });
  assert.equal(renamed.data.slug, 'renamed-test-product');
  for (const id of [ok.data._id, dup.data._id]) assert.equal((await call(`/api/admin/products/${id}`, { method: 'DELETE', auth: true })).status, 200);
});

test('category limit (15) and safe delete', async () => {
  const img = { url: '/placeholders/books.svg', publicId: null };
  const before = (await call('/api/categories')).data.categories;
  const created = [];
  for (let i = before.length; i < 15; i += 1) {
    const r = await call('/api/admin/categories', { method: 'POST', auth: true, json: { name: `Temp Cat ${i}`, image: img } });
    assert.equal(r.status, 201);
    created.push(r.data._id);
  }
  const over = await call('/api/admin/categories', { method: 'POST', auth: true, json: { name: 'One Too Many', image: img } });
  assert.equal(over.status, 400);
  // deleting a category that has products is blocked
  const withProducts = before.find((c) => c.productCount > 0);
  const blocked = await call(`/api/admin/categories/${withProducts._id}`, { method: 'DELETE', auth: true });
  assert.equal(blocked.status, 409);
  assert.ok(blocked.data.productCount > 0);
  for (const id of created) assert.equal((await call(`/api/admin/categories/${id}`, { method: 'DELETE', auth: true })).status, 200);
});

test('settings: announcement, delivery and payment update', async () => {
  const r = await call('/api/admin/settings', { method: 'PUT', auth: true, json: { announcement: 'BACK TO SCHOOL COLLECTION NOW AVAILABLE', deliveryCharge: 250, freeDeliveryThreshold: 4000 } });
  assert.equal(r.status, 200);
  const pub = (await call('/api/settings/public')).data;
  assert.equal(pub.announcement, 'BACK TO SCHOOL COLLECTION NOW AVAILABLE');
  assert.equal(pub.deliveryCharge, 250);
  assert.equal(pub.payment, undefined);
  await call('/api/admin/settings', { method: 'PUT', auth: true, json: { announcement: settingsBackup.announcement, deliveryCharge: settingsBackup.deliveryCharge, freeDeliveryThreshold: settingsBackup.freeDeliveryThreshold, payment: settingsBackup.payment } });
});

test('search, sort, category filter and mongo-operator injection', async () => {
  const s = await call('/api/products?q=notebook');
  assert.ok(s.data.products.length >= 1);
  const sorted = (await call('/api/products?sort=price-asc')).data.products.map((p) => p.price);
  assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b));
  const cat = (await call('/api/products?category=stationery')).data;
  assert.ok(cat.products.every((p) => p.category.slug === 'stationery'));
  const inj = await call('/api/products?q[$ne]=x&category[$gt]=');
  assert.equal(inj.status, 200);
  const login = await call('/api/admin/login', { method: 'POST', json: { email: { $gt: '' }, password: { $gt: '' } } });
  assert.equal(login.status, 400);
});

test('admin orders list and status update', async () => {
  const list = await call('/api/admin/orders', { auth: true });
  assert.equal(list.status, 200);
  assert.ok(list.data.orders.length > 0);
  const up = await call(`/api/admin/orders/${list.data.orders[0]._id}`, { method: 'PATCH', auth: true, json: { status: 'confirmed', paymentStatus: 'paid' } });
  assert.equal(up.data.status, 'confirmed');
  assert.equal(up.data.payment.status, 'paid');
});
