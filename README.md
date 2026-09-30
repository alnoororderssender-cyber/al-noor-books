# Al Noor Books — MERN e-commerce

A guest-checkout online store for a local Pakistani stationery / book shop.
React + Vite + Tailwind on the front, Express + MongoDB (Mongoose) on the back, Cloudinary for images, a single fixed admin (JWT in an httpOnly cookie) and a server-side email notification (Nodemailer/SMTP) to the owner for every order.

- Customers: Home → Shop → Product → choose type → Cart → Checkout (COD or Online Payment + screenshot) → Order ID. No accounts.
- Owner: Admin login → categories, products, announcement bar, delivery rules, payment details, store info, orders.

---

## 1. Project structure

```
al-noor-books/
├── client/                      React + Vite + Tailwind storefront and admin UI
│   ├── public/placeholders/     Demo/placeholder artwork (hero, store, products) — replace with real photos
│   ├── scripts/                 generate-placeholders.mjs (re-creates the placeholder SVGs)
│   └── src/
│       ├── components/          Header, Footer, ProductCard, ImageGallery, TrustStrip, ...
│       │   ├── ui/              Primitives: Logo, States, Pagination, Breadcrumbs ...
│       │   └── admin/           AdminUI (modal, badges), ImageUploader
│       ├── context/             CartContext (localStorage), SettingsContext, AdminAuthContext, ToastContext
│       ├── hooks/               useAsync, useDebounced, usePageTitle, useAdmin
│       ├── layouts/             StoreLayout, AdminLayout
│       ├── pages/               Home, Products, ProductDetail, Cart, Checkout, OrderConfirmation, About, Contact
│       │   └── admin/           Dashboard, products, categories, orders, settings pages
│       ├── services/api.js      Every API call lives here
│       └── utils/               format, delivery (display only), validation, siteConfig
└── server/
    ├── src/
    │   ├── config/              env (validated at boot), db
    │   ├── models/              Category, Product, Order, Settings
    │   ├── controllers/         auth, category, product, order, settings, upload
    │   ├── routes/              publicRoutes, adminRoutes
    │   ├── middleware/          auth, sanitize, originCheck (CSRF), rate limiters, upload, errorHandler
    │   ├── services/
    │   │   ├── orderService.js  Re-prices the cart from MongoDB, creates the order
    │   │   ├── pricingService.js
    │   │   ├── storage/         cloudinaryStorage (prod) + localStorage (dev-only fallback)
    │   │   └── email/           Nodemailer SMTP sender + HTML/text order email
    │   └── utils/               seed.js, hashPassword.js, schemas (zod), phone, slug ...
    └── test/api.test.js         Integration tests (need a running API + seeded DB)
```

## 2. Requirements

