import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product?: mongoose.Types.ObjectId;
  design?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
  isCustom: boolean;
}

export interface ICart extends Document {
  user?: mongoose.Types.ObjectId; // Optional for authenticated users
  guestSessionId?: string; // For guest users
  items: ICartItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Not required for guests
    },
    guestSessionId: {
      type: String,
      required: false,
      // Index is defined below using schema.index() to avoid duplicates
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        design: {
          type: Schema.Types.ObjectId,
          ref: 'Design',
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String, required: true },
        color: { type: String, required: true },
        image: { type: String, required: true },
        isCustom: { type: Boolean, default: false },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: user OR guestSessionId must be unique
cartSchema.index({ user: 1 }, { unique: true, sparse: true, partialFilterExpression: { user: { $exists: true } } });
cartSchema.index({ guestSessionId: 1 }, { unique: true, sparse: true, partialFilterExpression: { guestSessionId: { $exists: true } } });

// Calculate subtotal before saving
cartSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

export default mongoose.model<ICart>('Cart', cartSchema);

