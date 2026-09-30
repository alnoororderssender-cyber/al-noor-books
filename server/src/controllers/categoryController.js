import { Category, MAX_CATEGORIES } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { categorySchema, objectId } from '../utils/schemas.js';
import { uniqueSlug } from '../utils/slug.js';
import { assertTrustedImages, cleanImage, destroyImages } from '../utils/images.js';

export async function list(_req, res) {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ createdAt: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    max: MAX_CATEGORIES,
    categories: categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 })),
  });
}

export async function create(req, res) {
  const data = categorySchema.parse(req.body);
  assertTrustedImages([data.image], 'image');
  if ((await Category.countDocuments()) >= MAX_CATEGORIES) {
    throw new ApiError(400, `You can have at most ${MAX_CATEGORIES} categories. Delete one before adding another.`);
  }
  const category = await Category.create({
    name: data.name,
    slug: await uniqueSlug(Category, data.name),
    image: cleanImage(data.image),
  });
  res.status(201).json(category);
}

export async function update(req, res) {
  const id = objectId.parse(req.params.id);
  const data = categorySchema.parse(req.body);
  assertTrustedImages([data.image], 'image');
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const oldImage = category.image;
  if (category.name !== data.name) category.slug = await uniqueSlug(Category, data.name, category._id);
  category.name = data.name;
  category.image = cleanImage(data.image);
  await category.save();

  if (oldImage?.url !== category.image.url) await destroyImages([oldImage]);
  res.json(category);
}

export async function remove(req, res) {
  const id = objectId.parse(req.params.id);
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    const reassignTo = req.query.reassignTo ? objectId.parse(req.query.reassignTo) : null;
    if (!reassignTo) {
      return res.status(409).json({
        message: `You cannot delete this category because ${productCount} product${productCount === 1 ? ' is' : 's are'} assigned to it.`,
        productCount,
      });
    }
    if (reassignTo === id || !(await Category.exists({ _id: reassignTo }))) {
      throw new ApiError(400, 'Choose a different category to move the products to.');
    }
    await Product.updateMany({ category: id }, { $set: { category: reassignTo } });
  }

  await category.deleteOne();
  await destroyImages([category.image]);
  return res.json({ ok: true, moved: productCount });
}
