import mongoose, { Document, Schema } from 'mongoose';

export interface IStudioProduct extends Document {
  name: string;
  type: 't-shirt' | 'hoodie' | 'blouse' | string;
  description?: string;
  baseMockupUrl: string;
  safeArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  colors: string[];
  sizes: string[];
  price: number;
  active: boolean;
  aiEnhanceEnabled: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const studioProductSchema = new Schema<IStudioProduct>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, default: 't-shirt' },
    description: { type: String },
    baseMockupUrl: { type: String, required: true },
    safeArea: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    colors: { type: [String], default: ['white'] },
    sizes: { type: [String], default: ['M'] },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    aiEnhanceEnabled: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

studioProductSchema.index({ active: 1, type: 1 });

export default mongoose.model<IStudioProduct>('StudioProduct', studioProductSchema);
