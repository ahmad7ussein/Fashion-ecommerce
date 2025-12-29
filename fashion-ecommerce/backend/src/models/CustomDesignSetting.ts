import mongoose, { Document, Schema } from 'mongoose';

export interface IPrintArea {
  name: string;
  width: number;
  height: number;
  unit: string;
}

export interface ICustomDesignSetting extends Document {
  enabled: boolean;
  allowedFonts: string[];
  printAreas: IPrintArea[];
  allowText: boolean;
  allowImages: boolean;
  maxTextLength: number;
  additionalPrices: {
    text: number;
    image: number;
    size: number;
  };
  requireApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const printAreaSchema = new Schema<IPrintArea>(
  {
    name: { type: String, required: true, trim: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'cm' },
  },
  { _id: false }
);

const customDesignSettingSchema = new Schema<ICustomDesignSetting>(
  {
    enabled: { type: Boolean, default: false },
    allowedFonts: { type: [String], default: ['Arial', 'Times New Roman', 'Courier New'] },
    printAreas: { type: [printAreaSchema], default: [] },
    allowText: { type: Boolean, default: true },
    allowImages: { type: Boolean, default: true },
    maxTextLength: { type: Number, default: 200, min: 0 },
    additionalPrices: {
      text: { type: Number, default: 0, min: 0 },
      image: { type: Number, default: 0, min: 0 },
      size: { type: Number, default: 0, min: 0 },
    },
    requireApproval: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICustomDesignSetting>('CustomDesignSetting', customDesignSettingSchema);
