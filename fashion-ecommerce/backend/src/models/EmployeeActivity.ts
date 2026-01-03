import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeActivity extends Document {
  employee: mongoose.Types.ObjectId;
  action: string; 
  description: string;
  targetType?: string; 
  targetId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>; 
  createdAt: Date;
}

const employeeActivitySchema = new Schema<IEmployeeActivity>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);


employeeActivitySchema.index({ employee: 1, createdAt: -1 });
employeeActivitySchema.index({ action: 1, createdAt: -1 });

export default mongoose.model<IEmployeeActivity>('EmployeeActivity', employeeActivitySchema);

