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
      enum: ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Pants', 'Shorts', 'Jackets', 'Tank Tops', 'Polo Shirts'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Men', 'Women', 'Unisex'],
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
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, gender: 1, season: 1 });

export default mongoose.model<IProduct>('Product', productSchema);

