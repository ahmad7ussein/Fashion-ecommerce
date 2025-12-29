import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerStore extends Document {
  name: string;
  slug: string;
  website?: string;
  defaultCommissionRate: number;
  status: 'active' | 'disabled';
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerStoreSchema = new Schema<IPartnerStore>(
  {
    name: {
      type: String,
      required: [true, 'Partner store name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Partner store slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    website: {
      type: String,
      trim: true,
    },
    defaultCommissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative'],
      max: [100, 'Commission cannot exceed 100'],
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

partnerStoreSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model<IPartnerStore>('PartnerStore', partnerStoreSchema);
