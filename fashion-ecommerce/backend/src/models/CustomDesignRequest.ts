import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomDesignRequest extends Document {
  user?: mongoose.Types.ObjectId;
  requesterName?: string;
  requesterEmail?: string;
  designName: string;
  textContent?: string;
  imageUrl?: string;
  printArea?: string;
  size?: string;
  additionalPrice?: number;
  totalPrice?: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customDesignRequestSchema = new Schema<ICustomDesignRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    requesterName: { type: String, trim: true },
    requesterEmail: { type: String, trim: true, lowercase: true },
    designName: { type: String, required: true, trim: true },
    textContent: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    printArea: { type: String, trim: true },
    size: { type: String, trim: true },
    additionalPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNotes: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

customDesignRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICustomDesignRequest>('CustomDesignRequest', customDesignRequestSchema);
