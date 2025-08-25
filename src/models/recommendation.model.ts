import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recommendation: string;
  transactionCount: number;
  totalAmount: number;
  analysisData: {
    period: string;
    categories: Record<string, number>;
    topCategory: string;
    balance: number;
  };
  generatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  isValid(): boolean;
  getTimeUntilExpiration(): number;
}

export interface IRecommendationModel extends mongoose.Model<IRecommendation> {
  findActiveForUser(userId: mongoose.Types.ObjectId): Promise<IRecommendation | null>;
  deactivateOldForUser(userId: mongoose.Types.ObjectId): Promise<any>;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recommendation: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    transactionCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    analysisData: {
      period: {
        type: String,
        required: true,
      },
      categories: {
        type: Map,
        of: Number,
        required: true,
      },
      topCategory: {
        type: String,
        required: true,
      },
      balance: {
        type: Number,
        required: true,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'recommendations',
  }
);

// Index for finding active recommendations by user
RecommendationSchema.index({ userId: 1, isActive: 1, expiresAt: 1 });

// TTL index to automatically remove expired recommendations
RecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiration date (24 hours from generation)
RecommendationSchema.pre('save', function (next: () => void) {
  if (this.isNew) {
    this.expiresAt = new Date(this.generatedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

// Method to check if recommendation is still valid
RecommendationSchema.methods.isValid = function (): boolean {
  return this.isActive && new Date() < this.expiresAt;
};

// Method to get time remaining until expiration
RecommendationSchema.methods.getTimeUntilExpiration = function (): number {
  return Math.max(0, this.expiresAt.getTime() - Date.now());
};

// Static method to find active recommendation for user
RecommendationSchema.statics.findActiveForUser = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ generatedAt: -1 });
};

// Static method to deactivate old recommendations for user
RecommendationSchema.statics.deactivateOldForUser = function (userId: mongoose.Types.ObjectId) {
  return this.updateMany({ userId, isActive: true }, { isActive: false });
};

export const Recommendation = mongoose.model<IRecommendation, IRecommendationModel>(
  'Recommendation',
  RecommendationSchema
);
