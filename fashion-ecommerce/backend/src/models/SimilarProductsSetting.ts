import mongoose, { Document, Schema } from 'mongoose';

export interface ISimilarProductsSetting extends Document {
  enabled: boolean;
  maxItems: number;
  prioritizeInStore: boolean;
  prioritizePartner: boolean;
  autoWhenNoPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const similarProductsSettingSchema = new Schema<ISimilarProductsSetting>(
  {
    enabled: { type: Boolean, default: false },
    maxItems: { type: Number, default: 4, min: 1, max: 20 },
    prioritizeInStore: { type: Boolean, default: true },
    prioritizePartner: { type: Boolean, default: true },
    autoWhenNoPurchase: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISimilarProductsSetting>('SimilarProductsSetting', similarProductsSettingSchema);
