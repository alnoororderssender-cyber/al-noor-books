import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { objectId, productSchema } from '../utils/schemas.js';
import { uniqueSlug } from '../utils/slug.js';
import { assertTrustedImages, cleanImage, destroyImages } from '../utils/images.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asString = (v) => (typeof v === 'string' ? v.trim() : '');

const SORTS = {
  default: { featured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: 1 },
  'name-asc': { name: 1 },
};

/** "0-500,500-1000,2500-" -> [{ price: {$gte:0,$lt:500} }, ...] (max is exclusive) */
function priceClauses(param) {
  return asString(param)
    .split(',')
    .map((range) => {
      const [minRaw, maxRaw] = range.split('-');
      const min = Number(minRaw);
      const max = maxRaw === '' || maxRaw === undefined ? null : Number(maxRaw);
      if (!Number.isFinite(min) || (max !== null && !Number.isFinite(max))) return null;
      return { price: max === null ? { $gte: min } : { $gte: min, $lt: max } };
    })
    .filter(Boolean);
}

export async function list(req, res) {
  const filter = {};
  const q = asString(req.query.q).slice(0, 80);
  const categorySlugs = asString(req.query.category).split(',').filter(Boolean).slice(0, 15);

  if (categorySlugs.length) {
    const cats = await Category.find({ slug: { $in: categorySlugs } }).select('_id').lean();
    filter.category = { $in: cats.map((c) => c._id) };
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const price = priceClauses(req.query.price);
  if (price.length) filter.$and = [{ $or: price }];
  if (req.query.featured === 'true') filter.featured = true;
  const ids = asString(req.query.ids).split(',').filter((v) => /^[a-f\d]{24}$/i.test(v)).slice(0, 40);
  if (asString(req.query.ids)) filter._id = { $in: ids };
  if (asString(req.query.exclude)) filter.slug = { $ne: asString(req.query.exclude) };

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 16));
  const sort = SORTS[asString(req.query.sort)] || SORTS.default;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate('category', 'name slug').lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
}

export async function getBySlug(req, res) {
  const product = await Product.findOne({ slug: asString(req.params.slug) }).populate('category', 'name slug').lean();
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json(product);
}

export async function getById(req, res) {
  const product = await Product.findById(objectId.parse(req.params.id)).populate('category', 'name slug').lean();
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json(product);
}

export async function create(req, res) {
  const data = productSchema.parse(req.body);
  assertTrustedImages(data.images);
  if (!(await Category.exists({ _id: data.categoryId }))) {
    throw new ApiError(400, 'Choose a valid category.', { categoryId: 'Choose a valid category.' });
  }
  const product = await Product.create({
    name: data.name,
    slug: await uniqueSlug(Product, data.name),
    category: data.categoryId,
    price: data.price,
    description: data.description,
    images: data.images.map(cleanImage),
    types: data.types,
    featured: data.featured,
  });
  res.status(201).json(product);
}

export async function update(req, res) {
  const id = objectId.parse(req.params.id);
  const data = productSchema.parse(req.body);
  assertTrustedImages(data.images);
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (!(await Category.exists({ _id: data.categoryId }))) {
    throw new ApiError(400, 'Choose a valid category.', { categoryId: 'Choose a valid category.' });
  }

  const oldImages = product.images.map((i) => ({ url: i.url, publicId: i.publicId }));
  // Slug follows the name; uniqueness is re-checked so it can never collide.
  if (product.name !== data.name) product.slug = await uniqueSlug(Product, data.name, product._id);
  product.name = data.name;
  product.category = data.categoryId;
  product.price = data.price;
  product.description = data.description;
  product.images = data.images.map(cleanImage);
  product.types = data.types;
  product.featured = data.featured;
  await product.save();

  const keep = new Set(product.images.map((i) => i.url));
  await destroyImages(oldImages.filter((i) => !keep.has(i.url)));
  res.json(product);
}

export async function remove(req, res) {
  const product = await Product.findById(objectId.parse(req.params.id));
  if (!product) throw new ApiError(404, 'Product not found.');
  await product.deleteOne();
  await destroyImages(product.images);
  res.json({ ok: true });
}
