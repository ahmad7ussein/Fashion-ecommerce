import mongoose, { Document, Schema } from 'mongoose';

export interface IDesignElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
}

export interface IDesign extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  baseProduct: {
    type: string;
    color: string;
    size: string;
  };
  elements: IDesignElement[];
  thumbnail?: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const designSchema = new Schema<IDesign>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
    },
    baseProduct: {
      type: {
        type: String,
        required: true,
        default: 't-shirt',
      },
      color: {
        type: String,
        required: true,
        default: 'white',
      },
      size: {
        type: String,
        required: true,
        default: 'M',
      },
    },
    elements: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'image'],
          required: true,
        },
        content: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        rotation: { type: Number, default: 0 },
        fontSize: Number,
        fontFamily: String,
        color: String,
        fontWeight: String,
      },
    ],
    thumbnail: String,
    price: {
      type: Number,
      default: 39.99,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDesign>('Design', designSchema);

