import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: Date;
  category: {
    name: string;
    _id: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      name: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
    },
  },
  {
    timestamps: true,
    collection: 'transactions',
  }
);

// Index for finding transactions by user and date range
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
