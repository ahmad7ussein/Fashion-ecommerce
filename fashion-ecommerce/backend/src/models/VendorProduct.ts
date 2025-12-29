import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorProductData {
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
}

export interface IVendorProduct extends Document {
  vendorUser: mongoose.Types.ObjectId;
  productData: IVendorProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  publishedProductId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorProductSchema = new Schema<IVendorProduct>(
  {
    vendorUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNotes: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    publishedProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
  },
  {
    timestamps: true,
  }
);

vendorProductSchema.index({ vendorUser: 1, status: 1 });

export default mongoose.model<IVendorProduct>('VendorProduct', vendorProductSchema);
