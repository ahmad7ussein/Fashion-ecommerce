import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  design?: mongoose.Types.ObjectId;
  baseProductId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
  isCustom: boolean;
  designMetadata?: Record<string, any>;
  designImageURL?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber?: string; 
  items: IOrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentInfo: {
    method: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
  };
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  trackingHistory?: Array<{
    status: string;
    location?: string;
    note?: string;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
  }>;
  carrier?: string; 
  estimatedDelivery?: Date; 
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: false, 
      unique: true,
      sparse: true, 
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
        baseProductId: {
          type: Schema.Types.ObjectId,
          ref: 'StudioProduct',
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String, required: true },
        color: { type: String, required: true },
        image: { type: String, required: true },
        isCustom: { type: Boolean, default: false },
        designMetadata: Schema.Types.Mixed,
        designImageURL: String,
      },
    ],
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentInfo: {
      method: { type: String, default: 'card' },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: String,
    trackingHistory: [{
      status: { type: String, required: true },
      location: String,
      note: String,
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date, default: Date.now },
    }],
    carrier: String,
    estimatedDelivery: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);



orderSchema.pre('save', async function (next) {
  
  if (!this.orderNumber || this.orderNumber === '') {
    try {
      
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
      this.orderNumber = `ORD-${timestamp}-${randomStr}`;
      
      
      let attempts = 0;
      while (attempts < 5) {
        const existing = await mongoose.model('Order').findOne({ orderNumber: this.orderNumber });
        if (!existing) {
          break; 
        }
        
        const newTimestamp = Date.now();
        const newRandomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
        this.orderNumber = `ORD-${newTimestamp}-${newRandomStr}`;
        attempts++;
      }
      
      console.log('📝 Generated order number:', this.orderNumber);
    } catch (error) {
      console.error('❌ Error generating order number:', error);
      
      this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    }
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
