import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  // Associations
  orderId: mongoose.Types.ObjectId;
  userId: string; // Authenticated user ID or guest session identifier
  customerEmail: string;

  // Razorpay details
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Amount
  amount: number; // total amount charged
  currency: string;

  // Status
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  method?: string; // "upi", "card", "netbanking", "wallet"
  bank?: string; // bank name if netbanking
  cardLast4?: string; // last 4 digits if card payment
  vpa?: string; // UPI ID if UPI payment

  // Refund tracking
  refundId?: string; // Razorpay refund ID
  refundAmount?: number; // amount refunded (can be partial)
  refundedAt?: Date;
  refundReason?: string;

  // Admin notes
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    // Associations
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true },

    // Razorpay details
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Amount
    amount: { type: Number, required: true, min: 0.01, max: 9999999.99 },
    currency: { type: String, required: true, default: 'INR', maxlength: 3 },

    // Status
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    method: { type: String, maxlength: 50 },
    bank: { type: String, maxlength: 100 },
    cardLast4: { type: String, maxlength: 4 },
    vpa: { type: String, maxlength: 100 },

    // Refund tracking
    refundId: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String, maxlength: 500 },

    // Admin notes
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
