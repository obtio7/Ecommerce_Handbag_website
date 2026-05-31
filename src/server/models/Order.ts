import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId; // which color variant was purchased
  name: string;
  color: string; // color name for display
  originalPrice: number; // price before discount
  price: number; // actual price paid per unit (after discount)
  quantity: number;
  imageUrl: string;
  sku: string;
}

export interface IStatusHistory {
  status: string;
  changedAt: Date;
  note?: string; // optional admin note (e.g., "Shipped via BlueDart AWB#123")
}

export interface IShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface IOrder extends Document {
  orderNumber: string; // human-readable order number like "ZRV-20260527-001"
  userId: string; // Authenticated user ID or guest session identifier
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  items: IOrderItem[];
  subtotal: number; // sum of (price × quantity) for all items
  discountAmount: number; // total discount applied
  shippingCost: number; // ₹0 or ₹79
  totalAmount: number; // subtotal - discountAmount + shippingCost
  couponCode?: string; // if a coupon was applied
  status: string;
  shippingAddress: IShippingAddress;
  paymentId?: string; // Razorpay payment ID
  razorpayOrderId?: string;
  statusHistory: IStatusHistory[];
  trackingNumber?: string; // Shipping tracking number (AWB)
  trackingUrl?: string; // URL to track the shipment
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  originalPrice: { type: Number, required: true, min: 0.01 },
  price: { type: Number, required: true, min: 0.01 },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: '' }, // Made optional - some products may not have images
  sku: { type: String, required: true },
}, { _id: false });

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, maxlength: 500 },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0.01 },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'payment-failed', 'return-requested', 'returned'],
      default: 'placed',
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      zipCode: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    statusHistory: [StatusHistorySchema],
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export const VALID_TRANSITIONS: Record<string, string[]> = {
  'placed': ['confirmed', 'cancelled', 'payment-failed'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered'],
  'delivered': ['return-requested'],
  'return-requested': ['returned', 'delivered'], // admin can reject return
  'returned': [],
  'cancelled': [],
  'payment-failed': ['cancelled'], // can only be cancelled
};

// Generate a human-readable order number
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZRV-${dateStr}-${random}`;
}

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
