import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerProductData {
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
  productUrl?: string;
  commissionRate?: number;
}

export interface IPartnerProduct extends Document {
  partnerStore: mongoose.Types.ObjectId;
  productData: IPartnerProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const partnerProductSchema = new Schema<IPartnerProduct>(
  {
    partnerStore: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerStore',
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
      productUrl: { type: String, trim: true },
      commissionRate: { type: Number, min: 0, max: 100 },
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
  },
  {
    timestamps: true,
  }
);

partnerProductSchema.index({ partnerStore: 1, status: 1 });

export default mongoose.model<IPartnerProduct>('PartnerProduct', partnerProductSchema);
