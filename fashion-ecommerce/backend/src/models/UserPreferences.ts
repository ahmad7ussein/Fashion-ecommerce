import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences extends Document {
  user: mongoose.Types.ObjectId;
  dashboardPreferences?: {
    activeTab?: string;
    chartSettings?: {
      revenueChartType?: 'line' | 'bar' | 'area';
      ordersChartType?: 'pie' | 'bar' | 'line';
      dateRange?: string;
      selectedMetrics?: string[];
    };
    tableSettings?: {
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  };
  sidebarPreferences?: {
    collapsed?: boolean;
    width?: number;
  };
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'ar';
  notifications?: {
    email?: boolean;
    push?: boolean;
    orderUpdates?: boolean;
    productUpdates?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dashboardPreferences: {
      activeTab: {
        type: String,
        default: 'overview',
      },
      
      chartSettings: {
        type: Schema.Types.Mixed,
        default: () => ({
          revenueChartType: 'bar',
          ordersChartType: 'pie',
          dateRange: '30d',
          selectedMetrics: [],
        }),
      },
      
      tableSettings: {
        type: Schema.Types.Mixed,
        default: () => ({
          pageSize: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      },
    },
    sidebarPreferences: {
      collapsed: {
        type: Boolean,
        default: false,
      },
      width: {
        type: Number,
        default: 256,
      },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      productUpdates: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserPreferences>('UserPreferences', userPreferencesSchema);