- Node.js 18.17+ (developed on Node 22)
- A MongoDB database (local or Atlas)
- A Cloudinary account (free tier is enough) — **required in production**, optional in development
- An SMTP account (Gmail App Password, your host's mailbox, Brevo, etc.) for owner order emails

## 3. Installation

```bash
git clone <your repo> al-noor-books && cd al-noor-books
npm run install:all                 # installs server + client dependencies
cp server/.env.example server/.env  # then edit it (see below)
```

### MongoDB

- **Atlas (recommended for production):** create a free cluster → Database Access: add a user → Network Access: allow your server's IP → "Connect" → copy the connection string into `MONGODB_URI` (add the database name, e.g. `.../al-noor-books`).
- **Local:** install MongoDB Community and use `mongodb://127.0.0.1:27017/al-noor-books`.

### Cloudinary

1. Create an account at cloudinary.com → Dashboard → copy *Cloud name*, *API Key*, *API Secret* into `server/.env`.
2. Nothing else to configure. The app uploads
   - **catalogue images** (`alnoor/products`, `alnoor/categories`) as normal public assets, and
   - **payment screenshots** (`alnoor/payments`) as **`authenticated`** assets. They have no public URL; only the admin order page receives a signed download URL that expires after 10 minutes.
3. Without Cloudinary variables, development falls back to writing files into `server/.dev-uploads/` (public images are served, screenshots are served only to a logged-in admin). **The server refuses to start in production without Cloudinary.**

### Admin account (exactly one)

```bash
cd server
npm run hash-password -- "a-long-password-of-your-choice"
```

Copy the printed `ADMIN_PASSWORD_HASH='…'` line and your `ADMIN_EMAIL` into `server/.env`. **Keep the single quotes** — bcrypt hashes contain `$`. There is no registration endpoint; changing the admin means changing these two variables and restarting.

### Seed demo data (optional, development)

```bash
npm run seed         # 6 demo categories + 7 demo products + placeholder store info
npm run seed:clear   # removes everything the seed created
```

Seeded records are flagged `isDemo` and show a **Demo** badge in the admin panel. Delete or edit them from Admin → Products / Categories. The seeded store phone/WhatsApp/address are fake — replace them in Admin → Store Info.

## 4. Environment variables (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | | `production` on the server |
| `PORT` | | default `5000` |
| `MONGODB_URI` | ✅ | Mongo connection string |
| `JWT_SECRET` | ✅ | 32+ random characters in production |
| `CLIENT_URL` | ✅ | Site origin(s), comma-separated. Used for CORS and the CSRF Origin check |
| `COOKIE_SAMESITE` | | `lax` (default). Use `none` only when the API and site are on different domains (HTTPS) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | ✅ | See "Admin account" |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | prod ✅ | |
| `SMTP_HOST`, `SMTP_PORT` | | e.g. `smtp.gmail.com` / `587` |
| `SMTP_SECURE` | | `false` for 587 (STARTTLS), `true` for 465. Defaults from the port |
| `SMTP_USER`, `SMTP_PASS` | | SMTP login. Gmail needs an App Password |
| `SMTP_FROM` | | Sender, e.g. `Al Noor Books <orders@yourdomain.com>`. Defaults to `SMTP_USER` |
| `OWNER_EMAIL` | | Where new-order emails go (comma-separate for several) |

`client/.env.example` has a single optional `VITE_API_URL` for split hosting. **Secrets never reach the browser**; only `VITE_*` variables are exposed by Vite and none of them is secret.

## 5. Owner order emails

Order creation never depends on email: the order is saved, the customer gets the order ID, **then** the email is sent in the background. If sending fails, the order stays untouched, the error is logged with an `[email]` prefix and the status is recorded on the order (Admin → Order → "Owner notification": sent / failed / skipped). The customer is never told about the notification.

Each email contains the order number, customer name, phone, full delivery address, products, quantities, unit prices, subtotal, delivery charges, total and payment method (plus the customer note if there is one). All values are HTML-escaped.

Code lives in `server/src/services/email/`:

- `formatEmail.js` — subject, HTML and plain-text bodies (edit this to change the layout)
- `index.js` — Nodemailer transport, `notifyOwnerOfOrder()`, and a boot-time SMTP check that only logs

All SMTP settings are server-side env vars; none is prefixed `VITE_`, so nothing reaches the browser.

**Setting up (Gmail example)**

1. Turn on 2-Step Verification, then create an **App Password** (Google Account → Security → App passwords).
2. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER=<your gmail>`, `SMTP_PASS=<app password>`, `OWNER_EMAIL=<inbox that should get orders>`.
3. Start the server and look for `[email] SMTP connection verified.`, then place a test order.

In development with no SMTP settings, new orders are printed in the server console instead and marked "skipped".

## 6. Development

Two terminals:

```bash
npm run dev:server     # API on http://localhost:5000  (auto-restart)
npm run dev:client     # site on http://localhost:5173 (proxies /api to :5000)
```

Open http://localhost:5173 — admin is at http://localhost:5173/admin/login.

Tests (API running against a seeded DB): `npm test` — 16 integration tests covering pricing/delivery, type validation, online-payment rules, duplicate submits, price snapshots, image/type limits, the 15-category limit, safe category deletion, settings, search/sort/injection and admin auth. Env overrides: `API_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`. The order rate limiter allows 20 orders / 15 min / IP, so restart the API if you re-run the suite many times in a row.

## 7. Production build & deployment

```bash
npm run build          # builds client/dist
NODE_ENV=production npm start
```

In production Express serves `client/dist` **and** the API from one origin (recommended: cookies stay first-party, no CORS problems). Any host that runs a Node process works (Render, Railway, Fly.io, a VPS with Nginx + PM2).

Checklist:

- `NODE_ENV=production`, strong `JWT_SECRET`, real `CLIENT_URL` (the exact `https://` origin — it is also used for the CSRF Origin check).
- Put the app behind HTTPS (cookies are `Secure` in production; `trust proxy` is enabled so this works behind a reverse proxy).
- Cloudinary variables set (the server refuses to boot without them).
- MongoDB network access allows the server.
- Replace the placeholder images in `client/public/placeholders/` (hero, store, banner) with real photos, or point `siteConfig.js` at your own files. Product and category images are uploaded through the admin panel.
- Delete demo data (`npm run seed:clear`) or edit it, then fill in Admin → Store Info, Payment Settings, Delivery Settings, Announcement.
- Back up MongoDB (Atlas does this on paid tiers).

## 8. Security notes

helmet (CSP, HSTS, …) · CORS locked to `CLIENT_URL` · login rate limit (10 failed tries / 15 min) · order rate limit · bcrypt password hash from env · JWT (HS256 pinned) in an httpOnly, SameSite cookie, 8 h · every `/api/admin` route behind `requireAdmin` · Origin check on all state-changing requests · zod validation on every body · Mongo-operator/`$`-key stripping · uploads: MIME filter + **magic-byte check** + 5 MB cap + Cloudinary-side dimension cap (2000 px) · payment screenshots stored as private/authenticated assets and never returned to customers · totals computed **only** on the server from database prices · order IDs `ANB-XXXXXX` from a CSPRNG with retry on collision · idempotency key + disabled button to stop duplicate orders.

## 9. Where the build differs from the reference screenshots (deliberately)

The written requirements win where they conflict with the mock-ups:

- **No email field, no account icon, no wishlist, no ratings/reviews/specifications tabs, no brand filter** — the brief says no accounts/wishlists and the data model has no ratings or brands.
- **Payment options are Cash on Delivery and Online Payment** (brief), not three options. Online Payment shows the admin-configured JazzCash and bank details, the amount to pay, and a required screenshot upload. If no payment details are configured, Online Payment is disabled.
- The mock-ups' colour "swatches" are text **type chips** (English / Urdu …), because types are labels that share one price.
- Confirmation page copy avoids claims the shop cannot back yet (payment received, tracking updates, returns).
- Extra admin page **Store Info** (phone, WhatsApp, address, hours, social links): the footer, Contact page and the green WhatsApp banner need real values that must not be hard-coded.
- Colours use the palette in the brief (`#0B1F3A`, `#17365D`, `#071629`). The mock-ups render two slightly different blues (home/shop are darker than cart/checkout); all tokens live in `client/tailwind.config.js` if you want to shift them.
- Fonts: **Libre Baskerville** (headings) and **Inter** (UI), self-hosted through `@fontsource` (no Google Fonts request).
- Illustrations are generated placeholders, not photography.

## 10. Known limitations

- Cloudinary could not be exercised against the live service during development (no outbound access). The email flow was tested against a local SMTP server (success, wrong port, unconfigured); please place one real test order with your real SMTP credentials before launch.
- Search is a simple case-insensitive substring match on name/description (fine for ~20 products).
- Admin image uploads that are abandoned before saving leave an orphan file in Cloudinary.
- Order statuses are intentionally minimal (pending / confirmed / completed / cancelled) and there is no customer-facing order tracking.
