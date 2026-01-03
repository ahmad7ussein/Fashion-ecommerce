import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'order_status' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment' | 'general';
  title: string;
  message: string;
  order?: mongoose.Types.ObjectId;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order_status', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ order: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;

