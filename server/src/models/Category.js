import mongoose from 'mongoose';

export const MAX_CATEGORIES = 15;

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, default: null } },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: imageSchema, required: true },
    isDemo: { type: Boolean, default: false }, // seeded development data
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
