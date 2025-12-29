import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionRate: number;
  deliveryTime?: string;
  returnPolicy?: string;
  status: 'active' | 'disabled';
  ratingAverage: number;
  ratingCount: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
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
    commissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative'],
      max: [100, 'Commission cannot exceed 100'],
    },
    deliveryTime: {
      type: String,
      trim: true,
    },
    returnPolicy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index({ name: 1 });

export default mongoose.model<ISupplier>('Supplier', supplierSchema);
