import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerEvent extends Document {
  partnerStore: mongoose.Types.ObjectId;
  partnerProduct?: mongoose.Types.ObjectId;
  type: 'click' | 'sale';
  amount: number;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const partnerEventSchema = new Schema<IPartnerEvent>(
  {
    partnerStore: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerStore',
      required: true,
    },
    partnerProduct: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerProduct',
    },
    type: {
      type: String,
      enum: ['click', 'sale'],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

partnerEventSchema.index({ partnerStore: 1, type: 1, createdAt: -1 });

export default mongoose.model<IPartnerEvent>('PartnerEvent', partnerEventSchema);
