import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string; // unique, uppercase, e.g., "WELCOME10"
  type: 'percentage' | 'fixed'; // percentage off or fixed amount off
  value: number; // 10 for 10% or 100 for ₹100 off
  minOrderAmount: number; // minimum cart value to apply
  maxDiscount?: number; // cap for percentage discounts
  usageLimit: number; // how many times total it can be used
  usedCount: number; // how many times it's been used
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });

const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
