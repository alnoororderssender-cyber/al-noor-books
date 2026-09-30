import mongoose from 'mongoose';

export const MAX_IMAGES = 4;
export const MAX_TYPES = 5;

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, default: null } },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: {
      type: [imageSchema],
      validate: [(v) => v.length >= 1 && v.length <= MAX_IMAGES, `A product needs 1 to ${MAX_IMAGES} images.`],
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    // Optional option labels (e.g. English, Urdu). All types share the product price.
    types: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      validate: [(v) => v.length <= MAX_TYPES, `A product can have at most ${MAX_TYPES} types.`],
      default: [],
    },
    featured: { type: Boolean, default: false, index: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
