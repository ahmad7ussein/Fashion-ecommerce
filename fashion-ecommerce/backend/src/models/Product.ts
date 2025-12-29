import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string; // English name (default)
  nameAr?: string; // Arabic name (optional)
  description?: string;
  descriptionAr?: string; // Arabic description (optional)
  price: number;
  image: string;
  images?: string[];
  category: string;
  categoryAr?: string; // Arabic category (optional)
  gender: string;
  genderAr?: string; // Arabic gender (optional)
  season: string;
  seasonAr?: string; // Arabic season (optional)
  style: string;
  styleAr?: string; // Arabic style (optional)
  occasion: string;
  occasionAr?: string; // Arabic occasion (optional)
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  active: boolean;
  onSale?: boolean;
  salePercentage?: number;
  newArrival?: boolean;
  inCollection?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    descriptionAr: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    images: [String],
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Pants', 'Shorts', 'Jackets', 'Tank Tops', 'Polo Shirts', 'Dresses', 'Blouses', 'Skirts', 'Jeans', 'Tops'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Men', 'Women', 'Unisex', 'Kids'],
    },
    season: {
      type: String,
      required: [true, 'Season is required'],
      enum: ['Summer', 'Winter', 'Spring', 'Fall', 'All Season'],
    },
    style: {
      type: String,
      required: [true, 'Style is required'],
      enum: ['Plain', 'Graphic', 'Embroidered', 'Printed', 'Vintage'],
    },
    occasion: {
      type: String,
      required: [true, 'Occasion is required'],
      enum: ['Casual', 'Formal', 'Sport', 'Classic', 'Streetwear'],
    },
    sizes: {
      type: [String],
      default: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    colors: {
      type: [String],
      default: ['White', 'Black', 'Gray', 'Navy', 'Red'],
    },
    stock: {
      type: Number,
      default: 100,
      min: [0, 'Stock cannot be negative'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    salePercentage: {
      type: Number,
      min: [0, 'Sale percentage cannot be negative'],
      max: [100, 'Sale percentage cannot exceed 100'],
      default: 0,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    inCollection: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * MongoDB Indexes for Product Queries
 * 
 * Simplified index strategy - only 3 indexes to cover all query patterns:
 * 1. Default: { active: 1, createdAt: -1 } - All products, sorted by newest
 * 2. Gender filter: { active: 1, gender: 1, createdAt: -1 } - Gender filtered, sorted by newest
 * 3. Featured: { active: 1, featured: 1, createdAt: -1 } - Featured products, sorted by newest
 * 
 * All queries:
 * - Filter by active: true
 * - Sort by createdAt: -1 (newest first)
 * - Use .limit() and .lean()
 */

// Index 1: Default listing (all active products, newest first)
productSchema.index({ active: 1, createdAt: -1 });
// Usage: GET /api/products (no filters)

// Index 2: Gender filter (active + gender, newest first)
productSchema.index({ active: 1, gender: 1, createdAt: -1 });
// Usage: GET /api/products?gender=Men

// Index 3: Featured products (active + featured, newest first)
productSchema.index({ active: 1, featured: 1, createdAt: -1 });
// Usage: GET /api/products?featured=true

export default mongoose.model<IProduct>('Product', productSchema);

