// DEVELOPMENT / DEMO DATA ONLY.
//   npm run seed         -> adds demo categories, products and placeholder store details
//   npm run seed:clear   -> removes everything the seed created (flagged isDemo)
// Demo records are marked "Demo" in the admin panel so they are easy to replace or delete.
import mongoose from 'mongoose';
import { assertEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { slugify } from './slug.js';

const P = (name) => `/placeholders/${name}.svg`;
const img = (name) => ({ url: P(name), publicId: null });

const categories = [
  { name: 'Books', image: 'books' },
  { name: 'Stationery', image: 'notebook-blue' },
  { name: 'School Supplies', image: 'backpack' },
  { name: 'Art & Craft', image: 'art-craft' },
  { name: 'Office Supplies', image: 'binder' },
  { name: 'Writing Essentials', image: 'writing' },
];

const products = [
  { name: 'English Register', category: 'Stationery', price: 300, featured: true, images: ['register', 'notebook-open'], types: ['English', 'Urdu', 'Math', 'Narrow Line', 'All-in-One'], description: 'A sturdy hard-bound register with ruled pages, made for school and office record keeping. Choose the ruling that suits you - the price is the same for every type.' },
  { name: 'Spiral Notebook (A5)', category: 'Stationery', price: 320, featured: true, images: ['notebook-green', 'notebook-blue', 'notebook-charcoal', 'notebook-open'], types: ['Green', 'Blue', 'Pink', 'Charcoal'], description: 'A high-quality spiral notebook with smooth, durable pages. Perfect for school, college and everyday use. Lies flat for comfortable writing.' },
  { name: 'Pilot G-2 Gel Pens (Set of 5)', category: 'Writing Essentials', price: 1250, featured: true, images: ['pens-blue'], types: ['Blue', 'Black', 'Assorted'], description: 'Smooth-writing gel pens in a set of five. Quick-drying ink and a comfortable grip for long writing sessions.' },
  { name: 'Drawing Book (A4)', category: 'Art & Craft', price: 380, featured: true, images: ['drawing-book'], types: [], description: 'A4 drawing book with thick cartridge pages that take pencil, colour pencil and light wash well.' },
  { name: 'Ball Pen Set (Pack of 10)', category: 'Writing Essentials', price: 650, featured: true, images: ['pens-ball'], types: [], description: 'A pack of ten reliable blue ball pens for everyday writing at school, home or the office.' },
  { name: 'Sticky Notes (Pack of 5)', category: 'Office Supplies', price: 280, featured: true, images: ['sticky-notes'], types: [], description: 'Five pads of brightly coloured sticky notes that stay put and peel off cleanly.' },
  { name: 'Pencil Case', category: 'School Supplies', price: 450, featured: false, images: ['pencil-case'], types: ['Navy Blue', 'Black'], description: 'A roomy zip pencil case that holds pens, pencils and a geometry set.' },
];

async function clear() {
  const p = await Product.deleteMany({ isDemo: true });
  const c = await Category.deleteMany({ isDemo: true });
  console.log(`Removed ${p.deletedCount} demo products and ${c.deletedCount} demo categories.`);
}

async function seed() {
  const existing = await Category.countDocuments();
  if (existing > 0) {
    console.log('Categories already exist - skipping seed. Run "npm run seed:clear" first to remove old demo data.');
    return;
  }
  const catDocs = {};
  for (const c of categories) {
    // eslint-disable-next-line no-await-in-loop
    catDocs[c.name] = await Category.create({ name: c.name, slug: slugify(c.name), image: img(c.image), isDemo: true });
  }
  for (const p of products) {
    // eslint-disable-next-line no-await-in-loop
    await Product.create({
      name: p.name,
      slug: slugify(p.name),
      category: catDocs[p.category]._id,
      price: p.price,
      description: p.description,
      images: p.images.map(img),
      types: p.types,
      featured: p.featured,
      isDemo: true,
    });
  }

  // Placeholder store details (fake numbers) so the layout is visible in development.
  await Settings.findOneAndUpdate(
    { key: 'main' },
    {
      $setOnInsert: {
        key: 'main',
        store: {
          phone: '0300 0000000',
          whatsapp: '923000000000',
          email: 'hello@example.com',
          address: 'DEMO ADDRESS - replace in Admin > Store Info',
          hours: 'Mon-Sat, 10:00 AM - 8:00 PM',
        },
      },
    },
    { upsert: true },
  );
  console.log(`Seeded ${categories.length} categories and ${products.length} products (demo data).`);
}

assertEnv();
await connectDB();
if (process.argv.includes('--clear')) await clear();
else await seed();
await mongoose.connection.close();
