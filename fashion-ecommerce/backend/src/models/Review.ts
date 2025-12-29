import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * MongoDB Indexes for Review Queries
 * 
 * Query Patterns:
 * 1. Get approved reviews: { status: 'approved' } + sort { createdAt: -1 }
 * 2. Get user reviews: { user: userId }
 * 3. Get product reviews: { product: productId, status: 'approved' }
 */

// Primary index for approved reviews listing
reviewSchema.index({ status: 1, createdAt: -1 });
// Why: Most common query - get approved reviews sorted by date
// Usage: GET /api/reviews (public endpoint)
// ESR: Equality(status) + Sort(createdAt)

// User reviews index
reviewSchema.index({ user: 1, createdAt: -1 });
// Why: Get all reviews by a specific user, sorted by date
// Usage: GET /api/reviews (user's own reviews)
// ESR: Equality(user) + Sort(createdAt)

// Product reviews index (if product field exists in future)
// reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
// Why: Get approved reviews for a specific product
// Usage: GET /api/products/:id/reviews

export default mongoose.model<IReview>('Review', reviewSchema);

