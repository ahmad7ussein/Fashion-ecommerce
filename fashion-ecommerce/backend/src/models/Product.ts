import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string; 
  nameAr?: string; 
  description?: string;
  descriptionAr?: string; 
  price: number;
  image: string;
  images?: string[];
  category: string;
  categoryAr?: string; 
  gender: string;
  genderAr?: string; 
  season: string;
  seasonAr?: string; 
  style: string;
  styleAr?: string; 
  occasion: string;
  occasionAr?: string; 
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
















productSchema.index({ active: 1, createdAt: -1 });



productSchema.index({ active: 1, gender: 1, createdAt: -1 });



productSchema.index({ active: 1, featured: 1, createdAt: -1 });


export default mongoose.model<IProduct>('Product', productSchema);

