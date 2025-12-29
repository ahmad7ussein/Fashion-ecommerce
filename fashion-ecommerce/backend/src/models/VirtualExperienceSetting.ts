import mongoose, { Document, Schema } from 'mongoose';

export interface IVirtualExperienceSetting extends Document {
  enabled: boolean;
  supportedProductIds: mongoose.Types.ObjectId[];
  supportedCategories: string[];
  usageCount: number;
  conversionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const virtualExperienceSettingSchema = new Schema<IVirtualExperienceSetting>(
  {
    enabled: { type: Boolean, default: false },
    supportedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    supportedCategories: [{ type: String }],
    usageCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVirtualExperienceSetting>('VirtualExperienceSetting', virtualExperienceSettingSchema);
