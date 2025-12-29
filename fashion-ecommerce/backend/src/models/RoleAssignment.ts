import mongoose, { Document, Schema } from 'mongoose';

export type RoleAssignmentType = 'service_provider' | 'partner';
export type RoleAssignmentStatus = 'active' | 'disabled';

export interface IRoleAssignment extends Document {
  user: mongoose.Types.ObjectId;
  role: RoleAssignmentType;
  status: RoleAssignmentStatus;
  partnerStore?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const roleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['service_provider', 'partner'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    partnerStore: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerStore',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

roleAssignmentSchema.index({ user: 1, role: 1 }, { unique: true });

export default mongoose.model<IRoleAssignment>('RoleAssignment', roleAssignmentSchema);
