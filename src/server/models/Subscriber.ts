import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  name?: string;
  subscribedAt: Date;
  isActive: boolean;
  source: 'footer' | 'popup' | 'checkout' | 'other';
  unsubscribedAt?: Date;
  unsubscribeToken: string;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['footer', 'popup', 'checkout', 'other'],
      default: 'footer',
    },
    unsubscribedAt: {
      type: Date,
    },
    unsubscribeToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ isActive: 1 });
SubscriberSchema.index({ unsubscribeToken: 1 });

export default mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
