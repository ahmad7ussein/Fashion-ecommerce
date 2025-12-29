import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  readAt?: Date;
  repliedAt?: Date;
  repliedBy?: mongoose.Types.ObjectId;
  replyMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    readAt: {
      type: Date,
    },
    repliedAt: {
      type: Date,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    replyMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });

const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);

export default ContactMessage;

