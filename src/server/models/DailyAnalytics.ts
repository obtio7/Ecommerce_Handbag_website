import mongoose, { Schema, Document } from 'mongoose';

export interface IPerProductRevenue {
  productId: mongoose.Types.ObjectId;
  amount: number;
}

export interface IDailyAnalytics extends Document {
  date: Date;
  ordersPlaced: number;
  ordersShipped: number;
  totalTransactions: number;
  totalRevenue: number;
  perProductRevenue: IPerProductRevenue[];
}

const PerProductRevenueSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const DailyAnalyticsSchema = new Schema({
  date: { type: Date, required: true, unique: true },
  ordersPlaced: { type: Number, default: 0, min: 0 },
  ordersShipped: { type: Number, default: 0, min: 0 },
  totalTransactions: { type: Number, default: 0, min: 0 },
  totalRevenue: { type: Number, default: 0, min: 0 },
  perProductRevenue: [PerProductRevenueSchema],
});

DailyAnalyticsSchema.index({ date: -1 });

export default mongoose.model<IDailyAnalytics>('DailyAnalytics', DailyAnalyticsSchema);
