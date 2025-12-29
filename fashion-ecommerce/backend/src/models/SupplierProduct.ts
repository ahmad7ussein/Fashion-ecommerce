import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplierProductData {
  name: string;
  description?: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  gender: string;
  season: string;
  style: string;
  occasion: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  featured?: boolean;
  onSale?: boolean;
  salePercentage?: number;
  newArrival?: boolean;
  inCollection?: boolean;
}

export interface ISupplierProduct extends Document {
  supplier: mongoose.Types.ObjectId;
  productData: ISupplierProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  publishedProductId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierProductSchema = new Schema<ISupplierProduct>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    productData: {
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      price: { type: Number, required: true, min: 0 },
      image: { type: String, required: true },
      images: [String],
      category: { type: String, required: true },
      gender: { type: String, required: true },
      season: { type: String, required: true },
      style: { type: String, required: true },
      occasion: { type: String, required: true },
      sizes: [String],
      colors: [String],
      stock: { type: Number, default: 0, min: 0 },
      featured: { type: Boolean, default: false },
      onSale: { type: Boolean, default: false },
      salePercentage: { type: Number, default: 0, min: 0, max: 100 },
      newArrival: { type: Boolean, default: false },
      inCollection: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    publishedProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

supplierProductSchema.index({ supplier: 1, status: 1 });

export default mongoose.model<ISupplierProduct>('SupplierProduct', supplierProductSchema);
